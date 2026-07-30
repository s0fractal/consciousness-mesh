import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('the encounter exposes a semantic, pausable exhibition surface', async () => {
  const html = await readFile('canonical-encounter.html', 'utf8');

  assert.match(html, /<html lang="en">/);
  assert.match(html, /class="skip-link" href="#encounter-stage"/);
  assert.match(html, /aria-describedby="canvas-state"/);
  assert.match(html, /id="canvas-state" class="sr-only"/);
  assert.match(html, /id="exhibition-progress"[\s\S]*max="300000"/);
  assert.match(html, /id="toggle-exhibition"[\s\S]*aria-pressed="false"/);
  assert.match(html, /<label for="afterimage-reflection">/);
  assert.match(html, /id="afterimage-reflection"[\s\S]*maxlength="160"/);
  assert.match(html, /id="afterimage-consent" type="checkbox"/);
  assert.match(html, /id="afterimage-archive-status"[\s\S]*role="status"/);
  assert.match(html, /id="afterimage-list" class="afterimage-list"/);
  assert.match(html, /id="live-status"[\s\S]*aria-live="polite"/);
  assert.doesNotMatch(html, /tabindex="[1-9]/);
});

test('timed presentation remains interruptible and motion-respectful', async () => {
  const [source, styles] = await Promise.all([
    readFile('encounter/app.js', 'utf8'),
    readFile('encounter/styles.css', 'utf8')
  ]);

  assert.match(source, /visibilitychange/);
  assert.match(source, /document\.hidden/);
  assert.match(source, /event\.key === 'Escape'/);
  assert.match(source, /pauseExhibition/);
  assert.match(source, /timingAffectsSimulation: false/);
  assert.match(source, /movementCount: state\.journal\.length/);
  assert.match(source, /afterimageRememberButton\.disabled/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.doesNotMatch(source, /prefersReducedMotion\.matches \? 250/);
});

test('core text tokens retain at least 4.5 to 1 contrast', async () => {
  const styles = await readFile('encounter/styles.css', 'utf8');
  const token = name => {
    const match = styles.match(
      new RegExp(`--${name}: #([0-9a-fA-F]{6})`)
    );
    assert.ok(match, `missing colour token: ${name}`);
    return match[1];
  };
  const luminance = hex => {
    const channels = hex.match(/../g)
      .map(value => Number.parseInt(value, 16) / 255)
      .map(value => (
        value <= 0.04045
          ? value / 12.92
          : ((value + 0.055) / 1.055) ** 2.4
      ));
    return (
      channels[0] * 0.2126
      + channels[1] * 0.7152
      + channels[2] * 0.0722
    );
  };
  const contrast = (foreground, background) => {
    const first = luminance(foreground);
    const second = luminance(background);
    return (
      (Math.max(first, second) + 0.05)
      / (Math.min(first, second) + 0.05)
    );
  };

  for (const [foreground, background] of [
    ['ink', 'paper'],
    ['muted', 'paper'],
    ['acid', 'paper'],
    ['coral', 'paper'],
    ['muted', 'paper-raised']
  ]) {
    assert.ok(
      contrast(token(foreground), token(background)) >= 4.5,
      `${foreground} on ${background} must retain text contrast`
    );
  }
});
