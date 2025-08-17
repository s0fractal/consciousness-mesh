/**
 * Quick test runner for calibrated confidence meter
 * Avoids animation loops that can hang in Node.js
 */

import { CalibratedConfidenceMeter } from './calibrated-confidence-meter.js';

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

// Mock animation frame to prevent hanging
global.requestAnimationFrame = function(callback) {
  return setTimeout(callback, 16);
};

global.cancelAnimationFrame = function(id) {
  clearTimeout(id);
};

console.log('🧪 Testing Calibrated Confidence Meter Adaptiveness\n');

try {
  // Test 1: Basic functionality
  console.log('1️⃣ Testing basic functionality...');
  const meter = new CalibratedConfidenceMeter({
    width: 300,
    height: 80,
    showLabels: true,
    showValues: true,
    showDelta: true
  });
  
  meter.updateConfidence(0.7, 0.6);
  
  if (meter.currentValues.raw === 0.7 && meter.currentValues.calibrated === 0.6) {
    console.log('✅ Basic value updates working');
  } else {
    console.log('❌ Basic value updates failed');
  }
  
  // Test 2: Responsive sizing
  console.log('\n2️⃣ Testing responsive sizing...');
  const sizes = [
    { width: 200, height: 60, name: 'Small' },
    { width: 400, height: 100, name: 'Medium' },
    { width: 600, height: 120, name: 'Large' }
  ];
  
  sizes.forEach(size => {
    meter.setSize(size.width, size.height);
    if (meter.config.width === size.width && meter.config.height === size.height) {
      console.log(`✅ ${size.name} size (${size.width}x${size.height}) - OK`);
    } else {
      console.log(`❌ ${size.name} size (${size.width}x${size.height}) - Failed`);
    }
  });
  
  // Test 3: DOM creation (without animation loop)
  console.log('\n3️⃣ Testing DOM creation...');
  
  // Override the startAnimation method to prevent hanging
  const originalStartAnimation = meter.startAnimation;
  meter.startAnimation = function() {
    console.log('  🔄 Animation would start here (skipped in tests)');
  };
  
  try {
    const component = meter.createMeter('test-container');
    
    if (component && component.querySelector('.confidence-header')) {
      console.log('✅ DOM component created successfully');
    } else {
      console.log('❌ DOM component creation failed');
    }
    
    // Test element structure
    const barContainers = component.querySelectorAll('.confidence-bar-container');
    if (barContainers.length === 2) {
      console.log('✅ Dual bars created (raw + calibrated)');
    } else {
      console.log('❌ Dual bars creation failed');
    }
    
  } catch (error) {
    console.log(`❌ DOM creation error: ${error.message}`);
  }
  
  // Test 4: Color adaptation
  console.log('\n4️⃣ Testing color adaptation...');
  const lowColor = meter.getConfidenceColor('raw', 0.2);
  const mediumColor = meter.getConfidenceColor('raw', 0.5);
  const highColor = meter.getConfidenceColor('raw', 0.8);
  
  if (lowColor !== mediumColor && mediumColor !== highColor) {
    console.log('✅ Color thresholds working correctly');
  } else {
    console.log('❌ Color thresholds failed');
  }
  
  // Test 5: Configuration adaptability
  console.log('\n5️⃣ Testing configuration adaptability...');
  meter.updateConfig({
    precision: 6,
    threshold: 0.0001,
    colors: {
      raw: { low: '#ff0000', medium: '#ffff00', high: '#00ff00' }
    }
  });
  
  if (meter.config.precision === 6 && meter.config.threshold === 0.0001) {
    console.log('✅ Configuration updates working');
  } else {
    console.log('❌ Configuration updates failed');
  }
  
  // Test 6: Edge cases
  console.log('\n6️⃣ Testing edge cases...');
  const edgeCases = [
    [0, 0, 'Zero values'],
    [1, 1, 'Maximum values'],
    [0.001, 0.999, 'Extreme difference'],
    [-0.1, 1.5, 'Out of range (should be clamped)']
  ];
  
  edgeCases.forEach(([raw, calibrated, description]) => {
    meter.updateConfidence(raw, calibrated);
    const values = meter.getValues();
    
    if (values.raw >= 0 && values.raw <= 1 && values.calibrated >= 0 && values.calibrated <= 1) {
      console.log(`✅ ${description} - handled correctly`);
    } else {
      console.log(`❌ ${description} - failed validation`);
    }
  });
  
  console.log('\n🎉 Adaptiveness testing complete!');
  console.log('📊 The calibrated confidence meter demonstrates:');
  console.log('   • Responsive sizing across different dimensions');
  console.log('   • Adaptive color schemes based on confidence levels');
  console.log('   • Flexible configuration options');
  console.log('   • Robust edge case handling');
  console.log('   • Clean DOM structure with dual-layer design');
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error(error.stack);
}