/**
 * Tests for Intervention Guardrails System
 * Ensures intervention events don't affect automatic learning
 */

import { HypothesisLifecycle } from './hypothesis-lifecycle.js';

function runInterventionTests() {
  console.log('🛡️ Running Intervention Guardrails Tests...\n');
  
  const testSuite = {
    passed: 0,
    failed: 0
  };
  
  function runTest(name, testFn) {
    try {
      testFn();
      console.log(`✅ ${name}`);
      testSuite.passed++;
      return true;
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
      testSuite.failed++;
      return false;
    }
  }
  
  try {
    // Test 1: Evidence record contains intervention field
    console.log('1️⃣ Testing intervention field in Evidence record...');
    runTest('Evidence record includes intervention field', () => {
      const lifecycle = new HypothesisLifecycle();
      
      const hypothesis = lifecycle.createHypothesis({
        description: 'Test hypothesis for intervention',
        proposedBy: 'test-system'
      });
      
      // Add normal evidence
      const normalEvidence = lifecycle.addEvidence(hypothesis.id, {
        type: 'observation',
        description: 'Normal evidence',
        supports: true,
        confidence: 0.8,
        weight: 1.0
      });
      
      // Add intervention evidence
      const interventionEvidence = lifecycle.addEvidence(hypothesis.id, {
        type: 'manual_override',
        description: 'Manual intervention',
        supports: true,
        confidence: 0.9,
        weight: 2.0,
        intervention: true
      });
      
      if (normalEvidence.intervention !== false) {
        throw new Error('Normal evidence should have intervention=false');
      }
      
      if (interventionEvidence.intervention !== true) {
        throw new Error('Intervention evidence should have intervention=true');
      }
    });
    
    // Test 2: Intervention events excluded from automatic learning
    console.log('\n2️⃣ Testing intervention exclusion from learning...');
    runTest('Intervention events do not affect confidence calculation', () => {
      const lifecycle = new HypothesisLifecycle();
      
      const hypothesis = lifecycle.createHypothesis({
        description: 'Test hypothesis for learning isolation',
        proposedBy: 'test-system'
      });
      
      // Add normal supporting evidence
      lifecycle.addEvidence(hypothesis.id, {
        type: 'observation',
        description: 'Strong supporting evidence',
        supports: true,
        confidence: 0.9,
        weight: 1.0
      });
      
      const confidenceAfterNormal = hypothesis.confidence;
      
      // Add intervention contradicting evidence (should not affect confidence)
      lifecycle.addEvidence(hypothesis.id, {
        type: 'manual_override',
        description: 'Intervention contradicting evidence',
        supports: false,
        confidence: 0.9,
        weight: 10.0, // Very high weight
        intervention: true
      });
      
      const confidenceAfterIntervention = hypothesis.confidence;
      
      // Confidence should remain unchanged
      if (Math.abs(confidenceAfterNormal - confidenceAfterIntervention) > 0.001) {
        throw new Error(
          `Intervention evidence affected confidence: ` +
          `${confidenceAfterNormal} -> ${confidenceAfterIntervention}`
        );
      }
    });
    
    runTest('Normal evidence continues to affect confidence', () => {
      const lifecycle = new HypothesisLifecycle();
      
      const hypothesis = lifecycle.createHypothesis({
        description: 'Test hypothesis for normal learning',
        proposedBy: 'test-system'
      });
      
      // Add initial evidence
      lifecycle.addEvidence(hypothesis.id, {
        type: 'observation',
        description: 'Initial evidence',
        supports: true,
        confidence: 0.6,
        weight: 1.0
      });
      
      const initialConfidence = hypothesis.confidence;
      
      // Add intervention evidence (should not affect)
      lifecycle.addEvidence(hypothesis.id, {
        type: 'manual_override',
        description: 'Intervention evidence',
        supports: false,
        confidence: 0.9,
        weight: 5.0,
        intervention: true
      });
      
      const confidenceAfterIntervention = hypothesis.confidence;
      
      // Add more normal evidence (should affect)
      lifecycle.addEvidence(hypothesis.id, {
        type: 'observation',
        description: 'Additional supporting evidence',
        supports: true,
        confidence: 0.8,
        weight: 1.0
      });
      
      const finalConfidence = hypothesis.confidence;
      
      // Intervention should not affect confidence
      if (Math.abs(initialConfidence - confidenceAfterIntervention) > 0.001) {
        throw new Error('Intervention affected confidence');
      }
      
      // Normal evidence should affect confidence
      if (Math.abs(initialConfidence - finalConfidence) < 0.001) {
        throw new Error('Normal evidence did not affect confidence');
      }
    });
    
    // Test 3: All evidence intervention case
    console.log('\n3️⃣ Testing all-intervention evidence scenario...');
    runTest('All intervention evidence results in neutral confidence', () => {
      const lifecycle = new HypothesisLifecycle();
      
      const hypothesis = lifecycle.createHypothesis({
        description: 'Test hypothesis with only interventions',
        proposedBy: 'test-system'
      });
      
      // Add only intervention evidence
      lifecycle.addEvidence(hypothesis.id, {
        type: 'manual_override',
        description: 'Strong supporting intervention',
        supports: true,
        confidence: 0.9,
        weight: 2.0,
        intervention: true
      });
      
      lifecycle.addEvidence(hypothesis.id, {
        type: 'manual_override',
        description: 'Strong contradicting intervention',
        supports: false,
        confidence: 0.9,
        weight: 2.0,
        intervention: true
      });
      
      // Should result in neutral confidence (0.5)
      if (Math.abs(hypothesis.confidence - 0.5) > 0.001) {
        throw new Error(
          `Expected neutral confidence 0.5, got ${hypothesis.confidence}`
        );
      }
    });
    
    // Test 4: Evidence statistics tracking
    console.log('\n4️⃣ Testing evidence statistics...');
    runTest('Evidence statistics correctly track intervention events', () => {
      const lifecycle = new HypothesisLifecycle();
      
      const hypothesis = lifecycle.createHypothesis({
        description: 'Test hypothesis for statistics',
        proposedBy: 'test-system'
      });
      
      // Add 2 normal supporting evidence
      lifecycle.addEvidence(hypothesis.id, {
        type: 'observation',
        description: 'Normal supporting 1',
        supports: true,
        confidence: 0.8
      });
      
      lifecycle.addEvidence(hypothesis.id, {
        type: 'observation',
        description: 'Normal supporting 2',
        supports: true,
        confidence: 0.7
      });
      
      // Add 1 normal contradicting evidence
      lifecycle.addEvidence(hypothesis.id, {
        type: 'observation',
        description: 'Normal contradicting',
        supports: false,
        confidence: 0.6
      });
      
      // Add 2 intervention supporting evidence
      lifecycle.addEvidence(hypothesis.id, {
        type: 'manual_override',
        description: 'Intervention supporting 1',
        supports: true,
        confidence: 0.9,
        intervention: true
      });
      
      lifecycle.addEvidence(hypothesis.id, {
        type: 'manual_override',
        description: 'Intervention supporting 2',
        supports: true,
        confidence: 0.95,
        intervention: true
      });
      
      // Add 1 intervention contradicting evidence
      lifecycle.addEvidence(hypothesis.id, {
        type: 'manual_override',
        description: 'Intervention contradicting',
        supports: false,
        confidence: 0.8,
        intervention: true
      });
      
      const stats = lifecycle.getEvidenceStatistics(hypothesis.id);
      
      const expected = {
        total: 6,
        learning: 3,
        intervention: 3,
        supporting: 2,
        contradicting: 1,
        interventionSupporting: 2,
        interventionContradicting: 1
      };
      
      Object.keys(expected).forEach(key => {
        if (stats[key] !== expected[key]) {
          throw new Error(
            `Expected ${key}=${expected[key]}, got ${stats[key]}`
          );
        }
      });
    });
    
    // Test 5: Parameter invariance test
    console.log('\n5️⃣ Testing parameter invariance...');
    runTest('Hypothesis parameters unchanged by intervention evidence', () => {
      const lifecycle = new HypothesisLifecycle();
      
      const hypothesis = lifecycle.createHypothesis({
        description: 'Test hypothesis for parameter invariance',
        proposedBy: 'test-system'
      });
      
      // Add normal evidence to establish baseline
      lifecycle.addEvidence(hypothesis.id, {
        type: 'observation',
        description: 'Baseline evidence',
        supports: true,
        confidence: 0.7,
        weight: 1.0
      });
      
      // Capture state after normal evidence
      const baselineState = {
        confidence: hypothesis.confidence,
        status: hypothesis.status,
        evidenceCount: hypothesis.evidence.length,
        totalEvidence: hypothesis.metadata.totalEvidence,
        supportingEvidence: hypothesis.metadata.supportingEvidence,
        contradictingEvidence: hypothesis.metadata.contradictingEvidence
      };
      
      // Add intervention evidence
      lifecycle.addEvidence(hypothesis.id, {
        type: 'manual_override',
        description: 'Strong intervention',
        supports: false,
        confidence: 0.9,
        weight: 10.0, // Very high weight
        intervention: true
      });
      
      // Capture state after intervention
      const afterInterventionState = {
        confidence: hypothesis.confidence,
        status: hypothesis.status,
        evidenceCount: hypothesis.evidence.length,
        totalEvidence: hypothesis.metadata.totalEvidence,
        supportingEvidence: hypothesis.metadata.supportingEvidence,
        contradictingEvidence: hypothesis.metadata.contradictingEvidence
      };
      
      // Confidence should be unchanged
      if (Math.abs(baselineState.confidence - afterInterventionState.confidence) > 0.001) {
        throw new Error(
          `Confidence changed: ${baselineState.confidence} -> ${afterInterventionState.confidence}`
        );
      }
      
      // Status should be unchanged
      if (baselineState.status !== afterInterventionState.status) {
        throw new Error(
          `Status changed: ${baselineState.status} -> ${afterInterventionState.status}`
        );
      }
      
      // Evidence count should increase (intervention evidence is stored)
      if (afterInterventionState.evidenceCount !== baselineState.evidenceCount + 1) {
        throw new Error('Intervention evidence not stored');
      }
      
      // Total evidence metadata should increase
      if (afterInterventionState.totalEvidence !== baselineState.totalEvidence + 1) {
        throw new Error('Total evidence metadata not updated');
      }
      
      // Supporting/contradicting counts should remain same (intervention excluded)
      if (afterInterventionState.supportingEvidence !== baselineState.supportingEvidence ||
          afterInterventionState.contradictingEvidence !== baselineState.contradictingEvidence) {
        throw new Error('Supporting/contradicting evidence counts affected by intervention');
      }
    });
    
    // Test 6: Mixed evidence learning
    console.log('\n6️⃣ Testing mixed evidence learning...');
    runTest('Mixed normal and intervention evidence processes correctly', () => {
      const lifecycle = new HypothesisLifecycle();
      
      const hypothesis = lifecycle.createHypothesis({
        description: 'Test hypothesis for mixed evidence',
        proposedBy: 'test-system'
      });
      
      // Add sequence: normal -> intervention -> normal
      lifecycle.addEvidence(hypothesis.id, {
        type: 'observation',
        description: 'Normal evidence 1',
        supports: true,
        confidence: 0.6,
        weight: 1.0
      });
      
      const confidenceAfterFirst = hypothesis.confidence;
      
      lifecycle.addEvidence(hypothesis.id, {
        type: 'manual_override',
        description: 'Intervention override',
        supports: false,
        confidence: 0.9,
        weight: 3.0,
        intervention: true
      });
      
      const confidenceAfterIntervention = hypothesis.confidence;
      
      lifecycle.addEvidence(hypothesis.id, {
        type: 'observation',
        description: 'Normal evidence 2',
        supports: true,
        confidence: 0.8,
        weight: 1.0
      });
      
      const confidenceAfterSecond = hypothesis.confidence;
      
      // Intervention should not change confidence
      if (Math.abs(confidenceAfterFirst - confidenceAfterIntervention) > 0.001) {
        throw new Error('Intervention changed confidence');
      }
      
      // Second normal evidence should change confidence
      if (Math.abs(confidenceAfterIntervention - confidenceAfterSecond) < 0.001) {
        throw new Error('Second normal evidence did not change confidence');
      }
      
      // Final confidence should be higher (two supporting evidence)
      if (confidenceAfterSecond <= confidenceAfterFirst) {
        throw new Error('Confidence did not increase with additional supporting evidence');
      }
    });
    
    // Test 7: Error handling
    console.log('\n7️⃣ Testing error handling...');
    runTest('Statistics method handles invalid hypothesis ID', () => {
      const lifecycle = new HypothesisLifecycle();
      
      try {
        lifecycle.getEvidenceStatistics('non-existent-id');
        throw new Error('Should have thrown error for invalid ID');
      } catch (error) {
        if (!error.message.includes('not found')) {
          throw new Error(`Unexpected error message: ${error.message}`);
        }
      }
    });
    
    console.log(`\n📊 Test Results: ${testSuite.passed}/${testSuite.passed + testSuite.failed} tests passed`);
    
    if (testSuite.failed === 0) {
      console.log('🎉 All intervention guardrails tests passed!');
      console.log('✨ System properly excludes intervention events from automatic learning');
    } else {
      console.log(`⚠️ ${testSuite.failed} test(s) failed`);
    }
    
    return testSuite.failed === 0;
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    console.error(error.stack);
    return false;
  }
}

// Export for use in other modules
export { runInterventionTests };

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runInterventionTests();
}