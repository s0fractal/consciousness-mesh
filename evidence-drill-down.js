/**
 * Evidence Drill-down Component
 * UI for detailed evidence viewing when clicking on a law
 * Shows event list with timestamp, residual, weight and links to Legend Map
 */

export class EvidenceDrillDown {
  constructor(options = {}) {
    this.config = {
      // Display options
      maxEventsToShow: options.maxEventsToShow || 100,
      sortBy: options.sortBy || 'timestamp', // 'timestamp', 'weight', 'residual'
      sortOrder: options.sortOrder || 'desc', // 'asc' or 'desc'
      
      // UI customization
      showFilters: options.showFilters !== false,
      showExport: options.showExport !== false,
      showSummary: options.showSummary !== false,
      
      // Legend Map integration
      legendMapUrl: options.legendMapUrl || './legend-map.html',
      legendMapLinkType: options.legendMapLinkType || 'anchor', // 'anchor' or 'query'
      
      // Styling
      theme: options.theme || 'dark',
      compactMode: options.compactMode || false,
      
      // Callbacks
      onEventClick: options.onEventClick || null,
      onExport: options.onExport || null,
      onFilter: options.onFilter || null
    };
    
    // State
    this.currentLawId = null;
    this.events = [];
    this.filteredEvents = [];
    this.filters = {
      minWeight: 0,
      maxWeight: 1,
      startTime: null,
      endTime: null,
      eventTypes: new Set()
    };
    
    // DOM references
    this.container = null;
    this.elements = {};
    
    // Data source
    this.dataSource = options.dataSource || null;
  }
  
