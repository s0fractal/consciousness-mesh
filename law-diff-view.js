/**
 * Law Diff-View Component
 * Shows Before/After comparison for law parameters and confidence
 */

export class LawDiffView {
  constructor() {
    this.diffs = new Map(); // Store diff data for laws
    this.maxDiffHistory = 50; // Keep last 50 changes per law
    
    // Diff configuration
    this.config = {
      precision: 4,           // Decimal places for numbers
      threshold: 0.0001,      // Minimum change to show
      highlightDuration: 3000 // MS to highlight changes
    };
  }
  
  /**
   * Record a law update for diff tracking
   */
  recordLawUpdate(lawId, beforeState, afterState, context = {}) {
    if (!this.diffs.has(lawId)) {
      this.diffs.set(lawId, []);
    }
    
    const diffRecord = {
      id: `diff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      before: this.sanitizeState(beforeState),
      after: this.sanitizeState(afterState),
      context: context,
      changes: this.calculateChanges(beforeState, afterState)
    };
    
    const history = this.diffs.get(lawId);
    history.unshift(diffRecord);
    
    // Limit history size
    if (history.length > this.maxDiffHistory) {
      history.splice(this.maxDiffHistory);
    }
    
    return diffRecord;
  }
  
  /**
   * Calculate changes between two states
   */
  calculateChanges(before, after) {
    const changes = {
      parameters: {},
      confidence: null,
      total: 0
    };
    
    // Compare confidence
    if (before.confidence !== undefined && after.confidence !== undefined) {
      const confidenceDiff = after.confidence - before.confidence;
      if (Math.abs(confidenceDiff) >= this.config.threshold) {
        changes.confidence = {
          before: before.confidence,
          after: after.confidence,
          delta: confidenceDiff,
          percentage: before.confidence > 0 ? (confidenceDiff / before.confidence) * 100 : 0
        };
        changes.total++;
      }
    }
    
    // Compare parameters
    const allParams = new Set([
      ...Object.keys(before.parameters || {}),
      ...Object.keys(after.parameters || {})
    ]);
    
    allParams.forEach(param => {
      const beforeVal = before.parameters?.[param];
      const afterVal = after.parameters?.[param];
      
      if (beforeVal !== afterVal) {
        if (typeof beforeVal === 'number' && typeof afterVal === 'number') {
          const delta = afterVal - beforeVal;
          if (Math.abs(delta) >= this.config.threshold) {
            changes.parameters[param] = {
              before: beforeVal,
              after: afterVal,
              delta: delta,
              percentage: beforeVal !== 0 ? (delta / beforeVal) * 100 : 0,
              type: 'numeric'
            };
            changes.total++;
          }
        } else {
          // Non-numeric changes
          changes.parameters[param] = {
            before: beforeVal,
            after: afterVal,
            delta: null,
            percentage: 0,
            type: this.getValueType(afterVal)
          };
          changes.total++;
        }
      }
    });
    
    return changes;
  }
  
  /**
   * Get the type of a value
   */
  getValueType(value) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  }
  
  /**
   * Sanitize state for storage (remove functions, etc.)
   */
  sanitizeState(state) {
    return JSON.parse(JSON.stringify({
      confidence: state.confidence,
      parameters: state.parameters || {},
      metadata: {
        lastUpdated: state.lastUpdated || Date.now(),
        version: state.version || 1
      }
    }));
  }
  
  /**
   * Create diff view component for a specific law
   */
  createDiffComponent(lawId, containerId) {
    if (typeof document === 'undefined') {
      // Return mock component for non-browser environments
      return { id: `law-diff-${lawId}`, innerHTML: '', querySelector: () => null };
    }
    
    const container = document.getElementById(containerId) || document.body;
    
    const diffContainer = document.createElement('div');
    diffContainer.id = `law-diff-${lawId}`;
    diffContainer.className = 'law-diff-view';
    diffContainer.style.cssText = `
      background: rgba(20, 20, 30, 0.95);
      border: 1px solid rgba(139, 92, 246, 0.3);
      border-radius: 8px;
      padding: 15px;
      margin: 10px 0;
      font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
      font-size: 13px;
      max-height: 400px;
      overflow-y: auto;
    `;
    
    this.renderDiffContent(diffContainer, lawId);
    container.appendChild(diffContainer);
    
    return diffContainer;
  }
  
  /**
   * Render diff content for a law
   */
  renderDiffContent(container, lawId) {
    const history = this.diffs.get(lawId) || [];
    const latestDiff = history[0];
    
    if (!latestDiff) {
      container.innerHTML = `
        <div style="text-align: center; color: #666; padding: 20px;">
          <div style="font-size: 24px; margin-bottom: 10px;">📊</div>
          <div>No changes recorded for this law</div>
        </div>
      `;
      return;
    }
    
    const html = `
      <div class="diff-header" style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
        padding-bottom: 10px;
        border-bottom: 1px solid rgba(139, 92, 246, 0.2);
      ">
        <h3 style="margin: 0; color: #8b5cf6; font-size: 16px;">
          📋 Law Changes: ${lawId}
        </h3>
        <div style="font-size: 12px; color: #94a3b8;">
          ${new Date(latestDiff.timestamp).toLocaleString()}
        </div>
      </div>
      
      ${this.renderConfidenceDiff(latestDiff.changes.confidence)}
      ${this.renderParametersDiff(latestDiff.changes.parameters)}
      
      <div class="diff-summary" style="
        margin-top: 15px;
        padding-top: 10px;
        border-top: 1px solid rgba(139, 92, 246, 0.2);
        font-size: 12px;
        color: #94a3b8;
      ">
        <div style="display: flex; justify-content: space-between;">
          <span>Total changes: ${latestDiff.changes.total}</span>
          <span>History: ${history.length} records</span>
        </div>
      </div>
      
      ${this.renderDiffControls(lawId)}
    `;
    
    container.innerHTML = html;
    this.bindDiffEvents(container, lawId);
  }
  
  /**
   * Render confidence diff
   */
  renderConfidenceDiff(confidenceChange) {
    if (!confidenceChange) {
      return '<div style="color: #666; font-style: italic;">No confidence changes</div>';
    }
    
    const { before, after, delta, percentage } = confidenceChange;
    const deltaColor = delta > 0 ? '#10b981' : delta < 0 ? '#ef4444' : '#94a3b8';
    const deltaIcon = delta > 0 ? '📈' : delta < 0 ? '📉' : '➡️';
    
    return `
      <div class="confidence-diff" style="margin-bottom: 15px;">
        <div style="font-weight: bold; margin-bottom: 8px; color: #e2e8f0;">
          ${deltaIcon} Confidence
        </div>
        <div style="display: flex; align-items: center; gap: 15px;">
          <div class="before-value" style="
            background: rgba(239, 68, 68, 0.2);
            padding: 4px 8px;
            border-radius: 4px;
            border: 1px solid rgba(239, 68, 68, 0.3);
          ">
            Before: ${before.toFixed(this.config.precision)}
          </div>
          <div style="color: ${deltaColor}; font-weight: bold;">
            ${delta > 0 ? '+' : ''}${delta.toFixed(this.config.precision)}
            ${percentage !== 0 ? ` (${percentage > 0 ? '+' : ''}${percentage.toFixed(2)}%)` : ''}
          </div>
          <div class="after-value" style="
            background: rgba(16, 185, 129, 0.2);
            padding: 4px 8px;
            border-radius: 4px;
            border: 1px solid rgba(16, 185, 129, 0.3);
          ">
            After: ${after.toFixed(this.config.precision)}
          </div>
        </div>
        <div class="confidence-bar" style="
          margin-top: 8px;
          height: 6px;
          background: #374151;
          border-radius: 3px;
          overflow: hidden;
          position: relative;
        ">
          <div style="
            position: absolute;
            height: 100%;
            width: ${before * 100}%;
            background: rgba(239, 68, 68, 0.6);
            transition: all 0.3s;
          "></div>
          <div style="
            position: absolute;
            height: 100%;
            width: ${after * 100}%;
            background: ${deltaColor};
            transition: all 0.3s;
            animation: pulse 2s infinite;
          "></div>
        </div>
      </div>
    `;
  }
  
  /**
   * Render parameters diff
   */
  renderParametersDiff(parameterChanges) {
    if (Object.keys(parameterChanges).length === 0) {
      return '<div style="color: #666; font-style: italic;">No parameter changes</div>';
    }
    
    const parametersHtml = Object.entries(parameterChanges).map(([param, change]) => {
      return this.renderSingleParameterDiff(param, change);
    }).join('');
    
    return `
      <div class="parameters-diff">
        <div style="font-weight: bold; margin-bottom: 8px; color: #e2e8f0;">
          ⚙️ Parameters
        </div>
        ${parametersHtml}
      </div>
    `;
  }
  
  /**
   * Render single parameter diff
   */
  renderSingleParameterDiff(paramName, change) {
    const { before, after, delta, percentage, type } = change;
    
    if (type === 'numeric' && delta !== null) {
      const deltaColor = delta > 0 ? '#10b981' : delta < 0 ? '#ef4444' : '#94a3b8';
      const deltaIcon = delta > 0 ? '↗️' : delta < 0 ? '↘️' : '➡️';
      
      return `
        <div class="param-diff" style="
          margin-bottom: 10px;
          padding: 8px;
          background: rgba(55, 65, 81, 0.5);
          border-radius: 6px;
          border-left: 3px solid ${deltaColor};
        ">
          <div style="font-weight: bold; margin-bottom: 5px; color: #f1f5f9;">
            ${deltaIcon} ${paramName}
          </div>
          <div style="display: flex; align-items: center; gap: 10px; font-size: 12px;">
            <span style="color: #ef4444;">
              ${this.formatValue(before)}
            </span>
            <span style="color: ${deltaColor}; font-weight: bold;">
              ${delta > 0 ? '+' : ''}${this.formatValue(delta)}
              ${percentage !== 0 ? ` (${percentage > 0 ? '+' : ''}${percentage.toFixed(1)}%)` : ''}
            </span>
            <span style="color: #10b981;">
              ${this.formatValue(after)}
            </span>
          </div>
        </div>
      `;
    } else {
      // Non-numeric changes
      return `
        <div class="param-diff" style="
          margin-bottom: 10px;
          padding: 8px;
          background: rgba(55, 65, 81, 0.5);
          border-radius: 6px;
          border-left: 3px solid #8b5cf6;
        ">
          <div style="font-weight: bold; margin-bottom: 5px; color: #f1f5f9;">
            🔄 ${paramName}
          </div>
          <div style="display: flex; align-items: center; gap: 10px; font-size: 12px;">
            <span style="
              color: #ef4444;
              background: rgba(239, 68, 68, 0.1);
              padding: 2px 6px;
              border-radius: 3px;
            ">
              ${this.formatValue(before)}
            </span>
            <span style="color: #8b5cf6;">→</span>
            <span style="
              color: #10b981;
              background: rgba(16, 185, 129, 0.1);
              padding: 2px 6px;
              border-radius: 3px;
            ">
              ${this.formatValue(after)}
            </span>
          </div>
        </div>
      `;
    }
  }
  
  /**
   * Format value for display
   */
  formatValue(value) {
    if (typeof value === 'number') {
      if (Number.isInteger(value)) return value.toString();
      return value.toFixed(this.config.precision);
    }
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `"${value}"`;
    if (Array.isArray(value)) return `[${value.length} items]`;
    if (typeof value === 'object') return `{${Object.keys(value).length} props}`;
    return String(value);
  }
  
  /**
   * Render diff controls
   */
  renderDiffControls(lawId) {
    return `
      <div class="diff-controls" style="
        margin-top: 15px;
        display: flex;
        gap: 10px;
        justify-content: center;
      ">
        <button class="show-history-btn" data-law-id="${lawId}" style="
          padding: 6px 12px;
          background: rgba(139, 92, 246, 0.2);
          border: 1px solid rgba(139, 92, 246, 0.4);
          border-radius: 4px;
          color: #8b5cf6;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
        ">
          📚 Show History
        </button>
        <button class="refresh-diff-btn" data-law-id="${lawId}" style="
          padding: 6px 12px;
          background: rgba(16, 185, 129, 0.2);
          border: 1px solid rgba(16, 185, 129, 0.4);
          border-radius: 4px;
          color: #10b981;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
        ">
          🔄 Refresh
        </button>
        <button class="clear-history-btn" data-law-id="${lawId}" style="
          padding: 6px 12px;
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.4);
          border-radius: 4px;
          color: #ef4444;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
        ">
          🗑️ Clear
        </button>
      </div>
    `;
  }
  
  /**
   * Bind event handlers for diff controls
   */
  bindDiffEvents(container, lawId) {
    // Show history button
    const historyBtn = container.querySelector('.show-history-btn');
    if (historyBtn) {
      historyBtn.addEventListener('click', () => {
        this.showDiffHistory(lawId);
      });
      
      historyBtn.addEventListener('mouseenter', () => {
        historyBtn.style.background = 'rgba(139, 92, 246, 0.3)';
      });
      
      historyBtn.addEventListener('mouseleave', () => {
        historyBtn.style.background = 'rgba(139, 92, 246, 0.2)';
      });
    }
    
    // Refresh button
    const refreshBtn = container.querySelector('.refresh-diff-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.renderDiffContent(container, lawId);
      });
      
      refreshBtn.addEventListener('mouseenter', () => {
        refreshBtn.style.background = 'rgba(16, 185, 129, 0.3)';
      });
      
      refreshBtn.addEventListener('mouseleave', () => {
        refreshBtn.style.background = 'rgba(16, 185, 129, 0.2)';
      });
    }
    
    // Clear history button
    const clearBtn = container.querySelector('.clear-history-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (confirm(`Clear diff history for law ${lawId}?`)) {
          this.clearDiffHistory(lawId);
          this.renderDiffContent(container, lawId);
        }
      });
      
      clearBtn.addEventListener('mouseenter', () => {
        clearBtn.style.background = 'rgba(239, 68, 68, 0.3)';
      });
      
      clearBtn.addEventListener('mouseleave', () => {
        clearBtn.style.background = 'rgba(239, 68, 68, 0.2)';
      });
    }
  }
  
  /**
   * Show diff history modal
   */
  showDiffHistory(lawId) {
    const history = this.diffs.get(lawId) || [];
    
    if (history.length === 0) {
      alert('No history available for this law');
      return;
    }
    
    // Create modal
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
      padding: 20px;
      max-width: 80vw;
      max-height: 80vh;
      overflow-y: auto;
      font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
    `;
    
    modalContent.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #8b5cf6;">📚 Diff History: ${lawId}</h2>
        <button id="close-history-modal" style="
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.4);
          border-radius: 6px;
          color: #ef4444;
          padding: 8px 12px;
          cursor: pointer;
        ">✕ Close</button>
      </div>
      
