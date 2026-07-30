# Secure Session Threat Model

Status: **protocol core; no Internet transport adapter**

Protocol versions:

- `secure-identity/v1`
- `session-offer/v1`
- `secure-frame/v1`

Wire structures and state transitions are defined in the
[Secure Session protocol](./SECURE-SESSION-PROTOCOL.md).

## Protected assets

- confidentiality and integrity of a bounded message payload;
- the binding between a peer ID, its Ed25519 signing key, and its X25519
  exchange key;
- session direction, sender, receiver, sequence, timestamp, and propagation
  budget;
- process availability within explicit frame, payload, rate, and session
  limits.

## Adversary

The protocol assumes an attacker may:

- observe, copy, reorder, delay, truncate, and modify frames;
- inject arbitrary bytes and malformed JSON;
- replay a previously valid frame or session offer;
- present a self-generated identity;
- attempt memory or CPU exhaustion with large or frequent input;
- know the complete protocol and source code.

The attacker is not assumed to possess an accepted peer's private Ed25519 or
X25519 key, compromise the local process, break SHA-256, Ed25519, X25519,
HKDF-SHA-256, or AES-256-GCM, or defeat the operating system random source.

## Protocol guarantees

When the caller obtains the expected peer identity through a trusted channel:

- the exchange key is signed by the peer's Ed25519 identity;
- a signed, expiring session offer binds both peer IDs and a random session ID;
- directional AES-256-GCM keys are derived with X25519 and HKDF-SHA-256;
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
- **No forward secrecy.** Version 1 uses long-lived X25519 identity exchange
  keys. Later compromise of that private key can expose recorded sessions.
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
2. both sides validate the complete signed identities and offer;
3. each side explicitly opens that offer once.

Silence, refusal, expiry, and disposal are valid protocol states.

## Default bounds

| Boundary | Default |
| --- | ---: |
| Plaintext payload | 16 KiB |
| Serialized frame | 32 KiB |
| Propagation TTL | 8 hops |
| Offer age | 5 minutes |
| Accepted frame rate | burst 32, refill 8/second |
| Session IDs retained per identity | 4096 |

## Key lifecycle

Private keys remain in Node.js `KeyObject` instances and are never exported by
the API. Disposing a session zeros its derived symmetric key buffers and makes
future seal/open operations fail. JavaScript and garbage-collected runtimes
cannot guarantee perfect secret erasure; the protocol does not claim it.

## Review boundary

`secure-session.js` is suitable for local protocol experiments and future
transport adapters that preserve this threat model. Before any untrusted
network exposure, an adapter needs:

- network-level admission and connection limits;
- a durable identity and replay strategy;
- key rotation and forward-secret session negotiation;
- interoperability vectors and an independent security review.
