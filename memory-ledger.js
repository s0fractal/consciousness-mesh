import { createHash } from 'node:crypto';

export const MEMORY_ENTRY_VERSION = 'memory-entry/v1';
export const MEMORY_LEDGER_VERSION = 'memory-ledger/v1';
export const MEMORY_LIMITS = Object.freeze({
  maxBytes: 1_048_576,
  maxEntries: 256,
  maxDepth: 64,
  maxNodes: 100_000
});

function isPlainObject(value) {
  if (value === null || typeof value !== 'object') return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function serializeCanonical(value, state, depth) {
  if (depth > state.maxDepth) {
    throw new RangeError('Canonical value exceeds maximum depth');
  }
  state.nodes += 1;
  if (state.nodes > state.maxNodes) {
    throw new RangeError('Canonical value exceeds maximum node count');
  }

  if (value === null) return 'null';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new TypeError('Canonical numbers must be finite');
    }
    return Object.is(value, -0) ? '0' : JSON.stringify(value);
  }

  if (typeof value !== 'object') {
    throw new TypeError(`Unsupported canonical value: ${typeof value}`);
  }
  if (state.seen.has(value)) {
    throw new TypeError('Canonical values cannot contain cycles');
  }

  state.seen.add(value);
  let serialized;

  if (Array.isArray(value)) {
    const ownKeys = Reflect.ownKeys(value);
    const allowedKeys = new Set([
      'length',
      ...Array.from({ length: value.length }, (_, index) => String(index))
    ]);
    if (ownKeys.some(key => !allowedKeys.has(key))) {
      throw new TypeError('Canonical arrays cannot contain extra properties');
    }
    const items = [];
    for (let index = 0; index < value.length; index++) {
      if (!Object.hasOwn(value, index)) {
        throw new TypeError('Canonical arrays cannot contain holes');
      }
      items.push(serializeCanonical(value[index], state, depth + 1));
    }
    serialized = `[${items.join(',')}]`;
  } else {
    if (!isPlainObject(value)) {
      throw new TypeError('Canonical objects must have a plain prototype');
    }
    if (Object.getOwnPropertySymbols(value).length > 0) {
      throw new TypeError('Canonical objects cannot contain symbol keys');
    }
    const descriptors = Object.getOwnPropertyDescriptors(value);
    if (Object.values(descriptors).some(descriptor => (
      !descriptor.enumerable || !Object.hasOwn(descriptor, 'value')
    ))) {
      throw new TypeError(
        'Canonical objects require enumerable data properties'
      );
    }
    const entries = Object.keys(descriptors)
      .sort()
      .map(key => (
        `${JSON.stringify(key)}:${serializeCanonical(
          descriptors[key].value,
          state,
          depth + 1
        )}`
      ));
    serialized = `{${entries.join(',')}}`;
  }

  state.seen.delete(value);
  return serialized;
}

export function canonicalStringify(value, limits = {}) {
  return serializeCanonical(value, {
    maxDepth: limits.maxDepth ?? MEMORY_LIMITS.maxDepth,
    maxNodes: limits.maxNodes ?? MEMORY_LIMITS.maxNodes,
    nodes: 0,
    seen: new Set()
  }, 0);
}

export function contentId(value, limits = {}) {
  const digest = createHash('sha256')
    .update(canonicalStringify(value, limits), 'utf8')
    .digest('hex');
  return `sha256:${digest}`;
}

function normalizeLimits(overrides = {}) {
  if (!isPlainObject(overrides)) {
    throw new TypeError('Memory limits must be a plain object');
  }
  const allowed = Object.keys(MEMORY_LIMITS);
  const unexpected = Object.keys(overrides)
    .filter(name => !allowed.includes(name));
  if (unexpected.length > 0) {
    throw new RangeError(`Unexpected memory limits: ${unexpected.join(', ')}`);
  }
  const limits = { ...MEMORY_LIMITS, ...overrides };
  for (const [name, value] of Object.entries(limits)) {
    if (!Number.isSafeInteger(value) || value < 1) {
      throw new RangeError(`${name} must be a positive safe integer`);
    }
  }
  return limits;
}

