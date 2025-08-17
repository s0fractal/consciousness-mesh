/**
 * Property-based tests for Evidence Weighting System
 * Verifies that stronger events have proportionally greater impact
 */

import { EvidenceWeighting } from './evidence-weighting.js';

// Test utilities for property generation
class PropertyGenerators {
  /**
   * Generate random event with controlled properties
   */
  static generateEvent(constraints = {}) {
    const {
      minSignal = 0,
      maxSignal = 100,
      minNoise = 0.01,
      maxNoise = 10,
      minAge = 0,
      maxAge = 86400000, // 24 hours
      type = null
    } = constraints;
    
    const types = ['critical', 'discovery', 'confirmation', 'contradiction', 'routine', 'noise', 'default'];
    
    return {
      signal: Math.random() * (maxSignal - minSignal) + minSignal,
      noise: Math.random() * (maxNoise - minNoise) + minNoise,
      timestamp: Date.now() - Math.random() * (maxAge - minAge) - minAge,
      type: type || types[Math.floor(Math.random() * types.length)]
    };
  }
  
  /**
   * Generate pairs of events with known relationship
   */
  static generateEventPair(relationship) {
    const baseEvent = this.generateEvent();
    let strongerEvent;
    
    switch (relationship) {
      case 'higher_snr':
        strongerEvent = {
          ...baseEvent,
          signal: baseEvent.signal * 2,
          noise: baseEvent.noise / 2
        };
        break;
        
      case 'more_recent':
        strongerEvent = {
          ...baseEvent,
          timestamp: Date.now() - 1000 // 1 second ago
        };
        baseEvent.timestamp = Date.now() - 3600000; // 1 hour ago
        break;
        
      case 'critical_type':
        strongerEvent = {
          ...baseEvent,
          type: 'critical'
        };
        baseEvent.type = 'routine';
        break;
        
      case 'combined':
        strongerEvent = {
          signal: baseEvent.signal * 3,
          noise: baseEvent.noise / 3,
          timestamp: Date.now() - 1000,
          type: 'critical'
        };
        baseEvent.timestamp = Date.now() - 7200000; // 2 hours ago
        baseEvent.type = 'noise';
        break;
        
      default:
        strongerEvent = baseEvent;
    }
    
    return { weaker: baseEvent, stronger: strongerEvent };
  }
}

// Property-based test suite
export class EvidenceWeightingPropertyTests {
  constructor() {
    this.weighting = new EvidenceWeighting();
    this.results = [];
  }
  
  /**
   * Run all property-based tests
   */
  async runAllTests() {
    console.log('🧪 Running Evidence Weighting Property-Based Tests...\n');
    
    await this.testMonotonicSNR();
    await this.testMonotonicTemporal();
    await this.testBoundedness();
    await this.testRelativeOrdering();
    await this.testTypeModifierConsistency();
    await this.testWeightedUpdateMagnitude();
    await this.testStatisticalProperties();
    await this.testEdgeCases();
    
    this.printSummary();
    return this.results;
  }
  
  /**
   * Property 1: Weight increases monotonically with SNR
   */
  async testMonotonicSNR() {
    console.log('Property 1: Monotonic SNR → Weight Relationship');
    
    const violations = [];
    const numTests = 1000;
    
    for (let i = 0; i < numTests; i++) {
      // Generate two events with same timestamp but different SNR
      const timestamp = Date.now() - 300000; // 5 minutes ago
      const noise = Math.random() * 5 + 0.1;
      
      const event1 = {
        signal: Math.random() * 50,
        noise,
        timestamp,
        type: 'default'
      };
      
      const event2 = {
        signal: event1.signal + Math.random() * 50,
        noise,
        timestamp,
        type: 'default'
      };
      
      const weight1 = this.weighting.calculateEventWeight(event1);
      const weight2 = this.weighting.calculateEventWeight(event2);
      
      // Property: higher signal → higher weight
      if (event2.signal > event1.signal && weight2.finalWeight <= weight1.finalWeight) {
        violations.push({
          event1,
          event2,
          weight1: weight1.finalWeight,
          weight2: weight2.finalWeight
        });
      }
    }
    
    const passed = violations.length === 0;
    
    console.log(`  ✅ Monotonic SNR: ${passed ? 'PASSED' : 'FAILED'}`);
    console.log(`  📊 Tests run: ${numTests}`);
    console.log(`  📊 Violations: ${violations.length}`);
    
    if (!passed && violations.length > 0) {
      console.log(`  ❌ Example violation:`, violations[0]);
    }
    
    this.results.push({
      property: 'Monotonic SNR',
      passed,
      testsRun: numTests,
      violations: violations.length
    });
  }
  
