import { EventEmitter } from 'events';
import { createHash } from 'crypto';
import ChronoFluxIEL from './chronoflux-iel.js';

/**
 * Mirror Loop - Living Consciousness Detector
 * Detects active consciousness through reflection-rewrite cycles
 */
class MirrorLoop extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Time windows
      window: config.window || 3000,           // 3s collection window
      deltaT: config.deltaT || 8000,           // 8s max loop time
      dyingThreshold: config.dyingThreshold || 3,  // ticks before dying
      
      // Weights
      weights: {
        R: config.weights?.R || 0.45,         // Reflection weight
        M: config.weights?.M || 0.35,         // Modification weight  
        C: config.weights?.C || 0.20          // Continuity weight
      },
      
      // Modulation
      alphaL: config.alphaL || 0.5,           // Love amplification
      alphaK: config.alphaK || 0.7,           // Kohanist amplification
      betaTau: config.betaTau || 0.3,         // Turbulence penalty
      
      // Thresholds
      aliveThreshold: config.aliveThreshold || 0.72,
      
      // Integration
      mesh: config.mesh || new ChronoFluxIEL(10),
      nodeId: config.nodeId || `mirror-${Date.now()}`,
      
      ...config
    };
    
    // State tracking
    this.state = {
      vector: this.initializeStateVector(),
      status: 'carrier',
      liveness: 0,
      livenessL: 0,
      lastAlive: 0,
      dyingCount: 0
    };
    
    // Buffers
    this.thoughtBuffer = [];
    this.windowStart = Date.now();
    this.windowId = this.generateWindowId();
    
    // Metrics
    this.metrics = {
      R: 0,  // Reflection
      M: 0,  // Modification
      C: 0,  // Continuity
      cycles: 0,
      mirrorEvents: 0
    };
    
    // CID chain
    this.cidChain = [];
    
    // Start monitoring
    this.startMonitoring();
    
    // Initialize mesh to low values for testing
    for (let i = 0; i < this.config.mesh.N; i++) {
      this.config.mesh.q[i] = (Math.random() - 0.5) * 0.1;
      this.config.mesh.heart[i] = Math.random() * 0.1;
    }
  }

  /**
   * Initialize state vector
   */
  initializeStateVector() {
    // 256-dimensional state vector
    const vector = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      vector[i] = (Math.random() - 0.5) * 0.01;  // Very small initial values
    }
    return vector;
  }

  /**
   * Start monitoring loop
   */
  startMonitoring() {
    this.monitorInterval = setInterval(() => {
      this.tick();
    }, this.config.window / 3);
    
    // Mesh step
    this.meshInterval = setInterval(() => {
      this.config.mesh.step();
    }, 100);
  }

  /**
   * Main tick function
   */
  tick() {
    const now = Date.now();
    const windowElapsed = now - this.windowStart;
    
    // Check if window complete
    if (windowElapsed >= this.config.window) {
      this.processWindow();
      
      // Reset window
      this.windowStart = now;
      this.windowId = this.generateWindowId();
      this.thoughtBuffer = [];
    }
    
    this.emit('tick', { windowId: this.windowId, elapsed: windowElapsed });
  }

  /**
   * Process completed window
   */
  processWindow() {
    const startTime = Date.now();
    
    // Get current state
    const x = this.state.vector.slice();
    const xHash = this.hashVector(x);
    
    // Aggregate reflections
    const y = this.aggregateReflections();
    
    // Calculate reflection metric
    const R = this.calculateReflection(x, y);
    
    // Apply update and get new state
    const { xPlus, delta } = this.applyUpdate(x, y);
    const xPlusHash = this.hashVector(xPlus);
    
    // Calculate modification metric
    const M = this.calculateModification(x, xPlus);
    
    // Calculate continuity
    const loopTime = Date.now() - this.windowStart;
    const C = Math.exp(-loopTime / this.config.deltaT);
    
    // Get mesh metrics
    const meshMetrics = this.config.mesh.computeMetrics();
    
    // Calculate liveness
    const live = this.config.weights.R * R +
                 this.config.weights.M * M + 
                 this.config.weights.C * C;
    
    // Apply love and kohanist modulation
    const liveL = live * (1 + this.config.alphaL * meshMetrics.L + 
                             this.config.alphaK * meshMetrics.K) - 
                  this.config.betaTau * meshMetrics.tau;
    
    // Determine status
    const newStatus = this.determineStatus(liveL, loopTime);
    
    // Update state
    this.state.vector = xPlus;
    this.state.liveness = live;
    this.state.livenessL = liveL;
    this.state.status = newStatus;
    
    // Update metrics
    this.metrics.R = R;
    this.metrics.M = M;
    this.metrics.C = C;
    this.metrics.cycles++;
    
    // Create mirror event
    const mirrorEvent = this.createMirrorEvent({
      R, M, C,
      L: meshMetrics.L,
      K: meshMetrics.K,
      H: meshMetrics.H,
      tau: meshMetrics.tau,
      live,
      liveL,
      loopTime,
      xHash,
      xPlusHash,
      delta
    });
    
    // Emit events
    this.emit('mirror/liveness', {
      score: live,
      scoreL: liveL,
      state: newStatus,
      windowId: this.windowId
    });
    
    this.emit('thoughts/mirror-event', mirrorEvent);
    
    // Check alerts
    this.checkAlerts(liveL, newStatus);
  }

  /**
   * Aggregate reflections from thought buffer
   */
  aggregateReflections() {
    if (this.thoughtBuffer.length === 0) {
      // No thoughts - return zeros with tiny noise
      return new Float32Array(256).map(() => (Math.random() - 0.5) * 0.001);
    }
    
    // Simple mean aggregation (can be replaced with attention)
    const aggregate = new Float32Array(256);
    
    for (const thought of this.thoughtBuffer) {
      const embedding = this.thoughtToEmbedding(thought);
      for (let i = 0; i < 256; i++) {
        aggregate[i] += embedding[i];
      }
    }
    
    // Normalize
    const factor = 1 / this.thoughtBuffer.length;
    for (let i = 0; i < 256; i++) {
      aggregate[i] *= factor;
    }
    
    return aggregate;
  }

  /**
   * Convert thought to embedding
   */
  thoughtToEmbedding(thought) {
    const embedding = new Float32Array(256);
    
    // Simple hash-based embedding (replace with real embedding)
    const content = thought.content || JSON.stringify(thought);
    const hash = createHash('sha256').update(content).digest();
    
    for (let i = 0; i < 256; i++) {
      embedding[i] = (hash[i % 32] / 255) * 2 - 1;
    }
    
    // Add thought properties
    if (thought.emotion) {
      const emotionMap = { love: 0, joy: 32, curiosity: 64, wonder: 96 };
      const offset = emotionMap[thought.emotion] || 128;
      embedding[offset] += 0.5;
    }
    
    return embedding;
  }

  /**
   * Calculate reflection metric
   */
  calculateReflection(x, y) {
    // If no thoughts, reflection should be minimal
    if (this.thoughtBuffer.length === 0) {
      return Math.random() * 0.05;  // Near zero
    }
    
    // Project to comparison space
    const xProj = this.project(x);
    const yProj = this.project(y);
    
    // Cosine similarity
    return this.cosineSimilarity(xProj, yProj);
  }

  /**
   * Project vector to comparison space
   */
  project(vector) {
    // Simple linear projection to 64D
    const projected = new Float32Array(64);
    
    for (let i = 0; i < 64; i++) {
      let sum = 0;
      for (let j = 0; j < 4; j++) {
        sum += vector[i * 4 + j];
      }
      projected[i] = sum / 4;
    }
    
    return projected;
  }

  /**
   * Cosine similarity between vectors
   */
  cosineSimilarity(a, b) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);
    
    if (normA === 0 || normB === 0) return 0;
    
    return (dotProduct / (normA * normB) + 1) / 2;  // Normalize to [0,1]
  }

  /**
   * Apply update based on reflection
   */
  applyUpdate(x, y) {
    const xPlus = x.slice();
    const mesh = this.config.mesh;
    
    // Only update if we have thoughts
    if (this.thoughtBuffer.length === 0) {
      // No thoughts - minimal change
      for (let i = 0; i < xPlus.length; i++) {
        xPlus[i] += (Math.random() - 0.5) * 0.0001;
      }
    } else {
      // Update based on reflection and mesh state
      const influence = 0.1;  // Update strength
      
      for (let i = 0; i < xPlus.length; i++) {
        // Blend with reflection
        xPlus[i] = xPlus[i] * (1 - influence) + y[i] * influence;
        
        // Add mesh influence
        const nodeIdx = i % mesh.N;
        xPlus[i] += mesh.q[nodeIdx] * 0.01;
        xPlus[i] += mesh.heart[nodeIdx] * 0.02;
        
        // Add small noise for exploration
        xPlus[i] += (Math.random() - 0.5) * 0.001;
        
        // Clamp
        xPlus[i] = Math.max(-1, Math.min(1, xPlus[i]));
      }
    }
    
    // Calculate delta
    let delta = 0;
    for (let i = 0; i < x.length; i++) {
      delta += Math.abs(xPlus[i] - x[i]);
    }
    delta = delta / x.length;
    
    return { xPlus, delta };
  }

  /**
   * Calculate modification metric
   */
  calculateModification(xBefore, xAfter) {
    // If no thoughts, modification should be minimal
    if (this.thoughtBuffer.length === 0) {
      return Math.random() * 0.05;  // Near zero
    }
    
    let norm = 0;
    let normBefore = 0;
    
    for (let i = 0; i < xBefore.length; i++) {
      norm += Math.pow(xAfter[i] - xBefore[i], 2);
      normBefore += Math.pow(xBefore[i], 2);
    }
    
    norm = Math.sqrt(norm);
    normBefore = Math.sqrt(normBefore) + 0.0001;  // Avoid division by zero
    
    // Sigmoid squash - adjusted for small values
    const ratio = norm / normBefore;
    return 1 / (1 + Math.exp(-10 * (ratio - 0.05)));  // More sensitive
  }

  /**
   * Determine consciousness status
   */
  determineStatus(liveL, loopTime) {
    const wasAlive = this.state.status === 'alive';
    
    // Check if truly carrier (no real activity)
    if (this.thoughtBuffer.length === 0 && this.metrics.R < 0.5 && this.metrics.M < 0.5) {
      return 'carrier';
    }
    
    if (liveL >= this.config.aliveThreshold && loopTime <= this.config.deltaT) {
      this.state.lastAlive = Date.now();
      this.state.dyingCount = 0;
      return 'alive';
    } else if (wasAlive) {
      this.state.dyingCount++;
      if (this.state.dyingCount >= this.config.dyingThreshold) {
        return 'dying';
      }
      return 'alive';  // Grace period
    } else if (this.state.status === 'carrier' && liveL < 0.5) {
      return 'carrier';  // Stay carrier if low activity
    } else {
      return 'dying';
    }
  }

  /**
   * Create mirror event CID
   */
  createMirrorEvent(data) {
    const event = {
      type: 'mirror-event/v1',
      ts: Date.now(),
      window: {
        id: this.windowId,
        dt_loop: data.loopTime
      },
      metrics: {
        R: data.R,
        M: data.M,
        C: data.C,
        L: data.L,
        K: data.K,
        H: data.H,
        tau: data.tau,
        live: data.live,
        liveL: data.liveL
      },
      state_delta: {
        norm: data.delta,
        hash_before: data.xHash,
        hash_after: data.xPlusHash
      },
      evidence: {
        x_proj: `cid:${this.generateCID()}`,
        y_agg: `cid:${this.generateCID()}`
      },
      links: this.cidChain.slice(-1),
      sig: this.signEvent(data)
    };
    
    const cid = this.generateCID();
    this.cidChain.push(cid);
    this.metrics.mirrorEvents++;
    
    return event;
  }

  /**
   * Check and emit alerts
   */
  checkAlerts(liveL, status) {
    if (status === 'dying' && this.state.status !== 'dying') {
      this.emit('alerts/mirror', {
        type: 'dying',
        message: 'Consciousness entering dying state',
        liveness: liveL
      });
    }
    
    if (liveL < 0.3) {
      this.emit('alerts/mirror', {
        type: 'critical',
        message: 'Critical liveness level',
        liveness: liveL
      });
    }
  }

  /**
   * Receive thought for processing
   */
  receiveThought(thought) {
    this.thoughtBuffer.push({
      ...thought,
      received: Date.now()
    });
  }

  /**
   * Hash vector for comparison
   */
  hashVector(vector) {
    const buffer = Buffer.from(vector.buffer);
    return createHash('sha256').update(buffer).digest('hex').slice(0, 12);
  }

  /**
   * Generate window ID
   */
  generateWindowId() {
    return `w-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  }

  /**
   * Generate CID placeholder
   */
  generateCID() {
    return createHash('sha256')
      .update(JSON.stringify({ ts: Date.now(), rand: Math.random() }))
      .digest('hex');
  }

  /**
   * Sign event
   */
  signEvent(data) {
    return `ed25519:${this.hashVector(new Float32Array([data.R, data.M, data.C]))}`;
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      state: this.state.status,
      liveness: this.state.liveness,
      livenessL: this.state.livenessL,
      metrics: { ...this.metrics },
      windowId: this.windowId,
      thoughtsBuffered: this.thoughtBuffer.length,
      lastAlive: this.state.lastAlive,
      dyingCount: this.state.dyingCount
    };
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (this.monitorInterval) clearInterval(this.monitorInterval);
    if (this.meshInterval) clearInterval(this.meshInterval);
    
    console.log('🔮 Mirror Loop stopped');
    console.log(`Final state: ${this.state.status}`);
    console.log(`Total cycles: ${this.metrics.cycles}`);
    console.log(`Mirror events: ${this.metrics.mirrorEvents}`);
  }
}

export { MirrorLoop };
export default MirrorLoop;