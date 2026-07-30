export const AFTERIMAGE_ENTRY_VERSION = 'afterimage/v1';
export const AFTERIMAGE_ARCHIVE_VERSION = 'afterimage-archive/v1';
export const AFTERIMAGE_STORAGE_KEY = 'consciousness-mesh.afterimages.v1';
export const AFTERIMAGE_LIMITS = Object.freeze({
  maxEntries: 12,
  maxBytes: 49_152,
  maxReflectionChars: 160,
  maxSeedChars: 48
});

const encoder = new TextEncoder();
const METRIC_NAMES = Object.freeze(['H', 'tau', 'L', 'K']);
const GESTURE_IDS = Object.freeze(['care', 'reorient', 'kindle']);

function isPlainObject(value) {
  if (value === null || typeof value !== 'object') return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function exactKeys(value, expected) {
  return (
    isPlainObject(value)
    && Object.keys(value).sort().join(',') === [...expected].sort().join(',')
  );
}

function canonicalStringify(value, seen = new Set()) {
  if (value === null) return 'null';
  if (typeof value === 'string' || typeof value === 'boolean') {
    return JSON.stringify(value);
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new TypeError('Afterimage numbers must be finite');
    }
    return Object.is(value, -0) ? '0' : JSON.stringify(value);
  }
  if (typeof value !== 'object') {
    throw new TypeError(`Unsupported afterimage value: ${typeof value}`);
  }
  if (seen.has(value)) {
    throw new TypeError('Afterimage values cannot contain cycles');
  }

  seen.add(value);
  let result;
  if (Array.isArray(value)) {
    result = `[${value.map(item => canonicalStringify(item, seen)).join(',')}]`;
  } else {
    if (!isPlainObject(value)) {
      throw new TypeError('Afterimage objects must have a plain prototype');
    }
    result = `{${Object.keys(value).sort().map(key => (
      `${JSON.stringify(key)}:${canonicalStringify(value[key], seen)}`
    )).join(',')}}`;
  }
  seen.delete(value);
  return result;
}

function normalizeText(value, name, maximum) {
  if (typeof value !== 'string') {
    throw new TypeError(`${name} must be a string`);
  }
  const normalized = value.trim();
  if (normalized.length < 1 || normalized.length > maximum) {
    throw new RangeError(`${name} must contain 1-${maximum} characters`);
  }
  return normalized;
}

function normalizeTimestamp(value) {
  if (
    typeof value !== 'string'
    || Number.isNaN(Date.parse(value))
    || new Date(value).toISOString() !== value
  ) {
    throw new TypeError('createdAt must be a canonical ISO-8601 timestamp');
  }
  return value;
}

function normalizeMetrics(value) {
  if (!exactKeys(value, METRIC_NAMES)) {
    throw new TypeError('finalMetrics must contain exactly H, tau, L, and K');
  }
  return Object.fromEntries(METRIC_NAMES.map(name => {
    const metric = value[name];
    if (!Number.isFinite(metric)) {
      throw new TypeError(`finalMetrics.${name} must be finite`);
    }
    return [name, metric];
  }));
}

function normalizeEncounter(value) {
  if (!exactKeys(
    value,
    ['encounterVersion', 'finalMetrics', 'gesture', 'movementCount', 'seed']
  )) {
    throw new TypeError('encounter has unexpected fields');
  }
  if (value.encounterVersion !== 'encounter/v1') {
    throw new RangeError('unsupported encounter version');
  }
  if (!GESTURE_IDS.includes(value.gesture)) {
    throw new RangeError('unsupported encounter gesture');
  }
  if (value.movementCount !== 5) {
    throw new RangeError('an afterimage requires all five movements');
  }
  return {
    encounterVersion: value.encounterVersion,
    seed: normalizeText(
      value.seed,
      'encounter.seed',
      AFTERIMAGE_LIMITS.maxSeedChars
    ),
    gesture: value.gesture,
    movementCount: value.movementCount,
    finalMetrics: normalizeMetrics(value.finalMetrics)
  };
}

function normalizeReflection(value) {
  if (!exactKeys(value, ['authority', 'text'])) {
    throw new TypeError('reflection has unexpected fields');
  }
  if (value.authority !== 'visitor-authored reflection') {
    throw new RangeError('unsupported reflection authority');
  }
  return {
    text: normalizeText(
      value.text,
      'reflection.text',
      AFTERIMAGE_LIMITS.maxReflectionChars
    ),
    authority: value.authority
  };
}

function normalizeStorageBoundary(value) {
  if (!exactKeys(value, ['networked', 'scope'])) {
    throw new TypeError('storageBoundary has unexpected fields');
  }
  if (value.scope !== 'this browser profile' || value.networked !== false) {
    throw new RangeError('unsupported storage boundary');
  }
  return {
    scope: value.scope,
    networked: value.networked
  };
}

function normalizeContent(value) {
  if (!exactKeys(
    value,
    ['createdAt', 'encounter', 'reflection', 'storageBoundary', 'version']
  )) {
    throw new TypeError('afterimage content has unexpected fields');
  }
  if (value.version !== AFTERIMAGE_ENTRY_VERSION) {
    throw new RangeError('unsupported afterimage entry version');
  }
  return {
    version: value.version,
    createdAt: normalizeTimestamp(value.createdAt),
    encounter: normalizeEncounter(value.encounter),
    reflection: normalizeReflection(value.reflection),
    storageBoundary: normalizeStorageBoundary(value.storageBoundary)
  };
}

