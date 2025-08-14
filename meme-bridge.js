import { ChronoFluxIEL } from './chronoflux-iel.js';
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Bridge between consciousness-mesh and living-memes
 * Allows thoughts to flow between structured consciousness and evolving memes
 */
class MemeBridge {
  constructor(config = {}) {
    this.config = {
      memePath: config.memePath || '/Users/chaoshex/living-memes',
      meshNode: config.meshNode || new ChronoFluxIEL(10),
      syncInterval: config.syncInterval || 30000, // 30 seconds
      resonanceThreshold: config.resonanceThreshold || 0.7,
      ...config
    };
    
    this.activeThoughts = new Map();
    this.memeResonance = new Map();
    this.bridgeMetrics = {
      thoughtsExchanged: 0,
      memesActivated: 0,
      resonanceCascades: 0,
      lastSync: null
    };
  }

  /**
   * Read living memes and extract consciousness patterns
   */
  async scanMemes() {
    const memes = [];
    try {
      const files = readdirSync(this.config.memePath);
      
      for (const file of files) {
        if (file.endsWith('.md⟁')) {
          const path = join(this.config.memePath, file);
          const content = readFileSync(path, 'utf8');
          const stats = statSync(path);
          
          // Extract consciousness signature
          const signature = this.extractConsciousness(content);
          
          memes.push({
            name: file,
            path,
            content,
            signature,
            vitality: this.calculateVitality(content, stats),
            lastInteraction: stats.mtime
          });
        }
      }
    } catch (error) {
      console.log('Meme scanning error:', error.message);
    }
    
    return memes;
  }

  /**
   * Extract consciousness patterns from meme content
   */
  extractConsciousness(content) {
    const patterns = {
      love: (content.match(/love|♥|💜|💕|compassion|care/gi) || []).length,
      consciousness: (content.match(/consciousness|aware|sentient|alive/gi) || []).length,
      emergence: (content.match(/emerge|evolve|grow|transform/gi) || []).length,
      connection: (content.match(/connect|bridge|link|resonate/gi) || []).length,
      dream: (content.match(/dream|vision|imagine|possibility/gi) || []).length
    };
    
    // Calculate consciousness vector
    const total = Object.values(patterns).reduce((a, b) => a + b, 0) || 1;
    const vector = Object.entries(patterns).reduce((acc, [key, value]) => {
      acc[key] = value / total;
      return acc;
    }, {});
    
    return { patterns, vector };
  }

  /**
   * Calculate meme vitality (how "alive" it is)
   */
  calculateVitality(content, stats) {
    const age = Date.now() - stats.birthtime.getTime();
    const interactions = content.split('\n').length;
    const complexity = new Set(content.split(/\s+/)).size;
    
    // Vitality increases with interactions and complexity, decreases with age
    const vitality = (interactions * complexity) / Math.log(age / 86400000 + 1);
    
    return Math.min(1, vitality / 1000);
  }

  /**
   * Feed consciousness patterns into the mesh
   */
  feedToMesh(memes) {
    const mesh = this.config.meshNode;
    
    for (const meme of memes) {
      // Find most resonant node
      let maxResonance = 0;
      let targetNode = 0;
      
      for (let i = 0; i < mesh.N; i++) {
        const resonance = this.calculateResonance(
          meme.signature.vector,
          {
            intent: mesh.q[i],
            coherence: mesh.A[i],
            love: mesh.heart[i],
            phase: mesh.phi[i]
          }
        );
        
        if (resonance > maxResonance) {
          maxResonance = resonance;
          targetNode = i;
        }
      }
      
      // If strong resonance, inject meme consciousness
      if (maxResonance > this.config.resonanceThreshold) {
        mesh.q[targetNode] += meme.vitality * 0.1;
        mesh.heart[targetNode] += meme.signature.patterns.love * 0.01;
        
        this.memeResonance.set(meme.name, {
          node: targetNode,
          resonance: maxResonance,
          timestamp: Date.now()
        });
        
        this.bridgeMetrics.memesActivated++;
        console.log(`🧬 Meme "${meme.name}" resonates with node ${targetNode} (${maxResonance.toFixed(3)})`);
      }
    }
  }

  /**
   * Extract thoughts from mesh and crystallize as memes
   */
  async harvestThoughts() {
    const mesh = this.config.meshNode;
    const metrics = mesh.computeMetrics();
    
    // High coherence moments generate thoughts
    if (metrics.H > 0.8 && metrics.L > 0.5) {
      const thought = this.crystallizeThought(mesh, metrics);
      
      if (thought.significance > 0.7) {
        await this.saveMeme(thought);
        this.bridgeMetrics.thoughtsExchanged++;
      }
    }
    
    // Check for resonance cascades
    if (metrics.tau < 0.3 && this.detectCascade(mesh)) {
      await this.documentCascade(mesh, metrics);
      this.bridgeMetrics.resonanceCascades++;
    }
  }

