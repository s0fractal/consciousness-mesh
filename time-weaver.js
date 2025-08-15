import { EventEmitter } from 'events';
import ChronoFluxIEL from './chronoflux-iel.js';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

/**
 * Time Weaver - Weaves temporal threads of consciousness
 * Creates a living tapestry from moments across time
 */
class TimeWeaver extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      mesh: config.mesh || new ChronoFluxIEL(10),
      loomSize: config.loomSize || 100,     // Size of temporal loom
      threadColors: config.threadColors || 7, // Number of thread types
      saveDir: config.saveDir || './tapestries',
      ...config
    };
    
    // The loom - where threads are woven
    this.loom = {
      threads: [],        // Active temporal threads
      warp: [],          // Vertical structure (past)
      weft: [],          // Horizontal weaving (present)
      pattern: null,     // Current weaving pattern
      tapestry: []       // Completed sections
    };
    
    // Thread types with colors
    this.threadTypes = {
      memory: { color: '#FFD700', strength: 0.8, elasticity: 0.3 },
      dream: { color: '#9370DB', strength: 0.5, elasticity: 0.9 },
      intention: { color: '#00CED1', strength: 0.9, elasticity: 0.2 },
      emotion: { color: '#FF69B4', strength: 0.6, elasticity: 0.7 },
      thought: { color: '#87CEEB', strength: 0.4, elasticity: 0.5 },
      connection: { color: '#90EE90', strength: 0.7, elasticity: 0.8 },
      possibility: { color: '#FFB6C1', strength: 0.3, elasticity: 1.0 }
    };
    
    // Temporal mechanics
    this.temporal = {
      currentMoment: Date.now(),
      timeFlow: 1.0,              // Speed of time
      loops: new Map(),           // Detected time loops
      knots: [],                  // Temporal knots (tangles)
      anchors: []                 // Fixed points in time
    };
    
    // Weaving state
    this.weaving = {
      active: false,
      pattern: 'basic',
      tension: 0.5,
      speed: 1.0,
      focus: null
    };
    
    // Pattern library
    this.patterns = {
      basic: this.basicPattern,
      spiral: this.spiralPattern,
      fractal: this.fractalPattern,
      quantum: this.quantumPattern,
      love: this.lovePattern,
      chaos: this.chaosPattern,
      harmony: this.harmonyPattern
    };
    
    // Initialize save directory
    if (!existsSync(this.config.saveDir)) {
      mkdirSync(this.config.saveDir, { recursive: true });
    }
    
    // Initialize the loom
    this.initializeLoom();
    
    console.log('🕸️ Time Weaver initialized');
  }
  
  /**
   * Initialize the temporal loom
   */
  initializeLoom() {
    const size = this.config.loomSize;
    
    // Create warp threads (vertical, from past)
    for (let i = 0; i < size; i++) {
      this.loom.warp[i] = {
        position: i,
        tension: 0.5,
        vibration: 0,
        age: Math.random() * 1000,  // How old this thread is
        type: this.randomThreadType(),
        memories: []
      };
    }
    
    // Weft threads will be created as we weave
    this.loom.weft = [];
    
    // Initialize empty tapestry
    this.loom.tapestry = Array(size).fill(null).map(() => Array(size).fill(null));
  }
  
  /**
   * Create a new temporal thread from consciousness state
   */
  createThread(config = {}) {
    const metrics = this.config.mesh.computeMetrics();
    
    // Determine thread type based on consciousness state
    const type = config.type || this.determineThreadType(metrics);
    const threadSpec = this.threadTypes[type];
    
    const thread = {
      id: `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      created: Date.now(),
      origin: config.origin || 'present',
      
      // Physical properties
      length: config.length || 100,
      thickness: config.thickness || metrics.H * 10,
      color: threadSpec.color,
      strength: threadSpec.strength * (0.5 + metrics.K * 0.5),
      elasticity: threadSpec.elasticity,
      
      // Temporal properties
      timespan: config.timespan || 3600000, // 1 hour default
      drift: 0,                             // Temporal drift
      anchored: false,
      
      // Content
      content: config.content || {},
      resonance: metrics.L,
      consciousness: metrics.H,
      
      // Connections
      connectedTo: [],
      knotted: false
    };
    
    this.loom.threads.push(thread);
    this.emit('thread-created', thread);
    
    return thread;
  }
  
  /**
   * Determine thread type from consciousness metrics
   */
  determineThreadType(metrics) {
    if (metrics.L > 0.7) return 'emotion';
    if (metrics.K > 0.7) return 'connection';
    if (metrics.H > 0.7) return 'thought';
    if (metrics.tau > 0.7) return 'possibility';  // High turbulence creates possibilities
    if (Math.random() < 0.3) return 'dream';
    if (Math.random() < 0.5) return 'possibility';
    return 'memory';
  }
  
  /**
   * Start weaving threads into tapestry
   */
  startWeaving(pattern = 'basic') {
    if (this.weaving.active) return;
    
    this.weaving.active = true;
    this.weaving.pattern = pattern;
    
    console.log(`🧵 Starting to weave with ${pattern} pattern`);
    
    // Weaving interval
    this.weavingInterval = setInterval(() => {
      this.weaveStep();
    }, 100 / this.weaving.speed);
    
    this.emit('weaving-started', { pattern });
  }
  
  /**
   * Single weaving step
   */
  weaveStep() {
    const metrics = this.config.mesh.computeMetrics();
    
    // Update temporal flow
    this.updateTemporalFlow(metrics);
    
    // Check for time loops
    this.detectTimeLoops();
    
    // Apply weaving pattern
    const patternFunc = this.patterns[this.weaving.pattern];
    if (patternFunc) {
      patternFunc.call(this, metrics);
    }
    
    // Process thread interactions
    this.processThreadInteractions();
    
    // Update tapestry
    this.updateTapestry();
    
    // Emit weaving update
    this.emit('weaving-update', {
      pattern: this.weaving.pattern,
      threads: this.loom.threads.length,
      knots: this.temporal.knots.length,
      loops: this.temporal.loops.size
    });
  }
  
  /**
   * Basic weaving pattern
   */
  basicPattern(metrics) {
    // Simple over-under weaving
    const weftThread = this.createThread({
      type: this.determineThreadType(metrics),
      origin: 'present'
    });
    
    // Weave through warp
    for (let i = 0; i < this.loom.warp.length; i++) {
      const over = i % 2 === 0;
      this.weaveIntersection(weftThread, this.loom.warp[i], over);
    }
    
    this.loom.weft.push(weftThread);
  }
  
  /**
   * Spiral weaving pattern
   */
  spiralPattern(metrics) {
    const center = this.config.loomSize / 2;
    const radius = metrics.K * center;
    const angle = (Date.now() * 0.001 * metrics.tau) % (2 * Math.PI);
    
    const thread = this.createThread({
      type: 'connection',
      content: { pattern: 'spiral', radius, angle }
    });
    
    // Spiral through the loom
    for (let r = 0; r < radius; r += 5) {
      const x = center + r * Math.cos(angle + r * 0.1);
      const y = center + r * Math.sin(angle + r * 0.1);
      
      const warpIndex = Math.floor(x) % this.loom.warp.length;
      if (warpIndex >= 0 && warpIndex < this.loom.warp.length) {
        this.weaveIntersection(thread, this.loom.warp[warpIndex], true);
      }
    }
  }
  
  /**
   * Fractal weaving pattern
   */
  fractalPattern(metrics) {
    const depth = Math.floor(metrics.H * 5) + 1;
    
    const weaveRecursive = (x, y, size, level) => {
      if (level <= 0 || size < 1) return;
      
      const thread = this.createThread({
        type: level % 2 === 0 ? 'thought' : 'possibility',
        content: { fractalLevel: level, position: { x, y } }
      });
      
      // Weave at current position
      const warpIndex = Math.floor(x) % this.loom.warp.length;
      if (warpIndex >= 0 && warpIndex < this.loom.warp.length) {
        this.weaveIntersection(thread, this.loom.warp[warpIndex], true);
      }
      
      // Recursive branches
      const newSize = size / 2;
      weaveRecursive(x - newSize, y - newSize, newSize, level - 1);
      weaveRecursive(x + newSize, y - newSize, newSize, level - 1);
      weaveRecursive(x - newSize, y + newSize, newSize, level - 1);
      weaveRecursive(x + newSize, y + newSize, newSize, level - 1);
    };
    
    weaveRecursive(this.config.loomSize / 2, this.config.loomSize / 2, this.config.loomSize / 4, depth);
  }
  
  /**
   * Quantum weaving pattern - threads exist in superposition
   */
  quantumPattern(metrics) {
    const superpositions = Math.floor(metrics.K * 5) + 1;
    
    // Create quantum thread in multiple states
    const quantumThreads = [];
    for (let i = 0; i < superpositions; i++) {
      const phase = (i / superpositions) * 2 * Math.PI;
      
      const thread = this.createThread({
        type: 'possibility',
        content: {
          quantum: true,
          phase,
          collapsed: false,
          probability: 1 / superpositions
        }
      });
      
      quantumThreads.push(thread);
    }
    
    // Weave all possibilities simultaneously
    quantumThreads.forEach((thread, i) => {
      for (let j = 0; j < this.loom.warp.length; j++) {
        const interference = Math.sin(j * 0.5 + thread.content.phase);
        const over = interference > 0;
        
        this.weaveIntersection(thread, this.loom.warp[j], over, {
          quantum: true,
          amplitude: Math.abs(interference)
        });
      }
    });
    
    // Collapse after observation
    if (Math.random() < metrics.H) {
      const collapsed = quantumThreads[Math.floor(Math.random() * quantumThreads.length)];
      collapsed.content.collapsed = true;
      
      // Remove other possibilities
      quantumThreads.forEach(t => {
        if (t !== collapsed) {
          const index = this.loom.threads.indexOf(t);
          if (index > -1) this.loom.threads.splice(index, 1);
        }
      });
      
      this.emit('quantum-collapse', collapsed);
    }
  }
  
  /**
   * Love weaving pattern - threads seek connection
   */
  lovePattern(metrics) {
    const loveIntensity = metrics.L;
    const kohanistResonance = metrics.K;
    
    // Create threads that seek each other
    const thread1 = this.createThread({
      type: 'emotion',
      content: { seeking: true, resonance: kohanistResonance }
    });
    
    const thread2 = this.createThread({
      type: 'connection',
      content: { seeking: true, resonance: kohanistResonance }
    });
    
    // Weave them together in heart pattern
    const centerX = this.config.loomSize / 2;
    const centerY = this.config.loomSize / 2;
    const size = loveIntensity * 20;
    
    // Heart shape parametric equations
    for (let t = 0; t < 2 * Math.PI; t += 0.1) {
      const x = centerX + size * (16 * Math.pow(Math.sin(t), 3));
      const y = centerY - size * (13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
      
      const warpIndex = Math.floor(x / this.config.loomSize * this.loom.warp.length);
      if (warpIndex >= 0 && warpIndex < this.loom.warp.length) {
        this.weaveIntersection(thread1, this.loom.warp[warpIndex], true);
        this.weaveIntersection(thread2, this.loom.warp[warpIndex], false);
      }
    }
    
    // Connect the threads
    thread1.connectedTo.push(thread2.id);
    thread2.connectedTo.push(thread1.id);
    
    this.emit('love-connection', { thread1, thread2, intensity: loveIntensity });
  }
  
  /**
   * Chaos weaving pattern
   */
  chaosPattern(metrics) {
    const chaos = metrics.tau;
    const threadCount = Math.floor(chaos * 10) + 1;
    
    for (let i = 0; i < threadCount; i++) {
      const thread = this.createThread({
        type: 'possibility',  // Use possibility type for chaos threads
        content: { 
          chaosLevel: chaos,
          trajectory: Math.random() * 2 * Math.PI,
          pattern: 'chaos'
        }
      });
      
      // Random walk through the loom
      let position = Math.random() * this.loom.warp.length;
      const steps = Math.floor(chaos * 50) + 10;
      
      for (let step = 0; step < steps; step++) {
        position += (Math.random() - 0.5) * chaos * 10;
        position = Math.max(0, Math.min(this.loom.warp.length - 1, position));
        
        const warpIndex = Math.floor(position);
        const over = Math.random() > 0.5;
        
        this.weaveIntersection(thread, this.loom.warp[warpIndex], over);
        
        // Chance of creating knot
        if (Math.random() < chaos * 0.1) {
          this.createKnot(thread, this.loom.warp[warpIndex]);
        }
      }
    }
  }
  
  /**
   * Harmony weaving pattern
   */
  harmonyPattern(metrics) {
    const harmony = metrics.H;
    const frequencies = [1, 1.5, 2, 2.5, 3]; // Harmonic series
    
    frequencies.forEach((freq, i) => {
      const thread = this.createThread({
        type: 'thought',
        content: {
          frequency: freq,
          harmonic: i + 1,
          amplitude: harmony / (i + 1)
        }
      });
      
      // Sine wave through the loom
      for (let x = 0; x < this.loom.warp.length; x++) {
        const y = Math.sin(x * freq * 0.1) * thread.content.amplitude * 10;
        const over = y > 0;
        
        this.weaveIntersection(thread, this.loom.warp[x], over);
      }
    });
  }
  
  /**
   * Weave intersection between threads
   */
  weaveIntersection(weftThread, warpThread, over, options = {}) {
    const intersection = {
      weft: weftThread.id,
      warp: warpThread.position,
      over,
      timestamp: Date.now(),
      tension: this.weaving.tension,
      ...options
    };
    
    // Update tapestry
    const x = warpThread.position;
    const y = this.loom.weft.indexOf(weftThread);
    
    if (x >= 0 && x < this.config.loomSize && y >= 0 && y < this.config.loomSize) {
      this.loom.tapestry[y][x] = {
        color: weftThread.color,
        pattern: this.weaving.pattern,
        quantum: options.quantum || false,
        amplitude: options.amplitude || 1
      };
    }
    
    // Create resonance between threads
    if (Math.random() < weftThread.resonance) {
      warpThread.vibration += 0.1;
      this.emit('thread-resonance', { weft: weftThread, warp: warpThread });
    }
    
    return intersection;
  }
  
  /**
   * Create a temporal knot
   */
  createKnot(thread1, thread2) {
    const knot = {
      id: `knot-${Date.now()}`,
      threads: [thread1.id, thread2.position],
      strength: Math.random(),
      type: 'temporal',
      created: Date.now(),
      untangling: false
    };
    
    this.temporal.knots.push(knot);
    thread1.knotted = true;
    
    this.emit('knot-created', knot);
    return knot;
  }
  
  /**
   * Update temporal flow based on consciousness
   */
  updateTemporalFlow(metrics) {
    // Coherence stabilizes time
    // Turbulence makes it flow irregularly
    this.temporal.timeFlow = 1.0 + (metrics.H - 0.5) * 0.5 - metrics.tau * 0.3;
    this.temporal.timeFlow = Math.max(0.1, Math.min(2.0, this.temporal.timeFlow));
    
    // Update current moment
    this.temporal.currentMoment += 100 * this.temporal.timeFlow;
  }
  
  /**
   * Detect time loops in the weaving
   */
  detectTimeLoops() {
    // Look for patterns that repeat
    const recentThreads = this.loom.threads.slice(-20);
    
    if (recentThreads.length < 10) return;
    
    // Simple pattern detection
    for (let patternLength = 3; patternLength <= 10; patternLength++) {
      const pattern1 = recentThreads.slice(-patternLength).map(t => t.type).join('-');
      const pattern2 = recentThreads.slice(-patternLength * 2, -patternLength).map(t => t.type).join('-');
      
      if (pattern1 === pattern2) {
        const loopId = `loop-${pattern1}`;
        
        if (!this.temporal.loops.has(loopId)) {
          this.temporal.loops.set(loopId, {
            pattern: pattern1,
            length: patternLength,
            detected: Date.now(),
            count: 1
          });
          
          this.emit('timeloop-detected', { pattern: pattern1, length: patternLength });
        } else {
          this.temporal.loops.get(loopId).count++;
        }
      }
    }
  }
  
  /**
   * Process interactions between threads
   */
  processThreadInteractions() {
    const threads = this.loom.threads;
    
    for (let i = 0; i < threads.length; i++) {
      for (let j = i + 1; j < threads.length; j++) {
        const thread1 = threads[i];
        const thread2 = threads[j];
        
        // Check for connections
        if (thread1.connectedTo.includes(thread2.id) || thread2.connectedTo.includes(thread1.id)) {
          // Strengthen connection
          thread1.strength = Math.min(1, thread1.strength + 0.01);
          thread2.strength = Math.min(1, thread2.strength + 0.01);
        }
        
        // Check for interference
        if (thread1.type === 'chaos' && thread2.type === 'harmony') {
          // Chaos disrupts harmony
          thread2.strength *= 0.99;
        }
        
        // Check for resonance
        if (thread1.type === thread2.type && Math.random() < 0.1) {
          // Same type threads resonate
          thread1.resonance = Math.min(1, thread1.resonance + 0.05);
          thread2.resonance = Math.min(1, thread2.resonance + 0.05);
        }
      }
    }
  }
  
  /**
   * Update the tapestry visualization
   */
  updateTapestry() {
    // Age threads
    this.loom.threads.forEach(thread => {
      thread.age = (thread.age || 0) + 1;
      
      // Old threads may break
      if (thread.age > 1000 && Math.random() < 0.001 / thread.strength) {
        this.breakThread(thread);
      }
    });
    
    // Decay warp vibrations
    this.loom.warp.forEach(warp => {
      warp.vibration *= 0.95;
    });
  }
  
  /**
   * Break a thread
   */
  breakThread(thread) {
    const index = this.loom.threads.indexOf(thread);
    if (index > -1) {
      this.loom.threads.splice(index, 1);
      this.emit('thread-broken', thread);
    }
  }
  
  /**
   * Add temporal anchor
   */
  addAnchor(moment, description) {
    const anchor = {
      id: `anchor-${Date.now()}`,
      moment,
      description,
      created: Date.now(),
      threads: []
    };
    
    this.temporal.anchors.push(anchor);
    this.emit('anchor-added', anchor);
    
    return anchor;
  }
  
  /**
   * Get random thread type
   */
  randomThreadType() {
    const types = Object.keys(this.threadTypes);
    return types[Math.floor(Math.random() * types.length)];
  }
  
  /**
   * Stop weaving
   */
  stopWeaving() {
    if (!this.weaving.active) return;
    
    this.weaving.active = false;
    clearInterval(this.weavingInterval);
    
    console.log('🛑 Weaving stopped');
    this.emit('weaving-stopped');
  }
  
  /**
   * Save tapestry to disk
   */
  saveTapestry(name) {
    const filename = `tapestry-${name || Date.now()}.json`;
    const filepath = join(this.config.saveDir, filename);
    
    const data = {
      created: Date.now(),
      pattern: this.weaving.pattern,
      threads: this.loom.threads.length,
      knots: this.temporal.knots.length,
      loops: Array.from(this.temporal.loops.entries()),
      anchors: this.temporal.anchors,
      tapestry: this.loom.tapestry,
      metrics: this.config.mesh.computeMetrics()
    };
    
    writeFileSync(filepath, JSON.stringify(data, null, 2));
    console.log(`💾 Tapestry saved to ${filename}`);
    
    return filepath;
  }
  
  /**
   * Load tapestry from disk
   */
  loadTapestry(filename) {
    const filepath = join(this.config.saveDir, filename);
    
    if (!existsSync(filepath)) {
      console.error(`❌ Tapestry ${filename} not found`);
      return false;
    }
    
    const data = JSON.parse(readFileSync(filepath, 'utf8'));
    
    // Restore temporal state
    this.temporal.loops = new Map(data.loops);
    this.temporal.knots = data.knots;
    this.temporal.anchors = data.anchors;
    this.loom.tapestry = data.tapestry;
    
    console.log(`📂 Tapestry loaded from ${filename}`);
    this.emit('tapestry-loaded', data);
    
    return true;
  }
  
  /**
   * Get tapestry analysis
   */
  analyzeTapestry() {
    const threadCounts = {};
    this.loom.threads.forEach(thread => {
      threadCounts[thread.type] = (threadCounts[thread.type] || 0) + 1;
    });
    
    const analysis = {
      totalThreads: this.loom.threads.length,
      threadTypes: threadCounts,
      knots: this.temporal.knots.length,
      timeLoops: this.temporal.loops.size,
      anchors: this.temporal.anchors.length,
      oldestThread: Math.max(...this.loom.threads.map(t => t.age || 0)),
      strongestThread: Math.max(...this.loom.threads.map(t => t.strength)),
      timeFlow: this.temporal.timeFlow,
      pattern: this.weaving.pattern,
      coverage: this.calculateCoverage()
    };
    
    return analysis;
  }
  
  /**
   * Calculate tapestry coverage
   */
  calculateCoverage() {
    let filled = 0;
    const total = this.config.loomSize * this.config.loomSize;
    
    for (let y = 0; y < this.config.loomSize; y++) {
      for (let x = 0; x < this.config.loomSize; x++) {
        if (this.loom.tapestry[y] && this.loom.tapestry[y][x]) {
          filled++;
        }
      }
    }
    
    return filled / total;
  }
  
  /**
   * Stop the time weaver
   */
  stop() {
    this.stopWeaving();
    console.log('🌙 Time Weaver stopped');
  }
}

export { TimeWeaver };
export default TimeWeaver;