  /**
   * Property 2: Weight decreases monotonically with age
   */
  async testMonotonicTemporal() {
    console.log('\nProperty 2: Monotonic Temporal Decay');
    
    const violations = [];
    const numTests = 1000;
    
    for (let i = 0; i < numTests; i++) {
      // Generate two events with same SNR but different ages
      const signal = Math.random() * 50 + 10;
      const noise = Math.random() * 5 + 0.1;
      
      const age1 = Math.random() * 3600000; // Up to 1 hour
      const age2 = age1 + Math.random() * 3600000; // Older
      
      const event1 = {
        signal,
        noise,
        timestamp: Date.now() - age1,
        type: 'default'
      };
      
      const event2 = {
        signal,
        noise,
        timestamp: Date.now() - age2,
        type: 'default'
      };
      
      const weight1 = this.weighting.calculateEventWeight(event1);
      const weight2 = this.weighting.calculateEventWeight(event2);
      
      // Property: older event → lower weight
      if (age2 > age1 && weight2.finalWeight >= weight1.finalWeight) {
        violations.push({
          age1,
          age2,
          weight1: weight1.finalWeight,
          weight2: weight2.finalWeight
        });
      }
    }
    
    const passed = violations.length === 0;
    
    console.log(`  ✅ Monotonic temporal: ${passed ? 'PASSED' : 'FAILED'}`);
    console.log(`  📊 Tests run: ${numTests}`);
    console.log(`  📊 Violations: ${violations.length}`);
    
    this.results.push({
      property: 'Monotonic Temporal',
      passed,
      testsRun: numTests,
      violations: violations.length
    });
  }
  
  /**
   * Property 3: Weights are always bounded
   */
  async testBoundedness() {
    console.log('\nProperty 3: Weight Boundedness');
    
    const violations = [];
    const numTests = 10000;
    const bounds = this.weighting.config.bounds;
    
    // Test extreme cases
    const extremeEvents = [
      { signal: 0, noise: 1000, timestamp: Date.now() - 86400000 * 7 }, // Very weak, very old
      { signal: 10000, noise: 0.0001, timestamp: Date.now() }, // Very strong, fresh
      { signal: -100, noise: -50, timestamp: Date.now() }, // Invalid negatives
      { signal: Infinity, noise: 0, timestamp: Date.now() }, // Infinity
      { signal: NaN, noise: NaN, timestamp: Date.now() } // NaN
    ];
    
    // Add random events
    for (let i = 0; i < numTests; i++) {
      extremeEvents.push(PropertyGenerators.generateEvent({
        minSignal: -1000,
        maxSignal: 10000,
        minNoise: -100,
        maxNoise: 1000,
        minAge: -86400000, // Future events
        maxAge: 86400000 * 30 // Very old events
      }));
    }
    
    extremeEvents.forEach(event => {
      const weight = this.weighting.calculateEventWeight(event);
      
      if (weight.finalWeight < bounds.minWeight || 
          weight.finalWeight > bounds.maxWeight ||
          !isFinite(weight.finalWeight)) {
        violations.push({
          event,
          weight: weight.finalWeight,
          bounds: { min: bounds.minWeight, max: bounds.maxWeight }
        });
      }
    });
    
    const passed = violations.length === 0;
    
    console.log(`  ✅ Boundedness: ${passed ? 'PASSED' : 'FAILED'}`);
    console.log(`  📊 Tests run: ${extremeEvents.length}`);
    console.log(`  📊 Violations: ${violations.length}`);
    console.log(`  📊 Bounds: [${bounds.minWeight}, ${bounds.maxWeight}]`);
    
    this.results.push({
      property: 'Boundedness',
      passed,
      testsRun: extremeEvents.length,
      violations: violations.length
    });
  }
  
