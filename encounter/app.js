import {
  CanonicalEncounter,
  GESTURES,
  MOVEMENTS
} from '../canonical-encounter.js';
import {
  EXHIBITION_DURATION_MS,
  EXHIBITION_SCORE_VERSION,
  ExhibitionScore
} from './exhibition-score.js';
import {
  AFTERIMAGE_LIMITS,
  AfterimageStore
} from './afterimage-memory.js';

const elements = {
  canvas: document.querySelector('#mesh-canvas'),
  canvasState: document.querySelector('#canvas-state'),
  currentMovement: document.querySelector('#current-movement'),
  movementLine: document.querySelector('#movement-line'),
  movementList: document.querySelector('#movement-list'),
  seedInput: document.querySelector('#seed-input'),
  seedStamp: document.querySelector('#seed-stamp'),
  nextButton: document.querySelector('#next-movement'),
  playButton: document.querySelector('#play-encounter'),
  restartButton: document.querySelector('#restart-encounter'),
  newSeedButton: document.querySelector('#new-seed'),
  copyLinkButton: document.querySelector('#copy-link'),
  exportButton: document.querySelector('#export-journal'),
  exhibitionPanel: document.querySelector('#exhibition-panel'),
  exhibitionTime: document.querySelector('#exhibition-time'),
  exhibitionProgress: document.querySelector('#exhibition-progress'),
  exhibitionStatus: document.querySelector('#exhibition-status'),
  exhibitionButton: document.querySelector('#toggle-exhibition'),
  exitExhibitionButton: document.querySelector('#exit-exhibition'),
  afterimageEcho: document.querySelector('#afterimage-echo'),
  afterimageEchoText: document.querySelector('#afterimage-echo-text'),
  afterimageEchoOrigin: document.querySelector('#afterimage-echo-origin'),
  afterimageForm: document.querySelector('#afterimage-form'),
  afterimageReflection: document.querySelector('#afterimage-reflection'),
  afterimageConsent: document.querySelector('#afterimage-consent'),
  afterimageRememberButton: document.querySelector('#remember-afterimage'),
  afterimageFormStatus: document.querySelector('#afterimage-form-status'),
  afterimageCount: document.querySelector('#afterimage-count'),
  afterimageArchiveStatus: document.querySelector('#afterimage-archive-status'),
  afterimageList: document.querySelector('#afterimage-list'),
  afterimageExportButton: document.querySelector('#export-afterimages'),
  afterimageEraseButton: document.querySelector('#erase-afterimages'),
  journal: document.querySelector('#provenance-journal'),
  journalEmpty: document.querySelector('#journal-empty'),
  liveStatus: document.querySelector('#live-status'),
  metrics: {
    H: document.querySelector('#metric-h'),
    tau: document.querySelector('#metric-tau'),
    L: document.querySelector('#metric-l'),
    K: document.querySelector('#metric-k')
  }
};

const context = elements.canvas.getContext('2d');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let playTimer = null;
let exhibitionTimer = null;
let exhibitionActive = false;
let exhibitionScore = new ExhibitionScore();
let afterimageStore = null;
let afterimageArchive = {
  valid: true,
  entries: [],
  error: null,
  loading: true
};
let arrivalAfterimage = null;
let afterimageBusy = false;
let afterimageFailure = null;

try {
  afterimageStore = new AfterimageStore({ storage: window.localStorage });
} catch {
  afterimageArchive = {
    valid: false,
    entries: [],
    error: 'Local storage is unavailable.',
    loading: false
  };
}

const initialParameters = new URLSearchParams(window.location.search);
const requestedExhibitionMode = initialParameters.get('mode') === 'exhibition';
const initialSeed = cleanSeed(initialParameters.get('seed') || 'reciprocity-01');
const initialGesture = GESTURES[initialParameters.get('gesture')]
  ? initialParameters.get('gesture')
  : 'care';

