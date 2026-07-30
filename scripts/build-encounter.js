import {
  copyFile,
  mkdir,
  readFile,
  rm,
  writeFile
} from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const outputRoot = join(repositoryRoot, 'dist', 'encounter');
const workerRoot = join(repositoryRoot, 'dist', 'server');

const assets = [
  ['canonical-encounter.html', 'index.html'],
  ['canonical-encounter.js', 'canonical-encounter.js'],
  ['chronoflux-iel.js', 'chronoflux-iel.js'],
  ['declarative-gestures.js', 'declarative-gestures.js'],
  ['encounter/app.js', 'encounter/app.js'],
  ['encounter/exhibition-score.js', 'encounter/exhibition-score.js'],
  ['encounter/og.jpg', 'encounter/og.jpg'],
  ['encounter/styles.css', 'encounter/styles.css'],
  ['docs/ACCESSIBILITY-AUDIT.md', 'docs/ACCESSIBILITY-AUDIT.md'],
  ['docs/ART-SPEC.md', 'docs/ART-SPEC.md'],
  ['docs/CURATORIAL-STATEMENT.md', 'docs/CURATORIAL-STATEMENT.md'],
  ['docs/EXHIBITION-GUIDE.md', 'docs/EXHIBITION-GUIDE.md'],
  ['docs/MEMORY-PROTOCOL.md', 'docs/MEMORY-PROTOCOL.md'],
  [
    'docs/SECURE-SESSION-PROTOCOL.md',
    'docs/SECURE-SESSION-PROTOCOL.md'
  ],
  ['docs/SECURE-SESSION-V1.md', 'docs/SECURE-SESSION-V1.md'],
  [
    'docs/TRANSPORT-THREAT-MODEL.md',
    'docs/TRANSPORT-THREAT-MODEL.md'
  ],
  [
    'docs/encounter-partial-view.schema.json',
    'docs/encounter-partial-view.schema.json'
  ]
];

await rm(outputRoot, { recursive: true, force: true });
await rm(workerRoot, { recursive: true, force: true });

for (const [source, destination] of assets) {
  const output = join(outputRoot, destination);
  await mkdir(dirname(output), { recursive: true });
  await copyFile(join(repositoryRoot, source), output);
}

const packageMetadata = JSON.parse(
  await readFile(join(repositoryRoot, 'package.json'), 'utf8')
);
const manifest = {
  artwork: 'Consciousness Mesh — Canonical Encounter',
  version: packageMetadata.version,
  entrypoint: 'index.html',
  sourceFiles: assets.map(([, destination]) => destination)
};

await writeFile(
  join(outputRoot, 'build.json'),
  `${JSON.stringify(manifest, null, 2)}\n`
);

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8'
};
const workerAssets = [];

for (const [, destination] of assets) {
  const output = join(outputRoot, destination);
  const extension = destination.slice(destination.lastIndexOf('.'));
  const route = destination === 'index.html' ? '/' : `/${destination}`;
  const body = await readFile(output);
  workerAssets.push([
    route,
    {
      body: body.toString('base64'),
      contentType: contentTypes[extension] || 'application/octet-stream',
      html: destination === 'index.html'
    }
  ]);
}

workerAssets.push([
  '/canonical-encounter.html',
  workerAssets.find(([route]) => route === '/')[1]
]);

const workerSource = `const encodedAssets = new Map(${JSON.stringify(workerAssets)});

function decodeBase64(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

const worker = {
  async fetch(request) {
    if (!['GET', 'HEAD'].includes(request.method)) {
      return new Response('Method not allowed', {
        status: 405,
        headers: { Allow: 'GET, HEAD' }
      });
    }

    const url = new URL(request.url);
    const asset = encodedAssets.get(url.pathname);
    if (!asset) {
      return new Response('Not found', {
        status: 404,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }

    let body = decodeBase64(asset.body);
    if (asset.html) {
      const html = new TextDecoder().decode(body).replace(
        'content="./encounter/og.jpg"',
        \`content="\${url.origin}/encounter/og.jpg"\`
      );
      body = new TextEncoder().encode(html);
    }

    const headers = {
      'Content-Type': asset.contentType,
      'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'",
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff'
    };

    return new Response(request.method === 'HEAD' ? null : body, { headers });
  }
};

export default worker;
`;

await mkdir(workerRoot, { recursive: true });
await writeFile(join(workerRoot, 'index.js'), workerSource);

console.log(`Canonical encounter built at ${outputRoot}`);
