# Memory Ledger Protocol

Status: **restored simulation infrastructure**

Version: `memory-ledger/v1`

## Purpose

A Memory Ledger preserves an observation and permits later interpretation
without pretending that interpretation rewrites what was observed.

This is the executable form of the Memory Crystal metaphor:

- the observed content is the crystal;
- its stable content ID is the crystal's optical signature;
- every later facet is an append-only interpretation;
- the chain records who added the facet and what authority they claimed;
- healing means adding context, never silently replacing evidence.

The protocol records data and attribution. It does not prove that an
observation is true, that an actor is who they claim to be, or that a machine
remembered subjectively.

## Two identities

The root observation exposes two distinct identifiers:

1. `subject` is the SHA-256 content ID of the observed content alone. The same
   canonical content has the same subject ID across observers and times.
2. The root entry `id` covers content, attribution, timestamp, and record
   semantics. Two observations of the same subject can therefore remain
   distinct historical acts.

Both identifiers use the form `sha256:<lowercase hex>`.

Content addressing is not a signature. A self-contained ledger can prove that
its links and identifiers agree with its present contents, but an attacker
could replace the entire ledger and recompute every identifier. Consumers that
already know a trusted root, head, or subject must supply it as
`expectedRoot`, `expectedHead`, or `expectedSubject` during verification or
import. Actor authentication belongs to a separate identity protocol.

## Canonical representation

`canonicalStringify()` produces one UTF-8 representation for supported JSON
data:

- object keys are sorted lexicographically;
- array order is preserved;
- `-0` becomes `0`;
- only finite numbers are accepted;
- `undefined`, functions, symbols, sparse arrays, accessors, cycles, and class
  instances are rejected;
- depth and node count are bounded.

The format is intentionally narrower than arbitrary JavaScript. Imported
ledgers begin as serialized JSON, then every content ID is recomputed from the
canonical representation.

## Root observation

```json
{
  "version": "memory-entry/v1",
  "sequence": 0,
  "kind": "observation",
  "parent": null,
  "subject": "sha256:…",
  "createdAt": "2026-07-30T12:00:00.000Z",
  "attribution": {
    "actor": "encounter:reciprocity-01",
    "authority": "local deterministic simulation export"
  },
  "content": {}
}
```

The root is immutable after construction. Exports are detached copies, so
mutating an exported object does not modify the ledger.

## Interpretation entry

```json
{
  "version": "memory-entry/v1",
  "sequence": 1,
  "kind": "interpretation",
  "parent": "sha256:…",
  "root": "sha256:…",
  "createdAt": "2026-07-30T12:01:00.000Z",
  "attribution": {
    "actor": "observer:safety",
    "authority": "attributed interpretation"
  },
  "interpretation": {
    "lens": "safety",
    "text": "Exchange increased the attack surface."
  }
}
```

An interpretation may disagree with an earlier interpretation. Sequence is
historical continuity, not semantic supremacy.

## Import verification

An import is accepted only when:

- the serialized payload is within the byte limit;
- the ledger and entry versions are supported;
- every object has exactly the permitted fields;
- every record recomputes to its declared content ID;
- the root subject recomputes from the observed content;
- sequence numbers are contiguous;
- every interpretation points to the immediately preceding entry and the same
  root;
- any supplied trusted root, head, or subject anchor matches;
- timestamps and attribution are structurally valid;
- entry count, text size, canonical depth, and canonical node count are
  bounded.

Default limits are 1 MiB, 256 entries, depth 64, and 100,000 canonical nodes.
These are parser and memory-safety boundaries, not claims about ideal artistic
scale.

## Legacy migration

`migrateLegacyCrystal()` wraps a historical crystal as the unchanged
`original` content of a new root observation. Its authority is explicitly
labelled `legacy import; source integrity unverified`.

Migration does not retroactively authenticate historical files. It gives them
a verifiable identity from the moment of migration onward.

## Encounter crystallization

Create a ledger from the canonical encounter:

```bash
npm run crystal:encounter -- reciprocity-01 care \
  2026-07-30T12:00:00.000Z > encounter.memory.json
```

The optional timestamp makes builds and examples reproducible. Omitting it
records the current time.

## Non-goals

- deleting or overwriting an earlier interpretation;
- treating the latest interpretation as objective truth;
- authenticating actors without a separate identity protocol;
- treating an unanchored, self-consistent ledger as authenticated history;
- encrypting private memories;
- accepting arbitrary JavaScript values as memory;
- calling a SHA-256 identifier an IPFS CID.
