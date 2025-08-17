/**
 * Evidence Weighting System
 * Evaluates event importance based on Signal-to-Noise Ratio (SNR) and temporal decay
 */

export class EvidenceWeighting {
  constructor() {
    // Weighting configuration
    this.config = {
      // SNR transformation parameters
      snr: {
        minSNR: 0.1,        // Minimum meaningful SNR
        maxSNR: 100,        // Maximum SNR before saturation
        alpha: 0.7,         // SNR scaling exponent (increased for better sensitivity)
        noiseFloor: 0.01    // Baseline noise level
      },
      
      // Temporal decay parameters
      temporal: {
        halfLife: 3600000,    // 1 hour in milliseconds
        decayRate: null,      // Calculated from halfLife
        maxAge: 86400000,     // 24 hours - events older have minimal weight
        immediacyBonus: 1.5   // Boost for very recent events
      },
      
      // Weight bounds
      bounds: {
        minWeight: 0.01,    // Minimum possible weight
        maxWeight: 10.0,    // Maximum possible weight
        defaultWeight: 1.0  // Default when SNR not available
      }
    };
    
    // Calculate decay rate from half-life
    this.config.temporal.decayRate = Math.log(2) / this.config.temporal.halfLife;
    
    // Weight history for analysis
    this.weightHistory = [];
    
    // Statistical tracking
    this.statistics = {
      totalEvents: 0,
      avgWeight: 0,
      maxWeight: 0,
      weightDistribution: new Map()
    };
  }
  
  /**
   * Calculate event weight based on SNR and time
   * @param {Object} event - Event object with signal, noise, and timestamp
   * @returns {Object} Weight calculation details
   */
  calculateEventWeight(event) {
    const { signal, noise, timestamp, type = 'default' } = event;
    
    // Calculate SNR weight component
    const snrWeight = this.calculateSNRWeight(signal, noise);
    
    // Calculate temporal weight component
    const temporalWeight = this.calculateTemporalWeight(timestamp);
    
    // Combine weights (geometric mean to prevent explosion)
    const typeModifier = this.getTypeModifier(type);
    let combinedWeight = Math.pow(snrWeight * temporalWeight * typeModifier, 1/3);
    
    // Bound the final weight
    combinedWeight = Math.max(
      this.config.bounds.minWeight,
      Math.min(this.config.bounds.maxWeight, combinedWeight)
    );
    
    // Record weight calculation
    const weightRecord = {
      event,
      components: {
        snr: snrWeight,
        temporal: temporalWeight,
        typeModifier: typeModifier
      },
      finalWeight: combinedWeight,
      calculatedAt: Date.now()
    };
    
    this.recordWeight(weightRecord);
    
    return weightRecord;
  }
  
  /**
   * Calculate weight component from Signal-to-Noise Ratio
   */
  calculateSNRWeight(signal, noise) {
    // Handle missing or invalid values
    if (signal == null || noise == null) {
      return this.config.bounds.defaultWeight;
    }
    
    // Ensure non-negative values
    const s = Math.max(0, signal);
    const n = Math.max(this.config.snr.noiseFloor, noise);
    
    // Calculate SNR
    const snr = s / n;
    
    // Apply bounds
    const boundedSNR = Math.max(
      this.config.snr.minSNR,
      Math.min(this.config.snr.maxSNR, snr)
    );
    
    // Transform SNR to weight using power law
    // weight = 1 + (snr / maxSNR)^alpha * (maxWeight - 1)
    const normalizedSNR = boundedSNR / this.config.snr.maxSNR;
    const snrWeight = 1 + Math.pow(normalizedSNR, this.config.snr.alpha) * 
                     (this.config.bounds.maxWeight - 1);
    
    return snrWeight;
  }
  