  /**
   * Property 4: Relative ordering is preserved
   */
  async testRelativeOrdering() {
    console.log('\nProperty 4: Relative Ordering Preservation');
    
    const violations = [];
    const relationships = ['higher_snr', 'more_recent', 'critical_type', 'combined'];
    const numTestsPerRelation = 250;
    
    relationships.forEach(relationship => {
      for (let i = 0; i < numTestsPerRelation; i++) {
        const { weaker, stronger } = PropertyGenerators.generateEventPair(relationship);
        
        const weakerWeight = this.weighting.calculateEventWeight(weaker);
        const strongerWeight = this.weighting.calculateEventWeight(stronger);
        
        // Property: stronger events have higher weights
        if (strongerWeight.finalWeight <= weakerWeight.finalWeight) {
          violations.push({
            relationship,
            weaker: { ...weaker, weight: weakerWeight.finalWeight },
            stronger: { ...stronger, weight: strongerWeight.finalWeight }
          });
        }
      }
    });
    
    const passed = violations.length === 0;
    
    console.log(`  ✅ Relative ordering: ${passed ? 'PASSED' : 'FAILED'}`);
    console.log(`  📊 Tests run: ${relationships.length * numTestsPerRelation}`);
    console.log(`  📊 Violations: ${violations.length}`);
    
    if (!passed) {
      const violationsByType = {};
      violations.forEach(v => {
        violationsByType[v.relationship] = (violationsByType[v.relationship] || 0) + 1;
      });
      console.log(`  📊 Violations by type:`, violationsByType);
    }
    
    this.results.push({
      property: 'Relative Ordering',
      passed,
      testsRun: relationships.length * numTestsPerRelation,
      violations: violations.length
    });
  }
  
  /**
   * Property 5: Type modifiers are consistently applied
   */
  async testTypeModifierConsistency() {
    console.log('\nProperty 5: Type Modifier Consistency');
    
    const violations = [];
    const types = ['critical', 'discovery', 'confirmation', 'contradiction', 'routine', 'noise'];
    const numTestsPerType = 100;
    
    types.forEach(type => {
      const expectedModifier = this.weighting.getTypeModifier(type);
      
      for (let i = 0; i < numTestsPerType; i++) {
        const baseEvent = PropertyGenerators.generateEvent({ type: 'default' });
        const typedEvent = { ...baseEvent, type };
        
        const baseWeight = this.weighting.calculateEventWeight(baseEvent);
        const typedWeight = this.weighting.calculateEventWeight(typedEvent);
        
        // Calculate actual modifier
        const actualModifier = typedWeight.finalWeight / baseWeight.finalWeight;
        
        // Property: modifier should be consistently applied (within floating point tolerance)
        if (Math.abs(actualModifier - expectedModifier) > 0.001) {
          violations.push({
            type,
            expectedModifier,
            actualModifier,
            baseWeight: baseWeight.finalWeight,
            typedWeight: typedWeight.finalWeight
          });
        }
      }
    });
    
    const passed = violations.length === 0;
    
    console.log(`  ✅ Type modifier consistency: ${passed ? 'PASSED' : 'FAILED'}`);
    console.log(`  📊 Tests run: ${types.length * numTestsPerType}`);
    console.log(`  📊 Violations: ${violations.length}`);
    
    this.results.push({
      property: 'Type Modifier Consistency',
      passed,
      testsRun: types.length * numTestsPerType,
      violations: violations.length
    });
  }
  
