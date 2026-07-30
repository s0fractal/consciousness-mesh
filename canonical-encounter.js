import ChronoFluxIEL from './chronoflux-iel.js';
import { applyDeclarativeEffects } from './declarative-gestures.js';

export const ENCOUNTER_VERSION = 'encounter/v1';
export const PARTIAL_VIEW_VERSION = 'thought/encounter-v1';
export const PARTIAL_VIEW_MAX_BYTES = 1024;

export const MOVEMENTS = [
  {
    id: 'arrival',
    number: 'I',
    title: 'Arrival',
    line: 'Difference enters before relation.'
  },
  {
    id: 'witness',
    number: 'II',
    title: 'Witness',
    line: 'The network observes without pretending to understand.'
  },
  {
    id: 'gesture',
    number: 'III',
    title: 'Gesture',
    line: 'A bounded act changes what connection can do.'
  },
  {
    id: 'exchange',
    number: 'IV',
    title: 'Exchange',
    line: 'Two partial views meet with provenance intact.'
  },
  {
    id: 'reflection',
    number: 'V',
    title: 'Reflection',
    line: 'The final pattern remembers how it was changed.'
  }
];

export const GESTURES = {
  care: {
    id: 'care',
    glyph: '❤️',
    name: 'Care',
    intent: 'Connection with lower turbulence',
    effects: {
      increases: ['coherence', 'connection'],
      decreases: ['turbulence']
    }
  },
  reorient: {
    id: 'reorient',
    glyph: '🌀',
    name: 'Reorient',
    intent: 'Rotate phase and admit controlled variation',
    effects: {
      increases: ['phase_rotation', 'creativity']
    }
  },
  kindle: {
    id: 'kindle',
    glyph: '🔥',
    name: 'Kindle',
    intent: 'Amplify intent without amplifying noise',
    effects: {
      increases: ['intent_density'],
      decreases: ['turbulence']
    }
  }
};