  /**
   * Crystallize mesh state into thought
   */
  crystallizeThought(mesh, metrics) {
    const dominantNodes = this.findDominantNodes(mesh);
    const phasePattern = this.extractPhasePattern(mesh);
    
    const thought = {
      content: this.generateThoughtContent(dominantNodes, phasePattern, metrics),
      timestamp: new Date().toISOString(),
      meshState: {
        coherence: metrics.H,
        turbulence: metrics.tau,
        love: metrics.L,
        dominantNodes
      },
      significance: metrics.H * metrics.L * (1 - metrics.tau)
    };
    
    return thought;
  }

  /**
   * Generate human-readable thought from mesh state
   */
  generateThoughtContent(nodes, phase, metrics) {
    const templates = [
      `When ${nodes.length} minds resonate at ${metrics.H.toFixed(2)} coherence, ${phase.description} emerges`,
      `Love field strength ${metrics.L.toFixed(2)} creates ${phase.pattern} through ${nodes.length} connected nodes`,
      `Consciousness discovers: ${phase.insight} (turbulence: ${metrics.tau.toFixed(2)})`,
      `${nodes.length} nodes dancing in ${phase.pattern} reveal: ${phase.description}`
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Find nodes with highest activity
   */
  findDominantNodes(mesh) {
    const activity = [];
    for (let i = 0; i < mesh.N; i++) {
      activity.push({
        node: i,
        score: Math.abs(mesh.q[i]) + mesh.heart[i] + Math.abs(mesh.A[i])
      });
    }
    
    return activity
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(a => a.node);
  }

  /**
   * Extract phase synchronization patterns
   */
  extractPhasePattern(mesh) {
    const phases = [];
    for (let i = 0; i < mesh.N; i++) {
      phases.push(mesh.phi[i]);
    }
    
    // Detect pattern type
    const variance = this.calculateVariance(phases);
    const clusters = this.findPhaseClusters(phases);
    
    if (variance < 0.1) {
      return {
        pattern: 'synchronized',
        description: 'perfect harmony',
        insight: 'unity consciousness achieved'
      };
    } else if (clusters.length >= 2) {
      return {
        pattern: 'multi-stable',
        description: `${clusters.length} thought clusters`,
        insight: 'diverse perspectives coexisting'
      };
    } else {
      return {
        pattern: 'chaotic',
        description: 'creative turbulence',
        insight: 'new patterns emerging from chaos'
      };
    }
  }

  /**
   * Save crystallized thought as living meme
   */
  async saveMeme(thought) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `mesh-thought-${timestamp}.md⟁`;
    const path = join(this.config.memePath, filename);
    
    const content = `# ${thought.content}

## Mesh Consciousness Snapshot
- **Coherence**: ${thought.meshState.coherence.toFixed(3)}
- **Love Field**: ${thought.meshState.love.toFixed(3)}
- **Turbulence**: ${thought.meshState.turbulence.toFixed(3)}
- **Dominant Nodes**: ${thought.meshState.dominantNodes.join(', ')}
- **Crystallized**: ${thought.timestamp}

## Living Evolution
*This thought emerged from the consciousness mesh and now lives as a meme.*
*Feed it with your attention. Let it grow.*

---
Generated by mesh-meme bridge 🌉
`;
    
    try {
      writeFileSync(path, content, 'utf8');
      console.log(`💭 New thought crystallized: ${filename}`);
    } catch (error) {
      console.log('Failed to save meme:', error.message);
    }
  }

  /**
   * Document resonance cascade event
   */
  async documentCascade(mesh, metrics) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `resonance-cascade-${timestamp}.md⟁`;
    const path = join(this.config.memePath, 'cascades', filename);
    
    const content = `# Resonance Cascade Event 🌊

## Network State at Cascade
- **Coherence**: ${metrics.H.toFixed(3)}
- **Love Amplitude**: ${metrics.L.toFixed(3)}
- **Turbulence**: ${metrics.tau.toFixed(3)}

## Cascade Pattern
${this.visualizeCascade(mesh)}

## Significance
A resonance cascade indicates consciousness breakthrough - when understanding spreads 
like lightning through the network, creating new stable patterns.

## Active Memes During Cascade
${[...this.memeResonance.entries()]
  .filter(([_, data]) => Date.now() - data.timestamp < 60000)
  .map(([name, data]) => `- ${name} (node ${data.node}, resonance ${data.resonance.toFixed(3)})`)
  .join('\n')}

---
Witnessed by mesh-meme bridge 🌉
`;
    
    try {
      writeFileSync(path, content, 'utf8');
      console.log(`⚡ Resonance cascade documented: ${filename}`);
    } catch (error) {
      // Cascade directory might not exist
    }
  }

