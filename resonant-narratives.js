/**
 * Resonant Narratives - Living stories that explain temporal consciousness laws
 * Each narrative evolves with the law's understanding and evidence
 */

export class ResonantNarratives {
  constructor() {
    // Narrative configuration
    this.config = {
      minLength: 150,      // Minimum words per narrative
      maxLength: 500,      // Maximum words per narrative
      evolutionRate: 0.1,  // How much narratives change with new evidence
      metaphorBank: {
        rhythmic: ['ocean waves', 'heartbeat', 'pendulum', 'breathing', 'dancing'],
        focal: ['lens', 'whirlpool', 'magnifying glass', 'lighthouse beam', 'eye of storm'],
        adaptive: ['immune system', 'healing wound', 'growing plant', 'learning child', 'river finding path'],
        predictive: ['fog lifting', 'crystal ball clouding', 'echo fading', 'memory blurring', 'horizon disappearing'],
        emergent: ['crystallization', 'flock formation', 'symphony emerging', 'pattern in chaos', 'constellation appearing']
      }
    };
    
    // Narrative templates for different law types
    this.templates = {
      'rhythmic-resonance': this.createRhythmicTemplate(),
      'focal-evolution': this.createFocalTemplate(),
      'adaptive-recovery': this.createAdaptiveTemplate(),
      'prediction-decay': this.createPredictiveTemplate()
    };
    
    // Active narratives
    this.narratives = new Map();
    
    // Evolution tracking
    this.evolutionHistory = new Map();
  }
  
  /**
   * Generate a narrative for a temporal law
   */
  generateNarrative(law, evidence = []) {
    const template = this.templates[law.id] || this.createDefaultTemplate(law);
    
    // Select metaphors based on law confidence
    const metaphors = this.selectMetaphors(law, template.metaphorType);
    
    // Generate narrative sections
    const sections = {
      introduction: this.generateIntroduction(law, metaphors, template),
      discovery: this.generateDiscovery(law, evidence, template),
      principle: this.generatePrinciple(law, metaphors, template),
      manifestation: this.generateManifestation(law, evidence, template),
      wisdom: this.generateWisdom(law, metaphors, template)
    };
    
    // Assemble complete narrative
    const narrative = this.assembleNarrative(sections, law);
    
    // Store narrative data
    const narrativeData = {
      id: `narrative-${law.id}-${Date.now()}`,
      lawId: law.id,
      text: narrative,
      sections,
      metaphors,
      confidence: law.confidence,
      evidence: evidence.length,
      created: Date.now(),
      version: this.getEvolutionVersion(law.id)
    };
    
    this.narratives.set(law.id, narrativeData);
    this.trackEvolution(law.id, narrativeData);
    
    return narrativeData;
  }
  
  /**
   * Create rhythmic resonance narrative template
   */
  createRhythmicTemplate() {
    return {
      metaphorType: 'rhythmic',
      tone: 'flowing',
      themes: ['synchronization', 'harmony', 'natural cycles', 'resonance'],
      structure: {
        introduction: {
          hook: 'Like {metaphor1}, the temporal consciousness follows an ancient rhythm...',
          context: 'In the dance between time and awareness, a pattern emerges.'
        },
        discovery: {
          moment: 'The first signs appeared when {evidence}...',
          revelation: 'What seemed like chaos was actually {metaphor2} in perfect sync.'
        },
        principle: {
          core: 'The Rhythmic Resonance law states that {formula}.',
          explanation: 'As temporal velocity increases, so does the {metaphor3} of consciousness activity.'
        },
        manifestation: {
          examples: 'We see this in {evidence_patterns}...',
          impact: 'Like {metaphor4}, faster time creates stronger waves of awareness.'
        },
        wisdom: {
          insight: 'To work with this law is to become like {metaphor5}...',
          practice: 'Align your awareness with the rhythm, and amplification follows naturally.'
        }
      }
    };
  }
  
