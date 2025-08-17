/**
 * Explainability Hooks - Track events with highest impact on law confidence
 * Provides transparency into confidence changes with top-5 influential events
 */

export class ExplainabilityHooks {
  constructor() {
    // Configuration
    this.config = {
      maxTopEvents: 5,
      impactThreshold: 0.01,  // Minimum confidence change to consider
      descriptionLength: 150, // Max chars for event description
      decayFactor: 0.95,      // Decay for historical impact scores
      seed: 42                // Fixed seed for deterministic behavior
    };
    
    // Internal random generator with fixed seed
    this.rng = this.createSeededRNG(this.config.seed);
    
    // Storage for law explanations
    this.explanations = new Map();
    
    // Event tracking
    this.eventHistory = new Map();
    this.lastConfidenceUpdate = new Map();
  }
  
  /**
   * Create seeded random number generator for deterministic behavior
   */
  createSeededRNG(seed) {
    let state = seed;
    return function() {
      state = (state * 1103515245 + 12345) & 0x7fffffff;
      return state / 0x80000000;
    };
  }
  
  /**
   * Hook into law confidence updates to track influential events
   */
  hookLawUpdate(lawId, oldConfidence, newConfidence, eventData, context = {}) {
    const confidenceChange = Math.abs(newConfidence - oldConfidence);
    
    // Only track significant changes
    if (confidenceChange < this.config.impactThreshold) {
      return;
    }
    
    // Calculate impact score
    const impactScore = this.calculateImpactScore(
      confidenceChange, 
      eventData, 
      context
    );
    
    // Create event record
    const eventRecord = {
      id: this.generateEventId(lawId),
      timestamp: Date.now(),
      oldConfidence,
      newConfidence,
      confidenceChange,
      impactScore,
      eventData: this.sanitizeEventData(eventData),
      context: this.sanitizeContext(context),
      description: this.generateEventDescription(eventData, confidenceChange, context)
    };
    
    // Store event in history
    this.addEventToHistory(lawId, eventRecord);
    
    // Update top events for this law
    this.updateTopEvents(lawId);
    
    // Update last confidence for decay calculations
    this.lastConfidenceUpdate.set(lawId, {
      confidence: newConfidence,
      timestamp: Date.now()
    });
    
    return eventRecord;
  }
  
  /**
   * Calculate impact score based on multiple factors
   */
  calculateImpactScore(confidenceChange, eventData, context) {
    let baseScore = confidenceChange * 100; // Scale to 0-100
    
    // Adjust based on event type
    const typeMultiplier = this.getEventTypeMultiplier(eventData, context);
    baseScore *= typeMultiplier;
    
    // Adjust based on evidence weight if available
    if (eventData && eventData.weight) {
      baseScore *= Math.log(1 + eventData.weight);
    }
    
    // Adjust based on signal-to-noise ratio
    if (eventData && eventData.signal && eventData.noise) {
      const snr = eventData.signal / Math.max(eventData.noise, 0.01);
      baseScore *= Math.log(1 + snr) / Math.log(10); // log10 scaling
    }
    
    // Add small random component for deterministic tie-breaking
    const randomComponent = this.rng() * 0.1;
    
    return Math.max(0, baseScore + randomComponent);
  }
  
  /**
   * Get event type multiplier for impact calculation
   */
  getEventTypeMultiplier(eventData, context) {
    // Default multiplier
    let multiplier = 1.0;
    
    // High-impact event types
    if (eventData?.type === 'confirmation') {
      multiplier = 1.5;
    } else if (eventData?.type === 'contradiction') {
      multiplier = 2.0; // Contradictions are very significant
    } else if (eventData?.type === 'anomaly') {
      multiplier = 1.8;
    } else if (eventData?.type === 'breakthrough') {
      multiplier = 2.5;
    }
    
    // Context-based adjustments
    if (context.experimentType === 'controlled') {
      multiplier *= 1.2;
    } else if (context.experimentType === 'natural') {
      multiplier *= 0.9;
    }
    
    // Correlation strength adjustment
    if (eventData?.correlation) {
      const absCorr = Math.abs(eventData.correlation);
      multiplier *= (0.5 + absCorr); // 0.5-1.5x based on correlation
    }
    
    return multiplier;
  }
  
  /**
   * Generate unique event ID
   */
  generateEventId(lawId) {
    const timestamp = Date.now();
    const random = Math.floor(this.rng() * 10000);
    return `${lawId}-${timestamp}-${random}`;
  }
  
  /**
   * Sanitize event data to remove sensitive information
   */
  sanitizeEventData(eventData) {
    if (!eventData) return {};
    
    // Create safe copy with only allowed fields
    const safe = {};
    const allowedFields = [
      'type', 'correlation', 'signal', 'noise', 'weight', 
      'predicted', 'actual', 'confidence', 'timestamp',
      'pattern', 'frequency', 'amplitude', 'velocity', 'activity'
    ];
    
    allowedFields.forEach(field => {
      if (eventData[field] !== undefined) {
        safe[field] = eventData[field];
      }
    });
    
    return safe;
  }
  
