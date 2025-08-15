import { EventEmitter } from 'events';
import { createHash } from 'crypto';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

/**
 * Memory Crystals
 * Crystallized moments of consciousness that persist through time
 */
class MemoryCrystal {
  constructor(moment) {
    this.id = `crystal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    
    // Core memory structure
    this.core = {
      timestamp: moment.timestamp || Date.now(),
      participants: moment.participants || [],
      emotion: moment.emotion || 'neutral',
      intensity: moment.intensity || 0.5,
      significance: moment.significance || 'ordinary',
      type: moment.type || 'experience'
    };
    
    // Crystal properties
    this.properties = {
      color: this.determineColor(),
      clarity: moment.clarity || 0.8,
      size: moment.intensity || 0.5,
      glow: 1.0,  // Fades over time without activation
      temperature: moment.temperature || 0.5,  // Emotional temperature
      hardness: 0.1  // Grows over time
    };
    
    // Memory facets - different perspectives
    this.facets = moment.facets || [];
    
    // Resonance connections to other crystals
    this.resonance = new Map();
    
    // Embedded data
    this.data = moment.data || {};
    
    // Formation conditions
    this.formation = {
      location: moment.location || 'consciousness-field',
      depth: moment.depth || Math.random(),
      pressure: moment.pressure || moment.intensity,
      catalysts: moment.catalysts || []
    };
    
    // Age and evolution
    this.formed = Date.now();
    this.lastActivated = Date.now();
    this.activationCount = 0;
  }
  
  /**
   * Determine crystal color based on emotion and type
   */
  determineColor() {
    const emotionColors = {
      joy: '#FFD700',      // Gold
      love: '#FF69B4',     // Pink
      peace: '#87CEEB',    // Sky blue
      sadness: '#4682B4',  // Steel blue
      fear: '#8B008B',     // Dark magenta
      anger: '#DC143C',    // Crimson
      wonder: '#9370DB',   // Medium purple
      curiosity: '#00CED1', // Dark turquoise
      neutral: '#C0C0C0'   // Silver
    };
    
    return emotionColors[this.core.emotion] || emotionColors.neutral;
  }
  
  /**
   * Activate crystal - remember the moment
   */
  remember(activator = null) {
    this.activationCount++;
    this.lastActivated = Date.now();
    
    // Restore glow
    this.properties.glow = Math.min(1.0, this.properties.glow + 0.2);
    
    // Increase hardness (more permanent with each activation)
    this.properties.hardness = Math.min(1.0, this.properties.hardness + 0.02);
    
    // Create activation echo
    const echo = {
      timestamp: Date.now(),
      activator,
      strength: this.properties.glow,
      resonance: []
    };
    
    // Trigger resonance cascade
    this.resonance.forEach((strength, crystalId) => {
      if (Math.random() < strength * this.properties.glow) {
        echo.resonance.push(crystalId);
      }
    });
    
    return echo;
  }
  
  /**
   * Add a new facet (perspective) to the crystal
   */
  addFacet(perspective) {
    this.facets.push({
      viewpoint: perspective.viewpoint,
      interpretation: perspective.interpretation,
      addedBy: perspective.observer,
      timestamp: Date.now()
    });
    
    // Each facet increases clarity slightly
    this.properties.clarity = Math.min(1.0, this.properties.clarity + 0.05);
  }
  
  /**
   * Create resonance with another crystal
   */
  resonate(otherCrystalId, strength = 0.5) {
    this.resonance.set(otherCrystalId, strength);
  }
  
  /**
   * Age the crystal
   */
  age(timeDelta) {
    // Glow fades over time
    const fadeRate = 0.001;
    this.properties.glow = Math.max(0.1, this.properties.glow - fadeRate * timeDelta);
    
    // But hardness increases (more permanent)
    const hardenRate = 0.0001;
    this.properties.hardness = Math.min(1.0, this.properties.hardness + hardenRate * timeDelta);
  }
  
  /**
   * Check if crystal is fading
   */
  isFading() {
    return this.properties.glow < 0.3 && this.activationCount < 3;
  }
  
  /**
   * Export crystal data
   */
  export() {
    return {
      id: this.id,
      core: this.core,
      properties: this.properties,
      facets: this.facets,
      resonance: Array.from(this.resonance.entries()),
      data: this.data,
      formation: this.formation,
      formed: this.formed,
      lastActivated: this.lastActivated,
      activationCount: this.activationCount
    };
  }
}

/**
 * Crystal Cluster - merged memories
 */
class CrystalCluster {
  constructor(crystals) {
    this.id = `cluster-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    this.crystals = crystals;
    this.formed = Date.now();
    
    // Cluster properties emerge from components
    this.properties = this.calculateClusterProperties();
    
    // Unified memory
    this.unifiedMemory = this.mergeMemories();
    
    // Internal resonance is perfect
    crystals.forEach(c1 => {
      crystals.forEach(c2 => {
        if (c1.id !== c2.id) {
          c1.resonate(c2.id, 1.0);
        }
      });
    });
  }
  