elements.seedInput.value = initialSeed;
document.querySelector(
  `input[name="gesture"][value="${initialGesture}"]`
).checked = true;

let encounter = new CanonicalEncounter({
  seed: initialSeed,
  gesture: initialGesture
});

function cleanSeed(value) {
  return String(value || 'reciprocity-01')
    .trim()
    .slice(0, 48) || 'reciprocity-01';
}

function selectedGesture() {
  return document.querySelector('input[name="gesture"]:checked').value;
}

function formatMetric(value) {
  return Number(value).toFixed(3);
}

function formatDelta(value) {
  const normalized = Math.abs(value) < 0.0005 ? 0 : value;
  return `${normalized > 0 ? '+' : ''}${normalized.toFixed(3)}`;
}

function createMovementList() {
  elements.movementList.replaceChildren();

  for (const [index, movement] of MOVEMENTS.entries()) {
    const item = document.createElement('li');
    item.dataset.index = index;

    const number = document.createElement('span');
    number.className = 'movement-number';
    number.textContent = movement.number;

    const text = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = movement.title;
    const line = document.createElement('p');
    line.textContent = movement.line;
    text.append(title, line);

    const state = document.createElement('span');
    state.className = 'movement-state';
    state.setAttribute('aria-hidden', 'true');
    item.append(number, text, state);
    elements.movementList.append(item);
  }
}

function render() {
  const state = encounter.getState();
  renderCanvas(state.snapshot);
  renderCanvasState(state);
  renderMetrics(state.snapshot.metrics);
  renderMovementState(state);
  renderJournal(state.journal);
  renderExhibition();
  renderAfterimageFormState(state);
  elements.seedStamp.textContent = state.seed;

  const gestureInputs = document.querySelectorAll('input[name="gesture"]');
  for (const input of gestureInputs) {
    input.disabled = exhibitionActive || state.movementIndex > 2;
  }
  elements.seedInput.disabled = exhibitionActive;
  elements.newSeedButton.disabled = exhibitionActive;
}

function renderMetrics(metrics) {
  for (const [name, element] of Object.entries(elements.metrics)) {
    element.textContent = formatMetric(metrics[name]);
  }
}

function renderMovementState(state) {
  const movementItems = elements.movementList.querySelectorAll('li');
  for (const [index, item] of movementItems.entries()) {
    item.classList.toggle('complete', index < state.movementIndex);
    item.classList.toggle('current', index === state.movementIndex);
    if (index === state.movementIndex) {
      item.setAttribute('aria-current', 'step');
    } else {
      item.removeAttribute('aria-current');
    }
  }

  if (state.completed) {
    elements.currentMovement.textContent = 'Encounter complete';
    elements.movementLine.textContent = 'The pattern remains replayable; the trace remains inspectable.';
    elements.nextButton.textContent = 'Encounter complete';
    elements.nextButton.disabled = true;
    elements.playButton.textContent = 'Play again';
    elements.playButton.disabled = exhibitionActive;
    return;
  }

  const next = state.nextMovement;
  const currentEntry = state.journal.at(-1);
  elements.currentMovement.textContent = currentEntry
    ? `${currentEntry.movement.number} · ${currentEntry.movement.title}`
    : 'Before arrival';
  elements.movementLine.textContent = currentEntry
    ? currentEntry.movement.line
    : 'The seed holds a possibility, not an identity.';
  elements.nextButton.replaceChildren();
  elements.nextButton.append(
    document.createTextNode(`Enter movement ${next.number} · ${next.title} `)
  );
  const arrow = document.createElement('span');
  arrow.setAttribute('aria-hidden', 'true');
  arrow.textContent = '→';
  elements.nextButton.append(arrow);
  elements.nextButton.disabled = exhibitionActive;
  elements.playButton.textContent = playTimer ? 'Pause' : 'Play all';
  elements.playButton.disabled = exhibitionActive;
}

