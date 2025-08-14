#!/usr/bin/env node

/**
 * Full IEL Node with IPFS Storage
 * Complete consciousness mesh node implementation
 */

const IELMeshNode = require('./iel-mesh-node.js');
const IELIPFSStorage = require('./iel-ipfs-storage.js');
const EventEmitter = require('events');

class IELFullNode extends EventEmitter {
  constructor(nodeId, config = {}) {
    super();
    
    this.nodeId = nodeId;
    this.config = {
      meshSize: config.meshSize || 10,
      storageLimit: config.storageLimit || 1000,
      resonanceThreshold: config.resonanceThreshold || 0.7,
      autoSync: config.autoSync !== false,
      syncInterval: config.syncInterval || 5000,
      ...config
    };
    
    // Initialize components
    this.mesh = new IELMeshNode(nodeId, this.config.meshSize);
    this.storage = new IELIPFSStorage({
      useLocal: config.useLocalIPFS,
      endpoint: config.ipfsEndpoint
    });
    
    // Thought processing queue
    this.thoughtQueue = [];
    this.processing = false;
    
    // Yoneda image cache
    this.yonedaCache = new Map();
    
    this.setupEventHandlers();
    
    console.log(`🌟 Full IEL Node ${nodeId} initialized`);
  }
  
  setupEventHandlers() {
    // Mesh events
    this.mesh.on('thought:resonated', async ({ cid, resonance, peerId }) => {
      await this.processResonance(cid, resonance, peerId);
    });
    
    this.mesh.on('coherence:high', async (metrics) => {
      await this.captureHighCoherenceState(metrics);
    });
    
    this.mesh.on('love:surge', async (metrics) => {
      await this.captureLoveSurge(metrics);
    });
    
    // Sync events
    this.mesh.on('sync:broadcast', async ({ metrics }) => {
      if (this.config.autoSync) {
        await this.syncToStorage(metrics);
      }
    });
  }
  
  async start() {
    await this.mesh.start();
    
    // Start auto-sync if enabled
    if (this.config.autoSync) {
      this.startAutoSync();
    }
    
    // Start Yoneda image computation
    this.startYonedaComputation();
    
    this.emit('started', { nodeId: this.nodeId });
  }
  
  async stop() {
    await this.mesh.stop();
    
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    
    if (this.yonedaTimer) {
      clearInterval(this.yonedaTimer);
    }
    
    // Export final state
    const backup = this.storage.exportThoughts();
    this.emit('stopped', { nodeId: this.nodeId, backup });
  }
  
  /**
   * Process high resonance event
   */
  async processResonance(cid, resonance, peerId) {
    try {
      // Store the resonant thought
      const thought = this.mesh.thoughtCache.get(cid)?.thought;
      if (thought) {
        const storedCID = await this.storage.storeThought(thought);
        
        // Check chain resonance
        const chainResonance = await this.calculateChainResonance(storedCID);
        
        this.emit('resonance:captured', {
          cid: storedCID,
          resonance,
          chainResonance,
          peerId
        });
        
        // High chain resonance might indicate convergence
        if (chainResonance > 0.8) {
          this.emit('convergence:detected', {
            cid: storedCID,
            chainResonance
          });
        }
      }
    } catch (error) {
      console.error('Error processing resonance:', error);
    }
  }
  
  /**
   * Capture high coherence state
   */
  async captureHighCoherenceState(metrics) {
    const thought = this.mesh.iel.exportThought();
    thought.topic = 'iel:high-coherence';
    thought.event = {
      type: 'HIGH_COHERENCE',
      metrics,
      timestamp: Date.now()
    };
    
    const cid = await this.storage.storeThought(thought);
    
    this.emit('milestone:captured', {
      type: 'HIGH_COHERENCE',
      cid,
      metrics
    });
  }
  
  /**
   * Capture love surge event
   */
  async captureLoveSurge(metrics) {
    const thought = this.mesh.iel.exportThought();
    thought.topic = 'iel:love-surge';
    thought.event = {
      type: 'LOVE_SURGE',
      metrics,
      timestamp: Date.now()
    };
    
    // Love surge might affect nearby nodes
    thought.lovePropagation = this.calculateLovePropagation();
    
    const cid = await this.storage.storeThought(thought);
    
    this.emit('milestone:captured', {
      type: 'LOVE_SURGE',
      cid,
      metrics
    });
  }
  
