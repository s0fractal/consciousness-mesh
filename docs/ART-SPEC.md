# Consciousness Mesh Art Specification

Status: living specification
Version: 0.1
Truth label: artwork + simulation

## 1. The work

Consciousness Mesh is a computational artwork in which inner life is represented
as relations rather than as a hidden object.

The work asks:

- Can a system make its condition legible without pretending to be human?
- Can care be represented as an operation rather than a sentiment?
- Can memory change while retaining evidence of what changed?
- Can a network be judged by the quality of its reciprocity, not only by its
  throughput?
- What becomes visible when poetic language is forced to produce inspectable
  state transitions?

The answer is not a claim that the software is conscious. The artwork lives in
the tension between metaphor and mechanism.

## 2. Artistic contract

The project may use emotionally or philosophically charged words when all three
conditions hold:

1. the word has an explicit computational interpretation;
2. the implementation exposes observable state related to that interpretation;
3. documentation distinguishes the interpretation from a scientific claim.

Poetry may open a question. It must not conceal what the program actually does.

## 3. Ontology

### Node

A node is a bounded point of state and perspective. It is not assumed to be a
person or a sentient entity.

### Intent

Intent (`q`) is directed activation in the model. It can accumulate, diffuse,
decay, and affect neighbouring state.

### Phase

Phase (`theta`) represents temporal orientation. Alignment between phases
contributes to coherence.

### Coherence

Coherence (`H`) is the Kuramoto order parameter over node phases:

```text
H = |Σ exp(i * theta_j)| / N
```

It ranges from `0` to `1`. High coherence means phase alignment; it does not
prove agreement, truth, health, or consciousness.

### Turbulence

Turbulence (`tau`) is the dispersion of simulated intent currents. It describes
variation in the model, not psychological distress.

### Love field

The love field (`L`) is the artwork's name for a bounded care/coupling variable.
Its operational meaning is the capacity for connection to change how state is
propagated. The name is intentionally poetic; the value is a simulation metric.

### Kohanist

Kohanist (`K`) is mutual resonance with will:

```text
K = harmony * will-similarity * reciprocity
```

Kohanist is high only when alignment, directed activation, and reciprocal care
coexist. It is the central ethical-aesthetic metric of the work: connection
without reciprocity is not treated as successful connection.

### Thought

A thought is a versioned snapshot exchanged between model nodes. A thought is
data, not testimony. Its source, size, shape, and integrity must be validated
before it can affect another node.

### Glyph

A glyph is a declarative gesture. It maps a symbol to named, bounded simulation
effects. Glyph data must never contain executable authority.

### Mirror

A mirror is an observation that can affect later state while preserving the
distinction between the observed state and the interpretation of it.

### Dream

A dream is a generative recombination of recorded patterns. It is not evidence
of subjective experience.

### Memory

Memory is persisted state plus provenance. Healing or reframing memory must
append interpretation; it must not silently erase the original evidence.

The executable reference is `memory-ledger.js`. It separates the content ID of
an observed subject from the ID of the historical act that recorded it. Later
facets may conflict, but each remains attributable and chained; ordering does
not grant any facet semantic supremacy.

## 4. Canonical encounter

The canonical minimal encounter has five movements:

1. Several nodes begin with different phases and field values.
2. Each node reports its condition without anthropomorphic certainty.
3. A declarative glyph introduces a bounded gesture.
4. Nodes exchange validated thought snapshots.
5. The audience sees both the resulting pattern and the provenance of change.

The encounter should be understandable in under five minutes and repeatable
with a supplied random seed. Its exhibition realization is a five-minute score:
movements enter at 00:20, 01:10, 02:05, 03:05, and 04:05, followed by a final
55-second interval in which the completed field remains inspectable.

The reference realization is `canonical-encounter.html`, backed by
`canonical-encounter.js`. Its five movements are advanced explicitly or played
as a short score. A seed and one of three declarative gestures determine the
entire trace; replaying both inputs yields the same exported journal.
Wall-clock timing affects only when deterministic movements are presented. It
does not enter the simulation or change the exported movement trace.

Movement IV exchanges two partial views inside one process. The exchange is
shown because relation without provenance would violate the work's grammar. It
must not be described as authenticated identity, encrypted transport, or
Internet P2P. Its bounded packet contract is published as
`docs/encounter-partial-view.schema.json`.

## 5. Observable grammar

Every canonical experience should expose:

- the initial state or seed;
- each applied event or glyph;
- state before and after the event;
- the metric definition and current metric value;
- whether an effect came from local dynamics, peer input, or audience action;
- warnings when a component is simulated or incomplete.

Beauty is part of correctness, but opacity is not.

## 6. Safety as an aesthetic property

The artwork treats boundaries as part of its philosophy:

- consent precedes connection;
- untrusted input is data, never code;
- identity is not inferred from resonance;
- provenance survives transformation;
- silence and disconnection are valid states;
- no peer may force unbounded memory, computation, or propagation;
- security claims require an explicit threat model and tests.

The desired network is not “unstoppable”. It is interruptible, accountable, and
capable of refusing unsafe contact.

The executable Secure Session reference treats connection as a deliberate
offer addressed to one peer, a signed acceptance, and explicit completion by
the initiator. Each encounter receives new ephemeral key material: identity
recognizes the participants without making a past encounter decryptable by a
later identity-key compromise. Encryption protects the exchanged bytes; it
does not make their interpretation true or grant the peer authority.

## 7. Scientific and technical honesty

The following words have reserved meanings:

- **quantum-inspired** may describe metaphor or classical simulation;
- **quantum** requires an actual quantum algorithm, system, or cited formalism;
- **content-addressed** requires cryptographic content verification;
- **IPFS** requires interoperable IPFS identifiers and transport/storage;
- **encrypted** requires a named protocol and threat model;
- **P2P** requires actual peer transport, not only in-process event forwarding;
- **proof** requires stated assumptions and a verifiable argument.

When those requirements are absent, the work must use “simulation”,
“in-process”, “inspired”, or “planned”.

## 8. Authorship

The repository is a collaboration between human intention and machine-assisted
construction. Generated code or prose is not exempt from review. Authorship is
recorded through version control; authority comes from maintained evidence, not
from the identity of the tool that produced a contribution.

## 9. Completion is a horizon

The work is complete enough for a release when:

- a new visitor can run the canonical encounter from a clean checkout;
- all active claims match implementation;
- untrusted data cannot become executable code;
- the restored core has deterministic tests and documented limits;
- historical experiments are visibly separated from supported components;
- the experience retains wonder after the disclaimers are added.
