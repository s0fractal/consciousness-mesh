/**
 * Online Confidence Calibration using Beta Distribution
 * Dynamically adjusts law confidence based on hit/miss predictions
 */

export class ConfidenceCalibration {
  constructor() {
    // Beta distribution parameters for each law
    // alpha = hits + 1, beta = misses + 1 (Laplace smoothing)
    this.betaParams = new Map();
    
    // Prediction history for validation
    this.predictionHistory = [];
    
    // Calibration settings
    this.settings = {
      smoothingFactor: 1,     // Laplace smoothing
      decayRate: 0.99,        // Weight decay for old predictions
      minSamples: 5,          // Minimum samples before calibration
      windowSize: 100         // Rolling window for history
    };
  }
  
  /**
   * Initialize beta parameters for a law
   */
  initializeLaw(lawId, initialConfidence = 0.5) {
    // Convert initial confidence to beta parameters
    // Using method of moments with assumed sample size
    const sampleSize = 10;
    const alpha = initialConfidence * sampleSize + this.settings.smoothingFactor;
    const beta = (1 - initialConfidence) * sampleSize + this.settings.smoothingFactor;
    
    this.betaParams.set(lawId, {
      alpha: alpha,
      beta: beta,
      predictions: 0,
      hits: 0,
      misses: 0,
      lastUpdate: Date.now()
    });
  }
  
  /**
   * Update beta parameters based on prediction outcome
   */
  updateBetaParameters(lawId, predicted, actual, weight = 1.0) {
    if (!this.betaParams.has(lawId)) {
      this.initializeLaw(lawId);
    }
    
    const params = this.betaParams.get(lawId);
    
    // Determine if prediction was correct (within threshold)
    const hit = this.evaluatePrediction(predicted, actual);
    
    // Apply decay to old parameters
    const decay = this.settings.decayRate;
    params.alpha = params.alpha * decay + this.settings.smoothingFactor * (1 - decay);
    params.beta = params.beta * decay + this.settings.smoothingFactor * (1 - decay);
    
    // Update based on outcome
    if (hit) {
      params.alpha += weight;
      params.hits++;
    } else {
      params.beta += weight;
      params.misses++;
    }
    
    params.predictions++;
    params.lastUpdate = Date.now();
    
    // Record prediction for history
    this.recordPrediction(lawId, predicted, actual, hit);
    
    return this.getCalibratredConfidence(lawId);
  }
  
  /**
   * Get calibrated confidence from beta distribution
   */
  getCalibratredConfidence(lawId) {
    if (!this.betaParams.has(lawId)) {
      return 0.5; // Default uninformed prior
    }
    
    const params = this.betaParams.get(lawId);
    
    // Mean of beta distribution: alpha / (alpha + beta)
    const mean = params.alpha / (params.alpha + params.beta);
    
    // Variance for uncertainty estimation
    const variance = (params.alpha * params.beta) / 
      (Math.pow(params.alpha + params.beta, 2) * (params.alpha + params.beta + 1));
    
    // 95% credible interval
    const credibleInterval = this.calculateCredibleInterval(params.alpha, params.beta);
    
    return {
      confidence: mean,
      variance: variance,
      uncertainty: Math.sqrt(variance),
      credibleInterval: credibleInterval,
      sampleSize: params.predictions,
      accuracy: params.predictions > 0 ? params.hits / params.predictions : null
    };
  }
  
  /**
   * Evaluate if prediction was correct
   */
  evaluatePrediction(predicted, actual) {
    // For boolean predictions (most common in tests)
    if (typeof predicted === 'boolean' && typeof actual === 'boolean') {
      return predicted === actual;
    }
    
    // For numerical predictions
    if (typeof predicted === 'number' && typeof actual === 'number') {
      const threshold = 0.1; // 10% tolerance
      const error = Math.abs(predicted - actual) / Math.max(Math.abs(actual), 1);
      return error <= threshold;
    }
    
    // For categorical predictions
    if (typeof predicted === 'string' && typeof actual === 'string') {
      return predicted === actual;
    }
    
    // For complex predictions (e.g., trajectories)
    if (typeof predicted === 'object' && predicted.type) {
      switch (predicted.type) {
        case 'coherence':
          return this.evaluatePrediction(predicted.predicted, actual.coherence);
        case 'weather':
          return predicted.predicted === actual.weather;
        case 'evolution':
          return predicted.nextSystem === actual.evolvedSystem;
        default:
          return false;
      }
    }
    
    return false;
  }
  