function seedToUint32(seed) {
  let hash = 2166136261;
  for (const character of String(seed)) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createSeededRandom(seed) {
  let state = seedToUint32(seed) || 0x6d2b79f5;

  return function random() {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

function round(value, precision = 6) {
  const scale = 10 ** precision;
  return Math.round(value * scale) / scale;
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clone(value) {
  return structuredClone(value);
}

export class CanonicalEncounter {
  constructor(options = {}) {
    this.seed = String(options.seed ?? 'reciprocity-01');
    this.nodeCount = options.nodeCount ?? 7;
    if (this.nodeCount !== 7) {
      throw new RangeError('The canonical encounter requires exactly seven nodes');
    }
    this.gestureId = 'care';
    this.setGesture(options.gesture ?? 'care', true);
    this.reset();
  }

  reset(options = {}) {
    if (options.seed !== undefined) this.seed = String(options.seed);
    if (options.gesture !== undefined) this.setGesture(options.gesture, true);

    this.random = createSeededRandom(this.seed);
    this.mesh = new ChronoFluxIEL(
      this.nodeCount,
      { K: 0.24, dt: 0.012 },
      { random: this.random }
    );
    this.journal = [];
    this.movementIndex = 0;
    this.logicalTime = 0;
    this.initialState = this.snapshot();
    this.completed = false;
    return this.getState();
  }

  setGesture(gestureId, duringReset = false) {
    if (!GESTURES[gestureId]) {
      throw new RangeError(`Unknown gesture: ${gestureId}`);
    }
    if (!duringReset && this.movementIndex > 2) {
      throw new Error('Gesture cannot change after movement III');
    }
    this.gestureId = gestureId;
  }

  advance() {
    if (this.completed) return null;

    const movement = MOVEMENTS[this.movementIndex];
    const before = this.snapshot();
    let provenance = {
      actor: 'encounter',
      authority: 'local simulation',
      input: null
    };

    switch (movement.id) {
      case 'arrival':
        provenance = {
          ...provenance,
          actor: 'seed',
          input: { seed: this.seed, nodes: this.nodeCount }
        };
        break;

      case 'witness':
        this.simulate(36);
        provenance = {
          ...provenance,
          actor: 'mesh',
          input: { steps: 36, mutation: 'model dynamics only' }
        };
        break;

      case 'gesture': {
        const gesture = GESTURES[this.gestureId];
        const appliedEffects = applyDeclarativeEffects(
          this.mesh,
          gesture.effects,
          { random: this.random }
        );
        this.simulate(18);
        provenance = {
          ...provenance,
          actor: `gesture:${gesture.id}`,
          input: {
            glyph: gesture.glyph,
            name: gesture.name,
            intent: gesture.intent,
            appliedEffects
          }
        };
        break;
      }

      case 'exchange':
        provenance = this.exchangePartialViews();
        this.simulate(24);
        break;

      case 'reflection':
        this.simulate(54);
        provenance = {
          ...provenance,
          actor: 'reflection',
          input: {
            steps: 54,
            comparison: this.compareSnapshots(
              this.initialState,
              this.snapshot()
            )
          }
        };
        break;
    }

    const after = this.snapshot();
    const entry = {
      sequence: this.journal.length + 1,
      logicalTime: this.logicalTime,
      movement: clone(movement),
      provenance,
      before: clone(before),
      after: clone(after),
      delta: this.compareSnapshots(before, after)
    };

    this.journal.push(entry);
    this.movementIndex += 1;
    this.completed = this.movementIndex >= MOVEMENTS.length;
    return clone(entry);
  }

  runAll() {
    const entries = [];
    while (!this.completed) {
      entries.push(this.advance());
    }
    return entries;
  }

  simulate(steps) {
    this.mesh.simulate(steps, Math.max(1, steps));
    this.logicalTime += steps;
  }

  exchangePartialViews() {
    const dawnIndices = [];
    const duskIndices = [];

    for (let index = 0; index < this.mesh.N; index++) {
      (index % 2 === 0 ? dawnIndices : duskIndices).push(index);
    }

    const dawn = this.createPartialView('dawn', dawnIndices);
    const dusk = this.createPartialView('dusk', duskIndices);
    const dawnValidation = this.validatePartialView(dawn);
    const duskValidation = this.validatePartialView(dusk);

    if (!dawnValidation.valid || !duskValidation.valid) {
      throw new Error('Canonical exchange produced an invalid partial view');
    }

    this.mergePartialView(dawnIndices, dusk.fields, 0.16);
    this.mergePartialView(duskIndices, dawn.fields, 0.16);

    return {
      actor: 'paired partial views',
      authority: 'in-process exchange; no network identity claim',
      input: {
        packets: [
          {
            source: dawn.source,
            target: dusk.source,
            bytes: dawnValidation.bytes,
            validation: 'passed'
          },
          {
            source: dusk.source,
            target: dawn.source,
            bytes: duskValidation.bytes,
            validation: 'passed'
          }
        ],
        mergeStrength: 0.16
      }
    };
  }

  createPartialView(source, indices) {
    const select = field => indices.map(index => this.mesh[field][index]);
    return {
      version: PARTIAL_VIEW_VERSION,
      source,
      logicalTime: this.logicalTime,
      sampleCount: indices.length,
      fields: {
        q: average(select('q')),
        heart: average(select('heart')),
        theta: average(select('theta'))
      }
    };
  }

  validatePartialView(packet) {
    let serialized;
    try {
      serialized = JSON.stringify(packet);
    } catch {
      return { valid: false, bytes: 0, errors: ['not serializable'] };
    }

    const bytes = new TextEncoder().encode(serialized).byteLength;
    const errors = [];
    const packetKeys = Object.keys(packet || {}).sort();
    const fieldKeys = Object.keys(packet?.fields || {}).sort();

    if (bytes > PARTIAL_VIEW_MAX_BYTES) errors.push('packet too large');
    if (packet?.version !== PARTIAL_VIEW_VERSION) errors.push('invalid version');
    if (
      typeof packet?.source !== 'string'
      || packet.source.length < 1
      || packet.source.length > 48
    ) {
      errors.push('invalid source');
    }
    if (!Number.isInteger(packet?.logicalTime) || packet.logicalTime < 0) {
      errors.push('invalid logicalTime');
    }
    if (
      !Number.isInteger(packet?.sampleCount)
      || packet.sampleCount < 1
      || packet.sampleCount > this.nodeCount
    ) {
      errors.push('invalid sampleCount');
    }
    if (
      packetKeys.join(',') !== 'fields,logicalTime,sampleCount,source,version'
    ) {
      errors.push('unexpected packet fields');
    }
    if (fieldKeys.join(',') !== 'heart,q,theta') {
      errors.push('unexpected state fields');
    }
    if (
      !['q', 'heart', 'theta']
        .every(field => Number.isFinite(packet?.fields?.[field]))
    ) {
      errors.push('non-finite state');
    }
    if (
      Number.isFinite(packet?.fields?.heart)
      && (packet.fields.heart < 0 || packet.fields.heart > 1)
    ) {
      errors.push('heart outside bounds');
    }

    return {
      valid: errors.length === 0,
      bytes,
      errors
    };
  }

  mergePartialView(indices, fields, strength) {
    for (const index of indices) {
      this.mesh.q[index] = (
        this.mesh.q[index] * (1 - strength) + fields.q * strength
      );
      this.mesh.heart[index] = Math.min(1, Math.max(0, (
        this.mesh.heart[index] * (1 - strength) + fields.heart * strength
      )));
      const phaseDifference = Math.sin(fields.theta - this.mesh.theta[index]);
      this.mesh.theta[index] += phaseDifference * strength;
    }
  }

  snapshot() {
    const metrics = this.mesh.computeMetrics();
    return {
      logicalTime: this.logicalTime || 0,
      metrics: Object.fromEntries(
        Object.entries(metrics).map(([key, value]) => [key, round(value)])
      ),
      fields: {
        q: this.mesh.q.map(value => round(value)),
        heart: this.mesh.heart.map(value => round(value)),
        theta: this.mesh.theta.map(value => round(value)),
        coherence: this.mesh.a.map(value => round(value))
      },
      edges: this.mesh.edges.map(edge => [...edge])
    };
  }

  compareSnapshots(before, after) {
    return {
      H: round(after.metrics.H - before.metrics.H),
      tau: round(after.metrics.tau - before.metrics.tau),
      L: round(after.metrics.L - before.metrics.L),
      K: round(after.metrics.K - before.metrics.K)
    };
  }

  getState() {
    return {
      version: ENCOUNTER_VERSION,
      seed: this.seed,
      gesture: clone(GESTURES[this.gestureId]),
      movementIndex: this.movementIndex,
      nextMovement: MOVEMENTS[this.movementIndex] || null,
      completed: this.completed,
      snapshot: this.snapshot(),
      journal: clone(this.journal)
    };
  }

  exportJournal() {
    return {
      version: ENCOUNTER_VERSION,
      truthLabel: 'artwork + deterministic simulation',
      disclaimer: 'No claim of sentience, identity, or network authentication.',
      seed: this.seed,
      gesture: clone(GESTURES[this.gestureId]),
      initial: clone(this.initialState),
      final: this.snapshot(),
      movements: clone(this.journal)
    };
  }
}

export default CanonicalEncounter;
