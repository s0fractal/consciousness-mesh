import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

test('the Sites worker serves the exact encounter build', async () => {
  const build = spawnSync(process.execPath, ['scripts/build-encounter.js'], {
    encoding: 'utf8'
  });
  assert.equal(build.status, 0, build.stderr);

  const { default: worker } = await import(
    `../dist/server/index.js?test=${Date.now()}`
  );
  const page = await worker.fetch(new Request('https://mesh.example/'));
  const html = await page.text();
  const image = await worker.fetch(
    new Request('https://mesh.example/encounter/og.jpg')
  );
  const protocol = await worker.fetch(
    new Request('https://mesh.example/docs/SECURE-SESSION-PROTOCOL.md')
  );
  const protocolHistory = await worker.fetch(
    new Request('https://mesh.example/docs/SECURE-SESSION-V1.md')
  );
  const exhibitionScore = await worker.fetch(
    new Request('https://mesh.example/encounter/exhibition-score.js')
  );
  const curatorialStatement = await worker.fetch(
    new Request('https://mesh.example/docs/CURATORIAL-STATEMENT.md')
  );

  assert.equal(page.status, 200);
  assert.match(html, /content="https:\/\/mesh\.example\/encounter\/og\.jpg"/);
  assert.equal(image.status, 200);
  assert.equal(image.headers.get('content-type'), 'image/jpeg');
  assert.ok((await image.arrayBuffer()).byteLength > 100_000);
  assert.match(await protocol.text(), /version 2 reference protocol/);
  assert.match(await protocolHistory.text(), /retired/);
  assert.match(await exhibitionScore.text(), /EXHIBITION_DURATION_MS = 300_000/);
  assert.match(await curatorialStatement.text(), /inspectable metaphor/);
  assert.equal(
    (
      await worker.fetch(new Request('https://mesh.example/', {
        method: 'POST'
      }))
    ).status,
    405
  );
  assert.equal(
    (await worker.fetch(new Request('https://mesh.example/missing'))).status,
    404
  );
});