  /**
   * Calculate weight component from temporal decay
   */
  calculateTemporalWeight(timestamp) {
    if (!timestamp) {
      return this.config.bounds.defaultWeight;
    }
    
    const now = Date.now();
    const age = now - timestamp;
    
    // Handle future timestamps
    if (age < 0) {
      return this.config.bounds.defaultWeight;
    }
    
    // Apply immediacy bonus for very recent events
    if (age < 60000) { // Less than 1 minute old
      const immediacyFactor = 1 - (age / 60000); // Linear decay from 1 to 0
      return 1 + immediacyFactor * (this.config.temporal.immediacyBonus - 1);
    }
    
    // Exponential decay
    const decayFactor = Math.exp(-this.config.temporal.decayRate * age);
    
    // Scale to weight range (1 to maxWeight)
    const temporalWeight = 1 + decayFactor * (this.config.bounds.maxWeight - 1);
    
    return Math.max(this.config.bounds.minWeight, temporalWeight);
  }
  
  /**
   * Get type-specific weight modifier
   */
  getTypeModifier(type) {
    const modifiers = {
      'critical': 2.0,      // Critical events have double weight
      'discovery': 1.5,     // New discoveries are important
      'confirmation': 1.2,  // Confirmations strengthen beliefs
      'contradiction': 1.3, // Contradictions need attention
      'routine': 0.8,       // Routine events have less impact
      'noise': 0.5,         // Noisy events are downweighted
      'default': 1.0        // Default modifier
    };
    
    return modifiers[type] || modifiers.default;
  }
  
  /**
   * Record weight calculation for analysis
   */
  recordWeight(weightRecord) {
    this.weightHistory.push(weightRecord);
    
    // Maintain history size
    if (this.weightHistory.length > 1000) {
      this.weightHistory.shift();
    }
    
    // Update statistics
    this.updateStatistics(weightRecord);
  }
  
  /**
   * Update running statistics
   */
  updateStatistics(weightRecord) {
    const weight = weightRecord.finalWeight;
    
    this.statistics.totalEvents++;
    
    // Update running average
    this.statistics.avgWeight = 
      (this.statistics.avgWeight * (this.statistics.totalEvents - 1) + weight) /
      this.statistics.totalEvents;
    
    // Update max weight
    this.statistics.maxWeight = Math.max(this.statistics.maxWeight, weight);
    
    // Update distribution
    const bucket = Math.floor(weight);
    this.statistics.weightDistribution.set(
      bucket,
      (this.statistics.weightDistribution.get(bucket) || 0) + 1
    );
  }
  
  /**
   * Apply weighted update to law parameters
   */
  applyWeightedUpdate(params, update, weight) {
    // Scale update magnitude by weight
    const scaledUpdate = {};
    
    for (const [key, value] of Object.entries(update)) {
      if (typeof value === 'number') {
        // For numeric updates, scale by weight
        scaledUpdate[key] = value * weight;
      } else if (typeof value === 'object' && value.delta !== undefined) {
        // For delta updates, scale the delta
        scaledUpdate[key] = {
          ...value,
          delta: value.delta * weight
        };
      } else {
        // For non-numeric updates, apply weight as confidence
        scaledUpdate[key] = {
          value: value,
          confidence: weight
        };
      }
    }
    
    // Apply scaled update to parameters
    const updatedParams = { ...params };
    
    for (const [key, value] of Object.entries(scaledUpdate)) {
      if (typeof value === 'number') {
        // Direct numeric update
        updatedParams[key] = (updatedParams[key] || 0) + value;
      } else if (value.delta !== undefined) {
        // Delta update
        updatedParams[key] = (updatedParams[key] || 0) + value.delta;
      } else if (value.confidence !== undefined) {
        // Confidence-weighted update
        const currentConfidence = updatedParams[`${key}Confidence`] || 0;
        const totalConfidence = currentConfidence + value.confidence;
        
        if (totalConfidence > 0) {
          // Weighted average for non-numeric values
          updatedParams[key] = value.value;
          updatedParams[`${key}Confidence`] = totalConfidence;
        }
      }
    }
    
    return updatedParams;
  }
  