  /**
   * Calculate credible interval using beta distribution
   */
  calculateCredibleInterval(alpha, beta, level = 0.95) {
    // Using Wilson score interval approximation
    const n = alpha + beta - 2 * this.settings.smoothingFactor;
    const p = (alpha - this.settings.smoothingFactor) / n;
    
    if (n < 30) {
      // For small samples, use exact beta quantiles (simplified)
      return {
        lower: Math.max(0, p - 2 * Math.sqrt(p * (1 - p) / n)),
        upper: Math.min(1, p + 2 * Math.sqrt(p * (1 - p) / n))
      };
    }
    
    // For larger samples, use normal approximation
    const z = 1.96; // 95% confidence
    const denominator = 1 + z * z / n;
    const centre = (p + z * z / (2 * n)) / denominator;
    const spread = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / denominator;
    
    return {
      lower: Math.max(0, centre - spread),
      upper: Math.min(1, centre + spread)
    };
  }
  
  /**
   * Record prediction for history and analysis
   */
  recordPrediction(lawId, predicted, actual, hit) {
    const record = {
      lawId,
      predicted,
      actual,
      hit,
      timestamp: Date.now()
    };
    
    this.predictionHistory.push(record);
    
    // Maintain window size
    if (this.predictionHistory.length > this.settings.windowSize) {
      this.predictionHistory.shift();
    }
  }
  
  /**
   * Get calibration metrics for a law
   */
  getCalibrationMetrics(lawId) {
    const lawHistory = this.predictionHistory.filter(p => p.lawId === lawId);
    
    if (lawHistory.length < this.settings.minSamples) {
      return {
        calibrated: false,
        message: `Need ${this.settings.minSamples - lawHistory.length} more samples`
      };
    }
    
    // Group by confidence buckets
    const buckets = this.createConfidenceBuckets(lawHistory);
    
    // Calculate expected vs actual accuracy per bucket
    const calibration = buckets.map(bucket => {
      const expectedAccuracy = bucket.avgConfidence;
      const actualAccuracy = bucket.hits / bucket.total;
      const calibrationError = Math.abs(expectedAccuracy - actualAccuracy);
      
      return {
        confidence: bucket.avgConfidence,
        expected: expectedAccuracy,
        actual: actualAccuracy,
        error: calibrationError,
        samples: bucket.total
      };
    });
    
    // Overall calibration error (ECE - Expected Calibration Error)
    const ece = calibration.reduce((sum, bucket) => 
      sum + (bucket.samples / lawHistory.length) * bucket.error, 0
    );
    
    // Brier score (overall accuracy metric)
    const brierScore = lawHistory.reduce((sum, pred) => {
      const confidence = this.getCalibratredConfidence(lawId).confidence;
      return sum + Math.pow(confidence - (pred.hit ? 1 : 0), 2);
    }, 0) / lawHistory.length;
    
    return {
      calibrated: true,
      calibration: calibration,
      ece: ece,
      brierScore: brierScore,
      wellCalibrated: ece < 0.1, // Less than 10% calibration error
      samples: lawHistory.length
    };
  }
  
