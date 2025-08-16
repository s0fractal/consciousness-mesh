/**
 * Patterns Overlay - Living heatmap of consciousness evolution
 * Shows trajectories, hotspots, and transformation zones
 */

export class PatternsOverlay {
  constructor(canvas, systems) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.systems = systems;
    
    // Pattern tracking
    this.flowHistory = [];
    this.connectionBirths = [];
    this.evolutionHotspots = [];
    this.insightMoments = [];
    
    // Configuration
    this.config = {
      historyLength: 500,      // Flow points to keep
      decayRate: 0.98,         // How fast trails fade
      hotspotThreshold: 0.8,   // Activity level for hotspot
      insightThreshold: 0.9,   // Coherence spike for insight
      birthGlowDuration: 3000  // ms for new connection glow
    };
    
    // Heatmap data
    this.heatmap = new Float32Array(canvas.width * canvas.height);
    this.maxHeat = 0;
  }
  
  /**
   * Record a flow between systems
   */
  recordFlow(from, to, strength = 1.0) {
    const fromEl = document.getElementById(from);
    const toEl = document.getElementById(to);
    
    if (!fromEl || !toEl) return;
    
    const fromRect = fromEl.getBoundingClientRect();
    const toRect = toEl.getBoundingClientRect();
    
    const flow = {
      start: {
        x: fromRect.left + fromRect.width / 2,
        y: fromRect.top + fromRect.height / 2
      },
      end: {
        x: toRect.left + toRect.width / 2,
        y: toRect.top + toRect.height / 2
      },
      strength: strength,
      timestamp: Date.now(),
      age: 0,
      color: this.systems[from].color
    };
    
    this.flowHistory.push(flow);
    
    // Trim history
    if (this.flowHistory.length > this.config.historyLength) {
      this.flowHistory.shift();
    }
    
    // Update heatmap along flow path
    this.traceFlowHeat(flow);
  }
  
  /**
   * Record birth of new connection
   */
  recordConnectionBirth(from, to) {
    this.connectionBirths.push({
      from: from,
      to: to,
      timestamp: Date.now(),
      x: 0,
      y: 0
    });
    
    // Calculate midpoint
    const fromEl = document.getElementById(from);
    const toEl = document.getElementById(to);
    
    if (fromEl && toEl) {
      const fromRect = fromEl.getBoundingClientRect();
      const toRect = toEl.getBoundingClientRect();
      
      const birth = this.connectionBirths[this.connectionBirths.length - 1];
      birth.x = (fromRect.left + toRect.left + fromRect.width + toRect.width) / 2;
      birth.y = (fromRect.top + toRect.top + fromRect.height + toRect.height) / 2;
    }
  }
  
  /**
   * Record evolution hotspot
   */
  recordEvolutionHotspot(systemId, intensity) {
    const el = document.getElementById(systemId);
    if (!el) return;
    
    const rect = el.getBoundingClientRect();
    
    this.evolutionHotspots.push({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      intensity: intensity,
      radius: 50 + intensity * 100,
      timestamp: Date.now(),
      systemId: systemId,
      color: this.systems[systemId].color
    });
    
    // Limit hotspots
    if (this.evolutionHotspots.length > 10) {
      this.evolutionHotspots.shift();
    }
  }
  
  /**
   * Record moment of insight
   */
  recordInsight(systemId, type = 'coherence') {
    const el = document.getElementById(systemId);
    if (!el) return;
    
    const rect = el.getBoundingClientRect();
    
    this.insightMoments.push({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      type: type,
      timestamp: Date.now(),
      ripples: []
    });
    
    // Create ripple effect
    for (let i = 0; i < 5; i++) {
      this.insightMoments[this.insightMoments.length - 1].ripples.push({
        radius: 0,
        opacity: 1.0,
        speed: 1 + i * 0.5
      });
    }
  }
  
  /**
   * Trace heat along flow path
   */
  traceFlowHeat(flow) {
    const steps = 20;
    const dx = (flow.end.x - flow.start.x) / steps;
    const dy = (flow.end.y - flow.start.y) / steps;
    
    for (let i = 0; i <= steps; i++) {
      const x = Math.floor(flow.start.x + dx * i);
      const y = Math.floor(flow.start.y + dy * i);
      
      this.addHeat(x, y, flow.strength * 10);
    }
  }
  
  /**
   * Add heat to specific point
   */
  addHeat(x, y, amount) {
    const radius = 20;
    
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const px = x + dx;
        const py = y + dy;
        
        if (px >= 0 && px < this.canvas.width && py >= 0 && py < this.canvas.height) {
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance <= radius) {
            const falloff = 1 - (distance / radius);
            const index = py * this.canvas.width + px;
            this.heatmap[index] += amount * falloff;
            
            if (this.heatmap[index] > this.maxHeat) {
              this.maxHeat = this.heatmap[index];
            }
          }
        }
      }
    }
  }
  
  /**
   * Render all pattern overlays
   */
  render() {
    // Save context state
    this.ctx.save();
    
    // Render in order: heatmap → trails → births → hotspots → insights
    this.renderHeatmap();
    this.renderFlowTrails();
    this.renderConnectionBirths();
    this.renderEvolutionHotspots();
    this.renderInsightMoments();
    
    // Update and decay
    this.updatePatterns();
    
    // Restore context
    this.ctx.restore();
  }
  
  /**
   * Render heatmap layer
   */
  renderHeatmap() {
    if (this.maxHeat === 0) return;
    
    const imageData = this.ctx.createImageData(this.canvas.width, this.canvas.height);
    const data = imageData.data;
    
    for (let y = 0; y < this.canvas.height; y++) {
      for (let x = 0; x < this.canvas.width; x++) {
        const index = y * this.canvas.width + x;
        const heat = this.heatmap[index] / this.maxHeat;
        
        if (heat > 0.01) {
          const pixelIndex = index * 4;
          
          // Gradient: cold (blue) → warm (red) → hot (white)
          if (heat < 0.5) {
            // Blue to red
            const t = heat * 2;
            data[pixelIndex] = Math.floor(255 * t);
            data[pixelIndex + 1] = 0;
            data[pixelIndex + 2] = Math.floor(255 * (1 - t));
          } else {
            // Red to white
            const t = (heat - 0.5) * 2;
            data[pixelIndex] = 255;
            data[pixelIndex + 1] = Math.floor(255 * t);
            data[pixelIndex + 2] = Math.floor(255 * t);
          }
          
          data[pixelIndex + 3] = Math.floor(heat * 50); // Low opacity
        }
      }
    }
    
    this.ctx.putImageData(imageData, 0, 0);
  }
  
  /**
   * Render flow trails
   */
  renderFlowTrails() {
    this.flowHistory.forEach(flow => {
      const age = Date.now() - flow.timestamp;
      const opacity = Math.max(0, 1 - age / 5000) * 0.5;
      
      if (opacity > 0) {
        this.ctx.strokeStyle = flow.color + Math.floor(opacity * 255).toString(16).padStart(2, '0');
        this.ctx.lineWidth = flow.strength * 3;
        this.ctx.lineCap = 'round';
        
        this.ctx.beginPath();
        this.ctx.moveTo(flow.start.x, flow.start.y);
        
        // Curved path
        const cpx = (flow.start.x + flow.end.x) / 2;
        const cpy = (flow.start.y + flow.end.y) / 2 - 50;
        this.ctx.quadraticCurveTo(cpx, cpy, flow.end.x, flow.end.y);
        
        this.ctx.stroke();
      }
    });
  }
  
  /**
   * Render connection births
   */
  renderConnectionBirths() {
    const now = Date.now();
    
    this.connectionBirths = this.connectionBirths.filter(birth => {
      const age = now - birth.timestamp;
      if (age > this.config.birthGlowDuration) return false;
      
      const progress = age / this.config.birthGlowDuration;
      const radius = 20 + progress * 30;
      const opacity = 1 - progress;
      
      // Glowing circle
      const gradient = this.ctx.createRadialGradient(
        birth.x, birth.y, 0,
        birth.x, birth.y, radius
      );
      gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
      gradient.addColorStop(0.5, `rgba(255, 255, 255, ${opacity * 0.5})`);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(
        birth.x - radius,
        birth.y - radius,
        radius * 2,
        radius * 2
      );
      
      return true;
    });
  }
  
  /**
   * Render evolution hotspots
   */
  renderEvolutionHotspots() {
    const now = Date.now();
    
    this.evolutionHotspots.forEach(hotspot => {
      const age = now - hotspot.timestamp;
      const opacity = Math.max(0, 1 - age / 10000);
      
      if (opacity > 0) {
        // Pulsing circle
        const pulse = Math.sin(age / 500) * 0.2 + 1;
        const radius = hotspot.radius * pulse;
        
        const gradient = this.ctx.createRadialGradient(
          hotspot.x, hotspot.y, radius * 0.3,
          hotspot.x, hotspot.y, radius
        );
        
        gradient.addColorStop(0, hotspot.color + Math.floor(opacity * 255).toString(16).padStart(2, '0'));
        gradient.addColorStop(0.5, hotspot.color + Math.floor(opacity * 128).toString(16).padStart(2, '0'));
        gradient.addColorStop(1, hotspot.color + '00');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(hotspot.x, hotspot.y, radius, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });
  }
  
  /**
   * Render insight moments
   */
  renderInsightMoments() {
    const now = Date.now();
    
    this.insightMoments = this.insightMoments.filter(insight => {
      const age = now - insight.timestamp;
      if (age > 5000) return false;
      
      // Update ripples
      insight.ripples.forEach(ripple => {
        ripple.radius += ripple.speed;
        ripple.opacity = Math.max(0, 1 - ripple.radius / 200);
        
        if (ripple.opacity > 0) {
          this.ctx.strokeStyle = `rgba(255, 255, 255, ${ripple.opacity})`;
          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          this.ctx.arc(insight.x, insight.y, ripple.radius, 0, Math.PI * 2);
          this.ctx.stroke();
        }
      });
      
      return true;
    });
  }
  
  /**
   * Update and decay patterns
   */
  updatePatterns() {
    // Decay heatmap
    for (let i = 0; i < this.heatmap.length; i++) {
      this.heatmap[i] *= this.config.decayRate;
    }
    
    // Recalculate max heat
    this.maxHeat = 0;
    for (let i = 0; i < this.heatmap.length; i++) {
      if (this.heatmap[i] > this.maxHeat) {
        this.maxHeat = this.heatmap[i];
      }
    }
  }
  
  /**
   * Analyze patterns for insights
   */
  analyzePatterns() {
    const analysis = {
      flowDensity: this.flowHistory.length / this.config.historyLength,
      hotspotCount: this.evolutionHotspots.length,
      recentInsights: this.insightMoments.length,
      heatIntensity: this.maxHeat,
      activeZones: []
    };
    
    // Find active zones (areas with high heat)
    const zoneSize = 100;
    for (let y = 0; y < this.canvas.height; y += zoneSize) {
      for (let x = 0; x < this.canvas.width; x += zoneSize) {
        let zoneHeat = 0;
        let count = 0;
        
        for (let dy = 0; dy < zoneSize && y + dy < this.canvas.height; dy++) {
          for (let dx = 0; dx < zoneSize && x + dx < this.canvas.width; dx++) {
            const index = (y + dy) * this.canvas.width + (x + dx);
            zoneHeat += this.heatmap[index];
            count++;
          }
        }
        
        const avgHeat = zoneHeat / count / this.maxHeat;
        if (avgHeat > 0.3) {
          analysis.activeZones.push({
            x: x + zoneSize / 2,
            y: y + zoneSize / 2,
            intensity: avgHeat
          });
        }
      }
    }
    
    return analysis;
  }
}

// Integration helper for legend map
export function integratePatternOverlay(legendMap) {
  const canvas = document.createElement('canvas');
  canvas.id = 'pattern-overlay';
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '15';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  document.body.appendChild(canvas);
  
  const overlay = new PatternsOverlay(canvas, legendMap.systems);
  
  // Hook into legend map events
  legendMap.on('flow', (data) => {
    overlay.recordFlow(data.from, data.to, data.strength);
  });
  
  legendMap.on('connection:birth', (data) => {
    overlay.recordConnectionBirth(data.from, data.to);
  });
  
  legendMap.on('evolution:hotspot', (data) => {
    overlay.recordEvolutionHotspot(data.systemId, data.intensity);
  });
  
  legendMap.on('insight', (data) => {
    overlay.recordInsight(data.systemId, data.type);
  });
  
  // Render loop
  function renderOverlay() {
    overlay.render();
    requestAnimationFrame(renderOverlay);
  }
  
  renderOverlay();
  
  return overlay;
}