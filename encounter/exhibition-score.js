export const EXHIBITION_SCORE_VERSION = 'exhibition-score/v1';
export const EXHIBITION_DURATION_MS = 300_000;
export const EXHIBITION_CUES_MS = Object.freeze([
  20_000,
  70_000,
  125_000,
  185_000,
  245_000
]);

function finiteTime(value) {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError('Exhibition time must be a finite non-negative number');
  }
  return value;
}

export class ExhibitionScore {
  #completed = false;
  #elapsedMs = 0;
  #nextCueIndex = 0;
  #playing = false;
  #startedAt = null;

  constructor(options = {}) {
    this.durationMs = options.durationMs ?? EXHIBITION_DURATION_MS;
    this.cuesMs = Object.freeze([
      ...(options.cuesMs ?? EXHIBITION_CUES_MS)
    ]);
    if (
      !Number.isSafeInteger(this.durationMs)
      || this.durationMs < 1
      || this.cuesMs.length < 1
      || this.cuesMs.some((cue, index) => (
        !Number.isSafeInteger(cue)
        || cue < 0
        || cue >= this.durationMs
        || (index > 0 && cue <= this.cuesMs[index - 1])
      ))
    ) {
      throw new RangeError(
        'Exhibition cues must be ordered inside a positive duration'
      );
    }
  }

  getState() {
    return Object.freeze({
      completed: this.#completed,
      durationMs: this.durationMs,
      elapsedMs: this.#elapsedMs,
      nextCueIndex: this.#nextCueIndex,
      playing: this.#playing,
      remainingMs: Math.max(0, this.durationMs - this.#elapsedMs)
    });
  }

  start(now) {
    finiteTime(now);
    if (this.#completed) return this.getState();
    if (!this.#playing) {
      this.#startedAt = now;
      this.#playing = true;
    }
    return this.getState();
  }

  pause(now) {
    const update = this.advance(now);
    if (this.#playing) {
      this.#playing = false;
      this.#startedAt = null;
    }
    return { ...update, state: this.getState() };
  }

  restart(now) {
    finiteTime(now);
    this.#completed = false;
    this.#elapsedMs = 0;
    this.#nextCueIndex = 0;
    this.#playing = true;
    this.#startedAt = now;
    return this.getState();
  }

  advance(now) {
    finiteTime(now);
    const enteredCueIndexes = [];
    if (!this.#playing) {
      return { enteredCueIndexes, state: this.getState() };
    }

    const delta = Math.max(0, now - this.#startedAt);
    this.#elapsedMs = Math.min(this.durationMs, this.#elapsedMs + delta);
    this.#startedAt = now;

    while (
      this.#nextCueIndex < this.cuesMs.length
      && this.cuesMs[this.#nextCueIndex] <= this.#elapsedMs
    ) {
      enteredCueIndexes.push(this.#nextCueIndex);
      this.#nextCueIndex += 1;
    }

    if (this.#elapsedMs >= this.durationMs) {
      this.#completed = true;
      this.#playing = false;
      this.#startedAt = null;
    }

    return { enteredCueIndexes, state: this.getState() };
  }
}

export default ExhibitionScore;