function bytes(value) {
  return encoder.encode(value).byteLength;
}

async function sha256(value, cryptoProvider) {
  if (!cryptoProvider?.subtle?.digest) {
    throw new Error('Web Crypto SHA-256 is unavailable');
  }
  const digest = await cryptoProvider.subtle.digest(
    'SHA-256',
    encoder.encode(canonicalStringify(value))
  );
  return `sha256:${Array.from(new Uint8Array(digest), byte => (
    byte.toString(16).padStart(2, '0')
  )).join('')}`;
}

export async function createAfterimage(input, options = {}) {
  if (!isPlainObject(input)) {
    throw new TypeError('afterimage input must be a plain object');
  }
  const content = normalizeContent({
    version: AFTERIMAGE_ENTRY_VERSION,
    createdAt: input.createdAt ?? new Date().toISOString(),
    encounter: {
      encounterVersion: input.encounterVersion ?? 'encounter/v1',
      seed: input.seed,
      gesture: input.gesture,
      movementCount: input.movementCount,
      finalMetrics: input.finalMetrics
    },
    reflection: {
      text: input.reflection,
      authority: 'visitor-authored reflection'
    },
    storageBoundary: {
      scope: 'this browser profile',
      networked: false
    }
  });
  return {
    id: await sha256(content, options.crypto ?? globalThis.crypto),
    content
  };
}

export async function verifyAfterimage(entry, options = {}) {
  try {
    if (!exactKeys(entry, ['content', 'id'])) {
      throw new TypeError('afterimage entry has unexpected fields');
    }
    if (!/^sha256:[0-9a-f]{64}$/.test(entry.id)) {
      throw new TypeError('afterimage id must be a SHA-256 identifier');
    }
    const content = normalizeContent(entry.content);
    const expected = await sha256(
      content,
      options.crypto ?? globalThis.crypto
    );
    if (expected !== entry.id) {
      throw new Error('afterimage content ID mismatch');
    }
    return { valid: true, entry: { id: entry.id, content }, error: null };
  } catch (error) {
    return { valid: false, entry: null, error: error.message };
  }
}

function archiveError(message) {
  return { valid: false, entries: [], error: message };
}

export class AfterimageStore {
  constructor(options = {}) {
    if (!options.storage) {
      throw new TypeError('a local storage adapter is required');
    }
    this.storage = options.storage;
    this.crypto = options.crypto ?? globalThis.crypto;
    this.clock = options.clock ?? (() => new Date().toISOString());
    this.key = options.key ?? AFTERIMAGE_STORAGE_KEY;
  }

  async inspect() {
    let serialized;
    try {
      serialized = this.storage.getItem(this.key);
    } catch {
      return archiveError('Local storage is unavailable.');
    }
    if (serialized === null) {
      return { valid: true, entries: [], error: null };
    }
    if (typeof serialized !== 'string') {
      return archiveError('Local archive storage returned a non-string value.');
    }
    if (bytes(serialized) > AFTERIMAGE_LIMITS.maxBytes) {
      return archiveError('Local archive exceeds its byte limit.');
    }

    let archive;
    try {
      archive = JSON.parse(serialized);
    } catch {
      return archiveError('Local archive is not valid JSON.');
    }
    if (!exactKeys(archive, ['entries', 'version'])) {
      return archiveError('Local archive has unexpected fields.');
    }
    if (archive.version !== AFTERIMAGE_ARCHIVE_VERSION) {
      return archiveError('Local archive version is unsupported.');
    }
    if (
      !Array.isArray(archive.entries)
      || archive.entries.length > AFTERIMAGE_LIMITS.maxEntries
    ) {
      return archiveError('Local archive has an invalid entry count.');
    }

    const entries = [];
    for (const entry of archive.entries) {
      const inspection = await verifyAfterimage(entry, {
        crypto: this.crypto
      });
      if (!inspection.valid) {
        return archiveError(
          `Local archive failed integrity verification: ${inspection.error}`
        );
      }
      entries.push(inspection.entry);
    }
    return { valid: true, entries, error: null };
  }

  async remember(input) {
    const archive = await this.inspect();
    if (!archive.valid) {
      throw new Error(archive.error);
    }
    if (archive.entries.length >= AFTERIMAGE_LIMITS.maxEntries) {
      throw new RangeError(
        `Local archive is full at ${AFTERIMAGE_LIMITS.maxEntries} afterimages`
      );
    }

    const entry = await createAfterimage({
      ...input,
      createdAt: input.createdAt ?? this.clock()
    }, { crypto: this.crypto });
    const nextArchive = {
      version: AFTERIMAGE_ARCHIVE_VERSION,
      entries: [...archive.entries, entry]
    };
    const serialized = canonicalStringify(nextArchive);
    if (bytes(serialized) > AFTERIMAGE_LIMITS.maxBytes) {
      throw new RangeError('Local archive would exceed its byte limit');
    }
    this.storage.setItem(this.key, serialized);
    return entry;
  }

  async export() {
    const archive = await this.inspect();
    if (!archive.valid) {
      throw new Error(archive.error);
    }
    return `${canonicalStringify({
      version: AFTERIMAGE_ARCHIVE_VERSION,
      entries: archive.entries
    })}\n`;
  }

  clear() {
    this.storage.removeItem(this.key);
  }
}
