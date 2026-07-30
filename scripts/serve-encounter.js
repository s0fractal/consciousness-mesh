import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const root = normalize(join(repositoryRoot, 'dist', 'encounter'));
const port = Number.parseInt(process.env.ENCOUNTER_PORT || '4173', 10);
const exhibitionMode = process.argv.includes('--exhibition');

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new RangeError('ENCOUNTER_PORT must be an integer from 1 to 65535');
}

const contentTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.jpg', 'image/jpeg'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.md', 'text/markdown; charset=utf-8'],
  ['.png', 'image/png']
]);

const server = createServer(async (request, response) => {
  if (!['GET', 'HEAD'].includes(request.method || 'GET')) {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end('Method not allowed');
    return;
  }

  try {
    const requestUrl = new URL(request.url || '/', 'http://localhost');
    const requestedPath = requestUrl.pathname === '/'
      ? 'index.html'
      : decodeURIComponent(requestUrl.pathname).replace(/^\/+/, '');
    const filePath = normalize(join(root, requestedPath));
    const insideRoot = relative(root, filePath);

    if (insideRoot.startsWith('..') || insideRoot === '') {
      throw new Error('Path is outside the encounter build');
    }

    const metadata = await stat(filePath);
    if (!metadata.isFile()) throw new Error('Not a file');

    response.writeHead(200, {
      'Content-Type': contentTypes.get(extname(filePath))
        || 'application/octet-stream',
      'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'",
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff'
    });
    if (request.method === 'HEAD') {
      response.end();
      return;
    }
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404, {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff'
    });
    response.end('Not found');
  }
});

server.listen(port, '127.0.0.1', () => {
  const path = exhibitionMode
    ? '/?mode=exhibition&seed=reciprocity-01&gesture=care'
    : '/';
  console.log(`Canonical encounter: http://127.0.0.1:${port}${path}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
