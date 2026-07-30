import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const supportedFiles = [
  'chronoflux-iel.js',
  'iel-mesh-node.js',
  'consciousness-glyphs.js',
  'test-iel-mesh.js',
  'test/chronoflux.test.js',
  'test/mesh-node.test.js',
  'test/glyphs.test.js'
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
