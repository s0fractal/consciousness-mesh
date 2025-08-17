#!/usr/bin/env node

/**
 * Run confidence calibration tests
 * Verifies that the Beta distribution calibration works correctly
 */

import { ConfidenceCalibrationTests } from './confidence-calibration.test.js';

console.log(`
╔════════════════════════════════════════════════╗
║     Confidence Calibration Test Suite          ║
║     Beta Distribution Implementation           ║
╚════════════════════════════════════════════════╝
`);

async function runTests() {
  const tester = new ConfidenceCalibrationTests();
  const results = await tester.runAllTests();
  
  // Additional analysis
  console.log('\n📈 CONVERGENCE ANALYSIS');
  console.log('=' * 50);
  
  const convergenceTest = results.find(r => r.test === 'Convergence');
  if (convergenceTest && convergenceTest.details) {
    console.log('\nHow well does empirical accuracy match nominal confidence?');
    
    convergenceTest.details.forEach(detail => {
      const symbol = detail.error < 0.05 ? '✅' : '⚠️';
      console.log(`${symbol} True: ${detail.trueProb} → Estimated: ${detail.estimated.toFixed(3)} (Error: ${(detail.error * 100).toFixed(1)}%)`);
    });
    
    console.log(`\nConclusion: ${convergenceTest.passed ? 
      'Beta calibration successfully converges to true probabilities! ✨' : 
      'Calibration needs adjustment - errors exceed threshold.'}`);
  }
  
  // Performance metrics
  console.log('\n⚡ PERFORMANCE METRICS');
  console.log('=' * 50);
  
  const calibrationTest = results.find(r => r.test === 'Calibration Metrics');
  if (calibrationTest) {
    console.log(`Expected Calibration Error (ECE): ${(calibrationTest.ece * 100).toFixed(2)}%`);
    console.log(`Brier Score: ${calibrationTest.brierScore?.toFixed(3) || 'N/A'}`);
    console.log(`Recommendation: ${calibrationTest.ece < 0.1 ? 
      'System is well-calibrated for production use! 🎯' : 
      'Consider tuning smoothing factor or decay rate.'}`);
  }
  
  return results;
}

// Run the tests
runTests().catch(console.error);