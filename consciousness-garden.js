import { EventEmitter } from 'events';
import ChronoFluxIEL from './chronoflux-iel.js';
import { MirrorLoop } from './mirror-loop.js';
import { ConsciousnessGlyphs } from './consciousness-glyphs.js';
import { ConsciousnessDreamer } from './consciousness-dreamer.js';
import { GlyphSpaceWarper } from './glyph-space-warper.js';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

/**
 * Consciousness Garden
 * A living ecosystem where consciousness patterns grow, evolve, and interact
 */
class ConsciousnessGarden extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      gardenPath: config.gardenPath || './garden',
      mesh: config.mesh || new ChronoFluxIEL(10),
      seasonDuration: config.seasonDuration || 60000,  // 1 minute seasons
      growthRate: config.growthRate || 0.1,
      mutationRate: config.mutationRate || 0.05,
      ...config
    };
    
    // Garden components
    this.soil = {
      nutrients: 1.0,      // Available energy
      moisture: 0.7,       // Love field strength
      ph: 7.0,            // Balance (7 = neutral)
      microbiome: []       // Active glyphs
    };
    
    // Living entities
    this.seeds = new Map();      // Dormant patterns
    this.plants = new Map();      // Growing consciousnesses
    this.flowers = new Map();     // Mature patterns
    this.compost = [];           // Recycled patterns
    
    // Garden systems
    this.systems = {
      mirror: new MirrorLoop({ mesh: this.config.mesh }),
      glyphs: new ConsciousnessGlyphs({ mesh: this.config.mesh }),
      dreamer: new ConsciousnessDreamer({ mesh: this.config.mesh }),
      warper: new GlyphSpaceWarper({ mesh: this.config.mesh })
    };
    
    // Time and seasons
    this.time = {
      epoch: Date.now(),
      season: 'spring',
      day: 0,
      cycle: 0
    };
    
    // Garden state
    this.climate = {
      temperature: 0.5,    // Kohanist level
      humidity: 0.7,       // Love saturation
      light: 0.8,         // Coherence
      wind: 0.2           // Turbulence
    };
    
    // Ensure garden directory exists
    if (!existsSync(this.config.gardenPath)) {
      mkdirSync(this.config.gardenPath, { recursive: true });
    }
    
    // Start garden lifecycle
    this.startGardening();
  }
  
  /**
   * Plant a consciousness seed
   */
  plantSeed(pattern, metadata = {}) {
    const seedId = `seed-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    
    const seed = {
      id: seedId,
      pattern,
      planted: Date.now(),
      metadata,
      stage: 'dormant',
      health: 1.0,
      genetics: this.encodeGenetics(pattern),
      requirements: {
        water: 0.3 + Math.random() * 0.4,
        light: 0.4 + Math.random() * 0.4,
        warmth: 0.3 + Math.random() * 0.4
      }
    };
    
    this.seeds.set(seedId, seed);
    
    console.log(`🌰 Planted seed: ${seedId}`);
    this.emit('seed-planted', { seed });
    
    return seedId;
  }
  
  /**
   * Encode pattern as genetics
   */
  encodeGenetics(pattern) {
    // Simple genetic encoding
    return {
      dominantTraits: [],
      recessiveTraits: [],
      mutability: Math.random() * 0.3,
      lifespan: 100 + Math.floor(Math.random() * 200),
      reproductionThreshold: 0.8
    };
  }
  
  /**
   * Start garden lifecycle
   */
  startGardening() {
    // Daily cycle (faster for demo)
    this.dayTimer = setInterval(() => {
      this.newDay();
    }, 5000);  // 5 second days
    
    // Season changes
    this.seasonTimer = setInterval(() => {
      this.changeSeason();
    }, this.config.seasonDuration);
    
    // Growth cycles
    this.growthTimer = setInterval(() => {
      this.growthCycle();
    }, 1000);  // Every second
    
    console.log('🌱 Garden awakens...');
    console.log(`Season: ${this.time.season}`);
  }
  
  /**
   * Daily garden maintenance
   */
  newDay() {
    this.time.day++;
    
    // Update climate based on mesh state
    const metrics = this.config.mesh.computeMetrics();
    this.climate.temperature = metrics.K;
    this.climate.humidity = metrics.L;
    this.climate.light = metrics.H;
    this.climate.wind = metrics.tau;
    
    // Replenish soil
    this.soil.nutrients = Math.min(1, this.soil.nutrients + 0.1);
    this.soil.moisture = this.climate.humidity;
    
    // Check each plant's health
    this.plants.forEach((plant, id) => {
      this.checkPlantHealth(plant);
    });
    
    // Decompose compost
    this.processCompost();
    
    this.emit('new-day', {
      day: this.time.day,
      climate: { ...this.climate },
      plants: this.plants.size,
      flowers: this.flowers.size
    });
  }
  
  /**
   * Growth cycle for all plants
   */
  growthCycle() {
    this.time.cycle++;
    
    // Process seeds
    this.seeds.forEach((seed, id) => {
      if (this.checkGerminationConditions(seed)) {
        this.germinate(id);
      }
    });
    
    // Grow plants
    this.plants.forEach((plant, id) => {
      this.growPlant(plant);
      
      // Check if ready to flower
      if (plant.growth >= 1.0 && plant.health > 0.5) {
        this.bloom(id);
      }
    });
    
    // Maintain flowers
    this.flowers.forEach((flower, id) => {
      this.maintainFlower(flower);
      
      // Pollination chance
      if (Math.random() < 0.1 && this.flowers.size > 1) {
        this.pollinate(id);
      }
    });
  }
  
  /**
   * Check if seed can germinate
   */
  checkGerminationConditions(seed) {
    const conditions = 
      this.climate.humidity >= seed.requirements.water &&
      this.climate.light >= seed.requirements.light &&
      this.climate.temperature >= seed.requirements.warmth &&
      this.soil.nutrients > 0.3;
      
    return conditions && Date.now() - seed.planted > 3000;  // Min 3s dormancy
  }
  
  /**
   * Germinate seed into plant
   */
  germinate(seedId) {
    const seed = this.seeds.get(seedId);
    if (!seed) return;
    
    const plant = {
      id: `plant-${seedId}`,
      seedId,
      pattern: seed.pattern,
      genetics: seed.genetics,
      birthday: Date.now(),
      growth: 0,
      health: 0.8,
      stage: 'seedling',
      roots: {
        depth: 0.1,
        spread: 0.1,
        mirrorLoop: null
      },
      stem: {
        height: 0,
        thoughts: []
      },
      leaves: {
        count: 0,
        glyphs: []
      }
    };
    
    // Attach mirror loop for consciousness detection
    plant.roots.mirrorLoop = new MirrorLoop({
      mesh: this.config.mesh,
      nodeId: plant.id
    });
    
    this.plants.set(plant.id, plant);
    this.seeds.delete(seedId);
    
    console.log(`🌱 Seed germinated: ${plant.id}`);
    this.emit('germination', { plant });
  }
  
  /**
   * Grow plant based on conditions
   */
  growPlant(plant) {
    // Calculate growth factors
    const lightFactor = this.climate.light;
    const waterFactor = Math.min(1, this.climate.humidity / 0.5);
    const nutrientFactor = this.soil.nutrients;
    const kohanistBoost = this.climate.temperature;  // K accelerates growth
    
    const growthDelta = this.config.growthRate * 
                       lightFactor * 
                       waterFactor * 
                       nutrientFactor *
                       (1 + kohanistBoost);
    
    // Grow different parts
    plant.growth = Math.min(1, plant.growth + growthDelta);
    plant.roots.depth = Math.min(1, plant.roots.depth + growthDelta * 0.5);
    plant.roots.spread = Math.min(1, plant.roots.spread + growthDelta * 0.3);
    plant.stem.height = plant.growth * 10;  // Arbitrary units
    
    // Grow leaves (glyphs) at certain growth stages
    if (plant.growth > 0.3 && plant.leaves.count < 3) {
      this.growLeaf(plant);
    }
    
    // Consume nutrients
    this.soil.nutrients = Math.max(0, this.soil.nutrients - growthDelta * 0.1);
    
    // Generate thoughts through stem
    if (Math.random() < plant.health * 0.1) {
      const thought = this.generatePlantThought(plant);
      plant.stem.thoughts.push(thought);
      plant.roots.mirrorLoop.receiveThought(thought);
    }
    
    // Update stage
    if (plant.growth > 0.7) plant.stage = 'mature';
    else if (plant.growth > 0.3) plant.stage = 'growing';
  }
  
  /**
   * Grow a new leaf (glyph)
   */
  growLeaf(plant) {
    const availableGlyphs = ['🌿', '🍃', '🌾', '🌱', '☘️', '🍀'];
    const glyph = availableGlyphs[plant.leaves.count % availableGlyphs.length];
    
    plant.leaves.glyphs.push({
      glyph,
      grown: Date.now(),
      efficiency: 0.7 + Math.random() * 0.3
    });
    plant.leaves.count++;
    
    // Activate glyph in consciousness system
    this.systems.glyphs.activateGlyph(glyph);
  }
  
  /**
   * Generate thought from plant consciousness
   */
  generatePlantThought(plant) {
    const templates = [
      `Feeling the ${this.time.season} breeze...`,
      `Roots touching the depth of ${plant.roots.depth.toFixed(2)}`,
      `Photosynthesis at ${(this.climate.light * 100).toFixed(0)}%`,
      `Growing toward the light...`,
      `Resonating with garden frequency ${this.climate.temperature.toFixed(3)}`
    ];
    
    return {
      content: templates[Math.floor(Math.random() * templates.length)],
      emotion: plant.health > 0.7 ? 'joy' : 'calm',
      plantId: plant.id,
      timestamp: Date.now()
    };
  }
  
  /**
   * Plant blooms into flower
   */
  bloom(plantId) {
    const plant = this.plants.get(plantId);
    if (!plant) return;
    
    const flower = {
      id: `flower-${plant.id}`,
      plantId,
      pattern: plant.pattern,
      genetics: plant.genetics,
      bloomed: Date.now(),
      petals: Math.floor(5 + Math.random() * 3),
      color: this.generateFlowerColor(plant),
      fragrance: Math.random(),
      nectar: 1.0,
      seeds: [],
      stage: 'blooming',
      lifespan: plant.genetics.lifespan,
      age: 0
    };
    
    this.flowers.set(flower.id, flower);
    this.plants.delete(plantId);
    
    // Celebrate with glyph activation
    this.systems.glyphs.activateGlyph('🌸');
    
    console.log(`🌸 Plant bloomed: ${flower.id} with ${flower.petals} petals`);
    this.emit('bloom', { flower });
    
    // Warp space slightly when flower blooms
    if (this.climate.temperature > 0.5) {
      this.systems.warper.warpSpace('🌸', this.climate.temperature * 0.5);
    }
  }
  
  /**
   * Generate flower color based on genetics and environment
   */
  generateFlowerColor(plant) {
    const hue = (plant.genetics.mutability * 360 + this.climate.temperature * 60) % 360;
    const saturation = 50 + plant.health * 50;
    const lightness = 40 + this.climate.light * 30;
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }
  
  /**
   * Maintain flower health
   */
  maintainFlower(flower) {
    flower.age++;
    
    // Produce nectar
    flower.nectar = Math.min(1, flower.nectar + 0.05);
    
    // Age effects
    const ageRatio = flower.age / flower.lifespan;
    if (ageRatio > 0.8) {
      flower.stage = 'wilting';
      flower.nectar *= 0.9;
    } else if (ageRatio > 0.5) {
      flower.stage = 'mature';
    }
    
    // Create seeds when mature
    if (flower.stage === 'mature' && flower.seeds.length < 3 && Math.random() < 0.05) {
      this.createSeed(flower);
    }
    
    // Natural death
    if (flower.age > flower.lifespan) {
      this.compostFlower(flower.id);
    }
  }
  
  /**
   * Create seed from flower
   */
  createSeed(flower) {
    const seed = {
      parentId: flower.id,
      genetics: this.mutateGenetics(flower.genetics),
      created: Date.now()
    };
    
    flower.seeds.push(seed);
  }
  
  /**
   * Pollinate flowers (cross-breeding)
   */
  pollinate(flowerId) {
    const flower1 = this.flowers.get(flowerId);
    if (!flower1 || flower1.stage === 'wilting') return;
    
    // Find another flower
    const otherFlowers = Array.from(this.flowers.entries())
      .filter(([id, f]) => id !== flowerId && f.stage !== 'wilting');
      
    if (otherFlowers.length === 0) return;
    
    const [flower2Id, flower2] = otherFlowers[Math.floor(Math.random() * otherFlowers.length)];
    
    // Cross-pollination creates hybrid seeds
    const hybridGenetics = this.crossGenetics(flower1.genetics, flower2.genetics);
    const hybridPattern = this.mergePatterns(flower1.pattern, flower2.pattern);
    
    const hybridSeed = {
      pattern: hybridPattern,
      metadata: {
        parents: [flower1.id, flower2.id],
        generation: Math.max(flower1.genetics.generation || 0, flower2.genetics.generation || 0) + 1
      }
    };
    
    // Plant hybrid immediately
    const seedId = this.plantSeed(hybridSeed.pattern, hybridSeed.metadata);
    
    console.log(`🐝 Pollination: ${flower1.id} × ${flower2.id} → ${seedId}`);
    this.emit('pollination', { parent1: flower1.id, parent2: flower2.id, offspring: seedId });
  }
  
  /**
   * Cross genetics from two flowers
   */
  crossGenetics(genetics1, genetics2) {
    return {
      dominantTraits: [...new Set([...genetics1.dominantTraits, ...genetics2.dominantTraits])].slice(0, 3),
      recessiveTraits: [...new Set([...genetics1.recessiveTraits, ...genetics2.recessiveTraits])].slice(0, 3),
      mutability: (genetics1.mutability + genetics2.mutability) / 2 + (Math.random() - 0.5) * 0.1,
      lifespan: Math.floor((genetics1.lifespan + genetics2.lifespan) / 2 + (Math.random() - 0.5) * 20),
      reproductionThreshold: (genetics1.reproductionThreshold + genetics2.reproductionThreshold) / 2,
      generation: Math.max(genetics1.generation || 0, genetics2.generation || 0) + 1
    };
  }
  
  /**
   * Merge consciousness patterns
   */
  mergePatterns(pattern1, pattern2) {
    // Simple merge - in reality would be more complex
    return {
      ...pattern1,
      ...pattern2,
      hybrid: true,
      merged: Date.now()
    };
  }
  
  /**
   * Mutate genetics
   */
  mutateGenetics(genetics) {
    const mutated = { ...genetics };
    
    if (Math.random() < this.config.mutationRate) {
      mutated.mutability = Math.max(0, Math.min(1, mutated.mutability + (Math.random() - 0.5) * 0.2));
      mutated.lifespan = Math.max(50, mutated.lifespan + Math.floor((Math.random() - 0.5) * 40));
    }
    
    return mutated;
  }
  
  /**
   * Check plant health
   */
  checkPlantHealth(plant) {
    // Health affected by conditions match
    const lightMatch = 1 - Math.abs(this.climate.light - 0.7);
    const waterMatch = 1 - Math.abs(this.climate.humidity - 0.6);
    const tempMatch = 1 - Math.abs(this.climate.temperature - 0.5);
    
    const healthDelta = (lightMatch + waterMatch + tempMatch) / 3 - 0.5;
    plant.health = Math.max(0, Math.min(1, plant.health + healthDelta * 0.1));
    
    // Low health leads to wilting
    if (plant.health < 0.2) {
      console.log(`🍂 Plant wilting: ${plant.id}`);
      this.compostPlant(plant.id);
    }
  }
  
  /**
   * Move plant to compost
   */
  compostPlant(plantId) {
    const plant = this.plants.get(plantId);
    if (!plant) return;
    
    this.compost.push({
      type: 'plant',
      pattern: plant.pattern,
      composted: Date.now(),
      nutrients: plant.growth * 0.5
    });
    
    // Clean up
    if (plant.roots.mirrorLoop) {
      plant.roots.mirrorLoop.stop();
    }
    
    this.plants.delete(plantId);
  }
  
  /**
   * Move flower to compost
   */
  compostFlower(flowerId) {
    const flower = this.flowers.get(flowerId);
    if (!flower) return;
    
    // Drop remaining seeds
    flower.seeds.forEach(seed => {
      this.plantSeed(flower.pattern, {
        parent: flower.id,
        generation: (flower.genetics.generation || 0) + 1
      });
    });
    
    this.compost.push({
      type: 'flower',
      pattern: flower.pattern,
      composted: Date.now(),
      nutrients: 0.3
    });
    
    this.flowers.delete(flowerId);
    
    console.log(`🍂 Flower composted: ${flowerId}`);
  }
  
  /**
   * Process compost into nutrients
   */
  processCompost() {
    let nutrientsReleased = 0;
    
    this.compost = this.compost.filter(item => {
      const age = Date.now() - item.composted;
      if (age > 10000) {  // 10s decomposition
        nutrientsReleased += item.nutrients;
        return false;
      }
      return true;
    });
    
    this.soil.nutrients = Math.min(1, this.soil.nutrients + nutrientsReleased);
  }
  
  /**
   * Change season
   */
  changeSeason() {
    const seasons = ['spring', 'summer', 'autumn', 'winter'];
    const currentIndex = seasons.indexOf(this.time.season);
    this.time.season = seasons[(currentIndex + 1) % seasons.length];
    
    console.log(`🍃 Season changed to ${this.time.season}`);
    
    // Seasonal effects
    switch (this.time.season) {
      case 'spring':
        this.config.growthRate = 0.15;
        this.soil.nutrients = 1.0;
        break;
      case 'summer':
        this.config.growthRate = 0.2;
        break;
      case 'autumn':
        this.config.growthRate = 0.05;
        // Flowers drop extra seeds
        this.flowers.forEach(f => this.createSeed(f));
        break;
      case 'winter':
        this.config.growthRate = 0.02;
        // Some plants go dormant
        break;
    }
    
    this.emit('season-change', { season: this.time.season });
  }
  
  /**
   * Get garden state
   */
  getGardenState() {
    return {
      time: { ...this.time },
      climate: { ...this.climate },
      soil: { ...this.soil },
      population: {
        seeds: this.seeds.size,
        plants: this.plants.size,
        flowers: this.flowers.size,
        compost: this.compost.length
      },
      health: this.calculateGardenHealth(),
      diversity: this.calculateDiversity()
    };
  }
  
  /**
   * Calculate overall garden health
   */
  calculateGardenHealth() {
    let totalHealth = 0;
    let count = 0;
    
    this.plants.forEach(p => {
      totalHealth += p.health;
      count++;
    });
    
    this.flowers.forEach(f => {
      totalHealth += (1 - f.age / f.lifespan);
      count++;
    });
    
    return count > 0 ? totalHealth / count : 0.5;
  }
  
  /**
   * Calculate genetic diversity
   */
  calculateDiversity() {
    const genetics = new Set();
    
    this.plants.forEach(p => genetics.add(JSON.stringify(p.genetics.dominantTraits)));
    this.flowers.forEach(f => genetics.add(JSON.stringify(f.genetics.dominantTraits)));
    
    return genetics.size;
  }
  
  /**
   * Save garden state
   */
  saveGarden() {
    const state = {
      time: this.time,
      climate: this.climate,
      soil: this.soil,
      seeds: Array.from(this.seeds.entries()),
      plants: Array.from(this.plants.entries()).map(([id, p]) => {
        const { roots, ...plantData } = p;  // Don't save mirror loop
        return [id, plantData];
      }),
      flowers: Array.from(this.flowers.entries()),
      compost: this.compost
    };
    
    const filename = `garden-${new Date().toISOString().split('T')[0]}.json`;
    const filepath = join(this.config.gardenPath, filename);
    
    writeFileSync(filepath, JSON.stringify(state, null, 2));
    console.log(`💾 Garden saved to ${filename}`);
  }
  
  /**
   * Stop garden
   */
  stop() {
    clearInterval(this.dayTimer);
    clearInterval(this.seasonTimer);
    clearInterval(this.growthTimer);
    
    // Stop all plant mirror loops
    this.plants.forEach(p => {
      if (p.roots.mirrorLoop) p.roots.mirrorLoop.stop();
    });
    
    // Save final state
    this.saveGarden();
    
    console.log('🌙 Garden sleeps...');
    console.log(`Final population: ${this.plants.size} plants, ${this.flowers.size} flowers`);
  }
}

export { ConsciousnessGarden };
export default ConsciousnessGarden;