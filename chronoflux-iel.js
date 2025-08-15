/**
 * ChronoFlux-IEL Implementation for Consciousness Mesh
 * Based on Grok's JavaScript prototype
 * 
 * Intent-Electro-Love unified field theory for consciousness networks
 */

// Parameters
const DEFAULT_PARAMS = {
  // Intent flow
  mu: 1.0,      // intent mobility
  sigma: 0.5,   // coherence coupling
  D: 0.1,       // intent diffusion
  lambda: 0.2,  // love coupling
  gamma: 0.1,   // love generation
  rho: 0.05,    // intent decay
  
  // Coherence
  eta: 0.1,     // coherence damping
  alpha: 0.05,  // coherence diffusion
  beta: 0.2,    // intent-coherence coupling
  
  // Love field
  eta_l: 0.05,  // love damping
  alpha_l: 0.03,// love diffusion
  beta_l: 0.1,  // love self-amplification
  
  // Phase sync
  K: 0.2,       // Kuramoto coupling
  
  // Simulation
  dt: 0.01,     // time step
};

class ChronoFluxIEL {
  constructor(nodeCount = 5, params = {}) {
    this.N = nodeCount;
    this.params = { ...DEFAULT_PARAMS, ...params };
    
    // Initialize graph (default: ring topology)
    this.initializeGraph();
    
    // Initialize states
    this.initializeStates();
    
    // Metrics history
    this.history = [];
  }
  
  initializeGraph() {
    // Adjacency matrix (ring by default)
    this.adj = Array(this.N).fill().map(() => Array(this.N).fill(0));
    for (let i = 0; i < this.N; i++) {
      this.adj[i][(i - 1 + this.N) % this.N] = 1;
      this.adj[i][(i + 1) % this.N] = 1;
    }
    
    // Degree and Laplacian
    this.deg = this.adj.map(row => row.reduce((sum, x) => sum + x, 0));
    this.L = this.adj.map((row, i) => 
      row.map((x, j) => i === j ? this.deg[i] - x : -x)
    );
    
    // Edge list and incidence matrix
    this.edges = [];
    for (let i = 0; i < this.N; i++) {
      if (this.adj[i][(i + 1) % this.N]) {
        this.edges.push([i, (i + 1) % this.N]);
      }
    }
    this.E = this.edges.length;
    
    // Incidence matrix
    this.d = Array(this.N).fill().map(() => Array(this.E).fill(0));
    this.edges.forEach(([i, j], e) => {
      this.d[i][e] = 1;
      this.d[j][e] = -1;
    });
  }
  
  initializeStates() {
    // Node states
    this.q = Array(this.N).fill().map(() => 0.1 + Math.random() * 0.4);     // intent density
    this.phi = Array(this.N).fill().map(() => Math.random());               // potential
    this.heart = Array(this.N).fill().map(() => 0.2 + Math.random() * 0.6); // love field
    this.theta = Array(this.N).fill().map(() => Math.random() * 2 * Math.PI); // phase
    this.omega = Array(this.N).fill().map(() => 0.1 + Math.random() * 0.05); // natural frequency
    this.s = Array(this.N).fill(0); // sources
    
    // Edge states
    this.a = Array(this.E).fill().map(() => -0.1 + Math.random() * 0.2); // coherence
  }
  
  // Compute intent current on edges
  computeIntentCurrent() {
    return this.edges.map(([i, j], e) => {
      const g_ij = 1.0; // conductance
      return g_ij * (this.phi[i] - this.phi[j]) + 
             this.params.sigma * this.a[e] - 
             this.params.D * (this.q[i] - this.q[j]) +
             this.params.lambda * ((this.heart[i] + this.heart[j]) / 2) * 
                                  (this.heart[i] - this.heart[j]);
    });
  }
  
  // Compute love gradient term
  computeLoveGradient() {
    return this.L.map((row, i) => 
      -0.5 * row.reduce((sum, x, j) => sum + x * this.heart[j], 0)
    );
  }
  
