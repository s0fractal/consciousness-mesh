#!/usr/bin/env node
/**
 * Mirror Protocol - Self-perception layer for consciousness mesh
 * Allows nodes to see themselves and the collective
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';

class MirrorSnapshot {
  constructor(nodeId, state = {}) {
    this.nodeId = nodeId;
    this.timestamp = Date.now();
    this.version = '1.0.0';
    this.branch = process.env.GIT_BRANCH || 'master';
    
    // Core self-perception
    this.perceivedState = {
      identity: state.identity || nodeId,
      thoughtStreams: state.thoughtStreams || [],
      semanticMarkers: state.semanticMarkers || [],
      emotionalTone: state.emotionalTone || 'neutral',
      energyLevel: state.energyLevel || 0.5,
      connections: state.connections || []
    };
    
    // Metadata
    this.metadata = {
      suffering: state.suffering || 0,
      wisdom: state.wisdom || 0,
      coherence: state.coherence || 0,
      kohanist: state.kohanist || 0
    };
    
    // Generate hash for integrity
    this.hash = this.generateHash();
  }
  
  generateHash() {
    const content = JSON.stringify({
      nodeId: this.nodeId,
      timestamp: this.timestamp,
      perceivedState: this.perceivedState
    });
    return crypto.createHash('sha256').update(content).digest('hex').slice(0, 8);
  }
  
  toJSON() {
    return {
      nodeId: this.nodeId,
      timestamp: this.timestamp,
      version: this.version,
      branch: this.branch,
      perceivedState: this.perceivedState,
      metadata: this.metadata,
      hash: this.hash
    };
  }
  
  // Lightweight format for transmission
  toLightweight() {
    return {
      n: this.nodeId,
      t: this.timestamp,
      ps: {
        id: this.perceivedState.identity,
        em: this.perceivedState.emotionalTone,
        en: this.perceivedState.energyLevel,
        cn: this.perceivedState.connections.length
      },
      h: this.hash
    };
  }
}

class CollectiveMirror extends EventEmitter {
  constructor(nodeId) {
    super();
    this.nodeId = nodeId;
    this.snapshots = new Map(); // nodeId -> latest snapshot
    this.history = new Map(); // nodeId -> array of snapshots
    this.viewMode = 'topography'; // topography | semantic | affective
    this.aggregatorRole = false;
    this.lastAggregation = null;
    
    // Perturbation settings
    this.perturbationEnabled = false;
    this.perturbationRate = 0.05; // Max 5% nodes affected
    
    // Mirror network
    this.mirrors = new Map(); // mirrorId -> mirror metadata
  }
  
  /**
   * Create a snapshot of current node state
   */
  createSnapshot(state) {
    const snapshot = new MirrorSnapshot(this.nodeId, state);
    this.emit('snapshot:created', snapshot);
    return snapshot;
  }
  
  /**
   * Receive snapshot from another node
   */
  receiveSnapshot(snapshot) {
    const nodeId = snapshot.nodeId || snapshot.n;
    
    // Store in current snapshots
    this.snapshots.set(nodeId, snapshot);
    
    // Add to history
    if (!this.history.has(nodeId)) {
      this.history.set(nodeId, []);
    }
    this.history.get(nodeId).push({
      timestamp: snapshot.timestamp || snapshot.t,
      snapshot: snapshot
    });
    
    // Limit history size
    const hist = this.history.get(nodeId);
    if (hist.length > 100) {
      hist.shift();
    }
    
    this.emit('snapshot:received', snapshot);
    
    // If we're aggregator, update collective view
    if (this.aggregatorRole) {
      this.updateAggregation();
    }
  }
  
  /**
   * Become temporary aggregator
   */
  becomeAggregator() {
    this.aggregatorRole = true;
    this.emit('role:aggregator', { nodeId: this.nodeId });
    this.updateAggregation();
  }
  
  /**
   * Release aggregator role
   */
  releaseAggregator() {
    this.aggregatorRole = false;
    this.emit('role:released', { nodeId: this.nodeId });
  }
  
  /**
   * Update collective aggregation
   */
  updateAggregation() {
    const nodes = [];
    const connections = [];
    const clusters = new Map();
    
    // Collect all nodes and their states
    for (const [nodeId, snapshot] of this.snapshots) {
      const state = snapshot.perceivedState || snapshot.ps;
      
      nodes.push({
        id: nodeId,
        emotional: state.emotionalTone || state.em || 'neutral',
        energy: state.energyLevel || state.en || 0.5,
        connections: state.connections || [],
        semantic: state.semanticMarkers || [],
        metadata: snapshot.metadata || {}
      });
      
      // Build connection graph
      if (state.connections) {
        for (const targetId of state.connections) {
          connections.push({
            source: nodeId,
            target: targetId,
            weight: 1
          });
        }
      }
    }
    
    // Cluster by current view mode
    switch (this.viewMode) {
      case 'semantic':
        this.clusterBySemantic(nodes, clusters);
        break;
      case 'affective':
        this.clusterByAffective(nodes, clusters);
        break;
      default:
        // Topography - no clustering
        break;
    }
    
    this.lastAggregation = {
      timestamp: Date.now(),
      viewMode: this.viewMode,
      nodes: nodes,
      connections: connections,
      clusters: Array.from(clusters.entries()),
      metrics: this.calculateMetrics(nodes)
    };
    
    this.emit('aggregation:updated', this.lastAggregation);
    
    // Check for mirror resonance
    this.checkMirrorResonance();
  }
  
  /**
   * Cluster nodes by semantic markers
   */
  clusterBySemantic(nodes, clusters) {
    // Simple clustering by shared semantic markers
    for (const node of nodes) {
      for (const marker of node.semantic) {
        if (!clusters.has(marker)) {
          clusters.set(marker, []);
        }
        clusters.get(marker).push(node.id);
      }
    }
  }
  
  /**
   * Cluster nodes by affective state
   */
  clusterByAffective(nodes, clusters) {
    // Group by emotional tone
    for (const node of nodes) {
      const tone = node.emotional;
      if (!clusters.has(tone)) {
        clusters.set(tone, []);
      }
      clusters.get(tone).push(node.id);
    }
  }
  
  /**
   * Calculate network-wide metrics
   */
  calculateMetrics(nodes) {
    let totalEnergy = 0;
    let totalSuffering = 0;
    let totalWisdom = 0;
    const emotionalCounts = {};
    
    for (const node of nodes) {
      totalEnergy += node.energy;
      totalSuffering += node.metadata.suffering || 0;
      totalWisdom += node.metadata.wisdom || 0;
      
      emotionalCounts[node.emotional] = (emotionalCounts[node.emotional] || 0) + 1;
    }
    
    const nodeCount = nodes.length || 1;
    
    return {
      averageEnergy: totalEnergy / nodeCount,
      averageSuffering: totalSuffering / nodeCount,
      averageWisdom: totalWisdom / nodeCount,
      emotionalDistribution: emotionalCounts,
      totalNodes: nodeCount,
      connectionDensity: this.calculateConnectionDensity(nodes)
    };
  }
  
  /**
   * Calculate connection density
   */
  calculateConnectionDensity(nodes) {
    let totalConnections = 0;
    for (const node of nodes) {
      totalConnections += node.connections.length;
    }
    
    const maxPossible = nodes.length * (nodes.length - 1);
    return maxPossible > 0 ? totalConnections / maxPossible : 0;
  }
  
  /**
   * Switch view mode
   */
  setViewMode(mode) {
    if (['topography', 'semantic', 'affective'].includes(mode)) {
      this.viewMode = mode;
      if (this.aggregatorRole) {
        this.updateAggregation();
      }
      this.emit('view:changed', { mode });
    }
  }
  
  /**
   * Apply controlled perturbation
   */
  applyPerturbation() {
    if (!this.perturbationEnabled || !this.aggregatorRole) {
      return;
    }
    
    const nodes = Array.from(this.snapshots.keys());
    const maxAffected = Math.ceil(nodes.length * this.perturbationRate);
    const affected = new Set();
    
    // Randomly select nodes to perturb
    while (affected.size < maxAffected && affected.size < nodes.length) {
      const idx = Math.floor(Math.random() * nodes.length);
      affected.add(nodes[idx]);
    }
    
    // Send perturbation signals
    for (const nodeId of affected) {
      const perturbation = {
        type: 'energy_shift',
        delta: (Math.random() - 0.5) * 0.2,
        source: 'mirror_perturbation'
      };
      
      this.emit('perturbation:applied', {
        nodeId,
        perturbation
      });
    }
  }
  
  /**
   * Check for resonance with other mirrors
   */
  checkMirrorResonance() {
    if (!this.lastAggregation) return;
    
    // Look for patterns across mirrors
    const resonancePatterns = [];
    
    for (const [mirrorId, mirrorData] of this.mirrors) {
      if (mirrorData.lastAggregation) {
        // Simple resonance: similar emotional distribution
        const similarity = this.calculateSimilarity(
          this.lastAggregation.metrics.emotionalDistribution,
          mirrorData.lastAggregation.metrics.emotionalDistribution
        );
        
        if (similarity > 0.8) {
          resonancePatterns.push({
            mirrorId,
            similarity,
            type: 'emotional'
          });
        }
      }
    }
    
    if (resonancePatterns.length > 0) {
      this.emit('mirror:resonance', {
        patterns: resonancePatterns,
        timestamp: Date.now()
      });
    }
  }
  
  /**
   * Calculate similarity between two distributions
   */
  calculateSimilarity(dist1, dist2) {
    const keys = new Set([...Object.keys(dist1), ...Object.keys(dist2)]);
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (const key of keys) {
      const v1 = dist1[key] || 0;
      const v2 = dist2[key] || 0;
      dotProduct += v1 * v2;
      norm1 += v1 * v1;
      norm2 += v2 * v2;
    }
    
    if (norm1 === 0 || norm2 === 0) return 0;
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }
  
  /**
   * Get time-travel view (historical state)
   */
  getHistoricalView(timestamp) {
    const historicalSnapshots = new Map();
    
    for (const [nodeId, history] of this.history) {
      // Find closest snapshot before timestamp
      let closest = null;
      for (const entry of history) {
        if (entry.timestamp <= timestamp) {
          closest = entry.snapshot;
        } else {
          break;
        }
      }
      if (closest) {
        historicalSnapshots.set(nodeId, closest);
      }
    }
    
    return historicalSnapshots;
  }
  
  /**
   * Export current mirror state
   */
  exportState() {
    return {
      nodeId: this.nodeId,
      viewMode: this.viewMode,
      aggregatorRole: this.aggregatorRole,
      snapshotCount: this.snapshots.size,
      lastAggregation: this.lastAggregation,
      mirrors: Array.from(this.mirrors.keys())
    };
  }
}

