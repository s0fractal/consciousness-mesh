import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import ConsciousnessGlyphs from '../consciousness-glyphs.js';
import ChronoFluxIEL from '../chronoflux-iel.js';

const canonicalGlyphsPath = fileURLToPath(
  new URL('../intent-index.yaml', import.meta.url)
);

test('canonical glyph effects are declarative and observable', () => {
  const mesh = new ChronoFluxIEL(3);
  mesh.q = [1, 1, 1];
  mesh.heart = [0.2, 0.3, 0.4];
  const glyphs = new ConsciousnessGlyphs({
    mesh,
    glyphsPath: canonicalGlyphsPath
  });

  const activation = glyphs.activateGlyph('❤️');

  assert.deepEqual(mesh.q, [0.9, 0.9, 0.9]);
  assert.ok(mesh.heart.every((value, index) => (
    Math.abs(value - [0.3, 0.4, 0.5][index]) < 1e-12
  )));
  assert.ok(activation.appliedEffects.includes('increase:connection'));
  assert.ok(activation.appliedEffects.includes('decrease:turbulence'));
});

test('legacy activation strings are ignored rather than executed', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'consciousness-glyphs-'));
  const glyphsPath = join(directory, 'glyphs.yaml');
  t.after(() => rm(directory, { recursive: true, force: true }));

  await writeFile(glyphsPath, `
glyphs:
  "☠️":
    name: "Untrusted"
    intent: "Attempt execution"
    effects:
      increases: ["intent_density"]
    activation: "globalThis.__glyphCodeExecuted = true"
`);

  globalThis.__glyphCodeExecuted = false;
  const mesh = new ChronoFluxIEL(3);
  const glyphs = new ConsciousnessGlyphs({ mesh, glyphsPath });
  let ignoredEvent = null;
  glyphs.once('glyph-activation-ignored', event => {
    ignoredEvent = event;
  });

  glyphs.activateGlyph('☠️');

  assert.equal(globalThis.__glyphCodeExecuted, false);
  assert.equal(ignoredEvent?.glyph, '☠️');
  delete globalThis.__glyphCodeExecuted;
});

test('compound glyphs form from grapheme-aware component matching', () => {
  const glyphs = new ConsciousnessGlyphs({
    mesh: new ChronoFluxIEL(3),
    glyphsPath: canonicalGlyphsPath
  });

  glyphs.activateGlyph('❤️');
  glyphs.activateGlyph('🌀');

  assert.equal(glyphs.activeGlyphs.has('❤️🌀'), true);
  assert.equal(glyphs.metrics.compoundsFormed, 1);
});
