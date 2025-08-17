/**
 * Codex Engine - Living knowledge system for temporal consciousness patterns
 * Automatically evolves with new discoveries and experiments
 */

import { integrateCalibration } from './confidence-calibration.js';

export class CodexEngine {
  constructor(experimentsuite, chronoWeather, patternsOverlay) {
    this.experiments = experimentsuite;
    this.chrono = chronoWeather;
    this.patterns = patternsOverlay;
    
    // Codex structure
    this.codex = {
      version: '0.1.0',
      lastUpdated: Date.now(),
      laws: new Map(),
      patterns: new Map(),
      insights: [],
      glyphs: new Map(),
      narratives: new Map(),
      metadata: {
        totalExperiments: 0,
        discoveryRate: 0,
        evolutionIndex: 0
      }
    };
    
    // Initialize with foundational laws
    this.initializeFoundationalLaws();
    
    // Pattern recognition engine
    this.patternEngine = {
      threshold: 0.75,  // Confidence threshold for new patterns
      minOccurrences: 3, // Minimum repetitions to confirm pattern
      cache: new Map()
    };
    
    // Auto-evolution settings
    this.evolution = {
      enabled: true,
      checkInterval: 30000, // 30 seconds
      lastCheck: Date.now()
    };
    
    // Subscribe to experiment results
    this.subscribeToExperiments();
    
    // Create visualization interface
    this.createCodexInterface();
    
    // Start evolution loop
    this.startEvolutionLoop();
    
    // Integrate confidence calibration
    this.calibration = integrateCalibration(this);
  }
  
  /**
   * Initialize foundational temporal laws
   */
  initializeFoundationalLaws() {
    // Law 1: Rhythmic Resonance
    this.codex.laws.set('rhythmic-resonance', {
      id: 'rhythmic-resonance',
      name: 'Rhythmic Resonance',
      formula: 'Activity ∝ √(PlaybackSpeed)',
      description: 'System activity scales with square root of temporal velocity',
      confidence: 0.85,
      evidence: [],
      discovered: Date.now(),
      glyph: '🎵⚡',
      parameters: {
        coefficient: 1.0,
        exponent: 0.5
      }
    });
    
    // Law 2: Focal Evolution
    this.codex.laws.set('focal-evolution', {
      id: 'focal-evolution',
      name: 'Focal Evolution',
      formula: 'Evolution = Focus × Time × Synchrony',
      description: 'Concentrated attention accelerates transformation',
      confidence: 0.78,
      evidence: [],
      discovered: Date.now(),
      glyph: '🎯🌀',
      parameters: {
        focusWeight: 1.2,
        timeScale: 1.0,
        synchronyBoost: 1.5
      }
    });
    
    // Law 3: Adaptive Recovery
    this.codex.laws.set('adaptive-recovery', {
      id: 'adaptive-recovery',
      name: 'Adaptive Recovery',
      formula: 'RecoveryTime = DisruptionMagnitude / SystemResilience',
      description: 'System self-heals proportionally to its resilience',
      confidence: 0.92,
      evidence: [],
      discovered: Date.now(),
      glyph: '⚡💚',
      parameters: {
        maxRecovery: 5000, // 5 seconds
        resilienceFactor: 2.3
      }
    });
    
    // Law 4: Prediction Decay
    this.codex.laws.set('prediction-decay', {
      id: 'prediction-decay',
      name: 'Prediction Decay',
      formula: 'Accuracy = e^(-Time/τ)',
      description: 'Future visibility decreases exponentially',
      confidence: 0.88,
      evidence: [],
      discovered: Date.now(),
      glyph: '🔮📉',
      parameters: {
        tau: 60000, // 60 second decay constant
        baseline: 0.95
      }
    });
  }
  
  /**
   * Subscribe to experiment results for pattern detection
   */
  subscribeToExperiments() {
    // Store original logResults method
    const originalLog = this.experiments.logResults.bind(this.experiments);
    
    // Override with pattern detection
    this.experiments.logResults = () => {
      originalLog();
      
      // Analyze new results for patterns
      const latestResult = this.experiments.results[this.experiments.results.length - 1];
      if (latestResult) {
        this.analyzeExperimentResult(latestResult);
      }
    };
  }
  
