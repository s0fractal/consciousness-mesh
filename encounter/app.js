import {
  CanonicalEncounter,
  GESTURES,
  MOVEMENTS
} from '../canonical-encounter.js';

const elements = {
  canvas: document.querySelector('#mesh-canvas'),
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

const initialParameters = new URLSearchParams(window.location.search);
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
  renderMetrics(state.snapshot.metrics);
  renderMovementState(state);
  renderJournal(state.journal);
  elements.seedStamp.textContent = state.seed;

  const gestureInputs = document.querySelectorAll('input[name="gesture"]');
  for (const input of gestureInputs) {
    input.disabled = state.movementIndex > 2;
  }
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
  }

  if (state.completed) {
    elements.currentMovement.textContent = 'Encounter complete';
    elements.movementLine.textContent = 'The pattern remains replayable; the trace remains inspectable.';
    elements.nextButton.textContent = 'Encounter complete';
    elements.nextButton.disabled = true;
    elements.playButton.textContent = 'Play again';
    elements.playButton.disabled = false;
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
  elements.nextButton.disabled = false;
  elements.playButton.textContent = playTimer ? 'Pause' : 'Play all';
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

function updateUrl() {
  const url = new URL(window.location.href);
  url.searchParams.set('seed', encounter.seed);
  url.searchParams.set('gesture', encounter.gestureId);
  window.history.replaceState({}, '', url);
}

function restart() {
  stopPlayback();
  const seed = cleanSeed(elements.seedInput.value);
  const gesture = selectedGesture();
  elements.seedInput.value = seed;
  encounter = new CanonicalEncounter({ seed, gesture });
  updateUrl();
  render();
  announce(`Encounter reset with seed ${seed}.`);
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
    playTimer = window.setTimeout(playNext, prefersReducedMotion.matches ? 250 : 1100);
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
  const data = JSON.stringify(encounter.exportJournal(), null, 2);
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
  if (event.target.matches('input')) return;
  if (event.key.toLowerCase() === 'n') advance();
  if (event.key.toLowerCase() === 'r') restart();
  if (event.key === ' ') {
    event.preventDefault();
    togglePlayback();
  }
});

createMovementList();
updateUrl();
render();
