/**
 * Regime Drift Detection System
 * Detects changes in system behavior patterns and adapts law parameters
 */

export class RegimeDriftDetection {
  constructor() {
    // Window statistics for each law
    this.lawWindows = new Map();
    
    // Regime definitions
    this.regimes = {
      low_load: {
        name: 'Low Load',
        description: 'Calm, stable consciousness state',
        color: '#10b981',
        parameters: {
          rhythmMultiplier: 0.8,
          evolutionThreshold: 0.7,
          recoveryBoost: 1.2
        }
      },
      normal: {
        name: 'Normal',
        description: 'Standard operating mode',
        color: '#3b82f6',
        parameters: {
          rhythmMultiplier: 1.0,
          evolutionThreshold: 0.5,
          recoveryBoost: 1.0
        }
      },
      high_load: {
        name: 'High Load',
        description: 'Intense activity and rapid changes',
        color: '#f59e0b',
        parameters: {
          rhythmMultiplier: 1.3,
          evolutionThreshold: 0.3,
          recoveryBoost: 0.8
        }
      },
      critical: {
        name: 'Critical',
        description: 'Extreme conditions, emergency mode',
        color: '#ef4444',
        parameters: {
          rhythmMultiplier: 1.5,
          evolutionThreshold: 0.2,
          recoveryBoost: 0.6
        }
      }
    };
    
    // Detection settings
    this.settings = {
      windowSize: 50,          // Events to track
      minWindowSize: 20,       // Minimum events for detection
      driftThreshold: 0.05,    // p-value threshold for drift
      checkInterval: 10,       // Check every N events
      smoothingFactor: 0.3     // Regime transition smoothing
    };
    
    // Current regimes per law
    this.currentRegimes = new Map();
    
    // Drift detection history
    this.driftHistory = [];
  }
  
  /**
   * Initialize tracking for a law
   */
  initializeLaw(lawId, initialRegime = 'normal') {
    this.lawWindows.set(lawId, {
      events: [],
      lastCheck: 0,
      statistics: {
        mean: 0,
        variance: 0,
        distribution: []
      }
    });
    
    this.currentRegimes.set(lawId, {
      current: initialRegime,
      confidence: 1.0,
      transitionProbabilities: {},
      lastTransition: Date.now()
    });
  }
  
  /**
   * Record an event for drift detection
   */
  recordEvent(lawId, eventData) {
    if (!this.lawWindows.has(lawId)) {
      this.initializeLaw(lawId);
    }
    
    const window = this.lawWindows.get(lawId);
    
    // Extract relevant metric from event
    const metric = this.extractMetric(eventData);
    
    // Add to window
    window.events.push({
      timestamp: Date.now(),
      metric: metric,
      context: eventData
    });
    
    // Maintain window size
    if (window.events.length > this.settings.windowSize) {
      window.events.shift();
    }
    
    // Update statistics
    this.updateWindowStatistics(lawId);
    
    // Check for drift periodically
    window.lastCheck++;
    if (window.lastCheck >= this.settings.checkInterval && 
        window.events.length >= this.settings.minWindowSize) {
      this.checkForDrift(lawId);
      window.lastCheck = 0;
    }
  }
  
  /**
   * Extract relevant metric from event data
   */
  extractMetric(eventData) {
    // Handle different event types
    if (typeof eventData === 'number') {
      return eventData;
    }
    
    if (eventData.correlation !== undefined) {
      return eventData.correlation;
    }
    
    if (eventData.intensity !== undefined) {
      return eventData.intensity;
    }
    
    if (eventData.activity !== undefined) {
      return eventData.activity;
    }
    
    if (eventData.accuracy !== undefined) {
      return eventData.accuracy;
    }
    
    // Default: count as binary event
    return eventData.hit ? 1 : 0;
  }
  
  /**
   * Update window statistics
   */
  updateWindowStatistics(lawId) {
    const window = this.lawWindows.get(lawId);
    const metrics = window.events.map(e => e.metric);
    
    if (metrics.length === 0) return;
    
    // Calculate mean
    const mean = metrics.reduce((sum, m) => sum + m, 0) / metrics.length;
    
    // Calculate variance
    const variance = metrics.reduce((sum, m) => 
      sum + Math.pow(m - mean, 2), 0
    ) / metrics.length;
    
    // Create distribution bins
    const min = Math.min(...metrics);
    const max = Math.max(...metrics);
    const range = max - min || 1;
    const numBins = Math.min(10, Math.ceil(Math.sqrt(metrics.length)));
    
    const distribution = Array(numBins).fill(0);
    metrics.forEach(m => {
      const binIndex = Math.min(
        Math.floor(((m - min) / range) * numBins),
        numBins - 1
      );
      distribution[binIndex]++;
    });
    
    window.statistics = {
      mean,
      variance,
      distribution,
      min,
      max,
      count: metrics.length
    };
  }
  
