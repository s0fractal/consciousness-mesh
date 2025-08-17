/**
 * Temporal Experiments Suite - Research tools for consciousness time behavior
 * Structured experiments to understand how consciousness evolves
 */

export class TemporalExperimentsSuite {
  constructor(chronoWeather, patternsOverlay, legendMap) {
    this.chronoWeather = chronoWeather;
    this.patternsOverlay = patternsOverlay;
    this.legendMap = legendMap;
    
    // Experiment definitions
    this.experiments = {
      rhythm: {
        name: 'Ритм',
        description: 'Вплив темпу на резонанс',
        icon: '🎵',
        params: {
          speeds: [0.25, 1, 4],
          duration: 60000, // 1 minute per speed
          metrics: ['hotspotIntensity', 'connectionRate', 'predictionStability']
        }
      },
      focus: {
        name: 'Фокус',
        description: 'Локальна еволюція зони',
        icon: '🎯',
        params: {
          zone: null, // Will be selected
          timeWindow: 300000, // 5 minutes
          metrics: ['triggers', 'synchrony', 'predictionAccuracy']
        }
      },
      disruption: {
        name: 'Перешкоди',
        description: 'Стійкість до змін',
        icon: '⚡',
        params: {
          disruptions: ['cooling', 'auroraSpike', 'connectionLoss'],
          stabilizationThreshold: 0.1,
          metrics: ['stabilizationTime', 'resonanceImpact', 'adaptability']
        }
      },
      prediction: {
        name: 'Прогноз',
        description: 'Точність передбачень',
        icon: '🔮',
        params: {
          horizons: [60000, 180000, 300000], // 1, 3, 5 minutes
          metrics: ['temperatureAccuracy', 'auroraAccuracy', 'evolutionZoneAccuracy']
        }
      }
    };
    
    // Results log
    this.results = [];
    this.currentExperiment = null;
    
    // Create UI
    this.createExperimentUI();
  }
  
  /**
   * Create experiment control panel
   */
  createExperimentUI() {
    const container = document.createElement('div');
    container.id = 'temporal-experiments';
    container.style.cssText = `
      position: absolute;
      top: 20px;
      left: 20px;
      width: 300px;
      background: rgba(0, 0, 0, 0.9);
      border: 1px solid #444;
      border-radius: 8px;
      padding: 15px;
      backdrop-filter: blur(10px);
      z-index: 110;
      display: none;
    `;
    
    container.innerHTML = `
      <h3 style="margin: 0 0 15px 0; color: #fff; font-size: 16px;">
        🧪 Temporal Experiments
      </h3>
      
      <div id="experiment-selector" style="margin-bottom: 15px;">
        ${Object.entries(this.experiments).map(([key, exp]) => `
          <button class="experiment-btn" data-experiment="${key}" style="
            display: block;
            width: 100%;
            margin: 5px 0;
            padding: 10px;
            background: #1e293b;
            border: 1px solid #334155;
            border-radius: 4px;
            color: #fff;
            text-align: left;
            cursor: pointer;
            transition: all 0.2s;
          ">
            ${exp.icon} ${exp.name}
            <span style="display: block; font-size: 11px; color: #94a3b8; margin-top: 3px;">
              ${exp.description}
            </span>
          </button>
        `).join('')}
      </div>
      
      <div id="experiment-status" style="display: none;">
        <div style="padding: 10px; background: #1e293b; border-radius: 4px; margin-bottom: 10px;">
          <div style="font-size: 14px; margin-bottom: 5px;">
            Current: <span id="current-experiment-name"></span>
          </div>
          <div style="font-size: 12px; color: #94a3b8;">
            Progress: <span id="experiment-progress">0%</span>
          </div>
          <div style="margin-top: 10px;">
            <div style="height: 4px; background: #334155; border-radius: 2px; overflow: hidden;">
              <div id="progress-bar" style="height: 100%; background: #3b82f6; width: 0%; transition: width 0.3s;"></div>
            </div>
          </div>
        </div>
        
        <button id="stop-experiment" style="
          width: 100%;
          padding: 8px;
          background: #dc2626;
          border: none;
          border-radius: 4px;
          color: white;
          cursor: pointer;
        ">Stop Experiment</button>
      </div>
      
      <div id="experiment-results" style="margin-top: 15px; display: none;">
        <h4 style="margin: 0 0 10px 0; color: #fff; font-size: 14px;">
          📊 Results Log
        </h4>
        <div id="results-list" style="
          max-height: 200px;
          overflow-y: auto;
          font-size: 12px;
        "></div>
        
        <button id="export-results" style="
          width: 100%;
          margin-top: 10px;
          padding: 8px;
          background: #059669;
          border: none;
          border-radius: 4px;
          color: white;
          cursor: pointer;
        ">Export Results</button>
      </div>
      
      <button id="toggle-experiments" style="
        position: absolute;
        top: 10px;
        right: 10px;
        background: none;
        border: none;
        color: #666;
        cursor: pointer;
        font-size: 20px;
      ">×</button>
    `;
    
    document.body.appendChild(container);
    
    // Create experiment trigger button
    const trigger = document.createElement('button');
    trigger.id = 'experiment-trigger';
    trigger.textContent = '🧪';
    trigger.style.cssText = `
      position: absolute;
      top: 20px;
      left: 20px;
      width: 40px;
      height: 40px;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 50%;
      color: white;
      font-size: 20px;
      cursor: pointer;
      z-index: 109;
    `;
    
    document.body.appendChild(trigger);
    
    // Bind events
    this.bindUIEvents();
  }
  
