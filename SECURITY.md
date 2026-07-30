# Security Policy

## Current support boundary

Only the local ChronoFlux simulation, in-process mesh model, and declarative
glyph layer are in the restoration support boundary.

The legacy HTTP, WebSocket, TCP, Bluetooth, IPFS-named, autonomous, and bridge
experiments are not safe to expose to untrusted input or networks.

## Reporting

Please report vulnerabilities privately through GitHub's security advisory
interface for `s0fractal/consciousness-mesh`. Do not include secrets or personal
data in public issues.

## Baseline rules

- Configuration and data files must never execute code.
- Network inputs must be authenticated, framed, size-limited, and validated.
- Content identifiers must be cryptographically verified.
- Examples must bind to loopback unless remote exposure is explicit.
- Claims of encryption require a named protocol and threat model.
- Tests must not write outside a temporary directory supplied by the test.

## Known legacy risks

Historical experiments may contain hard-coded filesystem paths, incomplete
dependency declarations, unbounded network reads, unsafe HTML construction, and
simulated infrastructure described with production terminology. Restoration
tracks these as known risks, not supported behavior.
