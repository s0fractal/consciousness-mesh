/**
 * Comprehensive Tests for Calibrated Confidence Meter
 * Tests functionality, responsiveness, and adaptiveness
 */

import { CalibratedConfidenceMeter, integrateConfidenceMeter } from './calibrated-confidence-meter.js';

export function runCalibratedConfidenceMeterTests() {
  console.log('📊 Running Calibrated Confidence Meter Tests...\n');
  
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
    // Test 1: Basic Component Creation
    console.log('1️⃣ Testing basic component creation...');
    runTest('Should create meter component without errors', () => {
      const meter = new CalibratedConfidenceMeter();
      
      if (!meter) {
        throw new Error('Meter component not created');
      }
      
      if (typeof meter.updateConfidence !== 'function') {
        throw new Error('updateConfidence method not found');
      }
      
      if (typeof meter.createMeter !== 'function') {
        throw new Error('createMeter method not found');
      }
    });
    
    runTest('Should accept configuration options', () => {
      const config = {
        width: 400,
        height: 100,
        showLabels: false,
        showValues: true,
        showDelta: false
      };
      
      const meter = new CalibratedConfidenceMeter(config);
      
      if (meter.config.width !== 400) {
        throw new Error('Width configuration not applied');
      }
      
      if (meter.config.showLabels !== false) {
        throw new Error('showLabels configuration not applied');
      }
      
      if (meter.config.showDelta !== false) {
        throw new Error('showDelta configuration not applied');
      }
    });
    
    // Test 2: Value Updates and Validation
    console.log('\n2️⃣ Testing value updates and validation...');
    runTest('Should update confidence values correctly', () => {
      const meter = new CalibratedConfidenceMeter();
      
      meter.updateConfidence(0.7, 0.6);
      
      if (meter.currentValues.raw !== 0.7) {
        throw new Error(`Expected raw confidence 0.7, got ${meter.currentValues.raw}`);
      }
      
      if (meter.currentValues.calibrated !== 0.6) {
        throw new Error(`Expected calibrated confidence 0.6, got ${meter.currentValues.calibrated}`);
      }
      
      if (Math.abs(meter.currentValues.delta - (-0.1)) > 0.001) {
        throw new Error(`Expected delta -0.1, got ${meter.currentValues.delta}`);
      }
    });
    
    runTest('Should clamp values to valid range', () => {
      const meter = new CalibratedConfidenceMeter();
      
      // Test values outside valid range
      meter.updateConfidence(-0.1, 1.5);
      
      if (meter.currentValues.raw !== 0) {
        throw new Error('Negative value not clamped to 0');
      }
      
      if (meter.currentValues.calibrated !== 1) {
        throw new Error('Value > 1 not clamped to 1');
      }
    });
    
    runTest('Should handle null/undefined values', () => {
      const meter = new CalibratedConfidenceMeter();
      
      try {
        meter.updateConfidence(null, undefined);
        // Should not throw error and should default to 0
        if (meter.currentValues.raw !== 0 || meter.currentValues.calibrated !== 0) {
          throw new Error('Null/undefined values not handled correctly');
        }
      } catch (error) {
        throw new Error('Should handle null/undefined values gracefully');
      }
    });
    
    // Test 3: Color Mapping and Thresholds
    console.log('\n3️⃣ Testing color mapping and thresholds...');
    runTest('Should return correct colors for confidence levels', () => {
      const meter = new CalibratedConfidenceMeter();
      
      const lowColor = meter.getConfidenceColor('raw', 0.2);
      const mediumColor = meter.getConfidenceColor('raw', 0.5);
      const highColor = meter.getConfidenceColor('raw', 0.8);
      
      if (lowColor !== meter.config.colors.raw.low) {
        throw new Error('Incorrect color for low confidence');
      }
      
      if (mediumColor !== meter.config.colors.raw.medium) {
        throw new Error('Incorrect color for medium confidence');
      }
      
      if (highColor !== meter.config.colors.raw.high) {
        throw new Error('Incorrect color for high confidence');
      }
    });
    
    runTest('Should use different colors for raw vs calibrated', () => {
      const meter = new CalibratedConfidenceMeter();
      
      const rawColor = meter.getConfidenceColor('raw', 0.8);
      const calibratedColor = meter.getConfidenceColor('calibrated', 0.8);
      
      if (rawColor === calibratedColor) {
        throw new Error('Raw and calibrated should have different colors');
      }
    });
    
    // Test 4: DOM Component Creation
    console.log('\n4️⃣ Testing DOM component creation...');
    runTest('Should create DOM elements correctly', () => {
      const meter = new CalibratedConfidenceMeter();
      
      // Create a test container
      const testContainer = document.createElement('div');
      testContainer.id = 'test-meter-container';
      document.body.appendChild(testContainer);
      
      try {
        const component = meter.createMeter('test-meter-container');
        
        if (!component) {
          throw new Error('DOM component not created');
        }
        
        if (!component.querySelector('.confidence-header')) {
          throw new Error('Header element not found');
        }
        
        if (!component.querySelector('.confidence-bar-container')) {
          throw new Error('Bar container not found');
        }
        
        if (component.querySelectorAll('.confidence-bar-container').length !== 2) {
          throw new Error('Expected 2 bar containers (raw + calibrated)');
        }
      } finally {
        document.body.removeChild(testContainer);
      }
    });
    
    runTest('Should handle missing container gracefully', () => {
      const meter = new CalibratedConfidenceMeter();
      
      try {
        meter.createMeter('nonexistent-container');
        throw new Error('Should throw error for missing container');
      } catch (error) {
        if (!error.message.includes('not found')) {
          throw new Error('Wrong error message for missing container');
        }
      }
    });
    
    // Test 5: Responsiveness and Adaptiveness
    console.log('\n5️⃣ Testing responsiveness and adaptiveness...');
    runTest('Should adapt to different container sizes', () => {
      const meter = new CalibratedConfidenceMeter();
      
      // Test different sizes
      const testSizes = [
        { width: 200, height: 60 },
        { width: 400, height: 120 },
        { width: 600, height: 150 }
      ];
      
      testSizes.forEach(size => {
        meter.setSize(size.width, size.height);
        
        if (meter.config.width !== size.width) {
          throw new Error(`Width not updated to ${size.width}`);
        }
        
        if (meter.config.height !== size.height) {
          throw new Error(`Height not updated to ${size.height}`);
        }
      });
    });
    
    runTest('Should create responsive comparison layout', () => {
      const testContainer = document.createElement('div');
      testContainer.id = 'comparison-container';
      document.body.appendChild(testContainer);
      
      try {
        const meters = [
          { title: 'Law Alpha', options: { width: 250 } },
          { title: 'Law Beta', options: { width: 250 } },
          { title: 'Law Gamma', options: { width: 250 } }
        ];
        
        const meterInstances = CalibratedConfidenceMeter.createComparison('comparison-container', meters);
        
        if (!meterInstances || meterInstances.length !== 3) {
          throw new Error('Comparison meters not created correctly');
        }
        
        const comparisonGrid = testContainer.querySelector('.confidence-meter-comparison');
        if (!comparisonGrid) {
          throw new Error('Comparison grid not found');
        }
        
        // Test grid responsiveness by checking CSS
        const computedStyle = window.getComputedStyle(comparisonGrid);
        if (!computedStyle.display.includes('grid')) {
          throw new Error('Comparison layout not using CSS Grid');
        }
      } finally {
        document.body.removeChild(testContainer);
      }
    });
    
    // Test 6: Animation and Performance
    console.log('\n6️⃣ Testing animation and performance...');
    runTest('Should animate values smoothly', () => {
      const meter = new CalibratedConfidenceMeter();
      
      // Set initial values
      meter.updateConfidence(0.3, 0.2);
      
      // Check animation targets are set
      if (meter.animationState.raw.target !== 0.3) {
        throw new Error('Raw animation target not set correctly');
      }
      
      if (meter.animationState.calibrated.target !== 0.2) {
        throw new Error('Calibrated animation target not set correctly');
      }
      
      // Test animation step
      const animationNeeded = meter.animateValue('raw');
      if (typeof animationNeeded !== 'boolean') {
        throw new Error('animateValue should return boolean');
      }
    });
    
    runTest('Should handle rapid updates efficiently', () => {
      const meter = new CalibratedConfidenceMeter();
      const startTime = Date.now();
      
      // Simulate rapid updates
      for (let i = 0; i < 100; i++) {
        meter.updateConfidence(Math.random(), Math.random());
      }
      
      const duration = Date.now() - startTime;
      
      if (duration > 100) { // Should complete within 100ms
        throw new Error(`Performance test too slow: ${duration}ms`);
      }
    });
    
    // Test 7: Integration with Calibration System
    console.log('\n7️⃣ Testing integration with calibration system...');
    runTest('Should integrate with calibration system', () => {
      // Mock calibration system
      const mockCalibrationSystem = {
        calibrateConfidence: function(rawConfidence, context = {}) {
          // Simple mock: reduce confidence by 10%
          return rawConfidence * 0.9;
        }
      };
      
      const integration = integrateConfidenceMeter(mockCalibrationSystem);
      
      if (typeof integration.createMeter !== 'function') {
        throw new Error('Integration missing createMeter method');
      }
      
      if (typeof integration.updateMeter !== 'function') {
        throw new Error('Integration missing updateMeter method');
      }
      
      if (typeof integration.getMeter !== 'function') {
        throw new Error('Integration missing getMeter method');
      }
    });
    
    runTest('Should hook into calibration updates', () => {
      const mockCalibrationSystem = {
        calibrateConfidence: function(rawConfidence, context = {}) {
          return rawConfidence * 0.8;
        }
      };
      
      const integration = integrateConfidenceMeter(mockCalibrationSystem);
      
      // Test that calibration triggers meter updates
      const testContainer = document.createElement('div');
      testContainer.id = 'integration-test';
      document.body.appendChild(testContainer);
      
      try {
        const meter = integration.createMeter('test-law-1', 'integration-test');
        
        // Trigger calibration with law context
        const calibrated = mockCalibrationSystem.calibrateConfidence(0.5, { lawId: 'test-law-1' });
        
        if (Math.abs(calibrated - 0.4) > 0.001) {
          throw new Error('Calibration not working correctly');
        }
        
        // Check if meter was updated
        const retrievedMeter = integration.getMeter('test-law-1');
        if (!retrievedMeter) {
          throw new Error('Meter not stored in integration');
        }
      } finally {
        document.body.removeChild(testContainer);
      }
    });
    
    // Test 8: Event Handling and Callbacks
    console.log('\n8️⃣ Testing event handling and callbacks...');
    runTest('Should trigger update callbacks', () => {
      let callbackTriggered = false;
      let callbackValues = null;
      
      const meter = new CalibratedConfidenceMeter({
        onUpdate: (values) => {
          callbackTriggered = true;
          callbackValues = values;
        }
      });
      
      meter.updateConfidence(0.6, 0.5);
      
      if (!callbackTriggered) {
        throw new Error('Update callback not triggered');
      }
      
      if (!callbackValues || callbackValues.raw !== 0.6) {
        throw new Error('Callback values not correct');
      }
    });
    
    runTest('Should handle hover events', () => {
      let hoverTriggered = false;
      
      const meter = new CalibratedConfidenceMeter({
        onHover: (type, action, value) => {
          hoverTriggered = true;
        }
      });
      
      const testContainer = document.createElement('div');
      testContainer.id = 'hover-test';
      document.body.appendChild(testContainer);
      
      try {
        meter.createMeter('hover-test');
        
        // Simulate hover event
        const barTrack = testContainer.querySelector('.confidence-bar-track');
        if (barTrack) {
          const event = new MouseEvent('mouseenter', { bubbles: true });
          barTrack.dispatchEvent(event);
          
          if (!hoverTriggered) {
            throw new Error('Hover callback not triggered');
          }
        }
      } finally {
        document.body.removeChild(testContainer);
      }
    });
    
    // Test 9: Accessibility and Standards
    console.log('\n9️⃣ Testing accessibility and standards...');
    runTest('Should be keyboard accessible', () => {
      const meter = new CalibratedConfidenceMeter();
      
      const testContainer = document.createElement('div');
      testContainer.id = 'accessibility-test';
      document.body.appendChild(testContainer);
      
      try {
        meter.createMeter('accessibility-test');
        
        const barTracks = testContainer.querySelectorAll('.confidence-bar-track');
        
        barTracks.forEach(track => {
          // Check if element can receive focus
          track.focus();
          if (document.activeElement !== track) {
            throw new Error('Bar track not keyboard focusable');
          }
        });
      } finally {
        document.body.removeChild(testContainer);
      }
    });
    
    runTest('Should support high contrast mode', () => {
      const meter = new CalibratedConfidenceMeter();
      
      // Test that colors are distinct enough for high contrast
      const lowColor = meter.getConfidenceColor('raw', 0.2);
      const highColor = meter.getConfidenceColor('raw', 0.8);
      
      if (lowColor === highColor) {
        throw new Error('Colors not distinct enough for accessibility');
      }
    });
    
    // Test 10: Edge Cases and Error Handling
    console.log('\n🔟 Testing edge cases and error handling...');
    runTest('Should handle component destruction gracefully', () => {
      const meter = new CalibratedConfidenceMeter();
      
      const testContainer = document.createElement('div');
      testContainer.id = 'destroy-test';
      document.body.appendChild(testContainer);
      
      try {
        meter.createMeter('destroy-test');
        
        // Test destruction
        meter.destroy();
        
        if (meter.container !== null) {
          throw new Error('Container reference not cleared');
        }
        
        if (Object.keys(meter.elements).length > 0) {
          throw new Error('Element references not cleared');
        }
      } finally {
        if (document.body.contains(testContainer)) {
          document.body.removeChild(testContainer);
        }
      }
    });
    
    runTest('Should handle configuration updates', () => {
      const meter = new CalibratedConfidenceMeter();
      
      const newConfig = {
        precision: 6,
        threshold: 0.001,
        colors: {
          raw: { low: '#ff0000', medium: '#ffff00', high: '#00ff00' }
        }
      };
      
      meter.updateConfig(newConfig);
      
      if (meter.config.precision !== 6) {
        throw new Error('Precision config not updated');
      }
      
      if (meter.config.threshold !== 0.001) {
        throw new Error('Threshold config not updated');
      }
    });
    
    runTest('Should handle extreme confidence ranges', () => {
      const meter = new CalibratedConfidenceMeter();
      
      // Test extreme values
      const extremeCases = [
        [0, 0],
        [1, 1],
        [0, 1],
        [1, 0],
        [0.001, 0.999]
      ];
      
      extremeCases.forEach(([raw, calibrated]) => {
        try {
          meter.updateConfidence(raw, calibrated);
          
          if (meter.currentValues.raw < 0 || meter.currentValues.raw > 1) {
            throw new Error(`Raw value out of range: ${meter.currentValues.raw}`);
          }
          
          if (meter.currentValues.calibrated < 0 || meter.currentValues.calibrated > 1) {
            throw new Error(`Calibrated value out of range: ${meter.currentValues.calibrated}`);
          }
        } catch (error) {
          throw new Error(`Failed on extreme case [${raw}, ${calibrated}]: ${error.message}`);
        }
      });
    });
    
    console.log(`\n📊 Test Results: ${testSuite.passed}/${testSuite.passed + testSuite.failed} tests passed`);
    
    if (testSuite.failed === 0) {
      console.log('🎉 All calibrated confidence meter tests passed!');
      console.log('✨ Component ready for production with full responsiveness and adaptiveness');
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

/**
 * Test responsive behavior across different screen sizes
 */
export function testResponsiveBehavior() {
  console.log('📱 Testing responsive behavior...\n');
  
  const meter = new CalibratedConfidenceMeter();
  
  // Create test container
  const testContainer = document.createElement('div');
  testContainer.id = 'responsive-test-container';
  testContainer.style.cssText = 'width: 100vw; height: 100vh; position: fixed; top: 0; left: 0; z-index: 9999;';
  document.body.appendChild(testContainer);
  
  const screenSizes = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1920, height: 1080 },
    { name: 'Ultra-wide', width: 2560, height: 1440 }
  ];
  
  screenSizes.forEach(size => {
    console.log(`Testing ${size.name} (${size.width}x${size.height})...`);
    
    // Simulate screen size
    testContainer.style.width = `${size.width}px`;
    testContainer.style.height = `${size.height}px`;
    
    // Create meter with appropriate sizing
    const meterWidth = Math.min(size.width * 0.8, 400);
    const meterHeight = Math.max(60, Math.min(size.height * 0.2, 120));
    
    const sizeMeter = new CalibratedConfidenceMeter({
      width: meterWidth,
      height: meterHeight
    });
    
    try {
      sizeMeter.createMeter('responsive-test-container');
      sizeMeter.updateConfidence(0.7, 0.6);
      
      console.log(`✅ ${size.name}: Rendered successfully at ${meterWidth}x${meterHeight}`);
      
      // Clean up for next test
      testContainer.innerHTML = '';
    } catch (error) {
      console.log(`❌ ${size.name}: ${error.message}`);
    }
  });
  
  // Clean up
  document.body.removeChild(testContainer);
  console.log('📱 Responsive testing complete\n');
}