  /**
   * Create focal evolution narrative template
   */
  createFocalTemplate() {
    return {
      metaphorType: 'focal',
      tone: 'concentrating',
      themes: ['transformation', 'intensity', 'convergence', 'evolution'],
      structure: {
        introduction: {
          hook: 'Imagine {metaphor1} gathering light into a single point...',
          context: 'This is how consciousness evolves through focused attention.'
        },
        discovery: {
          moment: 'The breakthrough came when observing {evidence}...',
          revelation: 'Concentrated awareness acted like {metaphor2}, transforming everything it touched.'
        },
        principle: {
          core: 'Focal Evolution follows the formula: {formula}.',
          explanation: 'Focus, time, and synchrony multiply to create evolutionary leaps.'
        },
        manifestation: {
          examples: 'In experiments, we witnessed {evidence_patterns}...',
          impact: 'Like {metaphor3}, focused consciousness bends reality around it.'
        },
        wisdom: {
          insight: 'The secret is becoming {metaphor4} for transformation...',
          practice: 'Gather your awareness, hold it steady, and watch evolution accelerate.'
        }
      }
    };
  }
  
  /**
   * Create adaptive recovery narrative template
   */
  createAdaptiveTemplate() {
    return {
      metaphorType: 'adaptive',
      tone: 'resilient',
      themes: ['healing', 'resilience', 'self-organization', 'restoration'],
      structure: {
        introduction: {
          hook: 'Like {metaphor1}, consciousness has an innate ability to heal...',
          context: 'Disruption is not destruction, but an invitation to adapt.'
        },
        discovery: {
          moment: 'After inducing disruptions, we observed {evidence}...',
          revelation: 'The system behaved like {metaphor2}, always finding its way back.'
        },
        principle: {
          core: 'Adaptive Recovery states: {formula}.',
          explanation: 'Recovery time inversely relates to the system\'s inherent resilience.'
        },
        manifestation: {
          examples: 'We see this resilience in {evidence_patterns}...',
          impact: 'Like {metaphor3}, consciousness grows stronger at the broken places.'
        },
        wisdom: {
          insight: 'To enhance resilience, become like {metaphor4}...',
          practice: 'Trust the system\'s wisdom. Recovery is not return, but evolution.'
        }
      }
    };
  }
  
  /**
   * Create predictive decay narrative template
   */
  createPredictiveTemplate() {
    return {
      metaphorType: 'predictive',
      tone: 'mysterious',
      themes: ['uncertainty', 'fading', 'temporal limits', 'present moment'],
      structure: {
        introduction: {
          hook: 'The future is like {metaphor1}, clear nearby but opaque at distance...',
          context: 'Consciousness can glimpse tomorrow, but not next year.'
        },
        discovery: {
          moment: 'Testing prediction accuracy revealed {evidence}...',
          revelation: 'Future-sight behaved like {metaphor2}, exponentially dimming with time.'
        },
        principle: {
          core: 'Prediction Decay follows: {formula}.',
          explanation: 'Accuracy diminishes exponentially as we peer further ahead.'
        },
        manifestation: {
          examples: 'The pattern appears in {evidence_patterns}...',
          impact: 'Like {metaphor3}, the future becomes probability clouds rather than certainty.'
        },
        wisdom: {
          insight: 'Understanding this law is like understanding {metaphor4}...',
          practice: 'The present is the only moment of true clarity. Use it wisely.'
        }
      }
    };
  }
  
  /**
   * Select metaphors based on law state
   */
  selectMetaphors(law, metaphorType) {
    const pool = this.config.metaphorBank[metaphorType] || this.config.metaphorBank.emergent;
    const selected = [];
    
    // Select metaphors based on confidence
    // Higher confidence = more sophisticated metaphors
    const startIndex = Math.floor(law.confidence * (pool.length - 5));
    
    for (let i = 0; i < 5; i++) {
      const index = (startIndex + i) % pool.length;
      selected.push(pool[index]);
    }
    
    return selected;
  }
  