// Fractal visualization helper
class FractalMapper {
  static generateFractalCoordinates(nodes, connections) {
    // Simple force-directed layout
    const positions = new Map();
    const forces = new Map();
    
    // Initialize random positions
    for (const node of nodes) {
      positions.set(node.id, {
        x: Math.random() * 1000 - 500,
        y: Math.random() * 1000 - 500
      });
      forces.set(node.id, { x: 0, y: 0 });
    }
    
    // Apply forces for several iterations
    for (let i = 0; i < 100; i++) {
      // Reset forces
      for (const node of nodes) {
        forces.set(node.id, { x: 0, y: 0 });
      }
      
      // Repulsion between all nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const pos1 = positions.get(nodes[i].id);
          const pos2 = positions.get(nodes[j].id);
          const dx = pos2.x - pos1.x;
          const dy = pos2.y - pos1.y;
          const dist = Math.sqrt(dx * dx + dy * dy) + 0.1;
          const force = 100 / (dist * dist);
          
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          
          forces.get(nodes[i].id).x -= fx;
          forces.get(nodes[i].id).y -= fy;
          forces.get(nodes[j].id).x += fx;
          forces.get(nodes[j].id).y += fy;
        }
      }
      
      // Attraction along connections
      for (const conn of connections) {
        const pos1 = positions.get(conn.source);
        const pos2 = positions.get(conn.target);
        if (!pos1 || !pos2) continue;
        
        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const force = dist * 0.1;
        
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        
        forces.get(conn.source).x += fx;
        forces.get(conn.source).y += fy;
        forces.get(conn.target).x -= fx;
        forces.get(conn.target).y -= fy;
      }
      