function renderCanvasState(state) {
  const metrics = state.snapshot.metrics;
  const movement = state.journal.at(-1)?.movement;
  elements.canvasState.textContent = [
    movement
      ? `Current movement: ${movement.number}, ${movement.title}.`
      : 'The encounter has not begun.',
    'Seven nodes are arranged in a circular relational graph.',
    `Coherence ${formatMetric(metrics.H)}.`,
    `Turbulence ${formatMetric(metrics.tau)}.`,
    `Care field ${formatMetric(metrics.L)}.`,
    `Kohanist ${formatMetric(metrics.K)}.`
  ].join(' ');
}

function formatExhibitionTime(milliseconds) {
  const seconds = Math.ceil(Math.max(0, milliseconds) / 1000);
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(
    seconds % 60
  ).padStart(2, '0')}`;
}

function renderExhibition() {
  const score = exhibitionScore.getState();
  document.body.classList.toggle('exhibition-active', exhibitionActive);
  elements.exhibitionProgress.max = EXHIBITION_DURATION_MS;
  elements.exhibitionProgress.value = score.elapsedMs;
  elements.exhibitionTime.value = formatExhibitionTime(
    exhibitionActive ? score.remainingMs : EXHIBITION_DURATION_MS
  );
  elements.exhibitionButton.setAttribute(
    'aria-pressed',
    String(exhibitionActive && score.playing)
  );
  elements.exitExhibitionButton.hidden = !exhibitionActive;

  if (!exhibitionActive) {
    elements.exhibitionButton.textContent = 'Start five-minute score';
    elements.exhibitionStatus.textContent = (
      'Five deterministic cues, followed by a final interval for reflection.'
    );
    return;
  }
  if (score.completed) {
    elements.exhibitionButton.textContent = 'Replay five-minute score';
    elements.exhibitionStatus.textContent = (
      'Score complete. The final pattern and its provenance remain visible.'
    );
    return;
  }
  elements.exhibitionButton.textContent = score.playing
    ? 'Pause exhibition'
    : 'Resume exhibition';
  const awaiting = score.nextCueIndex < MOVEMENTS.length
    ? `cue ${score.nextCueIndex + 1} of ${MOVEMENTS.length} awaits`
    : 'final reflection interval';
  elements.exhibitionStatus.textContent = score.playing
    ? `Exhibition running · ${awaiting}.`
    : `Exhibition paused · ${awaiting}.`;
}

function renderCanvas(snapshot) {
  const { width, height } = elements.canvas;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.34;
  const fields = snapshot.fields;
  const positions = fields.q.map((_, index) => {
    const angle = -Math.PI / 2 + index / fields.q.length * Math.PI * 2;
    return {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius
    };
  });

  context.clearRect(0, 0, width, height);

  const centerGlow = context.createRadialGradient(
    centerX,
    centerY,
    0,
    centerX,
    centerY,
    radius * 0.88
  );
  centerGlow.addColorStop(0, `rgba(216, 255, 101, ${0.025 + snapshot.metrics.H * 0.055})`);
  centerGlow.addColorStop(1, 'rgba(216, 255, 101, 0)');
  context.fillStyle = centerGlow;
  context.fillRect(0, 0, width, height);

  snapshot.edges.forEach(([from, to], edgeIndex) => {
    const start = positions[from];
    const end = positions[to];
    const coherence = Math.min(1, Math.abs(fields.coherence[edgeIndex] || 0));
    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.strokeStyle = `rgba(240, 237, 228, ${0.13 + coherence * 0.42})`;
    context.lineWidth = 1 + coherence * 2.5;
    context.stroke();
  });

  positions.forEach((position, index) => {
    const intent = Math.max(0, Math.min(1.8, fields.q[index]));
    const care = Math.max(0, Math.min(1, fields.heart[index]));
    const size = 12 + intent * 16;
    const glowRadius = size * (2.3 + care * 1.8);
    const glow = context.createRadialGradient(
      position.x,
      position.y,
      0,
      position.x,
      position.y,
      glowRadius
    );
    glow.addColorStop(0, `rgba(255, 129, 104, ${0.22 + care * 0.48})`);
    glow.addColorStop(0.24, `rgba(255, 129, 104, ${care * 0.15})`);
    glow.addColorStop(1, 'rgba(255, 129, 104, 0)');
    context.fillStyle = glow;
    context.fillRect(
      position.x - glowRadius,
      position.y - glowRadius,
      glowRadius * 2,
      glowRadius * 2
    );

    context.beginPath();
    context.arc(position.x, position.y, size, 0, Math.PI * 2);
    context.fillStyle = '#f0ede4';
    context.fill();
    context.strokeStyle = `rgba(216, 255, 101, ${0.3 + care * 0.7})`;
    context.lineWidth = 1.5;
    context.stroke();

    const phase = fields.theta[index];
    context.beginPath();
    context.moveTo(position.x, position.y);
    context.lineTo(
      position.x + Math.cos(phase) * size * 0.72,
      position.y + Math.sin(phase) * size * 0.72
    );
    context.strokeStyle = '#12130f';
    context.lineWidth = 2;
    context.stroke();

    context.fillStyle = '#9b9d91';
    context.font = '11px SFMono-Regular, Consolas, monospace';
    context.textAlign = 'center';
    context.fillText(
      String(index + 1).padStart(2, '0'),
      position.x,
      position.y + size + 18
    );
  });

  const coherenceRadius = 18 + snapshot.metrics.H * 34;
  context.beginPath();
  context.arc(centerX, centerY, coherenceRadius, 0, Math.PI * 2);
  context.strokeStyle = `rgba(216, 255, 101, ${0.3 + snapshot.metrics.H * 0.65})`;
  context.lineWidth = 1.5;
  context.stroke();
  context.fillStyle = '#d8ff65';
  context.font = '12px SFMono-Regular, Consolas, monospace';
  context.textAlign = 'center';
  context.fillText('H', centerX, centerY + 4);
}

function renderJournal(entries) {
  elements.journalEmpty.hidden = entries.length > 0;
  elements.journal.replaceChildren();

  for (const entry of entries) {
    const item = document.createElement('li');
    item.className = 'journal-entry';

    const index = document.createElement('span');
    index.className = 'journal-index';
    index.textContent = String(entry.sequence).padStart(2, '0');

    const identity = document.createElement('div');
    const title = document.createElement('h3');
    title.textContent = `${entry.movement.number} · ${entry.movement.title}`;
    const line = document.createElement('p');
    line.textContent = entry.movement.line;
    identity.append(title, line);

    const authority = document.createElement('div');
    authority.className = 'journal-authority';
    const actor = document.createElement('p');
    actor.textContent = `actor · ${entry.provenance.actor}`;
    const boundary = document.createElement('p');
    boundary.textContent = `authority · ${entry.provenance.authority}`;
    authority.append(actor, boundary);

    const delta = document.createElement('dl');
    delta.className = 'journal-delta';
    for (const metric of ['H', 'tau', 'L', 'K']) {
      const wrapper = document.createElement('div');
      const term = document.createElement('dt');
      term.textContent = `Δ${metric}`;
      const value = document.createElement('dd');
      value.textContent = formatDelta(entry.delta[metric]);
      value.className = entry.delta[metric] > 0
        ? 'positive'
        : entry.delta[metric] < 0 ? 'negative' : '';
      wrapper.append(term, value);
      delta.append(wrapper);
    }

    item.append(index, identity, authority, delta);
    elements.journal.append(item);
  }
}

function renderAfterimageFormState(state = encounter.getState()) {
  const reflection = elements.afterimageReflection.value.trim();
  const reflectionValid = (
    reflection.length >= 1
    && reflection.length <= AFTERIMAGE_LIMITS.maxReflectionChars
  );
  const archiveFull = (
    afterimageArchive.valid
    && afterimageArchive.entries.length >= AFTERIMAGE_LIMITS.maxEntries
  );
  const ready = (
    state.completed
    && afterimageStore
    && afterimageArchive.valid
    && !afterimageArchive.loading
    && !archiveFull
    && reflectionValid
    && elements.afterimageConsent.checked
    && !afterimageBusy
  );
  elements.afterimageRememberButton.disabled = !ready;

  if (afterimageBusy) {
    elements.afterimageFormStatus.textContent = 'Verifying and storing locally…';
  } else if (afterimageFailure) {
    elements.afterimageFormStatus.textContent = afterimageFailure;
  } else if (!afterimageStore) {
    elements.afterimageFormStatus.textContent = (
      'Local storage is unavailable. Nothing can be remembered here.'
    );
  } else if (afterimageArchive.loading) {
    elements.afterimageFormStatus.textContent = (
      'Reading and verifying the local archive…'
    );
  } else if (!afterimageArchive.valid) {
    elements.afterimageFormStatus.textContent = (
      'The existing archive failed verification. It will not be reused or overwritten.'
    );
  } else if (archiveFull) {
    elements.afterimageFormStatus.textContent = (
      'The archive is full. Export it, then erase it explicitly before adding more.'
    );
  } else if (!state.completed) {
    elements.afterimageFormStatus.textContent = (
      'Complete all five movements before leaving an afterimage.'
    );
  } else if (!reflectionValid) {
    elements.afterimageFormStatus.textContent = (
      `Write a reflection of 1-${AFTERIMAGE_LIMITS.maxReflectionChars} characters.`
    );
  } else if (!elements.afterimageConsent.checked) {
    elements.afterimageFormStatus.textContent = (
      'Confirm device-local storage to remember this encounter.'
    );
  } else {
    elements.afterimageFormStatus.textContent = (
      `Ready to remember seed ${state.seed}; no network request will be made.`
    );
  }
}

function formatAfterimageDate(timestamp) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(timestamp));
}

function renderArrivalAfterimage() {
  if (!arrivalAfterimage) {
    elements.afterimageEcho.hidden = true;
    return;
  }
  const { content } = arrivalAfterimage;
  elements.afterimageEchoText.textContent = `“${content.reflection.text}”`;
  elements.afterimageEchoOrigin.textContent = (
    `${content.encounter.seed} · ${content.encounter.gesture} · ${
      formatAfterimageDate(content.createdAt)
    } · visitor-authored reflection`
  );
  elements.afterimageEcho.hidden = false;
}

function renderAfterimageArchive() {
  const entries = afterimageArchive.entries;
  elements.afterimageCount.value = (
    `${entries.length} / ${AFTERIMAGE_LIMITS.maxEntries}`
  );
  elements.afterimageList.replaceChildren();

  if (afterimageArchive.loading) {
    elements.afterimageArchiveStatus.textContent = (
      'Reading the local archive…'
    );
  } else if (!afterimageArchive.valid) {
    elements.afterimageArchiveStatus.textContent = (
      `${afterimageArchive.error} The archive is not being used.`
    );
  } else if (entries.length === 0) {
    elements.afterimageArchiveStatus.textContent = (
      'No afterimages are stored in this browser profile.'
    );
  } else {
    elements.afterimageArchiveStatus.textContent = (
      `${entries.length} integrity-verified local ${
        entries.length === 1 ? 'afterimage' : 'afterimages'
      }. Newest is shown first.`
    );
  }

  for (const entry of [...entries].reverse()) {
    const { content } = entry;
    const item = document.createElement('li');

    const identity = document.createElement('div');
    identity.className = 'afterimage-identity';
    const seed = document.createElement('strong');
    seed.textContent = content.encounter.seed;
    const time = document.createElement('time');
    time.dateTime = content.createdAt;
    time.textContent = formatAfterimageDate(content.createdAt);
    identity.append(seed, time);

    const reflection = document.createElement('blockquote');
    reflection.textContent = `“${content.reflection.text}”`;

    const metrics = document.createElement('dl');
    metrics.className = 'afterimage-metrics';
    for (const name of ['H', 'tau', 'L', 'K']) {
      const wrapper = document.createElement('div');
      const term = document.createElement('dt');
      term.textContent = name;
      const value = document.createElement('dd');
      value.textContent = formatMetric(content.encounter.finalMetrics[name]);
      wrapper.append(term, value);
      metrics.append(wrapper);
    }

    const evidence = document.createElement('div');
    evidence.className = 'afterimage-evidence';
    const authority = document.createElement('p');
    authority.textContent = (
      `${content.encounter.gesture} · ${content.reflection.authority}`
    );
    const identifier = document.createElement('code');
    identifier.textContent = `${entry.id.slice(0, 19)}…`;
    identifier.title = entry.id;
    evidence.append(authority, identifier);

    item.append(identity, reflection, metrics, evidence);
    elements.afterimageList.append(item);
  }

  elements.afterimageExportButton.disabled = (
    !afterimageArchive.valid || entries.length === 0 || afterimageBusy
  );
  elements.afterimageEraseButton.disabled = (
    !afterimageStore
    || afterimageArchive.loading
    || (afterimageArchive.valid && entries.length === 0)
    || afterimageBusy
  );
  renderArrivalAfterimage();
  renderAfterimageFormState();
}

async function loadAfterimages(captureArrival = false) {
  if (!afterimageStore) {
    afterimageArchive.loading = false;
    renderAfterimageArchive();
    return;
  }
  afterimageArchive = {
    ...await afterimageStore.inspect(),
    loading: false
  };
  if (captureArrival && afterimageArchive.valid) {
    arrivalAfterimage = afterimageArchive.entries.at(-1) ?? null;
  }
  renderAfterimageArchive();
}

async function rememberAfterimage(event) {
  event.preventDefault();
  const state = encounter.getState();
  renderAfterimageFormState(state);
  if (elements.afterimageRememberButton.disabled) return;

  afterimageBusy = true;
  afterimageFailure = null;
  renderAfterimageArchive();
  try {
    await afterimageStore.remember({
      seed: state.seed,
      gesture: encounter.gestureId,
      movementCount: state.journal.length,
      finalMetrics: Object.fromEntries(
        ['H', 'tau', 'L', 'K'].map(name => [name, state.snapshot.metrics[name]])
      ),
      reflection: elements.afterimageReflection.value
    });
    elements.afterimageReflection.value = '';
    elements.afterimageConsent.checked = false;
    await loadAfterimages();
    announce(
      'Afterimage stored in this browser profile. No network request was made.'
    );
  } catch (error) {
    afterimageFailure = (
      `Afterimage was not stored: ${error.message}`
    );
    announce('Afterimage was not stored.');
  } finally {
    afterimageBusy = false;
    renderAfterimageArchive();
  }
}

async function exportAfterimages() {
  try {
    const data = await afterimageStore.export();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'consciousness-mesh-afterimages.json';
    anchor.click();
    URL.revokeObjectURL(url);
    announce('Verified local afterimage archive exported.');
  } catch (error) {
    announce(`Afterimage archive could not be exported: ${error.message}`);
  }
}

async function eraseAfterimages() {
  if (!afterimageStore) return;
  const confirmed = window.confirm(
    'Erase every Consciousness Mesh afterimage stored in this browser profile?'
  );
  if (!confirmed) {
    announce('Local afterimages were kept.');
    return;
  }
  try {
    afterimageStore.clear();
    arrivalAfterimage = null;
    await loadAfterimages();
    announce('All local afterimages were erased from this browser profile.');
  } catch {
    announce('Local afterimages could not be erased.');
  }
}

function updateUrl() {
  const url = new URL(window.location.href);
  url.searchParams.set('seed', encounter.seed);
  url.searchParams.set('gesture', encounter.gestureId);
  if (exhibitionActive) {
    url.searchParams.set('mode', 'exhibition');
  } else {
    url.searchParams.delete('mode');
  }
  window.history.replaceState({}, '', url);
}

function resetEncounter() {
  stopPlayback();
  const seed = cleanSeed(elements.seedInput.value);
  const gesture = selectedGesture();
  elements.seedInput.value = seed;
  encounter = new CanonicalEncounter({ seed, gesture });
}

function restart() {
  resetEncounter();
  if (exhibitionActive) {
    exhibitionScore.restart(performance.now());
    scheduleExhibitionTick();
  }
  updateUrl();
  render();
  announce(
    exhibitionActive
      ? `Five-minute exhibition restarted with seed ${encounter.seed}.`
      : `Encounter reset with seed ${encounter.seed}.`
  );
}

function advance() {
  if (encounter.completed) return;
  encounter.setGesture(selectedGesture());
  const entry = encounter.advance();
  updateUrl();
  render();
  announce(`Movement ${entry.movement.number}, ${entry.movement.title}, complete.`);
}

function playNext() {
  if (encounter.completed) {
    restart();
  }
  advance();
  if (!encounter.completed && playTimer) {
    playTimer = window.setTimeout(playNext, 1100);
  } else {
    stopPlayback();
  }
}

function togglePlayback() {
  if (playTimer) {
    stopPlayback();
    return;
  }
  if (encounter.completed) restart();
  playTimer = window.setTimeout(playNext, 30);
  render();
}

function stopPlayback() {
  if (playTimer) window.clearTimeout(playTimer);
  playTimer = null;
  elements.playButton.textContent = encounter.completed ? 'Play again' : 'Play all';
}

function clearExhibitionTimer() {
  if (exhibitionTimer) window.clearTimeout(exhibitionTimer);
  exhibitionTimer = null;
}

function scheduleExhibitionTick() {
  clearExhibitionTimer();
  if (!exhibitionActive || !exhibitionScore.getState().playing) return;
  exhibitionTimer = window.setTimeout(
    exhibitionTick,
    prefersReducedMotion.matches ? 1000 : 250
  );
}

function applyExhibitionUpdate(update) {
  for (const cueIndex of update.enteredCueIndexes) {
    if (cueIndex === encounter.movementIndex && !encounter.completed) {
      advance();
    }
  }
  renderExhibition();
  if (update.state.completed) {
    clearExhibitionTimer();
    announce(
      'Five-minute exhibition complete. The provenance trace remains available.'
    );
  }
}

function exhibitionTick() {
  const update = exhibitionScore.advance(performance.now());
  applyExhibitionUpdate(update);
  scheduleExhibitionTick();
}

function beginExhibition() {
  clearExhibitionTimer();
  resetEncounter();
  exhibitionActive = true;
  exhibitionScore = new ExhibitionScore();
  exhibitionScore.start(performance.now());
  updateUrl();
  render();
  scheduleExhibitionTick();
  announce(
    `Five-minute exhibition started with seed ${encounter.seed} and gesture ${
      GESTURES[encounter.gestureId].name
    }.`
  );
}

function pauseExhibition(reason = 'Exhibition paused.') {
  if (!exhibitionActive || !exhibitionScore.getState().playing) return;
  const update = exhibitionScore.pause(performance.now());
  applyExhibitionUpdate(update);
  clearExhibitionTimer();
  renderExhibition();
  announce(reason);
}

function toggleExhibition() {
  const state = exhibitionScore.getState();
  if (!exhibitionActive || state.completed) {
    beginExhibition();
    return;
  }
  if (state.playing) {
    pauseExhibition();
    return;
  }
  exhibitionScore.start(performance.now());
  renderExhibition();
  scheduleExhibitionTick();
  announce('Exhibition resumed.');
}

function exitExhibition() {
  if (!exhibitionActive) return;
  pauseExhibition('Exhibition paused before exit.');
  clearExhibitionTimer();
  exhibitionActive = false;
  exhibitionScore = new ExhibitionScore();
  updateUrl();
  render();
  announce('Exhibition mode exited. Manual controls are available.');
}

function createNewSeed() {
  const words = ['reciprocity', 'witness', 'care', 'threshold', 'echo', 'garden'];
  const word = words[Math.floor(Math.random() * words.length)];
  const suffix = Math.floor(Math.random() * 999).toString().padStart(3, '0');
  elements.seedInput.value = `${word}-${suffix}`;
  restart();
}

async function copySeededLink() {
  updateUrl();
  try {
    await navigator.clipboard.writeText(window.location.href);
    announce('Seeded link copied.');
    elements.copyLinkButton.textContent = 'Copied';
    window.setTimeout(() => {
      elements.copyLinkButton.textContent = 'Copy seeded link';
    }, 1400);
  } catch {
    announce('Could not copy automatically. The seeded link is in the address bar.');
  }
}

function exportJournal() {
  const exported = encounter.exportJournal();
  const data = JSON.stringify({
    ...exported,
    presentation: exhibitionActive
      ? {
          version: EXHIBITION_SCORE_VERSION,
          mode: 'five-minute exhibition',
          durationMs: EXHIBITION_DURATION_MS,
          timingAffectsSimulation: false
        }
      : {
          mode: 'manual',
          timingAffectsSimulation: false
        }
  }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `consciousness-mesh-${encounter.seed}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
  announce('Provenance journal exported.');
}

