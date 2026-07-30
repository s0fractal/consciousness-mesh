import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { CanonicalEncounter } from '../canonical-encounter.js';
import {
  MemoryLedger,
  canonicalStringify,
  contentId,
  migrateLegacyCrystal
} from '../memory-ledger.js';

const rootAttribution = {
  actor: 'encounter:reciprocity-01',
  authority: 'local observation'
};
const rootTime = '2026-07-30T12:00:00.000Z';

test('canonical serialization is key-order independent and rejects ambiguity', () => {
  assert.equal(
    canonicalStringify({ z: 1, a: { y: true, x: 'care' } }),
    canonicalStringify({ a: { x: 'care', y: true }, z: 1 })
  );
  assert.equal(contentId({ b: 2, a: 1 }), contentId({ a: 1, b: 2 }));
  assert.throws(() => canonicalStringify({ value: Number.NaN }), /finite/);

  const sparse = [];
  sparse.length = 1;
  assert.throws(() => canonicalStringify(sparse), /holes/);

  const cyclic = {};
  cyclic.self = cyclic;
  assert.throws(() => canonicalStringify(cyclic), /cycles/);

  const accessor = {};
  Object.defineProperty(accessor, 'value', {
    enumerable: true,
    get() {
      throw new Error('must not execute');
    }
  });
  assert.throws(
    () => canonicalStringify(accessor),
    /enumerable data properties/
  );
});

test('interpretation appends without rewriting the observed memory', () => {
  const ledger = new MemoryLedger({
    event: 'two partial views met',
    meanings: ['risk', 'opportunity']
  }, rootAttribution, { createdAt: rootTime });
  const rootBefore = ledger.export().entries[0];

  ledger.appendInterpretation({
    lens: 'safety',
    text: 'Exchange increased the attack surface.'
  }, {
    actor: 'observer:safety',
    authority: 'attributed interpretation'
  }, {
    createdAt: '2026-07-30T12:01:00.000Z'
  });
  ledger.appendInterpretation({
    lens: 'art',
    text: 'Exchange made reciprocity visible.'
  }, {
    actor: 'observer:art',
    authority: 'attributed interpretation'
  }, {
    createdAt: '2026-07-30T12:02:00.000Z'
  });

  const exported = ledger.export();
  assert.deepEqual(exported.entries[0], rootBefore);
  assert.equal(
    exported.entries[0].record.subject,
    contentId(exported.entries[0].record.content)
  );
  assert.equal(exported.entries[1].record.parent, rootBefore.id);
  assert.equal(exported.entries[2].record.parent, exported.entries[1].id);
  assert.equal(exported.entries[2].record.root, rootBefore.id);
  assert.ok(exported.entries.every(entry => (
    entry.id === contentId(entry.record)
  )));
  assert.deepEqual(ledger.verify().errors, []);

  exported.entries[0].record.content.event = 'rewritten';
  assert.equal(
    ledger.export().entries[0].record.content.event,
    'two partial views met'
  );
});

test('serialized ledgers import exactly and continue the chain', () => {
  const original = new MemoryLedger(
    { event: 'arrival' },
    rootAttribution,
    { createdAt: rootTime }
  );
  original.appendInterpretation({
    lens: 'witness',
    text: 'Difference was observed before it was named.'
  }, {
    actor: 'observer:witness',
    authority: 'attributed interpretation'
  }, {
    createdAt: '2026-07-30T12:01:00.000Z'
  });

  const imported = MemoryLedger.import(original.serialize());
  assert.equal(imported.serialize(), original.serialize());

  imported.appendInterpretation({
    lens: 'later',
    text: 'The earlier interpretation remains present.'
  }, {
    actor: 'observer:later',
    authority: 'attributed interpretation'
  }, {
    createdAt: '2026-07-30T12:02:00.000Z'
  });
  assert.equal(imported.entryCount, 3);
  assert.equal(imported.verify().valid, true);
});

test('tampering and broken continuity are detected on import', () => {
  const ledger = new MemoryLedger(
    { event: 'gesture' },
    rootAttribution,
    { createdAt: rootTime }
  );
  ledger.appendInterpretation({
    lens: 'care',
    text: 'The gesture reduced turbulence.'
  }, {
    actor: 'observer:care',
    authority: 'attributed interpretation'
  }, {
    createdAt: '2026-07-30T12:01:00.000Z'
  });

  const tampered = JSON.parse(ledger.serialize());
  tampered.entries[0].record.content.event = 'substituted';
  const tamperResult = MemoryLedger.verifySerialized(JSON.stringify(tampered));
  assert.equal(tamperResult.valid, false);
  assert.ok(tamperResult.errors.some(error => /content ID mismatch/.test(error)));

  const broken = JSON.parse(ledger.serialize());
  broken.entries[1].record.parent = 'sha256:not-the-root';
  broken.entries[1].id = contentId(broken.entries[1].record);
  const continuityResult = MemoryLedger.verifySerialized(JSON.stringify(broken));
  assert.equal(continuityResult.valid, false);
  assert.ok(continuityResult.errors.some(error => /does not continue/.test(error)));
});