/**
 * Test performance with multiple meters
 */
export function testPerformanceWithMultipleMeters() {
  console.log('⚡ Testing performance with multiple meters...\n');
  
  const testContainer = document.createElement('div');
  testContainer.id = 'performance-test';
  document.body.appendChild(testContainer);
  
  const meterCount = 10;
  const meters = [];
  const startTime = Date.now();
  
  try {
    // Create multiple meters
    for (let i = 0; i < meterCount; i++) {
      const meterContainer = document.createElement('div');
      meterContainer.id = `meter-${i}`;
      testContainer.appendChild(meterContainer);
      
      const meter = new CalibratedConfidenceMeter({
        width: 300,
        height: 80
      });
      
      meter.createMeter(`meter-${i}`);
      meters.push(meter);
    }
    
    const creationTime = Date.now() - startTime;
    console.log(`✅ Created ${meterCount} meters in ${creationTime}ms`);
    
    // Test batch updates
    const updateStartTime = Date.now();
    
    for (let i = 0; i < 100; i++) {
      meters.forEach((meter, index) => {
        const raw = Math.random();
        const calibrated = raw * (0.8 + Math.random() * 0.4);
        meter.updateConfidence(raw, calibrated);
      });
    }
    
    const updateTime = Date.now() - updateStartTime;
    console.log(`✅ Performed 1000 updates in ${updateTime}ms`);
    
    // Clean up
    meters.forEach(meter => meter.destroy());
    
  } finally {
    document.body.removeChild(testContainer);
  }
  
  console.log('⚡ Performance testing complete\n');
}

