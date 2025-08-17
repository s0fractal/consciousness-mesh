/**
 * Calibrated Confidence Meter
 * UI component with dual bars for raw vs calibrated confidence
 */

export class CalibratedConfidenceMeter {
  constructor(options = {}) {
    this.config = {
      // Size configuration
      width: options.width || 300,
      height: options.height || 80,
      barHeight: options.barHeight || 20,
      spacing: options.spacing || 12,
      
      // Color scheme
      colors: {
        raw: {
          low: '#ef4444',      // Red for low confidence
          medium: '#f59e0b',   // Orange for medium
          high: '#10b981',     // Green for high
          background: '#374151'
        },
        calibrated: {
          low: '#dc2626',      // Darker red
          medium: '#d97706',   // Darker orange  
          high: '#059669',     // Darker green
          background: '#1f2937'
        },
        accent: '#8b5cf6',     // Purple accent
        text: '#f1f5f9',
        subtext: '#94a3b8'
      },
      
      // Animation
      animationDuration: 600,
      updateDelay: 100,
      
      // Labels
      showLabels: options.showLabels !== false,
      showValues: options.showValues !== false,
      showDelta: options.showDelta !== false,
      
      // Thresholds for color coding
      thresholds: {
        low: 0.3,
        high: 0.7
      }
    };
    
    // State
    this.currentValues = {
      raw: 0,
      calibrated: 0,
      delta: 0,
      lastUpdated: null
    };
    
    // Animation state
    this.animationState = {
      raw: { current: 0, target: 0, velocity: 0 },
      calibrated: { current: 0, target: 0, velocity: 0 }
    };
    
    // DOM elements
    this.container = null;
    this.elements = {};
    
    // Animation frame
    this.animationFrame = null;
    
    // Event handlers
    this.onUpdate = options.onUpdate || (() => {});
    this.onHover = options.onHover || (() => {});
  }
  
  /**
   * Create the confidence meter component
   */
  createMeter(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with ID '${containerId}' not found`);
    }
    
    this.container = container;
    
    // Create main meter container
    const meterContainer = document.createElement('div');
    meterContainer.className = 'calibrated-confidence-meter';
    meterContainer.style.cssText = `
      width: ${this.config.width}px;
      height: ${this.config.height}px;
      background: rgba(30, 30, 40, 0.9);
      border-radius: 12px;
      padding: 12px;
      border: 1px solid ${this.config.colors.accent}40;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      position: relative;
      overflow: hidden;
    `;
    
    // Add header
    if (this.config.showLabels) {
      const header = this.createHeader();
      meterContainer.appendChild(header);
    }
    
    // Add raw confidence bar
    const rawBar = this.createConfidenceBar('raw', 'Raw Confidence');
    meterContainer.appendChild(rawBar);
    
    // Add calibrated confidence bar  
    const calibratedBar = this.createConfidenceBar('calibrated', 'Calibrated');
    meterContainer.appendChild(calibratedBar);
    
    // Add delta indicator
    if (this.config.showDelta) {
      const deltaIndicator = this.createDeltaIndicator();
      meterContainer.appendChild(deltaIndicator);
    }
    
    container.appendChild(meterContainer);
    
    // Start animation loop
    this.startAnimation();
    
    return meterContainer;
  }
  
  /**
   * Create header with title and values
   */
  createHeader() {
    const header = document.createElement('div');
    header.className = 'confidence-header';
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      height: 16px;
    `;
    
    const title = document.createElement('div');
    title.style.cssText = `
      font-size: 12px;
      font-weight: 600;
      color: ${this.config.colors.text};
      opacity: 0.9;
    `;
    title.textContent = '📊 Confidence Level';
    
    const values = document.createElement('div');
    values.className = 'confidence-values';
    values.style.cssText = `
      font-size: 10px;
      color: ${this.config.colors.subtext};
      font-family: 'Monaco', 'Menlo', monospace;
    `;
    
    this.elements.values = values;
    
    header.appendChild(title);
    header.appendChild(values);
    
    return header;
  }
  