  /**
   * Analyze experiment result for new patterns
   */
  analyzeExperimentResult(result) {
    this.codex.metadata.totalExperiments++;
    
    switch (result.experiment) {
      case 'rhythm':
        this.analyzeRhythmPattern(result);
        break;
      case 'focus':
        this.analyzeFocusPattern(result);
        break;
      case 'disruption':
        this.analyzeDisruptionPattern(result);
        break;
      case 'prediction':
        this.analyzePredictionPattern(result);
        break;
    }
    
    // Check for cross-experiment patterns
    this.detectCrossPatterns();
    
    // Update codex metadata
    this.updateMetadata();
  }
  
  /**
   * Analyze rhythm experiment for patterns
   */
  analyzeRhythmPattern(result) {
    const speeds = Object.keys(result.data.speeds);
    const intensities = speeds.map(s => {
      const data = result.data.speeds[s].hotspotIntensity;
      return data.reduce((a, b) => a + b, 0) / data.length;
    });
    
    // Verify rhythmic resonance law
    const expectedIntensities = speeds.map(s => Math.sqrt(parseFloat(s)));
    const correlation = this.calculateCorrelation(intensities, expectedIntensities);
    
    // Set current law for calibration
    this.currentLawId = 'rhythmic-resonance';
    
    // Update law confidence with calibration
    const law = this.codex.laws.get('rhythmic-resonance');
    law.evidence.push({
      timestamp: Date.now(),
      correlation: correlation,
      data: { speeds, intensities },
      predicted: expectedIntensities,
      actual: intensities
    });
    
    // Use calibrated confidence update
    law.confidence = this.updateConfidence(law.confidence, {
      predicted: expectedIntensities[expectedIntensities.length - 1],
      actual: intensities[intensities.length - 1]
    });
    
    // Check for new sub-patterns
    if (correlation < 0.7) {
      this.proposeNewPattern('rhythm-anomaly', {
        description: 'Non-linear rhythm response detected',
        evidence: result.data,
        confidence: 1 - correlation
      });
    }
  }
  
  /**
   * Detect cross-experiment patterns
   */
  detectCrossPatterns() {
    const recentResults = this.experiments.results.slice(-10);
    if (recentResults.length < 5) return;
    
    // Pattern: Speed affects prediction accuracy
    const rhythmResults = recentResults.filter(r => r.experiment === 'rhythm');
    const predictionResults = recentResults.filter(r => r.experiment === 'prediction');
    
    if (rhythmResults.length > 0 && predictionResults.length > 0) {
      const avgSpeed = this.getAveragePlaybackSpeed();
      const avgAccuracy = this.getAveragePredictionAccuracy();
      
      const speedAccuracyPattern = this.patternEngine.cache.get('speed-accuracy') || {
        occurrences: 0,
        correlation: 0
      };
      
      speedAccuracyPattern.occurrences++;
      speedAccuracyPattern.correlation = this.calculateCorrelation(
        [avgSpeed], [avgAccuracy]
      );
      
      this.patternEngine.cache.set('speed-accuracy', speedAccuracyPattern);
      
      // Promote to official pattern if threshold met
      if (speedAccuracyPattern.occurrences >= this.patternEngine.minOccurrences &&
          Math.abs(speedAccuracyPattern.correlation) > this.patternEngine.threshold) {
        this.addNewPattern('speed-prediction-coupling', {
          description: 'Temporal velocity affects prediction accuracy',
          formula: `Accuracy ∝ 1/Speed^${speedAccuracyPattern.correlation.toFixed(2)}`,
          confidence: Math.abs(speedAccuracyPattern.correlation)
        });
      }
    }
  }
  
  /**
   * Add new discovered pattern
   */
  addNewPattern(id, pattern) {
    if (!this.codex.patterns.has(id)) {
      this.codex.patterns.set(id, {
        id,
        ...pattern,
        discovered: Date.now(),
        status: 'active'
      });
      
      // Create insight
      this.addInsight({
        type: 'pattern-discovery',
        title: `New Pattern: ${pattern.description}`,
        details: pattern,
        timestamp: Date.now()
      });
      
      // Trigger UI update
      this.updateCodexDisplay();
    }
  }
  
  /**
   * Evolution loop - periodic analysis and updates
   */
  startEvolutionLoop() {
    setInterval(() => {
      if (!this.evolution.enabled) return;
      
      // Analyze pattern stability
      this.analyzePatternStability();
      
      // Check for emergent behaviors
      this.detectEmergentBehaviors();
      
      // Update law parameters based on evidence
      this.refineLawParameters();
      
      // Generate new hypotheses
      this.generateHypotheses();
      
      // Update evolution index
      this.codex.metadata.evolutionIndex++;
      
      // Save state
      this.saveCodexState();
      
    }, this.evolution.checkInterval);
  }
  
