# Contributing

Contributions should preserve the strangeness of the artwork and improve the
precision of the software.

## Before opening a pull request

```bash
npm ci
npm test
npm run check
```

## Contribution contract

- Label components as artwork, simulation, prototype, or production-capable.
- Add an observable definition for new poetic metrics.
- Treat YAML, JSON, peer messages, and imported memories as untrusted data.
- Do not use `eval`, `new Function`, or equivalent dynamic execution.
- Keep tests finite; demos may be long-running but must live outside `npm test`.
- Do not strengthen scientific or security claims without corresponding
  evidence and tests.
- Preserve provenance when transforming memories or observations.

Small, coherent pull requests are preferred.