      <div class="history-list">
        ${history.map((diff, index) => `
          <div class="history-item" style="
            margin-bottom: 15px;
            padding: 15px;
            background: rgba(55, 65, 81, 0.3);
            border-radius: 8px;
            border-left: 3px solid ${index === 0 ? '#8b5cf6' : '#374151'};
          ">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="font-weight: bold; color: #f1f5f9;">
                ${index === 0 ? '🔥 Latest' : `#${index + 1}`}
              </span>
              <span style="color: #94a3b8; font-size: 12px;">
                ${new Date(diff.timestamp).toLocaleString()}
              </span>
            </div>
            
            ${diff.changes.confidence ? `
              <div style="margin-bottom: 8px;">
                <span style="color: #8b5cf6;">Confidence:</span>
                <span style="color: ${diff.changes.confidence.delta > 0 ? '#10b981' : '#ef4444'};">
                  ${diff.changes.confidence.before.toFixed(4)} → ${diff.changes.confidence.after.toFixed(4)}
                  (${diff.changes.confidence.delta > 0 ? '+' : ''}${diff.changes.confidence.delta.toFixed(4)})
                </span>
              </div>
            ` : ''}
            
            ${Object.keys(diff.changes.parameters).length > 0 ? `
              <div style="margin-bottom: 8px;">
                <span style="color: #8b5cf6;">Parameters:</span>
                ${Object.keys(diff.changes.parameters).join(', ')}
              </div>
            ` : ''}
            
            <div style="font-size: 12px; color: #94a3b8;">
              Total changes: ${diff.changes.total}
            </div>
          </div>
        `).join('')}
      </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Close modal events
    modal.querySelector('#close-history-modal').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }
  
  /**
   * Clear diff history for a law
   */
  clearDiffHistory(lawId) {
    this.diffs.delete(lawId);
  }
  
  /**
   * Get latest diff for a law
   */
  getLatestDiff(lawId) {
    const history = this.diffs.get(lawId);
    return history ? history[0] : null;
  }
  
  /**
   * Get diff history for a law
   */
  getDiffHistory(lawId) {
    return this.diffs.get(lawId) || [];
  }
  
  /**
   * Get all laws with diffs
   */
  getAllLawsWithDiffs() {
    return Array.from(this.diffs.keys());
  }
  
  /**
   * Export diff data
   */
  exportDiffData(lawId = null) {
    if (lawId) {
      return {
        lawId,
        history: this.getDiffHistory(lawId),
        config: this.config
      };
    }
    
    return {
      allDiffs: Object.fromEntries(this.diffs),
      config: this.config,
      exportedAt: Date.now()
    };
  }
}

/**
 * Integration with Codex Engine
 */
export function integrateDiffView(codexEngine) {
  const diffView = new LawDiffView();
  
  // Hook into law updates
  const originalUpdateLaw = codexEngine.updateLaw?.bind(codexEngine);
  if (originalUpdateLaw) {
    codexEngine.updateLaw = function(lawId, updates) {
      // Get current state
      const beforeState = this.codex.laws.get(lawId);
      
      // Perform update
      const result = originalUpdateLaw(lawId, updates);
      
      // Get new state
      const afterState = this.codex.laws.get(lawId);
      
      // Record diff
      if (beforeState && afterState) {
        diffView.recordLawUpdate(lawId, beforeState, afterState, {
          updateType: 'standard',
          trigger: 'codex_engine'
        });
      }
      
      return result;
    };
  }
  
  // Add diff methods to codex engine
  codexEngine.createDiffView = (lawId, containerId) => {
    return diffView.createDiffComponent(lawId, containerId);
  };
  
  codexEngine.getDiffHistory = (lawId) => {
    return diffView.getDiffHistory(lawId);
  };
  
  codexEngine.getLatestDiff = (lawId) => {
    return diffView.getLatestDiff(lawId);
  };
  
  codexEngine.exportDiffData = (lawId = null) => {
    return diffView.exportDiffData(lawId);
  };
  
  codexEngine.clearDiffHistory = (lawId) => {
    return diffView.clearDiffHistory(lawId);
  };
  
  return diffView;
}

// Add CSS animations (only in browser environment)
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    
    .law-diff-view .diff-controls button:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
    }
    
    .law-diff-view .confidence-bar {
      position: relative;
      overflow: hidden;
    }
    
    .law-diff-view .confidence-bar::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
      animation: shimmer 2s infinite;
    }
    
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
  `;

  if (!document.querySelector('#law-diff-view-styles')) {
    style.id = 'law-diff-view-styles';
    document.head.appendChild(style);
  }
}