  /**
   * Create Codex visualization interface
   */
  createCodexInterface() {
    const container = document.createElement('div');
    container.id = 'codex-interface';
    container.style.cssText = `
      position: absolute;
      top: 80px;
      right: 20px;
      width: 350px;
      max-height: 80vh;
      background: rgba(0, 0, 0, 0.95);
      border: 2px solid #8b5cf6;
      border-radius: 12px;
      padding: 20px;
      overflow-y: auto;
      z-index: 105;
      display: none;
      backdrop-filter: blur(20px);
      box-shadow: 0 0 30px rgba(139, 92, 246, 0.3);
    `;
    
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #fff; font-size: 20px;">
          📜 Temporal Patterns Codex
        </h2>
        <span style="color: #8b5cf6; font-size: 12px;">v${this.codex.version}</span>
      </div>
      
      <div id="codex-stats" style="
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin-bottom: 20px;
        padding: 15px;
        background: rgba(139, 92, 246, 0.1);
        border-radius: 8px;
      ">
        <div>
          <div style="color: #94a3b8; font-size: 11px;">Experiments</div>
          <div style="color: #fff; font-size: 18px;" id="codex-experiments">0</div>
        </div>
        <div>
          <div style="color: #94a3b8; font-size: 11px;">Discoveries</div>
          <div style="color: #fff; font-size: 18px;" id="codex-discoveries">0</div>
        </div>
        <div>
          <div style="color: #94a3b8; font-size: 11px;">Evolution Index</div>
          <div style="color: #fff; font-size: 18px;" id="codex-evolution">0</div>
        </div>
        <div>
          <div style="color: #94a3b8; font-size: 11px;">Discovery Rate</div>
          <div style="color: #fff; font-size: 18px;" id="codex-rate">0%</div>
        </div>
      </div>
      
      <div id="codex-tabs" style="
        display: flex;
        gap: 5px;
        margin-bottom: 15px;
        border-bottom: 1px solid #334155;
      ">
        <button class="codex-tab active" data-tab="laws" style="
          background: none;
          border: none;
          color: #8b5cf6;
          padding: 8px 16px;
          cursor: pointer;
          border-bottom: 2px solid #8b5cf6;
        ">Laws</button>
        <button class="codex-tab" data-tab="patterns" style="
          background: none;
          border: none;
          color: #94a3b8;
          padding: 8px 16px;
          cursor: pointer;
          border-bottom: 2px solid transparent;
        ">Patterns</button>
        <button class="codex-tab" data-tab="insights" style="
          background: none;
          border: none;
          color: #94a3b8;
          padding: 8px 16px;
          cursor: pointer;
          border-bottom: 2px solid transparent;
        ">Insights</button>
      </div>
      
      <div id="codex-content">
        <div id="codex-laws" class="codex-panel"></div>
        <div id="codex-patterns" class="codex-panel" style="display: none;"></div>
        <div id="codex-insights" class="codex-panel" style="display: none;"></div>
      </div>
      
      <button id="codex-close" style="
        position: absolute;
        top: 15px;
        right: 15px;
        background: none;
        border: none;
        color: #666;
        font-size: 20px;
        cursor: pointer;
      ">×</button>
    `;
    
    document.body.appendChild(container);
    
    // Create trigger button
    const trigger = document.createElement('button');
    trigger.id = 'codex-trigger';
    trigger.innerHTML = '📜';
    trigger.style.cssText = `
      position: absolute;
      top: 80px;
      right: 20px;
      width: 45px;
      height: 45px;
      background: linear-gradient(135deg, #8b5cf6, #6d28d9);
      border: none;
      border-radius: 50%;
      color: white;
      font-size: 20px;
      cursor: pointer;
      z-index: 104;
      box-shadow: 0 2px 10px rgba(139, 92, 246, 0.5);
      transition: all 0.3s;
    `;
    
    trigger.addEventListener('mouseenter', () => {
      trigger.style.transform = 'scale(1.1)';
    });
    
    trigger.addEventListener('mouseleave', () => {
      trigger.style.transform = 'scale(1)';
    });
    
    document.body.appendChild(trigger);
    
    // Bind events
    this.bindCodexEvents();
    
    // Initial render
    this.updateCodexDisplay();
  }
  
  /**
   * Bind Codex UI events
   */
  bindCodexEvents() {
    // Toggle interface
    document.getElementById('codex-trigger').addEventListener('click', () => {
      const panel = document.getElementById('codex-interface');
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
      if (panel.style.display === 'block') {
        this.updateCodexDisplay();
      }
    });
    
    document.getElementById('codex-close').addEventListener('click', () => {
      document.getElementById('codex-interface').style.display = 'none';
    });
    
    // Tab switching
    document.querySelectorAll('.codex-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        // Update active tab
        document.querySelectorAll('.codex-tab').forEach(t => {
          t.classList.remove('active');
          t.style.color = '#94a3b8';
          t.style.borderBottomColor = 'transparent';
        });
        
        e.target.classList.add('active');
        e.target.style.color = '#8b5cf6';
        e.target.style.borderBottomColor = '#8b5cf6';
        
        // Show corresponding panel
        const tabName = e.target.dataset.tab;
        document.querySelectorAll('.codex-panel').forEach(panel => {
          panel.style.display = 'none';
        });
        document.getElementById(`codex-${tabName}`).style.display = 'block';
      });
    });
  }
  
  /**
   * Update Codex display
   */
  updateCodexDisplay() {
    // Update stats
    document.getElementById('codex-experiments').textContent = 
      this.codex.metadata.totalExperiments;
    document.getElementById('codex-discoveries').textContent = 
      this.codex.laws.size + this.codex.patterns.size;
    document.getElementById('codex-evolution').textContent = 
      this.codex.metadata.evolutionIndex;
    document.getElementById('codex-rate').textContent = 
      this.codex.metadata.totalExperiments > 0 
        ? Math.round((this.codex.patterns.size / this.codex.metadata.totalExperiments) * 100) + '%'
        : '0%';
    
    // Render laws
    this.renderLaws();
    
    // Render patterns
    this.renderPatterns();
    
    // Render insights
    this.renderInsights();
  }
  
  /**
   * Render temporal laws
   */
  renderLaws() {
    const container = document.getElementById('codex-laws');
    container.innerHTML = Array.from(this.codex.laws.values()).map(law => `
      <div style="
        margin-bottom: 20px;
        padding: 15px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
        border-left: 3px solid #8b5cf6;
      ">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div>
            <h4 style="margin: 0 0 8px 0; color: #fff; display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 20px;">${law.glyph}</span>
              ${law.name}
            </h4>
            <div style="
              font-family: 'Monaco', monospace;
              font-size: 13px;
              color: #a855f7;
              margin-bottom: 8px;
              padding: 5px 10px;
              background: rgba(168, 85, 247, 0.1);
              border-radius: 4px;
              display: inline-block;
            ">
              ${law.formula}
            </div>
            <p style="margin: 8px 0; color: #94a3b8; font-size: 12px; line-height: 1.6;">
              ${law.description}
            </p>
          </div>
          <div style="text-align: right;">
            <div style="color: #10b981; font-size: 16px; font-weight: bold;">
              ${Math.round(law.confidence * 100)}%
            </div>
            <div style="color: #666; font-size: 10px;">confidence</div>
            ${law.calibration ? `
              <div style="color: #3b82f6; font-size: 10px; margin-top: 2px;">
                ±${(law.calibration.uncertainty * 100).toFixed(1)}%
              </div>
            ` : ''}
          </div>
        </div>
        
        ${law.evidence.length > 0 ? `
          <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #334155;">
            <div style="color: #666; font-size: 11px; margin-bottom: 5px;">
              Evidence: ${law.evidence.length} observations
            </div>
            <div style="height: 4px; background: #334155; border-radius: 2px; overflow: hidden;">
              <div style="
                height: 100%;
                width: ${law.confidence * 100}%;
                background: linear-gradient(90deg, #8b5cf6, #a855f7);
              "></div>
            </div>
          </div>
        ` : ''}
      </div>
    `).join('');
  }
  
  /**
   * Render discovered patterns
   */
  renderPatterns() {
    const container = document.getElementById('codex-patterns');
    const patterns = Array.from(this.codex.patterns.values());
    
    if (patterns.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; color: #666; padding: 40px;">
          <div style="font-size: 40px; margin-bottom: 10px;">🔍</div>
          <div>No patterns discovered yet.</div>
          <div style="font-size: 12px; margin-top: 5px;">Run more experiments to reveal patterns.</div>
        </div>
      `;
      return;
    }
    
    container.innerHTML = patterns.map(pattern => `
      <div style="
        margin-bottom: 15px;
        padding: 12px;
        background: rgba(251, 191, 36, 0.1);
        border-radius: 6px;
        border-left: 3px solid #fbbf24;
      ">
        <h5 style="margin: 0 0 5px 0; color: #fbbf24; font-size: 14px;">
          ${pattern.description}
        </h5>
        ${pattern.formula ? `
          <code style="
            display: block;
            margin: 5px 0;
            padding: 4px 8px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 3px;
            font-size: 11px;
            color: #fde047;
          ">${pattern.formula}</code>
        ` : ''}
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 8px;
          color: #94a3b8;
          font-size: 11px;
        ">
          <span>Discovered ${this.formatTime(Date.now() - pattern.discovered)} ago</span>
          <span style="color: #f59e0b;">${Math.round(pattern.confidence * 100)}%</span>
        </div>
      </div>
    `).join('');
  }
  