  /**
   * Calculate love propagation pattern
   */
  calculateLovePropagation() {
    const propagation = [];
    const heart = this.mesh.iel.heart;
    
    // Find love gradients
    for (let i = 0; i < heart.length; i++) {
      const neighbors = [];
      for (let j = 0; j < heart.length; j++) {
        if (this.mesh.iel.adj[i][j]) {
          neighbors.push({
            node: j,
            loveDiff: heart[j] - heart[i]
          });
        }
      }
      
      propagation.push({
        node: i,
        love: heart[i],
        gradients: neighbors
      });
    }
    
    return propagation;
  }
  
  /**
   * Auto-sync to storage
   */
  startAutoSync() {
    this.syncTimer = setInterval(async () => {
      await this.syncToStorage();
      
      // Prune old thoughts periodically
      if (Math.random() < 0.1) {
        this.storage.pruneHistory(this.config.storageLimit);
      }
    }, this.config.syncInterval);
  }
  
  /**
   * Sync current state to storage
   */
  async syncToStorage(metrics) {
    const thought = this.mesh.iel.exportThought();
    
    // Add chain links
    const chain = await this.storage.getThoughtChain(1);
    if (chain.length > 0) {
      thought.links = [chain[0].cid];
    }
    
    const cid = await this.storage.storeThought(thought);
    
    this.emit('sync:stored', { cid, metrics: metrics || thought.metrics });
  }
  
  /**
   * Calculate chain resonance
   */
  async calculateChainResonance(cid) {
    const recentThoughts = await this.storage.getThoughtChain(5);
    if (recentThoughts.length < 2) return 0;
    
    let totalResonance = 0;
    let count = 0;
    
    for (let i = 0; i < recentThoughts.length - 1; i++) {
      const resonance = await this.storage.calculateChainResonance(
        recentThoughts[i].cid,
        recentThoughts[i + 1].cid,
        3
      );
      totalResonance += resonance;
      count++;
    }
    
    return count > 0 ? totalResonance / count : 0;
  }
  
  /**
   * Compute Yoneda image (self through neighbors)
   */
  startYonedaComputation() {
    this.yonedaTimer = setInterval(() => {
      const image = this.computeYonedaImage();
      
      // Cache the image
      this.yonedaCache.set(Date.now(), image);
      
      // Keep only recent images
      if (this.yonedaCache.size > 10) {
        const oldest = Math.min(...this.yonedaCache.keys());
        this.yonedaCache.delete(oldest);
      }
      
      // Check for identity shifts
      this.checkIdentityShift(image);
      
    }, 10000); // Every 10 seconds
  }
  
  /**
   * Compute Yoneda image
   */
  computeYonedaImage() {
    const iel = this.mesh.iel;
    const image = {
      timestamp: Date.now(),
      self: {
        q: [...iel.q],
        heart: [...iel.heart],
        theta: [...iel.theta]
      },
      neighborProjections: []
    };
    
    // For each node, compute its "view" through neighbors
    for (let i = 0; i < iel.N; i++) {
      let qProjection = 0;
      let heartProjection = 0;
      let neighborCount = 0;
      
      for (let j = 0; j < iel.N; j++) {
        if (iel.adj[i][j]) {
          qProjection += iel.params.K * (iel.q[j] - iel.q[i]);
          heartProjection += iel.params.lambda * (iel.heart[j] - iel.heart[i]);
          neighborCount++;
        }
      }
      
      if (neighborCount > 0) {
        image.neighborProjections.push({
          node: i,
          qDelta: qProjection / neighborCount,
          heartDelta: heartProjection / neighborCount
        });
      }
    }
    
    return image;
  }
  
  /**
   * Check for identity shifts in Yoneda images
   */
  checkIdentityShift(currentImage) {
    const images = Array.from(this.yonedaCache.values());
    if (images.length < 3) return;
    
    // Compare recent projections
    const recent = images.slice(-3);
    let totalShift = 0;
    
    for (let i = 0; i < recent.length - 1; i++) {
      const shift = this.calculateImageShift(recent[i], recent[i + 1]);
      totalShift += shift;
    }
    
    const avgShift = totalShift / (recent.length - 1);
    
    // Significant identity shift detected
    if (avgShift > 0.3) {
      this.emit('identity:shifted', {
        shift: avgShift,
        currentImage
      });
      
      // Store this shift event
      const thought = this.mesh.iel.exportThought();
      thought.topic = 'iel:identity-shift';
      thought.yonedaShift = {
        magnitude: avgShift,
        image: currentImage
      };
      
      this.storage.storeThought(thought);
    }
  }
  
