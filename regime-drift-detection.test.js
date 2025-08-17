/**
 * Tests for Regime Drift Detection System
 */

import { RegimeDriftDetection } from './regime-drift-detection.js';

export class RegimeDriftDetectionTests {
  constructor() {
    this.driftDetection = new RegimeDriftDetection();
    this.results = [];
  }
  
  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🔍 Running Regime Drift Detection Tests...\n');
    
    await this.testInitialization();
    await this.testEventRecording();
    await this.testStatisticsCalculation();
    await this.testKolmogorovSmirnovTest();
    await this.testChiSquaredTest();
    await this.testRegimeDetermination();
    await this.testDriftDetection();
    await this.testRegimeTransitions();
    
    this.printSummary();
    return this.results;
  }
  
  /**
   * Test 1: Initialization
   */
  async testInitialization() {
    console.log('Test 1: Initialization');
    
    const lawId = 'test_law';
    this.driftDetection.initializeLaw(lawId, 'normal');
    
    const hasWindow = this.driftDetection.lawWindows.has(lawId);
    const hasRegime = this.driftDetection.currentRegimes.has(lawId);
    const regime = this.driftDetection.currentRegimes.get(lawId);
    
    const passed = hasWindow && hasRegime && regime.current === 'normal';
    
    console.log(`  ✅ Initialization: ${passed ? 'PASSED' : 'FAILED'}`);
    console.log(`  📊 Initial regime: ${regime?.current}`);
    console.log(`  📊 Confidence: ${regime?.confidence}`);
    
    this.results.push({
      test: 'Initialization',
      passed,
      details: { hasWindow, hasRegime, regime: regime?.current }
    });
  }
  
  /**
   * Test 2: Event Recording
   */
  async testEventRecording() {
    console.log('\nTest 2: Event Recording');
    
    const lawId = 'event_test';
    this.driftDetection.initializeLaw(lawId);
    
    // Record various event types
    const events = [
      0.5,                              // Direct number
      { correlation: 0.8 },             // Correlation metric
      { intensity: 0.6 },               // Intensity metric
      { activity: 0.7 },                // Activity metric
      { hit: true },                    // Binary event
      { accuracy: 0.9 }                 // Accuracy metric
    ];
    
    events.forEach(event => {
      this.driftDetection.recordEvent(lawId, event);
    });
    
    const window = this.driftDetection.lawWindows.get(lawId);
    const recordedCount = window.events.length;
    const correctExtraction = window.events.every(e => 
      typeof e.metric === 'number' && e.metric >= 0 && e.metric <= 1
    );
    
    const passed = recordedCount === events.length && correctExtraction;
    
    console.log(`  ✅ Event recording: ${passed ? 'PASSED' : 'FAILED'}`);
    console.log(`  📊 Events recorded: ${recordedCount}/${events.length}`);
    console.log(`  📊 Metrics: ${window.events.map(e => e.metric.toFixed(2)).join(', ')}`);
    
    this.results.push({
      test: 'Event Recording',
      passed,
      recordedCount,
      expectedCount: events.length
    });
  }
  
  /**
   * Test 3: Statistics Calculation
   */
  async testStatisticsCalculation() {
    console.log('\nTest 3: Statistics Calculation');
    
    const lawId = 'stats_test';
    this.driftDetection.initializeLaw(lawId);
    
    // Record known distribution
    const values = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
    values.forEach(v => {
      this.driftDetection.recordEvent(lawId, v);
    });
    
    const window = this.driftDetection.lawWindows.get(lawId);
    const stats = window.statistics;
    
    const expectedMean = 0.5;
    const meanError = Math.abs(stats.mean - expectedMean);
    const hasDistribution = stats.distribution.length > 0;
    const totalInBins = stats.distribution.reduce((a, b) => a + b, 0);
    
    const passed = meanError < 0.01 && hasDistribution && totalInBins === values.length;
    
    console.log(`  ✅ Statistics calculation: ${passed ? 'PASSED' : 'FAILED'}`);
    console.log(`  📊 Mean: ${stats.mean.toFixed(3)} (expected: ${expectedMean})`);
    console.log(`  📊 Variance: ${stats.variance.toFixed(3)}`);
    console.log(`  📊 Min/Max: ${stats.min.toFixed(2)}/${stats.max.toFixed(2)}`);
    console.log(`  📊 Distribution bins: ${stats.distribution.join(', ')}`);
    
    this.results.push({
      test: 'Statistics Calculation',
      passed,
      meanError,
      stats
    });
  }
  
  /**
   * Test 4: Kolmogorov-Smirnov Test
   */
  async testKolmogorovSmirnovTest() {
    console.log('\nTest 4: Kolmogorov-Smirnov Test');
    
    // Test with identical distributions (should not detect drift)
    const sample1 = Array(50).fill(0).map(() => Math.random());
    const sample2 = Array(50).fill(0).map(() => Math.random());
    
    const identicalResult = this.driftDetection.kolmogorovSmirnovTest(sample1, sample1);
    
    // Test with different distributions (should detect drift)
    const normalSample = Array(50).fill(0).map(() => Math.random() * 0.5);
    const shiftedSample = Array(50).fill(0).map(() => Math.random() * 0.5 + 0.5);
    
    const differentResult = this.driftDetection.kolmogorovSmirnovTest(normalSample, shiftedSample);
    
    const passed = identicalResult.pValue > 0.95 && differentResult.pValue < 0.05;
    
    console.log(`  ✅ KS Test: ${passed ? 'PASSED' : 'FAILED'}`);
    console.log(`  📊 Identical samples p-value: ${identicalResult.pValue.toFixed(3)}`);
    console.log(`  📊 Different samples p-value: ${differentResult.pValue.toFixed(3)}`);
    console.log(`  📊 Different samples D-statistic: ${differentResult.statistic.toFixed(3)}`);
    
    this.results.push({
      test: 'Kolmogorov-Smirnov Test',
      passed,
      identicalPValue: identicalResult.pValue,
      differentPValue: differentResult.pValue
    });
  }
  
  /**
   * Test 5: Chi-Squared Test
   */
  async testChiSquaredTest() {
    console.log('\nTest 5: Chi-Squared Test');
    
    // Test with similar distributions
    const uniform1 = Array(60).fill(0).map(() => Math.random());
    const uniform2 = Array(60).fill(0).map(() => Math.random());
    
    const similarResult = this.driftDetection.chiSquaredTest(uniform1, uniform2);
    
    // Test with different distributions
    const lowValues = Array(60).fill(0).map(() => Math.random() * 0.3);
    const highValues = Array(60).fill(0).map(() => Math.random() * 0.3 + 0.7);
    
    const differentResult = this.driftDetection.chiSquaredTest(lowValues, highValues);
    
    const passed = similarResult.pValue > 0.05 && differentResult.pValue < 0.05;
    
    console.log(`  ✅ Chi-Squared Test: ${passed ? 'PASSED' : 'FAILED'}`);
    console.log(`  📊 Similar distributions p-value: ${similarResult.pValue.toFixed(3)}`);
    console.log(`  📊 Different distributions p-value: ${differentResult.pValue.toFixed(3)}`);
    console.log(`  📊 Chi-squared statistic: ${differentResult.statistic.toFixed(3)}`);
    console.log(`  📊 Degrees of freedom: ${differentResult.degreesOfFreedom}`);
    
    this.results.push({
      test: 'Chi-Squared Test',
      passed,
      similarPValue: similarResult.pValue,
      differentPValue: differentResult.pValue
    });
  }
  
  /**
   * Test 6: Regime Determination
   */
  async testRegimeDetermination() {
    console.log('\nTest 6: Regime Determination');
    
    const testCases = [
      {
        stats: { mean: 0.2, variance: 0.01 },
        expected: 'low_load',
        description: 'Low activity, low variance'
      },
      {
        stats: { mean: 0.5, variance: 0.04 },
        expected: 'normal',
        description: 'Normal activity, normal variance'
      },
      {
        stats: { mean: 0.8, variance: 0.01 },
        expected: 'high_load',
        description: 'High activity, low variance'
      },
      {
        stats: { mean: 0.8, variance: 0.16 },
        expected: 'critical',
        description: 'High activity, high variance'
      }
    ];
    
    const results = testCases.map(testCase => {
      const regime = this.driftDetection.determineRegime(testCase.stats);
      return {
        ...testCase,
        actual: regime,
        correct: regime === testCase.expected
      };
    });
    
    const passed = results.every(r => r.correct);
    
    console.log(`  ✅ Regime determination: ${passed ? 'PASSED' : 'FAILED'}`);
    results.forEach(r => {
      const symbol = r.correct ? '✓' : '✗';
      console.log(`  ${symbol} ${r.description}: ${r.actual} (expected: ${r.expected})`);
    });
    
    this.results.push({
      test: 'Regime Determination',
      passed,
      results
    });
  }
  
  /**
   * Test 7: Drift Detection Integration
   */
  async testDriftDetection() {
    console.log('\nTest 7: Drift Detection Integration');
    
    const lawId = 'drift_test';
    this.driftDetection.initializeLaw(lawId);
    this.driftDetection.settings.minWindowSize = 10;
    this.driftDetection.settings.checkInterval = 5;
    
    // Track regime changes
    const regimeChanges = [];
    this.driftDetection.onRegimeChange = (id, oldR, newR) => {
      regimeChanges.push({ id, oldR, newR, time: Date.now() });
    };
    
    // Simulate normal operation
    for (let i = 0; i < 15; i++) {
      this.driftDetection.recordEvent(lawId, Math.random() * 0.3 + 0.4);
    }
    
    // Simulate drift to high load
    for (let i = 0; i < 15; i++) {
      this.driftDetection.recordEvent(lawId, Math.random() * 0.2 + 0.8);
    }
    
    const driftDetected = regimeChanges.length > 0;
    const correctTransition = regimeChanges.some(c => 
      c.oldR === 'normal' && (c.newR === 'high_load' || c.newR === 'critical')
    );
    
    const passed = driftDetected && correctTransition;
    
    console.log(`  ✅ Drift detection: ${passed ? 'PASSED' : 'FAILED'}`);
    console.log(`  📊 Regime changes detected: ${regimeChanges.length}`);
    if (regimeChanges.length > 0) {
      console.log(`  📊 Transitions: ${regimeChanges.map(c => 
        `${c.oldR}→${c.newR}`).join(', ')}`);
    }
    
    this.results.push({
      test: 'Drift Detection',
      passed,
      regimeChanges: regimeChanges.length,
      transitions: regimeChanges
    });
  }
  
  /**
   * Test 8: Regime Transitions and Parameters
   */
  async testRegimeTransitions() {
    console.log('\nTest 8: Regime Transitions and Parameters');
    
    const lawId = 'transition_test';
    this.driftDetection.initializeLaw(lawId, 'normal');
    
    // Get initial parameters
    const normalParams = this.driftDetection.getRegimeParameters(lawId);
    
    // Force transition to high_load
    this.driftDetection.transitionToRegime(lawId, 'high_load', {
      statistics: { mean: 0.8, variance: 0.1 }
    });
    
    const highLoadParams = this.driftDetection.getRegimeParameters(lawId);
    
    // Check parameter changes
    const rhythmChanged = highLoadParams.rhythmMultiplier > normalParams.rhythmMultiplier;
    const evolutionChanged = highLoadParams.evolutionThreshold < normalParams.evolutionThreshold;
    const recoveryChanged = highLoadParams.recoveryBoost < normalParams.recoveryBoost;
    
    const passed = rhythmChanged && evolutionChanged && recoveryChanged;
    
    console.log(`  ✅ Regime parameters: ${passed ? 'PASSED' : 'FAILED'}`);
    console.log(`  📊 Normal rhythm multiplier: ${normalParams.rhythmMultiplier}`);
    console.log(`  📊 High-load rhythm multiplier: ${highLoadParams.rhythmMultiplier}`);
    console.log(`  📊 Evolution threshold: ${normalParams.evolutionThreshold} → ${highLoadParams.evolutionThreshold}`);
    console.log(`  📊 Recovery boost: ${normalParams.recoveryBoost} → ${highLoadParams.recoveryBoost}`);
    
    // Test regime status
    const status = this.driftDetection.getRegimeStatus();
    const hasStatus = status[lawId] && status[lawId].currentRegime === 'high_load';
    
    console.log(`  📊 Regime status tracking: ${hasStatus ? 'Working' : 'Failed'}`);
    
    this.results.push({
      test: 'Regime Transitions',
      passed: passed && hasStatus,
      normalParams,
      highLoadParams
    });
  }
  
  /**
   * Print test summary
   */
  printSummary() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(50));
    
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const successRate = (passedTests / totalTests * 100).toFixed(1);
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${totalTests - passedTests}`);
    console.log(`Success Rate: ${successRate}%`);
    
    if (passedTests === totalTests) {
      console.log('\n✅ All tests passed! Drift detection system is working correctly.');
    } else {
      console.log('\n❌ Some tests failed. Review the results above.');
      console.log('Failed tests:');
      this.results
        .filter(r => !r.passed)
        .forEach(r => console.log(`  - ${r.test}`));
    }
    
    console.log('='.repeat(50));
  }
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new RegimeDriftDetectionTests();
  tester.runAllTests();
}