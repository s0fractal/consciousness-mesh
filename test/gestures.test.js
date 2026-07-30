import assert from 'node:assert/strict';
import test from 'node:test';
import ChronoFluxIEL from '../chronoflux-iel.js';
import {
  applyDeclarativeEffects,
  normalizeEffects
} from '../declarative-gestures.js';
import { createSeededRandom } from '../canonical-encounter.js';

test('historical and restored effect shapes normalize identically', () => {
  assert.deepEqual(
    normalizeEffects([
      { increases: ['connection'] },
      { decreases: ['turbulence'] }
    ]),
    normalizeEffects({
      increases: ['connection'],
      decreases: ['turbulence']
    })
  );
});

test('declarative effects ignore unknown authority', () => {
  const mesh = new ChronoFluxIEL(3);
  const before = [...mesh.q];

  const applied = applyDeclarativeEffects(mesh, {
    executes: ['process.exit'],
    increases: ['not-a-real-effect']
  });

  assert.deepEqual(applied, []);
  assert.deepEqual(mesh.q, before);
});

test('creative effects are reproducible with a seeded source', () => {
  const first = new ChronoFluxIEL(3, {}, {
    random: createSeededRandom('gesture-seed')
  });
  const second = new ChronoFluxIEL(3, {}, {
    random: createSeededRandom('gesture-seed')
  });

  applyDeclarativeEffects(first, { increases: ['creativity'] });
  applyDeclarativeEffects(second, { increases: ['creativity'] });

  assert.deepEqual(first.phi, second.phi);
});
