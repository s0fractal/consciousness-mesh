# Afterimage Protocol

Version: `afterimage-archive/v1`

## Purpose

Afterimage is the voluntary, device-local memory layer of the canonical
encounter. It lets a finished encounter leave a short visitor-authored
reflection for a later visit in the same browser profile.

An afterimage is evidence that text was stored with a particular encounter
summary. It is not evidence of identity, authorship, truth, consent beyond the
current interaction, or consciousness.

Afterimages never alter seeds, gestures, model dynamics, metrics, or the
five-movement journal. They are presentation memory, not simulation input.

## Consent sequence

The browser surface permits storage only when:

1. all five movements are complete;
2. the visitor writes 1–160 characters;
3. the visitor checks the device-local storage consent control;
4. the visitor activates **Remember this encounter**.

Nothing is saved on page load, movement advance, exhibition start, exhibition
completion, journal export, or seeded-link sharing.

## Stored entry

Each entry contains exactly:

```json
{
  "id": "sha256:<64 lowercase hexadecimal characters>",
  "content": {
    "version": "afterimage/v1",
    "createdAt": "2026-07-30T18:00:00.000Z",
    "encounter": {
      "encounterVersion": "encounter/v1",
      "seed": "reciprocity-01",
      "gesture": "care",
      "movementCount": 5,
      "finalMetrics": {
        "H": 0.42,
        "tau": 0.18,
        "L": 0.61,
        "K": 0.33
      }
    },
    "reflection": {
      "text": "Care changed what the connection could do.",
      "authority": "visitor-authored reflection"
    },
    "storageBoundary": {
      "scope": "this browser profile",
      "networked": false
    }
  }
}
```

The identifier is SHA-256 over the canonical serialization of `content`.
Object keys are sorted, negative zero is normalized to zero, and non-finite
numbers or unsupported values are rejected.

SHA-256 detects accidental or external modification of stored bytes. It does
not authenticate the visitor or protect a record from an attacker who can
replace both content and identifier.

## Archive boundary

The archive uses the browser origin’s local storage under
`consciousness-mesh.afterimages.v1`.

Limits:

- 12 entries;
- 49,152 serialized bytes;
- 160 UTF-16 code units per reflection;
- 48 UTF-16 code units per seed;
- exactly five completed movements;
- the three canonical gesture identifiers only.

The archive is append-only within those limits. When it is full, the artwork
refuses a new entry instead of deleting the oldest one. The visitor may export
the archive and then explicitly erase all local afterimages.

There is intentionally no import flow in version 1. An exported archive is a
portable inspection and backup artifact, not executable input.

## Verification and failure

Every archive read checks:

- exact archive, entry, encounter, reflection, metric, and storage fields;
- supported versions and gesture;
- canonical timestamp and bounded text;
- finite metrics and five-movement completion;
- archive count and byte limits;
- every SHA-256 content identifier.

If any check fails, no stored entry becomes an echo. The browser surface
reports the failure and refuses to append or export a misleading “verified”
archive. It does not silently repair, discard, or overwrite the bytes. Explicit
erase remains available.

If Web Crypto or browser local storage is unavailable, Afterimage is disabled.
The canonical encounter remains usable.

## Privacy and operational limits

- No Afterimage operation makes a network request.
- The archive is not encrypted.
- Other scripts with access to the same web origin may be able to read local
  storage.
- Browser clearing, private-browsing policy, storage eviction, or a different
  profile may remove or hide the archive.
- On a shared exhibition device, later visitors can see earlier reflections.
  The interface discloses this before consent; operators should erase the
  archive when that continuity is not appropriate.
- Reflections should not contain secrets or identifying personal information.

## Echo semantics

On arrival, the newest verified afterimage may appear as **A prior local
echo**. That echo is fixed for the current page visit. Saving a new afterimage
does not cause the work to present the visitor’s own new text as a prior voice.

The echo shows its seed, gesture, time, and authority. It does not claim that
the same person returned, that a visitor was recognized, or that the network
remembered independently of browser storage.

## Non-goals

- cross-device or cloud synchronization;
- identity, recognition, profiling, or analytics;
- encrypted private memory;
- moderation of visitor-authored text;
- authentication or digital signatures;
- using remembered text as a model prompt or simulation force;
- treating local persistence as a mind.
