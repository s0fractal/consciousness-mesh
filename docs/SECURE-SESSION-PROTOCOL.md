# Secure Session Protocol

Status: **version 2 reference protocol; transport-independent**

This document specifies the data and state transitions implemented by
`secure-session.js`. It does not specify discovery, sockets, routing, or peer
trust. Those boundaries belong to a future adapter and policy layer.

Version 2 replaces static exchange keys with signed ephemeral X25519 keys from
both peers. The retired version 1 construction remains documented in
[the historical record](./SECURE-SESSION-V1.md).

Read the [threat model](./TRANSPORT-THREAT-MODEL.md) before implementing this
protocol.

## Canonical data

All signed, authenticated, hashed, or encrypted structures use UTF-8 canonical
JSON:

- object keys are sorted lexicographically;
- numbers are finite and `-0` serializes as `0`;
- arrays are dense and objects have only enumerable data properties;
- accessors, symbols, cycles, non-plain prototypes, and unsupported values are
  refused;
- received frames must be byte-for-byte canonical JSON.

Binary values use unpadded canonical base64url. Content identifiers use
`sha256:` followed by 64 lowercase hexadecimal characters.

## Stable identity

An identity contains only a signing key:

```json
{
  "version": "secure-identity/v2",
  "peerId": "sha256:<Ed25519-SPKI-digest>",
  "label": "<1-128 normalized characters>",
  "signingKey": "<Ed25519 public SPKI DER, base64url>",
  "proof": "<Ed25519 signature, base64url>"
}
```

`proof` signs the canonical identity without `proof`. The peer ID is the
SHA-256 digest of the exact Ed25519 public SPKI bytes. The identity authenticates
handshake consent and frames, but it contributes no long-lived
Diffie–Hellman secret.

A cryptographically valid identity is not automatically trusted. The caller
must obtain the expected identity through a trusted channel.

## Three-step consent handshake

### 1. Offer

The initiator generates a fresh X25519 pair and keeps its private key only in
bounded pending state:

```json
{
  "version": "session-offer/v2",
  "sessionId": "<24 random bytes, base64url>",
  "from": "<initiator peer ID>",
  "to": "<responder peer ID>",
  "createdAt": "<canonical ISO-8601 timestamp>",
  "maxTtl": 8,
  "ephemeralKey": "<initiator X25519 public SPKI DER, base64url>",
  "signature": "<initiator Ed25519 signature, base64url>"
}
```

The signature covers every field except `signature`. The `offerId` used by the
next step is the SHA-256 identifier of the complete canonical signed offer.

### 2. Acceptance

The responder validates the offer, generates a different fresh X25519 pair,
derives its session, and returns:

```json
{
  "version": "session-acceptance/v2",
  "offerId": "sha256:<complete signed offer digest>",
  "sessionId": "<offer session ID>",
  "from": "<responder peer ID>",
  "to": "<initiator peer ID>",
  "createdAt": "<canonical ISO-8601 timestamp>",
  "ephemeralKey": "<responder X25519 public SPKI DER, base64url>",
  "signature": "<responder Ed25519 signature, base64url>"
}
```

The signature covers every field except `signature`.

### 3. Completion

The initiator requires the original local pending state, validates the
acceptance and its exact offer binding, derives the same session, then deletes
the pending ephemeral reference. Invalid acceptance does not consume the valid
pending offer, allowing an authentic response to arrive later.

An offer may be cancelled, expires after the accepted window, and may complete
only once. Pending offers and observed session IDs have independent finite
limits. Canonical identity, offer, and acceptance values are each bounded to
8 KiB by default before public-key parsing.

## Forward-secret key derivation

Both peers compute X25519 using only the two ephemeral handshake keys. Let `p0`
and `p1` be their peer IDs in lexicographic order.

```text
HKDF-SHA-256(
  input key material = ephemeral X25519 shared secret,
  salt = decoded session ID,
  info = "consciousness-mesh/secure-session/v2:"
         + offerId + ":" + p0 + ":" + p1,
  length = 64 bytes
)
```

The first 32 bytes encrypt `p0 → p1`; the final 32 bytes encrypt `p1 → p0`.
The shared secret and temporary key material are zeroed after derivation.
Neither ephemeral private key is retained by an established session.

Later compromise of the Ed25519 identity key alone cannot reconstruct a
recorded completed session. This guarantee depends on ephemeral private
material having left live process memory; JavaScript cannot prove immediate
physical erasure.

## Encrypted frame

The wire frame is:

```json
{
  "version": "secure-frame/v2",
  "sessionId": "<offer session ID>",
  "from": "<sender peer ID>",
  "to": "<receiver peer ID>",
  "sequence": 1,
  "sentAt": "<canonical ISO-8601 timestamp>",
  "ttl": 1,
  "nonce": "<12 bytes, base64url>",
  "messageId": "sha256:<digest>",
  "ciphertext": "<AES-256-GCM ciphertext, base64url>",
  "tag": "<16-byte GCM tag, base64url>",
  "signature": "<sender Ed25519 signature, base64url>"
}
```

The nonce is four bytes from
`SHA-256(direction-key || "consciousness-mesh/nonce-prefix/v2")`, followed by
the unsigned 64-bit big-endian sequence. A direction key must never seal two
frames with the same sequence.

The canonical header through `nonce` is AES-GCM additional authenticated data.
`messageId` is SHA-256 over the canonical header bytes, raw ciphertext, and raw
tag. `signature` signs the complete canonical frame without `signature`.

The receiver checks byte and rate limits, exact canonical structure, session
and address, sequence and TTL bounds, timestamp window, encodings, message ID,
signature, monotonic sequence, derived nonce, GCM authentication, payload size,
and canonical plaintext—in that order. Failure returns no plaintext.

## Replay, forwarding, and downgrade

Each direction begins at sequence 1. A receiver accepts only a sequence greater
than every sequence it has already accepted. This intentionally refuses both
replay and out-of-order delivery.

After opening a frame, the receiver exposes `remainingHops = ttl - 1`.
Forwarding is possible only for an immutable message actually opened by that
session, only once, and only when at least one hop remains. It creates a new
encrypted frame whose TTL is the remaining budget and whose payload records the
previous message ID.

Version 2 accepts only v2 identity, offer, acceptance, and frame structures.
There is no implicit negotiation to the static-key v1 construction.

## State machine

```text
initiator                         responder
   │                                 │
   ├─ create signed offer ──────────>│
   │  retain bounded ephemeral       ├─ validate + explicit accept
   │                                 ├─ derive active session
   │<──────── signed acceptance ─────┤
   ├─ validate + explicit complete   │
   ├─ derive active session          │
   └─ delete pending ephemeral       │
```

Either active session may be disposed, zeroing derived key buffers and refusing
future operations. Replay memory is process-local. A production adapter must
persist replay state or rotate identities across process loss.