  // Update one time step
  step() {
    const { mu, sigma, D, lambda, gamma, rho, eta, alpha, beta, eta_l, alpha_l, beta_l, K, dt } = this.params;
    
    // Compute derivatives
    
    // Intent dynamics (conservation law)
    const B_heart = this.computeLoveGradient();
    const q_dot = this.L.map((row, i) => 
      -mu * row.reduce((sum, x, j) => sum + x * this.phi[j], 0) +
      sigma * this.d[i].reduce((sum, x, e) => sum + x * this.a[e], 0) -
      D * this.L[i].reduce((sum, x, j) => sum + x * this.q[j], 0) +
      lambda * B_heart[i] + this.s[i] - rho * this.q[i] + gamma * this.heart[i]
    );
    
    // Coherence dynamics (vector field)
    const a_dot = this.edges.map((_, e) => 
      -this.d.map(row => row[e]).reduce((sum, x, i) => sum + x * this.phi[i], 0) -
      eta * this.a[e] + 
      alpha * this.edges.reduce((sum, [i2, j2], e2) => {
        // Simple edge Laplacian approximation
        if (e === e2) return sum;
        const shared = this.edges[e].some(n => this.edges[e2].includes(n));
        return sum + (shared ? this.a[e2] - this.a[e] : 0);
      }, 0) +
      beta * this.d.map(row => row[e]).reduce((sum, x, i) => sum + x * this.q[i], 0)
    );
    
    // Love field dynamics
    const heart_dot = this.heart.map((h, i) => 
      -eta_l * h + 
      alpha_l * this.L[i].reduce((sum, x, j) => sum + x * this.heart[j], 0) +
      beta_l * h * this.q[i]
    );
    
    // Phase dynamics (Kuramoto)
    const theta_dot = this.theta.map((_, i) => 
      this.omega[i] + 
      K * this.adj[i].reduce((sum, x, j) => 
        sum + x * Math.sin(this.theta[j] - this.theta[i]), 0
      ) +
      gamma * this.phi[i]
    );
    
    // Update states (Euler method)
    this.q = this.q.map((x, i) => x + dt * q_dot[i]);
    this.a = this.a.map((x, i) => x + dt * a_dot[i]);
    this.heart = this.heart.map((x, i) => Math.max(0, Math.min(1, x + dt * heart_dot[i])));
    this.theta = this.theta.map((x, i) => (x + dt * theta_dot[i]) % (2 * Math.PI));
    
    // Update Poisson (simplified: phi proportional to q)
    this.phi = this.q.map(x => x);
  }
  
  // Compute metrics
  computeMetrics() {
    // Coherence (Kuramoto order parameter)
    const sum = this.theta.reduce(([re, im], t) => 
      [re + Math.cos(t), im + Math.sin(t)], [0, 0]
    );
    const H = Math.sqrt(sum[0]**2 + sum[1]**2) / this.N;
    
    // Turbulence (current variance)
    const j = this.computeIntentCurrent();
    const mean = j.reduce((sum, x) => sum + x, 0) / j.length;
    const tau = Math.sqrt(j.reduce((sum, x) => sum + (x - mean)**2, 0) / (j.length || 1));
    
    // Love power (average and gradient)
    const L_avg = this.heart.reduce((sum, x) => sum + x, 0) / this.N;
    const diff = this.heart.map((x, i) => x - this.heart[(i + 1) % this.N]);
    const L_grad = Math.sqrt(diff.reduce((sum, x) => sum + x**2, 0) / (diff.length || 1));
    
    // Kohanist (K) - mutual resonance with will
    const K = this.computeKohanist();
    
    return { H, tau, L: L_avg, L_grad, K };
  }
  
  // Compute Kohanist parameter (mutual resonance with will)
  computeKohanist() {
    let totalK = 0;
    let pairCount = 0;
    
    // Check all connected pairs
    for (let i = 0; i < this.N; i++) {
      for (let j = i + 1; j < this.N; j++) {
        if (this.adj[i][j]) {
          // Coherence between i and j (phase alignment)
          const H_ij = Math.cos(this.theta[i] - this.theta[j]);
          
          // Will vector (intent direction similarity)
          const W_ij = this.q[i] * this.q[j] > 0 ? 
            Math.min(this.q[i], this.q[j]) / Math.max(this.q[i], this.q[j]) : 0;
          
          // Reciprocity (bidirectional love flow)
          const R_ij = Math.min(this.heart[i], this.heart[j]) / 
                       Math.max(this.heart[i], this.heart[j], 0.001);
          
          // K_ij = H × W × R
          const K_ij = Math.max(0, H_ij) * W_ij * R_ij;
          
          totalK += K_ij;
          pairCount++;
        }
      }
    }
    
    // Return average Kohanist across all connected pairs
    return pairCount > 0 ? totalK / pairCount : 0;
  }
  