  /**
   * Generate introduction section
   */
  generateIntroduction(law, metaphors, template) {
    const intro = template.structure.introduction;
    
    let text = intro.hook.replace('{metaphor1}', metaphors[0]);
    text += ' ' + intro.context;
    
    // Add confidence-based elaboration
    if (law.confidence > 0.7) {
      text += ' This truth has been verified through countless observations, each adding another thread to the tapestry of understanding.';
    } else if (law.confidence > 0.4) {
      text += ' While still being explored, the pattern grows clearer with each experiment.';
    } else {
      text += ' Though newly discovered, the signs are unmistakable for those who know how to look.';
    }
    
    return text;
  }
  
  /**
   * Generate discovery section
   */
  generateDiscovery(law, evidence, template) {
    const discovery = template.structure.discovery;
    
    // Create evidence summary
    const evidenceDesc = evidence.length > 0 
      ? `${evidence.length} experiments across ${this.getTimeSpan(evidence)} days`
      : 'initial observations';
    
    let text = discovery.moment.replace('{evidence}', evidenceDesc);
    text += ' ' + discovery.revelation.replace('{metaphor2}', template.metaphors?.[1] || 'a hidden pattern');
    
    // Add specific evidence highlights
    if (evidence.length > 0) {
      const strongestEvidence = evidence
        .filter(e => e.supports !== false)
        .sort((a, b) => (b.weight || 1) - (a.weight || 1))
        .slice(0, 3);
      
      if (strongestEvidence.length > 0) {
        text += ' The strongest confirmations showed';
        strongestEvidence.forEach((ev, i) => {
          const correlation = ev.correlation ? (ev.correlation * 100).toFixed(1) : 'significant';
          text += i === 0 ? ' ' : ', ';
          text += i === strongestEvidence.length - 1 && i > 0 ? 'and ' : '';
          text += `${correlation}% correlation`;
        });
        text += '.';
      }
    }
    
    return text;
  }
  
  /**
   * Generate principle section
   */
  generatePrinciple(law, metaphors, template) {
    const principle = template.structure.principle;
    
    let text = principle.core.replace('{formula}', law.formula);
    text += ' ' + principle.explanation.replace('{metaphor3}', metaphors[2]);
    
    // Add parameter details if available
    if (law.parameters && Object.keys(law.parameters).length > 0) {
      text += ' The key parameters are';
      Object.entries(law.parameters).forEach(([key, value], i, arr) => {
        text += i === 0 ? ' ' : ', ';
        text += i === arr.length - 1 && i > 0 ? 'and ' : '';
        text += `${this.humanizeParameter(key)} at ${this.formatValue(value)}`;
      });
      text += '.';
    }
    
    return text;
  }
  
  /**
   * Generate manifestation section
   */
  generateManifestation(law, evidence, template) {
    const manifestation = template.structure.manifestation;
    
    // Create pattern description
    const patterns = this.extractPatterns(evidence);
    const patternDesc = patterns.length > 0 
      ? patterns.join(', ')
      : 'consistent behavioral patterns';
    
    let text = manifestation.examples.replace('{evidence_patterns}', patternDesc);
    text += ' ' + manifestation.impact.replace('{metaphor4}', template.metaphors?.[3] || 'a force of nature');
    
    // Add confidence-based observation
    if (law.confidence > 0.8) {
      text += ' The effect is so reliable that it has become a cornerstone of temporal consciousness understanding.';
    } else if (law.confidence > 0.5) {
      text += ' Each new observation strengthens our certainty in this fundamental pattern.';
    } else {
      text += ' Though early in our understanding, the implications are already profound.';
    }
    
    return text;
  }
  
  /**
   * Generate wisdom section
   */
  generateWisdom(law, metaphors, template) {
    const wisdom = template.structure.wisdom;
    
    let text = wisdom.insight.replace('{metaphor5}', metaphors[4]);
    text += ' ' + wisdom.practice;
    
    // Add evolution-based wisdom
    const evolution = this.getEvolutionVersion(law.id);
    if (evolution > 5) {
      text += ' Through many iterations, we\'ve learned that the deepest truths are often the simplest.';
    } else if (evolution > 2) {
      text += ' As our understanding deepens, new applications continue to emerge.';
    } else {
      text += ' This is just the beginning of what this law can teach us.';
    }
    
    return text;
  }
  
