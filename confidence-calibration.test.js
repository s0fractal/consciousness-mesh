/**
 * Unit tests for confidence calibration system
 * Verifies that empirical accuracy converges to nominal confidence
 */

import { ConfidenceCalibration } from './confidence-calibration.js';

// Test utilities
class TestHelpers {
  /**
   * Generate predictions with known accuracy
   */
  static generatePredictions(trueAccuracy, numSamples) {
    const predictions = [];
    
    for (let i = 0; i < numSamples; i++) {
      const willBeCorrect = Math.random() < trueAccuracy;
      
      predictions.push({
        predicted: willBeCorrect ? 'A' : 'B',
        actual: 'A',
        expected: willBeCorrect
      });
    }
    
    return predictions;
  }
  
  /**
   * Simulate beta-binomial process
   */
  static simulateBetaBinomial(alpha, beta, numTrials) {
    // Sample true probability from beta distribution
    const trueProbability = this.sampleBeta(alpha, beta);
    
    // Generate binomial outcomes
    let successes = 0;
    for (let i = 0; i < numTrials; i++) {
      if (Math.random() < trueProbability) {
        successes++;
      }
    }
    
    return {
      trueProbability,
      successes,
      failures: numTrials - successes,
      empiricalProbability: successes / numTrials
    };
  }
  
  /**
   * Sample from beta distribution (Box-Muller for approximation)
   */
  static sampleBeta(alpha, beta) {
    // For testing, use mean as approximation
    // In production, use proper beta sampling
    return alpha / (alpha + beta);
  }
  
  /**
   * Calculate KL divergence between two beta distributions
   */
  static klDivergenceBeta(alpha1, beta1, alpha2, beta2) {
    const digamma = (x) => Math.log(x) - 1/(2*x); // Approximation
    
    return (alpha1 - alpha2) * digamma(alpha1) +
           (beta1 - beta2) * digamma(beta1) +
           (alpha2 - alpha1 + beta2 - beta1) * digamma(alpha1 + beta1) +
           Math.log(this.betaFunction(alpha2, beta2) / this.betaFunction(alpha1, beta1));
  }
  
  static betaFunction(alpha, beta) {
    // Approximation for testing
    return Math.exp(this.logGamma(alpha) + this.logGamma(beta) - this.logGamma(alpha + beta));
  }
  
  static logGamma(x) {
    // Stirling's approximation
    return (x - 0.5) * Math.log(x) - x + 0.5 * Math.log(2 * Math.PI);
  }
}

// Test suite
export class ConfidenceCalibrationTests {
  constructor() {
    this.calibration = new ConfidenceCalibration();
    this.results = [];
  }
  
  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🧪 Running Confidence Calibration Tests...\n');
    
    await this.testBetaInitialization();
    await this.testBetaUpdates();
    await this.testConvergence();
    await this.testCalibrationMetrics();
    await this.testMultipleLaws();
    await this.testDecayMechanism();
    await this.testEdgeCases();
    
