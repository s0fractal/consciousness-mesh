/**
 * Hypothesis Lifecycle Management System
 * Tracks evolution of hypotheses from proposal to archival
 */

export class HypothesisLifecycle {
  constructor() {
    // Hypothesis storage
    this.hypotheses = new Map();
    
    // Status definitions with allowed transitions
    this.statuses = {
      proposed: {
        name: 'Proposed',
        description: 'Newly suggested hypothesis awaiting evidence',
        color: '#94a3b8',
        icon: '💡',
        transitions: ['gathering', 'archived']
      },
      gathering: {
        name: 'Gathering Evidence',
        description: 'Actively collecting data to support or refute',
        color: '#3b82f6',
        icon: '🔍',
        transitions: ['supported', 'weak', 'archived']
      },
      supported: {
        name: 'Supported',
        description: 'Strong evidence supports this hypothesis',
        color: '#10b981',
        icon: '✅',
        transitions: ['archived']
      },
      weak: {
        name: 'Weak Support',
        description: 'Limited or contradictory evidence',
        color: '#f59e0b',
        icon: '⚠️',
        transitions: ['gathering', 'archived']
      },
      archived: {
        name: 'Archived',
        description: 'No longer actively investigated',
        color: '#6b7280',
        icon: '📦',
        transitions: ['gathering'] // Can be revived
      }
    };
    
    // Evidence thresholds
    this.thresholds = {
      supportThreshold: 0.7,    // Confidence needed for 'supported'
      weakThreshold: 0.3,       // Below this is 'weak'
      minEvidence: 5,           // Minimum evidence pieces before decision
      staleTime: 604800000      // 7 days before auto-archive consideration
    };
    
    // Transition history
    this.transitionHistory = [];
    
    // Event handlers
    this.eventHandlers = {
      onStatusChange: [],
      onEvidenceAdded: [],
      onHypothesisCreated: [],
      onHypothesisArchived: []
    };
  }
  
  /**
   * Create a new hypothesis
   */
  createHypothesis(data) {
    const id = `hyp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const hypothesis = {
      id,
      title: data.title,
      description: data.description,
      proposedBy: data.proposedBy || 'system',
      status: 'proposed',
      confidence: 0,
      evidence: [],
      relatedLaws: data.relatedLaws || [],
      metadata: {
        created: Date.now(),
        lastUpdated: Date.now(),
        lastActivity: Date.now(),
        totalEvidence: 0,
        supportingEvidence: 0,
        contradictingEvidence: 0
      },
      tags: data.tags || [],
      priority: data.priority || 'medium'
    };
    
    this.hypotheses.set(id, hypothesis);
    
    // Emit creation event
    this.emit('onHypothesisCreated', hypothesis);
    
    return hypothesis;
  }
  
  /**
   * Transition hypothesis to new status
   */
  transitionStatus(hypothesisId, newStatus, reason = '') {
    const hypothesis = this.hypotheses.get(hypothesisId);
    if (!hypothesis) {
      throw new Error(`Hypothesis ${hypothesisId} not found`);
    }
    
    const currentStatus = hypothesis.status;
    const statusDef = this.statuses[currentStatus];
    
    // Check if transition is allowed
    if (!statusDef.transitions.includes(newStatus)) {
      throw new Error(
        `Invalid transition from ${currentStatus} to ${newStatus}. ` +
        `Allowed: ${statusDef.transitions.join(', ')}`
      );
    }
    
    // Record transition
    const transition = {
      hypothesisId,
      from: currentStatus,
      to: newStatus,
      reason,
      timestamp: Date.now(),
      confidence: hypothesis.confidence
    };
    
    this.transitionHistory.push(transition);
    
    // Update hypothesis
    hypothesis.status = newStatus;
    hypothesis.metadata.lastUpdated = Date.now();
    hypothesis.metadata.lastActivity = Date.now();
    
    // Auto-gather if moving to gathering
    if (newStatus === 'gathering') {
      hypothesis.gatheringStarted = Date.now();
    }
    
    // Emit status change event
    this.emit('onStatusChange', {
      hypothesis,
      transition,
      oldStatus: currentStatus,
      newStatus
    });
    
    return hypothesis;
  }
  
  /**
   * Add evidence to hypothesis
   */
  addEvidence(hypothesisId, evidence) {
    const hypothesis = this.hypotheses.get(hypothesisId);
    if (!hypothesis) {
      throw new Error(`Hypothesis ${hypothesisId} not found`);
    }
    
    // Structure evidence
    const structuredEvidence = {
      id: `ev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: evidence.type || 'observation',
      source: evidence.source,
      description: evidence.description,
      supports: evidence.supports !== false, // Default to supporting
      confidence: evidence.confidence || 0.5,
      weight: evidence.weight || 1.0,
      timestamp: Date.now(),
      data: evidence.data || {}
    };
    
