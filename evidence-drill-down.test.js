/**
 * Tests for Evidence Drill-down Component
 * Verifies functionality for displaying event details and Legend Map integration
 */

import { EvidenceDrillDown, integrateDrillDown, createStandaloneDrillDown } from './evidence-drill-down.js';

export function runEvidenceDrillDownTests() {
  console.log('🔍 Running Evidence Drill-down Tests...\n');
  
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
    runTest('Should create drill-down instance', () => {
      const drillDown = new EvidenceDrillDown();
      
      if (!drillDown) {
        throw new Error('Drill-down instance not created');
      }
      
      if (typeof drillDown.createDrillDown !== 'function') {
        throw new Error('createDrillDown method not found');
      }
      
      if (typeof drillDown.loadEvents !== 'function') {
        throw new Error('loadEvents method not found');
      }
    });
    
    runTest('Should accept configuration options', () => {
      const config = {
        maxEventsToShow: 50,
        sortBy: 'weight',
        sortOrder: 'asc',
        showFilters: false,
        legendMapUrl: './custom-map.html',
        theme: 'light'
      };
      
      const drillDown = new EvidenceDrillDown(config);
      
      if (drillDown.config.maxEventsToShow !== 50) {
        throw new Error('maxEventsToShow not set correctly');
      }
      
      if (drillDown.config.sortBy !== 'weight') {
        throw new Error('sortBy not set correctly');
      }
      
      if (drillDown.config.showFilters !== false) {
        throw new Error('showFilters not set correctly');
      }
      
      if (drillDown.config.legendMapUrl !== './custom-map.html') {
        throw new Error('legendMapUrl not set correctly');
      }
    });
    
    // Test 2: Event Loading and Filtering
    console.log('\n2️⃣ Testing event loading and filtering...');
    runTest('Should generate mock events when no data source', () => {
      const drillDown = new EvidenceDrillDown();
      const events = drillDown.generateMockEvents('test-law');
      
      if (!Array.isArray(events)) {
        throw new Error('Mock events not an array');
      }
      
      if (events.length !== 50) {
        throw new Error(`Expected 50 mock events, got ${events.length}`);
      }
      
      // Check event structure
      const event = events[0];
      if (!event.id || !event.timestamp || typeof event.weight !== 'number') {
        throw new Error('Mock event missing required fields');
      }
      
      if (!event.location || typeof event.location.x !== 'number') {
        throw new Error('Mock event missing location data');
      }
    });
    
    runTest('Should filter events by weight', () => {
      const drillDown = new EvidenceDrillDown();
      
      // Create test events
      drillDown.events = [
        { id: '1', weight: 0.1, timestamp: Date.now(), residual: 0.1 },
        { id: '2', weight: 0.5, timestamp: Date.now(), residual: 0.2 },
        { id: '3', weight: 0.9, timestamp: Date.now(), residual: 0.3 }
      ];
      
      // Apply weight filter
      drillDown.filters.minWeight = 0.4;
      drillDown.filters.maxWeight = 0.8;
      drillDown.applyFilters();
      
      if (drillDown.filteredEvents.length !== 1) {
        throw new Error(`Expected 1 filtered event, got ${drillDown.filteredEvents.length}`);
      }
      
      if (drillDown.filteredEvents[0].id !== '2') {
        throw new Error('Wrong event filtered');
      }
    });
    
    runTest('Should filter events by time range', () => {
      const drillDown = new EvidenceDrillDown();
      const now = Date.now();
      
      // Create test events
      drillDown.events = [
        { id: '1', weight: 0.5, timestamp: now - 3600000, residual: 0.1 }, // 1 hour ago
        { id: '2', weight: 0.5, timestamp: now - 1800000, residual: 0.2 }, // 30 min ago
        { id: '3', weight: 0.5, timestamp: now - 900000, residual: 0.3 }   // 15 min ago
      ];
      
      // Apply time filter
      drillDown.filters.startTime = now - 2700000; // 45 min ago
      drillDown.applyFilters();
      
      if (drillDown.filteredEvents.length !== 2) {
        throw new Error(`Expected 2 filtered events, got ${drillDown.filteredEvents.length}`);
      }
    });
    
    runTest('Should sort events correctly', () => {
      const drillDown = new EvidenceDrillDown({ sortBy: 'weight', sortOrder: 'desc' });
      
      // Create test events
      drillDown.events = [
        { id: '1', weight: 0.3, timestamp: 1, residual: 0.9 },
        { id: '2', weight: 0.7, timestamp: 2, residual: 0.1 },
        { id: '3', weight: 0.5, timestamp: 3, residual: 0.5 }
      ];
      
      drillDown.applyFilters();
      
      // Check descending weight order
      if (drillDown.filteredEvents[0].weight !== 0.7) {
        throw new Error('Events not sorted by weight correctly');
      }
      
      // Test ascending order
      drillDown.config.sortOrder = 'asc';
      drillDown.applyFilters();
      
      if (drillDown.filteredEvents[0].weight !== 0.3) {
        throw new Error('Events not sorted in ascending order');
      }
      
      // Test residual sorting
      drillDown.config.sortBy = 'residual';
      drillDown.config.sortOrder = 'desc';
      drillDown.applyFilters();
      
      if (drillDown.filteredEvents[0].residual !== 0.9) {
        throw new Error('Events not sorted by residual correctly');
      }
    });
    
    // Test 3: UI Component Creation
    console.log('\n3️⃣ Testing UI component creation...');
    runTest('Should create drill-down UI without errors', () => {
      const drillDown = new EvidenceDrillDown();
      
      // Create test container
      const testContainer = document.createElement('div');
      testContainer.id = 'test-drill-down';
      document.body.appendChild(testContainer);
      
      try {
        const component = drillDown.createDrillDown('test-drill-down', 'test-law');
        
        if (!component) {
          throw new Error('Component not created');
        }
        
        if (!component.querySelector('.drill-down-header')) {
          throw new Error('Header not found');
        }
        
        if (!component.querySelector('.events-list')) {
          throw new Error('Events list not found');
        }
      } finally {
        document.body.removeChild(testContainer);
      }
    });
    
    runTest('Should create filter controls when enabled', () => {
      const drillDown = new EvidenceDrillDown({ showFilters: true });
      
      // Create test container
      const testContainer = document.createElement('div');
      testContainer.id = 'test-filters';
      document.body.appendChild(testContainer);
      
      try {
        drillDown.createDrillDown('test-filters', 'test-law');
        
        const filters = testContainer.querySelector('.drill-down-filters');
        if (!filters) {
          throw new Error('Filters section not created');
        }
        
        if (!filters.querySelector('#min-weight')) {
          throw new Error('Min weight filter not found');
        }
        
        if (!filters.querySelector('#sort-by')) {
          throw new Error('Sort by selector not found');
        }
      } finally {
        document.body.removeChild(testContainer);
      }
    });
    
    runTest('Should create summary section when enabled', () => {
      const drillDown = new EvidenceDrillDown({ showSummary: true });
      
      // Create test container
      const testContainer = document.createElement('div');
      testContainer.id = 'test-summary';
      document.body.appendChild(testContainer);
      
      try {
        drillDown.createDrillDown('test-summary', 'test-law');
        
        const summary = testContainer.querySelector('.drill-down-summary');
        if (!summary) {
          throw new Error('Summary section not created');
        }
        
        if (!summary.querySelector('#total-events')) {
          throw new Error('Total events stat not found');
        }
        
        if (!summary.querySelector('#avg-weight')) {
          throw new Error('Average weight stat not found');
        }
      } finally {
        document.body.removeChild(testContainer);
      }
    });
    
    // Test 4: Legend Map Integration
    console.log('\n4️⃣ Testing Legend Map integration...');
    runTest('Should create Legend Map links with anchor format', () => {
      const drillDown = new EvidenceDrillDown({ 
        legendMapUrl: './legend.html',
        legendMapLinkType: 'anchor'
      });
      
      const event = {
        id: 'test-event',
        location: { x: 100, y: 200, layer: 3 }
      };
      
      const linkHtml = drillDown.createLegendMapLink(event);
      
      if (!linkHtml.includes('./legend.html#event-test-event')) {
        throw new Error('Anchor link format incorrect');
      }
      
      if (!linkHtml.includes('legend-map-link')) {
        throw new Error('Link class not applied');
      }
    });
    
    runTest('Should create Legend Map links with query format', () => {
      const drillDown = new EvidenceDrillDown({ 
        legendMapUrl: './legend.html',
        legendMapLinkType: 'query'
      });
      
      const event = {
        id: 'test-event',
        location: { x: 100, y: 200, layer: 3 }
      };
      
      const linkHtml = drillDown.createLegendMapLink(event);
      
      if (!linkHtml.includes('eventId=test-event')) {
        throw new Error('Event ID not in query params');
      }
      
      if (!linkHtml.includes('x=100')) {
        throw new Error('X coordinate not in query params');
      }
      
      if (!linkHtml.includes('layer=3')) {
        throw new Error('Layer not in query params');
      }
    });
    
    runTest('Should handle events without location data', () => {
      const drillDown = new EvidenceDrillDown();
      
      const event = {
        id: 'test-event',
        location: null
      };
      
      const linkHtml = drillDown.createLegendMapLink(event);
      
      if (!linkHtml.includes('no-location')) {
        throw new Error('No location message not shown');
      }
    });
    
    // Test 5: Event Rendering
    console.log('\n5️⃣ Testing event rendering...');
    runTest('Should render event elements correctly', () => {
      const drillDown = new EvidenceDrillDown();
      
      const event = {
        id: 'test-1',
        timestamp: Date.now(),
        type: 'measurement',
        weight: 0.75,
        residual: -0.25,
        confidence: 0.85,
        data: { sensor: 'test', value: 42 },
        location: { x: 100, y: 200 }
      };
      
      const eventElement = drillDown.createEventElement(event, 0);
      
      if (!eventElement.classList.contains('event-item')) {
        throw new Error('Event item class not applied');
      }
      
      if (!eventElement.querySelector('.event-type.measurement')) {
        throw new Error('Event type not displayed');
      }
      
      if (!eventElement.querySelector('.weight-bar')) {
        throw new Error('Weight bar not created');
      }
      
      const weightBar = eventElement.querySelector('.weight-bar');
      if (!weightBar.style.width.includes('75%')) {
        throw new Error('Weight bar width incorrect');
      }
    });
    
    runTest('Should apply compact mode styling', () => {
      const drillDown = new EvidenceDrillDown({ compactMode: true });
      
      const event = {
        id: 'test-1',
        timestamp: Date.now(),
        type: 'measurement',
        weight: 0.5,
        residual: 0,
        confidence: 0.5,
        data: { test: true }
      };
      
      const eventElement = drillDown.createEventElement(event, 0);
      
      if (!eventElement.classList.contains('compact')) {
        throw new Error('Compact class not applied');
      }
    });
    
    // Test 6: Summary Statistics
    console.log('\n6️⃣ Testing summary statistics...');
    runTest('Should calculate summary statistics correctly', () => {
      const drillDown = new EvidenceDrillDown({ showSummary: true });
      
      // Create test container
      const testContainer = document.createElement('div');
      testContainer.id = 'test-stats';
      document.body.appendChild(testContainer);
      
      try {
        drillDown.createDrillDown('test-stats', 'test-law');
        
        // Set test events
        drillDown.filteredEvents = [
          { weight: 0.2, residual: 0.1, timestamp: Date.now() - 3600000 },
          { weight: 0.3, residual: -0.2, timestamp: Date.now() - 1800000 },
          { weight: 0.5, residual: 0.3, timestamp: Date.now() }
        ];
        
        drillDown.updateSummary();
        
        const totalEvents = document.getElementById('total-events');
        if (totalEvents.textContent !== '3') {
          throw new Error('Total events count incorrect');
        }
        
        const avgWeight = document.getElementById('avg-weight');
        const avgValue = parseFloat(avgWeight.textContent);
        if (Math.abs(avgValue - 0.3333) > 0.001) {
          throw new Error('Average weight calculation incorrect');
        }
        
        const timeSpan = document.getElementById('time-span');
        if (!timeSpan.textContent.includes('60 minutes')) {
          throw new Error('Time span calculation incorrect');
        }
      } finally {
        document.body.removeChild(testContainer);
      }
    });
    
    // Test 7: Export Functionality
    console.log('\n7️⃣ Testing export functionality...');
    runTest('Should export evidence data correctly', () => {
      let exportedData = null;
      
      const drillDown = new EvidenceDrillDown({
        onExport: (data) => {
          exportedData = data;
        }
      });
      
      drillDown.currentLawId = 'test-law';
      drillDown.filteredEvents = [
        { id: '1', weight: 0.5, timestamp: Date.now() }
      ];
      
      drillDown.exportEvidence();
      
      if (!exportedData) {
        throw new Error('Export callback not triggered');
      }
      
      if (exportedData.lawId !== 'test-law') {
        throw new Error('Law ID not included in export');
      }
      
      if (!exportedData.exportDate) {
        throw new Error('Export date not included');
      }
      
      if (exportedData.filteredEvents !== 1) {
        throw new Error('Filtered events count incorrect');
      }
    });
    
    // Test 8: Integration Features
    console.log('\n8️⃣ Testing integration features...');
    runTest('Should integrate with UI system', () => {
      const mockUISystem = {
        dataSource: {
          getEventsForLaw: async (lawId) => {
            return [
              { id: '1', lawId, weight: 0.5 },
              { id: '2', lawId, weight: 0.7 }
            ];
          }
        },
        config: {
          legendMapUrl: './custom-legend.html'
        }
      };
      
      const drillDown = integrateDrillDown(mockUISystem);
      
      if (typeof mockUISystem.showEvidenceDrillDown !== 'function') {
        throw new Error('showEvidenceDrillDown method not added');
      }
      
      if (drillDown.config.legendMapUrl !== './custom-legend.html') {
        throw new Error('Legend map URL not inherited from UI system');
      }
    });
    
    runTest('Should create standalone drill-down', () => {
      // Create temporary container
      const originalBody = document.body.innerHTML;
      
      try {
        const drillDown = createStandaloneDrillDown('test-law', {
          theme: 'light'
        });
        
        if (!drillDown) {
          throw new Error('Standalone drill-down not created');
        }
        
        const component = document.querySelector('.evidence-drill-down');
        if (!component) {
          throw new Error('Component not added to DOM');
        }
        
        if (!component.classList.contains('light')) {
          throw new Error('Theme not applied');
        }
      } finally {
        // Clean up
        document.body.innerHTML = originalBody;
      }
    });
    
    // Test 9: Error Handling
    console.log('\n9️⃣ Testing error handling...');
    runTest('Should handle missing container gracefully', () => {
      const drillDown = new EvidenceDrillDown();
      
      try {
        drillDown.createDrillDown('nonexistent-container', 'test-law');
        // Should use document.body as fallback
        
        const component = document.body.querySelector('.evidence-drill-down');
        if (!component) {
          throw new Error('Component not created with fallback container');
        }
      } finally {
        // Clean up
        const component = document.body.querySelector('.evidence-drill-down');
        if (component) component.remove();
      }
    });
    
    runTest('Should handle data loading errors', async () => {
      const drillDown = new EvidenceDrillDown({
        dataSource: {
          getEventsForLaw: async () => {
            throw new Error('Data load failed');
          }
        }
      });
      
      // Create test container
      const testContainer = document.createElement('div');
      testContainer.id = 'test-error';
      document.body.appendChild(testContainer);
      
      try {
        drillDown.createDrillDown('test-error', 'test-law');
        
        // Wait a bit for async loading
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const errorMessage = testContainer.querySelector('.drill-down-error');
        if (!errorMessage) {
          throw new Error('Error message not displayed');
        }
      } finally {
        document.body.removeChild(testContainer);
      }
    });
    
    // Test 10: State Management
    console.log('\n🔟 Testing state management...');
    runTest('Should track component state correctly', () => {
      const drillDown = new EvidenceDrillDown();
      
      drillDown.currentLawId = 'test-law';
      drillDown.events = [1, 2, 3, 4, 5];
      drillDown.filteredEvents = [1, 2, 3];
      drillDown.filters.minWeight = 0.5;
      
      const state = drillDown.getState();
      
      if (state.lawId !== 'test-law') {
        throw new Error('Law ID not in state');
      }
      
      if (state.events !== 5) {
        throw new Error('Events count incorrect in state');
      }
      
      if (state.filteredEvents !== 3) {
        throw new Error('Filtered events count incorrect in state');
      }
      
      if (state.filters.minWeight !== 0.5) {
        throw new Error('Filters not included in state');
      }
    });
    
    runTest('Should update configuration dynamically', () => {
      const drillDown = new EvidenceDrillDown({ sortBy: 'timestamp' });
      
      drillDown.updateConfig({
        sortBy: 'weight',
        maxEventsToShow: 25
      });
      
      if (drillDown.config.sortBy !== 'weight') {
        throw new Error('Config not updated');
      }
      
      if (drillDown.config.maxEventsToShow !== 25) {
        throw new Error('Max events config not updated');
      }
    });
    
    runTest('Should close drill-down cleanly', () => {
      const drillDown = new EvidenceDrillDown();
      
      // Create test container
      const testContainer = document.createElement('div');
      testContainer.id = 'test-close';
      document.body.appendChild(testContainer);
      
      try {
        drillDown.createDrillDown('test-close', 'test-law');
        
        // Verify component exists
        const component = testContainer.querySelector('.evidence-drill-down');
        if (!component) {
          throw new Error('Component not created');
        }
        
        // Close it
        drillDown.close();
        
        // Verify it's removed
        const afterClose = testContainer.querySelector('.evidence-drill-down');
        if (afterClose) {
          throw new Error('Component not removed after close');
        }
        
        // Verify state is reset
        if (drillDown.currentLawId !== null) {
          throw new Error('State not reset after close');
        }
      } finally {
        document.body.removeChild(testContainer);
      }
    });
    
    console.log(`\n📊 Test Results: ${testSuite.passed}/${testSuite.passed + testSuite.failed} tests passed`);
    
    if (testSuite.failed === 0) {
      console.log('🎉 All Evidence Drill-down tests passed!');
      console.log('✨ Component ready for production use');
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
    const elementMap = new Map();
    let elementIdCounter = 0;
    
    function createMockElement(tag) {
      const element = {
        tagName: tag.toUpperCase(),
        id: '',
        className: '',
        classList: {
          contains: function(cls) { 
            return this.classes.includes(cls); 
          },
          add: function(cls) { 
            if (!this.classes.includes(cls)) {
              this.classes.push(cls);
              element.className = this.classes.join(' ');
            }
          },
          classes: []
        },
        style: { cssText: '', width: '' },
        innerHTML: '',
        textContent: '',
        children: [],
        parentNode: null,
        value: '',
        type: '',
        min: '',
        max: '',
        step: '',
        querySelector: function(selector) {
          if (selector.startsWith('#')) {
            const id = selector.slice(1);
            return this.findById(id);
          }
          if (selector.startsWith('.')) {
            const className = selector.slice(1);
            return this.findByClass(className);
          }
          return this.findByTag(selector);
        },
        querySelectorAll: function(selector) {
          const results = [];
          if (selector.startsWith('.')) {
            const className = selector.slice(1);
            this.findAllByClass(className, results);
          }
          return results;
        },
        appendChild: function(child) {
          this.children.push(child);
          child.parentNode = this;
          // Parse innerHTML to create child elements
          if (this.innerHTML) {
            this.parseInnerHTML();
          }
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
        addEventListener: () => {},
        setAttribute: function(name, value) {
          this[name] = value;
        },
        remove: function() {
          if (this.parentNode) {
            this.parentNode.removeChild(this);
          }
        },
        findById: function(id) {
          if (this.id === id) return this;
          for (const child of this.children) {
            const found = child.findById && child.findById(id);
            if (found) return found;
          }
          return null;
        },
        findByClass: function(className) {
          if (this.classList.contains(className)) return this;
          for (const child of this.children) {
            const found = child.findByClass && child.findByClass(className);
            if (found) return found;
          }
          return null;
        },
        findByTag: function(tag) {
          if (this.tagName === tag.toUpperCase()) return this;
          for (const child of this.children) {
            const found = child.findByTag && child.findByTag(tag);
            if (found) return found;
          }
          return null;
        },
        findAllByClass: function(className, results) {
          if (this.classList.contains(className)) results.push(this);
          for (const child of this.children) {
            if (child.findAllByClass) child.findAllByClass(className, results);
          }
        },
        parseInnerHTML: function() {
          // Simple HTML parser for test elements
          const matches = this.innerHTML.match(/<(\w+)[^>]*id="([^"]+)"[^>]*>/g);
          if (matches) {
            matches.forEach(match => {
              const idMatch = match.match(/id="([^"]+)"/);
              if (idMatch) {
                const child = createMockElement('div');
                child.id = idMatch[1];
                this.children.push(child);
                child.parentNode = this;
              }
            });
          }
        }
      };
      
      // Set innerHTML property with getter/setter
      let _innerHTML = '';
      Object.defineProperty(element, 'innerHTML', {
        get: () => _innerHTML,
        set: (value) => {
          _innerHTML = value;
          element.parseInnerHTML();
        }
      });
      
      return element;
    }
    
    const mockBody = createMockElement('body');
    
    global.document = {
      createElement: createMockElement,
      body: mockBody,
      head: createMockElement('head'),
      getElementById: function(id) {
        if (elementMap.has(id)) {
          return elementMap.get(id);
        }
        // Create element if requested by test
        const element = createMockElement('div');
        element.id = id;
        elementMap.set(id, element);
        mockBody.appendChild(element);
        return element;
      },
      querySelector: (selector) => mockBody.querySelector(selector),
      querySelectorAll: (selector) => mockBody.querySelectorAll(selector)
    };
    
    global.Date = Date;
    global.setTimeout = setTimeout;
    global.URL = {
      createObjectURL: () => 'blob:mock-url',
      revokeObjectURL: () => {}
    };
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createMockDOM();
  runEvidenceDrillDownTests();
}