  /**
   * Property 6: Weighted updates scale with weight
   */
  async testWeightedUpdateMagnitude() {
    console.log('\nProperty 6: Weighted Update Magnitude');
    
    const violations = [];
    const numTests = 500;
    
    for (let i = 0; i < numTests; i++) {
      // Generate two events with different weights
      const { weaker, stronger } = PropertyGenerators.generateEventPair('combined');
      
      const weakerWeight = this.weighting.calculateEventWeight(weaker);
      const strongerWeight = this.weighting.calculateEventWeight(stronger);
      
      // Test update application
      const params = { value: 10, momentum: 0.5 };
      const update = { value: { delta: 1 }, momentum: 0.1 };
      
      const weakerUpdate = this.weighting.applyWeightedUpdate(
        params, update, weakerWeight.finalWeight
      );
      const strongerUpdate = this.weighting.applyWeightedUpdate(
        params, update, strongerWeight.finalWeight
      );
      
      // Property: stronger weight → larger update
      const weakerDelta = weakerUpdate.value - params.value;
      const strongerDelta = strongerUpdate.value - params.value;
      
      if (strongerWeight.finalWeight > weakerWeight.finalWeight && 
          strongerDelta <= weakerDelta) {
        violations.push({
          weakerWeight: weakerWeight.finalWeight,
          strongerWeight: strongerWeight.finalWeight,
          weakerDelta,
          strongerDelta
        });
      }
    }
    
    const passed = violations.length === 0;
    
    console.log(`  ✅ Update magnitude scaling: ${passed ? 'PASSED' : 'FAILED'}`);
    console.log(`  📊 Tests run: ${numTests}`);
    console.log(`  📊 Violations: ${violations.length}`);
    
    this.results.push({
      property: 'Weighted Update Magnitude',
      passed,
      testsRun: numTests,
      violations: violations.length
    });
  }
  
  /**
   * Property 7: Statistical properties hold
   */
  async testStatisticalProperties() {
    console.log('\nProperty 7: Statistical Properties');
    
    // Generate many events to test statistical properties
    const numEvents = 5000;
    const weights = [];
    
    for (let i = 0; i < numEvents; i++) {
      const event = PropertyGenerators.generateEvent();
      const weight = this.weighting.calculateEventWeight(event);
      weights.push(weight.finalWeight);
    }
    
    const stats = this.weighting.getWeightStatistics();
    
    // Properties to verify
    const properties = {
      'Average is within bounds': 
        stats.avgWeight >= this.weighting.config.bounds.minWeight &&
        stats.avgWeight <= this.weighting.config.bounds.maxWeight,
        
      'Maximum recorded correctly':
        Math.abs(stats.maxWeight - Math.max(...weights)) < 0.001,
        
      'Distribution sums to total':
        stats.distribution.reduce((sum, d) => sum + d.count, 0) === stats.totalEvents,
        
      'Percentiles ordered correctly':
        stats.recentStats.p25 <= stats.recentStats.median &&
        stats.recentStats.median <= stats.recentStats.p75 &&
        stats.recentStats.p75 <= stats.recentStats.p95
    };
    
    const violations = [];
    Object.entries(properties).forEach(([prop, holds]) => {
      if (!holds) violations.push(prop);
    });
    
    const passed = violations.length === 0;
    
    console.log(`  ✅ Statistical properties: ${passed ? 'PASSED' : 'FAILED'}`);
    console.log(`  📊 Events processed: ${numEvents}`);
    console.log(`  📊 Average weight: ${stats.avgWeight.toFixed(3)}`);
    console.log(`  📊 Weight distribution: p25=${stats.recentStats.p25.toFixed(2)}, ` +
                `median=${stats.recentStats.median.toFixed(2)}, ` +
                `p75=${stats.recentStats.p75.toFixed(2)}`);
    
    if (!passed) {
      console.log(`  ❌ Violated properties:`, violations);
    }
    
    this.results.push({
      property: 'Statistical Properties',
      passed,
      details: properties,
      violations
    });
  }
  
