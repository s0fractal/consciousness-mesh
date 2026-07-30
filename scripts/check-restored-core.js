import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const supportedFiles = [
  'chronoflux-iel.js',
  'iel-mesh-node.js',
  'declarative-gestures.js',
  'canonical-encounter.js',
  'memory-ledger.js',
  'secure-session.js',
  'consciousness-glyphs.js',
  'encounter/app.js',
  'scripts/build-encounter.js',
  'scripts/crystallize-encounter.js',
  'scripts/secure-session-demo.js',
  'scripts/serve-encounter.js',
  'test-iel-mesh.js',
  'test/chronoflux.test.js',
  'test/encounter.test.js',
  'test/encounter-ui.test.js',
  'test/gestures.test.js',
  'test/mesh-node.test.js',
  'test/memory-ledger.test.js',
  'test/secure-session.test.js',
  'test/glyphs.test.js',
  'test/sites-worker.test.js'
];

const forbiddenPatterns = [
  { name: 'eval', pattern: /\beval\s*\(/ },
  { name: 'Function constructor', pattern: /\bnew\s+Function\s*\(/ }
];

let failed = false;

for (const file of supportedFiles) {
  const syntax = spawnSync(process.execPath, ['--check', file], {
    encoding: 'utf8'
  });
  if (syntax.status !== 0) {
    failed = true;
    console.error(`Syntax check failed: ${file}`);
    console.error(syntax.stderr.trim());
  }

  const source = readFileSync(file, 'utf8');
  for (const forbidden of forbiddenPatterns) {
    if (forbidden.pattern.test(source)) {
      failed = true;
      console.error(`Forbidden ${forbidden.name} in restored core: ${file}`);
    }
  }
}

if (failed) {
  process.exitCode = 1;
} else {
  console.log(`Restored core check passed (${supportedFiles.length} files).`);
}
