import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EXHIBITION_CUES_MS,
  EXHIBITION_DURATION_MS,
  ExhibitionScore
} from '../encounter/exhibition-score.js';

test('the exhibition score is exactly five minutes with five ordered cues', () => {
  assert.equal(EXHIBITION_DURATION_MS, 5 * 60 * 1000);
  assert.equal(EXHIBITION_CUES_MS.length, 5);
  assert.ok(EXHIBITION_CUES_MS.every((cue, index) => (
    cue < EXHIBITION_DURATION_MS
    && (index === 0 || cue > EXHIBITION_CUES_MS[index - 1])
  )));
});

test('a large clock step enters every crossed cue exactly once', () => {
  const score = new ExhibitionScore();
  score.start(1_000);

  assert.deepEqual(score.advance(20_999).enteredCueIndexes, []);
  assert.deepEqual(score.advance(21_000).enteredCueIndexes, [0]);
  assert.deepEqual(
    score.advance(246_000).enteredCueIndexes,
    [1, 2, 3, 4]
  );
  assert.deepEqual(score.advance(246_000).enteredCueIndexes, []);
  assert.equal(score.getState().nextCueIndex, 5);
});

test('pause excludes hidden time and resume preserves elapsed time', () => {
  const score = new ExhibitionScore({
    durationMs: 10_000,
    cuesMs: [2_000, 8_000]
  });
  score.start(100);
  score.advance(1_100);
  score.pause(1_600);

  assert.equal(score.getState().elapsedMs, 1_500);
  assert.equal(score.getState().playing, false);
  assert.equal(score.advance(9_000).state.elapsedMs, 1_500);

  score.start(9_000);
  assert.deepEqual(score.advance(9_500).enteredCueIndexes, [0]);
  assert.equal(score.getState().elapsedMs, 2_000);
});

test('completion is finite and restart restores the full score', () => {
  const score = new ExhibitionScore({
    durationMs: 1_000,
    cuesMs: [100, 500]
  });
  score.start(0);
  const completed = score.advance(5_000);

  assert.deepEqual(completed.enteredCueIndexes, [0, 1]);
  assert.equal(completed.state.completed, true);
  assert.equal(completed.state.elapsedMs, 1_000);
  assert.equal(completed.state.remainingMs, 0);
  assert.equal(completed.state.playing, false);

  const restarted = score.restart(7_000);
  assert.equal(restarted.completed, false);
  assert.equal(restarted.elapsedMs, 0);
  assert.equal(restarted.nextCueIndex, 0);
  assert.equal(restarted.playing, true);
});

test('invalid clocks and score shapes fail at the boundary', () => {
  assert.throws(
    () => new ExhibitionScore({ durationMs: 100, cuesMs: [80, 20] }),
    /ordered/
  );
  const score = new ExhibitionScore();
  assert.throws(() => score.start(Number.NaN), /finite/);
  assert.throws(() => score.advance(-1), /non-negative/);
});
