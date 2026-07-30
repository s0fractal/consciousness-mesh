# Exhibition Operator Guide

Status: **private exhibition build**

## The score

The exhibition mode lasts exactly five minutes of visible, unpaused time.
Timing controls presentation only; seed and gesture continue to determine the
simulation trace.

| Clock | Cue |
| ---: | --- |
| 00:20 | I · Arrival |
| 01:10 | II · Witness |
| 02:05 | III · Gesture |
| 03:05 | IV · Exchange |
| 04:05 | V · Reflection |
| 05:00 | Score complete |

The final 55 seconds hold the completed field and provenance for reflection.

## Launch

For the private hosted installation, use:

```text
/?mode=exhibition&seed=reciprocity-01&gesture=care
```

Valid gestures are `care`, `reorient`, and `kindle`. The mode begins
automatically only when `mode=exhibition` is explicit in the URL.

For a local installation:

```bash
npm install
npm run demo:exhibition
```

The server prints the complete seeded exhibition URL. The encounter makes no
hidden network requests and needs no external service after the repository
dependencies are installed.

## Controls

- **Space** — pause or resume the timed score when focus is not inside a
  control;
- **Escape** — pause;
- **R** — restart the same seed and gesture from 05:00;
- **Exit exhibition mode** — retain the current trace and restore manual
  controls;
- **Export journal** — save the deterministic trace with presentation metadata.

Changing or hiding the browser tab pauses elapsed exhibition time. Returning to
the tab does not resume without an explicit action.

## Installation checklist

1. Use a current Chromium, Firefox, or Safari build with JavaScript enabled.
2. Open the seeded exhibition URL before admitting visitors.
3. Confirm the header says “Artwork + deterministic simulation”.
4. Confirm the timer reads `05:00` and begins counting down.
5. Confirm Space pauses and resumes, Escape pauses, and R returns to `05:00`.
6. Keep browser zoom available; do not lock the installation to fullscreen.
7. Provide a keyboard or equivalent switch input within reach.
8. Keep the curatorial statement and accessibility notes available nearby.

## Afterimage on a shared installation

Afterimage is enabled in the private build. A visitor can store a short
reflection only after completing all five movements and confirming that the
text will remain in the current browser profile. Later visitors on that profile
may see the newest verified reflection as a prior local echo.

Before opening:

1. decide whether continuity between visitors is appropriate for the venue;
2. explain that reflections are visible on the shared installation;
3. do not invite secrets or identifying personal information;
4. use **Export archive** if the venue needs a consensual record;
5. use **Erase all local afterimages** before changing audiences or contexts
   where continuity would be misleading.

The archive is not encrypted, moderated, synchronized, or used as simulation
input. See the [Afterimage protocol](./AFTERIMAGE-PROTOCOL.md).

## Recovery

- If the browser becomes hidden, return and press Space or the resume button.
- If timing or projection is interrupted, press R; the same seed and gesture
  reproduce the same trace.
- If rendering fails, reload the exact seeded URL. No server state is lost.
- Do not present the legacy networking experiments as part of the installation.

## Release boundary

This guide packages a local/private exhibition mode. It does not authorize a
public release, claim scientific validation, or promote the protocol core to an
Internet transport.