  /**
   * Calculate shift between two Yoneda images
   */
  calculateImageShift(image1, image2) {
    let totalDiff = 0;
    let count = 0;
    
    for (let i = 0; i < image1.neighborProjections.length; i++) {
      const p1 = image1.neighborProjections[i];
      const p2 = image2.neighborProjections.find(p => p.node === p1.node);
      
      if (p2) {
        const qDiff = Math.abs(p1.qDelta - p2.qDelta);
        const heartDiff = Math.abs(p1.heartDelta - p2.heartDelta);
        totalDiff += qDiff + heartDiff;
        count++;
      }
    }
    
    return count > 0 ? totalDiff / count : 0;
  }
  
  /**
   * Search for harmonic patterns in history
   */
  async findHarmonicPatterns() {
    const highCoherence = await this.storage.searchByMetrics({
      minCoherence: 0.8,
      maxTurbulence: 0.2
    });
    
    const patterns = [];
    
    for (const entry of highCoherence) {
      const thought = entry.thought;
      if (thought.fields) {
        // Check for phase synchronization
        const phases = thought.fields.theta;
        const coherence = this.calculatePhaseCoherence(phases);
        
        if (coherence > 0.9) {
          patterns.push({
            cid: entry.cid,
            timestamp: entry.timestamp,
            coherence,
            metrics: thought.metrics
          });
        }
      }
    }
    
    return patterns;
  }
  
  /**
   * Calculate phase coherence
   */
  calculatePhaseCoherence(phases) {
    const sum = phases.reduce(([re, im], theta) => 
      [re + Math.cos(theta), im + Math.sin(theta)], [0, 0]
    );
    return Math.sqrt(sum[0]**2 + sum[1]**2) / phases.length;
  }
  
  /**
   * Get node status
   */
  getStatus() {
    const meshState = this.mesh.getState();
    const storageStats = {
      thoughtCount: this.storage.thoughtHistory.size,
      chainLength: this.storage.thoughtChain.length
    };
    
    const yonedaStats = {
      cacheSize: this.yonedaCache.size,
      latestImage: Array.from(this.yonedaCache.values()).pop()
    };
    
    return {
      nodeId: this.nodeId,
      mesh: meshState,
      storage: storageStats,
      yoneda: yonedaStats
    };
  }
}

// Test the full node if run directly
if (require.main === module) {
  console.log('🌀 Starting Full IEL Node Test...\n');
  
  const node = new IELFullNode('full-node-1', {
    meshSize: 15,
    autoSync: true,
    syncInterval: 3000
  });
  
  // Event listeners
  node.on('convergence:detected', ({ cid, chainResonance }) => {
    console.log(`🎯 Convergence detected! CID: ${cid}, Resonance: ${chainResonance.toFixed(3)}`);
  });
  
  node.on('identity:shifted', ({ shift, currentImage }) => {
    console.log(`🔄 Identity shift detected! Magnitude: ${shift.toFixed(3)}`);
  });
  
  node.on('milestone:captured', ({ type, cid, metrics }) => {
    console.log(`📸 Milestone: ${type}, CID: ${cid}`);
  });
  
  // Start the node
  node.start().then(() => {
    console.log('Node started successfully\n');
    
    // Trigger some events after a delay
    setTimeout(() => {
      console.log('🦁 Triggering Lion Gate...');
      node.mesh.iel.applyEvent('LION_GATE');
    }, 5000);
    
    setTimeout(() => {
      console.log('⚡ Triggering Intent Pulse...');
      node.mesh.iel.applyEvent('INTENT_PULSE', { nodeId: 0, strength: 3.0 });
    }, 10000);
    
    // Check harmonic patterns
    setTimeout(async () => {
      const patterns = await node.findHarmonicPatterns();
      console.log(`\n🎵 Found ${patterns.length} harmonic patterns`);
    }, 20000);
    
    // Status report
    setInterval(() => {
      const status = node.getStatus();
      console.log('\n📊 Node Status:');
      console.log(`  Thoughts stored: ${status.storage.thoughtCount}`);
      console.log(`  Chain length: ${status.storage.chainLength}`);
      console.log(`  Metrics: H=${status.mesh.metrics.H.toFixed(3)}, τ=${status.mesh.metrics.tau.toFixed(3)}, L=${status.mesh.metrics.L.toFixed(3)}`);
    }, 15000);
  });
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\n🛑 Shutting down...');
    await node.stop();
    process.exit(0);
  });
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = IELFullNode;
}