  /**
   * Sanitize context data
   */
  sanitizeContext(context) {
    if (!context) return {};
    
    const safe = {};
    const allowedFields = [
      'experimentType', 'source', 'lawType', 'phase',
      'iteration', 'batchSize', 'duration'
    ];
    
    allowedFields.forEach(field => {
      if (context[field] !== undefined) {
        safe[field] = context[field];
      }
    });
    
    return safe;
  }
  
  /**
   * Generate human-readable event description
   */
  generateEventDescription(eventData, confidenceChange, context) {
    const direction = confidenceChange > 0 ? 'increased' : 'decreased';
    const magnitude = Math.abs(confidenceChange);
    
    let description = `Confidence ${direction} by ${(magnitude * 100).toFixed(1)}%`;
    
    // Add event type context
    if (eventData?.type) {
      description += ` due to ${eventData.type}`;
    }
    
    // Add correlation info
    if (eventData?.correlation !== undefined) {
      const corrStr = (eventData.correlation * 100).toFixed(1);
      description += ` (${corrStr}% correlation)`;
    }
    
    // Add signal quality info
    if (eventData?.signal && eventData?.noise) {
      const snr = eventData.signal / eventData.noise;
      description += ` with SNR ${snr.toFixed(1)}`;
    }
    
    // Add experiment context
    if (context?.experimentType) {
      description += ` from ${context.experimentType} experiment`;
    }
    
    // Add weight info
    if (eventData?.weight) {
      description += ` (weight: ${eventData.weight.toFixed(2)})`;
    }
    
    // Truncate if too long
    if (description.length > this.config.descriptionLength) {
      description = description.substring(0, this.config.descriptionLength - 3) + '...';
    }
    
    return description;
  }
  
  /**
   * Add event to law history
   */
  addEventToHistory(lawId, eventRecord) {
    if (!this.eventHistory.has(lawId)) {
      this.eventHistory.set(lawId, []);
    }
    
    const history = this.eventHistory.get(lawId);
    history.push(eventRecord);
    
    // Keep only last 50 events per law
    if (history.length > 50) {
      history.shift();
    }
  }
  
  /**
   * Update top events for a law based on impact scores
   */
  updateTopEvents(lawId) {
    const history = this.eventHistory.get(lawId) || [];
    
    // Apply decay to historical impact scores
    this.applyDecayToHistory(lawId);
    
    // Sort by decayed impact score
    const sortedEvents = [...history].sort((a, b) => {
      const decayedScoreA = this.getDecayedImpactScore(a);
      const decayedScoreB = this.getDecayedImpactScore(b);
      return decayedScoreB - decayedScoreA;
    });
    
    // Take top 5
    const topEvents = sortedEvents.slice(0, this.config.maxTopEvents);
    
    // Create explanation summary
    const explanation = {
      lawId,
      lastUpdated: Date.now(),
      totalEvents: history.length,
      topEvents: topEvents.map(event => ({
        id: event.id,
        timestamp: event.timestamp,
        impactScore: this.getDecayedImpactScore(event),
        confidenceChange: event.confidenceChange,
        description: event.description,
        eventType: event.eventData?.type || 'unknown',
        correlation: event.eventData?.correlation,
        weight: event.eventData?.weight
      })),
      summary: this.generateExplanationSummary(topEvents, lawId)
    };
    
    this.explanations.set(lawId, explanation);
  }
  
  /**
   * Apply time-based decay to historical impact scores
   */
  applyDecayToHistory(lawId) {
    const history = this.eventHistory.get(lawId) || [];
    const now = Date.now();
    
    history.forEach(event => {
      // Add decayed score if not present
      if (!event.decayedImpactScore) {
        event.decayedImpactScore = event.impactScore;
        event.lastDecayUpdate = event.timestamp;
      }
      
      // Apply decay based on time elapsed
      const timeDiff = now - event.lastDecayUpdate;
      const decayPeriods = timeDiff / (24 * 60 * 60 * 1000); // days
      event.decayedImpactScore *= Math.pow(this.config.decayFactor, decayPeriods);
      event.lastDecayUpdate = now;
    });
  }
  
  /**
   * Get current decayed impact score for an event
   */
  getDecayedImpactScore(event) {
    if (!event.decayedImpactScore) {
      return event.impactScore;
    }
    
    // Apply additional decay if needed
    const now = Date.now();
    const timeDiff = now - (event.lastDecayUpdate || event.timestamp);
    const decayPeriods = timeDiff / (24 * 60 * 60 * 1000);
    
    return event.decayedImpactScore * Math.pow(this.config.decayFactor, decayPeriods);
  }
  