  /**
   * Check for distribution drift using statistical tests
   */
  checkForDrift(lawId) {
    const window = this.lawWindows.get(lawId);
    
    // Split window into two halves for comparison
    const midpoint = Math.floor(window.events.length / 2);
    const firstHalf = window.events.slice(0, midpoint).map(e => e.metric);
    const secondHalf = window.events.slice(midpoint).map(e => e.metric);
    
    // Perform Kolmogorov-Smirnov test
    const ksResult = this.kolmogorovSmirnovTest(firstHalf, secondHalf);
    
    // Perform Chi-squared test on binned data
    const chiSquaredResult = this.chiSquaredTest(firstHalf, secondHalf);
    
    // Combine test results
    const driftDetected = ksResult.pValue < this.settings.driftThreshold ||
                         chiSquaredResult.pValue < this.settings.driftThreshold;
    
    if (driftDetected) {
      // Determine new regime based on statistics
      const newRegime = this.determineRegime(window.statistics);
      this.transitionToRegime(lawId, newRegime, {
        ksTest: ksResult,
        chiSquaredTest: chiSquaredResult,
        statistics: window.statistics
      });
    }
    
    // Record detection attempt
    this.driftHistory.push({
      lawId,
      timestamp: Date.now(),
      driftDetected,
      ksResult,
      chiSquaredResult,
      currentRegime: this.currentRegimes.get(lawId).current
    });
    
    // Maintain history size
    if (this.driftHistory.length > 100) {
      this.driftHistory = this.driftHistory.slice(-100);
    }
  }
  
  /**
   * Kolmogorov-Smirnov test for distribution comparison
   */
  kolmogorovSmirnovTest(sample1, sample2) {
    const n1 = sample1.length;
    const n2 = sample2.length;
    
    // Sort both samples
    const sorted1 = [...sample1].sort((a, b) => a - b);
    const sorted2 = [...sample2].sort((a, b) => a - b);
    
    // Calculate empirical CDFs
    let maxDiff = 0;
    let i = 0, j = 0;
    
    while (i < n1 || j < n2) {
      const cdf1 = i / n1;
      const cdf2 = j / n2;
      const diff = Math.abs(cdf1 - cdf2);
      
      maxDiff = Math.max(maxDiff, diff);
      
      // Advance the index with smaller value
      if (i < n1 && (j >= n2 || sorted1[i] <= sorted2[j])) {
        i++;
      } else {
        j++;
      }
    }
    
    // Calculate test statistic
    const D = maxDiff;
    const effectiveN = (n1 * n2) / (n1 + n2);
    const lambda = D * Math.sqrt(effectiveN);
    
    // Approximate p-value using Kolmogorov distribution
    const pValue = this.kolmogorovPValue(lambda);
    
    return {
      statistic: D,
      pValue,
      significant: pValue < this.settings.driftThreshold,
      effectSize: D
    };
  }
  
  /**
   * Approximate p-value for Kolmogorov distribution
   */
  kolmogorovPValue(lambda) {
    // Simplified approximation
    if (lambda < 0.4) return 1.0;
    
    // Use asymptotic approximation
    let sum = 0;
    for (let k = 1; k <= 100; k++) {
      sum += 2 * Math.pow(-1, k - 1) * Math.exp(-2 * k * k * lambda * lambda);
    }
    
    return Math.max(0, Math.min(1, sum));
  }
  
  /**
   * Chi-squared test for distribution comparison
   */
  chiSquaredTest(sample1, sample2) {
    // Create bins
    const allData = [...sample1, ...sample2];
    const min = Math.min(...allData);
    const max = Math.max(...allData);
    const range = max - min || 1;
    const numBins = Math.min(5, Math.ceil(Math.sqrt(allData.length / 2)));
    
    // Count observations in each bin
    const counts1 = Array(numBins).fill(0);
    const counts2 = Array(numBins).fill(0);
    
    sample1.forEach(value => {
      const bin = Math.min(
        Math.floor(((value - min) / range) * numBins),
        numBins - 1
      );
      counts1[bin]++;
    });
    
    sample2.forEach(value => {
      const bin = Math.min(
        Math.floor(((value - min) / range) * numBins),
        numBins - 1
      );
      counts2[bin]++;
    });
    
    // Calculate chi-squared statistic
    const n1 = sample1.length;
    const n2 = sample2.length;
    const N = n1 + n2;
    
    let chiSquared = 0;
    for (let i = 0; i < numBins; i++) {
      const O1 = counts1[i];
      const O2 = counts2[i];
      const E1 = (O1 + O2) * n1 / N;
      const E2 = (O1 + O2) * n2 / N;
      
      if (E1 > 0 && E2 > 0) {
        chiSquared += Math.pow(O1 - E1, 2) / E1 + Math.pow(O2 - E2, 2) / E2;
      }
    }
    
    // Degrees of freedom
    const df = numBins - 1;
    
    // Approximate p-value
    const pValue = this.chiSquaredPValue(chiSquared, df);
    
    return {
      statistic: chiSquared,
      pValue,
      degreesOfFreedom: df,
      significant: pValue < this.settings.driftThreshold
    };
  }
  
