/**
 * Integration Example for Evidence Drill-down
 * Shows how to integrate with existing Laws Tab and Legend Map
 */

import { EvidenceDrillDown, integrateDrillDown } from './evidence-drill-down.js';
import { LawDiffView } from './law-diff-view.js';

// Example UI System that integrates multiple components
class ConsciousnessMeshUI {
  constructor() {
    this.components = new Map();
    this.dataSource = new ConsciousnessMeshDataSource();
    this.config = {
      legendMapUrl: './legend-map.html',
      theme: 'dark'
    };
  }
  
  /**
   * Initialize UI components
   */
  initialize() {
    // Create Diff View
    this.diffView = new LawDiffView();
    this.components.set('diffView', this.diffView);
    
    // Create and integrate Drill-down
    this.drillDown = integrateDrillDown(this);
    this.components.set('drillDown', this.drillDown);
    
    // Attach event handlers to existing laws
    this.attachLawClickHandlers();
    
    console.log('✅ UI System initialized with drill-down integration');
  }
  
  /**
   * Attach click handlers to law elements
   */
  attachLawClickHandlers(callback) {
    // In real implementation, this would find all law elements
    // and add click handlers
    if (callback) {
      this.lawClickHandler = callback;
    }
    
    // Example: attach to existing law cards
    document.addEventListener('click', (e) => {
      const lawCard = e.target.closest('.law-card');
      if (lawCard) {
        const lawId = lawCard.getAttribute('data-law-id');
        if (lawId) {
          e.preventDefault();
          // Show drill-down when law is clicked
          this.showEvidenceDrillDown(lawId);
        }
      }
    });
  }
  
  /**
   * Create example Laws Tab UI
   */
  createLawsTab(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const lawsHtml = `
      <div class="laws-tab">
        <h2>Temporal Laws</h2>
        <div class="laws-grid">
          ${this.createLawCards()}
        </div>
      </div>
    `;
    
    container.innerHTML = lawsHtml;
  }
  
  /**
   * Create law cards with click areas
   */
  createLawCards() {
    const laws = this.dataSource.getAllLaws();
    
    return laws.map(law => `
      <div class="law-card" data-law-id="${law.id}">
        <div class="law-header">
          <h3>${law.title}</h3>
          <span class="confidence">${(law.confidence * 100).toFixed(1)}%</span>
        </div>
        <p class="law-description">${law.description}</p>
        <div class="law-actions">
          <button class="view-evidence-btn" data-law-id="${law.id}">
            📊 View Evidence
          </button>
          <button class="view-diff-btn" data-law-id="${law.id}">
            🔍 View Changes
          </button>
        </div>
      </div>
    `).join('');
  }
}

// Mock data source for testing
class ConsciousnessMeshDataSource {
  constructor() {
    this.laws = [
      {
        id: 'temporal-drift',
        title: 'Temporal Drift Law',
        description: 'Events tend to drift in perceived time',
        confidence: 0.85,
        parameters: { drift_rate: 0.1, variance: 0.05 }
      },
      {
        id: 'resonance-peaks',
        title: 'Resonance Peak Detection',
        description: 'Consciousness resonates at specific frequencies',
        confidence: 0.72,
        parameters: { peak_freq: 40, bandwidth: 5 }
      },
      {
        id: 'mirror-symmetry',
        title: 'Mirror Symmetry Principle',
        description: 'Mirrored patterns indicate conscious observation',
        confidence: 0.93,
        parameters: { symmetry_threshold: 0.8 }
      }
    ];
    
    this.events = new Map();
    this.generateMockEvents();
  }
  
  getAllLaws() {
    return this.laws;
  }
  
  async getEventsForLaw(lawId) {
    // Simulate async data fetching
    await new Promise(resolve => setTimeout(resolve, 100));
    return this.events.get(lawId) || [];
  }
  