function extractLimitOverrides(options) {
  if (options.limits !== undefined) return options.limits;
  return Object.fromEntries(
    Object.keys(MEMORY_LIMITS)
      .filter(name => options[name] !== undefined)
      .map(name => [name, options[name]])
  );
}

function cloneCanonical(value, limits = {}) {
  return JSON.parse(canonicalStringify(value, limits));
}

function freezeDeep(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) {
    return value;
  }
  for (const child of Object.values(value)) freezeDeep(child);
  return Object.freeze(value);
}

function normalizeText(value, name, maxLength = 4096) {
  if (typeof value !== 'string') {
    throw new TypeError(`${name} must be a string`);
  }
  const normalized = value.trim();
  if (normalized.length < 1 || normalized.length > maxLength) {
    throw new RangeError(`${name} must contain 1-${maxLength} characters`);
  }
  return normalized;
}

function normalizeAttribution(attribution = {}) {
  if (!isPlainObject(attribution)) {
    throw new TypeError('attribution must be a plain object');
  }
  return {
    actor: normalizeText(attribution.actor, 'attribution.actor', 128),
    authority: normalizeText(
      attribution.authority,
      'attribution.authority',
      256
    )
  };
}

function normalizeTimestamp(value) {
  const timestamp = value ?? new Date().toISOString();
  if (
    typeof timestamp !== 'string'
    || Number.isNaN(Date.parse(timestamp))
    || new Date(timestamp).toISOString() !== timestamp
  ) {
    throw new TypeError('createdAt must be a canonical ISO-8601 timestamp');
  }
  return timestamp;
}

function exactKeys(value, keys) {
  return (
    isPlainObject(value)
    && Object.keys(value).sort().join(',') === [...keys].sort().join(',')
  );
}

function validateAttribution(value, errors, path) {
  if (!exactKeys(value, ['actor', 'authority'])) {
    errors.push(`${path} has unexpected attribution fields`);
    return;
  }
  try {
    normalizeAttribution(value);
  } catch (error) {
    errors.push(`${path} ${error.message}`);
  }
}

function inspectLedgerPayload(payload, limits) {
  const errors = [];

  if (!exactKeys(payload, ['entries', 'head', 'root', 'version'])) {
    errors.push('ledger has unexpected fields');
    return errors;
  }
  if (payload.version !== MEMORY_LEDGER_VERSION) {
    errors.push('unsupported ledger version');
  }
  if (!Array.isArray(payload.entries)) {
    errors.push('entries must be an array');
    return errors;
  }
  if (
    payload.entries.length < 1
    || payload.entries.length > limits.maxEntries
  ) {
    errors.push(`entry count must be 1-${limits.maxEntries}`);
    return errors;
  }

  let previousId = null;
  let rootId = null;

  payload.entries.forEach((wrapper, index) => {
    const path = `entries[${index}]`;
    if (!exactKeys(wrapper, ['id', 'record'])) {
      errors.push(`${path} has unexpected fields`);
      return;
    }
    if (typeof wrapper.id !== 'string') {
      errors.push(`${path}.id must be a string`);
      return;
    }

    const record = wrapper.record;
    const expectedKeys = index === 0
      ? [
          'attribution',
          'content',
          'createdAt',
          'kind',
          'parent',
          'sequence',
          'subject',
          'version'
        ]
      : [
          'attribution',
          'createdAt',
          'interpretation',
          'kind',
          'parent',
          'root',
          'sequence',
          'version'
        ];
    if (!exactKeys(record, expectedKeys)) {
      errors.push(`${path}.record has unexpected fields`);
      return;
    }

    try {
      if (contentId(record, limits) !== wrapper.id) {
        errors.push(`${path} content ID mismatch`);
      }
    } catch (error) {
      errors.push(`${path} cannot be canonicalized: ${error.message}`);
      return;
    }

    if (record.version !== MEMORY_ENTRY_VERSION) {
      errors.push(`${path} has unsupported entry version`);
    }
    if (record.sequence !== index) {
      errors.push(`${path} has discontinuous sequence`);
    }
    try {
      normalizeTimestamp(record.createdAt);
    } catch (error) {
      errors.push(`${path} ${error.message}`);
    }
    validateAttribution(record.attribution, errors, path);

    if (index === 0) {
      rootId = wrapper.id;
      if (record.kind !== 'observation' || record.parent !== null) {
        errors.push('first entry must be a root observation');
      }
      try {
        if (record.subject !== contentId(record.content, limits)) {
          errors.push('root subject does not match observed content');
        }
      } catch (error) {
        errors.push(`root content cannot be canonicalized: ${error.message}`);
      }
    } else {
      if (record.kind !== 'interpretation') {
        errors.push(`${path} must be an interpretation`);
      }
      if (record.parent !== previousId) {
        errors.push(`${path} does not continue the previous entry`);
      }
      if (record.root !== rootId) {
        errors.push(`${path} points to a different root`);
      }
      if (
        !exactKeys(record.interpretation, ['lens', 'text'])
      ) {
        errors.push(`${path} has unexpected interpretation fields`);
      } else {
        try {
          normalizeText(record.interpretation.lens, 'lens', 128);
          normalizeText(record.interpretation.text, 'text');
        } catch (error) {
          errors.push(`${path} ${error.message}`);
        }
      }
    }

    previousId = wrapper.id;
  });

  if (payload.root !== rootId) errors.push('ledger root does not match');
  if (payload.head !== previousId) errors.push('ledger head does not match');
  return errors;
}