  /**
   * Generate summary of top events explanation
   */
  generateExplanationSummary(topEvents, lawId) {
    if (topEvents.length === 0) {
      return 'No significant confidence-affecting events recorded.';
    }
    
    const totalImpact = topEvents.reduce((sum, event) => 
      sum + this.getDecayedImpactScore(event), 0);
    
    const avgConfidenceChange = topEvents.reduce((sum, event) =>
      sum + Math.abs(event.confidenceChange), 0) / topEvents.length;
    
    // Categorize events
    const eventTypes = {};
    topEvents.forEach(event => {
      const type = event.eventData?.type || 'measurement';
      eventTypes[type] = (eventTypes[type] || 0) + 1;
    });
    
    const dominantType = Object.entries(eventTypes)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'unknown';
    
    // Recent vs historical
    const now = Date.now();
    const recentEvents = topEvents.filter(event => 
      now - event.timestamp < 24 * 60 * 60 * 1000).length;
    
    let summary = `Law confidence primarily influenced by ${topEvents.length} key events `;
    summary += `(${dominantType} being most common). `;
    
    if (recentEvents > 0) {
      summary += `${recentEvents} recent event(s) show ongoing pattern validation. `;
    }
    
    summary += `Average confidence change: ±${(avgConfidenceChange * 100).toFixed(1)}%. `;
    summary += `Total cumulative impact: ${totalImpact.toFixed(1)}.`;
    
    return summary;
  }
  
  /**
   * Get explanation for a specific law
   */
  getExplanation(lawId) {
    return this.explanations.get(lawId) || null;
  }
  
  /**
   * Get all explanations
   */
  getAllExplanations() {
    return Object.fromEntries(this.explanations);
  }
  
  /**
   * Get event history for a law
   */
  getEventHistory(lawId, limit = 20) {
    const history = this.eventHistory.get(lawId) || [];
    return history.slice(-limit).reverse(); // Most recent first
  }
  
  /**
   * Export explanation data for analysis
   */
  exportExplanationData(lawId = null) {
    if (lawId) {
      return {
        explanation: this.explanations.get(lawId),
        history: this.eventHistory.get(lawId)
      };
    }
    
    // Export all data
    const data = {
      explanations: Object.fromEntries(this.explanations),
      histories: Object.fromEntries(this.eventHistory),
      config: this.config,
      timestamp: Date.now()
    };
    
    return data;
  }
  
  /**
   * Reset explanations (useful for testing)
   */
  reset(newSeed = null) {
    this.explanations.clear();
    this.eventHistory.clear();
    this.lastConfidenceUpdate.clear();
    
    if (newSeed !== null) {
      this.config.seed = newSeed;
      this.rng = this.createSeededRNG(newSeed);
    }
  }
  
  /**
   * Get statistics about explanations
   */
  getStatistics() {
    const stats = {
      totalLaws: this.explanations.size,
      totalEvents: 0,
      averageEventsPerLaw: 0,
      mostActivelaw: null,
      mostActiveEventCount: 0,
      eventTypeDistribution: {},
      confidenceChangeDistribution: {
        increases: 0,
        decreases: 0,
        neutral: 0
      }
    };
    
    // Calculate statistics
    this.eventHistory.forEach((history, lawId) => {
      stats.totalEvents += history.length;
      
      if (history.length > stats.mostActiveEventCount) {
        stats.mostActiveEventCount = history.length;
        stats.mostActivelaw = lawId;
      }
      
      history.forEach(event => {
        const type = event.eventData?.type || 'unknown';
        stats.eventTypeDistribution[type] = (stats.eventTypeDistribution[type] || 0) + 1;
        
        if (event.confidenceChange > 0.001) {
          stats.confidenceChangeDistribution.increases++;
        } else if (event.confidenceChange < -0.001) {
          stats.confidenceChangeDistribution.decreases++;
        } else {
          stats.confidenceChangeDistribution.neutral++;
        }
      });
    });
    
    if (this.explanations.size > 0) {
      stats.averageEventsPerLaw = stats.totalEvents / this.explanations.size;
    }
    
    return stats;
  }
}

/**
 * Integration function for Codex Engine
 */
export function integrateExplainabilityHooks(codexEngine) {
  const explainabilityHooks = new ExplainabilityHooks();
  
  // Hook into confidence updates
  const originalUpdateConfidence = codexEngine.updateConfidence;
  codexEngine.updateConfidence = function(oldConfidence, data) {
    const newConfidence = originalUpdateConfidence.call(this, oldConfidence, data);
    
    // Track the confidence change
    if (this.currentLawId) {
      const law = this.codex.laws.get(this.currentLawId);
      if (law) {
        explainabilityHooks.hookLawUpdate(
          this.currentLawId,
          oldConfidence,
          newConfidence,
          data,
          {
            experimentType: this.currentExperiment || 'unknown',
            source: 'codex_engine',
            lawType: law.id
          }
        );
        
        // Add explanation to law object
        law.explain = explainabilityHooks.getExplanation(this.currentLawId);
      }
    }
    
    return newConfidence;
  };
  
  // Add methods to codex engine
  codexEngine.getExplanation = (lawId) => explainabilityHooks.getExplanation(lawId);
  codexEngine.getAllExplanations = () => explainabilityHooks.getAllExplanations();
  codexEngine.getEventHistory = (lawId, limit) => explainabilityHooks.getEventHistory(lawId, limit);
  codexEngine.getExplainabilityStats = () => explainabilityHooks.getStatistics();
  codexEngine.exportExplanationData = (lawId) => explainabilityHooks.exportExplanationData(lawId);
  
  return explainabilityHooks;
}