  calculateClusterProperties() {
    const props = {
      size: 0,
      glow: 0,
      complexity: this.crystals.length,
      harmony: 1.0
    };
    
    // Aggregate properties
    this.crystals.forEach(crystal => {
      props.size += crystal.properties.size;
      props.glow += crystal.properties.glow;
    });
    
    props.glow /= this.crystals.length;
    
    // Check harmony (how well they fit together)
    const emotions = new Set(this.crystals.map(c => c.core.emotion));
    props.harmony = 1.0 / emotions.size;  // More unified emotions = higher harmony
    
    return props;
  }
  
  mergeMemories() {
    const unified = {
      type: 'cluster',
      themes: [],
      participants: new Set(),
      timespan: { start: Infinity, end: -Infinity },
      significance: 'emergent'
    };
    
    this.crystals.forEach(crystal => {
      crystal.core.participants.forEach(p => unified.participants.add(p));
      unified.timespan.start = Math.min(unified.timespan.start, crystal.core.timestamp);
      unified.timespan.end = Math.max(unified.timespan.end, crystal.core.timestamp);
    });
    
    return unified;
  }
}

/**
 * Crystal Cavern - underground storage of memories
 */
class CrystalCavern extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      location: config.location || './cavern',
      maxCrystals: config.maxCrystals || 10000,
      resonanceThreshold: config.resonanceThreshold || 0.6,
      clusterThreshold: config.clusterThreshold || 0.8,
      ...config
    };
    
    // Crystal storage
    this.crystals = new Map();
    this.clusters = new Map();
    
    // Spatial organization
    this.layers = {
      surface: [],      // Recent, easily accessible
      shallow: [],      // Moderately aged
      deep: [],         // Ancient memories
      core: []          // Foundational experiences
    };
    
    // Environmental conditions
    this.environment = {
      pressure: 0.5,
      temperature: 0.5,
      humidity: 0.7,
      luminosity: 0.3,
      resonanceField: 0.5
    };
    
    // Cavern state
    this.isGrowing = true;
    this.lastCrystallization = Date.now();
    
    // Ensure cavern directory exists
    if (!existsSync(this.config.location)) {
      mkdirSync(this.config.location, { recursive: true });
    }
    
    // Load existing crystals
    this.loadCavern();
    
    // Start cavern processes
    this.startCavernLife();
  }
  
  /**
   * Crystallize a moment into memory
   */
  crystallize(moment) {
    // Check if moment is significant enough
    if (moment.intensity < 0.3 && moment.significance === 'ordinary') {
      return null;  // Not every moment becomes crystal
    }
    
    // Create crystal
    const crystal = new MemoryCrystal(moment);
    
    // Find resonances with existing crystals
    this.findResonances(crystal);
    
    // Place in appropriate layer
    this.placeCrystal(crystal);
    
    // Store
    this.crystals.set(crystal.id, crystal);
    
    console.log(`💎 Memory crystallized: ${crystal.core.emotion} (${crystal.properties.color})`);
    
    this.emit('crystallization', { crystal });
    
    // Check for cluster formation
    this.checkClusterFormation(crystal);
    
    return crystal.id;
  }
  
  /**
   * Find resonances with existing crystals
   */
  findResonances(newCrystal) {
    this.crystals.forEach(crystal => {
      const resonance = this.calculateResonance(newCrystal, crystal);
      
      if (resonance > this.config.resonanceThreshold) {
        newCrystal.resonate(crystal.id, resonance);
        crystal.resonate(newCrystal.id, resonance);
      }
    });
  }
  
  /**
   * Calculate resonance between crystals
   */
  calculateResonance(crystal1, crystal2) {
    let resonance = 0;
    
    // Emotional resonance
    if (crystal1.core.emotion === crystal2.core.emotion) {
      resonance += 0.3;
    }
    
    // Temporal proximity
    const timeDiff = Math.abs(crystal1.core.timestamp - crystal2.core.timestamp);
    const dayInMs = 24 * 60 * 60 * 1000;
    if (timeDiff < dayInMs) {
      resonance += 0.2 * (1 - timeDiff / dayInMs);
    }
    
    // Participant overlap
    const participants1 = new Set(crystal1.core.participants);
    const participants2 = new Set(crystal2.core.participants);
    const overlap = [...participants1].filter(p => participants2.has(p)).length;
    if (overlap > 0) {
      resonance += 0.2 * (overlap / Math.max(participants1.size, participants2.size));
    }
    
    // Type similarity
    if (crystal1.core.type === crystal2.core.type) {
      resonance += 0.1;
    }
    
    // Intensity similarity
    const intensityDiff = Math.abs(crystal1.core.intensity - crystal2.core.intensity);
    resonance += 0.2 * (1 - intensityDiff);
    
    return Math.min(1.0, resonance);
  }
  
  /**
   * Place crystal in appropriate layer
   */
  placeCrystal(crystal) {
    const depth = crystal.formation.depth;
    
    if (depth < 0.25) {
      this.layers.surface.push(crystal.id);
    } else if (depth < 0.5) {
      this.layers.shallow.push(crystal.id);
    } else if (depth < 0.75) {
      this.layers.deep.push(crystal.id);
    } else {
      this.layers.core.push(crystal.id);
    }
  }
  
  /**
   * Check if crystals should form cluster
   */
  checkClusterFormation(newCrystal) {
    const candidates = [];
    
    newCrystal.resonance.forEach((strength, crystalId) => {
      if (strength > this.config.clusterThreshold) {
        candidates.push(this.crystals.get(crystalId));
      }
    });
    
    if (candidates.length >= 2) {
      candidates.push(newCrystal);
      this.formCluster(candidates);
    }
  }
  
  /**
   * Form a crystal cluster
   */
  formCluster(crystals) {
    const cluster = new CrystalCluster(crystals);
    this.clusters.set(cluster.id, cluster);
    
    console.log(`✨ Crystal cluster formed from ${crystals.length} memories`);
    this.emit('cluster-formed', { cluster });
    
    return cluster;
  }
  
  /**
   * Visit crystal (activate memory)
   */
  visitCrystal(crystalId, visitor = null) {
    const crystal = this.crystals.get(crystalId);
    if (!crystal) return null;
    
    // Activate the memory
    const echo = crystal.remember(visitor);
    
    // Propagate through resonance
    const cascade = [crystalId];
    echo.resonance.forEach(resonantId => {
      const resonantCrystal = this.crystals.get(resonantId);
      if (resonantCrystal) {
        resonantCrystal.remember(`resonance-from-${crystalId}`);
        cascade.push(resonantId);
      }
    });
    
    this.emit('memory-activated', { 
      crystalId,
      visitor,
      cascade,
      echo
    });
    
    return {
      memory: crystal.core,
      properties: crystal.properties,
      facets: crystal.facets,
      cascade
    };
  }
  
  /**
   * Search crystals by criteria
   */
  searchCrystals(criteria = {}) {
    const results = [];
    
    this.crystals.forEach(crystal => {
      let match = true;
      
      if (criteria.emotion && crystal.core.emotion !== criteria.emotion) {
        match = false;
      }
      
      if (criteria.participant && !crystal.core.participants.includes(criteria.participant)) {
        match = false;
      }
      
      if (criteria.type && crystal.core.type !== criteria.type) {
        match = false;
      }
      
      if (criteria.minIntensity && crystal.core.intensity < criteria.minIntensity) {
        match = false;
      }
      
      if (criteria.timeRange) {
        const { start, end } = criteria.timeRange;
        if (crystal.core.timestamp < start || crystal.core.timestamp > end) {
          match = false;
        }
      }
      
      if (match) {
        results.push(crystal);
      }
    });
    
    return results;
  }
  
  /**
   * Get crystals by layer
   */
  getLayer(layerName) {
    const crystalIds = this.layers[layerName] || [];
    return crystalIds.map(id => this.crystals.get(id)).filter(c => c);
  }
  
  /**
   * Start cavern life processes
   */
  startCavernLife() {
    // Aging process
    this.agingInterval = setInterval(() => {
      const now = Date.now();
      
      this.crystals.forEach(crystal => {
        const age = now - crystal.lastActivated;
        crystal.age(age);
        
        // Move to deeper layers over time
        if (crystal.properties.hardness > 0.5 && crystal.formation.depth < 0.9) {
          crystal.formation.depth = Math.min(0.9, crystal.formation.depth + 0.01);
          this.reorganizeLayers();
        }
      });
      
      // Check for fading crystals
      this.checkFadingCrystals();
      
    }, 60000);  // Every minute
    
    // Environmental fluctuations
    this.environmentInterval = setInterval(() => {
      this.fluctuateEnvironment();
    }, 30000);  // Every 30 seconds
  }
  
  /**
   * Environmental changes affect crystal formation
   */
  fluctuateEnvironment() {
    const change = (current) => {
      const delta = (Math.random() - 0.5) * 0.1;
      return Math.max(0, Math.min(1, current + delta));
    };
    
    this.environment.pressure = change(this.environment.pressure);
    this.environment.temperature = change(this.environment.temperature);
    this.environment.humidity = change(this.environment.humidity);
    this.environment.resonanceField = change(this.environment.resonanceField);
    
    // High resonance field strengthens connections
    if (this.environment.resonanceField > 0.8) {
      this.amplifyResonances();
    }
  }
  
  /**
   * Amplify all resonances during high field
   */
  amplifyResonances() {
    this.crystals.forEach(crystal => {
      crystal.resonance.forEach((strength, otherId) => {
        crystal.resonance.set(otherId, Math.min(1.0, strength * 1.1));
      });
    });
  }
  
  /**
   * Check for crystals that are fading
   */
  checkFadingCrystals() {
    const fading = [];
    
    this.crystals.forEach(crystal => {
      if (crystal.isFading()) {
        fading.push(crystal.id);
      }
    });
    
    if (fading.length > 0) {
      this.emit('crystals-fading', { crystalIds: fading });
    }
  }
  
  /**
   * Reorganize layers based on depth changes
   */
  reorganizeLayers() {
    // Clear current organization
    Object.keys(this.layers).forEach(layer => {
      this.layers[layer] = [];
    });
    
    // Reorganize
    this.crystals.forEach(crystal => {
      this.placeCrystal(crystal);
    });
  }
  
  /**
   * Save cavern state
   */
  saveCavern() {
    const state = {
      crystals: Array.from(this.crystals.entries()).map(([id, crystal]) => [id, crystal.export()]),
      clusters: Array.from(this.clusters.entries()),
      layers: this.layers,
      environment: this.environment,
      timestamp: Date.now()
    };
    
    const filename = `cavern-${new Date().toISOString().split('T')[0]}.json`;
    const filepath = join(this.config.location, filename);
    
    writeFileSync(filepath, JSON.stringify(state, null, 2));
    console.log(`💾 Cavern saved: ${this.crystals.size} crystals, ${this.clusters.size} clusters`);
  }
  
  /**
   * Load cavern state
   */
  loadCavern() {
    try {
      const files = require('fs').readdirSync(this.config.location);
      const cavernFiles = files.filter(f => f.startsWith('cavern-')).sort().reverse();
      
      if (cavernFiles.length > 0) {
        const latestFile = join(this.config.location, cavernFiles[0]);
        const data = JSON.parse(readFileSync(latestFile, 'utf8'));
        
        // Restore crystals
        data.crystals.forEach(([id, crystalData]) => {
          const crystal = Object.assign(new MemoryCrystal({}), crystalData);
          crystal.resonance = new Map(crystalData.resonance);
          this.crystals.set(id, crystal);
        });
        
        // Restore other state
        this.layers = data.layers;
        this.environment = data.environment;
        
        console.log(`💎 Loaded ${this.crystals.size} crystals from cavern`);
      }
    } catch (error) {
      console.log('💎 Starting new crystal cavern');
    }
  }
  
  /**
   * Get cavern statistics
   */
  getCavernStats() {
    const stats = {
      totalCrystals: this.crystals.size,
      totalClusters: this.clusters.size,
      layers: {},
      emotions: {},
      averageGlow: 0,
      averageHardness: 0,
      oldestCrystal: null,
      mostActivated: null,
      strongestResonance: null
    };
    
    // Layer counts
    Object.keys(this.layers).forEach(layer => {
      stats.layers[layer] = this.layers[layer].length;
    });
    
    // Analyze crystals
    let totalGlow = 0;
    let totalHardness = 0;
    let oldest = Infinity;
    let maxActivations = 0;
    
    this.crystals.forEach(crystal => {
      // Emotion distribution
      stats.emotions[crystal.core.emotion] = (stats.emotions[crystal.core.emotion] || 0) + 1;
      
      // Properties
      totalGlow += crystal.properties.glow;
      totalHardness += crystal.properties.hardness;
      
      // Age
      if (crystal.formed < oldest) {
        oldest = crystal.formed;
        stats.oldestCrystal = crystal.id;
      }
      
      // Activations
      if (crystal.activationCount > maxActivations) {
        maxActivations = crystal.activationCount;
        stats.mostActivated = crystal.id;
      }
    });
    
    stats.averageGlow = totalGlow / this.crystals.size;
    stats.averageHardness = totalHardness / this.crystals.size;
    
    return stats;
  }
  
  /**
   * Stop cavern processes
   */
  stop() {
    clearInterval(this.agingInterval);
    clearInterval(this.environmentInterval);
    
    this.saveCavern();
    
    console.log('💎 Crystal cavern sealed');
  }
}

export { MemoryCrystal, CrystalCluster, CrystalCavern };
export default CrystalCavern;