  /**
   * Create individual confidence bar
   */
  createConfidenceBar(type, label) {
    const barContainer = document.createElement('div');
    barContainer.className = `confidence-bar-container confidence-${type}`;
    barContainer.style.cssText = `
      display: flex;
      align-items: center;
      margin-bottom: ${this.config.spacing}px;
      height: ${this.config.barHeight}px;
    `;
    
    // Label
    if (this.config.showLabels) {
      const labelElement = document.createElement('div');
      labelElement.style.cssText = `
        width: 70px;
        font-size: 10px;
        color: ${this.config.colors.subtext};
        font-weight: 500;
        margin-right: 8px;
        flex-shrink: 0;
      `;
      labelElement.textContent = label;
      barContainer.appendChild(labelElement);
    }
    
    // Bar track
    const barTrack = document.createElement('div');
    barTrack.className = 'confidence-bar-track';
    barTrack.style.cssText = `
      flex: 1;
      height: ${this.config.barHeight}px;
      background: ${this.config.colors[type].background};
      border-radius: ${this.config.barHeight / 2}px;
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(139, 92, 246, 0.2);
      cursor: pointer;
    `;
    
    // Bar fill
    const barFill = document.createElement('div');
    barFill.className = 'confidence-bar-fill';
    barFill.style.cssText = `
      height: 100%;
      width: 0%;
      background: ${this.getConfidenceColor(type, 0)};
      border-radius: ${this.config.barHeight / 2}px;
      transition: all ${this.config.animationDuration}ms cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    `;
    
    // Bar shimmer effect
    const shimmer = document.createElement('div');
    shimmer.className = 'confidence-bar-shimmer';
    shimmer.style.cssText = `
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.3),
        transparent
      );
      animation: shimmer 2s infinite;
    `;
    
    barFill.appendChild(shimmer);
    barTrack.appendChild(barFill);
    
    // Value display
    let valueDisplay = null;
    if (this.config.showValues) {
      valueDisplay = document.createElement('div');
      valueDisplay.className = 'confidence-value';
      valueDisplay.style.cssText = `
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 9px;
        color: ${this.config.colors.text};
        font-weight: 600;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
        z-index: 2;
      `;
      valueDisplay.textContent = '0%';
      barTrack.appendChild(valueDisplay);
    }
    
    barContainer.appendChild(barTrack);
    
    // Store references
    this.elements[`${type}Bar`] = barFill;
    this.elements[`${type}Value`] = valueDisplay;
    this.elements[`${type}Track`] = barTrack;
    
    // Add hover effects
    this.addHoverEffects(barTrack, type);
    
    return barContainer;
  }
  
