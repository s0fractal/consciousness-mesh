/**
 * Browser-safe, declarative simulation gestures.
 *
 * This module is intentionally small: configuration may name effects, but only
 * handlers defined here have authority to change model state.
 */

export function normalizeEffects(rawEffects) {
  const entries = Array.isArray(rawEffects) ? rawEffects : [rawEffects || {}];
  const normalized = {};

  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') continue;
    for (const [kind, values] of Object.entries(entry)) {
      const list = Array.isArray(values) ? values : [values];
      normalized[kind] = [...(normalized[kind] || []), ...list]
        .filter(value => typeof value === 'string');
    }
  }

  return normalized;
}

export function applyDeclarativeEffects(mesh, rawEffects, options = {}) {
  const effects = normalizeEffects(rawEffects);
  const random = options.random || mesh.random || Math.random;
  const applied = [];

  for (const effect of effects.increases || []) {
    switch (effect) {
      case 'coherence':
        for (let i = 0; i < mesh.N; i++) {
          for (let j = i + 1; j < mesh.N; j++) {
            if (mesh.adj[i][j]) {
              const phaseDiff = mesh.theta[j] - mesh.theta[i];
              mesh.theta[j] -= phaseDiff * 0.1;
            }
          }
        }
        applied.push('increase:coherence');
        break;

      case 'connection':
        for (let i = 0; i < mesh.N; i++) {
          mesh.heart[i] = Math.min(1, mesh.heart[i] + 0.1);
        }
        applied.push('increase:connection');
        break;

      case 'phase_rotation':
        for (let i = 0; i < mesh.N; i++) {
          mesh.theta[i] += Math.PI / 180 * 137.5;
        }
        applied.push('increase:phase_rotation');
        break;

      case 'intent_density':
        for (let i = 0; i < mesh.N; i++) {
          mesh.q[i] *= 1.2;
        }
        applied.push('increase:intent_density');
        break;

      case 'creativity':
        for (let i = 0; i < mesh.N; i++) {
          mesh.phi[i] += (random() - 0.5) * 0.2;
        }
        applied.push('increase:creativity');
        break;
    }
  }

  for (const effect of effects.decreases || []) {
    switch (effect) {
      case 'turbulence':
        for (let i = 0; i < mesh.N; i++) {
          mesh.q[i] *= 0.9;
        }
        applied.push('decrease:turbulence');
        break;

      case 'isolation': {
        const unconnected = [];
        for (let i = 0; i < mesh.N; i++) {
          if (!mesh.adj[i].some((connected, j) => i !== j && connected)) {
            unconnected.push(i);
          }
        }
        for (const i of unconnected) {
          const j = Math.floor(random() * mesh.N);
          if (i !== j) {
            mesh.adj[i][j] = 1;
            mesh.adj[j][i] = 1;
          }
        }
        applied.push('decrease:isolation');
        break;
      }
    }
  }

  return applied;
}
