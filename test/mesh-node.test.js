import assert from 'node:assert/strict';
import test from 'node:test';
import IELMeshNode from '../iel-mesh-node.js';

test('thought validation enforces version, shape, finiteness, and size', () => {
  const node = new IELMeshNode('validator', 3, { maxThoughtSize: 5000 });
  const thought = node.iel.exportThought();

  assert.equal(node.validateThought(thought), true);
  assert.equal(node.validateThought({ ...thought, type: 'thought/v2' }), false);
  assert.equal(node.validateThought({
    ...thought,
    fields: { ...thought.fields, q: [1, 2] }
  }), false);
  assert.equal(node.validateThought({
    ...thought,
    metrics: { ...thought.metrics, H: Number.NaN }
  }), false);
  assert.equal(node.validateThought({
    ...thought,
    metrics: { ...thought.metrics, L: 2 }
  }), false);
  assert.equal(node.validateThought({ ...thought, ts: 'yesterday' }), false);
  assert.equal(node.validateThought({
    ...thought,
    padding: 'x'.repeat(6000)
  }), false);
});

test('local content IDs are stable SHA-256 identifiers', () => {
  const node = new IELMeshNode('hasher', 3);
  const thought = node.iel.exportThought();
  const first = node.generateCID(thought);
  const second = node.generateCID(structuredClone(thought));
  const changed = node.generateCID({
    ...structuredClone(thought),
    ts: thought.ts + 1
  });

  assert.match(first, /^sha256:[a-f0-9]{64}$/);
  assert.equal(first, second);
  assert.notEqual(first, changed);
});

test('merging preserves legitimate zero values from peers', async () => {
  const node = new IELMeshNode('receiver', 3);
  node.iel.q = [1, 1, 1];
  node.iel.heart = [1, 1, 1];
  node.iel.theta = [1, 1, 1];

  const thought = node.iel.exportThought();
  thought.fields.q = [0, 0, 0];
  thought.fields.heart = [0, 0, 0];
  thought.fields.theta = [0, 0, 0];

  await node.mergeThought(thought);

  assert.deepEqual(node.iel.q, [0.7, 0.7, 0.7]);
  assert.deepEqual(node.iel.heart, [0.7, 0.7, 0.7]);
  assert.ok(node.iel.theta.every(value => value < 1));
});

test('node lifecycle is idempotent and releases its timers', async () => {
  const node = new IELMeshNode('lifecycle', 3, {
    simulationIntervalMs: 5,
    syncIntervalMs: 5,
    thoughtIntervalMs: 5
  });

  await node.start();
  await node.start();
  await new Promise(resolve => setTimeout(resolve, 20));
  await node.stop();

  assert.equal(node.started, false);
  assert.equal(node.simulationInterval, null);
  assert.equal(node.syncInterval, null);
  assert.equal(node.thoughtInterval, null);
  assert.equal(node.pendingTransmissions.size, 0);
});