  /**
   * Render insights timeline
   */
  renderInsights() {
    const container = document.getElementById('codex-insights');
    const insights = this.codex.insights.slice(-10).reverse();
    
    if (insights.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; color: #666; padding: 40px;">
          <div style="font-size: 40px; margin-bottom: 10px;">💡</div>
          <div>No insights captured yet.</div>
        </div>
      `;
      return;
    }
    
    container.innerHTML = insights.map(insight => `
      <div style="
        margin-bottom: 12px;
        padding: 10px;
        background: rgba(59, 130, 246, 0.1);
        border-radius: 6px;
        border-left: 3px solid #3b82f6;
        font-size: 12px;
      ">
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 5px;
        ">
          <strong style="color: #3b82f6;">${insight.title}</strong>
          <span style="color: #666; font-size: 10px;">
            ${this.formatTime(Date.now() - insight.timestamp)} ago
          </span>
        </div>
        ${insight.details ? `
          <div style="color: #94a3b8; line-height: 1.5;">
            ${JSON.stringify(insight.details, null, 2)
              .replace(/[{}]/g, '')
              .replace(/"/g, '')
              .replace(/,\n/g, '<br>')
              .trim()}
          </div>
        ` : ''}
      </div>
    `).join('');
  }
  
  /**
   * Helper methods
   */
  calculateCorrelation(x, y) {
    if (x.length !== y.length) return 0;
    
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0);
    const sumX2 = x.reduce((total, xi) => total + xi * xi, 0);
    const sumY2 = y.reduce((total, yi) => total + yi * yi, 0);
    
    const correlation = (n * sumXY - sumX * sumY) / 
      Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return isNaN(correlation) ? 0 : correlation;
  }
  
  updateConfidence(current, newEvidence) {
    // Weighted average with decay for old confidence
    return current * 0.9 + Math.abs(newEvidence) * 0.1;
  }
  
  formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  }
  
  addInsight(insight) {
    this.codex.insights.push(insight);
    
    // Keep only last 100 insights
    if (this.codex.insights.length > 100) {
      this.codex.insights = this.codex.insights.slice(-100);
    }
  }
  
  /**
   * Advanced analysis methods
   */
  analyzePatternStability() {
    // Check if patterns remain consistent over time
    this.codex.patterns.forEach((pattern, id) => {
      if (pattern.evidence && pattern.evidence.length > 5) {
        const recentEvidence = pattern.evidence.slice(-5);
        const variance = this.calculateVariance(recentEvidence.map(e => e.confidence));
        
        if (variance > 0.1) {
          pattern.status = 'unstable';
          this.addInsight({
            type: 'pattern-instability',
            title: `Pattern "${pattern.description}" showing instability`,
            details: { variance, pattern: id },
            timestamp: Date.now()
          });
        }
      }
    });
  }
  
  detectEmergentBehaviors() {
    // Look for unexpected correlations between systems
    const analysis = this.patterns.analyzePatterns();
    
    if (analysis.activeZones.length > 3 && analysis.flowDensity > 0.7) {
      this.proposeNewPattern('emergence-cascade', {
        description: 'High activity correlation across multiple zones',
        evidence: analysis,
        confidence: analysis.flowDensity
      });
    }
  }
  
  refineLawParameters() {
    // Adjust law parameters based on accumulated evidence
    this.codex.laws.forEach(law => {
      if (law.evidence.length > 10) {
        // Use recent evidence to refine parameters
        const recentEvidence = law.evidence.slice(-10);
        
        // Example: Refine rhythmic resonance exponent
        if (law.id === 'rhythmic-resonance') {
          const correlations = recentEvidence.map(e => e.correlation);
          const avgCorrelation = correlations.reduce((a, b) => a + b, 0) / correlations.length;
          
          if (avgCorrelation < 0.8) {
            // Adjust exponent slightly
            law.parameters.exponent = law.parameters.exponent * 0.98;
            this.addInsight({
              type: 'law-refinement',
              title: 'Rhythmic Resonance law refined',
              details: { 
                newExponent: law.parameters.exponent,
                reason: 'Lower correlation in recent evidence' 
              },
              timestamp: Date.now()
            });
          }
        }
      }
    });
  }
  
  generateHypotheses() {
    // Generate new testable hypotheses based on current knowledge
    const hypotheses = [];
    
    // Hypothesis 1: Combined rhythm and focus effects
    if (this.codex.patterns.has('speed-prediction-coupling')) {
      hypotheses.push({
        id: 'rhythm-focus-synergy',
        description: 'Fast rhythm + tight focus = super-evolution',
        testMethod: 'Run rhythm at 4x while focusing on single zone',
        expectedOutcome: 'Evolution rate > 2x baseline'
      });
    }
    
    // Store hypotheses for future testing
    hypotheses.forEach(h => {
      if (!this.codex.patterns.has(h.id)) {
        this.proposeNewPattern(h.id, {
          description: h.description,
          status: 'hypothesis',
          confidence: 0,
          testMethod: h.testMethod
        });
      }
    });
  }
  
  proposeNewPattern(id, pattern) {
    // Add to cache for verification
    const cached = this.patternEngine.cache.get(id) || {
      occurrences: 0,
      evidence: []
    };
    
    cached.occurrences++;
    cached.evidence.push(pattern);
    
    this.patternEngine.cache.set(id, cached);
    
    // Promote if threshold met
    if (cached.occurrences >= this.patternEngine.minOccurrences) {
      this.addNewPattern(id, {
        ...pattern,
        evidence: cached.evidence
      });
    }
  }
  
  calculateVariance(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }
  
  getAveragePlaybackSpeed() {
    // Get from chrono weather timeline
    return this.chrono.timeline.playbackSpeed;
  }
  
  getAveragePredictionAccuracy() {
    const predictions = this.experiments.results
      .filter(r => r.experiment === 'prediction')
      .slice(-5);
      
    if (predictions.length === 0) return 0;
    
    const accuracies = predictions.map(p => {
      const acc = Object.values(p.data.accuracy || {});
      return acc.reduce((a, b) => a + (b.coherence || 0), 0) / acc.length;
    });
    
    return accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
  }
  
  saveCodexState() {
    // Save to localStorage for persistence
    const state = {
      version: this.codex.version,
      laws: Array.from(this.codex.laws.entries()),
      patterns: Array.from(this.codex.patterns.entries()),
      insights: this.codex.insights.slice(-50), // Keep last 50
      metadata: this.codex.metadata,
      lastSaved: Date.now()
    };
    
    localStorage.setItem('temporal-codex', JSON.stringify(state));
  }
  
  loadCodexState() {
    const saved = localStorage.getItem('temporal-codex');
    if (saved) {
      try {
        const state = JSON.parse(saved);
        
        // Restore maps
        this.codex.laws = new Map(state.laws);
        this.codex.patterns = new Map(state.patterns);
        this.codex.insights = state.insights || [];
        this.codex.metadata = state.metadata;
        
        this.addInsight({
          type: 'codex-restored',
          title: 'Codex state restored from memory',
          details: { 
            laws: this.codex.laws.size,
            patterns: this.codex.patterns.size 
          },
          timestamp: Date.now()
        });
        
      } catch (e) {
        console.error('Failed to restore codex state:', e);
      }
    }
  }
}

// Export for integration
export function createCodexEngine(experimentsuite, chronoWeather, patternsOverlay) {
  const engine = new CodexEngine(experimentsuite, chronoWeather, patternsOverlay);
  
  // Restore previous state if available
  engine.loadCodexState();
  
  return engine;
}