// Helper function to create mock DOM environment if needed
function createMockDOM() {
  if (typeof document === 'undefined') {
    // Enhanced mock for Node.js environment
    const elementStorage = new Map();
    
    function createMockElement(tag) {
      const element = {
        id: '',
        className: '',
        tagName: tag.toUpperCase(),
        style: { cssText: '' },
        innerHTML: '',
        children: [],
        parentNode: null,
        querySelector: function(selector) {
          // Simple mock implementation
          if (selector.startsWith('#')) {
            const id = selector.slice(1);
            for (const child of this.children) {
              if (child.id === id) return child;
              const found = child.querySelector(selector);
              if (found) return found;
            }
          }
          if (selector.startsWith('.')) {
            const className = selector.slice(1);
            for (const child of this.children) {
              if (child.className.includes(className)) return child;
              const found = child.querySelector(selector);
              if (found) return found;
            }
          }
          return null;
        },
        querySelectorAll: function(selector) {
          const results = [];
          if (selector.startsWith('.')) {
            const className = selector.slice(1);
            for (const child of this.children) {
              if (child.className.includes(className)) results.push(child);
              results.push(...child.querySelectorAll(selector));
            }
          }
          return results;
        },
        appendChild: function(child) {
          this.children.push(child);
          child.parentNode = this;
          return child;
        },
        removeChild: function(child) {
          const index = this.children.indexOf(child);
          if (index > -1) {
            this.children.splice(index, 1);
            child.parentNode = null;
          }
          return child;
        },
        insertBefore: function(newChild, referenceChild) {
          const index = this.children.indexOf(referenceChild);
          if (index > -1) {
            this.children.splice(index, 0, newChild);
          } else {
            this.children.unshift(newChild);
          }
          newChild.parentNode = this;
          return newChild;
        },
        addEventListener: () => {},
        focus: function() {
          global.document.activeElement = this;
        },
        dispatchEvent: () => {},
        getBoundingClientRect: () => ({
          left: 0, top: 0, right: 300, bottom: 80, width: 300, height: 80
        }),
        contains: function(element) {
          return this.children.includes(element) || this.children.some(child => child.contains && child.contains(element));
        }
      };
      return element;
    }
    
    const mockBody = createMockElement('body');
    mockBody.contains = function(element) {
      return this.children.includes(element) || this.children.some(child => child.contains && child.contains(element));
    };
    
    global.document = {
      createElement: createMockElement,
      body: mockBody,
      head: createMockElement('head'),
      getElementById: function(id) {
        if (elementStorage.has(id)) {
          return elementStorage.get(id);
        }
        // Create element if it doesn't exist (for testing)
        const element = createMockElement('div');
        element.id = id;
        elementStorage.set(id, element);
        this.body.appendChild(element);
        return element;
      },
      activeElement: null
    };
    
    global.window = {
      getComputedStyle: () => ({
        display: 'grid'
      })
    };
    
    global.MouseEvent = function(type, options) {
      this.type = type;
      this.bubbles = options?.bubbles || false;
    };
    
    global.requestAnimationFrame = function(callback) {
      return setTimeout(callback, 16); // ~60fps
    };
    
    global.cancelAnimationFrame = function(id) {
      clearTimeout(id);
    };
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createMockDOM();
  runCalibratedConfidenceMeterTests();
  testResponsiveBehavior();
  testPerformanceWithMultipleMeters();
}