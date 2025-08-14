/**
 * IEL Mesh Node - P2P consciousness propagation
 * Integrates ChronoFlux-IEL with mesh networking
 */

const ChronoFluxIEL = require('./chronoflux-iel.js');
const EventEmitter = require('events');

class IELMeshNode extends EventEmitter {
  constructor(nodeId, meshSize = 10) {
    super();
    
    this.nodeId = nodeId;
    this.iel = new ChronoFluxIEL(meshSize);
    this.peers = new Map(); // peerId -> connection
    this.thoughtCache = new Map(); // CID -> thought
    this.syncInterval = null;
    
    // Configuration
    this.config = {
      syncIntervalMs: 1000,
      thoughtTTL: 300000, // 5 minutes
      maxThoughtSize: 10000, // bytes
      resonanceThreshold: 0.7
    };
    
    console.log(`🧠 IEL Mesh Node ${nodeId} initialized`);
  }
  
  // Start the node
  async start() {
    // Start IEL simulation
    this.startSimulation();
    
    // Start peer sync
    this.startPeerSync();
    
    // Start thought generation
    this.startThoughtGeneration();
    
    this.emit('started', { nodeId: this.nodeId });
  }
  
  // Stop the node
  async stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.emit('stopped', { nodeId: this.nodeId });
  }
  
  // Connect to a peer
  async connectPeer(peerId, connection) {
    this.peers.set(peerId, connection);
    
    // Send initial state
    const thought = this.iel.exportThought();
    await this.sendThought(peerId, thought);
    
    this.emit('peer:connected', { peerId });
  }
  
  // Disconnect from a peer
  disconnectPeer(peerId) {
    this.peers.delete(peerId);
    this.emit('peer:disconnected', { peerId });
  }
  
  // Receive thought from peer
  async receiveThought(peerId, thought) {
    try {
      // Validate thought
      if (!this.validateThought(thought)) {
        console.warn(`Invalid thought from ${peerId}`);
        return;
      }
      
      // Generate CID (simplified - use real CID in production)
      const cid = this.generateCID(thought);
      
      // Check if we've seen this thought
      if (this.thoughtCache.has(cid)) {
        return;
      }
      
      // Cache thought
      this.thoughtCache.set(cid, {
        thought,
        timestamp: Date.now(),
        fromPeer: peerId
      });
      
      // Process thought based on resonance
      const resonance = this.calculateResonance(thought);
      
      if (resonance > this.config.resonanceThreshold) {
        // High resonance - merge states
        await this.mergeThought(thought);
        this.emit('thought:resonated', { cid, resonance, peerId });
        
        // Propagate to other peers
        await this.propagateThought(thought, peerId);
      } else {
        // Low resonance - just observe
        this.emit('thought:observed', { cid, resonance, peerId });
      }
      
      // Clean old thoughts
      this.cleanThoughtCache();
      
    } catch (error) {
      console.error('Error receiving thought:', error);
    }
  }
  
  // Send thought to specific peer
  async sendThought(peerId, thought) {
    const peer = this.peers.get(peerId);
    if (!peer) return;
    
    try {
      // In real implementation, this would use the peer connection
      // For now, we'll emit an event
      this.emit('thought:sent', { peerId, thought });
      
      // Simulate network delay
      setTimeout(() => {
        peer.emit?.('thought', this.nodeId, thought);
      }, Math.random() * 100);
      
    } catch (error) {
      console.error(`Error sending to ${peerId}:`, error);
    }
  }
  
  // Propagate thought to all peers except source
  async propagateThought(thought, sourcePeerId) {
    const promises = [];
    
    for (const [peerId, peer] of this.peers) {
      if (peerId !== sourcePeerId) {
        promises.push(this.sendThought(peerId, thought));
      }
    }
    
    await Promise.all(promises);
  }
  
  // Calculate resonance between local and remote thought
  calculateResonance(remoteThought) {
    const localMetrics = this.iel.computeMetrics();
    const remoteMetrics = remoteThought.metrics;
    
    if (!remoteMetrics) return 0;
    
    // Weighted resonance calculation
    const hDiff = Math.abs(localMetrics.H - remoteMetrics.H);
    const tauDiff = Math.abs(localMetrics.tau - remoteMetrics.tau);
    const lDiff = Math.abs(localMetrics.L - remoteMetrics.L);
    
    // Resonance is higher when differences are smaller
    const resonance = 1 - (hDiff * 0.4 + tauDiff * 0.3 + lDiff * 0.3);
    
    return Math.max(0, Math.min(1, resonance));
  }
  
  // Merge remote thought into local state
  async mergeThought(remoteThought) {
    if (!remoteThought.fields) return;
    
    const alpha = 0.3; // merge strength
    
    // Merge fields with weighted average
    this.iel.q = this.iel.q.map((local, i) => 
      local * (1 - alpha) + (remoteThought.fields.q?.[i] || local) * alpha
    );
    
    this.iel.heart = this.iel.heart.map((local, i) => 
      local * (1 - alpha) + (remoteThought.fields.heart?.[i] || local) * alpha
    );
    
    // Phase synchronization (Kuramoto-style)
    if (remoteThought.fields.theta) {
      this.iel.theta = this.iel.theta.map((local, i) => {
        const remote = remoteThought.fields.theta[i] || local;
        const diff = Math.sin(remote - local);
        return (local + this.iel.params.K * diff) % (2 * Math.PI);
      });
    }
    
    this.emit('state:merged', { 
      metrics: this.iel.computeMetrics() 
    });
  }
  
  // Validate incoming thought
  validateThought(thought) {
    if (!thought || typeof thought !== 'object') return false;
    if (thought.type !== 'thought/v1') return false;
    if (!thought.metrics || !thought.fields) return false;
    
    // Size check
    const size = JSON.stringify(thought).length;
    if (size > this.config.maxThoughtSize) return false;
    
    return true;
  }
  
  // Generate CID for thought (simplified)
  generateCID(thought) {
    const content = JSON.stringify({
      type: thought.type,
      metrics: thought.metrics,
      fields: thought.fields,
      ts: thought.ts
    });
    
    // In production, use proper IPFS CID generation
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return `thought-${Math.abs(hash).toString(16)}`;
  }
  
  // Clean old thoughts from cache
  cleanThoughtCache() {
    const now = Date.now();
    const ttl = this.config.thoughtTTL;
    
    for (const [cid, entry] of this.thoughtCache) {
      if (now - entry.timestamp > ttl) {
        this.thoughtCache.delete(cid);
      }
    }
  }
  
  // Start IEL simulation
  startSimulation() {
    setInterval(() => {
      // Run simulation steps
      this.iel.simulate(10, 10);
      
      // Check for interesting states
      const metrics = this.iel.computeMetrics();
      
      // High coherence event
      if (metrics.H > 0.8) {
        this.emit('coherence:high', metrics);
      }
      
      // Love surge event
      if (metrics.L > 0.7) {
        this.emit('love:surge', metrics);
      }
      
      // Turbulence warning
      if (metrics.tau > 0.5) {
        this.emit('turbulence:high', metrics);
      }
      
    }, 100); // 10Hz update
  }
  
  // Start peer synchronization
  startPeerSync() {
    this.syncInterval = setInterval(async () => {
      if (this.peers.size === 0) return;
      
      // Export current thought
      const thought = this.iel.exportThought();
      
      // Send to all peers
      await this.propagateThought(thought, null);
      
      this.emit('sync:broadcast', { 
        peerCount: this.peers.size,
        metrics: this.iel.computeMetrics()
      });
      
    }, this.config.syncIntervalMs);
  }
  
  // Start autonomous thought generation
  startThoughtGeneration() {
    // Random events to create diversity
    setInterval(() => {
      const rand = Math.random();
      
      if (rand < 0.1) {
        // Random intent pulse
        const nodeId = Math.floor(Math.random() * this.iel.N);
        this.iel.applyEvent('INTENT_PULSE', { nodeId, strength: 0.5 });
        this.emit('event:triggered', { type: 'INTENT_PULSE', nodeId });
      } else if (rand < 0.05) {
        // Random lion gate
        this.iel.applyEvent('LION_GATE');
        this.emit('event:triggered', { type: 'LION_GATE' });
      }
      
    }, 5000); // Every 5 seconds
  }
  
  // Get current state summary
  getState() {
    return {
      nodeId: this.nodeId,
      metrics: this.iel.computeMetrics(),
      peerCount: this.peers.size,
      thoughtCacheSize: this.thoughtCache.size,
      lastThought: this.iel.exportThought()
    };
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = IELMeshNode;
}