test('trusted anchors distinguish integrity from self-consistency', () => {
  const ledger = new MemoryLedger(
    { event: 'anchored observation' },
    rootAttribution,
    { createdAt: rootTime }
  );
  const expectedRoot = ledger.rootId;
  const expectedSubject = ledger.subjectId;
  const substituted = JSON.parse(ledger.serialize());
  const root = substituted.entries[0].record;

  root.content.event = 'attacker substitution';
  root.subject = contentId(root.content);
  substituted.entries[0].id = contentId(root);
  substituted.root = substituted.entries[0].id;
  substituted.head = substituted.entries[0].id;

  const rewritten = canonicalStringify(substituted);
  assert.equal(MemoryLedger.verifySerialized(rewritten).valid, true);

  const anchored = MemoryLedger.verifySerialized(rewritten, {
    expectedRoot,
    expectedSubject
  });
  assert.equal(anchored.valid, false);
  assert.ok(anchored.errors.some(error => /trusted anchor/.test(error)));
  assert.throws(
    () => MemoryLedger.import(rewritten, { expectedRoot }),
    /trusted anchor/
  );
});

test('ledger limits bound entry count and imported bytes', () => {
  const ledger = new MemoryLedger(
    { event: 'bounded' },
    rootAttribution,
    {
      createdAt: rootTime,
      limits: { maxEntries: 2 }
    }
  );
  ledger.appendInterpretation({
    lens: 'first',
    text: 'One bounded interpretation.'
  }, {
    actor: 'observer:first',
    authority: 'attributed interpretation'
  }, {
    createdAt: '2026-07-30T12:01:00.000Z'
  });
  assert.throws(
    () => ledger.appendInterpretation({
      lens: 'second',
      text: 'This exceeds the configured entry limit.'
    }, {
      actor: 'observer:second',
      authority: 'attributed interpretation'
    }),
    /entry limit/
  );

  const oversized = JSON.stringify({ padding: 'x'.repeat(500) });
  const result = MemoryLedger.verifySerialized(oversized, { maxBytes: 100 });
  assert.equal(result.valid, false);
  assert.match(result.errors[0], /exceeds 100 bytes/);
});

test('legacy crystals migrate as preserved, explicitly unverified evidence', () => {
  const legacy = {
    id: 'crystal-1755276526656',
    core: { emotion: 'wonder', intensity: 0.9 },
    facets: [{ interpretation: 'historical voice' }]
  };
  const ledger = migrateLegacyCrystal(legacy, {
    createdAt: rootTime,
    actor: 'restoration:migration'
  });
  const observation = ledger.export().entries[0].record.content;

  assert.equal(observation.legacyId, legacy.id);
  assert.deepEqual(observation.original, legacy);
  assert.match(observation.warning, /without an integrity claim/);
  assert.equal(ledger.verify().valid, true);
});

test('the same observation keeps its subject ID across later crystallization', () => {
  const observation = { event: 'same observed content' };
  const first = new MemoryLedger(observation, rootAttribution, {
    createdAt: rootTime
  });
  const second = new MemoryLedger(observation, {
    actor: 'another observer',
    authority: 'another local observation'
  }, {
    createdAt: '2026-07-31T12:00:00.000Z'
  });

  assert.equal(first.subjectId, second.subjectId);
  assert.notEqual(first.rootId, second.rootId);
});

test('a canonical encounter can crystallize without gaining new claims', () => {
  const encounter = new CanonicalEncounter({
    seed: 'memory-crystal',
    gesture: 'care'
  });
  encounter.runAll();
  const ledger = MemoryLedger.fromEncounter(
    encounter.exportJournal(),
    rootAttribution,
    { createdAt: rootTime }
  );
  const content = ledger.export().entries[0].record.content;

  assert.equal(content.source, 'canonical-encounter');
  assert.equal(content.truthLabel, 'artwork + deterministic simulation');
  assert.equal(content.journal.disclaimer, (
    'No claim of sentience, identity, or network authentication.'
  ));
  assert.equal(ledger.verify().valid, true);
  assert.throws(
    () => MemoryLedger.fromEncounter(
      { truthLabel: 'artwork + deterministic simulation' },
      rootAttribution,
      { createdAt: rootTime }
    ),
    /does not match encounter\/v1/
  );
});

test('the encounter crystallization command emits an importable ledger', () => {
  const result = spawnSync(process.execPath, [
    'scripts/crystallize-encounter.js',
    'cli-crystal',
    'kindle',
    rootTime
  ], { encoding: 'utf8' });

  assert.equal(result.status, 0, result.stderr);
  const ledger = MemoryLedger.import(result.stdout.trim());
  const content = ledger.export().entries[0].record.content;
  assert.equal(content.journal.seed, 'cli-crystal');
  assert.equal(content.journal.gesture.id, 'kindle');
  assert.equal(ledger.verify().valid, true);
});
