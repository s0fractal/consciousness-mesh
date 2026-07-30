import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('canonical encounter exposes its truth label and external assets', async () => {
  const html = await readFile('canonical-encounter.html', 'utf8');

  assert.match(html, /Artwork \+ deterministic simulation/);
  assert.match(html, /Not a proof of consciousness/);
  assert.match(html, /<script type="module" src="\.\/encounter\/app\.js"><\/script>/);
  assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>/);
  assert.doesNotMatch(html, /<style\b/);
});

test('the browser surface avoids string-to-markup rendering', async () => {
  const source = await readFile('encounter/app.js', 'utf8');

  assert.doesNotMatch(source, /\.innerHTML\b/);
  assert.doesNotMatch(source, /insertAdjacentHTML/);
  assert.doesNotMatch(source, /document\.write/);
});