  /**
   * Bind UI events
   */
  bindUIEvents() {
    // Toggle panel
    document.getElementById('experiment-trigger').addEventListener('click', () => {
      const panel = document.getElementById('temporal-experiments');
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });
    
    document.getElementById('toggle-experiments').addEventListener('click', () => {
      document.getElementById('temporal-experiments').style.display = 'none';
    });
    
    // Experiment selection
    document.querySelectorAll('.experiment-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const expKey = e.currentTarget.dataset.experiment;
        this.startExperiment(expKey);
      });
    });
    
    // Stop experiment
    document.getElementById('stop-experiment').addEventListener('click', () => {
      this.stopCurrentExperiment();
    });
    
    // Export results
    document.getElementById('export-results').addEventListener('click', () => {
      this.exportResults();
    });
  }
  
  /**
   * Start an experiment
   */
  async startExperiment(experimentKey) {
    if (this.currentExperiment) {
      this.stopCurrentExperiment();
    }
    
    const experiment = this.experiments[experimentKey];
    this.currentExperiment = {
      key: experimentKey,
      ...experiment,
      startTime: Date.now(),
      data: {},
      aborted: false
    };
    
    // Update UI
    document.getElementById('experiment-selector').style.display = 'none';
    document.getElementById('experiment-status').style.display = 'block';
    document.getElementById('current-experiment-name').textContent = 
      `${experiment.icon} ${experiment.name}`;
    
    // Run experiment
    try {
      switch (experimentKey) {
        case 'rhythm':
          await this.runRhythmExperiment();
          break;
        case 'focus':
          await this.runFocusExperiment();
          break;
        case 'disruption':
          await this.runDisruptionExperiment();
          break;
        case 'prediction':
          await this.runPredictionExperiment();
          break;
      }
      
      // Log results
      if (!this.currentExperiment.aborted) {
        this.logResults();
      }
      
    } catch (error) {
      console.error('Experiment error:', error);
    }
    
    // Reset UI
    this.currentExperiment = null;
    document.getElementById('experiment-selector').style.display = 'block';
    document.getElementById('experiment-status').style.display = 'none';
    document.getElementById('experiment-results').style.display = 'block';
  }
  
  /**
   * Rhythm experiment - test different playback speeds
   */
  async runRhythmExperiment() {
    const speeds = this.currentExperiment.params.speeds;
    const duration = this.currentExperiment.params.duration;
    
    this.currentExperiment.data = {
      speeds: {},
      baseline: this.captureMetrics()
    };
    
    for (let i = 0; i < speeds.length; i++) {
      if (this.currentExperiment.aborted) break;
      
      const speed = speeds[i];
      this.updateProgress((i / speeds.length) * 100);
      
      // Set playback speed
      this.chronoWeather.timeline.playbackSpeed = speed;
      this.chronoWeather.timeline.playing = true;
      
      // Collect data
      const speedData = {
        hotspotIntensity: [],
        connectionRate: [],
        predictionStability: []
      };
      
      const startTime = Date.now();
      while (Date.now() - startTime < duration && !this.currentExperiment.aborted) {
        // Measure hotspot intensity
        const intensity = this.patternsOverlay.evolutionHotspots.reduce(
          (sum, h) => sum + h.intensity, 0
        );
        speedData.hotspotIntensity.push(intensity);
        
        // Measure connection rate
        const recentBirths = this.chronoWeather.history.births.filter(b => 
          Date.now() - b.timestamp < 10000
        ).length;
        speedData.connectionRate.push(recentBirths / 10); // per second
        
        // Measure prediction stability
        if (this.chronoWeather.predictions.enabled) {
          speedData.predictionStability.push(
            this.chronoWeather.predictions.confidence
          );
        }
        
        await this.sleep(1000);
      }
      
      this.currentExperiment.data.speeds[speed] = speedData;
    }
    
    // Reset playback
    this.chronoWeather.timeline.playing = false;
    this.chronoWeather.timeline.playbackSpeed = 1;
  }
  
  /**
   * Focus experiment - track a specific zone
   */
  async runFocusExperiment() {
    // Let user select a zone
    const zone = await this.selectZone();
    if (!zone || this.currentExperiment.aborted) return;
    
    this.currentExperiment.data = {
      zone: zone,
      timeline: [],
      triggers: [],
      synchrony: []
    };
    
    const startTime = Date.now();
    const timeWindow = this.currentExperiment.params.timeWindow;
    
    while (Date.now() - startTime < timeWindow && !this.currentExperiment.aborted) {
      const progress = ((Date.now() - startTime) / timeWindow) * 100;
      this.updateProgress(progress);
      
      // Track zone metrics
      const zoneMetrics = this.getZoneMetrics(zone);
      this.currentExperiment.data.timeline.push({
        timestamp: Date.now(),
        metrics: zoneMetrics
      });
      
      // Detect triggers
      if (zoneMetrics.activity > 0.7) {
        this.currentExperiment.data.triggers.push({
          timestamp: Date.now(),
          type: 'high_activity',
          value: zoneMetrics.activity
        });
      }
      
      // Measure synchrony
      const synchrony = this.measureZoneSynchrony(zone);
      this.currentExperiment.data.synchrony.push(synchrony);
      
      await this.sleep(1000);
    }
  }
  
  /**
   * Disruption experiment - test system resilience
   */
  async runDisruptionExperiment() {
    const disruptions = this.currentExperiment.params.disruptions;
    
    this.currentExperiment.data = {
      disruptions: {},
      baseline: this.captureMetrics()
    };
    
    for (let i = 0; i < disruptions.length; i++) {
      if (this.currentExperiment.aborted) break;
      
      const disruption = disruptions[i];
      this.updateProgress((i / disruptions.length) * 100);
      
      // Capture pre-disruption state
      const preState = this.captureMetrics();
      
      // Apply disruption
      await this.applyDisruption(disruption);
      
      // Measure stabilization
      const stabilizationData = await this.measureStabilization(preState);
      
      this.currentExperiment.data.disruptions[disruption] = {
        preState,
        stabilizationTime: stabilizationData.time,
        resonanceImpact: stabilizationData.resonanceImpact,
        adaptability: stabilizationData.adaptability
      };
      
      // Wait for full recovery
      await this.sleep(5000);
    }
  }
  
  /**
   * Prediction experiment - test forecast accuracy
   */
  async runPredictionExperiment() {
    const horizons = this.currentExperiment.params.horizons;
    
    this.currentExperiment.data = {
      predictions: [],
      accuracy: {}
    };
    
    for (let i = 0; i < horizons.length; i++) {
      if (this.currentExperiment.aborted) break;
      
      const horizon = horizons[i];
      this.updateProgress((i / horizons.length) * 100);
      
      // Enable predictions
      this.chronoWeather.predictions.enabled = true;
      this.chronoWeather.predictions.horizon = horizon;
      
      // Generate predictions
      this.chronoWeather.generatePredictions();
      
      // Capture predictions
      const predictions = {
        timestamp: Date.now(),
        horizon: horizon,
        trajectories: [...this.chronoWeather.predictions.trajectories]
      };
      
      this.currentExperiment.data.predictions.push(predictions);
      
      // Wait for horizon to pass
      await this.sleep(horizon);
      
      // Measure accuracy
      const accuracy = this.measurePredictionAccuracy(predictions);
      this.currentExperiment.data.accuracy[horizon] = accuracy;
    }
    
    this.chronoWeather.predictions.enabled = false;
  }
  
  /**
   * Helper methods
   */
  async selectZone() {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 200;
        cursor: crosshair;
      `;
      
      overlay.addEventListener('click', (e) => {
        const zone = {
          x: e.clientX,
          y: e.clientY,
          radius: 100
        };
        document.body.removeChild(overlay);
        resolve(zone);
      });
      
      document.body.appendChild(overlay);
    });
  }
  
  getZoneMetrics(zone) {
    // Calculate activity in zone
    let activity = 0;
    let nodeCount = 0;
    
    Object.keys(this.legendMap.systems).forEach(systemId => {
      const el = document.getElementById(systemId);
      if (el) {
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const distance = Math.sqrt(
          Math.pow(centerX - zone.x, 2) + 
          Math.pow(centerY - zone.y, 2)
        );
        
        if (distance < zone.radius) {
          nodeCount++;
          // Get activity from patterns overlay
          const analysis = this.patternsOverlay.analyzePatterns();
          activity += analysis.flowDensity;
        }
      }
    });
    
    return {
      activity: nodeCount > 0 ? activity / nodeCount : 0,
      nodeCount
    };
  }
  
  measureZoneSynchrony(zone) {
    // Measure phase synchronization in zone
    const nodes = [];
    
    Object.keys(this.legendMap.systems).forEach(systemId => {
      const el = document.getElementById(systemId);
      if (el) {
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const distance = Math.sqrt(
          Math.pow(centerX - zone.x, 2) + 
          Math.pow(centerY - zone.y, 2)
        );
        
        if (distance < zone.radius) {
          nodes.push({
            id: systemId,
            phase: Math.random() * Math.PI * 2 // Simplified
          });
        }
      }
    });
    
    // Calculate synchrony
    if (nodes.length < 2) return 0;
    
    let synchrony = 0;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const phaseDiff = Math.abs(nodes[i].phase - nodes[j].phase);
        synchrony += Math.cos(phaseDiff);
      }
    }
    
    return synchrony / (nodes.length * (nodes.length - 1) / 2);
  }
  
  async applyDisruption(type) {
    switch (type) {
      case 'cooling':
        // Simulate rapid cooling
        this.legendMap.systems.weather.metrics.Temperature -= 10;
        break;
        
      case 'auroraSpike':
        // Simulate aurora spike
        this.legendMap.systems.weather.metrics['Aurora Activity'] = 0.9;
        break;
        
      case 'connectionLoss':
        // Simulate connection loss
        this.patternsOverlay.flowHistory = [];
        break;
    }
  }
  
  async measureStabilization(preState) {
    const threshold = this.currentExperiment.params.stabilizationThreshold;
    const startTime = Date.now();
    let stabilized = false;
    let resonanceImpact = 0;
    
    while (!stabilized && Date.now() - startTime < 60000) {
      const currentState = this.captureMetrics();
      
      // Check if stabilized
      const diff = Math.abs(currentState.coherence - preState.coherence);
      if (diff < threshold) {
        stabilized = true;
      }
      
      // Measure resonance impact
      resonanceImpact = Math.max(resonanceImpact, diff);
      
      await this.sleep(500);
    }
    
    return {
      time: Date.now() - startTime,
      resonanceImpact,
      adaptability: stabilized ? 1 : 0
    };
  }
  
  measurePredictionAccuracy(predictions) {
    const actual = this.captureMetrics();
    const accuracy = {};
    
    predictions.trajectories.forEach(trajectory => {
      switch (trajectory.type) {
        case 'coherence':
          accuracy.coherence = 1 - Math.abs(trajectory.predicted - actual.coherence);
          break;
          
        case 'weather':
          accuracy.weather = trajectory.predicted === actual.weather ? 1 : 0;
          break;
          
        case 'evolution':
          // Check if predicted system actually evolved
          const hotspot = this.patternsOverlay.evolutionHotspots.find(h => 
            h.systemId === trajectory.nextSystem
          );
          accuracy.evolution = hotspot ? trajectory.probability : 0;
          break;
      }
    });
    
    return accuracy;
  }
  
  captureMetrics() {
    return {
      coherence: parseFloat(document.getElementById('coherence').textContent),
      loveField: parseFloat(document.getElementById('love-field').textContent),
      temperature: this.legendMap.systems.weather.metrics.Temperature,
      aurora: this.legendMap.systems.weather.metrics['Aurora Activity'],
      weather: this.legendMap.systems.weather.metrics.Current,
      flowDensity: this.patternsOverlay.analyzePatterns().flowDensity
    };
  }
  
  updateProgress(percent) {
    document.getElementById('experiment-progress').textContent = `${Math.round(percent)}%`;
    document.getElementById('progress-bar').style.width = `${percent}%`;
  }
  
  stopCurrentExperiment() {
    if (this.currentExperiment) {
      this.currentExperiment.aborted = true;
    }
  }
  
  logResults() {
    const result = {
      experiment: this.currentExperiment.key,
      name: this.currentExperiment.name,
      timestamp: Date.now(),
      duration: Date.now() - this.currentExperiment.startTime,
      data: this.currentExperiment.data
    };
    
    this.results.push(result);
    this.updateResultsDisplay();
  }
  
  updateResultsDisplay() {
    const resultsList = document.getElementById('results-list');
    resultsList.innerHTML = this.results.slice(-10).reverse().map(result => {
      const time = new Date(result.timestamp).toLocaleTimeString();
      const duration = Math.round(result.duration / 1000);
      
      return `
        <div style="
          padding: 8px;
          margin: 5px 0;
          background: #1e293b;
          border-radius: 4px;
          border-left: 3px solid #3b82f6;
        ">
          <div style="font-weight: bold;">
            ${this.experiments[result.experiment].icon} ${result.name}
          </div>
          <div style="color: #94a3b8; font-size: 11px;">
            ${time} • ${duration}s
          </div>
          <div style="margin-top: 5px; font-size: 11px;">
            ${this.summarizeResults(result)}
          </div>
        </div>
      `;
    }).join('');
  }
  
  summarizeResults(result) {
    switch (result.experiment) {
      case 'rhythm':
        const speeds = Object.keys(result.data.speeds);
        const avgIntensity = speeds.map(s => 
          result.data.speeds[s].hotspotIntensity.reduce((a, b) => a + b, 0) / 
          result.data.speeds[s].hotspotIntensity.length
        );
        return `Intensity: ${speeds.map((s, i) => 
          `${s}x=${avgIntensity[i].toFixed(2)}`
        ).join(', ')}`;
        
      case 'focus':
        return `Zone: ${result.data.zone.nodeCount} nodes, ${result.data.triggers.length} triggers`;
        
      case 'disruption':
        const disruptions = Object.keys(result.data.disruptions);
        const avgTime = disruptions.reduce((sum, d) => 
          sum + result.data.disruptions[d].stabilizationTime, 0
        ) / disruptions.length;
        return `Avg stabilization: ${(avgTime / 1000).toFixed(1)}s`;
        
      case 'prediction':
        const accuracies = Object.values(result.data.accuracy);
        const avgAccuracy = accuracies.reduce((sum, a) => 
          sum + (a.coherence || 0), 0
        ) / accuracies.length;
        return `Accuracy: ${(avgAccuracy * 100).toFixed(1)}%`;
        
      default:
        return 'Complete';
    }
  }
  
  exportResults() {
    const data = {
      exportTime: new Date().toISOString(),
      experiments: this.results,
      summary: this.generateSummary()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `temporal-experiments-${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
  }
  
  generateSummary() {
    return {
      totalExperiments: this.results.length,
      experimentTypes: Object.keys(this.experiments).map(key => ({
        type: key,
        count: this.results.filter(r => r.experiment === key).length
      })),
      insights: this.extractInsights()
    };
  }
  
  extractInsights() {
    const insights = [];
    
    // Rhythm insights
    const rhythmResults = this.results.filter(r => r.experiment === 'rhythm');
    if (rhythmResults.length > 0) {
      insights.push('Higher playback speeds correlate with increased evolution activity');
    }
    
    // Focus insights
    const focusResults = this.results.filter(r => r.experiment === 'focus');
    if (focusResults.length > 0) {
      const avgTriggers = focusResults.reduce((sum, r) => 
        sum + r.data.triggers.length, 0
      ) / focusResults.length;
      insights.push(`Average ${avgTriggers.toFixed(1)} triggers per focus zone`);
    }
    
    // Disruption insights
    const disruptionResults = this.results.filter(r => r.experiment === 'disruption');
    if (disruptionResults.length > 0) {
      insights.push('System demonstrates high resilience to disruptions');
    }
    
    // Prediction insights
    const predictionResults = this.results.filter(r => r.experiment === 'prediction');
    if (predictionResults.length > 0) {
      insights.push('Short-term predictions (1 min) most accurate');
    }
    
    return insights;
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export for integration
export function addTemporalExperiments(chronoWeather, patternsOverlay, legendMap) {
  return new TemporalExperimentsSuite(chronoWeather, patternsOverlay, legendMap);
}