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

- [x] threat model before implementation;
- [x] framed messages with strict byte and rate limits;
- [x] authenticated peer identity and encrypted session core;
- [x] signed ephemeral key agreement with forward secrecy after completion;
- [x] replay protection and bounded propagation;
- [x] adversarial protocol tests;
- [x] no claim of Internet-ready P2P.

The phase-3 result is `secure-session.js`, a transport-independent protocol
core. It deliberately opens no sockets. Internet exposure remains blocked until
a separately reviewed adapter adds network admission limits, durable replay
state, identity rotation and recovery, and interoperability evidence. See
[the threat model](./TRANSPORT-THREAT-MODEL.md).

## Phase 4 — memory and content integrity

- [x] canonical serialization;
- [x] cryptographic content identifiers;
- [x] integrity verification on import;
- [x] append-only provenance for reframing and healing;
- optional IPFS adapter tested against a real node;
- [x] migration path for historical memory artifacts.

The restored `memory-ledger.js` is the supported integrity boundary. Historical
`memory-crystals.js` remains an artwork/prototype and gains no retroactive
integrity claim. See [the protocol](./MEMORY-PROTOCOL.md).

## Phase 5 — exhibition release

- [x] five-minute canonical encounter;
- [x] curatorial statement and operator guide;
- [x] implemented accessibility review with explicit unverified surfaces;
- [x] packaged local/private exhibition mode;
- [ ] public release only after security, claim, assistive-technology, and
  cross-browser audits.

The exhibition score changes presentation time, not simulation semantics.
Hidden-tab time is excluded; pause, restart, manual mode, and journal export
remain available throughout. See the [operator guide](./EXHIBITION-GUIDE.md)
and [accessibility audit](./ACCESSIBILITY-AUDIT.md).

## Phase 6 — Afterimage

- [x] explicit consent after a completed encounter;
- [x] bounded device-local archive with no network path;
- [x] canonical SHA-256 integrity check before reuse;
- [x] attributed prior echo that cannot affect simulation state;
- [x] inspect, export, and explicit erase controls;
- [x] corrupt-storage and storage-denial tests;

Cross-device sync, identity inference, and storage without explicit consent
remain prohibited.

Afterimage is presentation memory, not a model input. The archive never evicts
an older entry to make room silently, and a failed integrity check blocks reuse
without overwriting the stored bytes. See the
[Afterimage protocol](./AFTERIMAGE-PROTOCOL.md).

## Non-goals

- proving sentience;
- simulating quantum mechanics while presenting it as quantum infrastructure;
- making the network “unstoppable”;
- preserving every historical API unchanged;
- promoting a prototype to production through documentation alone.

## Change rule

A component may move to a stronger truth label only when its tests, threat
model, and documentation move with it.