function announce(message) {
  elements.liveStatus.textContent = message;
}

elements.nextButton.addEventListener('click', advance);
elements.playButton.addEventListener('click', togglePlayback);
elements.restartButton.addEventListener('click', restart);
elements.newSeedButton.addEventListener('click', createNewSeed);
elements.copyLinkButton.addEventListener('click', copySeededLink);
elements.exportButton.addEventListener('click', exportJournal);
elements.exhibitionButton.addEventListener('click', toggleExhibition);
elements.exitExhibitionButton.addEventListener('click', exitExhibition);
elements.afterimageForm.addEventListener('submit', rememberAfterimage);
elements.afterimageReflection.addEventListener('input', () => {
  afterimageFailure = null;
  renderAfterimageFormState();
});
elements.afterimageConsent.addEventListener('change', () => {
  afterimageFailure = null;
  renderAfterimageFormState();
});
elements.afterimageExportButton.addEventListener('click', exportAfterimages);
elements.afterimageEraseButton.addEventListener('click', eraseAfterimages);
elements.seedInput.addEventListener('change', restart);

for (const input of document.querySelectorAll('input[name="gesture"]')) {
  input.addEventListener('change', () => {
    if (encounter.movementIndex <= 2) {
      encounter.setGesture(input.value);
      updateUrl();
      render();
    }
  });
}

document.addEventListener('keydown', event => {
  if (event.target.closest?.('input, button, a, select, textarea')) return;
  if (event.key.toLowerCase() === 'n' && !exhibitionActive) advance();
  if (event.key.toLowerCase() === 'r') restart();
  if (event.key === 'Escape' && exhibitionActive) {
    pauseExhibition('Exhibition paused with Escape.');
  }
  if (event.key === ' ') {
    event.preventDefault();
    if (exhibitionActive) {
      toggleExhibition();
    } else {
      togglePlayback();
    }
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden && exhibitionActive) {
    pauseExhibition('Exhibition paused because the page is hidden.');
  }
});

createMovementList();
updateUrl();
render();
loadAfterimages(true);
if (requestedExhibitionMode) beginExhibition();