  /**
   * Create the drill-down component
   */
  createDrillDown(containerId, lawId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`Container ${containerId} not found, using document.body`);
      this.container = document.body;
    } else {
      this.container = container;
    }
    
    this.currentLawId = lawId;
    
    // Create main component
    const drillDownContainer = document.createElement('div');
    drillDownContainer.className = `evidence-drill-down ${this.config.theme}`;
    drillDownContainer.setAttribute('data-law-id', lawId);
    
    // Add header
    const header = this.createHeader(lawId);
    drillDownContainer.appendChild(header);
    
    // Add filters if enabled
    if (this.config.showFilters) {
      const filters = this.createFilters();
      drillDownContainer.appendChild(filters);
    }
    
    // Add summary if enabled
    if (this.config.showSummary) {
      const summary = this.createSummary();
      drillDownContainer.appendChild(summary);
    }
    
    // Add events list
    const eventsList = this.createEventsList();
    drillDownContainer.appendChild(eventsList);
    
    // Add export button if enabled
    if (this.config.showExport) {
      const exportSection = this.createExportSection();
      drillDownContainer.appendChild(exportSection);
    }
    
    this.container.appendChild(drillDownContainer);
    
    // Load events
    this.loadEvents(lawId);
    
    // Add CSS if not already present
    this.injectStyles();
    
    return drillDownContainer;
  }
  
  /**
   * Create header section
   */
  createHeader(lawId) {
    const header = document.createElement('div');
    header.className = 'drill-down-header';
    
    const title = document.createElement('h3');
    title.textContent = `Evidence for Law: ${lawId}`;
    
    const closeButton = document.createElement('button');
    closeButton.className = 'close-button';
    closeButton.textContent = '✕';
    closeButton.onclick = () => this.close();
    
    header.appendChild(title);
    header.appendChild(closeButton);
    
    this.elements.header = header;
    this.elements.title = title;
    
    return header;
  }
  
  /**
   * Create filters section
   */
  createFilters() {
    const filtersSection = document.createElement('div');
    filtersSection.className = 'drill-down-filters';
    
    // Weight range filter
    const weightFilter = document.createElement('div');
    weightFilter.className = 'filter-group';
    weightFilter.innerHTML = `
      <label>Weight Range:</label>
      <input type="range" id="min-weight" min="0" max="1" step="0.01" value="0">
      <span id="min-weight-value">0.00</span>
      <span>-</span>
      <input type="range" id="max-weight" min="0" max="1" step="0.01" value="1">
      <span id="max-weight-value">1.00</span>
    `;
    
    // Time range filter
    const timeFilter = document.createElement('div');
    timeFilter.className = 'filter-group';
    timeFilter.innerHTML = `
      <label>Time Range:</label>
      <input type="datetime-local" id="start-time">
      <span>-</span>
      <input type="datetime-local" id="end-time">
    `;
    
    // Sort options
    const sortOptions = document.createElement('div');
    sortOptions.className = 'filter-group';
    sortOptions.innerHTML = `
      <label>Sort By:</label>
      <select id="sort-by">
        <option value="timestamp">Timestamp</option>
        <option value="weight">Weight</option>
        <option value="residual">Residual</option>
      </select>
      <select id="sort-order">
        <option value="desc">Descending</option>
        <option value="asc">Ascending</option>
      </select>
    `;
    
    filtersSection.appendChild(weightFilter);
    filtersSection.appendChild(timeFilter);
    filtersSection.appendChild(sortOptions);
    
    // Add event listeners
    this.attachFilterListeners(filtersSection);
    
    this.elements.filters = filtersSection;
    
    return filtersSection;
  }
  
  /**
   * Create summary section
   */
  createSummary() {
    const summary = document.createElement('div');
    summary.className = 'drill-down-summary';
    
    summary.innerHTML = `
      <div class="summary-stat">
        <span class="stat-label">Total Events:</span>
        <span class="stat-value" id="total-events">0</span>
      </div>
      <div class="summary-stat">
        <span class="stat-label">Average Weight:</span>
        <span class="stat-value" id="avg-weight">0.00</span>
      </div>
      <div class="summary-stat">
        <span class="stat-label">Time Span:</span>
        <span class="stat-value" id="time-span">-</span>
      </div>
      <div class="summary-stat">
        <span class="stat-label">Confidence Impact:</span>
        <span class="stat-value" id="confidence-impact">0.00</span>
      </div>
    `;
    
    this.elements.summary = summary;
    
    return summary;
  }
  
  /**
   * Create events list
   */
  createEventsList() {
    const eventsContainer = document.createElement('div');
    eventsContainer.className = 'drill-down-events';
    
    const eventsList = document.createElement('div');
    eventsList.className = 'events-list';
    eventsList.id = 'events-list';
    
    eventsContainer.appendChild(eventsList);
    
    this.elements.eventsList = eventsList;
    
    return eventsContainer;
  }
  
  /**
   * Create export section
   */
  createExportSection() {
    const exportSection = document.createElement('div');
    exportSection.className = 'drill-down-export';
    
    const exportButton = document.createElement('button');
    exportButton.className = 'export-button';
    exportButton.textContent = '📥 Export Evidence';
    exportButton.onclick = () => this.exportEvidence();
    
    exportSection.appendChild(exportButton);
    
    this.elements.exportButton = exportButton;
    
    return exportSection;
  }
  
  /**
   * Load events for a law
   */
  async loadEvents(lawId) {
    try {
      // Get events from data source
      if (this.dataSource && typeof this.dataSource.getEventsForLaw === 'function') {
        this.events = await this.dataSource.getEventsForLaw(lawId);
      } else {
        // Mock data for testing
        this.events = this.generateMockEvents(lawId);
      }
      
      // Apply initial filters
      this.applyFilters();
      
      // Render events
      this.renderEvents();
      
      // Update summary
      this.updateSummary();
      
    } catch (error) {
      console.error('Error loading events:', error);
      this.showError('Failed to load events');
    }
  }
  
  /**
   * Generate mock events for testing
   */
  generateMockEvents(lawId) {
    const events = [];
    const now = Date.now();
    const types = ['measurement', 'prediction', 'anomaly', 'correlation'];
    
    for (let i = 0; i < 50; i++) {
      events.push({
        id: `event-${i}`,
        lawId: lawId,
        timestamp: now - Math.random() * 86400000 * 30, // Last 30 days
        type: types[Math.floor(Math.random() * types.length)],
        weight: Math.random(),
        residual: (Math.random() - 0.5) * 2,
        confidence: Math.random(),
        data: {
          source: `sensor-${Math.floor(Math.random() * 10)}`,
          value: Math.random() * 100,
          unit: 'units'
        },
        location: {
          x: Math.random() * 1000,
          y: Math.random() * 1000,
          layer: Math.floor(Math.random() * 5)
        }
      });
    }
    
    return events;
  }
  
  /**
   * Apply filters to events
   */
  applyFilters() {
    this.filteredEvents = this.events.filter(event => {
      // Weight filter
      if (event.weight < this.filters.minWeight || event.weight > this.filters.maxWeight) {
        return false;
      }
      
      // Time filter
      if (this.filters.startTime && event.timestamp < this.filters.startTime) {
        return false;
      }
      if (this.filters.endTime && event.timestamp > this.filters.endTime) {
        return false;
      }
      
      // Type filter
      if (this.filters.eventTypes.size > 0 && !this.filters.eventTypes.has(event.type)) {
        return false;
      }
      
      return true;
    });
    
    // Sort events
    this.filteredEvents.sort((a, b) => {
      let compareValue = 0;
      
      switch (this.config.sortBy) {
        case 'timestamp':
          compareValue = a.timestamp - b.timestamp;
          break;
        case 'weight':
          compareValue = a.weight - b.weight;
          break;
        case 'residual':
          compareValue = Math.abs(a.residual) - Math.abs(b.residual);
          break;
      }
      
      return this.config.sortOrder === 'asc' ? compareValue : -compareValue;
    });
    
    // Limit number of events
    if (this.filteredEvents.length > this.config.maxEventsToShow) {
      this.filteredEvents = this.filteredEvents.slice(0, this.config.maxEventsToShow);
    }
    
    // Trigger callback
    if (this.config.onFilter) {
      this.config.onFilter(this.filters, this.filteredEvents);
    }
  }
  
  /**
   * Render filtered events
   */
  renderEvents() {
    const eventsList = this.elements.eventsList;
    if (!eventsList) return;
    
    // Clear existing events
    eventsList.innerHTML = '';
    
    if (this.filteredEvents.length === 0) {
      eventsList.innerHTML = '<div class="no-events">No events match the current filters</div>';
      return;
    }
    
    // Render each event
    this.filteredEvents.forEach((event, index) => {
      const eventElement = this.createEventElement(event, index);
      eventsList.appendChild(eventElement);
    });
  }
  
  /**
   * Create individual event element
   */
  createEventElement(event, index) {
    const eventDiv = document.createElement('div');
    eventDiv.className = `event-item ${this.config.compactMode ? 'compact' : ''}`;
    eventDiv.setAttribute('data-event-id', event.id);
    
    // Format timestamp
    const timestamp = new Date(event.timestamp).toLocaleString();
    
    // Format weight and residual
    const weight = event.weight.toFixed(4);
    const residual = event.residual.toFixed(4);
    const residualClass = event.residual > 0 ? 'positive' : 'negative';
    
    // Create Legend Map link
    const legendMapLink = this.createLegendMapLink(event);
    
    eventDiv.innerHTML = `
      <div class="event-header">
        <span class="event-index">#${index + 1}</span>
        <span class="event-type ${event.type}">${event.type}</span>
        <span class="event-timestamp">${timestamp}</span>
      </div>
      <div class="event-metrics">
        <div class="metric">
          <span class="metric-label">Weight:</span>
          <span class="metric-value">${weight}</span>
          <div class="weight-bar" style="width: ${event.weight * 100}%"></div>
        </div>
        <div class="metric">
          <span class="metric-label">Residual:</span>
          <span class="metric-value ${residualClass}">${residual}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Confidence:</span>
          <span class="metric-value">${(event.confidence * 100).toFixed(1)}%</span>
        </div>
      </div>
      <div class="event-data">
        <code>${JSON.stringify(event.data, null, 2)}</code>
      </div>
      <div class="event-actions">
        ${legendMapLink}
        <button class="event-details-btn" onclick="this.parentElement.parentElement.classList.toggle('expanded')">
          ${this.config.compactMode ? 'Details' : 'Toggle Details'}
        </button>
      </div>
    `;
    
    // Add click handler
    if (this.config.onEventClick) {
      eventDiv.addEventListener('click', (e) => {
        if (!e.target.matches('button') && !e.target.matches('a')) {
          this.config.onEventClick(event, e);
        }
      });
    }
    
    return eventDiv;
  }
  
  /**
   * Create Legend Map link for event
   */
  createLegendMapLink(event) {
    if (!event.location) {
      return '<span class="no-location">No location data</span>';
    }
    
    let url = this.config.legendMapUrl;
    
    if (this.config.legendMapLinkType === 'anchor') {
      // Use anchor link
      url += `#event-${event.id}`;
    } else {
      // Use query parameters
      const params = new URLSearchParams({
        eventId: event.id,
        x: event.location.x,
        y: event.location.y,
        layer: event.location.layer || 0,
        highlight: true
      });
      url += `?${params.toString()}`;
    }
    
    return `
      <a href="${url}" class="legend-map-link" target="_blank" title="View in Legend Map">
        📍 View in Map
      </a>
    `;
  }
  
  /**
   * Update summary statistics
   */
  updateSummary() {
    if (!this.elements.summary) return;
    
    const totalEvents = this.filteredEvents.length;
    const avgWeight = totalEvents > 0 
      ? this.filteredEvents.reduce((sum, e) => sum + e.weight, 0) / totalEvents 
      : 0;
    
    // Calculate time span
    let timeSpan = '-';
    if (totalEvents > 0) {
      const timestamps = this.filteredEvents.map(e => e.timestamp);
      const minTime = Math.min(...timestamps);
      const maxTime = Math.max(...timestamps);
      const spanMs = maxTime - minTime;
      
      if (spanMs < 3600000) { // Less than 1 hour
        timeSpan = `${Math.round(spanMs / 60000)} minutes`;
      } else if (spanMs < 86400000) { // Less than 1 day
        timeSpan = `${Math.round(spanMs / 3600000)} hours`;
      } else {
        timeSpan = `${Math.round(spanMs / 86400000)} days`;
      }
    }
    
    // Calculate confidence impact
    const confidenceImpact = this.filteredEvents.reduce((sum, e) => {
      return sum + (e.weight * Math.abs(e.residual));
    }, 0);
    
    // Update DOM
    document.getElementById('total-events').textContent = totalEvents;
    document.getElementById('avg-weight').textContent = avgWeight.toFixed(4);
    document.getElementById('time-span').textContent = timeSpan;
    document.getElementById('confidence-impact').textContent = confidenceImpact.toFixed(4);
  }
  
  /**
   * Attach filter event listeners
   */
  attachFilterListeners(filtersSection) {
    // Weight range
    const minWeight = filtersSection.querySelector('#min-weight');
    const maxWeight = filtersSection.querySelector('#max-weight');
    const minWeightValue = filtersSection.querySelector('#min-weight-value');
    const maxWeightValue = filtersSection.querySelector('#max-weight-value');
    
    minWeight.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      minWeightValue.textContent = value.toFixed(2);
      this.filters.minWeight = value;
      this.applyFiltersAndRender();
    });
    
    maxWeight.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      maxWeightValue.textContent = value.toFixed(2);
      this.filters.maxWeight = value;
      this.applyFiltersAndRender();
    });
    
    // Time range
    const startTime = filtersSection.querySelector('#start-time');
    const endTime = filtersSection.querySelector('#end-time');
    
    startTime.addEventListener('change', (e) => {
      this.filters.startTime = e.target.value ? new Date(e.target.value).getTime() : null;
      this.applyFiltersAndRender();
    });
    
    endTime.addEventListener('change', (e) => {
      this.filters.endTime = e.target.value ? new Date(e.target.value).getTime() : null;
      this.applyFiltersAndRender();
    });
    
    // Sort options
    const sortBy = filtersSection.querySelector('#sort-by');
    const sortOrder = filtersSection.querySelector('#sort-order');
    
    sortBy.addEventListener('change', (e) => {
      this.config.sortBy = e.target.value;
      this.applyFiltersAndRender();
    });
    
    sortOrder.addEventListener('change', (e) => {
      this.config.sortOrder = e.target.value;
      this.applyFiltersAndRender();
    });
  }
  
  /**
   * Apply filters and re-render
   */
  applyFiltersAndRender() {
    this.applyFilters();
    this.renderEvents();
    this.updateSummary();
  }
  
  /**
   * Export evidence data
   */
  exportEvidence() {
    const exportData = {
      lawId: this.currentLawId,
      exportDate: new Date().toISOString(),
      filters: this.filters,
      totalEvents: this.events.length,
      filteredEvents: this.filteredEvents.length,
      events: this.filteredEvents.map(event => ({
        id: event.id,
        timestamp: new Date(event.timestamp).toISOString(),
        type: event.type,
        weight: event.weight,
        residual: event.residual,
        confidence: event.confidence,
        data: event.data,
        location: event.location
      }))
    };
    
    if (this.config.onExport) {
      this.config.onExport(exportData);
    } else {
      // Default: download as JSON
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `evidence-${this.currentLawId}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }
  
  /**
   * Show error message
   */
  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'drill-down-error';
    errorDiv.textContent = message;
    
    if (this.elements.eventsList) {
      this.elements.eventsList.innerHTML = '';
      this.elements.eventsList.appendChild(errorDiv);
    }
  }
  
  /**
   * Close the drill-down view
   */
  close() {
    const drillDown = this.container.querySelector('.evidence-drill-down');
    if (drillDown) {
      drillDown.remove();
    }
    
    // Reset state
    this.currentLawId = null;
    this.events = [];
    this.filteredEvents = [];
    this.elements = {};
  }
  
  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    Object.assign(this.config, newConfig);
    
    // Re-render if needed
    if (this.currentLawId) {
      this.applyFiltersAndRender();
    }
  }
  
  /**
   * Get current state
   */
  getState() {
    return {
      lawId: this.currentLawId,
      events: this.events.length,
      filteredEvents: this.filteredEvents.length,
      filters: { ...this.filters },
      config: { ...this.config }
    };
  }
  
  /**
   * Inject CSS styles
   */
  injectStyles() {
    if (typeof document === 'undefined') return;
    
    const styleId = 'evidence-drill-down-styles';
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* Evidence Drill-down Styles */
      .evidence-drill-down {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 90%;
        max-width: 900px;
        height: 80vh;
        background: rgba(17, 24, 39, 0.98);
        border: 1px solid rgba(139, 92, 246, 0.3);
        border-radius: 16px;
        padding: 24px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        z-index: 1000;
      }
      
      .evidence-drill-down.light {
        background: rgba(255, 255, 255, 0.98);
        color: #1f2937;
      }
      
      /* Header */
      .drill-down-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 16px;
        border-bottom: 1px solid rgba(139, 92, 246, 0.2);
      }
      
      .drill-down-header h3 {
        margin: 0;
        color: #e0e7ff;
        font-size: 20px;
        font-weight: 600;
      }
      
      .close-button {
        background: transparent;
        border: none;
        color: #94a3b8;
        font-size: 24px;
        cursor: pointer;
        padding: 4px 8px;
        transition: all 0.2s;
      }
      
      .close-button:hover {
        color: #e0e7ff;
        transform: scale(1.1);
      }
      
      /* Filters */
      .drill-down-filters {
        background: rgba(30, 41, 59, 0.5);
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 16px;
      }
      
      .filter-group {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
      }
      
      .filter-group:last-child {
        margin-bottom: 0;
      }
      
      .filter-group label {
        color: #94a3b8;
        font-size: 14px;
        min-width: 100px;
      }
      
      .filter-group input[type="range"] {
        width: 120px;
      }
      
      .filter-group span {
        color: #e0e7ff;
        font-size: 12px;
        font-family: 'Monaco', 'Menlo', monospace;
      }
      
      .filter-group select {
        background: rgba(17, 24, 39, 0.8);
        border: 1px solid rgba(139, 92, 246, 0.3);
        color: #e0e7ff;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 14px;
      }
      
      /* Summary */
      .drill-down-summary {
        display: flex;
        gap: 24px;
        background: rgba(139, 92, 246, 0.1);
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 16px;
      }
      
      .summary-stat {
        flex: 1;
        text-align: center;
      }
      
      .stat-label {
        display: block;
        color: #94a3b8;
        font-size: 12px;
        margin-bottom: 4px;
      }
      
      .stat-value {
        display: block;
        color: #e0e7ff;
        font-size: 20px;
        font-weight: 600;
        font-family: 'Monaco', 'Menlo', monospace;
      }
      
      /* Events List */
      .drill-down-events {
        flex: 1;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      
      .events-list {
        flex: 1;
        overflow-y: auto;
        padding-right: 8px;
      }
      
      .event-item {
        background: rgba(30, 41, 59, 0.5);
        border: 1px solid rgba(139, 92, 246, 0.2);
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 12px;
        transition: all 0.3s;
      }
      
      .event-item:hover {
        border-color: rgba(139, 92, 246, 0.5);
        box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2);
      }
      
      .event-item.compact .event-data {
        display: none;
      }
      
      .event-item.expanded .event-data {
        display: block;
      }
      
      /* Event Header */
      .event-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
      }
      
      .event-index {
        color: #64748b;
        font-size: 12px;
        font-weight: 600;
      }
      
      .event-type {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
      }
      
      .event-type.measurement {
        background: rgba(59, 130, 246, 0.2);
        color: #60a5fa;
      }
      
      .event-type.prediction {
        background: rgba(168, 85, 247, 0.2);
        color: #c084fc;
      }
      
      .event-type.anomaly {
        background: rgba(239, 68, 68, 0.2);
        color: #f87171;
      }
      
      .event-type.correlation {
        background: rgba(34, 197, 94, 0.2);
        color: #4ade80;
      }
      
      .event-timestamp {
        margin-left: auto;
        color: #94a3b8;
        font-size: 12px;
      }
      
      /* Event Metrics */
      .event-metrics {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        margin-bottom: 12px;
      }
      
      .metric {
        position: relative;
      }
      
      .metric-label {
        display: block;
        color: #94a3b8;
        font-size: 11px;
        margin-bottom: 4px;
      }
      
      .metric-value {
        color: #e0e7ff;
        font-size: 16px;
        font-weight: 600;
        font-family: 'Monaco', 'Menlo', monospace;
      }
      
      .metric-value.positive {
        color: #4ade80;
      }
      
      .metric-value.negative {
        color: #f87171;
      }
      
      .weight-bar {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 2px;
        background: linear-gradient(90deg, #8b5cf6, #a855f7);
        border-radius: 1px;
        transition: width 0.3s;
      }
      
      /* Event Data */
      .event-data {
        background: rgba(17, 24, 39, 0.8);
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 12px;
        max-height: 200px;
        overflow-y: auto;
      }
      
      .event-data code {
        color: #94a3b8;
        font-size: 12px;
        font-family: 'Monaco', 'Menlo', monospace;
        white-space: pre;
      }
      
      /* Event Actions */
      .event-actions {
        display: flex;
        gap: 12px;
        align-items: center;
      }
      
      .legend-map-link {
        color: #8b5cf6;
        text-decoration: none;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 4px;
        transition: all 0.2s;
      }
      
      .legend-map-link:hover {
        color: #a855f7;
        transform: translateX(2px);
      }
      
      .event-details-btn {
        margin-left: auto;
        background: transparent;
        border: 1px solid rgba(139, 92, 246, 0.3);
        color: #94a3b8;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .event-details-btn:hover {
        border-color: rgba(139, 92, 246, 0.6);
        color: #e0e7ff;
      }
      
      .no-location {
        color: #64748b;
        font-size: 12px;
        font-style: italic;
      }
      
      /* Export Section */
      .drill-down-export {
        padding-top: 16px;
        border-top: 1px solid rgba(139, 92, 246, 0.2);
        text-align: center;
      }
      
      .export-button {
        background: rgba(139, 92, 246, 0.2);
        border: 1px solid rgba(139, 92, 246, 0.4);
        color: #e0e7ff;
        padding: 10px 24px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s;
      }
      
      .export-button:hover {
        background: rgba(139, 92, 246, 0.3);
        border-color: rgba(139, 92, 246, 0.6);
        transform: translateY(-1px);
      }
      
      /* Error State */
      .drill-down-error {
        text-align: center;
        color: #f87171;
        padding: 40px;
        font-size: 16px;
      }
      
      .no-events {
        text-align: center;
        color: #94a3b8;
        padding: 40px;
        font-size: 16px;
      }
      
      /* Scrollbar */
      .events-list::-webkit-scrollbar {
        width: 8px;
      }
      
      .events-list::-webkit-scrollbar-track {
        background: rgba(30, 41, 59, 0.3);
        border-radius: 4px;
      }
      
      .events-list::-webkit-scrollbar-thumb {
        background: rgba(139, 92, 246, 0.5);
        border-radius: 4px;
      }
      
      .events-list::-webkit-scrollbar-thumb:hover {
        background: rgba(139, 92, 246, 0.7);
      }
      
      /* Responsive */
      @media (max-width: 768px) {
        .evidence-drill-down {
          width: 95%;
          height: 90vh;
          padding: 16px;
        }
        
        .drill-down-summary {
          flex-wrap: wrap;
          gap: 12px;
        }
        
        .summary-stat {
          flex: 1 1 45%;
        }
        
        .event-metrics {
          grid-template-columns: 1fr;
          gap: 8px;
        }
        
        .filter-group {
          flex-wrap: wrap;
        }
        
        .filter-group label {
          width: 100%;
          margin-bottom: 4px;
        }
      }
      
      /* Animation */
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translate(-50%, -45%);
        }
        to {
          opacity: 1;
          transform: translate(-50%, -50%);
        }
      }
      
      .evidence-drill-down {
        animation: slideIn 0.3s ease-out;
      }
    `;
    
    document.head.appendChild(style);
  }
}

