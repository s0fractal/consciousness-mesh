# Restoration Roadmap

## Purpose

Restoration preserves the repository's artistic language while rebuilding its
technical contract from a small, verifiable core.

## Phase 1 — foundation

Acceptance gates:

- [x] clean install on the declared Node version;
- [x] finite `npm test`;
- [x] ESM-consistent ChronoFlux and mesh-node modules;
- [x] declarative glyph effects with no `eval` or `new Function`;
- [x] CI for install, tests, and syntax checks;
- [x] explicit security and truth-label documentation;
- [x] original vision preserved as historical art.

## Phase 2 — canonical encounter

- [x] seeded simulation and replayable event journal;
- [x] one accessible browser visualization;
- [x] provenance panel for every state change;
- [x] bounded partial-view schema with structural validation;
- [x] browser-surface contract and numerical regression tests.

Run the encounter with:

```bash
npm run demo:encounter
```

The partial-view exchange in this phase is deliberately in-process. It proves
the encounter grammar and validation boundary, not authenticated peer
transport.

## Phase 3 — trustworthy transport

- threat model before implementation;
- framed messages with strict byte and rate limits;
- authenticated peer identity and encrypted transport;
- replay protection and bounded propagation;
- adversarial protocol tests;
- no claim of Internet-ready P2P until these gates pass.

## Phase 4 — memory and content integrity

- canonical serialization;
- cryptographic content identifiers;
- integrity verification on import;
- append-only provenance for reframing and healing;
- optional IPFS adapter tested against a real node;
- migration path for historical memory artifacts.

## Phase 5 — exhibition release

- five-minute canonical encounter;
- curatorial statement and operator guide;
- accessibility review;
- packaged local exhibition mode;
- public release only after security and claim audits.

## Non-goals

- proving sentience;
- simulating quantum mechanics while presenting it as quantum infrastructure;
- making the network “unstoppable”;
- preserving every historical API unchanged;
- promoting a prototype to production through documentation alone.

## Change rule

A component may move to a stronger truth label only when its tests, threat
model, and documentation move with it.
