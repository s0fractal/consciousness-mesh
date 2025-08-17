/**
 * Tests for Hypothesis Lifecycle Management System
 */

import { HypothesisLifecycle } from './hypothesis-lifecycle.js';

export class HypothesisLifecycleTests {
  constructor() {
    this.lifecycle = new HypothesisLifecycle();
    this.results = [];
  }
  
  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🧪 Running Hypothesis Lifecycle Tests...\n');
    
    await this.testHypothesisCreation();
    await this.testStatusTransitions();
    await this.testEvidenceManagement();
    await this.testConfidenceCalculation();
    await this.testAutoTransitions();
    await this.testInboxFunctionality();
    await this.testStaleDetection();
    await this.testEventEmission();
    
    this.printSummary();
    return this.results;
  }
  
  /**
   * Test 1: Hypothesis Creation
   */
  async testHypothesisCreation() {
    console.log('Test 1: Hypothesis Creation');
    
    const hypothesisData = {
      title: 'Temporal Resonance Amplification',
      description: 'System activity increases with temporal velocity squared',
      proposedBy: 'test_system',
      relatedLaws: ['rhythmic-resonance'],
      tags: ['temporal', 'resonance'],
      priority: 'high'
    };
    
    const hypothesis = this.lifecycle.createHypothesis(hypothesisData);
    
    const checks = {
      hasId: !!hypothesis.id && hypothesis.id.startsWith('hyp_'),
      correctTitle: hypothesis.title === hypothesisData.title,
      correctStatus: hypothesis.status === 'proposed',
      hasMetadata: !!hypothesis.metadata && hypothesis.metadata.created > 0,
      correctPriority: hypothesis.priority === 'high',
      emptyEvidence: hypothesis.evidence.length === 0,
      zeroConfidence: hypothesis.confidence === 0
    };
    
    const passed = Object.values(checks).every(v => v);
    
    console.log(`  ✅ Creation: ${passed ? 'PASSED' : 'FAILED'}`);
    console.log(`  📊 Created hypothesis: ${hypothesis.id}`);
    console.log(`  📊 Initial status: ${hypothesis.status}`);
    
    this.results.push({
      test: 'Hypothesis Creation',
      passed,
      checks
    });
  }
  
  /**
   * Test 2: Status Transitions
   */
  async testStatusTransitions() {
    console.log('\nTest 2: Status Transitions');
    
    const hypothesis = this.lifecycle.createHypothesis({
      title: 'Test Hypothesis',
      description: 'Testing status transitions'
    });
    
    const transitions = [];
    
    // Valid transition: proposed → gathering
    try {
      this.lifecycle.transitionStatus(hypothesis.id, 'gathering', 'Starting investigation');
      transitions.push({ from: 'proposed', to: 'gathering', valid: true });
    } catch (err) {
      transitions.push({ from: 'proposed', to: 'gathering', valid: false, error: err.message });
    }
    
    // Valid transition: gathering → supported
    try {
      this.lifecycle.transitionStatus(hypothesis.id, 'supported', 'Evidence confirmed');
      transitions.push({ from: 'gathering', to: 'supported', valid: true });
    } catch (err) {
      transitions.push({ from: 'gathering', to: 'supported', valid: false, error: err.message });
    }
    
    // Invalid transition: supported → gathering
    try {
      this.lifecycle.transitionStatus(hypothesis.id, 'gathering', 'Invalid attempt');
      transitions.push({ from: 'supported', to: 'gathering', valid: false });
    } catch (err) {
      transitions.push({ from: 'supported', to: 'gathering', valid: true, caught: true });
    }
    
    // Valid transition: supported → archived
    try {
      this.lifecycle.transitionStatus(hypothesis.id, 'archived', 'Completed');
      transitions.push({ from: 'supported', to: 'archived', valid: true });
    } catch (err) {
      transitions.push({ from: 'supported', to: 'archived', valid: false, error: err.message });
    }
    
    const validTransitions = transitions.filter(t => t.valid).length;
    const invalidCaught = transitions.filter(t => t.caught).length;
    const passed = validTransitions === 3 && invalidCaught === 1;
    
    console.log(`  ✅ Transitions: ${passed ? 'PASSED' : 'FAILED'}`);
    console.log(`  📊 Valid transitions: ${validTransitions}/3`);
    console.log(`  📊 Invalid transitions caught: ${invalidCaught}/1`);
    console.log(`  📊 Final status: ${hypothesis.status}`);
    
    this.results.push({
      test: 'Status Transitions',
      passed,
      transitions
    });
  }
  
  /**
   * Test 3: Evidence Management
   */
  async testEvidenceManagement() {
    console.log('\nTest 3: Evidence Management');
    
    const hypothesis = this.lifecycle.createHypothesis({
      title: 'Evidence Test',
      description: 'Testing evidence collection'
    });
    
    // Add supporting evidence
    const evidence1 = this.lifecycle.addEvidence(hypothesis.id, {
      type: 'experimental',
      source: 'rhythm_test',
      description: 'Positive correlation observed',
      supports: true,
      confidence: 0.8,
      weight: 1.5
    });
    
    // Add contradicting evidence
    const evidence2 = this.lifecycle.addEvidence(hypothesis.id, {
      type: 'observation',
      source: 'disruption_test',
      description: 'Pattern breaks under stress',
      supports: false,
      confidence: 0.6,
      weight: 1.0
    });
    
    // Add neutral evidence
    const evidence3 = this.lifecycle.addEvidence(hypothesis.id, {
      type: 'theoretical',
      source: 'analysis',
      description: 'Mathematical model predicts behavior',
      supports: true,
      confidence: 0.7,
      weight: 0.8
    });
    
    const updatedHypothesis = this.lifecycle.hypotheses.get(hypothesis.id);
    
    const checks = {
      evidenceCount: updatedHypothesis.evidence.length === 3,
      supportingCount: updatedHypothesis.metadata.supportingEvidence === 2,
      contradictingCount: updatedHypothesis.metadata.contradictingEvidence === 1,
      hasIds: updatedHypothesis.evidence.every(e => e.id && e.id.startsWith('ev_')),
      correctTypes: updatedHypothesis.evidence.map(e => e.type).includes('experimental')
    };
    
    const passed = Object.values(checks).every(v => v);
    
    console.log(`  ✅ Evidence management: ${passed ? 'PASSED' : 'FAILED'}`);
    console.log(`  📊 Total evidence: ${updatedHypothesis.evidence.length}`);
    console.log(`  📊 Supporting: ${updatedHypothesis.metadata.supportingEvidence}`);
    console.log(`  📊 Contradicting: ${updatedHypothesis.metadata.contradictingEvidence}`);
    
    this.results.push({
      test: 'Evidence Management',
      passed,
      checks
    });
  }
  
  /**
   * Test 4: Confidence Calculation
   */
  async testConfidenceCalculation() {
    console.log('\nTest 4: Confidence Calculation');
    
    const hypothesis = this.lifecycle.createHypothesis({
      title: 'Confidence Test',
      description: 'Testing confidence calculation'
    });
    
    // Add balanced evidence
    this.lifecycle.addEvidence(hypothesis.id, {
      supports: true,
      confidence: 0.9,
      weight: 2.0
    });
    
    this.lifecycle.addEvidence(hypothesis.id, {
      supports: false,
      confidence: 0.7,
      weight: 1.0
    });
    
    this.lifecycle.addEvidence(hypothesis.id, {
      supports: true,
      confidence: 0.6,
      weight: 1.5
    });
    
    const confidence = hypothesis.confidence;
    
    // Calculate expected confidence manually
    // Weighted sum: (2.0 * 0.9 * 1) + (1.0 * 0.7 * -1) + (1.5 * 0.6 * 1) = 1.8 - 0.7 + 0.9 = 2.0
    // Total weight: 2.0 + 1.0 + 1.5 = 4.5
    // Raw: 2.0 / 4.5 = 0.444...
    // Normalized: (0.444 + 1) / 2 = 0.722
    
    const expectedConfidence = 0.722;
    const confidenceError = Math.abs(confidence - expectedConfidence);
    
    const checks = {
      inRange: confidence >= 0 && confidence <= 1,
      correctCalculation: confidenceError < 0.01,
      increasedFromZero: confidence > 0
    };
    
    const passed = Object.values(checks).every(v => v);
    
    console.log(`  ✅ Confidence calculation: ${passed ? 'PASSED' : 'FAILED'}`);
    console.log(`  📊 Calculated confidence: ${confidence.toFixed(3)}`);
    console.log(`  📊 Expected confidence: ${expectedConfidence.toFixed(3)}`);
    console.log(`  📊 Error: ${confidenceError.toFixed(4)}`);
    
    this.results.push({
      test: 'Confidence Calculation',
      passed,
      confidence,
      expectedConfidence
    });
  }
  
  /**
   * Test 5: Auto Transitions
   */
  async testAutoTransitions() {
    console.log('\nTest 5: Auto Transitions');
    
    // Test auto-transition to supported
    const hypothesis1 = this.lifecycle.createHypothesis({
      title: 'Auto Support Test',
      description: 'Should auto-transition to supported'
    });
    
    this.lifecycle.transitionStatus(hypothesis1.id, 'gathering');
    
    // Add enough strong evidence
    for (let i = 0; i < 6; i++) {
      this.lifecycle.addEvidence(hypothesis1.id, {
        supports: true,
        confidence: 0.85,
        weight: 1.0
      });
    }
    
    // Test auto-transition to weak
    const hypothesis2 = this.lifecycle.createHypothesis({
      title: 'Auto Weak Test',
      description: 'Should auto-transition to weak'
    });
    
    this.lifecycle.transitionStatus(hypothesis2.id, 'gathering');
    
    // Add enough weak/contradicting evidence
    for (let i = 0; i < 6; i++) {
      this.lifecycle.addEvidence(hypothesis2.id, {
        supports: i % 3 === 0, // Mostly false
        confidence: 0.5,
        weight: 1.0
      });
    }
    
    const checks = {
      autoSupported: hypothesis1.status === 'supported',
      autoWeak: hypothesis2.status === 'weak',
      supportedConfidence: hypothesis1.confidence >= this.lifecycle.thresholds.supportThreshold,
      weakConfidence: hypothesis2.confidence <= this.lifecycle.thresholds.weakThreshold
    };
    
    const passed = Object.values(checks).every(v => v);
    
    console.log(`  ✅ Auto transitions: ${passed ? 'PASSED' : 'FAILED'}`);
    console.log(`  📊 Hypothesis 1 status: ${hypothesis1.status} (confidence: ${hypothesis1.confidence.toFixed(3)})`);
    console.log(`  📊 Hypothesis 2 status: ${hypothesis2.status} (confidence: ${hypothesis2.confidence.toFixed(3)})`);
    
    this.results.push({
      test: 'Auto Transitions',
      passed,
      checks
    });
  }
  
  /**
   * Test 6: Inbox Functionality
   */
  async testInboxFunctionality() {
    console.log('\nTest 6: Inbox Functionality');
    
    // Clear existing hypotheses
    this.lifecycle.hypotheses.clear();
    
    // Create hypotheses with different statuses and priorities
    const h1 = this.lifecycle.createHypothesis({
      title: 'High Priority Proposed',
      description: 'Test',
      priority: 'high'
    });
    
    const h2 = this.lifecycle.createHypothesis({
      title: 'Medium Priority Gathering',
      description: 'Test',
      priority: 'medium'
    });
    this.lifecycle.transitionStatus(h2.id, 'gathering');
    
    const h3 = this.lifecycle.createHypothesis({
      title: 'Low Priority Proposed',
      description: 'Test',
      priority: 'low'
    });
    
    const h4 = this.lifecycle.createHypothesis({
      title: 'Archived Hypothesis',
      description: 'Test',
      priority: 'high'
    });
    this.lifecycle.transitionStatus(h4.id, 'archived');
    
    const inbox = this.lifecycle.getInbox();
    
    const checks = {
      correctCount: inbox.length === 3, // Only proposed and gathering
      excludesArchived: !inbox.some(h => h.status === 'archived'),
      correctOrder: inbox[0].priority === 'high' && inbox[inbox.length - 1].priority === 'low',
      includesProposed: inbox.some(h => h.status === 'proposed'),
      includesGathering: inbox.some(h => h.status === 'gathering')
    };
    
    const passed = Object.values(checks).every(v => v);
    
    console.log(`  ✅ Inbox functionality: ${passed ? 'PASSED' : 'FAILED'}`);
    console.log(`  📊 Inbox size: ${inbox.length}`);
    console.log(`  📊 Priorities: ${inbox.map(h => h.priority).join(', ')}`);
    console.log(`  📊 Statuses: ${inbox.map(h => h.status).join(', ')}`);
    
    this.results.push({
      test: 'Inbox Functionality',
      passed,
      inboxSize: inbox.length
    });
  }
  
  /**
   * Test 7: Stale Detection
   */
  async testStaleDetection() {
    console.log('\nTest 7: Stale Detection');
    
    const hypothesis = this.lifecycle.createHypothesis({
      title: 'Stale Test',
      description: 'Testing stale detection'
    });
    
    // Manually set last activity to 8 days ago
    hypothesis.metadata.lastActivity = Date.now() - (8 * 24 * 60 * 60 * 1000);
    
    const staleHypotheses = this.lifecycle.checkStaleHypotheses();
    
    const checks = {
      detectsStale: staleHypotheses.length === 1,
      correctHypothesis: staleHypotheses[0]?.hypothesis.id === hypothesis.id,
      correctDays: staleHypotheses[0]?.daysSinceActivity === 8
    };
    
    const passed = Object.values(checks).every(v => v);
    
    console.log(`  ✅ Stale detection: ${passed ? 'PASSED' : 'FAILED'}`);
    console.log(`  📊 Stale hypotheses found: ${staleHypotheses.length}`);
    if (staleHypotheses.length > 0) {
      console.log(`  📊 Days since activity: ${staleHypotheses[0].daysSinceActivity}`);
    }
    
    this.results.push({
      test: 'Stale Detection',
      passed,
      staleCount: staleHypotheses.length
    });
  }
  
  /**
   * Test 8: Event Emission
   */
  async testEventEmission() {
    console.log('\nTest 8: Event Emission');
    
    const events = {
      created: [],
      statusChanged: [],
      evidenceAdded: [],
      archived: []
    };
    
    // Subscribe to events
    this.lifecycle.on('onHypothesisCreated', (data) => {
      events.created.push(data);
    });
    
    this.lifecycle.on('onStatusChange', (data) => {
      events.statusChanged.push(data);
    });
    
    this.lifecycle.on('onEvidenceAdded', (data) => {
      events.evidenceAdded.push(data);
    });
    
    this.lifecycle.on('onHypothesisArchived', (data) => {
      events.archived.push(data);
    });
    
    // Trigger events
    const hypothesis = this.lifecycle.createHypothesis({
      title: 'Event Test',
      description: 'Testing event emission'
    });
    
    this.lifecycle.transitionStatus(hypothesis.id, 'gathering');
    
    this.lifecycle.addEvidence(hypothesis.id, {
      supports: true,
      confidence: 0.7
    });
    
    const checks = {
      createdEvent: events.created.length === 1,
      statusChangeEvent: events.statusChanged.length === 1,
      evidenceEvent: events.evidenceAdded.length === 1,
      correctCreatedData: events.created[0]?.id === hypothesis.id,
      correctStatusData: events.statusChanged[0]?.newStatus === 'gathering'
    };
    
    const passed = Object.values(checks).every(v => v);
    
    console.log(`  ✅ Event emission: ${passed ? 'PASSED' : 'FAILED'}`);
    console.log(`  📊 Created events: ${events.created.length}`);
    console.log(`  📊 Status change events: ${events.statusChanged.length}`);
    console.log(`  📊 Evidence events: ${events.evidenceAdded.length}`);
    
    this.results.push({
      test: 'Event Emission',
      passed,
      eventCounts: {
        created: events.created.length,
        statusChanged: events.statusChanged.length,
        evidenceAdded: events.evidenceAdded.length
      }
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
      console.log('\n✅ All tests passed! Hypothesis lifecycle system is working correctly.');
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
  const tester = new HypothesisLifecycleTests();
  tester.runAllTests();
}