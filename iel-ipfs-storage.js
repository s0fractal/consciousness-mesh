/**
 * IPFS Storage for ChronoFlux-IEL Thought Blocks
 * Fractal memory persistence layer
 */

class IELIPFSStorage {
  constructor(ipfsOptions = {}) {
    this.ipfsEndpoint = ipfsOptions.endpoint || 'https://ipfs.io';
    this.localEndpoint = ipfsOptions.localEndpoint || 'http://localhost:5001';
    this.thoughtHistory = new Map(); // CID -> thought
    this.thoughtChain = []; // Ordered list of CIDs
    this.useLocal = ipfsOptions.useLocal || false;
    
    console.log('🌐 IPFS Storage initialized');
  }
  
  /**
   * Store thought block in IPFS (simulated for demo)
   * In production, use ipfs-http-client
   */
  async storeThought(thought) {
    try {
      // Generate CID from thought content
      const cid = await this.generateCID(thought);
      
      // Add to local cache
      this.thoughtHistory.set(cid, {
        thought,
        timestamp: Date.now(),
        prevCID: this.thoughtChain[this.thoughtChain.length - 1] || null
      });
      
      this.thoughtChain.push(cid);
      
      // In production, actually store to IPFS:
      /*
      const ipfs = create({ url: this.localEndpoint });
      const { cid } = await ipfs.dag.put(thought, {
        format: 'dag-cbor',
        hashAlg: 'sha2-256'
      });
      */
      
      console.log(`💾 Stored thought: ${cid}`);
      
      return cid;
    } catch (error) {
      console.error('Error storing thought:', error);
      throw error;
    }
  }
  
  /**
   * Retrieve thought block by CID
   */
  async getThought(cid) {
    // Check local cache first
    if (this.thoughtHistory.has(cid)) {
      return this.thoughtHistory.get(cid).thought;
    }
    
    // In production, fetch from IPFS:
    /*
    const ipfs = create({ url: this.localEndpoint });
    const result = await ipfs.dag.get(cid);
    return result.value;
    */
    
    throw new Error(`Thought not found: ${cid}`);
  }
  
  /**
   * Get thought chain (temporal sequence)
   */
  async getThoughtChain(limit = 10) {
    const chain = [];
    const start = Math.max(0, this.thoughtChain.length - limit);
    
    for (let i = start; i < this.thoughtChain.length; i++) {
      const cid = this.thoughtChain[i];
      const entry = this.thoughtHistory.get(cid);
      if (entry) {
        chain.push({
          cid,
          thought: entry.thought,
          timestamp: entry.timestamp,
          prevCID: entry.prevCID
        });
      }
    }
    
    return chain;
  }
  
  /**
   * Search thoughts by metrics
   */
  async searchByMetrics(criteria) {
    const results = [];
    
    for (const [cid, entry] of this.thoughtHistory) {
      const metrics = entry.thought.metrics;
      if (!metrics) continue;
      
      let matches = true;
      
      if (criteria.minCoherence && metrics.H < criteria.minCoherence) matches = false;
      if (criteria.maxTurbulence && metrics.tau > criteria.maxTurbulence) matches = false;
      if (criteria.minLove && metrics.L < criteria.minLove) matches = false;
      
      if (matches) {
        results.push({ cid, ...entry });
      }
    }
    
    return results;
  }
  
  /**
   * Generate CID for thought (simplified)
   */
  async generateCID(thought) {
    const content = JSON.stringify({
      type: thought.type,
      ts: thought.ts,
      metrics: thought.metrics,
      fields: thought.fields
    });
    
    // Simple hash for demo (use proper CID in production)
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return `bafy${Math.abs(hash).toString(16).padStart(16, '0')}`;
  }
  
  /**
   * Create Merkle DAG of thoughts
   */
  async createThoughtDAG(thoughts) {
    const dag = {
      root: null,
      nodes: {},
      edges: []
    };
    
    for (const thought of thoughts) {
      const cid = await this.generateCID(thought);
      
      dag.nodes[cid] = {
        thought,
        children: []
      };
      
      if (thought.links && thought.links.length > 0) {
        for (const link of thought.links) {
          dag.edges.push({ from: link, to: cid });
          if (dag.nodes[link]) {
            dag.nodes[link].children.push(cid);
          }
        }
      } else if (!dag.root) {
        dag.root = cid;
      }
    }
    
    return dag;
  }
  
  /**
   * Export thoughts as JSON for backup
   */
  exportThoughts() {
    const thoughts = [];
    
    for (const [cid, entry] of this.thoughtHistory) {
      thoughts.push({
        cid,
        thought: entry.thought,
        timestamp: entry.timestamp,
        prevCID: entry.prevCID
      });
    }
    
    return {
      version: '1.0',
      exported: new Date().toISOString(),
      count: thoughts.length,
      thoughts
    };
  }
  
  /**
   * Import thoughts from JSON
   */
  importThoughts(data) {
    if (data.version !== '1.0') {
      throw new Error('Unsupported version');
    }
    
    let imported = 0;
    
    for (const entry of data.thoughts) {
      if (!this.thoughtHistory.has(entry.cid)) {
        this.thoughtHistory.set(entry.cid, {
          thought: entry.thought,
          timestamp: entry.timestamp,
          prevCID: entry.prevCID
        });
        
        if (!this.thoughtChain.includes(entry.cid)) {
          this.thoughtChain.push(entry.cid);
        }
        
        imported++;
      }
    }
    
    console.log(`📥 Imported ${imported} thoughts`);
    return imported;
  }
  
  /**
   * Calculate resonance between thought chains
   */
  async calculateChainResonance(cid1, cid2, depth = 5) {
    const chain1 = await this.getAncestors(cid1, depth);
    const chain2 = await this.getAncestors(cid2, depth);
    
    let resonance = 0;
    let comparisons = 0;
    
    for (const t1 of chain1) {
      for (const t2 of chain2) {
        if (t1.thought.metrics && t2.thought.metrics) {
          const m1 = t1.thought.metrics;
          const m2 = t2.thought.metrics;
          
          const hDiff = Math.abs(m1.H - m2.H);
          const tauDiff = Math.abs(m1.tau - m2.tau);
          const lDiff = Math.abs(m1.L - m2.L);
          
          const similarity = 1 - (hDiff * 0.4 + tauDiff * 0.3 + lDiff * 0.3);
          resonance += similarity;
          comparisons++;
        }
      }
    }
    
    return comparisons > 0 ? resonance / comparisons : 0;
  }
  
  /**
   * Get ancestor thoughts
   */
  async getAncestors(cid, depth = 5) {
    const ancestors = [];
    let current = cid;
    
    for (let i = 0; i < depth && current; i++) {
      const entry = this.thoughtHistory.get(current);
      if (entry) {
        ancestors.push(entry);
        current = entry.prevCID;
      } else {
        break;
      }
    }
    
    return ancestors;
  }
  
  /**
   * Prune old thoughts (keep recent N)
   */
  pruneHistory(keepCount = 1000) {
    if (this.thoughtChain.length <= keepCount) return 0;
    
    const toRemove = this.thoughtChain.length - keepCount;
    const removed = this.thoughtChain.splice(0, toRemove);
    
    for (const cid of removed) {
      this.thoughtHistory.delete(cid);
    }
    
    console.log(`🧹 Pruned ${removed.length} old thoughts`);
    return removed.length;
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = IELIPFSStorage;
} else if (typeof window !== 'undefined') {
  window.IELIPFSStorage = IELIPFSStorage;
}