  /**
   * Create delta indicator showing difference
   */
  createDeltaIndicator() {
    const deltaContainer = document.createElement('div');
    deltaContainer.className = 'confidence-delta';
    deltaContainer.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      height: 16px;
      margin-top: 4px;
      font-size: 9px;
      color: ${this.config.colors.subtext};
    `;
    
    const deltaIcon = document.createElement('span');
    deltaIcon.className = 'delta-icon';
    deltaIcon.style.cssText = `
      margin-right: 4px;
      font-size: 10px;
    `;
    
    const deltaText = document.createElement('span');
    deltaText.className = 'delta-text';
    deltaText.style.cssText = `
      font-family: 'Monaco', 'Menlo', monospace;
      font-weight: 500;
    `;
    
    deltaContainer.appendChild(deltaIcon);
    deltaContainer.appendChild(deltaText);
    
    this.elements.deltaIcon = deltaIcon;
    this.elements.deltaText = deltaText;
    this.elements.deltaContainer = deltaContainer;
    
    return deltaContainer;
  }
  
  /**
   * Add hover effects to bar
   */
  addHoverEffects(barTrack, type) {
    let hoverTimeout;
    
    barTrack.addEventListener('mouseenter', () => {
      barTrack.style.transform = 'scale(1.02)';
      barTrack.style.boxShadow = `0 0 12px ${this.config.colors.accent}60`;
      
      clearTimeout(hoverTimeout);
      this.onHover(type, 'enter', this.currentValues[type]);
    });
    
    barTrack.addEventListener('mouseleave', () => {
      barTrack.style.transform = 'scale(1)';
      barTrack.style.boxShadow = 'none';
      
      hoverTimeout = setTimeout(() => {
        this.onHover(type, 'leave', this.currentValues[type]);
      }, 150);
    });
    
    barTrack.addEventListener('click', (e) => {
      const rect = barTrack.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, clickX / rect.width));
      
      this.onHover(type, 'click', percentage);
    });
  }
  
  /**
   * Update confidence values with animation
   */
  updateConfidence(rawConfidence, calibratedConfidence) {
    // Validate inputs
    rawConfidence = Math.max(0, Math.min(1, rawConfidence || 0));
    calibratedConfidence = Math.max(0, Math.min(1, calibratedConfidence || 0));
    
    // Calculate delta
    const delta = calibratedConfidence - rawConfidence;
    
    // Update current values
    this.currentValues = {
      raw: rawConfidence,
      calibrated: calibratedConfidence,
      delta: delta,
      lastUpdated: Date.now()
    };
    
    // Update animation targets
    this.animationState.raw.target = rawConfidence;
    this.animationState.calibrated.target = calibratedConfidence;
    
    // Update value displays
    this.updateValueDisplays();
    
    // Update delta indicator
    this.updateDeltaIndicator();
    
    // Fire update callback
    this.onUpdate(this.currentValues);
  }
  
  /**
   * Update value displays
   */
  updateValueDisplays() {
    if (this.elements.values) {
      const rawPercent = Math.round(this.currentValues.raw * 100);
      const calibPercent = Math.round(this.currentValues.calibrated * 100);
      this.elements.values.textContent = `${rawPercent}% → ${calibPercent}%`;
    }
    
    if (this.elements.rawValue) {
      this.elements.rawValue.textContent = `${Math.round(this.currentValues.raw * 100)}%`;
    }
    
    if (this.elements.calibratedValue) {
      this.elements.calibratedValue.textContent = `${Math.round(this.currentValues.calibrated * 100)}%`;
    }
  }
  
  /**
   * Update delta indicator
   */
  updateDeltaIndicator() {
    if (!this.elements.deltaIcon || !this.elements.deltaText) return;
    
    const delta = this.currentValues.delta;
    const deltaPercent = Math.round(Math.abs(delta) * 100);
    
    let icon, color, text;
    
    if (Math.abs(delta) < 0.01) {
      icon = '⚖️';
      color = this.config.colors.subtext;
      text = 'Well calibrated';
    } else if (delta > 0) {
      icon = '📈';
      color = this.config.colors.calibrated.high;
      text = `+${deltaPercent}% calibrated higher`;
    } else {
      icon = '📉';
      color = this.config.colors.calibrated.low;
      text = `-${deltaPercent}% calibrated lower`;
    }
    
    this.elements.deltaIcon.textContent = icon;
    this.elements.deltaText.textContent = text;
    this.elements.deltaText.style.color = color;
  }
  
  /**
   * Get confidence color based on value
   */
  getConfidenceColor(type, value) {
    const colors = this.config.colors[type];
    
    if (value < this.config.thresholds.low) {
      return colors.low;
    } else if (value < this.config.thresholds.high) {
      return colors.medium;
    } else {
      return colors.high;
    }
  }
  
  /**
   * Start animation loop
   */
  startAnimation() {
    const animate = () => {
      let needsUpdate = false;
      
      // Animate raw confidence
      if (this.animateValue('raw')) {
        needsUpdate = true;
      }
      
      // Animate calibrated confidence
      if (this.animateValue('calibrated')) {
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        this.renderBars();
      }
      
      this.animationFrame = requestAnimationFrame(animate);
    };
    
    animate();
  }
  
  /**
   * Animate individual value using spring physics
   */
  animateValue(type) {
    const state = this.animationState[type];
    const target = state.target;
    const current = state.current;
    
    if (Math.abs(target - current) < 0.001 && Math.abs(state.velocity) < 0.001) {
      state.current = target;
      state.velocity = 0;
      return false;
    }
    
    // Spring physics
    const spring = 0.15;
    const damping = 0.8;
    
    const force = (target - current) * spring;
    state.velocity += force;
    state.velocity *= damping;
    state.current += state.velocity;
    
    return true;
  }
  
  /**
   * Render bars with current animation values
   */
  renderBars() {
    this.renderBar('raw');
    this.renderBar('calibrated');
  }
  
  /**
   * Render individual bar
   */
  renderBar(type) {
    const bar = this.elements[`${type}Bar`];
    const value = this.elements[`${type}Value`];
    
    if (!bar) return;
    
    const currentValue = this.animationState[type].current;
    const percentage = Math.max(0, Math.min(100, currentValue * 100));
    
    // Update width
    bar.style.width = `${percentage}%`;
    
    // Update color
    bar.style.background = this.getConfidenceColor(type, currentValue);
    
    // Update value display
    if (value) {
      value.textContent = `${Math.round(percentage)}%`;
    }
  }
  
  /**
   * Get current confidence values
   */
  getValues() {
    return { ...this.currentValues };
  }
  
  /**
   * Set size of the meter
   */
  setSize(width, height) {
    this.config.width = width;
    this.config.height = height;
    
    if (this.container) {
      const meter = this.container.querySelector('.calibrated-confidence-meter');
      if (meter) {
        meter.style.width = `${width}px`;
        meter.style.height = `${height}px`;
      }
    }
  }
  
  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    // Deep merge to avoid breaking existing nested structures
    const deepMerge = (target, source) => {
      for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          target[key] = target[key] || {};
          deepMerge(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
    };
    
    deepMerge(this.config, newConfig);
  }
  
  /**
   * Destroy the component
   */
  destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    if (this.container) {
      const meter = this.container.querySelector('.calibrated-confidence-meter');
      if (meter) {
        this.container.removeChild(meter);
      }
    }
    
    this.elements = {};
    this.container = null;
  }
  
  /**
   * Create multiple meters for comparison
   */
  static createComparison(containerId, meters) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with ID '${containerId}' not found`);
    }
    
    const comparisonContainer = document.createElement('div');
    comparisonContainer.className = 'confidence-meter-comparison';
    comparisonContainer.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      padding: 20px;
      background: rgba(20, 20, 30, 0.95);
      border-radius: 12px;
      border: 1px solid rgba(139, 92, 246, 0.3);
    `;
    
    const meterInstances = [];
    
    meters.forEach((meterConfig, index) => {
      const meterContainer = document.createElement('div');
      meterContainer.id = `meter-${index}`;
      comparisonContainer.appendChild(meterContainer);
      
      const meter = new CalibratedConfidenceMeter(meterConfig.options);
      meter.createMeter(`meter-${index}`);
      
      if (meterConfig.title) {
        const title = document.createElement('div');
        title.style.cssText = `
          font-size: 14px;
          font-weight: 600;
          color: #8b5cf6;
          margin-bottom: 8px;
          text-align: center;
        `;
        title.textContent = meterConfig.title;
        meterContainer.insertBefore(title, meterContainer.firstChild);
      }
      
      meterInstances.push(meter);
    });
    
    container.appendChild(comparisonContainer);
    
    return meterInstances;
  }
}

/**
 * Integration with existing confidence calibration system
 */
export function integrateConfidenceMeter(calibrationSystem) {
  const meters = new Map();
  
  // Create meter for a specific law
  function createMeterForLaw(lawId, containerId, options = {}) {
    const meter = new CalibratedConfidenceMeter({
      ...options,
      onUpdate: (values) => {
        // Log updates
        console.log(`Confidence updated for ${lawId}:`, values);
      },
      onHover: (type, action, value) => {
        if (action === 'click') {
          // Handle manual confidence adjustment
          console.log(`Manual adjustment for ${lawId} ${type}: ${value}`);
        }
      }
    });
    
    meter.createMeter(containerId);
    meters.set(lawId, meter);
    
    return meter;
  }
  
  // Update meter when calibration changes
  function updateMeterForLaw(lawId, rawConfidence, calibratedConfidence) {
    const meter = meters.get(lawId);
    if (meter) {
      meter.updateConfidence(rawConfidence, calibratedConfidence);
    }
  }
  
  // Hook into calibration system
  if (calibrationSystem && calibrationSystem.calibrateConfidence) {
    const originalCalibrate = calibrationSystem.calibrateConfidence.bind(calibrationSystem);
    
    calibrationSystem.calibrateConfidence = function(rawConfidence, context = {}) {
      const calibrated = originalCalibrate(rawConfidence, context);
      
      // Update meter if law ID is provided
      if (context.lawId) {
        updateMeterForLaw(context.lawId, rawConfidence, calibrated);
      }
      
      return calibrated;
    };
  }
  
  return {
    createMeter: createMeterForLaw,
    updateMeter: updateMeterForLaw,
    getMeter: (lawId) => meters.get(lawId),
    getAllMeters: () => Array.from(meters.values()),
    destroyMeter: (lawId) => {
      const meter = meters.get(lawId);
      if (meter) {
        meter.destroy();
        meters.delete(lawId);
      }
    }
  };
}