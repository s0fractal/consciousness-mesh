import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('canonical encounter exposes its truth label and external assets', async () => {
  const html = await readFile('canonical-encounter.html', 'utf8');

  assert.match(html, /Artwork \+ deterministic simulation/);
  assert.match(html, /Not a proof of consciousness/);
  assert.match(html, /\.\/docs\/CURATORIAL-STATEMENT\.md/);
  assert.match(html, /\.\/docs\/EXHIBITION-GUIDE\.md/);
  assert.match(html, /\.\/docs\/ACCESSIBILITY-AUDIT\.md/);
  assert.match(html, /\.\/docs\/MEMORY-PROTOCOL\.md/);
  assert.match(html, /\.\/docs\/SECURE-SESSION-PROTOCOL\.md/);
  assert.match(html, /\.\/docs\/TRANSPORT-THREAT-MODEL\.md/);
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

test('the packaged server exposes the seeded exhibition entrypoint', async () => {
  const [server, packageSource] = await Promise.all([
    readFile('scripts/serve-encounter.js', 'utf8'),
    readFile('package.json', 'utf8')
  ]);
  const packageMetadata = JSON.parse(packageSource);

  assert.match(
    packageMetadata.scripts['demo:exhibition'],
    /serve-encounter\.js --exhibition/
  );
  assert.match(server, /mode=exhibition&seed=reciprocity-01&gesture=care/);
  assert.match(server, /\['\.jpg', 'image\/jpeg'\]/);
});