  /**
   * Approximate p-value for chi-squared distribution
   */
  chiSquaredPValue(x, df) {
    // Simplified approximation using Wilson-Hilferty transformation
    if (x <= 0) return 1.0;
    
    const z = Math.pow(x / df, 1/3) - (1 - 2/(9*df)) / Math.sqrt(2/(9*df));
    
    // Standard normal CDF approximation
    const pValue = 0.5 * (1 + this.erf(z / Math.sqrt(2)));
    
    return 1 - pValue;
  }
  
  /**
   * Error function approximation
   */
  erf(x) {
    // Abramowitz and Stegun approximation
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;
    
    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);
    
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    
    return sign * y;
  }
  
  /**
   * Determine appropriate regime based on statistics
   */
  determineRegime(statistics) {
    const { mean, variance, count } = statistics;
    
    // High variance suggests instability
    const instability = Math.sqrt(variance) / (Math.abs(mean) + 0.1);
    
    // High mean suggests high activity
    const activity = mean;
    
    // Determine regime based on thresholds
    if (instability > 0.5 && activity > 0.7) {
      return 'critical';
    } else if (activity > 0.6 || instability > 0.3) {
      return 'high_load';
    } else if (activity < 0.3 && instability < 0.1) {
      return 'low_load';
    } else {
      return 'normal';
    }
  }
  
  /**
   * Transition to new regime
   */
  transitionToRegime(lawId, newRegime, evidence) {
    const regimeInfo = this.currentRegimes.get(lawId);
    const oldRegime = regimeInfo.current;
    
    if (oldRegime === newRegime) return;
    
    // Smooth transition using confidence
    regimeInfo.confidence *= (1 - this.settings.smoothingFactor);
    
    // Update transition probabilities
    const transitionKey = `${oldRegime}->${newRegime}`;
    regimeInfo.transitionProbabilities[transitionKey] = 
      (regimeInfo.transitionProbabilities[transitionKey] || 0) + 1;
    
    // Apply new regime
    regimeInfo.current = newRegime;
    regimeInfo.lastTransition = Date.now();
    
    // Emit regime change event
    this.onRegimeChange(lawId, oldRegime, newRegime, evidence);
    
    return {
      lawId,
      oldRegime,
      newRegime,
      evidence,
      timestamp: Date.now()
    };
  }
  
  /**
   * Get current regime parameters for a law
   */
  getRegimeParameters(lawId) {
    if (!this.currentRegimes.has(lawId)) {
      return this.regimes.normal.parameters;
    }
    
    const regimeInfo = this.currentRegimes.get(lawId);
    const regime = this.regimes[regimeInfo.current];
    
    // Apply confidence-based smoothing
    const baseParams = this.regimes.normal.parameters;
    const targetParams = regime.parameters;
    const confidence = regimeInfo.confidence;
    
    const smoothedParams = {};
    Object.keys(baseParams).forEach(key => {
      smoothedParams[key] = baseParams[key] * (1 - confidence) + 
                           targetParams[key] * confidence;
    });
    
    return smoothedParams;
  }
  
  /**
   * Get regime status for all laws
   */
  getRegimeStatus() {
    const status = {};
    
    this.currentRegimes.forEach((regimeInfo, lawId) => {
      const window = this.lawWindows.get(lawId);
      status[lawId] = {
        currentRegime: regimeInfo.current,
        regimeDetails: this.regimes[regimeInfo.current],
        confidence: regimeInfo.confidence,
        lastTransition: regimeInfo.lastTransition,
        statistics: window ? window.statistics : null,
        eventCount: window ? window.events.length : 0,
        parameters: this.getRegimeParameters(lawId)
      };
    });
    
    return status;
  }
  
  /**
   * Get drift detection metrics
   */
  getDriftMetrics() {
    // Recent drift detections
    const recentDrifts = this.driftHistory.filter(d => 
      Date.now() - d.timestamp < 300000 // Last 5 minutes
    );
    
    const detectionRate = recentDrifts.filter(d => d.driftDetected).length / 
                         (recentDrifts.length || 1);
    
    // Regime distribution
    const regimeDistribution = {};
    this.currentRegimes.forEach(regimeInfo => {
      regimeDistribution[regimeInfo.current] = 
        (regimeDistribution[regimeInfo.current] || 0) + 1;
    });
    
    // Transition matrix
    const transitionMatrix = {};
    this.currentRegimes.forEach(regimeInfo => {
      Object.entries(regimeInfo.transitionProbabilities).forEach(([key, count]) => {
        transitionMatrix[key] = count;
      });
    });
    
    return {
      detectionRate,
      recentDrifts: recentDrifts.length,
      regimeDistribution,
      transitionMatrix,
      totalLaws: this.currentRegimes.size
    };
  }
  
  /**
   * Override this method to handle regime changes
   */
  onRegimeChange(lawId, oldRegime, newRegime, evidence) {
    console.log(`Regime change detected for ${lawId}: ${oldRegime} → ${newRegime}`);
  }
}