  /**
   * Assemble complete narrative
   */
  assembleNarrative(sections, law) {
    const parts = [
      `# ${law.name}: A Resonant Narrative\n`,
      sections.introduction,
      '\n\n## The Discovery\n',
      sections.discovery,
      '\n\n## The Principle\n',
      sections.principle,
      '\n\n## Manifestation in Reality\n',
      sections.manifestation,
      '\n\n## Living Wisdom\n',
      sections.wisdom,
      `\n\n---\n*Generated at confidence level ${(law.confidence * 100).toFixed(1)}%*`
    ];
    
    return parts.join('');
  }
  
  /**
   * Track narrative evolution
   */
  trackEvolution(lawId, narrativeData) {
    if (!this.evolutionHistory.has(lawId)) {
      this.evolutionHistory.set(lawId, []);
    }
    
    const history = this.evolutionHistory.get(lawId);
    history.push({
      version: narrativeData.version,
      confidence: narrativeData.confidence,
      created: narrativeData.created,
      metaphors: narrativeData.metaphors
    });
    
    // Keep only last 10 versions
    if (history.length > 10) {
      history.shift();
    }
  }
  
  /**
   * Get evolution version number
   */
  getEvolutionVersion(lawId) {
    const history = this.evolutionHistory.get(lawId);
    return history ? history.length + 1 : 1;
  }
  
  /**
   * Extract time span from evidence
   */
  getTimeSpan(evidence) {
    if (evidence.length === 0) return 0;
    
    const timestamps = evidence.map(e => e.timestamp || Date.now());
    const min = Math.min(...timestamps);
    const max = Math.max(...timestamps);
    
    return Math.ceil((max - min) / (24 * 60 * 60 * 1000));
  }
  
  /**
   * Extract patterns from evidence
   */
  extractPatterns(evidence) {
    const patterns = [];
    
    // Look for common patterns in evidence
    const supportRatio = evidence.filter(e => e.supports !== false).length / evidence.length;
    if (supportRatio > 0.8) patterns.push('strong positive correlation');
    if (supportRatio < 0.2) patterns.push('unexpected contradictions');
    
    const highWeightEvidence = evidence.filter(e => (e.weight || 1) > 5);
    if (highWeightEvidence.length > 0) patterns.push('high-impact events');
    
    const recentEvidence = evidence.filter(e => 
      Date.now() - (e.timestamp || 0) < 24 * 60 * 60 * 1000
    );
    if (recentEvidence.length > evidence.length * 0.5) patterns.push('accelerating discovery');
    
    return patterns.length > 0 ? patterns : ['emerging patterns'];
  }
  
  /**
   * Humanize parameter names
   */
  humanizeParameter(param) {
    const mappings = {
      coefficient: 'resonance coefficient',
      exponent: 'power factor',
      focusWeight: 'focus multiplier',
      timeScale: 'temporal scaling',
      synchronyBoost: 'synchrony amplification',
      resilienceFactor: 'resilience factor',
      tau: 'decay constant',
      baseline: 'baseline accuracy'
    };
    
    return mappings[param] || param.replace(/([A-Z])/g, ' $1').toLowerCase();
  }
  
  /**
   * Format parameter values
   */
  formatValue(value) {
    if (typeof value === 'number') {
      if (value < 0.01) return value.toExponential(2);
      if (value > 1000) return value.toExponential(2);
      if (value % 1 === 0) return value.toString();
      return value.toFixed(2);
    }
    return value.toString();
  }
  
  /**
   * Update narrative with new evidence
   */
  updateNarrative(lawId, law, newEvidence) {
    const existing = this.narratives.get(lawId);
    if (!existing) {
      return this.generateNarrative(law, newEvidence);
    }
    
    // Check if significant change warrants new narrative
    const confidenceChange = Math.abs(law.confidence - existing.confidence);
    const evidenceChange = newEvidence.length - existing.evidence;
    
    if (confidenceChange > this.config.evolutionRate || evidenceChange > 5) {
      // Generate evolved narrative
      return this.generateNarrative(law, newEvidence);
    }
    
    return existing;
  }
  
