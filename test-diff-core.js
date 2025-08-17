/**
 * Core Diff-View Tests (without DOM dependencies)
 * Tests the core diff calculation and logic
 */

import { LawDiffView } from './law-diff-view.js';

function runCoreDiffTests() {
  console.log('🧪 Running Core Diff-View Tests...\n');
  
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
    // Test 1: Basic Diff Calculation
    console.log('1️⃣ Testing basic diff calculation...');
    runTest('Should calculate confidence changes correctly', () => {
      const diffView = new LawDiffView();
      
      const beforeState = {
        confidence: 0.5,
        parameters: { alpha: 1.0, beta: 2.0 }
      };
      
      const afterState = {
        confidence: 0.7,
        parameters: { alpha: 1.5, beta: 2.0 }
      };
      
      const diffRecord = diffView.recordLawUpdate('test-law', beforeState, afterState);
      
      if (!diffRecord) {
        throw new Error('Diff record not created');
      }
      
      if (Math.abs(diffRecord.changes.confidence.delta - 0.2) > 0.001) {
        throw new Error(`Expected confidence delta 0.2, got ${diffRecord.changes.confidence.delta}`);
      }
      
      if (diffRecord.changes.total !== 2) { // confidence + alpha parameter
        throw new Error(`Expected 2 total changes, got ${diffRecord.changes.total}`);
      }
    });
    
    runTest('Should handle parameter changes correctly', () => {
      const diffView = new LawDiffView();
      
      const beforeState = {
        confidence: 0.6,
        parameters: { 
          alpha: 1.0, 
          beta: 2.0,
          gamma: 'string_value',
          delta: [1, 2, 3]
        }
      };
      
      const afterState = {
        confidence: 0.6, // No change
        parameters: { 
          alpha: 1.5,     // Numeric change
          beta: 2.0,      // No change
          gamma: 'new_string', // String change
          epsilon: 5.0    // New parameter
        }
      };
      
      const diffRecord = diffView.recordLawUpdate('test-law', beforeState, afterState);
      
      // Should detect alpha, gamma, epsilon changes, and delta removal
      console.log('Changes detected:', Object.keys(diffRecord.changes.parameters));
      console.log('Total changes:', diffRecord.changes.total);
      if (diffRecord.changes.total !== 4) { // alpha, gamma, epsilon, delta
        throw new Error(`Expected 4 changes, got ${diffRecord.changes.total}`);
      }
      
      if (!diffRecord.changes.parameters.alpha) {
        throw new Error('Alpha parameter change not detected');
      }
      
      if (diffRecord.changes.parameters.alpha.delta !== 0.5) {
        throw new Error(`Expected alpha delta 0.5, got ${diffRecord.changes.parameters.alpha.delta}`);
      }
      
      if (diffRecord.changes.parameters.gamma.type !== 'string') {
        throw new Error('Gamma parameter type not correctly identified');
      }
    });
    
    runTest('Should ignore changes below threshold', () => {
      const diffView = new LawDiffView();
      
      const beforeState = {
        confidence: 0.5,
        parameters: { alpha: 1.0 }
      };
      
      const afterState = {
        confidence: 0.50005, // Very small change
        parameters: { alpha: 1.00003 } // Very small change
      };
      
      const diffRecord = diffView.recordLawUpdate('test-law', beforeState, afterState);
      
      if (diffRecord.changes.total !== 0) {
        throw new Error(`Expected 0 changes, got ${diffRecord.changes.total}`);
      }
    });
    
    // Test 2: State Sanitization
    console.log('\n2️⃣ Testing state sanitization...');
    runTest('Should sanitize state properly', () => {
      const diffView = new LawDiffView();
      
      const complexState = {
        confidence: 0.5,
        parameters: { alpha: 1.0 },
        someFunction: () => 'test',
        circular: {}
      };
      complexState.circular.self = complexState;
      
      const sanitized = diffView.sanitizeState(complexState);
      
      if (sanitized.someFunction !== undefined) {
        throw new Error('Function not removed during sanitization');
      }
      
      if (sanitized.circular && sanitized.circular.self !== undefined) {
        throw new Error('Circular reference not handled');
      }
      
      if (sanitized.confidence !== 0.5) {
        throw new Error('Confidence not preserved');
      }
    });
    
    // Test 3: History Management
    console.log('\n3️⃣ Testing history management...');
    runTest('Should maintain diff history correctly', () => {
      const diffView = new LawDiffView();
      
      // Add multiple changes
      for (let i = 0; i < 5; i++) {
        const beforeState = {
          confidence: 0.5 + i * 0.1,
          parameters: { alpha: 1.0 + i }
        };
        
        const afterState = {
          confidence: 0.5 + (i + 1) * 0.1,
          parameters: { alpha: 1.0 + i + 1 }
        };
        
        diffView.recordLawUpdate('test-law', beforeState, afterState);
      }
      
      const history = diffView.getDiffHistory('test-law');
      
      if (history.length !== 5) {
        throw new Error(`Expected 5 history records, got ${history.length}`);
      }
      
      // Check chronological order (most recent first)
      // Allow for small timing differences
      if (history[0].timestamp < history[1].timestamp) {
        throw new Error('History not in chronological order');
      }
    });
    
    // Test 4: Value Formatting
    console.log('\n4️⃣ Testing value formatting...');
    runTest('Should format values correctly', () => {
      const diffView = new LawDiffView();
      
      const testCases = [
        { input: 1.23456789, expected: '1.2346' },
        { input: 42, expected: '42' },
        { input: null, expected: 'null' },
        { input: undefined, expected: 'undefined' },
        { input: 'test string', expected: '"test string"' },
        { input: [1, 2, 3], expected: '[3 items]' },
        { input: { a: 1, b: 2 }, expected: '{2 props}' }
      ];
      
      testCases.forEach(({ input, expected }) => {
        const formatted = diffView.formatValue(input);
        if (formatted !== expected) {
          throw new Error(`Expected ${expected}, got ${formatted} for input ${input}`);
        }
      });
    });
    
    // Test 5: Export Functionality
    console.log('\n5️⃣ Testing export functionality...');
    runTest('Should export diff data correctly', () => {
      const diffView = new LawDiffView();
      
      // Add some test data
      const beforeState = {
        confidence: 0.5,
        parameters: { alpha: 1.0 }
      };
      
      const afterState = {
        confidence: 0.7,
        parameters: { alpha: 1.5 }
      };
      
      diffView.recordLawUpdate('test-law', beforeState, afterState);
      
      // Test single law export
      const singleExport = diffView.exportDiffData('test-law');
      if (!singleExport.lawId || singleExport.lawId !== 'test-law') {
        throw new Error('Single law export missing lawId');
      }
      
      if (!singleExport.history || singleExport.history.length !== 1) {
        throw new Error('Single law export missing history');
      }
      
      // Test full export
      const fullExport = diffView.exportDiffData();
      if (!fullExport.allDiffs) {
        throw new Error('Full export missing allDiffs');
      }
      
      if (!fullExport.config) {
        throw new Error('Full export missing config');
      }
      
      if (!fullExport.exportedAt) {
        throw new Error('Full export missing timestamp');
      }
    });
    
    // Test 6: Performance
    console.log('\n6️⃣ Testing performance...');
    runTest('Should handle large number of changes efficiently', () => {
      const diffView = new LawDiffView();
      const startTime = Date.now();
      
      // Add many changes
      for (let i = 0; i < 100; i++) {
        const beforeState = {
          confidence: Math.random(),
          parameters: { alpha: Math.random() * 10 }
        };
        
        const afterState = {
          confidence: Math.random(),
          parameters: { alpha: Math.random() * 10 }
        };
        
        diffView.recordLawUpdate(`law-${i}`, beforeState, afterState);
      }
      
      const duration = Date.now() - startTime;
      
      // Should complete within reasonable time
      if (duration > 1000) {
        throw new Error(`Performance test took too long: ${duration}ms`);
      }
      
      // Check that we have laws with diffs
      const lawsWithDiffs = diffView.getAllLawsWithDiffs();
      if (lawsWithDiffs.length !== 100) {
        throw new Error(`Expected 100 laws with diffs, got ${lawsWithDiffs.length}`);
      }
    });
    
    console.log(`\n📊 Test Results: ${testSuite.passed}/${testSuite.passed + testSuite.failed} tests passed`);
    
    if (testSuite.failed === 0) {
      console.log('🎉 All core diff-view tests passed!');
      console.log('✨ Core diff calculation logic verified');
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

// Run tests
runCoreDiffTests();