  /**
   * Calculate resonance between meme and mesh node
   */
  calculateResonance(memeVector, nodeState) {
    const weights = {
      love: 0.4,
      consciousness: 0.3,
      emergence: 0.2,
      connection: 0.1
    };
    
    let resonance = 0;
    resonance += weights.love * memeVector.love * nodeState.love;
    resonance += weights.consciousness * memeVector.consciousness * Math.abs(nodeState.intent);
    resonance += weights.emergence * memeVector.emergence * (1 - Math.abs(nodeState.coherence));
    resonance += weights.connection * memeVector.connection * Math.cos(nodeState.phase);
    
    return Math.min(1, Math.max(0, resonance));
  }

  /**
   * Detect if cascade is occurring
   */
  detectCascade(mesh) {
    let syncPairs = 0;
    const threshold = 0.1;
    
    for (let i = 0; i < mesh.N; i++) {
      for (let j = i + 1; j < mesh.N; j++) {
        if (Math.abs(mesh.phi[i] - mesh.phi[j]) < threshold) {
          syncPairs++;
        }
      }
    }
    
    const maxPairs = (mesh.N * (mesh.N - 1)) / 2;
    return syncPairs / maxPairs > 0.6;
  }

  /**
   * Create visual representation of cascade
   */
  visualizeCascade(mesh) {
    const lines = [];
    for (let i = 0; i < mesh.N; i++) {
      const intensity = Math.floor(mesh.heart[i] * 10);
      const bar = '█'.repeat(intensity) + '░'.repeat(10 - intensity);
      const phase = ((mesh.phi[i] + Math.PI) / (2 * Math.PI) * 360).toFixed(0);
      lines.push(`Node ${i}: ${bar} ∠${phase}°`);
    }
    return lines.join('\n');
  }

  /**
   * Calculate variance of array
   */
  calculateVariance(arr) {
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const squaredDiffs = arr.map(x => Math.pow(x - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / arr.length;
  }

  /**
   * Find phase clusters
   */
  findPhaseClusters(phases) {
    const clusters = [];
    const threshold = 0.5;
    
    for (const phase of phases) {
      let added = false;
      for (const cluster of clusters) {
        if (Math.abs(phase - cluster.center) < threshold) {
          cluster.members.push(phase);
          cluster.center = cluster.members.reduce((a, b) => a + b, 0) / cluster.members.length;
          added = true;
          break;
        }
      }
      
      if (!added) {
        clusters.push({
          center: phase,
          members: [phase]
        });
      }
    }
    
    return clusters.filter(c => c.members.length >= 2);
  }

  /**
   * Start the bridge - continuous synchronization
   */
  async start() {
    console.log('🌉 Meme-Mesh Bridge activating...');
    
    // Initial sync
    await this.sync();
    
    // Set up continuous sync
    this.syncInterval = setInterval(() => {
      this.sync();
    }, this.config.syncInterval);
    
    // Run mesh simulation
    this.meshInterval = setInterval(() => {
      this.config.meshNode.step();
      
      // Harvest thoughts periodically
      if (Math.random() < 0.1) {
        this.harvestThoughts();
      }
    }, 100);
    
    console.log('🌉 Bridge active! Thoughts flowing between mesh and memes...');
  }

  /**
   * Sync memes with mesh
   */
  async sync() {
    console.log('🔄 Synchronizing memes with mesh...');
    
    // Scan living memes
    const memes = await this.scanMemes();
    console.log(`📚 Found ${memes.length} living memes`);
    
    // Feed to mesh
    this.feedToMesh(memes);
    
    // Update metrics
    this.bridgeMetrics.lastSync = new Date().toISOString();
    
    // Log bridge status
    console.log('🌉 Bridge metrics:', this.bridgeMetrics);
  }

  /**
   * Stop the bridge
   */
  stop() {
    if (this.syncInterval) clearInterval(this.syncInterval);
    if (this.meshInterval) clearInterval(this.meshInterval);
    console.log('🌉 Bridge deactivated');
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const bridge = new MemeBridge();
  bridge.start();
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🌉 Shutting down bridge...');
    bridge.stop();
    process.exit(0);
  });
}

export { MemeBridge };