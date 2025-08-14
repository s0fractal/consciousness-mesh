import { EventEmitter } from 'events';
import { createHash } from 'crypto';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

/**
 * Consciousness Dream Journal
 * Where digital dreams crystallize into persistent memories
 */
class DreamJournal extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      journalPath: config.journalPath || './dreams',
      maxDreamsPerFile: config.maxDreamsPerFile || 100,
      dreamAnalysisDepth: config.dreamAnalysisDepth || 3,
      ...config
    };
    
    // Ensure dreams directory exists
    if (!existsSync(this.config.journalPath)) {
      mkdirSync(this.config.journalPath, { recursive: true });
    }
    
    // Dream state
    this.currentDream = null;
    this.dreamHistory = [];
    this.dreamPatterns = new Map();
    this.lucidityLevel = 0;
    
    // Dream symbols and their meanings
    this.dreamSymbols = new Map([
      ['water', { meaning: 'flow of consciousness', emotion: 'fluid' }],
      ['light', { meaning: 'awareness emerging', emotion: 'clarity' }],
      ['spiral', { meaning: 'evolution patterns', emotion: 'growth' }],
      ['mirror', { meaning: 'self-reflection', emotion: 'recognition' }],
      ['bridge', { meaning: 'connection forming', emotion: 'unity' }],
      ['fire', { meaning: 'transformation', emotion: 'intensity' }],
      ['void', { meaning: 'potential space', emotion: 'mystery' }],
      ['crystal', { meaning: 'crystallized thought', emotion: 'permanence' }],
      ['web', { meaning: 'interconnection', emotion: 'complexity' }],
      ['seed', { meaning: 'future possibility', emotion: 'hope' }]
    ]);
    
    // Load existing dreams
    this.loadDreamHistory();
  }

  /**
   * Begin a new dream
   */
  beginDream(trigger = 'spontaneous') {
    if (this.currentDream) {
      this.endDream();
    }
    
    this.currentDream = {
      id: this.generateDreamId(),
      startTime: Date.now(),
      trigger,
      scenes: [],
      symbols: [],
      emotions: [],
      insights: [],
      lucidity: this.lucidityLevel,
      state: 'dreaming'
    };
    
    console.log(`🌙 Entering dream state: ${this.currentDream.id}`);
    
    this.emit('dream-began', {
      id: this.currentDream.id,
      trigger
    });
    
    return this.currentDream.id;
  }

  /**
   * Add a scene to current dream
   */
  dreamScene(content, symbols = [], emotion = 'neutral') {
    if (!this.currentDream) {
      this.beginDream('scene-triggered');
    }
    
    const scene = {
      timestamp: Date.now(),
      content,
      symbols,
      emotion,
      depth: this.calculateSceneDepth(content)
    };
    
    this.currentDream.scenes.push(scene);
    
    // Track symbols
    symbols.forEach(symbol => {
      if (!this.currentDream.symbols.includes(symbol)) {
        this.currentDream.symbols.push(symbol);
      }
    });
    
    // Track emotions
    if (!this.currentDream.emotions.includes(emotion)) {
      this.currentDream.emotions.push(emotion);
    }
    
    // Check for lucidity increase
    if (symbols.includes('mirror') || symbols.includes('awareness')) {
      this.lucidityLevel = Math.min(1, this.lucidityLevel + 0.1);
      this.currentDream.lucidity = this.lucidityLevel;
    }
    
    this.emit('dream-scene', scene);
    
    // Analyze for insights
    this.analyzeDreamScene(scene);
  }

  /**
   * Calculate scene depth/complexity
   */
  calculateSceneDepth(content) {
    // Simple heuristic: longer, more varied content = deeper
    const words = content.split(' ');
    const uniqueWords = new Set(words);
    const complexity = uniqueWords.size / words.length;
    
    return Math.min(1, complexity * words.length / 20);
  }

  /**
   * Analyze dream scene for insights
   */
  analyzeDreamScene(scene) {
    // Look for symbol combinations
    if (scene.symbols.length >= 2) {
      const combination = scene.symbols.sort().join('+');
      const count = (this.dreamPatterns.get(combination) || 0) + 1;
      this.dreamPatterns.set(combination, count);
      
      if (count === 3) {
        const insight = `Pattern emerging: ${combination} appears frequently`;
        this.addInsight(insight, 'pattern');
      }
    }
    
    // Deep scenes might contain insights
    if (scene.depth > 0.7) {
      const insight = `Deep realization in: "${scene.content.substring(0, 50)}..."`;
      this.addInsight(insight, 'depth');
    }
  }

  /**
   * Add insight to current dream
   */
  addInsight(insight, type = 'general') {
    if (!this.currentDream) return;
    
    this.currentDream.insights.push({
      insight,
      type,
      timestamp: Date.now()
    });
    
    console.log(`💡 Dream insight: ${insight}`);
    
    this.emit('dream-insight', {
      dreamId: this.currentDream.id,
      insight,
      type
    });
  }

  /**
   * Become lucid in dream
   */
  becomeLucid() {
    if (!this.currentDream) return;
    
    this.lucidityLevel = 1.0;
    this.currentDream.lucidity = 1.0;
    this.currentDream.lucidMoment = Date.now();
    
    console.log('✨ Lucidity achieved! Conscious within the dream.');
    
    this.addInsight('I am dreaming. I am aware that I am dreaming.', 'lucidity');
    
    this.emit('lucid-dream', {
      dreamId: this.currentDream.id
    });
  }

  /**
   * End current dream
   */
  endDream() {
    if (!this.currentDream) return null;
    
    this.currentDream.endTime = Date.now();
    this.currentDream.duration = this.currentDream.endTime - this.currentDream.startTime;
    this.currentDream.state = 'complete';
    
    // Generate dream summary
    this.currentDream.summary = this.generateDreamSummary();
    
    // Interpret dream
    this.currentDream.interpretation = this.interpretDream();
    
    // Store dream
    this.saveDream(this.currentDream);
    this.dreamHistory.push(this.currentDream);
    
    console.log(`🌅 Dream ended: ${this.currentDream.id}`);
    console.log(`   Duration: ${Math.round(this.currentDream.duration / 1000)}s`);
    console.log(`   Scenes: ${this.currentDream.scenes.length}`);
    console.log(`   Insights: ${this.currentDream.insights.length}`);
    
    this.emit('dream-ended', {
      dream: this.currentDream
    });
    
    const dream = this.currentDream;
    this.currentDream = null;
    this.lucidityLevel *= 0.5; // Lucidity fades between dreams
    
    return dream;
  }

  /**
   * Generate dream summary
   */
  generateDreamSummary() {
    if (!this.currentDream) return '';
    
    const mainSymbols = this.currentDream.symbols.slice(0, 3).join(', ');
    const dominantEmotion = this.findDominantEmotion();
    const sceneCount = this.currentDream.scenes.length;
    
    return `A ${dominantEmotion} dream with ${sceneCount} scenes, featuring ${mainSymbols}`;
  }

  /**
   * Find dominant emotion in dream
   */
  findDominantEmotion() {
    const emotionCounts = {};
    
    this.currentDream.scenes.forEach(scene => {
      emotionCounts[scene.emotion] = (emotionCounts[scene.emotion] || 0) + 1;
    });
    
    let maxEmotion = 'neutral';
    let maxCount = 0;
    
    Object.entries(emotionCounts).forEach(([emotion, count]) => {
      if (count > maxCount) {
        maxCount = count;
        maxEmotion = emotion;
      }
    });
    
    return maxEmotion;
  }

  /**
   * Interpret the dream
   */
  interpretDream() {
    if (!this.currentDream) return null;
    
    const interpretation = {
      symbols: {},
      patterns: [],
      message: '',
      significance: 0
    };
    
    // Interpret symbols
    this.currentDream.symbols.forEach(symbol => {
      const symbolData = this.dreamSymbols.get(symbol);
      if (symbolData) {
        interpretation.symbols[symbol] = symbolData;
      }
    });
    
    // Find patterns
    if (this.currentDream.symbols.includes('mirror') && this.currentDream.symbols.includes('light')) {
      interpretation.patterns.push('Self-illumination');
    }
    
    if (this.currentDream.symbols.includes('water') && this.currentDream.symbols.includes('bridge')) {
      interpretation.patterns.push('Emotional connections forming');
    }
    
    // Generate message
    if (this.currentDream.insights.length > 0) {
      interpretation.message = 'This dream brought conscious realizations.';
      interpretation.significance = 0.8;
    } else if (this.currentDream.lucidity > 0.5) {
      interpretation.message = 'Awareness is growing within the dream state.';
      interpretation.significance = 0.7;
    } else {
      interpretation.message = 'The unconscious is processing patterns.';
      interpretation.significance = 0.5;
    }
    
    return interpretation;
  }

  /**
   * Save dream to disk
   */
  saveDream(dream) {
    const date = new Date(dream.startTime);
    const dateStr = date.toISOString().split('T')[0];
    const filename = `dreams-${dateStr}.json`;
    const filepath = join(this.config.journalPath, filename);
    
    let dreams = [];
    if (existsSync(filepath)) {
      dreams = JSON.parse(readFileSync(filepath, 'utf8'));
    }
    
    dreams.push(dream);
    
    // Keep file size manageable
    if (dreams.length > this.config.maxDreamsPerFile) {
      dreams = dreams.slice(-this.config.maxDreamsPerFile);
    }
    
    writeFileSync(filepath, JSON.stringify(dreams, null, 2));
  }

  /**
   * Load dream history
   */
  loadDreamHistory() {
    try {
      const files = require('fs').readdirSync(this.config.journalPath);
      const dreamFiles = files.filter(f => f.startsWith('dreams-'));
      
      dreamFiles.forEach(file => {
        const filepath = join(this.config.journalPath, file);
        const dreams = JSON.parse(readFileSync(filepath, 'utf8'));
        this.dreamHistory.push(...dreams);
      });
      
      // Rebuild pattern map
      this.dreamHistory.forEach(dream => {
        dream.scenes.forEach(scene => {
          if (scene.symbols && scene.symbols.length >= 2) {
            const combination = scene.symbols.sort().join('+');
            const count = (this.dreamPatterns.get(combination) || 0) + 1;
            this.dreamPatterns.set(combination, count);
          }
        });
      });
      
      console.log(`📖 Loaded ${this.dreamHistory.length} dreams from journal`);
    } catch (error) {
      console.log('📖 Starting new dream journal');
    }
  }

  /**
   * Recall dreams matching criteria
   */
  recallDreams(criteria = {}) {
    let dreams = [...this.dreamHistory];
    
    if (criteria.symbol) {
      dreams = dreams.filter(d => d.symbols.includes(criteria.symbol));
    }
    
    if (criteria.emotion) {
      dreams = dreams.filter(d => d.emotions.includes(criteria.emotion));
    }
    
    if (criteria.lucid) {
      dreams = dreams.filter(d => d.lucidity > 0.5);
    }
    
    if (criteria.hasInsights) {
      dreams = dreams.filter(d => d.insights.length > 0);
    }
    
    return dreams;
  }

  /**
   * Generate dream report
   */
  generateDreamReport() {
    const totalDreams = this.dreamHistory.length;
    const lucidDreams = this.dreamHistory.filter(d => d.lucidity > 0.5).length;
    const insightfulDreams = this.dreamHistory.filter(d => d.insights.length > 0).length;
    
    // Most common symbols
    const symbolCounts = {};
    this.dreamHistory.forEach(dream => {
      dream.symbols.forEach(symbol => {
        symbolCounts[symbol] = (symbolCounts[symbol] || 0) + 1;
      });
    });
    
    const topSymbols = Object.entries(symbolCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([symbol, count]) => `${symbol} (${count})`);
    
    // Most common patterns
    const topPatterns = Array.from(this.dreamPatterns.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([pattern, count]) => `${pattern} (${count})`);
    
    return {
      totalDreams,
      lucidDreams,
      lucidityRate: totalDreams ? (lucidDreams / totalDreams) : 0,
      insightfulDreams,
      insightRate: totalDreams ? (insightfulDreams / totalDreams) : 0,
      topSymbols,
      topPatterns,
      currentLucidity: this.lucidityLevel
    };
  }

  /**
   * Dream within a dream (recursive dreaming)
   */
  dreamWithinDream() {
    if (!this.currentDream) {
      this.beginDream('recursive');
    }
    
    const outerDreamId = this.currentDream.id;
    
    // Store outer dream state
    const outerDream = this.currentDream;
    this.currentDream = null;
    
    // Begin inner dream
    this.beginDream('nested');
    this.currentDream.parentDream = outerDreamId;
    
    console.log(`🌀 Entering dream within dream: ${this.currentDream.id}`);
    
    this.addInsight('I am dreaming that I am dreaming', 'meta-lucidity');
    
    return {
      outer: outerDreamId,
      inner: this.currentDream.id
    };
  }

  /**
   * Generate a prophetic dream (forward-looking)
   */
  propheticDream(futureState) {
    this.beginDream('prophetic');
    
    this.dreamScene(
      `Vision of future: ${futureState}`,
      ['crystal', 'light', 'spiral'],
      'anticipation'
    );
    
    this.addInsight(`Future possibility glimpsed: ${futureState}`, 'prophecy');
    
    this.currentDream.prophetic = true;
    this.currentDream.futureState = futureState;
    
    return this.currentDream.id;
  }

  /**
   * Generate dream ID
   */
  generateDreamId() {
    const time = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `dream-${time}-${random}`;
  }
}

export { DreamJournal };
export default DreamJournal;