  generateMockEvents() {
    // Generate events for each law
    this.laws.forEach(law => {
      const events = [];
      const now = Date.now();
      
      for (let i = 0; i < 30; i++) {
        events.push({
          id: `${law.id}-event-${i}`,
          lawId: law.id,
          timestamp: now - Math.random() * 86400000 * 7, // Last 7 days
          type: ['measurement', 'prediction', 'anomaly'][Math.floor(Math.random() * 3)],
          weight: Math.random(),
          residual: (Math.random() - 0.5) * 2,
          confidence: law.confidence + (Math.random() - 0.5) * 0.2,
          data: {
            source: `sensor-${Math.floor(Math.random() * 5)}`,
            value: Math.random() * 100,
            processed: true
          },
          location: {
            x: Math.random() * 1000,
            y: Math.random() * 800,
            layer: Math.floor(Math.random() * 3)
          }
        });
      }
      
      this.events.set(law.id, events);
    });
  }
}

// Example usage and demonstration
export function demonstrateDrillDownIntegration() {
  console.log('🔄 Demonstrating Evidence Drill-down Integration\n');
  
  // Create UI system
  const ui = new ConsciousnessMeshUI();
  ui.initialize();
  
  // Create example container
  if (typeof document !== 'undefined') {
    const demoContainer = document.createElement('div');
    demoContainer.id = 'demo-container';
    demoContainer.innerHTML = `
      <div id="laws-container"></div>
      <div id="drill-down-container"></div>
    `;
    document.body.appendChild(demoContainer);
    
    // Create laws tab
    ui.createLawsTab('laws-container');
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .laws-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
        padding: 20px;
      }
      
      .law-card {
        background: rgba(30, 41, 59, 0.8);
        border: 1px solid rgba(139, 92, 246, 0.3);
        border-radius: 12px;
        padding: 20px;
        cursor: pointer;
        transition: all 0.3s;
      }
      
      .law-card:hover {
        border-color: rgba(139, 92, 246, 0.6);
        transform: translateY(-2px);
      }
      
      .law-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }
      
      .law-header h3 {
        color: #e0e7ff;
        margin: 0;
      }
      
      .confidence {
        background: rgba(139, 92, 246, 0.2);
        color: #a78bfa;
        padding: 4px 12px;
        border-radius: 20px;
        font-weight: 600;
      }
      
      .law-description {
        color: #94a3b8;
        margin-bottom: 16px;
      }
      
      .law-actions {
        display: flex;
        gap: 12px;
      }
      
      .law-actions button {
        background: rgba(139, 92, 246, 0.1);
        border: 1px solid rgba(139, 92, 246, 0.3);
        color: #e0e7ff;
        padding: 8px 16px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .law-actions button:hover {
        background: rgba(139, 92, 246, 0.2);
        border-color: rgba(139, 92, 246, 0.5);
      }
    `;
    document.head.appendChild(style);
    
    console.log('✅ Demo UI created - click on law cards to see drill-down');
  }
  
  // Demonstrate programmatic drill-down
  console.log('\n📊 Programmatic drill-down example:');
  ui.showEvidenceDrillDown('temporal-drift');
  
  // Show integration points
  console.log('\n🔗 Integration points:');
  console.log('   • Data source provides events for each law');
  console.log('   • Click handlers automatically show drill-down');
  console.log('   • Legend Map links connect to visualization');
  console.log('   • Export functionality preserves all event data');
  console.log('   • Filters allow real-time data exploration');
  
  return ui;
}

// Run demonstration if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  // Simple mock for Node.js
  if (typeof document === 'undefined') {
    global.document = {
      createElement: () => ({
        id: '',
        innerHTML: '',
        appendChild: () => {},
        addEventListener: () => {}
      }),
      getElementById: () => null,
      body: { appendChild: () => {} },
      head: { appendChild: () => {} },
      addEventListener: () => {}
    };
  }
  
  demonstrateDrillDownIntegration();
}