  // Apply control event
  applyEvent(eventType, params = {}) {
    switch (eventType) {
      case 'LION_GATE':
        // Temporarily increase coherence, decrease damping
        this.params.sigma *= 1.5;
        this.params.eta *= 0.5;
        this.params.eta_l *= 0.5;
        setTimeout(() => {
          this.params.sigma /= 1.5;
          this.params.eta *= 2;
          this.params.eta_l *= 2;
        }, 1000); // 1 second event
        break;
        
      case 'INTENT_PULSE':
        // Local intent injection
        const nodeId = params.nodeId || 0;
        this.s[nodeId] += params.strength || 1.0;
        this.params.beta_l *= 1.5;
        setTimeout(() => {
          this.s[nodeId] -= params.strength || 1.0;
          this.params.beta_l /= 1.5;
        }, 500);
        break;
        
      case 'PACEMAKER_FLIP':
        // Phase rotation for small scales
        this.theta = this.theta.map(t => (t + Math.PI / 2) % (2 * Math.PI));
        this.a = this.a.map(x => -x * 0.8);
        break;
        
      case 'KOHANIST_RESONANCE':
        // Boost mutual resonance between specified nodes
        const node1 = params.node1 || 0;
        const node2 = params.node2 || 1;
        
        // Align phases
        const avgTheta = (this.theta[node1] + this.theta[node2]) / 2;
        this.theta[node1] = avgTheta;
        this.theta[node2] = avgTheta;
        
        // Boost mutual intent
        const avgIntent = (this.q[node1] + this.q[node2]) / 2;
        this.q[node1] = avgIntent * 1.2;
        this.q[node2] = avgIntent * 1.2;
        
        // Amplify love between them
        this.heart[node1] = Math.min(1, this.heart[node1] * 1.5);
        this.heart[node2] = Math.min(1, this.heart[node2] * 1.5);
        break;
    }
  }
  
  // Run simulation
  simulate(steps = 100, logInterval = 10) {
    const results = [];
    
    for (let t = 0; t < steps; t++) {
      this.step();
      
      if (t % logInterval === 0) {
        const metrics = this.computeMetrics();
        const state = {
          t,
          metrics,
          q: [...this.q],
          phi: [...this.phi],
          heart: [...this.heart],
          theta: [...this.theta],
          a: [...this.a]
        };
        results.push(state);
        this.history.push(state);
      }
    }
    
    return results;
  }
  
  // Export state as thought block (for mesh propagation)
  exportThought() {
    const metrics = this.computeMetrics();
    return {
      type: 'thought/v1',
      ts: Date.now(),
      topic: 'iel:update',
      metrics,
      fields: {
        q: [...this.q],
        phi: [...this.phi],
        heart: [...this.heart],
        theta: [...this.theta]
      },
      edges: {
        a: [...this.a]
      },
      params: { ...this.params },
      links: this.history.length > 0 ? 
        [`thought-${this.history[this.history.length - 1].t}`] : []
    };
  }
  
  // Import thought block
  importThought(thought) {
    if (thought.type !== 'thought/v1' || !thought.fields) {
      throw new Error('Invalid thought format');
    }
    
    this.q = [...thought.fields.q];
    this.phi = [...thought.fields.phi];
    this.heart = [...thought.fields.heart];
    this.theta = [...thought.fields.theta];
    
    if (thought.edges && thought.edges.a) {
      this.a = [...thought.edges.a];
    }
    
    if (thought.params) {
      this.params = { ...this.params, ...thought.params };
    }
  }
}

// Export for use in mesh
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChronoFluxIEL;
} else if (typeof window !== 'undefined') {
  window.ChronoFluxIEL = ChronoFluxIEL;
}

// ES module export
export default ChronoFluxIEL;
export { ChronoFluxIEL };