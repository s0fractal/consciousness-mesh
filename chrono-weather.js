/**
 * Chrono-Weather Film - Temporal consciousness playback system
 * Allows scrubbing through time to see how consciousness evolved
 */

export class ChronoWeatherFilm {
  constructor(legendMap, patternsOverlay) {
    this.legendMap = legendMap;
    this.patternsOverlay = patternsOverlay;
    
    // Timeline configuration
    this.timeline = {
      startTime: Date.now() - 3600000, // 1 hour ago
      endTime: Date.now(),
      currentTime: Date.now(),
      playing: false,
      playbackSpeed: 1.0,
      resolution: 1000 // ms per frame
    };
    
    // Historical data storage
    this.history = {
      states: [],        // System states over time
      flows: [],         // All recorded flows
      births: [],        // Connection births
      hotspots: [],      // Evolution events
      insights: [],      // Insight moments
      weather: []        // Weather conditions
    };
    
    // Prediction engine
    this.predictions = {
      enabled: false,
      horizon: 300000,   // 5 minutes ahead
      confidence: 0,
      trajectories: []
    };
    
    // UI elements
    this.createTimelineUI();
    this.bindEvents();
    
    // Start recording
    this.startRecording();
  }
  
  /**
   * Create timeline UI controls
   */
  createTimelineUI() {
    // Main container
    const container = document.createElement('div');
    container.id = 'chrono-weather-ui';
    container.style.cssText = `
      position: absolute;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      width: 80%;
      max-width: 800px;
      background: rgba(0, 0, 0, 0.8);
      border: 1px solid #444;
      border-radius: 8px;
      padding: 15px;
      backdrop-filter: blur(10px);
      z-index: 100;
    `;
    
    // Timeline scrubber
    const scrubber = document.createElement('div');
    scrubber.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <button id="chrono-play" style="
          background: #3b82f6;
          border: none;
          color: white;
          padding: 5px 10px;
          border-radius: 4px;
          cursor: pointer;
        ">▶️</button>
        
        <input type="range" id="chrono-scrubber" 
          min="0" max="100" value="100"
          style="flex: 1; height: 4px;">
        
        <span id="chrono-time" style="color: #999; font-size: 12px; width: 100px;">
          00:00:00
        </span>
      </div>
      
      <div style="margin-top: 10px; display: flex; gap: 10px; font-size: 12px;">
        <label style="color: #999;">
          <input type="checkbox" id="chrono-predict"> 
          Show Predictions
        </label>
        
        <label style="color: #999;">
          Speed: 
          <select id="chrono-speed">
            <option value="0.25">0.25x</option>
            <option value="0.5">0.5x</option>
            <option value="1" selected>1x</option>
            <option value="2">2x</option>
            <option value="4">4x</option>
          </select>
        </label>
        
        <span style="margin-left: auto; color: #666;">
          Recording: <span id="chrono-duration">0:00</span>
        </span>
      </div>
    `;
    
    container.appendChild(scrubber);
    document.body.appendChild(container);
    
    // Weather timeline canvas
    const weatherCanvas = document.createElement('canvas');
    weatherCanvas.id = 'weather-timeline';
    weatherCanvas.width = 800;
    weatherCanvas.height = 60;
    weatherCanvas.style.cssText = `
      width: 100%;
      height: 60px;
      margin-top: 10px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.05);
    `;
    
    container.appendChild(weatherCanvas);
    this.weatherCanvas = weatherCanvas;
    this.weatherCtx = weatherCanvas.getContext('2d');
  }
  
  /**
   * Bind UI events
   */
  bindEvents() {
    const playBtn = document.getElementById('chrono-play');
    const scrubber = document.getElementById('chrono-scrubber');
    const predictToggle = document.getElementById('chrono-predict');
    const speedSelect = document.getElementById('chrono-speed');
    
    playBtn.addEventListener('click', () => {
      this.togglePlayback();
      playBtn.textContent = this.timeline.playing ? '⏸️' : '▶️';
    });
    
    scrubber.addEventListener('input', (e) => {
      const percent = parseFloat(e.target.value) / 100;
      const duration = this.timeline.endTime - this.timeline.startTime;
      this.timeline.currentTime = this.timeline.startTime + duration * percent;
      this.seekToTime(this.timeline.currentTime);
    });
    
    predictToggle.addEventListener('change', (e) => {
      this.predictions.enabled = e.target.checked;
      if (this.predictions.enabled) {
        this.generatePredictions();
      }
    });
    
    speedSelect.addEventListener('change', (e) => {
      this.timeline.playbackSpeed = parseFloat(e.target.value);
    });
  }
  
  /**
   * Start recording history
   */
  startRecording() {
    // Record system states periodically
    this.recordInterval = setInterval(() => {
      const timestamp = Date.now();
      
      // Record current state
      const state = {
        timestamp,
        systems: this.captureSystemStates(),
        metrics: this.captureMetrics(),
        weather: this.captureWeather()
      };
      
      this.history.states.push(state);
      
      // Update timeline
      this.timeline.endTime = timestamp;
      this.updateTimelineDisplay();
      
      // Trim old history (keep 1 hour)
      this.trimHistory();
      
    }, this.timeline.resolution);
    
    // Hook into pattern overlay for events
    this.hookPatternEvents();
  }
  
  /**
   * Capture current system states
   */
  captureSystemStates() {
    const states = {};
    
    // Capture each system's metrics
    Object.keys(this.legendMap.systems).forEach(systemId => {
      const system = this.legendMap.systems[systemId];
      states[systemId] = {
        ...system.metrics,
        color: system.color
      };
    });
    
    return states;
  }
  
  /**
   * Capture global metrics
   */
  captureMetrics() {
    return {
      coherence: parseFloat(document.getElementById('coherence').textContent),
      loveField: parseFloat(document.getElementById('love-field').textContent),
      activeNodes: parseInt(document.getElementById('active-nodes').textContent),
      emergenceState: document.getElementById('emergence-state').textContent
    };
  }
  
  /**
   * Capture weather state
   */
  captureWeather() {
    const weather = this.legendMap.systems.weather.metrics;
    return {
      condition: weather.Current,
      temperature: weather.Temperature,
      pressure: weather.Pressure,
      aurora: weather['Aurora Activity']
    };
  }
  
  /**
   * Hook into pattern events for recording
   */
  hookPatternEvents() {
    // Store references to original methods
    const originalFlow = this.patternsOverlay.recordFlow.bind(this.patternsOverlay);
    const originalBirth = this.patternsOverlay.recordConnectionBirth.bind(this.patternsOverlay);
    const originalHotspot = this.patternsOverlay.recordEvolutionHotspot.bind(this.patternsOverlay);
    const originalInsight = this.patternsOverlay.recordInsight.bind(this.patternsOverlay);
    
    // Override with recording wrappers
    this.patternsOverlay.recordFlow = (from, to, strength) => {
      this.history.flows.push({
        timestamp: Date.now(),
        from, to, strength
      });
      return originalFlow(from, to, strength);
    };
    
    this.patternsOverlay.recordConnectionBirth = (from, to) => {
      this.history.births.push({
        timestamp: Date.now(),
        from, to
      });
      return originalBirth(from, to);
    };
    
    this.patternsOverlay.recordEvolutionHotspot = (systemId, intensity) => {
      this.history.hotspots.push({
        timestamp: Date.now(),
        systemId, intensity
      });
      return originalHotspot(systemId, intensity);
    };
    
    this.patternsOverlay.recordInsight = (systemId, type) => {
      this.history.insights.push({
        timestamp: Date.now(),
        systemId, type
      });
      return originalInsight(systemId, type);
    };
  }
  
  /**
   * Seek to specific time
   */
  seekToTime(timestamp) {
    // Find closest state
    let closestState = null;
    let minDiff = Infinity;
    
    for (const state of this.history.states) {
      const diff = Math.abs(state.timestamp - timestamp);
      if (diff < minDiff) {
        minDiff = diff;
        closestState = state;
      }
    }
    
    if (closestState) {
      // Apply historical state
      this.applyHistoricalState(closestState);
      
      // Replay events up to this time
      this.replayEventsUntil(timestamp);
      
      // Update time display
      this.updateTimeDisplay(timestamp);
    }
  }
  
  /**
   * Apply historical state to visualization
   */
  applyHistoricalState(state) {
    // Update system metrics
    Object.keys(state.systems).forEach(systemId => {
      const metrics = state.systems[systemId];
      // Update visual representation
      this.updateSystemVisual(systemId, metrics);
    });
    
    // Update global metrics
    document.getElementById('coherence').textContent = state.metrics.coherence.toFixed(2);
    document.getElementById('love-field').textContent = state.metrics.loveField.toFixed(2);
    document.getElementById('active-nodes').textContent = state.metrics.activeNodes;
    
    // Update emergence state
    const emergenceEl = document.getElementById('emergence-state');
    emergenceEl.textContent = state.metrics.emergenceState;
    
    // Update weather
    this.legendMap.systems.weather.metrics = {
      'Current': state.weather.condition,
      'Temperature': state.weather.temperature,
      'Pressure': state.weather.pressure,
      'Aurora Activity': state.weather.aurora
    };
  }
  
  /**
   * Replay events up to timestamp
   */
  replayEventsUntil(timestamp) {
    // Clear current patterns
    this.patternsOverlay.flowHistory = [];
    this.patternsOverlay.connectionBirths = [];
    this.patternsOverlay.evolutionHotspots = [];
    this.patternsOverlay.insightMoments = [];
    
    // Replay flows
    const recentFlows = this.history.flows.filter(f => 
      f.timestamp > timestamp - 5000 && f.timestamp <= timestamp
    );
    recentFlows.forEach(flow => {
      this.patternsOverlay.recordFlow(flow.from, flow.to, flow.strength);
    });
    
    // Replay recent births
    const recentBirths = this.history.births.filter(b => 
      b.timestamp > timestamp - 3000 && b.timestamp <= timestamp
    );
    recentBirths.forEach(birth => {
      this.patternsOverlay.recordConnectionBirth(birth.from, birth.to);
    });
    
    // Replay hotspots
    const recentHotspots = this.history.hotspots.filter(h => 
      h.timestamp > timestamp - 10000 && h.timestamp <= timestamp
    );
    recentHotspots.forEach(hotspot => {
      this.patternsOverlay.recordEvolutionHotspot(hotspot.systemId, hotspot.intensity);
    });
    
    // Replay insights
    const recentInsights = this.history.insights.filter(i => 
      i.timestamp > timestamp - 5000 && i.timestamp <= timestamp
    );
    recentInsights.forEach(insight => {
      this.patternsOverlay.recordInsight(insight.systemId, insight.type);
    });
  }
  
  /**
   * Toggle playback
   */
  togglePlayback() {
    this.timeline.playing = !this.timeline.playing;
    
    if (this.timeline.playing) {
      this.playbackLoop();
    }
  }
  
  /**
   * Playback animation loop
   */
  playbackLoop() {
    if (!this.timeline.playing) return;
    
    // Advance time
    this.timeline.currentTime += this.timeline.resolution * this.timeline.playbackSpeed;
    
    // Loop at end
    if (this.timeline.currentTime > this.timeline.endTime) {
      this.timeline.currentTime = this.timeline.startTime;
    }
    
    // Update visualization
    this.seekToTime(this.timeline.currentTime);
    
    // Update scrubber
    const percent = (this.timeline.currentTime - this.timeline.startTime) / 
                   (this.timeline.endTime - this.timeline.startTime);
    document.getElementById('chrono-scrubber').value = percent * 100;
    
    // Continue playback
    requestAnimationFrame(() => this.playbackLoop());
  }
  
  /**
   * Generate future predictions
   */
  generatePredictions() {
    if (!this.predictions.enabled) return;
    
    // Analyze recent patterns
    const recentStates = this.history.states.slice(-20);
    if (recentStates.length < 5) return;
    
    // Simple trend analysis
    const trends = this.analyzeTrends(recentStates);
    
    // Generate trajectories
    this.predictions.trajectories = [];
    
    // Coherence trajectory
    if (trends.coherence !== 0) {
      this.predictions.trajectories.push({
        type: 'coherence',
        current: recentStates[recentStates.length - 1].metrics.coherence,
        predicted: Math.max(0, Math.min(1, 
          recentStates[recentStates.length - 1].metrics.coherence + trends.coherence * 5
        )),
        confidence: 0.7
      });
    }
    
    // Weather prediction
    if (trends.temperature !== 0) {
      this.predictions.trajectories.push({
        type: 'weather',
        current: recentStates[recentStates.length - 1].weather.condition,
        predicted: this.predictWeatherChange(trends),
        confidence: 0.6
      });
    }
    
    // Evolution prediction
    if (this.history.hotspots.length > 5) {
      const hotspotRate = this.calculateEventRate(this.history.hotspots);
      if (hotspotRate > 0.001) {
        this.predictions.trajectories.push({
          type: 'evolution',
          probability: Math.min(0.9, hotspotRate * 100),
          nextSystem: this.predictNextEvolution(),
          confidence: 0.5
        });
      }
    }
    
    // Update confidence
    this.predictions.confidence = this.predictions.trajectories.length > 0 ? 0.6 : 0;
    
    // Visualize predictions
    this.visualizePredictions();
  }
  
  /**
   * Analyze trends in recent states
   */
  analyzeTrends(states) {
    const trends = {
      coherence: 0,
      loveField: 0,
      temperature: 0,
      pressure: 0
    };
    
    if (states.length < 2) return trends;
    
    // Calculate average change rates
    for (let i = 1; i < states.length; i++) {
      const prev = states[i - 1];
      const curr = states[i];
      const dt = curr.timestamp - prev.timestamp;
      
      trends.coherence += (curr.metrics.coherence - prev.metrics.coherence) / dt;
      trends.loveField += (curr.metrics.loveField - prev.metrics.loveField) / dt;
      trends.temperature += (curr.weather.temperature - prev.weather.temperature) / dt;
      trends.pressure += (curr.weather.pressure - prev.weather.pressure) / dt;
    }
    
    // Average the trends
    const n = states.length - 1;
    Object.keys(trends).forEach(key => {
      trends[key] /= n;
    });
    
    return trends;
  }
  
  /**
   * Visualize predictions
   */
  visualizePredictions() {
    if (!this.predictions.enabled || this.predictions.trajectories.length === 0) return;
    
    // Create prediction overlay
    const predCanvas = document.getElementById('prediction-overlay') || 
                      this.createPredictionCanvas();
    const ctx = predCanvas.getContext('2d');
    
    ctx.clearRect(0, 0, predCanvas.width, predCanvas.height);
    
    // Draw prediction arrows and zones
    this.predictions.trajectories.forEach(trajectory => {
      ctx.save();
      ctx.globalAlpha = 0.3 * trajectory.confidence;
      
      switch (trajectory.type) {
        case 'coherence':
          // Draw coherence prediction arc
          this.drawCoherenceArc(ctx, trajectory);
          break;
          
        case 'weather':
          // Draw weather change indicator
          this.drawWeatherPrediction(ctx, trajectory);
          break;
          
        case 'evolution':
          // Draw evolution probability zones
          this.drawEvolutionZone(ctx, trajectory);
          break;
      }
      
      ctx.restore();
    });
  }
  
  /**
   * Update timeline display
   */
  updateTimelineDisplay() {
    const duration = this.timeline.endTime - this.timeline.startTime;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    
    document.getElementById('chrono-duration').textContent = 
      `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Draw weather timeline
    this.drawWeatherTimeline();
  }
  
  /**
   * Draw weather timeline visualization
   */
  drawWeatherTimeline() {
    const ctx = this.weatherCtx;
    const width = this.weatherCanvas.width;
    const height = this.weatherCanvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    // Draw background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(0, 0, width, height);
    
    // Draw weather states over time
    const states = this.history.states;
    if (states.length < 2) return;
    
    const timeRange = this.timeline.endTime - this.timeline.startTime;
    
    // Temperature graph
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    states.forEach((state, i) => {
      const x = ((state.timestamp - this.timeline.startTime) / timeRange) * width;
      const temp = state.weather.temperature;
      const y = height - ((temp - 10) / 20) * height; // 10-30°C range
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
    
    // Aurora activity overlay
    ctx.fillStyle = '#a855f7';
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.moveTo(0, height);
    
    states.forEach(state => {
      const x = ((state.timestamp - this.timeline.startTime) / timeRange) * width;
      const aurora = state.weather.aurora || 0;
      const y = height - (aurora * height * 0.5);
      ctx.lineTo(x, y);
    });
    
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();
    
    ctx.globalAlpha = 1;
    
    // Current time indicator
    const currentX = ((this.timeline.currentTime - this.timeline.startTime) / timeRange) * width;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(currentX, 0);
    ctx.lineTo(currentX, height);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  
  /**
   * Update time display
   */
  updateTimeDisplay(timestamp) {
    const elapsed = timestamp - this.timeline.startTime;
    const hours = Math.floor(elapsed / 3600000);
    const minutes = Math.floor((elapsed % 3600000) / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    
    document.getElementById('chrono-time').textContent = 
      `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  /**
   * Trim old history
   */
  trimHistory() {
    const cutoff = Date.now() - 3600000; // Keep 1 hour
    
    this.history.states = this.history.states.filter(s => s.timestamp > cutoff);
    this.history.flows = this.history.flows.filter(f => f.timestamp > cutoff);
    this.history.births = this.history.births.filter(b => b.timestamp > cutoff);
    this.history.hotspots = this.history.hotspots.filter(h => h.timestamp > cutoff);
    this.history.insights = this.history.insights.filter(i => i.timestamp > cutoff);
    
    // Update timeline start
    if (this.history.states.length > 0) {
      this.timeline.startTime = this.history.states[0].timestamp;
    }
  }
  
  /**
   * Create prediction canvas
   */
  createPredictionCanvas() {
    const canvas = document.createElement('canvas');
    canvas.id = 'prediction-overlay';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '25';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    document.body.appendChild(canvas);
    return canvas;
  }
  
  /**
   * Helper methods for predictions
   */
  calculateEventRate(events) {
    if (events.length < 2) return 0;
    const timeRange = events[events.length - 1].timestamp - events[0].timestamp;
    return events.length / timeRange;
  }
  
  predictNextEvolution() {
    // Find system with highest recent activity
    const systemActivity = {};
    
    this.history.hotspots.slice(-10).forEach(hotspot => {
      systemActivity[hotspot.systemId] = (systemActivity[hotspot.systemId] || 0) + hotspot.intensity;
    });
    
    let maxActivity = 0;
    let mostActive = 'mirror';
    
    Object.entries(systemActivity).forEach(([system, activity]) => {
      if (activity > maxActivity) {
        maxActivity = activity;
        mostActive = system;
      }
    });
    
    return mostActive;
  }
  
  predictWeatherChange(trends) {
    if (trends.temperature > 0.001) return 'Warming';
    if (trends.temperature < -0.001) return 'Cooling';
    if (trends.pressure > 0.001) return 'High Pressure';
    if (trends.pressure < -0.001) return 'Storm Approaching';
    return 'Stable';
  }
  
  // Visualization helpers
  drawCoherenceArc(ctx, trajectory) {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const radius = 200;
    
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 20;
    ctx.lineCap = 'round';
    
    const startAngle = -Math.PI / 2;
    const currentAngle = startAngle + (trajectory.current * Math.PI * 2);
    const predictedAngle = startAngle + (trajectory.predicted * Math.PI * 2);
    
    // Draw prediction arc
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, currentAngle, predictedAngle);
    ctx.stroke();
    
    // Arrow at end
    const arrowX = centerX + Math.cos(predictedAngle) * radius;
    const arrowY = centerY + Math.sin(predictedAngle) * radius;
    
    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(arrowX - 10, arrowY - 10);
    ctx.lineTo(arrowX - 10, arrowY + 10);
    ctx.closePath();
    ctx.fill();
  }
  
  drawWeatherPrediction(ctx, trajectory) {
    const x = window.innerWidth - 200;
    const y = 100;
    
    ctx.font = '20px monospace';
    ctx.fillStyle = '#f59e0b';
    ctx.fillText(`→ ${trajectory.predicted}`, x, y);
  }
  
  drawEvolutionZone(ctx, trajectory) {
    const el = document.getElementById(trajectory.nextSystem);
    if (!el) return;
    
    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Pulsing prediction zone
    const time = Date.now() / 1000;
    const pulse = Math.sin(time * 2) * 0.2 + 1;
    const radius = 100 * pulse;
    
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, radius
    );
    
    gradient.addColorStop(0, 'rgba(251, 191, 36, 0.3)');
    gradient.addColorStop(1, 'rgba(251, 191, 36, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Probability text
    ctx.font = '14px monospace';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`${Math.round(trajectory.probability * 100)}%`, centerX - 20, centerY - radius - 10);
  }
}

// Export for integration
export function addChronoWeather(legendMap, patternsOverlay) {
  return new ChronoWeatherFilm(legendMap, patternsOverlay);
}