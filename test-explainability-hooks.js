/**
 * Simple test runner for Explainability Hooks with deterministic behavior
 */

import { ExplainabilityHooks, integrateExplainabilityHooks } from './explainability-hooks.js';

export function runExplainabilityHooksTests() {
  console.log('🧪 Running Explainability Hooks Tests with Fixed Seed...\n');
  
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
    // Test 1: Deterministic behavior with fixed seed
    console.log('1️⃣ Testing deterministic behavior...');
    runTest('Seeded RNG produces identical sequences', () => {
      const hooks1 = new ExplainabilityHooks();
      hooks1.reset(42);
      const hooks2 = new ExplainabilityHooks();
      hooks2.reset(42);
      
      const seq1 = Array.from({ length: 5 }, () => hooks1.rng());
      const seq2 = Array.from({ length: 5 }, () => hooks2.rng());
      
      if (JSON.stringify(seq1) !== JSON.stringify(seq2)) {
        throw new Error('Sequences not identical');
      }
    });
    
    runTest('Different seeds produce different sequences', () => {
      const hooks1 = new ExplainabilityHooks();
      hooks1.reset(123);
      const hooks2 = new ExplainabilityHooks();
      hooks2.reset(456);
      
      const seq1 = Array.from({ length: 5 }, () => hooks1.rng());
      const seq2 = Array.from({ length: 5 }, () => hooks2.rng());
      
      if (JSON.stringify(seq1) === JSON.stringify(seq2)) {
        throw new Error('Sequences should be different');
      }
    });
    
    // Test 2: Impact score consistency
    console.log('\n2️⃣ Testing impact score consistency...');
    runTest('Impact scores are deterministic', () => {
      const hooks1 = new ExplainabilityHooks();
      hooks1.reset(42);
      const hooks2 = new ExplainabilityHooks();
      hooks2.reset(42);
      
      const eventData = { type: 'confirmation', correlation: 0.8 };
      const context = { experimentType: 'controlled' };
      
      const score1 = hooks1.calculateImpactScore(0.1, eventData, context);
      const score2 = hooks2.calculateImpactScore(0.1, eventData, context);
      
      if (score1 !== score2) {
        throw new Error(`Scores differ: ${score1} vs ${score2}`);
      }
    });
    
    runTest('Impact scales with confidence change', () => {
      const hooks = new ExplainabilityHooks();
      hooks.reset(42);
      
      const eventData = { type: 'confirmation' };
      const context = {};
      
      const smallScore = hooks.calculateImpactScore(0.05, eventData, context);
      hooks.reset(42); // Reset to same state
      const largeScore = hooks.calculateImpactScore(0.15, eventData, context);
      
      if (largeScore <= smallScore) {
        throw new Error('Large change should have higher impact');
      }
    });
    
    runTest('Type multipliers work correctly', () => {
      const hooks = new ExplainabilityHooks();
      const context = {};
      
      hooks.reset(42);
      const confirmationScore = hooks.calculateImpactScore(0.1, { type: 'confirmation' }, context);
      hooks.reset(42);
      const contradictionScore = hooks.calculateImpactScore(0.1, { type: 'contradiction' }, context);
      hooks.reset(42);
      const breakthroughScore = hooks.calculateImpactScore(0.1, { type: 'breakthrough' }, context);
      
      // Breakthrough (2.5) > Contradiction (2.0) > Confirmation (1.5)
      if (!(breakthroughScore > contradictionScore && contradictionScore > confirmationScore)) {
        throw new Error('Type multipliers not working correctly');
      }
    });
    
    // Test 3: Event tracking
    console.log('\n3️⃣ Testing event tracking...');
    runTest('Events tracked above threshold', () => {
      const hooks = new ExplainabilityHooks();
      hooks.reset(42);
      
      const record = hooks.hookLawUpdate('test-law', 0.5, 0.6, { type: 'test' });
      const history = hooks.getEventHistory('test-law');
      
      if (!record || history.length !== 1) {
        throw new Error('Event not tracked correctly');
      }
      
      if (Math.abs(record.confidenceChange - 0.1) > 0.001) {
        throw new Error(`Confidence change calculation incorrect: expected ~0.1, got ${record.confidenceChange}`);
      }
    });
    
    runTest('Events below threshold ignored', () => {
      const hooks = new ExplainabilityHooks();
      hooks.reset(42);
      
      const record = hooks.hookLawUpdate('test-law', 0.5, 0.505, { type: 'test' });
      const history = hooks.getEventHistory('test-law');
      
      if (record !== undefined || history.length !== 0) {
        throw new Error('Small change should be ignored');
      }
    });
    
    runTest('Event history maintains order', () => {
      const hooks = new ExplainabilityHooks();
      hooks.reset(42);
      
      hooks.hookLawUpdate('test-law', 0.5, 0.6, { type: 'first' });
      hooks.hookLawUpdate('test-law', 0.6, 0.7, { type: 'second' });
      hooks.hookLawUpdate('test-law', 0.7, 0.8, { type: 'third' });
      
      const history = hooks.getEventHistory('test-law');
      
      if (history.length !== 3) {
        throw new Error('History length incorrect');
      }
      
      // Should be in reverse chronological order
      if (history[0].eventData.type !== 'third' || 
          history[1].eventData.type !== 'second' || 
          history[2].eventData.type !== 'first') {
        throw new Error('History order incorrect');
      }
    });
    
    // Test 4: Top events management
    console.log('\n4️⃣ Testing top events management...');
    runTest('Top events ranked by impact', () => {
      const hooks = new ExplainabilityHooks();
      hooks.reset(42);
      
      // Add events with different impacts
      hooks.hookLawUpdate('test-law', 0.5, 0.55, { type: 'confirmation' });     // Low
      hooks.hookLawUpdate('test-law', 0.55, 0.7, { type: 'breakthrough' });      // High
      hooks.hookLawUpdate('test-law', 0.7, 0.78, { type: 'contradiction' });     // Medium
      
      const explanation = hooks.getExplanation('test-law');
      
      if (!explanation || explanation.topEvents.length !== 3) {
        throw new Error('Top events not generated correctly');
      }
      
      // Should be ranked by impact (highest first)
      const scores = explanation.topEvents.map(e => e.impactScore);
      for (let i = 1; i < scores.length; i++) {
        if (scores[i] > scores[i-1]) {
          throw new Error('Top events not sorted by impact');
        }
      }
    });
    
    runTest('Top events limited to 5', () => {
      const hooks = new ExplainabilityHooks();
      hooks.reset(42);
      
      // Add 7 events
      for (let i = 0; i < 7; i++) {
        hooks.hookLawUpdate('test-law', 0.5, 0.5 + (i + 1) * 0.02, { 
          type: 'test', 
          index: i 
        });
      }
      
      const explanation = hooks.getExplanation('test-law');
      
      if (explanation.topEvents.length !== 5) {
        throw new Error(`Expected 5 top events, got ${explanation.topEvents.length}`);
      }
    });
    
    // Test 5: Data sanitization
    console.log('\n5️⃣ Testing data sanitization...');
    runTest('Event data sanitization', () => {
      const hooks = new ExplainabilityHooks();
      
      const eventData = {
        type: 'test',
        correlation: 0.8,
        signal: 1.5,
        noise: 0.3,
        secretField: 'should be removed',
        password: 'secret'
      };
      
      const sanitized = hooks.sanitizeEventData(eventData);
      
      if (sanitized.type !== 'test' || 
          sanitized.correlation !== 0.8 || 
          sanitized.signal !== 1.5 || 
          sanitized.noise !== 0.3) {
        throw new Error('Allowed fields not preserved');
      }
      
      if (sanitized.secretField !== undefined || sanitized.password !== undefined) {
        throw new Error('Sensitive fields not removed');
      }
    });
    
    runTest('Context data sanitization', () => {
      const hooks = new ExplainabilityHooks();
      
      const context = {
        experimentType: 'controlled',
        source: 'test',
        lawType: 'rhythmic',
        secretKey: 'should be removed'
      };
      
      const sanitized = hooks.sanitizeContext(context);
      
      if (sanitized.experimentType !== 'controlled' || 
          sanitized.source !== 'test' || 
          sanitized.lawType !== 'rhythmic') {
        throw new Error('Allowed context fields not preserved');
      }
      
      if (sanitized.secretKey !== undefined) {
        throw new Error('Secret context field not removed');
      }
    });
    
    // Test 6: Description generation
    console.log('\n6️⃣ Testing description generation...');
    runTest('Positive confidence change description', () => {
      const hooks = new ExplainabilityHooks();
      
      const description = hooks.generateEventDescription(
        { type: 'confirmation', correlation: 0.8 },
        0.05,
        { experimentType: 'controlled' }
      );
      
      if (!description.includes('increased by 5.0%') || 
          !description.includes('due to confirmation') ||
          !description.includes('80.0% correlation') ||
          !description.includes('from controlled experiment')) {
        throw new Error('Description missing expected content');
      }
    });
    
    runTest('Negative confidence change description', () => {
      const hooks = new ExplainabilityHooks();
      
      const description = hooks.generateEventDescription(
        { type: 'contradiction' },
        -0.03,
        {}
      );
      
      if (!description.includes('decreased by 3.0%') || 
          !description.includes('due to contradiction')) {
        throw new Error('Negative change description incorrect');
      }
    });
    
    // Test 7: Statistics
    console.log('\n7️⃣ Testing statistics...');
    runTest('Statistics calculation', () => {
      const hooks = new ExplainabilityHooks();
      hooks.reset(42);
      
      // Add events to multiple laws
      hooks.hookLawUpdate('law1', 0.5, 0.6, { type: 'confirmation' });
      hooks.hookLawUpdate('law1', 0.6, 0.7, { type: 'contradiction' });
      hooks.hookLawUpdate('law2', 0.4, 0.5, { type: 'breakthrough' });
      
      const stats = hooks.getStatistics();
      
      if (stats.totalLaws !== 2 || 
          stats.totalEvents !== 3 || 
          stats.averageEventsPerLaw !== 1.5) {
        throw new Error('Basic statistics incorrect');
      }
      
      if (stats.eventTypeDistribution.confirmation !== 1 ||
          stats.eventTypeDistribution.contradiction !== 1 ||
          stats.eventTypeDistribution.breakthrough !== 1) {
        throw new Error('Event type distribution incorrect');
      }
    });
    
    // Test 8: Integration
    console.log('\n8️⃣ Testing integration...');
    runTest('Codex Engine integration', () => {
      // Mock Codex Engine
      const mockCodex = {
        updateConfidence: function(oldConf, data) { return oldConf + 0.1; },
        currentLawId: 'test-law',
        codex: {
          laws: new Map([['test-law', { id: 'test-law', confidence: 0.6 }]])
        }
      };
      
      const hooks = integrateExplainabilityHooks(mockCodex);
      
      // Check that methods were added
      if (typeof mockCodex.getExplanation !== 'function' ||
          typeof mockCodex.getAllExplanations !== 'function' ||
          typeof mockCodex.getEventHistory !== 'function' ||
          typeof mockCodex.getExplainabilityStats !== 'function') {
        throw new Error('Integration methods not added to codex');
      }
      
      // Test that updateConfidence was wrapped
      const originalUpdate = mockCodex.updateConfidence;
      const newConfidence = mockCodex.updateConfidence(0.5, { type: 'test' });
      
      if (newConfidence !== 0.6) {
        throw new Error('updateConfidence wrapper not working');
      }
    });
    
    // Test 9: Reset functionality
    console.log('\n9️⃣ Testing reset functionality...');
    runTest('Reset clears all state', () => {
      const hooks = new ExplainabilityHooks();
      hooks.reset(42);
      
      // Add some data
      hooks.hookLawUpdate('test-law', 0.5, 0.6, { type: 'test' });
      
      if (hooks.getEventHistory('test-law').length !== 1 ||
          hooks.getExplanation('test-law') === null) {
        throw new Error('Initial data not present');
      }
      
      // Reset
      hooks.reset(999);
      
      if (hooks.getEventHistory('test-law').length !== 0 ||
          hooks.getExplanation('test-law') !== null ||
          hooks.config.seed !== 999) {
        throw new Error('Reset did not clear state');
      }
    });
    
    runTest('Reset with new seed changes RNG', () => {
      const hooks = new ExplainabilityHooks();
      
      hooks.reset(42);
      const value1 = hooks.rng();
      
      hooks.reset(999);
      const value2 = hooks.rng();
      
      if (value1 === value2) {
        throw new Error('Different seeds should produce different values');
      }
      
      // But same seed should produce same value
      hooks.reset(42);
      const value3 = hooks.rng();
      
      if (value1 !== value3) {
        throw new Error('Same seed should reproduce same value');
      }
    });
    
    console.log(`\n📊 Test Results: ${testSuite.passed}/${testSuite.passed + testSuite.failed} tests passed`);
    
    if (testSuite.failed === 0) {
      console.log('🎉 All explainability hooks tests passed with deterministic behavior!');
      console.log('✨ System ready for production use with full explainability tracking');
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

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runExplainabilityHooksTests();
}