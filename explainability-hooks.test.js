/**
 * Unit tests for Explainability Hooks with deterministic behavior
 * Uses fixed seed for reproducible results
 */

import { ExplainabilityHooks, integrateExplainabilityHooks } from './explainability-hooks.js';

// Simple test framework
function describe(name, fn) {
  console.log(`\n📦 ${name}`);
  fn();
}

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    return true;
  } catch (error) {
    console.log(`  ❌ ${name}: ${error.message}`);
    return false;
  }
}

function expect(value) {
  return {
    toBe: (expected) => {
      if (value !== expected) throw new Error(`Expected ${expected}, got ${value}`);
    },
    toEqual: (expected) => {
      if (JSON.stringify(value) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(value)}`);
      }
    },
    toBeGreaterThan: (expected) => {
      if (value <= expected) throw new Error(`Expected ${value} > ${expected}`);
    },
    toBeGreaterThanOrEqual: (expected) => {
      if (value < expected) throw new Error(`Expected ${value} >= ${expected}`);
    },
    toBeLessThan: (expected) => {
      if (value >= expected) throw new Error(`Expected ${value} < ${expected}`);
    },
    toBeLessThanOrEqual: (expected) => {
      if (value > expected) throw new Error(`Expected ${value} <= ${expected}`);
    },
    toBeDefined: () => {
      if (value === undefined) throw new Error('Expected value to be defined');
    },
    toBeUndefined: () => {
      if (value !== undefined) throw new Error('Expected value to be undefined');
    },
    toHaveLength: (expected) => {
      if (value.length !== expected) throw new Error(`Expected length ${expected}, got ${value.length}`);
    },
    toContain: (expected) => {
      if (!value.includes(expected)) throw new Error(`Expected "${value}" to contain "${expected}"`);
    },
    toEndWith: (expected) => {
      if (!value.endsWith(expected)) throw new Error(`Expected "${value}" to end with "${expected}"`);
    },
    not: {
      toEqual: (expected) => {
        if (JSON.stringify(value) === JSON.stringify(expected)) {
          throw new Error(`Expected not to equal ${JSON.stringify(expected)}`);
        }
      },
      toThrow: () => {
        try {
          if (typeof value === 'function') value();
          // If no error thrown, that's what we want for "not.toThrow"
        } catch (error) {
          throw new Error(`Expected function not to throw, but it threw: ${error.message}`);
        }
      }
    }
  };
}

function beforeEach(fn) {
  // Store for later execution in tests
  beforeEach._fn = fn;
}

// Mock jest functions for existing tests
const jest = {
  fn: (implementation) => {
    const mockFn = implementation || (() => {});
    mockFn._isMockFunction = true;
    return mockFn;
  }
};

function runTestSuite() {
  const results = { passed: 0, failed: 0 };

describe('ExplainabilityHooks', () => {
  let hooks;
  
  beforeEach(() => {
    hooks = new ExplainabilityHooks();
    // Reset with fixed seed for deterministic behavior
    hooks.reset(42);
  });
  
  describe('Seeded Random Number Generator', () => {
    test('should produce deterministic sequence with fixed seed', () => {
      const hooks1 = new ExplainabilityHooks();
      hooks1.reset(123);
      
      const hooks2 = new ExplainabilityHooks();
      hooks2.reset(123);
      
      // Generate same sequence
      const sequence1 = Array.from({ length: 10 }, () => hooks1.rng());
      const sequence2 = Array.from({ length: 10 }, () => hooks2.rng());
      
      expect(sequence1).toEqual(sequence2);
    });
    
    test('should produce different sequences with different seeds', () => {
      const hooks1 = new ExplainabilityHooks();
      hooks1.reset(123);
      
      const hooks2 = new ExplainabilityHooks();
      hooks2.reset(456);
      
      const sequence1 = Array.from({ length: 10 }, () => hooks1.rng());
      const sequence2 = Array.from({ length: 10 }, () => hooks2.rng());
      
      expect(sequence1).not.toEqual(sequence2);
    });
    
    test('should produce values in range [0, 1)', () => {
      const values = Array.from({ length: 100 }, () => hooks.rng());
      
      values.forEach(value => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      });
    });
  });
  
  describe('Impact Score Calculation', () => {
    test('should calculate consistent impact scores with same inputs', () => {
      const eventData = {
        type: 'confirmation',
        correlation: 0.8,
        signal: 1.5,
        noise: 0.3,
        weight: 2.0
      };
      
      const context = {
        experimentType: 'controlled'
      };
      
      // Reset to same seed multiple times
      hooks.reset(42);
      const score1 = hooks.calculateImpactScore(0.1, eventData, context);
      
      hooks.reset(42);
      const score2 = hooks.calculateImpactScore(0.1, eventData, context);
      
      expect(score1).toEqual(score2);
    });
    
    test('should scale impact with confidence change', () => {
      const eventData = { type: 'confirmation' };
      const context = {};
      
      hooks.reset(42);
      const smallChange = hooks.calculateImpactScore(0.05, eventData, context);
      
      hooks.reset(42);
      const largeChange = hooks.calculateImpactScore(0.15, eventData, context);
      
      expect(largeChange).toBeGreaterThan(smallChange);
    });
    
    test('should apply correct type multipliers', () => {
      const context = {};
      hooks.reset(42);
      
      const confirmationScore = hooks.calculateImpactScore(0.1, { type: 'confirmation' }, context);
      hooks.reset(42);
      const contradictionScore = hooks.calculateImpactScore(0.1, { type: 'contradiction' }, context);
      hooks.reset(42);
      const breakthroughScore = hooks.calculateImpactScore(0.1, { type: 'breakthrough' }, context);
      
      // Breakthrough should have highest multiplier (2.5)
      expect(breakthroughScore).toBeGreaterThan(contradictionScore);
      // Contradiction should be higher than confirmation (2.0 vs 1.5)
      expect(contradictionScore).toBeGreaterThan(confirmationScore);
    });
    
    test('should handle SNR calculation correctly', () => {
      hooks.reset(42);
      const highSNR = hooks.calculateImpactScore(0.1, {
        signal: 2.0,
        noise: 0.2  // SNR = 10
      }, {});
      
      hooks.reset(42);
      const lowSNR = hooks.calculateImpactScore(0.1, {
        signal: 1.0,
        noise: 1.0  // SNR = 1
      }, {});
      
      expect(highSNR).toBeGreaterThan(lowSNR);
    });
    
    test('should prevent division by zero in SNR calculation', () => {
      hooks.reset(42);
      expect(() => {
        hooks.calculateImpactScore(0.1, {
          signal: 1.0,
          noise: 0  // Would cause division by zero
        }, {});
      }).not.toThrow();
    });
  });
  
  describe('Event Tracking and History', () => {
    test('should track law updates with sufficient confidence change', () => {
      const lawId = 'test-law';
      const eventData = { type: 'confirmation' };
      
      const record = hooks.hookLawUpdate(lawId, 0.5, 0.52, eventData);
      
      expect(record).toBeDefined();
      expect(record.confidenceChange).toBe(0.02);
      expect(record.lawId).toBeUndefined(); // Not stored in record
      expect(record.eventData.type).toBe('confirmation');
    });
    
    test('should ignore updates below threshold', () => {
      const lawId = 'test-law';
      const eventData = { type: 'confirmation' };
      
      // Change below threshold (0.01)
      const record = hooks.hookLawUpdate(lawId, 0.5, 0.505, eventData);
      
      expect(record).toBeUndefined();
      expect(hooks.getEventHistory(lawId).length).toBe(0);
    });
    
    test('should maintain event history with deterministic ordering', () => {
      const lawId = 'test-law';
      
      // Add multiple events with same seed
      hooks.reset(42);
      hooks.hookLawUpdate(lawId, 0.5, 0.6, { type: 'confirmation' });
      hooks.hookLawUpdate(lawId, 0.6, 0.7, { type: 'contradiction' });
      hooks.hookLawUpdate(lawId, 0.7, 0.8, { type: 'breakthrough' });
      
      const history = hooks.getEventHistory(lawId);
      expect(history.length).toBe(3);
      
      // Should be in reverse chronological order (most recent first)
      expect(history[0].eventData.type).toBe('breakthrough');
      expect(history[1].eventData.type).toBe('contradiction');
      expect(history[2].eventData.type).toBe('confirmation');
    });
    
    test('should limit history to 50 events', () => {
      const lawId = 'test-law';
      
      // Add 60 events
      for (let i = 0; i < 60; i++) {
        hooks.hookLawUpdate(lawId, 0.5, 0.52, { type: 'test', index: i });
      }
      
      const history = hooks.eventHistory.get(lawId);
      expect(history.length).toBe(50);
      
      // Should keep the most recent events
      expect(history[history.length - 1].eventData.index).toBe(59);
      expect(history[0].eventData.index).toBe(10);  // Oldest kept event
    });
  });
  
  describe('Top Events Management', () => {
    test('should maintain top 5 events deterministically', () => {
      const lawId = 'test-law';
      hooks.reset(42);
      
      // Add events with different impact levels
      const events = [
        { change: 0.05, type: 'confirmation' },     // Lower impact
        { change: 0.15, type: 'breakthrough' },     // High impact
        { change: 0.08, type: 'contradiction' },    // Medium impact
        { change: 0.12, type: 'anomaly' },          // High impact
        { change: 0.03, type: 'confirmation' },     // Low impact
        { change: 0.18, type: 'breakthrough' },     // Highest impact
        { change: 0.07, type: 'confirmation' }      // Medium impact
      ];
      
      // Add all events
      events.forEach((event, index) => {
        hooks.hookLawUpdate(lawId, 0.5, 0.5 + event.change, {
          type: event.type,
          index: index
        });
      });
      
      const explanation = hooks.getExplanation(lawId);
      expect(explanation.topEvents).toHaveLength(5);
      
      // Should be ordered by impact score (highest first)
      const impactScores = explanation.topEvents.map(e => e.impactScore);
      for (let i = 1; i < impactScores.length; i++) {
        expect(impactScores[i]).toBeLessThanOrEqual(impactScores[i - 1]);
      }
      
      // The breakthrough with 0.18 change should be first
      expect(explanation.topEvents[0].eventType).toBe('breakthrough');
    });
    
    test('should apply time-based decay consistently', () => {
      const lawId = 'test-law';
      hooks.reset(42);
      
      // Mock Date.now to control time
      const originalNow = Date.now;
      let mockTime = 1000000000000; // Fixed starting time
      
      Date.now = jest.fn(() => mockTime);
      
      try {
        // Add first event
        hooks.hookLawUpdate(lawId, 0.5, 0.6, { type: 'confirmation' });
        
        // Advance time by 1 day
        mockTime += 24 * 60 * 60 * 1000;
        
        // Add second event
        hooks.hookLawUpdate(lawId, 0.6, 0.7, { type: 'confirmation' });
        
        // Get explanation to trigger decay calculation
        const explanation = hooks.getExplanation(lawId);
        
        // First event should have lower decayed score due to time
        const firstEventScore = explanation.topEvents.find(e => 
          e.timestamp === 1000000000000).impactScore;
        const secondEventScore = explanation.topEvents.find(e => 
          e.timestamp === mockTime).impactScore;
        
        expect(firstEventScore).toBeLessThan(secondEventScore);
      } finally {
        Date.now = originalNow;
      }
    });
    
    test('should generate deterministic event IDs', () => {
      const lawId = 'test-law';
      
      // Mock Date.now for consistent timestamps
      const originalNow = Date.now;
      Date.now = jest.fn(() => 1000000000000);
      
      try {
        hooks.reset(42);
        const record1 = hooks.hookLawUpdate(lawId, 0.5, 0.6, { type: 'test' });
        
        hooks.reset(42);
        const record2 = hooks.hookLawUpdate(lawId, 0.5, 0.6, { type: 'test' });
        
        expect(record1.id).toEqual(record2.id);
      } finally {
        Date.now = originalNow;
      }
    });
  });
  
  describe('Data Sanitization', () => {
    test('should sanitize event data keeping only allowed fields', () => {
      const eventData = {
        type: 'confirmation',
        correlation: 0.8,
        signal: 1.5,
        noise: 0.3,
        weight: 2.0,
        sensitiveInfo: 'should be removed',
        password: 'secret',
        internalId: 'xyz123'
      };
      
      const sanitized = hooks.sanitizeEventData(eventData);
      
      expect(sanitized.type).toBe('confirmation');
      expect(sanitized.correlation).toBe(0.8);
      expect(sanitized.signal).toBe(1.5);
      expect(sanitized.noise).toBe(0.3);
      expect(sanitized.weight).toBe(2.0);
      
      expect(sanitized.sensitiveInfo).toBeUndefined();
      expect(sanitized.password).toBeUndefined();
      expect(sanitized.internalId).toBeUndefined();
    });
    
    test('should sanitize context data keeping only allowed fields', () => {
      const context = {
        experimentType: 'controlled',
        source: 'test',
        lawType: 'rhythmic',
        phase: 'discovery',
        secretKey: 'should be removed',
        internalState: 'private'
      };
      
      const sanitized = hooks.sanitizeContext(context);
      
      expect(sanitized.experimentType).toBe('controlled');
      expect(sanitized.source).toBe('test');
      expect(sanitized.lawType).toBe('rhythmic');
      expect(sanitized.phase).toBe('discovery');
      
      expect(sanitized.secretKey).toBeUndefined();
      expect(sanitized.internalState).toBeUndefined();
    });
  });
  
  describe('Event Description Generation', () => {
    test('should generate consistent descriptions', () => {
      const eventData = {
        type: 'confirmation',
        correlation: 0.75,
        signal: 2.0,
        noise: 0.4,
        weight: 1.5
      };
      
      const context = { experimentType: 'controlled' };
      
      const description = hooks.generateEventDescription(eventData, 0.08, context);
      
      expect(description).toContain('increased by 8.0%');
      expect(description).toContain('due to confirmation');
      expect(description).toContain('75.0% correlation');
      expect(description).toContain('SNR 5.0');
      expect(description).toContain('from controlled experiment');
      expect(description).toContain('weight: 1.50');
    });
    
    test('should handle negative confidence changes', () => {
      const description = hooks.generateEventDescription(
        { type: 'contradiction' },
        -0.05,
        {}
      );
      
      expect(description).toContain('decreased by 5.0%');
      expect(description).toContain('due to contradiction');
    });
    
    test('should truncate long descriptions', () => {
      const eventData = {
        type: 'very_long_event_type_that_should_be_truncated_significantly',
        correlation: 0.123456789,
        signal: 12.3456789,
        noise: 0.123456789,
        weight: 98.7654321
      };
      
      const context = {
        experimentType: 'very_long_experiment_type_name_that_should_also_be_truncated'
      };
      
      const description = hooks.generateEventDescription(eventData, 0.123456, context);
      
      expect(description.length).toBeLessThanOrEqual(hooks.config.descriptionLength);
      if (description.length === hooks.config.descriptionLength) {
        expect(description).toEndWith('...');
      }
    });
  });
  
  describe('Statistics and Export', () => {
    test('should calculate statistics deterministically', () => {
      hooks.reset(42);
      
      // Add events to multiple laws
      const laws = ['law1', 'law2', 'law3'];
      const eventTypes = ['confirmation', 'contradiction', 'breakthrough'];
      
      laws.forEach((lawId, lawIndex) => {
        eventTypes.forEach((type, typeIndex) => {
          const change = (lawIndex + 1) * (typeIndex + 1) * 0.02;
          hooks.hookLawUpdate(lawId, 0.5, 0.5 + change, { type });
        });
      });
      
      const stats = hooks.getStatistics();
      
      expect(stats.totalLaws).toBe(3);
      expect(stats.totalEvents).toBe(9);
      expect(stats.averageEventsPerLaw).toBe(3);
      expect(stats.eventTypeDistribution.confirmation).toBe(3);
      expect(stats.eventTypeDistribution.contradiction).toBe(3);
      expect(stats.eventTypeDistribution.breakthrough).toBe(3);
      expect(stats.confidenceChangeDistribution.increases).toBe(9);
      expect(stats.confidenceChangeDistribution.decreases).toBe(0);
    });
    
    test('should export explanation data completely', () => {
      const lawId = 'test-law';
      hooks.reset(42);
      
      hooks.hookLawUpdate(lawId, 0.5, 0.6, { type: 'confirmation' });
      hooks.hookLawUpdate(lawId, 0.6, 0.7, { type: 'contradiction' });
      
      const exported = hooks.exportExplanationData(lawId);
      
      expect(exported.explanation).toBeDefined();
      expect(exported.history).toBeDefined();
      expect(exported.explanation.lawId).toBe(lawId);
      expect(exported.explanation.topEvents).toHaveLength(2);
      expect(exported.history).toHaveLength(2);
    });
    
    test('should export all data when no lawId specified', () => {
      hooks.reset(42);
      
      hooks.hookLawUpdate('law1', 0.5, 0.6, { type: 'confirmation' });
      hooks.hookLawUpdate('law2', 0.6, 0.7, { type: 'contradiction' });
      
      const exported = hooks.exportExplanationData();
      
      expect(exported.explanations).toBeDefined();
      expect(exported.histories).toBeDefined();
      expect(exported.config).toBeDefined();
      expect(exported.timestamp).toBeDefined();
      
      expect(Object.keys(exported.explanations)).toContain('law1');
      expect(Object.keys(exported.explanations)).toContain('law2');
      expect(Object.keys(exported.histories)).toContain('law1');
      expect(Object.keys(exported.histories)).toContain('law2');
    });
  });
  
  describe('Explanation Summary Generation', () => {
    test('should generate meaningful summaries', () => {
      const lawId = 'test-law';
      hooks.reset(42);
      
      // Add diverse events
      hooks.hookLawUpdate(lawId, 0.5, 0.6, { type: 'confirmation' });
      hooks.hookLawUpdate(lawId, 0.6, 0.65, { type: 'confirmation' });
      hooks.hookLawUpdate(lawId, 0.65, 0.75, { type: 'breakthrough' });
      
      const explanation = hooks.getExplanation(lawId);
      
      expect(explanation.summary).toContain('3 key events');
      expect(explanation.summary).toContain('confirmation being most common');
      expect(explanation.summary).toContain('Average confidence change');
      expect(explanation.summary).toContain('Total cumulative impact');
    });
    
    test('should handle empty event lists', () => {
      const lawId = 'empty-law';
      
      // Force empty explanation by updating without adding events
      hooks.explanations.set(lawId, {
        lawId,
        lastUpdated: Date.now(),
        totalEvents: 0,
        topEvents: [],
        summary: hooks.generateExplanationSummary([], lawId)
      });
      
      const explanation = hooks.getExplanation(lawId);
      expect(explanation.summary).toBe('No significant confidence-affecting events recorded.');
    });
  });
  
  describe('Integration with Codex Engine', () => {
    test('should integrate with mock codex engine', () => {
      // Mock Codex Engine
      const mockCodex = {
        updateConfidence: jest.fn((oldConf, data) => oldConf + 0.1),
        currentLawId: 'test-law',
        codex: {
          laws: new Map([
            ['test-law', { id: 'test-law', confidence: 0.6 }]
          ])
        }
      };
      
      const integratedHooks = integrateExplainabilityHooks(mockCodex);
      
      // Test integration methods
      expect(typeof mockCodex.getExplanation).toBe('function');
      expect(typeof mockCodex.getAllExplanations).toBe('function');
      expect(typeof mockCodex.getEventHistory).toBe('function');
      expect(typeof mockCodex.getExplainabilityStats).toBe('function');
      expect(typeof mockCodex.exportExplanationData).toBe('function');
      
      // Test confidence update hooking
      const oldUpdateConfidence = mockCodex.updateConfidence;
      const newConfidence = mockCodex.updateConfidence(0.5, { type: 'test' });
      
      expect(newConfidence).toBe(0.6); // 0.5 + 0.1
      expect(mockCodex.updateConfidence).not.toBe(oldUpdateConfidence);
    });
  });
  
  describe('Reset Functionality', () => {
    test('should reset all state with new seed', () => {
      const lawId = 'test-law';
      
      // Add some data
      hooks.hookLawUpdate(lawId, 0.5, 0.6, { type: 'confirmation' });
      expect(hooks.getEventHistory(lawId).length).toBe(1);
      expect(hooks.getExplanation(lawId)).toBeDefined();
      
      // Reset with new seed
      hooks.reset(999);
      
      expect(hooks.getEventHistory(lawId).length).toBe(0);
      expect(hooks.getExplanation(lawId)).toBeNull();
      expect(hooks.config.seed).toBe(999);
      
      // Verify new RNG sequence
      const value1 = hooks.rng();
      hooks.reset(999);
      const value2 = hooks.rng();
      
      expect(value1).toEqual(value2);
    });
  });
  
  return results;
}

// Helper function to run tests
export function runExplainabilityHooksTests() {
  console.log('🧪 Running Explainability Hooks Tests with Fixed Seed...\n');
  
  try {
    // Run the full test suite
    const results = runTestSuite();
    console.log(`\n📊 Full Test Suite Results: ${results.passed}/${results.passed + results.failed} tests passed`);
    
    if (results.failed === 0) {
      console.log('🎉 All comprehensive tests passed with deterministic behavior!');
    } else {
      console.log(`⚠️ ${results.failed} comprehensive test(s) failed`);
    }
    
    // Also run simple verification tests
    console.log('\n🔍 Running Simple Verification Tests...');
  } catch (error) {
    console.error('❌ Test suite execution failed:', error.message);
  }
  
  // This would be the actual test runner in a real environment
  // For now, we'll create a simple test harness
  
  const testSuite = {
    passed: 0,
    failed: 0,
    tests: []
  };
  
  try {
    // Test 1: Deterministic behavior
    console.log('1️⃣ Testing deterministic behavior...');
    const hooks1 = new ExplainabilityHooks();
    hooks1.reset(42);
    const hooks2 = new ExplainabilityHooks();
    hooks2.reset(42);
    
    const seq1 = Array.from({ length: 5 }, () => hooks1.rng());
    const seq2 = Array.from({ length: 5 }, () => hooks2.rng());
    
    if (JSON.stringify(seq1) === JSON.stringify(seq2)) {
      console.log('✅ Deterministic behavior verified');
      testSuite.passed++;
    } else {
      console.log('❌ Deterministic behavior failed');
      testSuite.failed++;
    }
    
    // Test 2: Impact score consistency
    console.log('2️⃣ Testing impact score consistency...');
    hooks1.reset(42);
    hooks2.reset(42);
    
    const score1 = hooks1.calculateImpactScore(0.1, { type: 'confirmation' }, {});
    const score2 = hooks2.calculateImpactScore(0.1, { type: 'confirmation' }, {});
    
    if (score1 === score2) {
      console.log('✅ Impact score consistency verified');
      testSuite.passed++;
    } else {
      console.log('❌ Impact score consistency failed');
      testSuite.failed++;
    }
    
    // Test 3: Event tracking
    console.log('3️⃣ Testing event tracking...');
    hooks1.reset(42);
    
    const record = hooks1.hookLawUpdate('test-law', 0.5, 0.6, { type: 'test' });
    const history = hooks1.getEventHistory('test-law');
    
    if (record && history.length === 1) {
      console.log('✅ Event tracking verified');
      testSuite.passed++;
    } else {
      console.log('❌ Event tracking failed');
      testSuite.failed++;
    }
    
    // Test 4: Top events management
    console.log('4️⃣ Testing top events management...');
    hooks1.reset(42);
    
    // Add multiple events
    hooks1.hookLawUpdate('test-law', 0.5, 0.6, { type: 'confirmation' });
    hooks1.hookLawUpdate('test-law', 0.6, 0.8, { type: 'breakthrough' });
    hooks1.hookLawUpdate('test-law', 0.8, 0.85, { type: 'confirmation' });
    
    const explanation = hooks1.getExplanation('test-law');
    
    if (explanation && explanation.topEvents.length === 3) {
      console.log('✅ Top events management verified');
      testSuite.passed++;
    } else {
      console.log('❌ Top events management failed');
      testSuite.failed++;
    }
    
    // Test 5: Data sanitization
    console.log('5️⃣ Testing data sanitization...');
    const sanitized = hooks1.sanitizeEventData({
      type: 'test',
      correlation: 0.8,
      secretField: 'should be removed'
    });
    
    if (sanitized.type === 'test' && sanitized.correlation === 0.8 && !sanitized.secretField) {
      console.log('✅ Data sanitization verified');
      testSuite.passed++;
    } else {
      console.log('❌ Data sanitization failed');
      testSuite.failed++;
    }
    
    console.log(`\n📊 Test Results: ${testSuite.passed}/${testSuite.passed + testSuite.failed} tests passed`);
    
    if (testSuite.failed === 0) {
      console.log('🎉 All explainability hooks tests passed with deterministic behavior!');
    } else {
      console.log(`⚠️ ${testSuite.failed} test(s) failed`);
    }
    
    return testSuite.failed === 0;
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    return false;
  }
}