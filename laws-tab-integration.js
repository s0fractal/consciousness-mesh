/**
 * Integration of Diff-View with Laws Tab
 * Connects the diff system to the existing Laws interface
 */

import { LawDiffView, integrateDiffView } from './law-diff-view.js';

export class LawsTabWithDiff {
  constructor(codexEngine) {
    this.codexEngine = codexEngine;
    this.diffView = integrateDiffView(codexEngine);
    this.activeDiffViews = new Map(); // Track active diff components
    
    // Enhanced UI state
    this.uiState = {
      selectedLaw: null,
      showDiffs: true,
      autoRefresh: true,
      refreshInterval: 5000
    };
    
    this.setupAutoRefresh();
  }
  
  /**
   * Enhanced Laws Tab rendering with diff integration
   */
  renderLawsTab(container) {
    const lawsTab = document.createElement('div');
    lawsTab.id = 'laws-tab-with-diff';
    lawsTab.style.cssText = `
      padding: 20px;
      background: linear-gradient(135deg, rgba(20, 20, 30, 0.95), rgba(30, 30, 40, 0.95));
      border-radius: 12px;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      max-height: 80vh;
      overflow-y: auto;
    `;
    
    lawsTab.innerHTML = `
      <div class="laws-header" style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 25px;
        padding-bottom: 15px;
        border-bottom: 2px solid rgba(139, 92, 246, 0.3);
      ">
        <h2 style="
          margin: 0;
          color: #8b5cf6;
          font-size: 24px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 10px;
        ">
          ⚖️ Laws & Changes
        </h2>
        
        <div class="laws-controls" style="display: flex; gap: 10px; align-items: center;">
          <label style="
            display: flex;
            align-items: center;
            gap: 8px;
            color: #e2e8f0;
            font-size: 14px;
            cursor: pointer;
          ">
            <input type="checkbox" id="show-diffs-toggle" ${this.uiState.showDiffs ? 'checked' : ''} style="
              accent-color: #8b5cf6;
              transform: scale(1.2);
            ">
            Show Diffs
          </label>
          
          <label style="
            display: flex;
            align-items: center;
            gap: 8px;
            color: #e2e8f0;
            font-size: 14px;
            cursor: pointer;
          ">
            <input type="checkbox" id="auto-refresh-toggle" ${this.uiState.autoRefresh ? 'checked' : ''} style="
              accent-color: #10b981;
              transform: scale(1.2);
            ">
            Auto Refresh
          </label>
          
          <button id="refresh-all-laws" style="
            padding: 8px 16px;
            background: linear-gradient(135deg, #10b981, #047857);
            border: none;
            border-radius: 6px;
            color: white;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s;
          ">
            🔄 Refresh All
          </button>
        </div>
      </div>
      
      <div id="laws-content">
        <!-- Laws will be rendered here -->
      </div>
    `;
    
    container.appendChild(lawsTab);
    
    // Bind events
    this.bindLawsTabEvents(lawsTab);
    
    // Initial render
    this.refreshLawsContent();
    
    return lawsTab;
  }
  
  /**
   * Refresh laws content with diff integration
   */
  refreshLawsContent() {
    const contentContainer = document.getElementById('laws-content');
    if (!contentContainer) return;
    
    const laws = this.codexEngine.getAllLaws();
    
    if (laws.length === 0) {
      contentContainer.innerHTML = `
        <div style="
          text-align: center;
          color: #94a3b8;
          padding: 60px 20px;
          background: rgba(55, 65, 81, 0.3);
          border-radius: 8px;
          border: 2px dashed rgba(139, 92, 246, 0.3);
        ">
          <div style="font-size: 48px; margin-bottom: 16px;">⚖️</div>
          <h3 style="margin: 0 0 8px 0; color: #8b5cf6;">No Laws Discovered Yet</h3>
          <p style="margin: 0; font-size: 14px;">Laws will appear here as the system discovers temporal patterns</p>
        </div>
      `;
      return;
    }
    
    // Group laws by category or status
    const groupedLaws = this.groupLaws(laws);
    
    let html = '';
    
    Object.entries(groupedLaws).forEach(([category, categoryLaws]) => {
      html += `
        <div class="law-category" style="margin-bottom: 30px;">
          <h3 style="
            color: #e2e8f0;
            font-size: 18px;
            margin-bottom: 15px;
            padding-left: 10px;
            border-left: 3px solid #8b5cf6;
          ">
            ${this.getCategoryIcon(category)} ${category}
            <span style="
              font-size: 14px;
              color: #94a3b8;
              font-weight: normal;
              margin-left: 8px;
            ">(${categoryLaws.length})</span>
          </h3>
          
          <div class="laws-grid" style="
            display: grid;
            gap: 20px;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          ">
            ${categoryLaws.map(law => this.renderLawCard(law)).join('')}
          </div>
        </div>
      `;
    });
    
    contentContainer.innerHTML = html;
    
    // Render diff views if enabled
    if (this.uiState.showDiffs) {
      this.renderAllDiffViews();
    }
    
    // Bind law card events
    this.bindLawCardEvents();
  }
  