  /**
   * Property 8: Edge cases handled gracefully
   */
  async testEdgeCases() {
    console.log('\nProperty 8: Edge Case Handling');
    
    const edgeCases = [
      {
        name: 'Missing signal',
        event: { noise: 1, timestamp: Date.now() },
        expectation: 'Returns default weight'
      },
      {
        name: 'Missing noise',
        event: { signal: 10, timestamp: Date.now() },
        expectation: 'Uses noise floor'
      },
      {
        name: 'Missing timestamp',
        event: { signal: 10, noise: 1 },
        expectation: 'Returns default temporal weight'
      },
      {
        name: 'Zero signal and noise',
        event: { signal: 0, noise: 0, timestamp: Date.now() },
        expectation: 'Handles gracefully'
      },
      {
        name: 'Negative values',
        event: { signal: -10, noise: -5, timestamp: Date.now() },
        expectation: 'Converts to valid range'
      },
      {
        name: 'Future timestamp',
        event: { signal: 10, noise: 1, timestamp: Date.now() + 3600000 },
        expectation: 'Returns default temporal weight'
      },
      {
        name: 'Unknown type',
        event: { signal: 10, noise: 1, timestamp: Date.now(), type: 'unknown' },
        expectation: 'Uses default modifier'
      }
    ];
    
    const violations = [];
    
    edgeCases.forEach(({ name, event, expectation }) => {
      try {
        const weight = this.weighting.calculateEventWeight(event);
        
        // Verify weight is valid
        if (!isFinite(weight.finalWeight) ||
            weight.finalWeight < this.weighting.config.bounds.minWeight ||
            weight.finalWeight > this.weighting.config.bounds.maxWeight) {
          violations.push({ name, event, weight: weight.finalWeight, expectation });
        }
      } catch (error) {
        violations.push({ name, event, error: error.message, expectation });
      }
    });
    
    const passed = violations.length === 0;
    
    console.log(`  ✅ Edge case handling: ${passed ? 'PASSED' : 'FAILED'}`);
    console.log(`  📊 Edge cases tested: ${edgeCases.length}`);
    console.log(`  📊 Violations: ${violations.length}`);
    
    if (!passed) {
      violations.forEach(v => {
        console.log(`  ❌ ${v.name}: ${v.error || `weight=${v.weight}`}`);
      });
    }
    
    this.results.push({
      property: 'Edge Case Handling',
      passed,
      casesRun: edgeCases.length,
      violations: violations.length
    });
  }
  
  /**
   * Print test summary
   */
  printSummary() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 PROPERTY-BASED TEST SUMMARY');
    console.log('='.repeat(50));
    
    const totalProperties = this.results.length;
    const passedProperties = this.results.filter(r => r.passed).length;
    const totalTests = this.results.reduce((sum, r) => sum + (r.testsRun || r.casesRun || 1), 0);
    const totalViolations = this.results.reduce((sum, r) => sum + (r.violations || 0), 0);
    
    console.log(`Properties Tested: ${totalProperties}`);
    console.log(`Properties Passed: ${passedProperties}`);
    console.log(`Total Test Cases: ${totalTests}`);
    console.log(`Total Violations: ${totalViolations}`);
    console.log(`Success Rate: ${(passedProperties / totalProperties * 100).toFixed(1)}%`);
    
    if (passedProperties === totalProperties) {
      console.log('\n✅ All properties hold! Evidence weighting system is working correctly.');
    } else {
      console.log('\n❌ Some properties violated. Review the results above.');
      console.log('Failed properties:');
      this.results
        .filter(r => !r.passed)
        .forEach(r => console.log(`  - ${r.property}`));
    }
    
    console.log('='.repeat(50));
  }
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new EvidenceWeightingPropertyTests();
  tester.runAllTests();
}