  /**
   * Get weight statistics for analysis
   */
  getWeightStatistics() {
    const recentWeights = this.weightHistory.slice(-100);
    
    // Calculate percentiles
    const weights = recentWeights.map(w => w.finalWeight).sort((a, b) => a - b);
    const percentile = (p) => {
      const index = Math.floor(weights.length * p);
      return weights[index] || 0;
    };
    
    return {
      totalEvents: this.statistics.totalEvents,
      avgWeight: this.statistics.avgWeight,
      maxWeight: this.statistics.maxWeight,
      recentStats: {
        count: recentWeights.length,
        avg: recentWeights.reduce((sum, w) => sum + w.finalWeight, 0) / recentWeights.length,
        median: percentile(0.5),
        p25: percentile(0.25),
        p75: percentile(0.75),
        p95: percentile(0.95)
      },
      distribution: Array.from(this.statistics.weightDistribution.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([bucket, count]) => ({
          range: `${bucket}-${bucket + 1}`,
          count,
          percentage: (count / this.statistics.totalEvents * 100).toFixed(2)
        }))
    };
  }
  
  /**
   * Analyze weight factors for recent events
   */
  analyzeWeightFactors() {
    const recent = this.weightHistory.slice(-20);
    
    return recent.map(record => ({
      timestamp: new Date(record.event.timestamp).toISOString(),
      signal: record.event.signal,
      noise: record.event.noise,
      snr: record.event.signal / (record.event.noise || this.config.snr.noiseFloor),
      age: Date.now() - record.event.timestamp,
      components: record.components,
      finalWeight: record.finalWeight,
      impact: this.categorizeImpact(record.finalWeight)
    }));
  }
  
  /**
   * Categorize event impact based on weight
   */
  categorizeImpact(weight) {
    if (weight >= this.config.bounds.maxWeight * 0.8) return 'extreme';
    if (weight >= this.config.bounds.maxWeight * 0.5) return 'high';
    if (weight >= this.config.bounds.defaultWeight) return 'moderate';
    if (weight >= this.config.bounds.minWeight * 10) return 'low';
    return 'negligible';
  }
  
  /**
   * Configure weighting parameters
   */
  configure(updates) {
    // Deep merge updates into config
    if (updates.snr) {
      Object.assign(this.config.snr, updates.snr);
    }
    
    if (updates.temporal) {
      Object.assign(this.config.temporal, updates.temporal);
      // Recalculate decay rate if halfLife changed
      if (updates.temporal.halfLife) {
        this.config.temporal.decayRate = Math.log(2) / this.config.temporal.halfLife;
      }
    }
    
    if (updates.bounds) {
      Object.assign(this.config.bounds, updates.bounds);
    }
    
    return this.config;
  }
}

/**
 * Integration with existing systems
 */
export function integrateEvidenceWeighting(system) {
  const weighting = new EvidenceWeighting();
  
  // Enhance event processing
  const originalProcess = system.processEvent?.bind(system);
  if (originalProcess) {
    system.processEvent = function(event) {
      // Calculate weight for event
      const weightRecord = weighting.calculateEventWeight(event);
      
      // Add weight to event
      event.weight = weightRecord.finalWeight;
      event.weightComponents = weightRecord.components;
      
      // Process with weight awareness
      return originalProcess(event);
    };
  }
  
  // Enhance parameter updates
  const originalUpdate = system.updateParameters?.bind(system);
  if (originalUpdate) {
    system.updateParameters = function(params, update, event) {
      if (event?.weight) {
        // Apply weighted update
        return weighting.applyWeightedUpdate(params, update, event.weight);
      }
      // Fallback to original update
      return originalUpdate(params, update, event);
    };
  }
  
  // Add weight analysis methods
  system.getWeightStatistics = () => weighting.getWeightStatistics();
  system.analyzeWeightFactors = () => weighting.analyzeWeightFactors();
  system.configureWeighting = (updates) => weighting.configure(updates);
  
  return weighting;
}