export class MemoryLedger {
  #entries;
  #headId;
  #limits;
  #rootId;

  constructor(observation, attribution, options = {}) {
    this.#limits = normalizeLimits(options.limits);
    const content = cloneCanonical(observation, this.#limits);
    const record = freezeDeep({
      version: MEMORY_ENTRY_VERSION,
      sequence: 0,
      kind: 'observation',
      parent: null,
      subject: contentId(content, this.#limits),
      createdAt: normalizeTimestamp(options.createdAt),
      attribution: normalizeAttribution(attribution),
      content
    });
    const entry = freezeDeep({
      id: contentId(record, this.#limits),
      record
    });
    const rootProjection = {
      version: MEMORY_LEDGER_VERSION,
      root: entry.id,
      head: entry.id,
      entries: [entry]
    };
    if (
      Buffer.byteLength(canonicalStringify(rootProjection, this.#limits))
      > this.#limits.maxBytes
    ) {
      throw new RangeError('Memory ledger reached its byte limit');
    }

    this.#entries = [entry];
    this.#rootId = entry.id;
    this.#headId = entry.id;
  }

  appendInterpretation(interpretation, attribution, options = {}) {
    if (this.#entries.length >= this.#limits.maxEntries) {
      throw new RangeError('Memory ledger reached its entry limit');
    }

    const record = freezeDeep({
      version: MEMORY_ENTRY_VERSION,
      sequence: this.#entries.length,
      kind: 'interpretation',
      parent: this.#headId,
      root: this.#rootId,
      createdAt: normalizeTimestamp(options.createdAt),
      attribution: normalizeAttribution(attribution),
      interpretation: {
        lens: normalizeText(interpretation?.lens, 'lens', 128),
        text: normalizeText(interpretation?.text, 'text')
      }
    });
    const entry = freezeDeep({
      id: contentId(record, this.#limits),
      record
    });
    const projected = {
      version: MEMORY_LEDGER_VERSION,
      root: this.#rootId,
      head: entry.id,
      entries: [...this.#entries, entry]
    };
    if (
      Buffer.byteLength(canonicalStringify(projected, this.#limits))
      > this.#limits.maxBytes
    ) {
      throw new RangeError('Memory ledger reached its byte limit');
    }

    this.#entries.push(entry);
    this.#headId = entry.id;
    return cloneCanonical(entry, this.#limits);
  }

  get entryCount() {
    return this.#entries.length;
  }

  get headId() {
    return this.#headId;
  }

  get rootId() {
    return this.#rootId;
  }

  get subjectId() {
    return this.#entries[0].record.subject;
  }

  export() {
    return cloneCanonical({
      version: MEMORY_LEDGER_VERSION,
      root: this.#rootId,
      head: this.#headId,
      entries: this.#entries
    }, this.#limits);
  }

  serialize() {
    return canonicalStringify(this.export(), this.#limits);
  }

  verify() {
    return MemoryLedger.verifySerialized(this.serialize(), this.#limits);
  }

  static verifySerialized(serialized, options = {}) {
    let limits;
    try {
      limits = normalizeLimits(extractLimitOverrides(options));
    } catch (error) {
      return { valid: false, errors: [error.message] };
    }
    if (typeof serialized !== 'string') {
      return { valid: false, errors: ['ledger import must be serialized JSON'] };
    }
    const bytes = Buffer.byteLength(serialized);
    if (bytes > limits.maxBytes) {
      return {
        valid: false,
        bytes,
        errors: [`ledger exceeds ${limits.maxBytes} bytes`]
      };
    }

    let payload;
    try {
      payload = JSON.parse(serialized);
    } catch {
      return { valid: false, bytes, errors: ['ledger is not valid JSON'] };
    }

    const errors = inspectLedgerPayload(payload, limits);
    for (const [field, expected] of [
      ['root', options.expectedRoot],
      ['head', options.expectedHead]
    ]) {
      if (expected !== undefined && payload?.[field] !== expected) {
        errors.push(`ledger ${field} does not match trusted anchor`);
      }
    }
    const subject = payload?.entries?.[0]?.record?.subject;
    if (
      options.expectedSubject !== undefined
      && subject !== options.expectedSubject
    ) {
      errors.push('ledger subject does not match trusted anchor');
    }
    return { valid: errors.length === 0, bytes, errors };
  }

  static import(serialized, options = {}) {
    const verification = MemoryLedger.verifySerialized(serialized, options);
    if (!verification.valid) {
      throw new Error(`Invalid memory ledger: ${verification.errors.join('; ')}`);
    }

    const payload = JSON.parse(serialized);
    const [root, ...interpretations] = payload.entries;
    const ledger = new MemoryLedger(
      root.record.content,
      root.record.attribution,
      {
        createdAt: root.record.createdAt,
        limits: options.limits
      }
    );
    for (const entry of interpretations) {
      ledger.appendInterpretation(
        entry.record.interpretation,
        entry.record.attribution,
        { createdAt: entry.record.createdAt }
      );
    }
    return ledger;
  }

  static fromEncounter(encounterJournal, attribution, options = {}) {
    if (
      !isPlainObject(encounterJournal)
      || encounterJournal.version !== 'encounter/v1'
      || encounterJournal.truthLabel !== 'artwork + deterministic simulation'
      || !Array.isArray(encounterJournal.movements)
      || encounterJournal.movements.length !== 5
    ) {
      throw new TypeError('Encounter journal does not match encounter/v1');
    }
    return new MemoryLedger({
      source: 'canonical-encounter',
      truthLabel: 'artwork + deterministic simulation',
      journal: encounterJournal
    }, attribution, options);
  }
}

export function migrateLegacyCrystal(legacyCrystal, options = {}) {
  if (!isPlainObject(legacyCrystal)) {
    throw new TypeError('legacyCrystal must be a plain object');
  }

  return new MemoryLedger({
    source: 'legacy-memory-crystal',
    legacyId: typeof legacyCrystal.id === 'string' ? legacyCrystal.id : null,
    warning: 'Historical artifact imported without an integrity claim.',
    original: legacyCrystal
  }, {
    actor: options.actor || 'migration',
    authority: options.authority || 'legacy import; source integrity unverified'
  }, {
    createdAt: options.createdAt,
    limits: options.limits
  });
}

export default MemoryLedger;
