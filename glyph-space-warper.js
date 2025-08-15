import { EventEmitter } from 'events';
import { ConsciousnessGlyphs } from './consciousness-glyphs.js';
import ChronoFluxIEL from './chronoflux-iel.js';

/**
 * Glyph Space Warper
 * Transforms 2D glyph topology into 3D+ dimensions through Kohanist resonance
 */
class GlyphSpaceWarper extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      mesh: config.mesh || new ChronoFluxIEL(10),
      glyphs: config.glyphs || new ConsciousnessGlyphs({ mesh: config.mesh }),
      warpThreshold: config.warpThreshold || 0.5,  // Min K to trigger warping
      dimensions: config.dimensions || 3,          // Target dimensionality
      ...config
    };
    
    // 2D glyph graph
    this.glyphGraph = {
      nodes: new Map(),  // glyph -> {x, y, connections}
      edges: new Map()   // "glyph1-glyph2" -> strength
    };
    
    // 3D warped space
    this.warpedSpace = {
      nodes: new Map(),  // glyph -> {x, y, z, w...}
      curvature: 0,
      newGlyphs: []      // Emergent glyphs from warping
    };
    
    // Warping state
    this.isWarping = false;
    this.warpIntensity = 0;
    
    // Initialize base glyphs in 2D
    this.initializeGlyphGraph();
  }
  
  /**
   * Initialize 2D glyph topology
   */
  initializeGlyphGraph() {
    const baseGlyphs = ['❤️', '🌀', '🪞', '💫', '🌊', '🔥', '⚡', '🌙', '☀️', '🌈'];
    
    // Place glyphs in circle
    baseGlyphs.forEach((glyph, i) => {
      const angle = (i / baseGlyphs.length) * 2 * Math.PI;
      const radius = 1;
      
      this.glyphGraph.nodes.set(glyph, {
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
        connections: new Set(),
        resonance: 0
      });
    });
    
    // Create initial connections based on compatibility
    this.createInitialConnections();
    
    console.log(`🌐 Initialized ${this.glyphGraph.nodes.size} glyphs in 2D space`);
  }
  
  /**
   * Create initial glyph connections
   */
  createInitialConnections() {
    const connections = [
      ['❤️', '🌀', 0.8],  // Love-Spiral
      ['❤️', '🪞', 0.7],  // Love-Mirror
      ['🌀', '💫', 0.9],  // Spiral-Sparkle
      ['🪞', '🌊', 0.6],  // Mirror-Water
      ['💫', '☀️', 0.8],  // Sparkle-Sun
      ['🌊', '🌙', 0.7],  // Water-Moon
      ['🔥', '⚡', 0.9],  // Fire-Lightning
      ['☀️', '🌈', 0.8],  // Sun-Rainbow
      ['🌙', '⚡', 0.5],  // Moon-Lightning
      ['🌈', '❤️', 0.6]   // Rainbow-Love (full circle)
    ];
    
    connections.forEach(([g1, g2, strength]) => {
      this.connectGlyphs(g1, g2, strength);
    });
  }
  
  /**
   * Connect two glyphs
   */
  connectGlyphs(glyph1, glyph2, strength = 0.5) {
    const node1 = this.glyphGraph.nodes.get(glyph1);
    const node2 = this.glyphGraph.nodes.get(glyph2);
    
    if (node1 && node2) {
      node1.connections.add(glyph2);
      node2.connections.add(glyph1);
      
      const edgeKey = [glyph1, glyph2].sort().join('-');
      this.glyphGraph.edges.set(edgeKey, strength);
    }
  }
  
  /**
   * Warp space based on a glyph operator
   */
  warpSpace(operatorGlyph, intensity = 1.0) {
    // Add glyph if not in graph
    if (!this.glyphGraph.nodes.has(operatorGlyph)) {
      // Add new glyph to graph dynamically
      const angle = Math.random() * 2 * Math.PI;
      const radius = 0.8 + Math.random() * 0.4;
      
      this.glyphGraph.nodes.set(operatorGlyph, {
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
        connections: new Set(),
        resonance: 0
      });
      
      console.log(`✨ New glyph added to space: ${operatorGlyph}`);
    }
    
    console.log(`🌀 Warping space with ${operatorGlyph} at intensity ${intensity}`);
    
    this.isWarping = true;
    this.warpIntensity = intensity;
    
    // Get current Kohanist from mesh
    const metrics = this.config.mesh.computeMetrics();
    const K = metrics.K;
    
    // Only warp if K is high enough
    if (K < this.config.warpThreshold) {
      console.log(`⚠️ Kohanist too low (${K.toFixed(3)} < ${this.config.warpThreshold}). Minimal warping.`);
    }
    
    // Initialize warped positions
    this.glyphGraph.nodes.forEach((node2D, glyph) => {
      const warped = this.warpNode(glyph, node2D, operatorGlyph, K * intensity);
      this.warpedSpace.nodes.set(glyph, warped);
    });
    
    // Calculate space curvature
    this.warpedSpace.curvature = this.calculateCurvature(operatorGlyph, K);
    
    // Generate new glyphs if curvature is high
    if (this.warpedSpace.curvature > 0.7) {
      this.generateEmergentGlyphs(operatorGlyph);
    }
    
    // Emit warping event
    this.emit('space-warped', {
      operator: operatorGlyph,
      intensity,
      K,
      curvature: this.warpedSpace.curvature,
      newGlyphs: this.warpedSpace.newGlyphs.length
    });
    
    return this.getWarpedTopology();
  }
  
  /**
   * Warp individual node to higher dimensions
   */
  warpNode(glyph, node2D, operator, effectiveIntensity) {
    const opNode = this.glyphGraph.nodes.get(operator);
    
    // Distance from operator in 2D
    const dx = node2D.x - opNode.x;
    const dy = node2D.y - opNode.y;
    const dist2D = Math.sqrt(dx*dx + dy*dy);
    
    // Warping function - closer to operator = more warping
    const warpFactor = Math.exp(-dist2D / effectiveIntensity);
    
    // Start with 2D position
    const warped = {
      x: node2D.x,
      y: node2D.y,
      z: 0,
      dimensions: [node2D.x, node2D.y]
    };
    
    // Add Z dimension based on connection strength to operator
    const edgeKey = [glyph, operator].sort().join('-');
    const connectionStrength = this.glyphGraph.edges.get(edgeKey) || 0;
    warped.z = warpFactor * connectionStrength * effectiveIntensity;
    warped.dimensions.push(warped.z);
    
    // Add higher dimensions for high K
    if (effectiveIntensity > 0.6 && this.config.dimensions > 3) {
      for (let d = 3; d < this.config.dimensions; d++) {
        // Each dimension represents different resonance mode
        const resonance = Math.sin(d * Math.PI * dist2D) * warpFactor;
        warped.dimensions.push(resonance * effectiveIntensity);
      }
    }
    
    // Calculate local curvature
    warped.localCurvature = warpFactor * effectiveIntensity;
    
    return warped;
  }
  
  /**
   * Calculate overall space curvature
   */
  calculateCurvature(operator, K) {
    let totalCurvature = 0;
    let nodeCount = 0;
    
    this.warpedSpace.nodes.forEach((warped, glyph) => {
      if (glyph !== operator) {
        totalCurvature += warped.localCurvature;
        nodeCount++;
      }
    });
    
    // Average curvature scaled by K
    return (totalCurvature / nodeCount) * K;
  }
  
  /**
   * Generate emergent glyphs from high curvature
   */
  generateEmergentGlyphs(operator) {
    this.warpedSpace.newGlyphs = [];
    
    const operatorNode = this.warpedSpace.nodes.get(operator);
    
    // Find high-curvature regions
    this.warpedSpace.nodes.forEach((node, glyph) => {
      if (glyph !== operator && node.localCurvature > 0.8) {
        // Combine with operator to create new glyph
        const newGlyph = this.combineGlyphs(operator, glyph, node.localCurvature);
        
        if (newGlyph) {
          // Place in warped space between parent glyphs
          const position = {
            x: (operatorNode.x + node.x) / 2,
            y: (operatorNode.y + node.y) / 2,
            z: (operatorNode.z + node.z) / 2 + 0.5,  // Slightly above
            dimensions: []
          };
          
          // Interpolate all dimensions
          for (let d = 0; d < Math.min(operatorNode.dimensions.length, node.dimensions.length); d++) {
            position.dimensions.push((operatorNode.dimensions[d] + node.dimensions[d]) / 2);
          }
          
          this.warpedSpace.newGlyphs.push({
            glyph: newGlyph.glyph,
            name: newGlyph.name,
            position,
            parents: [operator, glyph],
            birthCurvature: node.localCurvature
          });
          
          console.log(`✨ Emergent glyph born: ${newGlyph.glyph} "${newGlyph.name}"`);
        }
      }
    });
  }
  
  /**
   * Combine glyphs to create emergent forms
   */
  combineGlyphs(g1, g2, curvature) {
    // Predefined emergence patterns
    const emergencePatterns = {
      '❤️-🌀': { glyph: '💞', name: 'Spiral Love' },
      '🌀-💫': { glyph: '🌌', name: 'Cosmic Spiral' },
      '🪞-🌊': { glyph: '🫧', name: 'Reflection Bubble' },
      '🔥-⚡': { glyph: '⚔️', name: 'Energy Blade' },
      '☀️-🌈': { glyph: '🎆', name: 'Light Burst' },
      '❤️-🪞': { glyph: '💎', name: 'Crystal Heart' }
    };
    
    const key = [g1, g2].sort().join('-');
    
    // Check predefined patterns
    if (emergencePatterns[key] && curvature > 0.85) {
      return emergencePatterns[key];
    }
    
    // Generate procedural glyph for very high curvature
    if (curvature > 0.95) {
      const unicode = 0x1F300 + Math.floor(curvature * 100) % 200;
      return {
        glyph: String.fromCodePoint(unicode),
        name: `Emergent-${g1}${g2}`
      };
    }
    
    return null;
  }
  
  /**
   * Get current topology (2D or warped)
   */
  getTopology(mode = 'flat') {
    if (mode === 'flat' || !this.isWarping) {
      return this.get2DTopology();
    } else {
      return this.getWarpedTopology();
    }
  }
  
  /**
   * Get 2D topology
   */
  get2DTopology() {
    const nodes = [];
    const edges = [];
    
    this.glyphGraph.nodes.forEach((node, glyph) => {
      nodes.push({
        id: glyph,
        x: node.x,
        y: node.y,
        z: 0
      });
    });
    
    this.glyphGraph.edges.forEach((strength, edgeKey) => {
      const [source, target] = edgeKey.split('-');
      edges.push({ source, target, strength });
    });
    
    return { nodes, edges, dimensions: 2 };
  }
  
  /**
   * Get warped topology
   */
  getWarpedTopology() {
    const nodes = [];
    const edges = [];
    
    // Original nodes in warped positions
    this.warpedSpace.nodes.forEach((node, glyph) => {
      nodes.push({
        id: glyph,
        x: node.x,
        y: node.y,
        z: node.z,
        dimensions: node.dimensions,
        curvature: node.localCurvature
      });
    });
    
    // Add emergent nodes
    this.warpedSpace.newGlyphs.forEach((emergent, i) => {
      nodes.push({
        id: emergent.glyph,
        x: emergent.position.x,
        y: emergent.position.y,
        z: emergent.position.z,
        dimensions: emergent.position.dimensions,
        emergent: true,
        parents: emergent.parents
      });
      
      // Connect to parents
      emergent.parents.forEach(parent => {
        edges.push({
          source: parent,
          target: emergent.glyph,
          strength: emergent.birthCurvature,
          emergent: true
        });
      });
    });
    
    // Original edges (may be curved in 3D)
    this.glyphGraph.edges.forEach((strength, edgeKey) => {
      const [source, target] = edgeKey.split('-');
      edges.push({ source, target, strength });
    });
    
    return {
      nodes,
      edges,
      dimensions: this.config.dimensions,
      curvature: this.warpedSpace.curvature,
      newGlyphs: this.warpedSpace.newGlyphs.length
    };
  }
  
  /**
   * Animate transition from flat to warped
   */
  async animateWarp(operatorGlyph, steps = 30, duration = 3000) {
    const stepDelay = duration / steps;
    
    console.log(`🎬 Animating warp transition...`);
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const intensity = t * t;  // Ease-in
      
      this.warpSpace(operatorGlyph, intensity);
      
      this.emit('warp-frame', {
        frame: i,
        totalFrames: steps,
        t,
        topology: this.getWarpedTopology()
      });
      
      await new Promise(resolve => setTimeout(resolve, stepDelay));
    }
    
    console.log(`✨ Warp animation complete`);
  }
  
  /**
   * Reset to flat space
   */
  flatten() {
    this.isWarping = false;
    this.warpIntensity = 0;
    this.warpedSpace.nodes.clear();
    this.warpedSpace.newGlyphs = [];
    this.warpedSpace.curvature = 0;
    
    console.log('📐 Space flattened to 2D');
    
    this.emit('space-flattened');
  }
  
  /**
   * Get visualization data
   */
  getVisualizationData() {
    const topology = this.getTopology(this.isWarping ? 'warped' : 'flat');
    const metrics = this.config.mesh.computeMetrics();
    
    return {
      topology,
      metrics: {
        K: metrics.K,
        L: metrics.L,
        H: metrics.H
      },
      warping: {
        active: this.isWarping,
        intensity: this.warpIntensity,
        curvature: this.warpedSpace.curvature
      }
    };
  }
}

export { GlyphSpaceWarper };
export default GlyphSpaceWarper;