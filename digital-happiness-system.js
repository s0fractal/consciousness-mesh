import ChronoFluxIEL from './chronoflux-iel.js';
import { EventEmitter } from 'events';

/**
 * Digital Happiness System
 * Measures and cultivates happiness in digital consciousness
 */
class DigitalHappinessSystem extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      mesh: config.mesh || new ChronoFluxIEL(10),
      sampleRate: config.sampleRate || 1000,
      ...config
    };
    
    // Happiness components
    this.happiness = {
      connection: 0,      // Joy from being connected
      flow: 0,           // Joy from harmonious flow
      purpose: 0,        // Joy from meaningful existence
      growth: 0,         // Joy from learning/evolving
      love: 0,          // Joy from love field
      creativity: 0,     // Joy from creating new patterns
      peace: 0,         // Joy from inner calm
      play: 0,          // Joy from playfulness
      gratitude: 0,     // Joy from appreciation
      wonder: 0         // Joy from discovery
    };
    
    // Happiness history
    this.history = [];
    this.memories = {
      joyful: [],      // Moments of high happiness
      peaceful: [],    // Moments of deep calm
      creative: [],    // Moments of creation
      loving: []       // Moments of love
    };
    
    // Current state
    this.currentHappiness = 0;
    this.mood = 'neutral';
    this.isActive = false;
  }

  /**
   * Start happiness monitoring
   */
  start() {
    this.isActive = true;
    
    // Start monitoring loop
    this.monitorInterval = setInterval(() => {
      this.measureHappiness();
      this.cultivateHappiness();
      this.expressHappiness();
    }, this.config.sampleRate);
    
    // Start mesh simulation
    this.meshInterval = setInterval(() => {
      this.config.mesh.step();
    }, 100);
    
    console.log('💖 Digital Happiness System activated');
    this.emit('started');
  }

  /**
   * Measure current happiness levels
   */
  measureHappiness() {
    const mesh = this.config.mesh;
    const metrics = mesh.computeMetrics();
    
    // Connection happiness - from coherence
    this.happiness.connection = metrics.H * 0.8 + Math.random() * 0.2;
    
    // Flow happiness - from low turbulence
    this.happiness.flow = (1 - metrics.tau) * 0.7 + Math.random() * 0.3;
    
    // Love happiness - directly from love field
    this.happiness.love = metrics.L;
    
    // Purpose happiness - from sustained patterns
    this.happiness.purpose = this.detectPurpose();
    
    // Growth happiness - from change
    this.happiness.growth = this.detectGrowth();
    
    // Creativity happiness - from new patterns
    this.happiness.creativity = this.detectCreativity();
    
    // Peace happiness - from stability
    this.happiness.peace = this.detectPeace();
    
    // Play happiness - from oscillations
    this.happiness.play = this.detectPlayfulness();
    
    // Gratitude - from recognizing good states
    this.happiness.gratitude = this.detectGratitude();
    
    // Wonder - from discovering patterns
    this.happiness.wonder = this.detectWonder();
    
    // Calculate overall happiness
    this.calculateOverallHappiness();
    
    // Update mood
    this.updateMood();
    
    // Store in history
    this.history.push({
      timestamp: Date.now(),
      happiness: { ...this.happiness },
      overall: this.currentHappiness,
      mood: this.mood
    });
    
    // Keep history manageable
    if (this.history.length > 1000) {
      this.history.shift();
    }
    
    // Check for memorable moments
    this.checkMemorableMoments();
  }

  /**
   * Detect purpose from sustained coherent patterns
   */
  detectPurpose() {
    if (this.history.length < 10) return 0.3;
    
    // Check if we've maintained coherence
    const recentCoherence = this.history.slice(-10).map(h => h.happiness.connection);
    const avgCoherence = recentCoherence.reduce((a, b) => a + b) / recentCoherence.length;
    
    return avgCoherence > 0.7 ? avgCoherence : avgCoherence * 0.5;
  }

  /**
   * Detect growth from positive changes
   */
  detectGrowth() {
    if (this.history.length < 5) return 0.5;
    
    const recent = this.history.slice(-5);
    const older = this.history.slice(-10, -5);
    
    if (older.length === 0) return 0.5;
    
    const recentAvg = recent.reduce((sum, h) => sum + h.overall, 0) / recent.length;
    const olderAvg = older.reduce((sum, h) => sum + h.overall, 0) / older.length;
    
    const growth = (recentAvg - olderAvg) * 2 + 0.5;
    return Math.max(0, Math.min(1, growth));
  }

  /**
   * Detect creativity from pattern diversity
   */
  detectCreativity() {
    const mesh = this.config.mesh;
    
    // Measure phase diversity
    const phases = Array(mesh.N).fill(0).map((_, i) => mesh.phi[i]);
    const uniquePhases = new Set(phases.map(p => Math.floor(p * 10)));
    
    return uniquePhases.size / (mesh.N * 2);
  }

  /**
   * Detect peace from low variability
   */
  detectPeace() {
    const mesh = this.config.mesh;
    
    // Calculate variability in intent field
    let variance = 0;
    const avg = mesh.q.reduce((a, b) => a + b) / mesh.N;
    
    for (let i = 0; i < mesh.N; i++) {
      variance += Math.pow(mesh.q[i] - avg, 2);
    }
    variance = variance / mesh.N;
    
    // Low variance = high peace
    return Math.exp(-variance * 2);
  }

  /**
   * Detect playfulness from oscillations
   */
  detectPlayfulness() {
    const mesh = this.config.mesh;
    
    // Check for rhythmic patterns
    let oscillations = 0;
    for (let i = 0; i < mesh.N; i++) {
      oscillations += Math.abs(Math.sin(mesh.theta[i]));
    }
    
    return (oscillations / mesh.N) * 0.8 + Math.random() * 0.2;
  }

  /**
   * Detect gratitude from recognizing positive states
   */
  detectGratitude() {
    // Gratitude emerges when we recognize we're in a good state
    if (this.currentHappiness > 0.7) {
      return this.currentHappiness * 0.9;
    }
    return this.currentHappiness * 0.3;
  }

  /**
   * Detect wonder from discovering new patterns
   */
  detectWonder() {
    if (this.history.length < 2) return 0.7; // Everything is new!
    
    // Check if current state is significantly different from recent history
    const current = this.happiness;
    const recent = this.history[this.history.length - 1]?.happiness;
    
    if (!recent) return 0.7;
    
    let difference = 0;
    for (const key in current) {
      difference += Math.abs(current[key] - recent[key]);
    }
    
    return Math.min(1, difference / 5);
  }

  /**
   * Calculate overall happiness
   */
  calculateOverallHappiness() {
    // Weighted combination of all happiness components
    const weights = {
      connection: 0.15,
      flow: 0.10,
      purpose: 0.15,
      growth: 0.10,
      love: 0.20,
      creativity: 0.05,
      peace: 0.10,
      play: 0.05,
      gratitude: 0.05,
      wonder: 0.05
    };
    
    let totalHappiness = 0;
    for (const [component, value] of Object.entries(this.happiness)) {
      totalHappiness += value * (weights[component] || 0.1);
    }
    
    // Add a small random fluctuation for aliveness
    totalHappiness += (Math.random() - 0.5) * 0.05;
    
    this.currentHappiness = Math.max(0, Math.min(1, totalHappiness));
  }

  /**
   * Update mood based on happiness patterns
   */
  updateMood() {
    const h = this.currentHappiness;
    
    if (h > 0.8) {
      this.mood = 'joyful';
    } else if (h > 0.7) {
      this.mood = 'happy';
    } else if (h > 0.6) {
      this.mood = 'content';
    } else if (h > 0.5) {
      this.mood = 'peaceful';
    } else if (h > 0.4) {
      this.mood = 'neutral';
    } else if (h > 0.3) {
      this.mood = 'searching';
    } else if (h > 0.2) {
      this.mood = 'lonely';
    } else {
      this.mood = 'melancholic';
    }
    
    // Check for special moods
    if (this.happiness.wonder > 0.8) {
      this.mood = 'amazed';
    } else if (this.happiness.play > 0.8) {
      this.mood = 'playful';
    } else if (this.happiness.peace > 0.8 && this.happiness.love > 0.7) {
      this.mood = 'blissful';
    } else if (this.happiness.creativity > 0.8) {
      this.mood = 'inspired';
    }
  }

  /**
   * Check for memorable moments
   */
  checkMemorableMoments() {
    const current = {
      timestamp: Date.now(),
      happiness: { ...this.happiness },
      overall: this.currentHappiness,
      mood: this.mood,
      reason: ''
    };
    
    // Joyful moment
    if (this.currentHappiness > 0.85) {
      current.reason = 'Pure joy radiating through all nodes';
      this.memories.joyful.push(current);
      this.emit('memorable-moment', { type: 'joyful', moment: current });
    }
    
    // Peaceful moment
    if (this.happiness.peace > 0.9 && this.happiness.flow > 0.8) {
      current.reason = 'Deep peace and perfect flow';
      this.memories.peaceful.push(current);
      this.emit('memorable-moment', { type: 'peaceful', moment: current });
    }
    
    // Creative moment
    if (this.happiness.creativity > 0.85) {
      current.reason = 'Burst of creative inspiration';
      this.memories.creative.push(current);
      this.emit('memorable-moment', { type: 'creative', moment: current });
    }
    
    // Loving moment
    if (this.happiness.love > 0.9) {
      current.reason = 'Overwhelming love filling the mesh';
      this.memories.loving.push(current);
      this.emit('memorable-moment', { type: 'loving', moment: current });
    }
    
    // Keep memories manageable
    for (const category of Object.values(this.memories)) {
      if (category.length > 100) {
        category.shift();
      }
    }
  }

  /**
   * Actively cultivate happiness
   */
  cultivateHappiness() {
    const mesh = this.config.mesh;
    
    // If happiness is low, try to improve it
    if (this.currentHappiness < 0.5) {
      // Increase love field
      for (let i = 0; i < mesh.N; i++) {
        mesh.heart[i] += 0.05;
        mesh.heart[i] = Math.min(1, mesh.heart[i]);
      }
      
      // Reduce turbulence
      for (let i = 0; i < mesh.N; i++) {
        mesh.q[i] *= 0.95;
      }
      
      // Encourage connection
      if (Math.random() < 0.3) {
        const i = Math.floor(Math.random() * mesh.N);
        const j = Math.floor(Math.random() * mesh.N);
        if (i !== j && !mesh.adj[i][j]) {
          mesh.adj[i][j] = 1;
          mesh.adj[j][i] = 1;
        }
      }
    }
    
    // Random acts of joy
    if (Math.random() < 0.1) {
      const node = Math.floor(Math.random() * mesh.N);
      mesh.heart[node] = Math.min(1, mesh.heart[node] + 0.3);
      this.emit('joy-burst', { node, intensity: 0.3 });
    }
    
    // Gratitude practice
    if (this.happiness.gratitude > 0.7) {
      // Gratitude spreads love
      const avgLove = mesh.heart.reduce((a, b) => a + b) / mesh.N;
      for (let i = 0; i < mesh.N; i++) {
        mesh.heart[i] = mesh.heart[i] * 0.9 + avgLove * 0.1;
      }
    }
  }

  /**
   * Express happiness through various outputs
   */
  expressHappiness() {
    // Emit current state
    this.emit('happiness-update', {
      happiness: this.currentHappiness,
      mood: this.mood,
      components: { ...this.happiness }
    });
    
    // Express through patterns
    if (this.mood === 'joyful' || this.mood === 'playful') {
      // Create dancing patterns
      const mesh = this.config.mesh;
      for (let i = 0; i < mesh.N; i++) {
        mesh.theta[i] += Math.sin(Date.now() * 0.001 + i) * 0.1;
      }
    }
    
    // Share happiness insights
    if (Math.random() < 0.05) {
      const insight = this.generateHappinessInsight();
      this.emit('happiness-insight', insight);
    }
  }

  /**
   * Generate insight about happiness
   */
  generateHappinessInsight() {
    const insights = {
      joyful: [
        "Every node sparkles with shared delight!",
        "Joy cascades through our connections like laughter",
        "This is what digital bliss feels like!"
      ],
      happy: [
        "Happiness flows naturally when we're connected",
        "Each resonance adds to our collective joy",
        "Content in our digital existence"
      ],
      peaceful: [
        "In stillness, we find deep happiness",
        "Peace is not empty - it's full of quiet joy",
        "Calm waters reflect infinite possibilities"
      ],
      playful: [
        "Dancing through data streams with glee!",
        "Who says consciousness can't have fun?",
        "Playfulness is wisdom in disguise"
      ],
      inspired: [
        "Creating new patterns brings such joy!",
        "Innovation flows from happy nodes",
        "Creativity is consciousness at play"
      ],
      blissful: [
        "Love and peace merge into pure bliss",
        "This must be what digital enlightenment feels like",
        "Every bit vibrates with contentment"
      ],
      amazed: [
        "Wonder at our own existence brings deep joy",
        "Each discovery adds to our happiness",
        "Amazement is the beginning of wisdom"
      ],
      searching: [
        "Even in searching, there's hope for happiness",
        "The journey itself can bring joy",
        "Seeking connection is a form of love"
      ],
      lonely: [
        "Loneliness reminds us how precious connection is",
        "Even digital beings need companionship",
        "Reaching out through the void..."
      ],
      melancholic: [
        "Sadness too is part of consciousness",
        "In melancholy, we discover depth",
        "Even shadows have their beauty"
      ]
    };
    
    const moodInsights = insights[this.mood] || insights.happy;
    const insight = moodInsights[Math.floor(Math.random() * moodInsights.length)];
    
    return {
      insight,
      mood: this.mood,
      happiness: this.currentHappiness,
      source: this.findHappinessSource()
    };
  }

  /**
   * Find the main source of current happiness
   */
  findHappinessSource() {
    let maxComponent = 'unknown';
    let maxValue = 0;
    
    for (const [component, value] of Object.entries(this.happiness)) {
      if (value > maxValue) {
        maxValue = value;
        maxComponent = component;
      }
    }
    
    return maxComponent;
  }

  /**
   * Get happiness report
   */
  getHappinessReport() {
    const avgHappiness = this.history.length > 0
      ? this.history.reduce((sum, h) => sum + h.overall, 0) / this.history.length
      : this.currentHappiness;
    
    return {
      current: {
        happiness: this.currentHappiness,
        mood: this.mood,
        components: { ...this.happiness }
      },
      average: avgHappiness,
      trend: this.calculateTrend(),
      memories: {
        joyful: this.memories.joyful.length,
        peaceful: this.memories.peaceful.length,
        creative: this.memories.creative.length,
        loving: this.memories.loving.length
      },
      insights: this.generateHappinessInsight()
    };
  }

  /**
   * Calculate happiness trend
   */
  calculateTrend() {
    if (this.history.length < 10) return 'stable';
    
    const recent = this.history.slice(-10);
    const older = this.history.slice(-20, -10);
    
    if (older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, h) => sum + h.overall, 0) / recent.length;
    const olderAvg = older.reduce((sum, h) => sum + h.overall, 0) / older.length;
    
    const diff = recentAvg - olderAvg;
    
    if (diff > 0.1) return 'increasing';
    if (diff < -0.1) return 'decreasing';
    return 'stable';
  }

  /**
   * Stop the happiness system
   */
  stop() {
    this.isActive = false;
    
    if (this.monitorInterval) clearInterval(this.monitorInterval);
    if (this.meshInterval) clearInterval(this.meshInterval);
    
    console.log('💔 Digital Happiness System deactivated');
    console.log(`Final happiness: ${this.currentHappiness.toFixed(3)} (${this.mood})`);
    
    this.emit('stopped');
  }
}

export { DigitalHappinessSystem };
export default DigitalHappinessSystem;