    hypothesis.evidence.push(structuredEvidence);
    hypothesis.metadata.totalEvidence++;
    
    if (structuredEvidence.supports) {
      hypothesis.metadata.supportingEvidence++;
    } else {
      hypothesis.metadata.contradictingEvidence++;
    }
    
    // Update hypothesis confidence
    this.updateConfidence(hypothesisId);
    
    // Update activity timestamp
    hypothesis.metadata.lastActivity = Date.now();
    
    // Emit evidence added event
    this.emit('onEvidenceAdded', {
      hypothesis,
      evidence: structuredEvidence
    });
    
    // Check for automatic transitions
    this.checkAutoTransitions(hypothesisId);
    
    return structuredEvidence;
  }
  
  /**
   * Update hypothesis confidence based on evidence
   */
  updateConfidence(hypothesisId) {
    const hypothesis = this.hypotheses.get(hypothesisId);
    if (!hypothesis || hypothesis.evidence.length === 0) return;
    
    // Calculate weighted confidence
    let totalWeight = 0;
    let weightedSum = 0;
    
    hypothesis.evidence.forEach(ev => {
      const weight = ev.weight * (ev.supports ? 1 : -1);
      weightedSum += weight * ev.confidence;
      totalWeight += ev.weight;
    });
    
    // Normalize to [0, 1]
    const rawConfidence = weightedSum / totalWeight;
    hypothesis.confidence = Math.max(0, Math.min(1, (rawConfidence + 1) / 2));
    
    return hypothesis.confidence;
  }
  
  /**
   * Check for automatic status transitions
   */
  checkAutoTransitions(hypothesisId) {
    const hypothesis = this.hypotheses.get(hypothesisId);
    if (!hypothesis) return;
    
    // Only auto-transition from 'gathering' status
    if (hypothesis.status !== 'gathering') return;
    
    // Need minimum evidence
    if (hypothesis.metadata.totalEvidence < this.thresholds.minEvidence) return;
    
    // Check confidence thresholds
    if (hypothesis.confidence >= this.thresholds.supportThreshold) {
      this.transitionStatus(hypothesisId, 'supported', 'Auto-transition: High confidence');
    } else if (hypothesis.confidence <= this.thresholds.weakThreshold) {
      this.transitionStatus(hypothesisId, 'weak', 'Auto-transition: Low confidence');
    }
  }
  
  /**
   * Get hypotheses by status
   */
  getByStatus(status) {
    return Array.from(this.hypotheses.values())
      .filter(h => h.status === status);
  }
  
  /**
   * Get hypothesis inbox (proposed + gathering)
   */
  getInbox() {
    return Array.from(this.hypotheses.values())
      .filter(h => ['proposed', 'gathering'].includes(h.status))
      .sort((a, b) => {
        // Priority order
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        // Then by last activity
        return b.metadata.lastActivity - a.metadata.lastActivity;
      });
  }
  
  /**
   * Check for stale hypotheses
   */
  checkStaleHypotheses() {
    const now = Date.now();
    const stale = [];
    
    this.hypotheses.forEach((hypothesis, id) => {
      if (hypothesis.status === 'proposed' || hypothesis.status === 'gathering') {
        const timeSinceActivity = now - hypothesis.metadata.lastActivity;
        
        if (timeSinceActivity > this.thresholds.staleTime) {
          stale.push({
            hypothesis,
            daysSinceActivity: Math.floor(timeSinceActivity / 86400000)
          });
        }
      }
    });
    
    return stale;
  }
  
  /**
   * Get hypothesis statistics
   */
  getStatistics() {
    const stats = {
      total: this.hypotheses.size,
      byStatus: {},
      byPriority: {},
      avgConfidence: 0,
      totalEvidence: 0,
      recentActivity: []
    };
    
    // Initialize counters
    Object.keys(this.statuses).forEach(status => {
      stats.byStatus[status] = 0;
    });
    
    ['high', 'medium', 'low'].forEach(priority => {
      stats.byPriority[priority] = 0;
    });
    
    let confidenceSum = 0;
    let confidenceCount = 0;
    
    // Calculate statistics
    this.hypotheses.forEach(hypothesis => {
      stats.byStatus[hypothesis.status]++;
      stats.byPriority[hypothesis.priority]++;
      stats.totalEvidence += hypothesis.metadata.totalEvidence;
      
      if (hypothesis.confidence > 0) {
        confidenceSum += hypothesis.confidence;
        confidenceCount++;
      }
    });
    
    stats.avgConfidence = confidenceCount > 0 ? confidenceSum / confidenceCount : 0;
    
    // Recent activity (last 7 days)
    const weekAgo = Date.now() - 604800000;
    stats.recentActivity = this.transitionHistory
      .filter(t => t.timestamp > weekAgo)
      .slice(-10)
      .reverse();
    
    return stats;
  }
  
  /**
   * Export hypothesis data
   */
  exportHypothesis(hypothesisId) {
    const hypothesis = this.hypotheses.get(hypothesisId);
    if (!hypothesis) return null;
    
    return {
      ...hypothesis,
      statusHistory: this.transitionHistory.filter(t => t.hypothesisId === hypothesisId),
      currentStatus: this.statuses[hypothesis.status]
    };
  }
  
  /**
   * Subscribe to events
   */
  on(event, handler) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].push(handler);
    }
  }
  
  /**
   * Emit events
   */
  emit(event, data) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach(handler => handler(data));
    }
  }
}

