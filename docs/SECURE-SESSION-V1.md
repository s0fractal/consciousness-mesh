# Secure Session Version 1 — Historical Record

Status: **retired; not accepted by the current implementation**

Version 1 was the first bounded encrypted protocol core restored in
[PR #4](https://github.com/s0fractal/consciousness-mesh/pull/4). It established
the consent, canonical framing, authentication, encryption, replay, rate, byte,
timestamp, and TTL boundaries that version 2 retains.

## Construction

`secure-identity/v1` bound both an Ed25519 signing key and a long-lived X25519
exchange key into one self-signed identity. A signed `session-offer/v1`
contained a random session ID, both peer IDs, creation time, and maximum TTL.
Both peers derived directional AES-256-GCM keys directly from their long-lived
X25519 identity keys:

```text
HKDF-SHA-256(
  input key material = static X25519 shared secret,
  salt = decoded session ID,
  info = "consciousness-mesh/secure-session/v1:" + p0 + ":" + p1,
  length = 64 bytes
)
```

Frames used `secure-frame/v1`, strict monotonic sequences, sequence-derived
nonces, authenticated metadata, Ed25519 signatures, and canonical encrypted
payloads.

## Reason for retirement

The static exchange keys meant that later compromise of one identity exchange
private key could reconstruct recorded session keys. Version 1 therefore made
no forward-secrecy claim.

Version 2 separates stable signing identity from ephemeral key agreement and
requires an independently signed acceptance. There is no downgrade negotiation:
v1 input is preserved as history and refused as current protocol data.
