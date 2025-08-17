/**
 * Comprehensive tests for Law Diff-View Component
 * Tests the diff calculation, UI rendering, and integration functionality
 */

import { LawDiffView, integrateDiffView } from './law-diff-view.js';
import { LawsTabWithDiff, createLawsTabWithDiff } from './laws-tab-integration.js';

export function runLawDiffViewTests() {
  console.log('🔍 Running Law Diff-View Tests...\n');
  
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
      
      // Should detect alpha, gamma, and epsilon changes (delta removed)
      if (diffRecord.changes.total !== 3) {
        throw new Error(`Expected 3 changes, got ${diffRecord.changes.total}`);
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
      
      if (sanitized.circular.self !== undefined) {
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
      if (history[0].timestamp <= history[1].timestamp) {
        throw new Error('History not in chronological order');
      }
    });
    
    runTest('Should limit history size correctly', () => {
      const diffView = new LawDiffView();
      diffView.maxDiffHistory = 3; // Set small limit for testing
      
      // Add more changes than the limit
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
      
      if (history.length !== 3) {
        throw new Error(`Expected 3 history records (limit), got ${history.length}`);
      }
    });
    
    // Test 4: UI Component Creation
    console.log('\n4️⃣ Testing UI component creation...');
    runTest('Should create diff component without errors', () => {
      const diffView = new LawDiffView();
      
      // Add some diff data
      const beforeState = {
        confidence: 0.5,
        parameters: { alpha: 1.0, beta: 2.0 }
      };
      
      const afterState = {
        confidence: 0.7,
        parameters: { alpha: 1.5, beta: 2.0 }
      };
      
      diffView.recordLawUpdate('test-law', beforeState, afterState);
      
      // Create a temporary container
      const testContainer = document.createElement('div');
      testContainer.id = 'test-container';
      document.body.appendChild(testContainer);
      
      try {
        const component = diffView.createDiffComponent('test-law', 'test-container');
        
        if (!component) {
          throw new Error('Component not created');
        }
        
        if (!component.querySelector('.confidence-diff')) {
          throw new Error('Confidence diff section not found');
        }
        
        if (!component.querySelector('.parameters-diff')) {
          throw new Error('Parameters diff section not found');
        }
      } finally {
        document.body.removeChild(testContainer);
      }
    });
    
    runTest('Should handle empty diff history in UI', () => {
      const diffView = new LawDiffView();
      
      // Create a temporary container
      const testContainer = document.createElement('div');
      testContainer.id = 'test-container-empty';
      document.body.appendChild(testContainer);
      
      try {
        const component = diffView.createDiffComponent('nonexistent-law', 'test-container-empty');
        
        if (!component) {
          throw new Error('Component not created for empty history');
        }
        
        const innerHTML = component.innerHTML;
        if (!innerHTML.includes('No changes recorded')) {
          throw new Error('Empty state message not displayed');
        }
      } finally {
        document.body.removeChild(testContainer);
      }
    });
    
    // Test 5: Value Formatting
    console.log('\n5️⃣ Testing value formatting...');
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
    
    // Test 6: Integration with Codex Engine
    console.log('\n6️⃣ Testing Codex Engine integration...');
    runTest('Should integrate with codex engine correctly', () => {
      // Mock Codex Engine
      const mockCodex = {
        codex: {
          laws: new Map([
            ['test-law', { 
              id: 'test-law', 
              confidence: 0.5, 
              parameters: { alpha: 1.0 } 
            }]
          ])
        },
        updateLaw: function(lawId, updates) {
          const law = this.codex.laws.get(lawId);
          if (law) {
            Object.assign(law, updates);
          }
          return law;
        }
      };
      
      const diffView = integrateDiffView(mockCodex);
      
      if (typeof mockCodex.createDiffView !== 'function') {
        throw new Error('createDiffView method not added to codex');
      }
      
      if (typeof mockCodex.getDiffHistory !== 'function') {
        throw new Error('getDiffHistory method not added to codex');
      }
      
      if (typeof mockCodex.getLatestDiff !== 'function') {
        throw new Error('getLatestDiff method not added to codex');
      }
      
      // Test that updateLaw triggers diff recording
      const originalUpdateLaw = mockCodex.updateLaw;
      mockCodex.updateLaw('test-law', { confidence: 0.7 });
      
      const latestDiff = mockCodex.getLatestDiff('test-law');
      if (!latestDiff) {
        throw new Error('Diff not recorded on law update');
      }
    });
    
    // Test 7: Export Functionality
    console.log('\n7️⃣ Testing export functionality...');
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
    
    // Test 8: Laws Tab Integration
    console.log('\n8️⃣ Testing Laws Tab integration...');
    runTest('Should create laws tab with diff integration', () => {
      // Mock Codex Engine with laws
      const mockCodex = {
        codex: {
          laws: new Map([
            ['law1', { 
              id: 'law1', 
              title: 'Test Law 1',
              confidence: 0.8, 
              parameters: { alpha: 1.0 },
              description: 'Test law description',
              lastUpdated: Date.now()
            }],
            ['law2', { 
              id: 'law2', 
              title: 'Test Law 2',
              confidence: 0.3, 
              parameters: { beta: 2.0 },
              description: 'Another test law',
              lastUpdated: Date.now() - 1000000
            }]
          ])
        },
        getAllLaws: function() {
          return Array.from(this.codex.laws.values());
        },
        getLaw: function(id) {
          return this.codex.laws.get(id);
        },
        updateLaw: function(lawId, updates) {
          const law = this.codex.laws.get(lawId);
          if (law) {
            Object.assign(law, updates);
          }
          return law;
        }
      };
      
      // Create a temporary container
      const testContainer = document.createElement('div');
      testContainer.id = 'test-laws-container';
      document.body.appendChild(testContainer);
      
      try {
        const lawsTab = createLawsTabWithDiff(mockCodex, 'test-laws-container');
        
        if (!lawsTab) {
          throw new Error('Laws tab not created');
        }
        
        if (typeof lawsTab.refreshLawsContent !== 'function') {
          throw new Error('Laws tab missing refresh method');
        }
        
        // Check if laws are rendered
        const lawCards = testContainer.querySelectorAll('.law-card');
        if (lawCards.length !== 2) {
          throw new Error(`Expected 2 law cards, got ${lawCards.length}`);
        }
        
        // Check if controls are present
        const showDiffsToggle = testContainer.querySelector('#show-diffs-toggle');
        if (!showDiffsToggle) {
          throw new Error('Show diffs toggle not found');
        }
        
        const refreshButton = testContainer.querySelector('#refresh-all-laws');
        if (!refreshButton) {
          throw new Error('Refresh button not found');
        }
      } finally {
        document.body.removeChild(testContainer);
      }
    });
    
    // Test 9: Error Handling
    console.log('\n9️⃣ Testing error handling...');
    runTest('Should handle invalid data gracefully', () => {
      const diffView = new LawDiffView();
      
      // Test with null/undefined states
      try {
        diffView.recordLawUpdate('test-law', null, { confidence: 0.5 });
        // Should not throw error
      } catch (error) {
        throw new Error(`Should handle null beforeState: ${error.message}`);
      }
      
      // Test with missing properties
      try {
        const beforeState = {}; // Missing confidence and parameters
        const afterState = { confidence: 0.5 };
        diffView.recordLawUpdate('test-law', beforeState, afterState);
        // Should not throw error
      } catch (error) {
        throw new Error(`Should handle missing properties: ${error.message}`);
      }
    });
    
    runTest('Should handle DOM manipulation errors', () => {
      const diffView = new LawDiffView();
      
      // Test creating component with invalid container
      try {
        diffView.createDiffComponent('test-law', 'nonexistent-container');
        // Should fall back to document.body
      } catch (error) {
        throw new Error(`Should handle invalid container: ${error.message}`);
      }
    });
    
    // Test 10: Performance and Memory
    console.log('\n🔟 Testing performance and memory management...');
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
    
    runTest('Should respect history limits', () => {
      const diffView = new LawDiffView();
      diffView.maxDiffHistory = 10;
      
      // Add more changes than the limit
      for (let i = 0; i < 20; i++) {
        const beforeState = {
          confidence: i * 0.01,
          parameters: { alpha: i }
        };
        
        const afterState = {
          confidence: (i + 1) * 0.01,
          parameters: { alpha: i + 1 }
        };
        
        diffView.recordLawUpdate('test-law', beforeState, afterState);
      }
      
      const history = diffView.getDiffHistory('test-law');
      
      if (history.length > 10) {
        throw new Error(`History exceeded limit: ${history.length} > 10`);
      }
    });
    
    console.log(`\n📊 Test Results: ${testSuite.passed}/${testSuite.passed + testSuite.failed} tests passed`);
    
    if (testSuite.failed === 0) {
      console.log('🎉 All Law Diff-View tests passed!');
      console.log('✨ Component ready for production use with full diff visualization');
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

// Helper function to create mock DOM environment if needed
function createMockDOM() {
  if (typeof document === 'undefined') {
    // Simple mock for Node.js environment
    global.document = {
      createElement: (tag) => ({
        id: '',
        className: '',
        style: { cssText: '' },
        innerHTML: '',
        querySelector: () => null,
        querySelectorAll: () => [],
        appendChild: () => {},
        removeChild: () => {},
        addEventListener: () => {}
      }),
      body: {
        appendChild: () => {},
        removeChild: () => {}
      },
      getElementById: () => null,
      head: {
        appendChild: () => {}
      }
    };
  }
}

// Export for use in other modules

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createMockDOM();
  runLawDiffViewTests();
}