  /**
   * Create confidence buckets for calibration analysis
   */
  createConfidenceBuckets(predictions, numBuckets = 5) {
    const buckets = Array(numBuckets).fill(null).map((_, i) => ({
      min: i / numBuckets,
      max: (i + 1) / numBuckets,
      predictions: [],
      hits: 0,
      total: 0,
      avgConfidence: 0
    }));
    
    predictions.forEach(pred => {
      const confidence = this.getCalibratredConfidence(pred.lawId).confidence;
      const bucketIndex = Math.min(
        Math.floor(confidence * numBuckets), 
        numBuckets - 1
      );
      
      buckets[bucketIndex].predictions.push(pred);
      buckets[bucketIndex].total++;
      if (pred.hit) buckets[bucketIndex].hits++;
      buckets[bucketIndex].avgConfidence += confidence;
    });
    
    // Calculate average confidence per bucket
    buckets.forEach(bucket => {
      if (bucket.total > 0) {
        bucket.avgConfidence /= bucket.total;
      } else {
        bucket.avgConfidence = (bucket.min + bucket.max) / 2;
      }
    });
    
    return buckets.filter(b => b.total > 0);
  }
  
  /**
   * Suggest confidence adjustment based on calibration
   */
  suggestAdjustment(lawId) {
    const metrics = this.getCalibrationMetrics(lawId);
    
    if (!metrics.calibrated) {
      return {
        action: 'collect_more_data',
        reason: metrics.message
      };
    }
    
    if (metrics.wellCalibrated) {
      return {
        action: 'maintain',
        reason: 'Confidence is well calibrated'
      };
    }
    
    // Find systematic over/under confidence
    const avgError = metrics.calibration.reduce((sum, bucket) => 
      sum + (bucket.expected - bucket.actual) * bucket.samples, 0
    ) / metrics.samples;
    
    if (avgError > 0.05) {
      return {
        action: 'decrease_confidence',
        magnitude: avgError,
        reason: 'Systematic overconfidence detected'
      };
    }
    
    if (avgError < -0.05) {
      return {
        action: 'increase_confidence', 
        magnitude: -avgError,
        reason: 'Systematic underconfidence detected'
      };
    }
    
    return {
      action: 'refine_model',
      reason: 'Non-systematic calibration errors'
    };
  }
  
  /**
   * Export calibration data for analysis
   */
  exportCalibrationData() {
    const data = {
      timestamp: Date.now(),
      laws: {},
      globalMetrics: {
        totalPredictions: this.predictionHistory.length,
        overallAccuracy: this.predictionHistory.filter(p => p.hit).length / 
                        this.predictionHistory.length
      }
    };
    
    this.betaParams.forEach((params, lawId) => {
      data.laws[lawId] = {
        betaParams: params,
        calibratedConfidence: this.getCalibratredConfidence(lawId),
        calibrationMetrics: this.getCalibrationMetrics(lawId),
        adjustmentSuggestion: this.suggestAdjustment(lawId)
      };
    });
    
    return data;
  }
}

/**
 * Integration with Codex Engine
 */
export function integrateCalibration(codexEngine) {
  const calibration = new ConfidenceCalibration();
  
  // Initialize calibration for existing laws
  codexEngine.codex.laws.forEach((law, lawId) => {
    calibration.initializeLaw(lawId, law.confidence);
  });
  
  // Override confidence update method
  const originalUpdate = codexEngine.updateConfidence.bind(codexEngine);
  
  codexEngine.updateConfidence = function(currentConfidence, newEvidence) {
    // Use calibrated confidence instead
    const lawId = this.currentLawId; // Assume this is set during analysis
    
    if (lawId && newEvidence.predicted && newEvidence.actual) {
      const calibrated = calibration.updateBetaParameters(
        lawId, 
        newEvidence.predicted, 
        newEvidence.actual
      );
      
      // Update law with calibrated confidence
      const law = this.codex.laws.get(lawId);
      if (law) {
        law.confidence = calibrated.confidence;
        law.calibration = calibrated;
      }
      
      return calibrated.confidence;
    }
    
    // Fallback to original method
    return originalUpdate(currentConfidence, newEvidence);
  };
  
  // Add calibration methods to codex engine
  codexEngine.calibration = calibration;
  codexEngine.getCalibrationReport = () => calibration.exportCalibrationData();
  
  return calibration;
}