import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CanonicalEncounter,
  MOVEMENTS
} from '../canonical-encounter.js';

test('a canonical encounter completes five provenance movements', () => {
  const encounter = new CanonicalEncounter({
    seed: 'five-movements',
    gesture: 'care'
  });

  const entries = encounter.runAll();
  const exported = encounter.exportJournal();

  assert.equal(entries.length, MOVEMENTS.length);
  assert.equal(exported.movements.length, MOVEMENTS.length);
  assert.deepEqual(
    exported.movements.map(entry => entry.movement.id),
    MOVEMENTS.map(movement => movement.id)
  );
  assert.equal(exported.truthLabel, 'artwork + deterministic simulation');
  assert.equal(encounter.completed, true);
  assert.deepEqual(exported.movements[0].before, exported.initial);
  for (let index = 1; index < exported.movements.length; index++) {
    assert.deepEqual(
      exported.movements[index].before,
      exported.movements[index - 1].after
    );
  }
});

test('the same seed and gesture replay exactly', () => {
  const first = new CanonicalEncounter({
    seed: 'reciprocity-replay',
    gesture: 'reorient'
  });
  const second = new CanonicalEncounter({
    seed: 'reciprocity-replay',
    gesture: 'reorient'
  });

  first.runAll();
  second.runAll();

  assert.deepEqual(first.exportJournal(), second.exportJournal());
});

test('different seeds produce different initial fields', () => {
  const first = new CanonicalEncounter({ seed: 'dawn' });
  const second = new CanonicalEncounter({ seed: 'dusk' });

  assert.notDeepEqual(
    first.getState().snapshot.fields,
    second.getState().snapshot.fields
  );
});

test('the canonical composition fixes the field at seven nodes', () => {
  assert.throws(
    () => new CanonicalEncounter({ nodeCount: 8 }),
    /exactly seven nodes/
  );
  assert.throws(
    () => new CanonicalEncounter({ gesture: 'unknown' }),
    /Unknown gesture/
  );
});

test('exchange validates bounded in-process provenance packets', () => {
  const encounter = new CanonicalEncounter({ seed: 'exchange' });
  encounter.advance();
  encounter.advance();
  encounter.advance();
  const exchange = encounter.advance();

  assert.equal(exchange.movement.id, 'exchange');
  assert.equal(exchange.provenance.input.packets.length, 2);
  assert.ok(exchange.provenance.input.packets.every(packet => (
    packet.validation === 'passed' && packet.bytes > 0
  )));
  assert.match(exchange.provenance.authority, /in-process/);
});

test('gesture choice is fixed once movement III has happened', () => {
  const encounter = new CanonicalEncounter({ seed: 'choice' });
  encounter.advance();
  encounter.advance();
  encounter.advance();

  assert.throws(() => encounter.setGesture('kindle'), /cannot change/);
  assert.throws(() => encounter.setGesture('unknown'), /Unknown gesture/);
});

test('malformed partial views fail validation', () => {
  const encounter = new CanonicalEncounter({ seed: 'invalid-packet' });

  assert.deepEqual(
    encounter.validatePartialView({
      version: 'thought/encounter-v1',
      source: 'dawn',
      sampleCount: 2,
      fields: { q: 0.2, heart: Number.NaN, theta: 0.4 }
    }).valid,
    false
  );
});

test('partial views reject extra authority and oversized sources', () => {
  const encounter = new CanonicalEncounter({ seed: 'strict-packet' });
  const packet = encounter.createPartialView('dawn', [0, 2, 4]);

  assert.equal(encounter.validatePartialView(packet).valid, true);
  assert.equal(encounter.validatePartialView({
    ...packet,
    command: 'override'
  }).valid, false);
  assert.equal(encounter.validatePartialView({
    ...packet,
    source: 'x'.repeat(2000)
  }).valid, false);
});