/**
 * Integration with existing UI components
 */
export function integrateDrillDown(uiSystem) {
  // Create drill-down instance
  const drillDown = new EvidenceDrillDown({
    dataSource: uiSystem.dataSource,
    legendMapUrl: uiSystem.config?.legendMapUrl || './legend-map.html',
    onEventClick: (event) => {
      console.log('Event clicked:', event);
      // Could trigger additional UI actions
    },
    onExport: (data) => {
      console.log('Exporting evidence:', data);
      // Could integrate with export system
    }
  });
  
  // Add method to show drill-down for a law
  uiSystem.showEvidenceDrillDown = function(lawId) {
    // Create container if needed
    let container = document.getElementById('drill-down-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'drill-down-container';
      document.body.appendChild(container);
    }
    
    // Create drill-down
    drillDown.createDrillDown('drill-down-container', lawId);
  };
  
  // Add click handlers to existing law elements
  if (uiSystem.attachLawClickHandlers) {
    uiSystem.attachLawClickHandlers((lawId) => {
      uiSystem.showEvidenceDrillDown(lawId);
    });
  }
  
  return drillDown;
}

/**
 * Standalone usage example
 */
export function createStandaloneDrillDown(lawId, options = {}) {
  const drillDown = new EvidenceDrillDown(options);
  
  // Create container
  const container = document.createElement('div');
  container.id = `drill-down-${Date.now()}`;
  document.body.appendChild(container);
  
  // Create drill-down
  drillDown.createDrillDown(container.id, lawId);
  
  return drillDown;
}