  /**
   * Render individual law card
   */
  renderLawCard(law) {
    const latestDiff = this.diffView.getLatestDiff(law.id);
    const hasChanges = latestDiff && latestDiff.changes.total > 0;
    
    return `
      <div class="law-card" data-law-id="${law.id}" style="
        background: rgba(45, 45, 55, 0.8);
        border: 1px solid ${hasChanges ? 'rgba(16, 185, 129, 0.4)' : 'rgba(139, 92, 246, 0.3)'};
        border-radius: 12px;
        padding: 20px;
        transition: all 0.3s;
        cursor: pointer;
        position: relative;
        ${hasChanges ? 'box-shadow: 0 0 20px rgba(16, 185, 129, 0.2);' : ''}
      ">
        ${hasChanges ? `
          <div style="
            position: absolute;
            top: -8px;
            right: -8px;
            background: linear-gradient(135deg, #10b981, #047857);
            color: white;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            animation: pulse 2s infinite;
          ">
            ${latestDiff.changes.total}
          </div>
        ` : ''}
        
        <div class="law-header" style="
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 15px;
        ">
          <div>
            <h4 style="
              margin: 0 0 5px 0;
              color: #f1f5f9;
              font-size: 16px;
              font-weight: 600;
            ">
              ${law.title || law.id}
            </h4>
            <div style="
              font-size: 12px;
              color: #94a3b8;
              display: flex;
              gap: 15px;
            ">
              <span>ID: ${law.id}</span>
              <span>Confidence: ${(law.confidence * 100).toFixed(1)}%</span>
            </div>
          </div>
          
          <div class="confidence-indicator" style="
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: conic-gradient(
              #10b981 0deg,
              #10b981 ${law.confidence * 360}deg,
              rgba(55, 65, 81, 0.5) ${law.confidence * 360}deg,
              rgba(55, 65, 81, 0.5) 360deg
            );
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
          ">
            <div style="
              width: 35px;
              height: 35px;
              background: rgba(45, 45, 55, 0.9);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 10px;
              color: #e2e8f0;
              font-weight: bold;
            ">
              ${Math.round(law.confidence * 100)}%
            </div>
          </div>
        </div>
        
        <div class="law-description" style="
          color: #d1d5db;
          font-size: 14px;
          line-height: 1.5;
          margin-bottom: 15px;
          min-height: 40px;
        ">
          ${law.description || 'No description available'}
        </div>
        
        <div class="law-parameters" style="
          background: rgba(55, 65, 81, 0.5);
          border-radius: 6px;
          padding: 10px;
          margin-bottom: 15px;
        ">
          <div style="
            font-size: 12px;
            color: #8b5cf6;
            font-weight: 600;
            margin-bottom: 8px;
          ">
            Parameters:
          </div>
          ${this.renderParametersSummary(law.parameters)}
        </div>
        
        <div class="law-actions" style="
          display: flex;
          gap: 8px;
          justify-content: space-between;
          align-items: center;
        ">
          <div style="font-size: 12px; color: #94a3b8;">
            Last updated: ${new Date(law.lastUpdated || Date.now()).toLocaleTimeString()}
          </div>
          
          <div style="display: flex; gap: 8px;">
            <button class="toggle-diff-btn" data-law-id="${law.id}" style="
              padding: 4px 8px;
              background: ${this.activeDiffViews.has(law.id) ? 'rgba(239, 68, 68, 0.2)' : 'rgba(139, 92, 246, 0.2)'};
              border: 1px solid ${this.activeDiffViews.has(law.id) ? 'rgba(239, 68, 68, 0.4)' : 'rgba(139, 92, 246, 0.4)'};
              border-radius: 4px;
              color: ${this.activeDiffViews.has(law.id) ? '#ef4444' : '#8b5cf6'};
              cursor: pointer;
              font-size: 11px;
              transition: all 0.2s;
            ">
              ${this.activeDiffViews.has(law.id) ? '🔒 Hide Diff' : '📊 Show Diff'}
            </button>
            
            <button class="law-details-btn" data-law-id="${law.id}" style="
              padding: 4px 8px;
              background: rgba(16, 185, 129, 0.2);
              border: 1px solid rgba(16, 185, 129, 0.4);
              border-radius: 4px;
              color: #10b981;
              cursor: pointer;
              font-size: 11px;
              transition: all 0.2s;
            ">
              📋 Details
            </button>
          </div>
        </div>
        
        <div id="diff-container-${law.id}" class="diff-container" style="
          margin-top: 15px;
          ${this.activeDiffViews.has(law.id) ? '' : 'display: none;'}
        ">
          <!-- Diff view will be rendered here -->
        </div>
      </div>
    `;
  }
  
  /**
   * Render parameters summary
   */
  renderParametersSummary(parameters) {
    if (!parameters || Object.keys(parameters).length === 0) {
      return '<div style="color: #6b7280; font-style: italic; font-size: 11px;">No parameters</div>';
    }
    
    const entries = Object.entries(parameters).slice(0, 4); // Show first 4 parameters
    const remaining = Math.max(0, Object.keys(parameters).length - 4);
    
    return `
      <div style="font-size: 11px; line-height: 1.4;">
        ${entries.map(([key, value]) => `
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <span style="color: #d1d5db;">${key}:</span>
            <span style="color: #f1f5f9; font-weight: 500;">${this.formatParameterValue(value)}</span>
          </div>
        `).join('')}
        ${remaining > 0 ? `
          <div style="color: #94a3b8; font-style: italic; margin-top: 4px;">
            +${remaining} more parameter${remaining > 1 ? 's' : ''}
          </div>
        ` : ''}
      </div>
    `;
  }
  
  /**
   * Format parameter value for display
   */
  formatParameterValue(value) {
    if (typeof value === 'number') {
      return Number.isInteger(value) ? value.toString() : value.toFixed(3);
    }
    if (typeof value === 'string') {
      return value.length > 20 ? value.substring(0, 20) + '...' : value;
    }
    if (Array.isArray(value)) {
      return `[${value.length} items]`;
    }
    if (typeof value === 'object' && value !== null) {
      return `{${Object.keys(value).length} props}`;
    }
    return String(value);
  }
  
  /**
   * Group laws by category
   */
  groupLaws(laws) {
    const groups = {
      'High Confidence': [],
      'Medium Confidence': [],
      'Low Confidence': [],
      'Recently Updated': []
    };
    
    const recentThreshold = Date.now() - 300000; // 5 minutes
    
    laws.forEach(law => {
      if (law.lastUpdated > recentThreshold) {
        groups['Recently Updated'].push(law);
      } else if (law.confidence >= 0.8) {
        groups['High Confidence'].push(law);
      } else if (law.confidence >= 0.5) {
        groups['Medium Confidence'].push(law);
      } else {
        groups['Low Confidence'].push(law);
      }
    });
    
    // Remove empty groups
    Object.keys(groups).forEach(key => {
      if (groups[key].length === 0) {
        delete groups[key];
      }
    });
    
    return groups;
  }
  
  /**
   * Get category icon
   */
  getCategoryIcon(category) {
    const icons = {
      'High Confidence': '🏆',
      'Medium Confidence': '⚖️',
      'Low Confidence': '🔍',
      'Recently Updated': '🔥'
    };
    return icons[category] || '📊';
  }
  
  /**
   * Render all diff views for active laws
   */
  renderAllDiffViews() {
    this.activeDiffViews.forEach((_, lawId) => {
      const container = document.getElementById(`diff-container-${lawId}`);
      if (container) {
        container.innerHTML = '';
        this.diffView.createDiffComponent(lawId, container.id);
        container.style.display = 'block';
      }
    });
  }
  
  /**
   * Bind events for laws tab
   */
  bindLawsTabEvents(tabContainer) {
    // Show/hide diffs toggle
    const showDiffsToggle = tabContainer.querySelector('#show-diffs-toggle');
    if (showDiffsToggle) {
      showDiffsToggle.addEventListener('change', (e) => {
        this.uiState.showDiffs = e.target.checked;
        if (this.uiState.showDiffs) {
          this.renderAllDiffViews();
        } else {
          // Hide all diff views
          this.activeDiffViews.forEach((_, lawId) => {
            const container = document.getElementById(`diff-container-${lawId}`);
            if (container) container.style.display = 'none';
          });
        }
      });
    }
    
    // Auto refresh toggle
    const autoRefreshToggle = tabContainer.querySelector('#auto-refresh-toggle');
    if (autoRefreshToggle) {
      autoRefreshToggle.addEventListener('change', (e) => {
        this.uiState.autoRefresh = e.target.checked;
        this.setupAutoRefresh();
      });
    }
    
    // Refresh all button
    const refreshAllBtn = tabContainer.querySelector('#refresh-all-laws');
    if (refreshAllBtn) {
      refreshAllBtn.addEventListener('click', () => {
        this.refreshLawsContent();
        
        // Visual feedback
        refreshAllBtn.style.transform = 'rotate(360deg)';
        setTimeout(() => {
          refreshAllBtn.style.transform = 'rotate(0deg)';
        }, 300);
      });
    }
  }
  
  /**
   * Bind events for law cards
   */
  bindLawCardEvents() {
    // Toggle diff view buttons
    document.querySelectorAll('.toggle-diff-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const lawId = btn.dataset.lawId;
        this.toggleDiffView(lawId);
      });
    });
    
    // Law details buttons
    document.querySelectorAll('.law-details-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const lawId = btn.dataset.lawId;
        this.showLawDetails(lawId);
      });
    });
    
    // Law card click
    document.querySelectorAll('.law-card').forEach(card => {
      card.addEventListener('click', () => {
        const lawId = card.dataset.lawId;
        this.selectLaw(lawId);
      });
      
      // Hover effects
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-2px)';
        card.style.boxShadow = '0 4px 20px rgba(139, 92, 246, 0.3)';
      });
      
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
        card.style.boxShadow = card.style.boxShadow.includes('16, 185, 129') 
          ? '0 0 20px rgba(16, 185, 129, 0.2)' 
          : 'none';
      });
    });
  }
  
  /**
   * Toggle diff view for a law
   */
  toggleDiffView(lawId) {
    const container = document.getElementById(`diff-container-${lawId}`);
    const btn = document.querySelector(`[data-law-id="${lawId}"].toggle-diff-btn`);
    
    if (!container || !btn) return;
    
    if (this.activeDiffViews.has(lawId)) {
      // Hide diff
      container.style.display = 'none';
      this.activeDiffViews.delete(lawId);
      btn.textContent = '📊 Show Diff';
      btn.style.background = 'rgba(139, 92, 246, 0.2)';
      btn.style.borderColor = 'rgba(139, 92, 246, 0.4)';
      btn.style.color = '#8b5cf6';
    } else {
      // Show diff
      if (this.uiState.showDiffs) {
        container.innerHTML = '';
        this.diffView.createDiffComponent(lawId, container.id);
        container.style.display = 'block';
      }
      this.activeDiffViews.set(lawId, true);
      btn.textContent = '🔒 Hide Diff';
      btn.style.background = 'rgba(239, 68, 68, 0.2)';
      btn.style.borderColor = 'rgba(239, 68, 68, 0.4)';
      btn.style.color = '#ef4444';
    }
  }
  
  /**
   * Show detailed law information
   */
  showLawDetails(lawId) {
    const law = this.codexEngine.getLaw(lawId);
    if (!law) return;
    
    // Create detailed modal
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: rgba(20, 20, 30, 0.98);
      border: 1px solid rgba(139, 92, 246, 0.3);
      border-radius: 12px;
      padding: 30px;
      max-width: 70vw;
      max-height: 80vh;
      overflow-y: auto;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    `;
    
    modalContent.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #8b5cf6; font-size: 24px;">
          📋 Law Details: ${law.title || law.id}
        </h2>
        <button id="close-details-modal" style="
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.4);
          border-radius: 6px;
          color: #ef4444;
          padding: 8px 12px;
          cursor: pointer;
        ">✕ Close</button>
      </div>
      
      <div style="display: grid; gap: 20px; grid-template-columns: 1fr 1fr;">
        <div>
          <h3 style="color: #e2e8f0; margin-bottom: 10px;">Basic Information</h3>
          <div style="background: rgba(55, 65, 81, 0.3); padding: 15px; border-radius: 8px;">
            <div style="margin-bottom: 8px;"><strong>ID:</strong> ${law.id}</div>
            <div style="margin-bottom: 8px;"><strong>Confidence:</strong> ${(law.confidence * 100).toFixed(2)}%</div>
            <div style="margin-bottom: 8px;"><strong>Last Updated:</strong> ${new Date(law.lastUpdated || Date.now()).toLocaleString()}</div>
            <div><strong>Description:</strong> ${law.description || 'No description'}</div>
          </div>
        </div>
        
        <div>
          <h3 style="color: #e2e8f0; margin-bottom: 10px;">Parameters</h3>
          <div style="background: rgba(55, 65, 81, 0.3); padding: 15px; border-radius: 8px; max-height: 200px; overflow-y: auto;">
            ${this.renderDetailedParameters(law.parameters)}
          </div>
        </div>
      </div>
      
      <div style="margin-top: 20px;">
        <h3 style="color: #e2e8f0; margin-bottom: 10px;">Change History</h3>
        <div style="background: rgba(55, 65, 81, 0.3); padding: 15px; border-radius: 8px; max-height: 300px; overflow-y: auto;">
          ${this.renderDetailedHistory(lawId)}
        </div>
      </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Close modal events
    modal.querySelector('#close-details-modal').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }
  
  /**
   * Render detailed parameters
   */
  renderDetailedParameters(parameters) {
    if (!parameters || Object.keys(parameters).length === 0) {
      return '<div style="color: #6b7280; font-style: italic;">No parameters</div>';
    }
    
    return Object.entries(parameters).map(([key, value]) => `
      <div style="margin-bottom: 8px; display: flex; justify-content: space-between;">
        <span style="color: #d1d5db; font-weight: 500;">${key}:</span>
        <span style="color: #f1f5f9; font-family: monospace;">${JSON.stringify(value)}</span>
      </div>
    `).join('');
  }
  
  /**
   * Render detailed history
   */
  renderDetailedHistory(lawId) {
    const history = this.diffView.getDiffHistory(lawId);
    
    if (history.length === 0) {
      return '<div style="color: #6b7280; font-style: italic;">No change history</div>';
    }
    
    return history.slice(0, 10).map((diff, index) => `
      <div style="
        margin-bottom: 10px;
        padding: 10px;
        background: rgba(45, 45, 55, 0.5);
        border-radius: 6px;
        border-left: 3px solid ${index === 0 ? '#8b5cf6' : '#374151'};
      ">
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
          <span style="font-weight: bold; color: #f1f5f9;">
            ${index === 0 ? '🔥 Latest' : `#${index + 1}`}
          </span>
          <span style="color: #94a3b8; font-size: 12px;">
            ${new Date(diff.timestamp).toLocaleString()}
          </span>
        </div>
        <div style="font-size: 12px; color: #d1d5db;">
          ${diff.changes.total} changes
          ${diff.changes.confidence ? `• Confidence: ${diff.changes.confidence.delta > 0 ? '+' : ''}${diff.changes.confidence.delta.toFixed(4)}` : ''}
          ${Object.keys(diff.changes.parameters).length > 0 ? `• Parameters: ${Object.keys(diff.changes.parameters).join(', ')}` : ''}
        </div>
      </div>
    `).join('');
  }
  
  /**
   * Select a law (highlight it)
   */
  selectLaw(lawId) {
    // Remove previous selection
    document.querySelectorAll('.law-card').forEach(card => {
      card.style.background = 'rgba(45, 45, 55, 0.8)';
    });
    
    // Highlight selected law
    const selectedCard = document.querySelector(`[data-law-id="${lawId}"]`);
    if (selectedCard) {
      selectedCard.style.background = 'rgba(139, 92, 246, 0.1)';
      this.uiState.selectedLaw = lawId;
    }
  }
  
  /**
   * Setup auto refresh
   */
  setupAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    
    if (this.uiState.autoRefresh) {
      this.refreshTimer = setInterval(() => {
        this.refreshLawsContent();
      }, this.uiState.refreshInterval);
    }
  }
  
  /**
   * Cleanup
   */
  destroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    this.activeDiffViews.clear();
  }
}

/**
 * Initialize Laws Tab with Diff Integration
 */
export function createLawsTabWithDiff(codexEngine, containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`Container with ID '${containerId}' not found`);
  }
  
  const lawsTab = new LawsTabWithDiff(codexEngine);
  lawsTab.renderLawsTab(container);
  
  return lawsTab;
}