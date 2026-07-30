# Accessibility Audit

Status: **implemented review; not a certification**

Reviewed surface: the private canonical encounter and five-minute exhibition
mode.

## Supported access paths

- semantic heading, section, list, form, fieldset, definition-list, progress,
  and button elements;
- skip link to the encounter stage;
- visible focus indicators for links, buttons, inputs, and gesture choices;
- native keyboard access to every interactive control;
- Space pause/resume, Escape pause, and R restart outside focused controls;
- polite movement announcements without announcing the timer every second;
- a text description of current movement and all four canvas metrics;
- `aria-current="step"` on the current movement;
- timer and progress elements with accessible names;
- automatic pause when the page is hidden;
- responsive layouts down to a declared 320 CSS-pixel minimum;
- reduced-motion CSS that removes smooth scrolling and transitions without
  shortening the five-minute score.

The canvas is supplementary. The same current metrics, movement, score state,
and complete provenance journal remain available as text.

## Timing and interruption

The exhibition is not a five-minute timeout on access. Visitors can pause for
an unlimited period, restart, exit to manual controls, replay the same trace, or
export the journal. Hidden-tab time is excluded. No action is triggered merely
because focus moves.

## Visual review

The interface does not encode movement state by colour alone: Roman numerals,
titles, ordering, current-step semantics, journal entries, and status text
remain present. The palette uses light primary text on a near-black field;
muted copy is reserved for supporting information rather than hidden controls.
Browser zoom and reflow remain available.

The automated WCAG relative-luminance calculation records these core token
pairs: primary ink on paper `15.93:1`, muted text on paper `6.77:1`, acid on
paper `16.35:1`, coral on paper `7.63:1`, and muted text on raised paper
`6.31:1`.

## Automated contract

`test/accessibility.test.js` checks the structural access surface, keyboard and
visibility pause hooks, reduced-motion rule, descriptive canvas relationship,
core colour-token contrast, and absence of positive `tabindex`.
`test/exhibition-score.test.js` proves that pause excludes hidden time and that
the score is finite.

Automated checks are evidence, not a substitute for people.

## Known limits

- No manual screen-reader matrix has yet been recorded for VoiceOver, NVDA, and
  JAWS.
- Canvas geometry is summarized rather than exposed node by node.
- The gesture emoji may be spoken differently across platforms; adjacent text
  supplies the stable name.
- Markdown documents depend on the reader used by the hosting/browser surface.
- High-contrast and forced-colour modes have not yet received a documented
  cross-browser manual pass.
- No claim of WCAG conformance is made until assistive-technology and
  cross-browser evidence is recorded.

These limits block a public accessibility-conformance claim, not private
exhibition use with the documented alternatives.
