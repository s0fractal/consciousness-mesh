import assert from 'node:assert/strict';
import test from 'node:test';
import ChronoFluxIEL from '../chronoflux-iel.js';

test('coherence is one when all phases align', () => {
  const mesh = new ChronoFluxIEL(4);
  mesh.theta = [Math.PI / 3, Math.PI / 3, Math.PI / 3, Math.PI / 3];

  const metrics = mesh.computeMetrics();

  assert.ok(Math.abs(metrics.H - 1) < 1e-12);
  assert.ok(Number.isFinite(metrics.tau));
  assert.ok(metrics.L >= 0 && metrics.L <= 1);
  assert.ok(metrics.K >= 0 && metrics.K <= 1);
});

test('simulation produces finite observable metrics', () => {
  const mesh = new ChronoFluxIEL(5);

  mesh.simulate(25, 5);
  const metrics = mesh.computeMetrics();

  for (const value of Object.values(metrics)) {
    assert.ok(Number.isFinite(value));
  }
  assert.equal(mesh.history.length, 5);
});

test('exported thoughts do not share mutable field arrays', () => {
  const mesh = new ChronoFluxIEL(3);
  const thought = mesh.exportThought();
  const original = mesh.q[0];

  thought.fields.q[0] = 999;

  assert.equal(mesh.q[0], original);
});

test('invalid mesh sizes are rejected at the boundary', () => {
  assert.throws(() => new ChronoFluxIEL(0), /nodeCount/);
  assert.throws(() => new ChronoFluxIEL(2.5), /nodeCount/);
  assert.throws(
    () => new ChronoFluxIEL(3, {}, { random: 0.5 }),
    /random must be a function/
  );
});

test('disposing a simulation clears pending event resets', () => {
  const mesh = new ChronoFluxIEL(3);
  const sigma = mesh.params.sigma;
  mesh.applyEvent('LION_GATE');

  assert.equal(mesh.eventTimers.size, 1);
  mesh.dispose();
  assert.equal(mesh.eventTimers.size, 0);
  assert.equal(mesh.params.sigma, sigma);
});

test('control events reject unknown types and invalid node indices', () => {
  const mesh = new ChronoFluxIEL(3);

  assert.throws(() => mesh.applyEvent('UNKNOWN'), /Unknown event type/);
  assert.throws(
    () => mesh.applyEvent('INTENT_PULSE', { nodeId: 3 }),
    /node index out of range/
  );
  assert.throws(
    () => mesh.applyEvent('KOHANIST_RESONANCE', { node1: -1, node2: 1 }),
    /node index out of range/
  );
});