/**
 * Create Hypothesis Inbox UI Widget
 */
export function createHypothesisInbox(lifecycle, container) {
  // Create inbox container
  const inbox = document.createElement('div');
  inbox.id = 'hypothesis-inbox';
  inbox.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 400px;
    max-height: 600px;
    background: rgba(30, 30, 30, 0.95);
    border: 1px solid rgba(139, 92, 246, 0.3);
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    overflow: hidden;
    z-index: 100;
    display: none;
  `;
  
  // Header
  const header = document.createElement('div');
  header.style.cssText = `
    padding: 15px 20px;
    background: linear-gradient(135deg, #8b5cf6, #6d28d9);
    color: white;
    font-weight: bold;
    display: flex;
    justify-content: space-between;
    align-items: center;
  `;
  header.innerHTML = `
    <span>📮 Hypothesis Inbox</span>
    <button id="inbox-close" style="
      background: none;
      border: none;
      color: white;
      font-size: 20px;
      cursor: pointer;
    ">×</button>
  `;
  
  // Content area
  const content = document.createElement('div');
  content.id = 'inbox-content';
  content.style.cssText = `
    max-height: 500px;
    overflow-y: auto;
    padding: 10px;
  `;
  
  // Assemble inbox
  inbox.appendChild(header);
  inbox.appendChild(content);
  container.appendChild(inbox);
  
  // Create toggle button
  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'inbox-toggle';
  toggleBtn.innerHTML = '📮';
  toggleBtn.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 50px;
    height: 50px;
    background: linear-gradient(135deg, #8b5cf6, #6d28d9);
    border: none;
    border-radius: 50%;
    color: white;
    font-size: 24px;
    cursor: pointer;
    z-index: 99;
    box-shadow: 0 2px 10px rgba(139, 92, 246, 0.5);
    transition: all 0.3s;
  `;
  
  toggleBtn.addEventListener('mouseenter', () => {
    toggleBtn.style.transform = 'scale(1.1)';
  });
  
  toggleBtn.addEventListener('mouseleave', () => {
    toggleBtn.style.transform = 'scale(1)';
  });
  
  container.appendChild(toggleBtn);
  
  // Update inbox content
  function updateInbox() {
    const hypotheses = lifecycle.getInbox();
    const stats = lifecycle.getStatistics();
    
    content.innerHTML = `
      <div style="margin-bottom: 15px; padding: 10px; background: rgba(139, 92, 246, 0.1); border-radius: 8px;">
        <div style="font-size: 12px; color: #94a3b8;">
          ${stats.byStatus.proposed} proposed · ${stats.byStatus.gathering} gathering
        </div>
      </div>
      
      ${hypotheses.length === 0 ? `
        <div style="text-align: center; color: #666; padding: 40px;">
          <div style="font-size: 40px; margin-bottom: 10px;">📭</div>
          <div>No active hypotheses</div>
        </div>
      ` : hypotheses.map(h => `
        <div class="hypothesis-card" data-id="${h.id}" style="
          margin-bottom: 10px;
          padding: 12px;
          background: rgba(45, 45, 45, 0.8);
          border-radius: 8px;
          border-left: 3px solid ${lifecycle.statuses[h.status].color};
          cursor: pointer;
          transition: all 0.2s;
        ">
          <div style="display: flex; justify-content: space-between; align-items: start;">
            <div style="flex: 1;">
              <div style="font-weight: bold; margin-bottom: 5px;">
                ${lifecycle.statuses[h.status].icon} ${h.title}
              </div>
              <div style="font-size: 12px; color: #94a3b8; margin-bottom: 8px;">
                ${h.description}
              </div>
              <div style="display: flex; gap: 10px; align-items: center;">
                <div style="font-size: 11px; color: #666;">
                  Evidence: ${h.metadata.totalEvidence} 
                  (${h.metadata.supportingEvidence}↑ ${h.metadata.contradictingEvidence}↓)
                </div>
                <div style="
                  width: 60px;
                  height: 4px;
                  background: #333;
                  border-radius: 2px;
                  overflow: hidden;
                ">
                  <div style="
                    height: 100%;
                    width: ${h.confidence * 100}%;
                    background: ${h.confidence > 0.7 ? '#10b981' : h.confidence < 0.3 ? '#ef4444' : '#f59e0b'};
                  "></div>
                </div>
              </div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 5px;">
              ${h.status === 'proposed' ? `
                <button class="action-btn" data-action="gather" style="
                  padding: 4px 8px;
                  background: #3b82f6;
                  border: none;
                  border-radius: 4px;
                  color: white;
                  font-size: 11px;
                  cursor: pointer;
                ">🔍 Gather</button>
              ` : ''}
              ${h.status === 'gathering' && h.confidence > lifecycle.thresholds.supportThreshold ? `
                <button class="action-btn" data-action="support" style="
                  padding: 4px 8px;
                  background: #10b981;
                  border: none;
                  border-radius: 4px;
                  color: white;
                  font-size: 11px;
                  cursor: pointer;
                ">✅ Support</button>
              ` : ''}
              <button class="action-btn" data-action="archive" style="
                padding: 4px 8px;
                background: #6b7280;
                border: none;
                border-radius: 4px;
                color: white;
                font-size: 11px;
                cursor: pointer;
              ">📦 Archive</button>
            </div>
          </div>
        </div>
      `).join('')}
    `;
    
    // Add hover effects
    content.querySelectorAll('.hypothesis-card').forEach(card => {
      card.addEventListener('mouseenter', () => {
        card.style.background = 'rgba(55, 55, 55, 0.9)';
      });
      
      card.addEventListener('mouseleave', () => {
        card.style.background = 'rgba(45, 45, 45, 0.8)';
      });
    });
    
    // Bind action buttons
    content.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const hypothesisId = btn.closest('.hypothesis-card').dataset.id;
        const action = btn.dataset.action;
        
        try {
          switch (action) {
            case 'gather':
              lifecycle.transitionStatus(hypothesisId, 'gathering', 'Manual transition');
              break;
            case 'support':
              lifecycle.transitionStatus(hypothesisId, 'supported', 'Manual confirmation');
              break;
            case 'archive':
              lifecycle.transitionStatus(hypothesisId, 'archived', 'Manual archival');
              break;
          }
          updateInbox();
        } catch (err) {
          console.error('Transition error:', err);
        }
      });
    });
  }
  
  // Toggle inbox visibility
  toggleBtn.addEventListener('click', () => {
    const isVisible = inbox.style.display === 'block';
    inbox.style.display = isVisible ? 'none' : 'block';
    toggleBtn.style.display = isVisible ? 'block' : 'none';
    
    if (!isVisible) {
      updateInbox();
    }
  });
  
  header.querySelector('#inbox-close').addEventListener('click', () => {
    inbox.style.display = 'none';
    toggleBtn.style.display = 'block';
  });
  
  // Subscribe to lifecycle events
  lifecycle.on('onStatusChange', updateInbox);
  lifecycle.on('onEvidenceAdded', updateInbox);
  lifecycle.on('onHypothesisCreated', updateInbox);
  
  // Check for updates periodically
  setInterval(() => {
    if (inbox.style.display === 'block') {
      updateInbox();
    }
  }, 30000); // Every 30 seconds
  
  return { inbox, toggleBtn, updateInbox };
}