/**
 * Integration with Codex Engine
 */
export function integrateDriftDetection(codexEngine) {
  const driftDetection = new RegimeDriftDetection();
  
  // Initialize drift detection for existing laws
  codexEngine.codex.laws.forEach((law, lawId) => {
    driftDetection.initializeLaw(lawId);
  });
  
  // Hook into experiment analysis
  const originalAnalyze = codexEngine.analyzeExperimentResult.bind(codexEngine);
  
  codexEngine.analyzeExperimentResult = function(result) {
    // Run original analysis
    originalAnalyze(result);
    
    // Record events for drift detection
    switch (result.experiment) {
      case 'rhythm':
        Object.keys(result.data.speeds).forEach(speed => {
          const avgIntensity = result.data.speeds[speed].hotspotIntensity.reduce(
            (a, b) => a + b, 0
          ) / result.data.speeds[speed].hotspotIntensity.length;
          
          driftDetection.recordEvent('rhythmic-resonance', {
            intensity: avgIntensity,
            speed: parseFloat(speed)
          });
        });
        break;
        
      case 'focus':
        if (result.data.synchrony.length > 0) {
          const avgSynchrony = result.data.synchrony.reduce((a, b) => a + b, 0) / 
                              result.data.synchrony.length;
          driftDetection.recordEvent('focal-evolution', {
            activity: avgSynchrony,
            triggers: result.data.triggers.length
          });
        }
        break;
        
      case 'disruption':
        Object.values(result.data.disruptions).forEach(disruption => {
          driftDetection.recordEvent('adaptive-recovery', {
            recoveryTime: disruption.stabilizationTime,
            resilience: disruption.adaptability
          });
        });
        break;
        
      case 'prediction':
        Object.values(result.data.accuracy).forEach(accuracy => {
          if (accuracy.coherence !== undefined) {
            driftDetection.recordEvent('prediction-decay', {
              accuracy: accuracy.coherence
            });
          }
        });
        break;
    }
  };
  
  // Override law parameter retrieval to include regime adjustments
  const originalGetLaw = codexEngine.codex.laws.get.bind(codexEngine.codex.laws);
  
  codexEngine.codex.laws.get = function(lawId) {
    const law = originalGetLaw(lawId);
    if (law) {
      // Apply regime parameters
      const regimeParams = driftDetection.getRegimeParameters(lawId);
      law.regimeParameters = regimeParams;
      law.currentRegime = driftDetection.currentRegimes.get(lawId)?.current || 'normal';
    }
    return law;
  };
  
  // Handle regime changes
  driftDetection.onRegimeChange = (lawId, oldRegime, newRegime, evidence) => {
    codexEngine.addInsight({
      type: 'regime-change',
      title: `Regime shift: ${oldRegime} → ${newRegime}`,
      details: {
        lawId,
        oldRegime,
        newRegime,
        evidence: evidence.statistics
      },
      timestamp: Date.now()
    });
    
    // Update UI if needed
    if (codexEngine.updateCodexDisplay) {
      codexEngine.updateCodexDisplay();
    }
  };
  
  // Add drift detection methods to codex engine
  codexEngine.driftDetection = driftDetection;
  codexEngine.getRegimeStatus = () => driftDetection.getRegimeStatus();
  codexEngine.getDriftMetrics = () => driftDetection.getDriftMetrics();
  
  return driftDetection;
}