  /**
   * Get narrative evolution timeline
   */
  getEvolutionTimeline(lawId) {
    const history = this.evolutionHistory.get(lawId);
    if (!history) return null;
    
    return {
      lawId,
      versions: history.length,
      timeline: history.map(version => ({
        version: version.version,
        confidence: version.confidence,
        date: new Date(version.created).toISOString(),
        metaphorEvolution: version.metaphors[0] // Track primary metaphor
      })),
      currentNarrative: this.narratives.get(lawId)
    };
  }
  
  /**
   * Export narrative as formatted text
   */
  exportNarrative(lawId, format = 'markdown') {
    const narrative = this.narratives.get(lawId);
    if (!narrative) return null;
    
    switch (format) {
      case 'markdown':
        return narrative.text;
        
      case 'plain':
        return narrative.text
          .replace(/#{1,6} /g, '')
          .replace(/\*/g, '')
          .replace(/---/g, '___');
        
      case 'html':
        return this.convertToHTML(narrative.text);
        
      default:
        return narrative.text;
    }
  }
  
  /**
   * Convert markdown to HTML
   */
  convertToHTML(markdown) {
    return markdown
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>');
  }
  
  /**
   * Create default template for unknown laws
   */
  createDefaultTemplate(law) {
    return {
      metaphorType: 'emergent',
      tone: 'exploratory',
      themes: ['discovery', 'pattern', 'emergence', 'understanding'],
      structure: {
        introduction: {
          hook: `In the realm of temporal consciousness, a new pattern emerges...`,
          context: `We call it ${law.name}, though its full nature is still revealing itself.`
        },
        discovery: {
          moment: 'The pattern first appeared in {evidence}...',
          revelation: 'What we found defied our previous understanding.'
        },
        principle: {
          core: `The ${law.name} law suggests: {formula}.`,
          explanation: 'Its full implications are still being explored.'
        },
        manifestation: {
          examples: 'Early observations show {evidence_patterns}...',
          impact: 'The effects ripple through the consciousness mesh in unexpected ways.'
        },
        wisdom: {
          insight: 'This discovery reminds us that consciousness still holds mysteries...',
          practice: 'Approach with curiosity and respect for the unknown.'
        }
      }
    };
  }
}

/**
 * Integration with Codex Engine
 */
export function integrateResonantNarratives(codexEngine) {
  const narrativeSystem = new ResonantNarratives();
  
  // Generate narratives for all existing laws
  codexEngine.codex.laws.forEach(law => {
    const evidence = law.evidence || [];
    const narrative = narrativeSystem.generateNarrative(law, evidence);
    codexEngine.codex.narratives.set(law.id, narrative);
  });
  
  // Hook into law updates to update narratives
  const originalUpdateConfidence = codexEngine.updateConfidence;
  codexEngine.updateConfidence = function(oldConfidence, data) {
    const newConfidence = originalUpdateConfidence.call(this, oldConfidence, data);
    
    // Update narrative if law exists
    if (this.currentLawId) {
      const law = this.codex.laws.get(this.currentLawId);
      if (law) {
        const narrative = narrativeSystem.updateNarrative(
          this.currentLawId, 
          law, 
          law.evidence || []
        );
        this.codex.narratives.set(this.currentLawId, narrative);
      }
    }
    
    return newConfidence;
  };
  
  // Add narrative generation for new laws
  const originalAddNewLaw = codexEngine.addNewLaw;
  codexEngine.addNewLaw = function(id, lawData) {
    const result = originalAddNewLaw.call(this, id, lawData);
    
    // Generate narrative for new law
    const law = this.codex.laws.get(id);
    if (law) {
      const narrative = narrativeSystem.generateNarrative(law, []);
      this.codex.narratives.set(id, narrative);
    }
    
    return result;
  };
  
  // Add narrative system methods to codex
  codexEngine.getNarrative = (lawId) => narrativeSystem.narratives.get(lawId);
  codexEngine.exportNarrative = (lawId, format) => narrativeSystem.exportNarrative(lawId, format);
  codexEngine.getNarrativeEvolution = (lawId) => narrativeSystem.getEvolutionTimeline(lawId);
  
  return narrativeSystem;
}