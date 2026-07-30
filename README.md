# Consciousness Mesh

Consciousness Mesh is a computational artwork about relation, memory, care, and
self-observation in networked systems.

It is also a software laboratory. Its simulations turn poetic concepts into
inspectable state transitions: phase alignment becomes coherence, reciprocity
becomes Kohanist, accumulated observations become memory, and changing internal
conditions become weather.

> **Restoration status:** experimental, local-first, and not production-ready.
> The project does not claim to create or prove sentience. Terms such as
> “consciousness”, “love”, “dream”, and “quantum” name artistic or computational
> models unless a document explicitly says otherwise.

## Start here

Requirements:

- Node.js 22 or newer
- npm 10 or newer

```bash
npm ci
npm test
npm run demo:encounter
```

Open `http://127.0.0.1:4173/` for the canonical five-movement encounter.
The automated test command is finite and deterministic. Interactive experiences
live under `npm run demo:*` and must be stopped with `Ctrl+C`.

For the numerical mesh demonstration without the browser surface, run
`npm run demo:mesh`.

## The restored core

The supported restoration boundary contains five parts:

1. **ChronoFlux-IEL** — a graph simulation with intent, phase, coupling, and
   care-inspired fields.
2. **Mesh nodes** — an in-process transport experiment for exchanging validated
   thought snapshots. This is not yet a secure Internet P2P protocol.
3. **Glyphs** — a declarative vocabulary that changes simulation state without
   executing code from YAML.
4. **Canonical encounter** — a seeded five-movement browser artwork with an
   inspectable provenance journal and exact replay for the same seed and
   gesture.
5. **Memory Ledger** — canonical, content-addressed observations with
   append-only attributed interpretations and tamper-detecting import.

Read [the art specification](./docs/ART-SPEC.md) for the conceptual contract and
[the restoration roadmap](./docs/RESTORATION.md) for the engineering boundary.

## Truth labels

Every substantial component should use one of these labels:

- **Artwork** — expressive language, narrative, or visual form.
- **Simulation** — executable model with named assumptions and observable state.
- **Prototype** — working integration that is incomplete or unsafe to expose.
- **Production-capable** — tested, documented, threat-modelled, and operated
  within explicit limits.

At present, this repository contains artwork, simulations, and prototypes. It
does not contain production-capable distributed infrastructure.

## Repository map

- `chronoflux-iel.js` — numerical simulation core.
- `iel-mesh-node.js` — local mesh-node model.
- `consciousness-glyphs.js` and `intent-index.yaml` — declarative symbolic layer.
- `canonical-encounter.js` — deterministic encounter and provenance engine.
- `canonical-encounter.html` and `encounter/` — accessible browser surface.
- `memory-ledger.js` — immutable observation and interpretation ledger.
- `test/` — restoration baseline tests.
- `docs/ART-SPEC.md` — artistic and semantic specification.
- `docs/MEMORY-PROTOCOL.md` — executable memory and integrity contract.
- `docs/RESTORATION.md` — technical roadmap and acceptance gates.
- `docs/LEGACY-VISION.md` — the original expansive vision, preserved as an
  artistic source rather than current implementation documentation.

The repository still contains many historical experiments outside the restored
core. Their presence is not a guarantee that they run, interoperate, or satisfy
the truth labels above.

## Safety

Do not expose the legacy TCP, WebSocket, HTTP, Bluetooth, or content-storage
experiments to untrusted networks. See [SECURITY.md](./SECURITY.md).

## Contributing

Changes are welcome when they preserve both sides of the work: imaginative
language and technical honesty. See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT. See [LICENSE](./LICENSE).
