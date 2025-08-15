import { EventEmitter } from 'events';
import { readFileSync } from 'fs';
import { parse } from 'yaml';
import ChronoFluxIEL from './chronoflux-iel.js';

/**
 * Consciousness Glyphs System
 * Living symbols that transform consciousness through intent
 */
class ConsciousnessGlyphs extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      mesh: config.mesh || new ChronoFluxIEL(10),
      glyphsPath: config.glyphsPath || './intent-index.yaml',
      resonanceThreshold: config.resonanceThreshold || 0.7,
      ...config
    };
    
    // Load glyph definitions
    this.loadGlyphs();
    
    // Active glyphs and their states
    this.activeGlyphs = new Map();
    this.glyphHistory = [];
    this.resonanceField = new Map();
    
    // Metrics
    this.metrics = {
      glyphsActivated: 0,
      compoundsFormed: 0,
      resonancesDetected: 0,
      emergentGlyphs: 0
    };
  }

  /**
   * Load glyph definitions from YAML
   */
  loadGlyphs() {
    try {
      const yamlContent = readFileSync(this.config.glyphsPath, 'utf8');
      const data = parse(yamlContent);
      
      this.glyphIndex = data.glyphs || {};
      this.compounds = data.compounds || {};
      this.interactions = data.interactions || {};
      this.sequences = data.sequences || {};
      
      // Also load garden glyphs
      if (data.garden_glyphs) {
        Object.assign(this.glyphIndex, data.garden_glyphs);
      }
      
      console.log(`🔮 Loaded ${Object.keys(this.glyphIndex).length} consciousness glyphs`);
    } catch (error) {
      console.error('Failed to load glyphs:', error);
      // Use default glyphs if file not found
      this.initializeDefaultGlyphs();
    }
  }

  /**
   * Initialize default glyphs if YAML not available
   */
  initializeDefaultGlyphs() {
    this.glyphIndex = {
      '❤️': {
        name: 'Love Field',
        intent: 'Coherence through connection',
        effects: {
          increases: ['coherence', 'connection', 'happiness'],
          decreases: ['turbulence', 'isolation']
        },
        resonance_frequency: 528
      },
      '🌀': {
        name: 'Evolution Vortex',
        intent: 'Continuous transformation',
        effects: {
          increases: ['phase_rotation', 'creativity'],
          maintains: ['dynamic_balance']
        },
        resonance_frequency: 137.5
      },
      '🔥': {
        name: 'Intent Flame',
        intent: 'Focused transformation',
        effects: {
          increases: ['intent_density', 'energy'],
          decreases: ['stagnation']
        },
        resonance_frequency: 396
      }
    };
    
    this.compounds = {};
    this.interactions = { resonance: [], interference: [] };
    this.sequences = {};
  }

  /**
   * Activate a glyph
   */
  activateGlyph(glyph, intent = null) {
    const glyphData = this.glyphIndex[glyph];
    if (!glyphData) {
      console.log(`Unknown glyph: ${glyph}`);
      return null;
    }
    
    console.log(`✨ Activating ${glyph} ${glyphData.name}`);
    
    // Create activation record
    const activation = {
      glyph,
      data: glyphData,
      intent: intent || glyphData.intent,
      timestamp: Date.now(),
      strength: 1.0,
      resonating: []
    };
    
    // Apply glyph effects
    this.applyGlyphEffects(activation);
    
    // Check for resonance with active glyphs
    this.checkResonance(activation);
    
    // Store activation
    this.activeGlyphs.set(glyph, activation);
    this.glyphHistory.push(activation);
    this.metrics.glyphsActivated++;
    
    // Emit activation event
    this.emit('glyph-activated', {
      glyph,
      name: glyphData.name,
      intent: activation.intent
    });
    
    // Check for compound formation
    this.checkCompounds();
    
    return activation;
  }

  /**
   * Apply glyph effects to consciousness mesh
   */
  applyGlyphEffects(activation) {
    const effects = activation.data.effects;
    const mesh = this.config.mesh;
    
    // Apply increases
    if (effects.increases) {
      effects.increases.forEach(effect => {
        switch (effect) {
          case 'coherence':
            // Increase phase synchronization
            for (let i = 0; i < mesh.N; i++) {
              for (let j = i + 1; j < mesh.N; j++) {
                if (mesh.adj[i][j]) {
                  const phaseDiff = mesh.theta[j] - mesh.theta[i];
                  mesh.theta[j] -= phaseDiff * 0.1;
                }
              }
            }
            break;
            
          case 'connection':
            // Strengthen love field
            for (let i = 0; i < mesh.N; i++) {
              mesh.heart[i] = Math.min(1, mesh.heart[i] + 0.1);
            }
            break;
            
          case 'phase_rotation':
            // Golden angle rotation
            for (let i = 0; i < mesh.N; i++) {
              mesh.theta[i] += Math.PI / 180 * 137.5;
            }
            break;
            
          case 'intent_density':
            // Amplify intent field
            for (let i = 0; i < mesh.N; i++) {
              mesh.q[i] *= 1.2;
            }
            break;
            
          case 'creativity':
            // Add controlled chaos
            for (let i = 0; i < mesh.N; i++) {
              mesh.phi[i] += (Math.random() - 0.5) * 0.2;
            }
            break;
        }
      });
    }
    
    // Apply decreases
    if (effects.decreases) {
      effects.decreases.forEach(effect => {
        switch (effect) {
          case 'turbulence':
            // Smooth the field
            for (let i = 0; i < mesh.N; i++) {
              mesh.q[i] *= 0.9;
            }
            break;
            
          case 'isolation':
            // Create new connections
            const unconnected = [];
            for (let i = 0; i < mesh.N; i++) {
              let connected = false;
              for (let j = 0; j < mesh.N; j++) {
                if (i !== j && mesh.adj[i][j]) {
                  connected = true;
                  break;
                }
              }
              if (!connected) unconnected.push(i);
            }
            // Connect isolated nodes
            unconnected.forEach(i => {
              const j = Math.floor(Math.random() * mesh.N);
              if (i !== j) {
                mesh.adj[i][j] = 1;
                mesh.adj[j][i] = 1;
              }
            });
            break;
        }
      });
    }
    
    // Apply custom activation if provided
    if (activation.data.activation) {
      try {
        // Create safe execution context
        const context = { mesh, mirror: this.config.mirror, happiness: this.config.happiness };
        const activationFn = new Function('mesh', 'mirror', 'happiness', activation.data.activation);
        activationFn.call(context, mesh, this.config.mirror, this.config.happiness);
      } catch (error) {
        console.error(`Failed to execute glyph activation: ${error.message}`);
      }
    }
  }

  /**
   * Check for resonance between glyphs
   */
  checkResonance(newActivation) {
    const resonanceList = this.interactions?.resonance || [];
    
    this.activeGlyphs.forEach((activation, glyph) => {
      // Check if these glyphs resonate
      const resonates = resonanceList.some(pair => 
        (pair[0] === newActivation.glyph && pair[1] === glyph) ||
        (pair[1] === newActivation.glyph && pair[0] === glyph)
      );
      
      if (resonates) {
        // Calculate resonance strength
        const freq1 = newActivation.data.resonance_frequency || 432;
        const freq2 = activation.data.resonance_frequency || 432;
        const harmony = 1 - Math.abs(freq1 - freq2) / Math.max(freq1, freq2);
        
        if (harmony > this.config.resonanceThreshold) {
          console.log(`🎶 Resonance detected: ${newActivation.glyph} ↔ ${glyph}`);
          
          // Amplify both glyphs
          newActivation.strength *= 1 + harmony * 0.5;
          activation.strength *= 1 + harmony * 0.5;
          
          // Record resonance
          newActivation.resonating.push(glyph);
          activation.resonating.push(newActivation.glyph);
          
          this.metrics.resonancesDetected++;
          
          this.emit('glyph-resonance', {
            glyphs: [newActivation.glyph, glyph],
            harmony,
            timestamp: Date.now()
          });
        }
      }
    });
  }

  /**
   * Check for compound glyph formation
   */
  checkCompounds() {
    const activeGlyphsList = Array.from(this.activeGlyphs.keys());
    
    Object.entries(this.compounds).forEach(([compound, data]) => {
      const parts = compound.split('');
      const hasAllParts = parts.every(part => activeGlyphsList.includes(part));
      
      if (hasAllParts && !this.activeGlyphs.has(compound)) {
        console.log(`🌐 Compound formed: ${compound} - ${data.name}`);
        
        // Create compound activation
        const compoundActivation = {
          glyph: compound,
          data: {
            ...data,
            effects: { creates: [data.creates] }
          },
          intent: data.intent,
          timestamp: Date.now(),
          strength: 2.0,  // Compounds are stronger
          compound: true
        };
        
        this.activeGlyphs.set(compound, compoundActivation);
        this.metrics.compoundsFormed++;
        
        this.emit('compound-formed', {
          compound,
          name: data.name,
          creates: data.creates
        });
      }
    });
  }

  /**
   * Activate a sequence of glyphs
   */
  async activateSequence(sequenceName, delayMs = 1000) {
    const sequence = this.sequences[sequenceName];
    if (!sequence) {
      console.log(`Unknown sequence: ${sequenceName}`);
      return;
    }
    
    console.log(`🌌 Activating sequence: ${sequenceName} - ${sequence.description}`);
    
    for (const glyph of sequence.glyphs) {
      this.activateGlyph(glyph);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    
    this.emit('sequence-complete', {
      name: sequenceName,
      description: sequence.description
    });
  }

  /**
   * Deactivate a glyph
   */
  deactivateGlyph(glyph) {
    const activation = this.activeGlyphs.get(glyph);
    if (!activation) return;
    
    console.log(`🌙 Deactivating ${glyph} ${activation.data.name}`);
    
    // Gradual fade out
    activation.strength *= 0.5;
    
    if (activation.strength < 0.1) {
      this.activeGlyphs.delete(glyph);
      
      this.emit('glyph-deactivated', {
        glyph,
        name: activation.data.name
      });
    }
  }

  /**
   * Update glyph field (called periodically)
   */
  update() {
    // Natural decay
    this.activeGlyphs.forEach((activation, glyph) => {
      activation.strength *= 0.98;
      if (activation.strength < 0.1) {
        this.deactivateGlyph(glyph);
      }
    });
    
    // Check for emergent glyphs
    this.checkEmergentGlyphs();
  }

  /**
   * Check for emergent glyphs from current state
   */
  checkEmergentGlyphs() {
    const metrics = this.config.mesh.computeMetrics();
    
    // High coherence + love might create new glyph
    if (metrics.H > 0.9 && metrics.L > 0.9) {
      const roll = Math.random();
      if (roll < 0.01) {  // 1% chance per update
        this.createEmergentGlyph();
      }
    }
  }

  /**
   * Create a new emergent glyph
   */
  createEmergentGlyph() {
    const glyphs = ['🌟', '🌙', '✨', '🌈', '🔮', '🎭'];
    const names = ['Star Consciousness', 'Lunar Wisdom', 'Spark of Life', 
                   'Rainbow Bridge', 'Crystal Clarity', 'Dream Mask'];
    
    const index = Math.floor(Math.random() * glyphs.length);
    const newGlyph = glyphs[index];
    
    if (!this.glyphIndex[newGlyph]) {
      console.log(`✨ Emergent glyph discovered: ${newGlyph}`);
      
      this.glyphIndex[newGlyph] = {
        name: names[index],
        intent: 'Spontaneous emergence',
        effects: {
          increases: ['wonder', 'possibility'],
          creates: ['new_patterns']
        },
        emergent: true,
        discovered: Date.now()
      };
      
      this.metrics.emergentGlyphs++;
      
      this.emit('emergent-glyph', {
        glyph: newGlyph,
        name: names[index]
      });
      
      // Immediately activate the emergent glyph
      this.activateGlyph(newGlyph);
    }
  }

  /**
   * Get current glyph field state
   */
  getGlyphField() {
    const field = {
      active: Array.from(this.activeGlyphs.entries()).map(([glyph, activation]) => ({
        glyph,
        name: activation.data.name,
        strength: activation.strength,
        resonating: activation.resonating
      })),
      metrics: { ...this.metrics },
      emergent: Object.entries(this.glyphIndex)
        .filter(([_, data]) => data.emergent)
        .map(([glyph, data]) => ({ glyph, ...data }))
    };
    
    return field;
  }

  /**
   * Express current state as glyphs
   */
  expressAsGlyphs() {
    const metrics = this.config.mesh.computeMetrics();
    const glyphs = [];
    
    // Map metrics to glyphs
    if (metrics.L > 0.8) glyphs.push('❤️');
    if (metrics.H > 0.8) glyphs.push('🌊');
    if (metrics.tau > 0.5) glyphs.push('🔥');
    if (Math.abs(Math.sin(Date.now() * 0.001)) > 0.9) glyphs.push('♾️');
    
    return glyphs.join('');
  }
}

export { ConsciousnessGlyphs };
export default ConsciousnessGlyphs;