    this.printSummary();
    return this.results;
  }
  
  /**
   * Test 1: Beta parameter initialization
   */
  async testBetaInitialization() {
    console.log('Test 1: Beta Parameter Initialization');
    
    const testCases = [
      { confidence: 0.5, expected: { alpha: 6, beta: 6 } },
      { confidence: 0.8, expected: { alpha: 9, beta: 3 } },
      { confidence: 0.2, expected: { alpha: 3, beta: 9 } }
    ];
    
    const results = testCases.map(test => {
      this.calibration.initializeLaw(`test_${test.confidence}`, test.confidence);
      const params = this.calibration.betaParams.get(`test_${test.confidence}`);
      
      const alphaCorrect = Math.abs(params.alpha - test.expected.alpha) < 0.1;
      const betaCorrect = Math.abs(params.beta - test.expected.beta) < 0.1;
      
      return {
        confidence: test.confidence,
        pass: alphaCorrect && betaCorrect,
        alpha: params.alpha,
        beta: params.beta
      };
    });
    
    const allPassed = results.every(r => r.pass);
    console.log(`  ✅ Initialization: ${allPassed ? 'PASSED' : 'FAILED'}`);
    console.log(`  📊 Results:`, results);
    
    this.results.push({
      test: 'Beta Initialization',
      passed: allPassed,
      details: results
    });
  }
  
  /**
   * Test 2: Beta updates with hits and misses
   */
  async testBetaUpdates() {
    console.log('\nTest 2: Beta Parameter Updates');
    
    const lawId = 'test_updates';
    this.calibration.initializeLaw(lawId, 0.7);
    
    // Simulate predictions
    const scenarios = [
      { predicted: 0.8, actual: 0.82, shouldHit: true },
      { predicted: 0.8, actual: 0.6, shouldHit: false },
      { predicted: 'sunny', actual: 'sunny', shouldHit: true },
      { predicted: 'rainy', actual: 'sunny', shouldHit: false }
    ];
    
    let hits = 0;
    scenarios.forEach(scenario => {
      const result = this.calibration.updateBetaParameters(
        lawId, 
        scenario.predicted, 
        scenario.actual
      );
      
      if (scenario.shouldHit) hits++;
      
      console.log(`  📍 Prediction: ${scenario.predicted} vs ${scenario.actual}`);
      console.log(`  📈 New confidence: ${result.confidence.toFixed(3)}`);
    });
    
    const finalParams = this.calibration.betaParams.get(lawId);
    const expectedHitRate = hits / scenarios.length;
    const actualConfidence = this.calibration.getCalibratredConfidence(lawId).confidence;
    
    const convergenceGood = Math.abs(actualConfidence - expectedHitRate) < 0.2;
    
    console.log(`  ✅ Update mechanism: ${convergenceGood ? 'PASSED' : 'FAILED'}`);
    console.log(`  📊 Final state: α=${finalParams.alpha.toFixed(2)}, β=${finalParams.beta.toFixed(2)}`);
    
    this.results.push({
      test: 'Beta Updates',
      passed: convergenceGood,
      expectedHitRate,
      actualConfidence
    });
  }
  
  /**
   * Test 3: Convergence to true probability
   */
  async testConvergence() {
    console.log('\nTest 3: Convergence to True Probability');
    
    const trueProbabilities = [0.3, 0.5, 0.7, 0.9];
    const numSamples = 1000;
    const results = [];
    
    for (const trueProb of trueProbabilities) {
      const lawId = `convergence_${trueProb}`;
      this.calibration.initializeLaw(lawId, 0.5); // Start with uninformed prior
      
      // Generate samples
      let hits = 0;
      for (let i = 0; i < numSamples; i++) {
        const hit = Math.random() < trueProb;
        const predicted = hit ? 1 : 0;
        const actual = 1;
        
        this.calibration.updateBetaParameters(lawId, predicted, actual);
        if (hit) hits++;
        
        // Check convergence periodically
        if ((i + 1) % 100 === 0) {
          const current = this.calibration.getCalibratredConfidence(lawId);
          const empirical = hits / (i + 1);
          
          if (i === numSamples - 1) {
            results.push({
              trueProb,
              samples: i + 1,
              empirical,
              estimated: current.confidence,
              error: Math.abs(current.confidence - trueProb),
              uncertainty: current.uncertainty
            });
          }
        }
      }
    }
    
    const avgError = results.reduce((sum, r) => sum + r.error, 0) / results.length;
    const maxError = Math.max(...results.map(r => r.error));
    const converged = maxError < 0.05; // Within 5% of true probability
    
    console.log(`  ✅ Convergence: ${converged ? 'PASSED' : 'FAILED'}`);
    console.log(`  📊 Average error: ${(avgError * 100).toFixed(2)}%`);
    console.log(`  📊 Max error: ${(maxError * 100).toFixed(2)}%`);
    console.table(results);
    
    this.results.push({
      test: 'Convergence',
      passed: converged,
      avgError,
      maxError,
      details: results
    });
  }
  
  /**
   * Test 4: Calibration metrics
   */
  async testCalibrationMetrics() {
    console.log('\nTest 4: Calibration Metrics');
    
    const lawId = 'calibration_test';
    this.calibration.initializeLaw(lawId, 0.7);
    
    // Generate predictions at different confidence levels
    const confidenceLevels = [0.6, 0.7, 0.8, 0.9];
    
    confidenceLevels.forEach(targetConfidence => {
      const numPredictions = 50;
      
      for (let i = 0; i < numPredictions; i++) {
        // Simulate predictions that match the target confidence
        const hit = Math.random() < targetConfidence;
        const predicted = { type: 'test', value: targetConfidence };
        const actual = { type: 'test', value: hit ? targetConfidence : 0 };
        
        // Temporarily set confidence to target
        const params = this.calibration.betaParams.get(lawId);
        const total = params.alpha + params.beta;
        params.alpha = targetConfidence * total;
        params.beta = (1 - targetConfidence) * total;
        
        this.calibration.updateBetaParameters(lawId, hit, hit);
      }
    });
    
    const metrics = this.calibration.getCalibrationMetrics(lawId);
    
    console.log(`  ✅ Calibration analysis: ${metrics.calibrated ? 'COMPLETE' : 'INSUFFICIENT DATA'}`);
    if (metrics.calibrated) {
      console.log(`  📊 ECE (Expected Calibration Error): ${(metrics.ece * 100).toFixed(2)}%`);
      console.log(`  📊 Brier Score: ${metrics.brierScore.toFixed(3)}`);
      console.log(`  📊 Well calibrated: ${metrics.wellCalibrated ? 'YES' : 'NO'}`);
      console.log(`  📊 Calibration buckets:`);
      console.table(metrics.calibration);
    }
    
    this.results.push({
      test: 'Calibration Metrics',
      passed: metrics.calibrated && metrics.ece < 0.15,
      ece: metrics.ece,
      brierScore: metrics.brierScore
    });
  }
  
  /**
   * Test 5: Multiple laws independence
   */
  async testMultipleLaws() {
    console.log('\nTest 5: Multiple Laws Independence');
    
    const laws = [
      { id: 'law1', trueProb: 0.8 },
      { id: 'law2', trueProb: 0.3 },
      { id: 'law3', trueProb: 0.6 }
    ];
    
    // Initialize all laws
    laws.forEach(law => {
      this.calibration.initializeLaw(law.id, 0.5);
    });
    
    // Update each law independently
    const numUpdates = 200;
    laws.forEach(law => {
      for (let i = 0; i < numUpdates; i++) {
        const hit = Math.random() < law.trueProb;
        this.calibration.updateBetaParameters(law.id, hit, hit);
      }
    });
    
    // Check independence
    const confidences = laws.map(law => ({
      id: law.id,
      trueProb: law.trueProb,
      estimated: this.calibration.getCalibratredConfidence(law.id).confidence,
      error: Math.abs(
        this.calibration.getCalibratredConfidence(law.id).confidence - law.trueProb
      )
    }));
    
    const allIndependent = confidences.every(c => c.error < 0.1);
    
    console.log(`  ✅ Independence: ${allIndependent ? 'PASSED' : 'FAILED'}`);
    console.table(confidences);
    
    this.results.push({
      test: 'Multiple Laws',
      passed: allIndependent,
      laws: confidences
    });
  }
  
  /**
   * Test 6: Decay mechanism
   */
  async testDecayMechanism() {
    console.log('\nTest 6: Decay Mechanism');
    
    const lawId = 'decay_test';
    this.calibration.initializeLaw(lawId, 0.8);
    
    // Set initial strong belief
    const params = this.calibration.betaParams.get(lawId);
    params.alpha = 80;
    params.beta = 20;
    
    const initialConfidence = this.calibration.getCalibratredConfidence(lawId).confidence;
    
    // Apply many contradicting updates
    for (let i = 0; i < 50; i++) {
      this.calibration.updateBetaParameters(lawId, false, false);
    }
    
    const finalConfidence = this.calibration.getCalibratredConfidence(lawId).confidence;
    const adapted = finalConfidence < initialConfidence - 0.2;
    
    console.log(`  ✅ Decay adaptation: ${adapted ? 'PASSED' : 'FAILED'}`);
    console.log(`  📊 Initial confidence: ${initialConfidence.toFixed(3)}`);
    console.log(`  📊 Final confidence: ${finalConfidence.toFixed(3)}`);
    console.log(`  📊 Change: ${(initialConfidence - finalConfidence).toFixed(3)}`);
    
    this.results.push({
      test: 'Decay Mechanism',
      passed: adapted,
      initialConfidence,
      finalConfidence
    });
  }
  
  /**
   * Test 7: Edge cases
   */
  async testEdgeCases() {
    console.log('\nTest 7: Edge Cases');
    
    const edgeCases = [];
    
    // Test 1: No predictions
    const emptyLaw = 'empty_law';
    this.calibration.initializeLaw(emptyLaw);
    const emptyMetrics = this.calibration.getCalibrationMetrics(emptyLaw);
    edgeCases.push({
      case: 'No predictions',
      passed: !emptyMetrics.calibrated,
      details: emptyMetrics.message
    });
    
    // Test 2: All hits
    const perfectLaw = 'perfect_law';
    this.calibration.initializeLaw(perfectLaw);
    for (let i = 0; i < 20; i++) {
      this.calibration.updateBetaParameters(perfectLaw, 1, 1); // predict 1, actual 1
    }
    const perfectConf = this.calibration.getCalibratredConfidence(perfectLaw);
    edgeCases.push({
      case: 'All hits',
      passed: perfectConf.confidence > 0.9,
      confidence: perfectConf.confidence
    });
    
    // Test 3: All misses
    const terribleLaw = 'terrible_law';
    this.calibration.initializeLaw(terribleLaw);
    for (let i = 0; i < 20; i++) {
      this.calibration.updateBetaParameters(terribleLaw, 0, 1); // predict 0, actual 1 = miss
    }
    const terribleConf = this.calibration.getCalibratredConfidence(terribleLaw);
    edgeCases.push({
      case: 'All misses',
      passed: terribleConf.confidence < 0.1,
      confidence: terribleConf.confidence
    });
    
    // Test 4: Complex predictions
    const complexLaw = 'complex_law';
    this.calibration.initializeLaw(complexLaw);
    const complexPred = {
      type: 'coherence',
      predicted: 0.75,
      confidence: 0.8
    };
    const complexActual = {
      coherence: 0.73
    };
    this.calibration.updateBetaParameters(complexLaw, complexPred, complexActual);
    edgeCases.push({
      case: 'Complex predictions',
      passed: this.calibration.betaParams.get(complexLaw).predictions === 1,
      details: 'Handled complex prediction type'
    });
    
    const allPassed = edgeCases.every(e => e.passed);
    
    console.log(`  ✅ Edge cases: ${allPassed ? 'PASSED' : 'FAILED'}`);
    console.table(edgeCases);
    
    this.results.push({
      test: 'Edge Cases',
      passed: allPassed,
      cases: edgeCases
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
      console.log('\n✅ All tests passed! Calibration system is working correctly.');
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
  const tester = new ConfidenceCalibrationTests();
  tester.runAllTests();
}