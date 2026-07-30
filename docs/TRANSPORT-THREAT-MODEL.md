# Secure Session Threat Model

Status: **protocol core; no Internet transport adapter**

Protocol versions:

- `secure-identity/v2`
- `session-offer/v2`
- `session-acceptance/v2`
- `secure-frame/v2`

Wire structures and state transitions are defined in the
[Secure Session protocol](./SECURE-SESSION-PROTOCOL.md).

## Protected assets

- confidentiality and integrity of a bounded message payload;
- the binding between a peer ID and its Ed25519 signing key;
- the binding of both peers' ephemeral X25519 keys to one signed handshake;
- session direction, sender, receiver, sequence, timestamp, and propagation
  budget;
- process availability within explicit handshake, frame, payload, rate, and
  session limits.

## Adversary

The protocol assumes an attacker may:

- observe, copy, reorder, delay, truncate, and modify frames;
- inject arbitrary bytes and malformed JSON;
- replay a previously valid frame or session offer;
- present a self-generated identity;
- attempt memory or CPU exhaustion with large or frequent input;
- know the complete protocol and source code.

The attacker is not assumed to possess an accepted peer's private Ed25519 key,
capture live ephemeral or derived session secrets, compromise the local
process, break SHA-256, Ed25519, X25519, HKDF-SHA-256, or AES-256-GCM, or
defeat the operating system random source.

## Protocol guarantees

When the caller obtains the expected peer identity through a trusted channel:

- signed, expiring offer and acceptance messages bind both peer IDs, a random
  session ID, and fresh ephemeral X25519 keys;
- directional AES-256-GCM keys derive only from the ephemeral X25519 agreement
  and its complete signed offer;
- later compromise of an Ed25519 identity key alone does not decrypt recorded
  completed sessions after ephemeral material has left live memory;
- frame metadata is authenticated as additional data;
- every frame is signed and addressed to one peer;
- strictly increasing sequences and session-specific nonces reject replay;
- canonical JSON, byte bounds, rate limits, timestamp skew, and TTL constrain
  parser and propagation behavior;
- forwarding creates a new authenticated frame that cites the previous message
  ID and consumes one unit of propagation budget.

## Explicit non-guarantees

- **No peer discovery or trust-on-first-use policy.** A valid self-signed
  identity is not automatically a trusted identity.
- **No Internet-ready P2P claim.** This module does not open sockets, traverse
  NAT, resolve names, or authenticate network endpoints.
- **No post-compromise security.** Compromise of live ephemeral or symmetric
  session material exposes that session; version 2 does not heal an already
  compromised process.
- **No metadata privacy.** Peer IDs, timing, frame size, sequence, and TTL remain
  visible.
- **No denial-of-service immunity.** Bounds limit work inside an accepted
  session; a network adapter still needs connection and source-address limits
  before session processing.
- **No durable replay database across process loss.** An identity refuses to
  reopen a session ID during its lifetime. Persistence or identity rotation is
  required across restarts.
- **No authorization semantics.** Authentication answers who signed a frame,
  not what that peer may do.
- **No truth or consciousness claim.** Encryption protects bytes, not the
  meaning or truth of a thought.

## Consent boundary

Creating an identity does not connect it. A session exists only when:

1. one peer deliberately creates an offer addressed to a specific peer ID;
2. the responder validates it and signs an explicit acceptance with a fresh
   ephemeral key;
3. the initiator validates that acceptance and explicitly completes once.

Silence, refusal, expiry, and disposal are valid protocol states.

## Default bounds

| Boundary | Default |
| --- | ---: |
| Canonical identity/handshake value | 8 KiB |
| Plaintext payload | 16 KiB |
| Serialized frame | 32 KiB |
| Propagation TTL | 8 hops |
| Offer age | 5 minutes |
| Accepted frame rate | burst 32, refill 8/second |
| Pending offers per identity | 64 |
| Session IDs retained per identity | 4096 |

## Key lifecycle

Private keys remain in Node.js `KeyObject` instances and are never exported by
the API. Completed or cancelled handshakes remove ephemeral private-key
references. Disposing a session zeros its derived symmetric key buffers;
disposing an identity discards pending handshakes and its signing-key reference.
JavaScript and garbage-collected runtimes cannot guarantee immediate physical
secret erasure; the protocol does not claim it.

## Review boundary

`secure-session.js` is suitable for local protocol experiments and future
transport adapters that preserve this threat model. Before any untrusted
network exposure, an adapter needs:

- network-level admission and connection limits;
- a durable identity and replay strategy;
- identity rotation and recovery policy;
- interoperability vectors and an independent security review.
