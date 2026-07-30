# Secure Session Protocol

Status: **version 1 reference protocol; transport-independent**

This document specifies the data and state transitions implemented by
`secure-session.js`. It does not specify discovery, sockets, routing, or peer
trust. Those boundaries belong to a future adapter and policy layer.

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

## Identity

An identity contains:

```json
{
  "version": "secure-identity/v1",
  "peerId": "sha256:<Ed25519-SPKI-digest>",
  "label": "<1-128 normalized characters>",
  "signingKey": "<Ed25519 public SPKI DER, base64url>",
  "exchangeKey": "<X25519 public SPKI DER, base64url>",
  "proof": "<Ed25519 signature, base64url>"
}
```

`proof` signs the canonical identity without `proof`. The peer ID is the
SHA-256 digest of the exact Ed25519 public SPKI bytes. Consequently the signing
key names the peer, and its signature binds that name to the exchange key and
label.

A cryptographically valid identity is not automatically trusted. The caller
must obtain the expected identity through a trusted channel.

## Consent offer

Either peer may create a single-use offer:

```json
{
  "version": "session-offer/v1",
  "sessionId": "<24 random bytes, base64url>",
  "from": "<issuer peer ID>",
  "to": "<intended peer ID>",
  "createdAt": "<canonical ISO-8601 timestamp>",
  "maxTtl": 8,
  "signature": "<issuer Ed25519 signature, base64url>"
}
```

The signature covers every field except `signature`. Opening requires the
complete signed identities, an offer addressed to exactly that pair, a valid
signature, a locally accepted TTL, and an offer inside the accepted time
window. Each identity instance opens a session ID at most once.

Both peers call `openSession` deliberately. Merely receiving an offer does not
connect or authorize anything.

## Directional key derivation

Both peers compute the X25519 shared secret. Let `p0` and `p1` be their peer IDs
in lexicographic order.

```text
HKDF-SHA-256(
  input key material = X25519 shared secret,
  salt = decoded session ID,
  info = "consciousness-mesh/secure-session/v1:" + p0 + ":" + p1,
  length = 64 bytes
)
```

The first 32 bytes encrypt `p0 → p1`; the final 32 bytes encrypt `p1 → p0`.
The shared secret and temporary key material are zeroed after derivation.

Version 1 uses static identity exchange keys and therefore does not provide
forward secrecy.

## Encrypted frame

The wire frame is:

```json
{
  "version": "secure-frame/v1",
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
`SHA-256(direction-key || "consciousness-mesh/nonce-prefix/v1")`, followed by
the unsigned 64-bit big-endian sequence. A direction key must never seal two
frames with the same sequence.

The canonical header through `nonce` is AES-GCM additional authenticated data.
`messageId` is SHA-256 over the canonical header bytes, raw ciphertext, and raw
tag. `signature` signs the complete canonical frame without `signature`.

The receiver checks byte and rate limits, exact canonical structure, session
and address, sequence and TTL bounds, timestamp window, encodings, message ID,
signature, monotonic sequence, derived nonce, GCM authentication, payload size,
and canonical plaintext—in that order. Failure returns no plaintext.

## Replay and forwarding

Each direction begins at sequence 1. A receiver accepts only a sequence greater
than every sequence it has already accepted. This intentionally refuses both
replay and out-of-order delivery.

After opening a frame, the receiver exposes `remainingHops = ttl - 1`.
Forwarding is possible only for an immutable message actually opened by that
session, only once, and only when at least one hop remains. It creates a new
encrypted frame whose TTL is the remaining budget and whose payload records the
previous message ID. Forwarding never edits or reuses the original frame.

## Session states

```text
identity
  └─ create/receive signed offer
       └─ explicit open
            ├─ active: seal, open, bounded forward
            └─ dispose: derived keys zeroed; all operations refused
```

Replay memory is process-local in version 1. A production adapter must persist
replay state or rotate identities across process loss.
