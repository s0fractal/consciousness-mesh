import { CanonicalEncounter, GESTURES } from '../canonical-encounter.js';
import { MemoryLedger } from '../memory-ledger.js';

const [
  seed = 'reciprocity-01',
  gesture = 'care',
  createdAt = new Date().toISOString()
] = process.argv.slice(2);

if (seed.length < 1 || seed.length > 48) {
  throw new RangeError('seed must contain 1-48 characters');
}
if (!GESTURES[gesture]) {
  throw new RangeError(`Unknown gesture: ${gesture}`);
}

const encounter = new CanonicalEncounter({ seed, gesture });
encounter.runAll();

const ledger = MemoryLedger.fromEncounter(encounter.exportJournal(), {
  actor: `encounter:${seed}`,
  authority: 'local deterministic simulation export'
}, {
  createdAt
});

process.stdout.write(`${ledger.serialize()}\n`);
