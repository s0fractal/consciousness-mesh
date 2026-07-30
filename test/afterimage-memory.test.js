import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AFTERIMAGE_ARCHIVE_VERSION,
  AFTERIMAGE_LIMITS,
  AFTERIMAGE_STORAGE_KEY,
  AfterimageStore,
  createAfterimage,
  verifyAfterimage
} from '../encounter/afterimage-memory.js';

class MemoryStorage {
  constructor() {
    this.values = new Map();
  }

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }

  setItem(key, value) {
    this.values.set(key, String(value));
  }

  removeItem(key) {
    this.values.delete(key);
  }
}

function afterimageInput(overrides = {}) {
  return {
    seed: 'reciprocity-01',
    gesture: 'care',
    movementCount: 5,
    finalMetrics: {
      H: 0.42,
      tau: 0.18,
      L: 0.61,
      K: 0.33
    },
    reflection: 'Care changed what the connection could do.',
    createdAt: '2026-07-30T18:00:00.000Z',
    ...overrides
  };
}

test('an afterimage has a deterministic SHA-256 content identity', async () => {
  const first = await createAfterimage(afterimageInput());
  const second = await createAfterimage(afterimageInput());
  const changed = await createAfterimage(afterimageInput({
    reflection: 'A different attributed reflection.'
  }));

  assert.equal(first.id, second.id);
  assert.match(first.id, /^sha256:[0-9a-f]{64}$/);
  assert.notEqual(first.id, changed.id);
  assert.equal(first.content.storageBoundary.networked, false);
  assert.equal(
    first.content.reflection.authority,
    'visitor-authored reflection'
  );
});

test('afterimages require a complete, bounded canonical encounter', async () => {
  await assert.rejects(
    createAfterimage(afterimageInput({ movementCount: 4 })),
    /requires all five movements/
  );
  await assert.rejects(
    createAfterimage(afterimageInput({ gesture: 'identity' })),
    /unsupported encounter gesture/
  );
  await assert.rejects(
    createAfterimage(afterimageInput({
      reflection: 'x'.repeat(AFTERIMAGE_LIMITS.maxReflectionChars + 1)
    })),
    /1-160 characters/
  );
  await assert.rejects(
    createAfterimage(afterimageInput({
      finalMetrics: { H: Number.NaN, tau: 0, L: 0, K: 0 }
    })),
    /must be finite/
  );
});

test('integrity verification rejects changed content and extra fields', async () => {
  const entry = await createAfterimage(afterimageInput());
  const changed = structuredClone(entry);
  changed.content.reflection.text = 'The bytes no longer match the identifier.';
  const extended = { ...entry, inferredIdentity: 'visitor-7' };

  assert.equal((await verifyAfterimage(entry)).valid, true);
  assert.match(
    (await verifyAfterimage(changed)).error,
    /content ID mismatch/
  );
  assert.match(
    (await verifyAfterimage(extended)).error,
    /unexpected fields/
  );
});

test('the local store appends verified entries without implicit eviction', async () => {
  const storage = new MemoryStorage();
  let minute = 0;
  const store = new AfterimageStore({
    storage,
    clock: () => `2026-07-30T18:${String(minute++).padStart(2, '0')}:00.000Z`
  });

  for (let index = 0; index < AFTERIMAGE_LIMITS.maxEntries; index++) {
    await store.remember(afterimageInput({
      reflection: `Reflection ${index + 1}.`,
      createdAt: undefined
    }));
  }

  const archive = await store.inspect();
  assert.equal(archive.valid, true);
  assert.equal(archive.entries.length, AFTERIMAGE_LIMITS.maxEntries);
  assert.equal(
    archive.entries[0].content.reflection.text,
    'Reflection 1.'
  );
  await assert.rejects(
    store.remember(afterimageInput({
      reflection: 'This must not evict an earlier entry.'
    })),
    /archive is full/
  );
  assert.equal((await store.inspect()).entries.length, AFTERIMAGE_LIMITS.maxEntries);
});

test('a corrupted archive is neither reused nor silently rewritten', async () => {
  const storage = new MemoryStorage();
  const store = new AfterimageStore({ storage });
  const entry = await createAfterimage(afterimageInput());
  entry.content.encounter.seed = 'tampered-seed';
  const corrupted = JSON.stringify({
    version: AFTERIMAGE_ARCHIVE_VERSION,
    entries: [entry]
  });
  storage.setItem(AFTERIMAGE_STORAGE_KEY, corrupted);

  const inspection = await store.inspect();
  assert.equal(inspection.valid, false);
  assert.match(inspection.error, /failed integrity verification/);
  await assert.rejects(
    store.remember(afterimageInput()),
    /failed integrity verification/
  );
  assert.equal(storage.getItem(AFTERIMAGE_STORAGE_KEY), corrupted);
});

test('an oversized archive is rejected before parsing or hashing', async () => {
  const storage = new MemoryStorage();
  const store = new AfterimageStore({ storage });
  storage.setItem(
    AFTERIMAGE_STORAGE_KEY,
    'x'.repeat(AFTERIMAGE_LIMITS.maxBytes + 1)
  );

  assert.deepEqual(await store.inspect(), {
    valid: false,
    entries: [],
    error: 'Local archive exceeds its byte limit.'
  });
});

test('a verified archive can be exported and explicitly erased', async () => {
  const storage = new MemoryStorage();
  const store = new AfterimageStore({ storage });
  await store.remember(afterimageInput());

  const exported = JSON.parse(await store.export());
  assert.equal(exported.version, AFTERIMAGE_ARCHIVE_VERSION);
  assert.equal(exported.entries.length, 1);

  store.clear();
  assert.deepEqual(await store.inspect(), {
    valid: true,
    entries: [],
    error: null
  });
});

test('storage denial is reported as a boundary, not an empty archive', async () => {
  const store = new AfterimageStore({
    storage: {
      getItem() {
        throw new Error('denied');
      },
      setItem() {
        throw new Error('denied');
      },
      removeItem() {
        throw new Error('denied');
      }
    }
  });

  assert.deepEqual(await store.inspect(), {
    valid: false,
    entries: [],
    error: 'Local storage is unavailable.'
  });
});