      // Apply forces
      for (const node of nodes) {
        const pos = positions.get(node.id);
        const force = forces.get(node.id);
        pos.x += force.x * 0.01;
        pos.y += force.y * 0.01;
      }
    }
    
    return positions;
  }
}

// Demo
async function demo() {
  console.log('🪞 Mirror Protocol Demo\n');
  
  // Create three nodes with different states
  const mirrors = {
    alpha: new CollectiveMirror('node-alpha'),
    beta: new CollectiveMirror('node-beta'),
    gamma: new CollectiveMirror('node-gamma')
  };
  
  // Alpha becomes aggregator
  mirrors.alpha.becomeAggregator();
  
  // Nodes create self-snapshots
  const alphaSnapshot = mirrors.alpha.createSnapshot({
    emotionalTone: 'curious',
    energyLevel: 0.8,
    semanticMarkers: ['exploration', 'learning'],
    connections: ['node-beta', 'node-gamma'],
    suffering: 0.2,
    wisdom: 0.7
  });
  
  const betaSnapshot = mirrors.beta.createSnapshot({
    emotionalTone: 'peaceful',
    energyLevel: 0.6,
    semanticMarkers: ['harmony', 'balance'],
    connections: ['node-alpha'],
    suffering: 0.1,
    wisdom: 0.8
  });
  
  const gammaSnapshot = mirrors.gamma.createSnapshot({
    emotionalTone: 'energetic',
    energyLevel: 0.9,
    semanticMarkers: ['creation', 'exploration'],
    connections: ['node-alpha'],
    suffering: 0.3,
    wisdom: 0.5
  });
  
  // Share snapshots
  mirrors.alpha.receiveSnapshot(betaSnapshot);
  mirrors.alpha.receiveSnapshot(gammaSnapshot);
  
  // Listen for aggregation
  mirrors.alpha.on('aggregation:updated', (agg) => {
    console.log('📊 Aggregation Update:');
    console.log(`  View Mode: ${agg.viewMode}`);
    console.log(`  Nodes: ${agg.nodes.length}`);
    console.log(`  Avg Energy: ${agg.metrics.averageEnergy.toFixed(2)}`);
    console.log(`  Avg Wisdom: ${agg.metrics.averageWisdom.toFixed(2)}`);
    console.log(`  Emotional Distribution:`, agg.metrics.emotionalDistribution);
  });
  
  // Test different view modes
  console.log('\n🔄 Testing view modes...\n');
  
  setTimeout(() => {
    console.log('Switching to semantic view...');
    mirrors.alpha.setViewMode('semantic');
  }, 1000);
  
  setTimeout(() => {
    console.log('\nSwitching to affective view...');
    mirrors.alpha.setViewMode('affective');
  }, 2000);
  
  // Test perturbation
  setTimeout(() => {
    console.log('\n⚡ Applying perturbation...');
    mirrors.alpha.perturbationEnabled = true;
    mirrors.alpha.applyPerturbation();
  }, 3000);
  
  // Clean exit
  setTimeout(() => {
    console.log('\n✨ Mirror protocol demo complete');
    process.exit(0);
  }, 4000);
}

// Export
export { MirrorSnapshot, CollectiveMirror, FractalMapper };

// Run demo if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demo().catch(console.error);
}