/**
 * Codex API - REST and WebSocket interface for temporal consciousness agents
 * Allows external agents to:
 * - Submit temporal observations
 * - Query temporal laws
 * - Subscribe to law updates
 * - Contribute to hypothesis testing
 */

import { EventEmitter } from 'events';
import express from 'express';
import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';

export class CodexAPI extends EventEmitter {
  constructor(codexEngine, port = 8765) {
    super();
    
    this.codex = codexEngine;
    this.port = port;
    
    // Agent management
    this.agents = new Map();
    this.connections = new Map();
    
    // API configuration
    this.config = {
      maxAgents: 100,
      rateLimit: {
        windowMs: 60000,     // 1 minute
        maxRequests: 100,    // per agent
        maxObservations: 50  // per request
      },
      auth: {
        enabled: true,
        tokenExpiry: 86400000 // 24 hours
      }
    };
    
    // Initialize servers
    this.app = null;
    this.server = null;
    this.wss = null;
    
    // API statistics
    this.stats = {
      totalRequests: 0,
      totalObservations: 0,
      activeConnections: 0,
      agentActivity: new Map()
    };
  }
  
  /**
   * Initialize API servers
   */
  async initialize() {
    // Create Express app
    this.app = express();
    this.app.use(express.json());
    
    // Add middleware
    this.setupMiddleware();
    
    // Define routes
    this.setupRoutes();
    
    // Create HTTP server
    this.server = this.app.listen(this.port, () => {
      console.log(`🌐 Codex API listening on port ${this.port}`);
    });
    
    // Create WebSocket server
    this.wss = new WebSocketServer({ server: this.server });
    this.setupWebSocket();
    
    // Hook into Codex events
    this.setupCodexHooks();
    
    return { port: this.port, url: `http://localhost:${this.port}` };
  }
  
  /**
   * Setup middleware
   */
  setupMiddleware() {
    // CORS
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
      next();
    });
    
    // Authentication
    this.app.use((req, res, next) => {
      if (!this.config.auth.enabled) {
        return next();
      }
      
      // Skip auth for registration
      if (req.path === '/api/v1/agents/register') {
        return next();
      }
      
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ error: 'No authentication token provided' });
      }
      
      const agent = this.validateToken(token);
      if (!agent) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
      
      req.agent = agent;
      next();
    });
    
    // Rate limiting
    this.app.use((req, res, next) => {
      if (!req.agent) return next();
      
      const agentId = req.agent.id;
      const activity = this.stats.agentActivity.get(agentId) || {
        requests: [],
        lastReset: Date.now()
      };
      
      // Reset window if needed
      if (Date.now() - activity.lastReset > this.config.rateLimit.windowMs) {
        activity.requests = [];
        activity.lastReset = Date.now();
      }
      
      // Check rate limit
      if (activity.requests.length >= this.config.rateLimit.maxRequests) {
        return res.status(429).json({ 
          error: 'Rate limit exceeded',
          retryAfter: this.config.rateLimit.windowMs - (Date.now() - activity.lastReset)
        });
      }
      
      activity.requests.push(Date.now());
      this.stats.agentActivity.set(agentId, activity);
      
      next();
    });
  }
  
  /**
   * Setup API routes
   */
  setupRoutes() {
    const router = express.Router();
    
    // Agent registration
    router.post('/agents/register', this.handleAgentRegistration.bind(this));
    
    // Submit observations
    router.post('/observations', this.handleObservationSubmission.bind(this));
    
    // Query laws
    router.get('/laws', this.handleLawQuery.bind(this));
    router.get('/laws/:id', this.handleLawDetails.bind(this));
    
    // Query hypotheses
    router.get('/hypotheses', this.handleHypothesisQuery.bind(this));
    router.post('/hypotheses/:id/evidence', this.handleEvidenceSubmission.bind(this));
    
    // Get glyphs
    router.get('/glyphs/:lawId', this.handleGlyphRequest.bind(this));
    
    // Get narratives
    router.get('/narratives/:lawId', this.handleNarrativeRequest.bind(this));
    
    // Agent status
    router.get('/agents/:id/status', this.handleAgentStatus.bind(this));
    
    // API status
    router.get('/status', this.handleAPIStatus.bind(this));
    
    this.app.use('/api/v1', router);
  }
  
  /**
   * Setup hooks into Codex Engine
   */
  setupCodexHooks() {
    // Hypothesis status changes
    this.codex.hypothesisLifecycle.on('onStatusChange', (data) => {
      this.broadcastToSubscribers('hypothesis-updates', {
        type: 'hypothesisStatusChanged',
        hypothesis: this.serializeHypothesis(data.hypothesis)
      });
    });
    
    // Law updates (when confidence changes)
    const originalUpdateConfidence = this.codex.updateConfidence;
    this.codex.updateConfidence = function(oldConfidence, data) {
      const newConfidence = originalUpdateConfidence.call(this, oldConfidence, data);
      
      if (this.currentLawId) {
        const law = this.codex.laws.get(this.currentLawId);
        if (law && Math.abs(law.confidence - oldConfidence) > 0.01) {
          this.api?.broadcastToSubscribers('law-updates', {
            type: 'lawUpdated',
            law: this.api.serializeLaw(law)
          });
        }
      }
      
      return newConfidence;
    }.bind(this.codex);
    
    // New law discoveries
    const originalAddNewLaw = this.codex.addNewLaw;
    this.codex.addNewLaw = function(id, lawData) {
      const result = originalAddNewLaw.call(this, id, lawData);
      
      if (result) {
        this.api?.broadcastToSubscribers('law-updates', {
          type: 'lawDiscovered',
          law: this.api.serializeLaw(result)
        });
      }
      
      return result;
    }.bind(this.codex);
    
    // Store API reference in codex for callbacks
    this.codex.api = this;
  }
  
  /**
   * Setup WebSocket connections
   */
  setupWebSocket() {
    this.wss.on('connection', (ws, req) => {
      const connectionId = uuidv4();
      
      // Parse token from query
      const token = new URLSearchParams(req.url.split('?')[1]).get('token');
      const agent = this.validateToken(token);
      
      if (!agent) {
        ws.send(JSON.stringify({ error: 'Invalid token' }));
        ws.close();
        return;
      }
      
      // Store connection
      this.connections.set(connectionId, {
        ws,
        agent,
        subscriptions: new Set(),
        connected: Date.now()
      });
      
      this.stats.activeConnections++;
      
      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connected',
        connectionId,
        agent: {
          id: agent.id,
          name: agent.name
        }
      }));
      
      // Handle messages
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          this.handleWebSocketMessage(connectionId, message);
        } catch (error) {
          ws.send(JSON.stringify({ error: 'Invalid message format' }));
        }
      });
      
      // Handle disconnect
      ws.on('close', () => {
        this.connections.delete(connectionId);
        this.stats.activeConnections--;
      });
    });
  }
  
  /**
   * Setup hooks into Codex Engine
   */
  setupCodexHooks() {
    // Law updates
    this.codex.on('lawUpdated', (law) => {
      this.broadcastToSubscribers('law-updates', {
        type: 'lawUpdated',
        law: this.serializeLaw(law)
      });
    });
    
    // New laws discovered
    this.codex.on('lawDiscovered', (law) => {
      this.broadcastToSubscribers('law-updates', {
        type: 'lawDiscovered',
        law: this.serializeLaw(law)
      });
    });
    
    // Hypothesis status changes
    this.codex.hypothesisLifecycle.on('statusChanged', (hypothesis) => {
      this.broadcastToSubscribers('hypothesis-updates', {
        type: 'hypothesisStatusChanged',
        hypothesis: this.serializeHypothesis(hypothesis)
      });
    });
  }
  
  /**
   * Handle agent registration
   */
  async handleAgentRegistration(req, res) {
    const { name, description, capabilities } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Agent name required' });
    }
    
    // Check if agent already exists
    const existingAgent = Array.from(this.agents.values())
      .find(a => a.name === name);
      
    if (existingAgent) {
      return res.status(409).json({ error: 'Agent name already registered' });
    }
    
    // Create agent
    const agent = {
      id: uuidv4(),
      name,
      description: description || '',
      capabilities: capabilities || [],
      registered: Date.now(),
      token: this.generateToken()
    };
    
    this.agents.set(agent.id, agent);
    
    res.json({
      agentId: agent.id,
      token: agent.token,
      expiresIn: this.config.auth.tokenExpiry
    });
  }
  
  /**
   * Handle observation submission
   */
  async handleObservationSubmission(req, res) {
    const { observations } = req.body;
    
    if (!Array.isArray(observations)) {
      return res.status(400).json({ error: 'Observations must be an array' });
    }
    
    if (observations.length > this.config.rateLimit.maxObservations) {
      return res.status(400).json({ 
        error: `Maximum ${this.config.rateLimit.maxObservations} observations per request`
      });
    }
    
    const results = [];
    
    for (const obs of observations) {
      try {
        // Validate observation
        if (!obs.timestamp || !obs.type || !obs.data) {
          results.push({ error: 'Invalid observation format' });
          continue;
        }
        
        // Process observation
        const result = await this.processObservation(obs, req.agent);
        results.push(result);
        
        this.stats.totalObservations++;
      } catch (error) {
        results.push({ error: error.message });
      }
    }
    
    this.stats.totalRequests++;
    
    res.json({
      processed: results.filter(r => !r.error).length,
      failed: results.filter(r => r.error).length,
      results
    });
  }
  
  /**
   * Process single observation
   */
  async processObservation(observation, agent) {
    // Add agent metadata
    observation.source = {
      agentId: agent.id,
      agentName: agent.name,
      submittedAt: Date.now()
    };
    
    // Route to appropriate handler based on type
    switch (observation.type) {
      case 'temporal_event':
        return this.codex.processTemporalEvent(observation.data);
        
      case 'pattern_observation':
        return this.codex.analyzeRhythmPattern(observation.data);
        
      case 'hypothesis_evidence':
        const hypothesis = this.codex.hypotheses.get(observation.data.hypothesisId);
        if (hypothesis) {
          return this.codex.hypothesisLifecycle.addEvidence(
            hypothesis,
            observation.data
          );
        }
        return { error: 'Hypothesis not found' };
        
      default:
        return { error: 'Unknown observation type' };
    }
  }
  
  /**
   * Handle law query
   */
  async handleLawQuery(req, res) {
    const { confidence, type, limit = 50 } = req.query;
    
    let laws = Array.from(this.codex.codex.laws.values());
    
    // Filter by confidence
    if (confidence) {
      const minConfidence = parseFloat(confidence);
      laws = laws.filter(law => law.confidence >= minConfidence);
    }
    
    // Filter by type
    if (type) {
      laws = laws.filter(law => law.id.includes(type));
    }
    
    // Sort by confidence
    laws.sort((a, b) => b.confidence - a.confidence);
    
    // Limit results
    laws = laws.slice(0, parseInt(limit));
    
    res.json({
      count: laws.length,
      laws: laws.map(law => this.serializeLaw(law))
    });
  }
  
  /**
   * Handle law details request
   */
  async handleLawDetails(req, res) {
    const { id } = req.params;
    const law = this.codex.codex.laws.get(id);
    
    if (!law) {
      return res.status(404).json({ error: 'Law not found' });
    }
    
    const glyph = this.codex.codex.glyphs.get(id);
    const narrative = this.codex.codex.narratives.get(id);
    
    res.json({
      law: this.serializeLaw(law),
      glyph: glyph ? {
        svg: glyph.svg.outerHTML,
        metadata: this.codex.getGlyphMetadata(id)
      } : null,
      narrative: narrative ? {
        text: narrative.text,
        sections: narrative.sections,
        confidence: narrative.confidence
      } : null
    });
  }
  
  /**
   * Process single observation
   */
  async processObservation(observation, agent) {
    // Add agent metadata
    observation.source = {
      agentId: agent.id,
      agentName: agent.name,
      submittedAt: Date.now()
    };
    
    // Route to appropriate handler based on type
    switch (observation.type) {
      case 'temporal_event':
        return this.codex.processTemporalEvent(observation.data);
        
      case 'pattern_observation':
        return this.codex.analyzeRhythmPattern(observation.data);
        
      case 'hypothesis_evidence':
        const hypothesis = this.codex.hypothesisLifecycle.hypotheses.get(observation.data.hypothesisId);
        if (hypothesis) {
          return this.codex.hypothesisLifecycle.addEvidence(
            observation.data.hypothesisId,
            observation.data
          );
        }
        return { error: 'Hypothesis not found' };
        
      default:
        return { error: 'Unknown observation type' };
    }
  }
  
  /**
   * Handle hypothesis query
   */
  async handleHypothesisQuery(req, res) {
    const { status, limit = 50 } = req.query;
    
    let hypotheses = Array.from(this.codex.hypothesisLifecycle.hypotheses.values());
    
    // Filter by status
    if (status) {
      hypotheses = hypotheses.filter(h => h.status === status);
    }
    
    // Sort by confidence
    hypotheses.sort((a, b) => b.confidence - a.confidence);
    
    // Limit results
    hypotheses = hypotheses.slice(0, parseInt(limit));
    
    res.json({
      count: hypotheses.length,
      hypotheses: hypotheses.map(h => this.serializeHypothesis(h))
    });
  }
  
  /**
   * Handle evidence submission for hypothesis
   */
  async handleEvidenceSubmission(req, res) {
    const { id } = req.params;
    const { evidence } = req.body;
    
    const hypothesis = this.codex.hypothesisLifecycle.hypotheses.get(id);
    if (!hypothesis) {
      return res.status(404).json({ error: 'Hypothesis not found' });
    }
    
    // Add agent source
    evidence.source = {
      agentId: req.agent.id,
      agentName: req.agent.name
    };
    
    const result = this.codex.hypothesisLifecycle.addEvidence(id, evidence);
    
    res.json({
      hypothesisId: id,
      newStatus: hypothesis.status,
      confidence: hypothesis.confidence,
      evidenceCount: hypothesis.evidence.length
    });
  }
  
  /**
   * Handle glyph request
   */
  async handleGlyphRequest(req, res) {
    const { lawId } = req.params;
    const { format = 'svg' } = req.query;
    
    const glyph = this.codex.codex.glyphs.get(lawId);
    if (!glyph) {
      return res.status(404).json({ error: 'Glyph not found' });
    }
    
    if (format === 'svg') {
      res.type('image/svg+xml');
      res.send(glyph.svg.outerHTML);
    } else if (format === 'png') {
      try {
        const blob = await this.codex.exportGlyph(lawId, 'png');
        const buffer = await blob.arrayBuffer();
        res.type('image/png');
        res.send(Buffer.from(buffer));
      } catch (error) {
        res.status(500).json({ error: 'Failed to export glyph' });
      }
    } else {
      res.status(400).json({ error: 'Invalid format' });
    }
  }
  
  /**
   * Handle narrative request
   */
  async handleNarrativeRequest(req, res) {
    const { lawId } = req.params;
    const { format = 'markdown' } = req.query;
    
    const narrative = this.codex.codex.narratives.get(lawId);
    if (!narrative) {
      return res.status(404).json({ error: 'Narrative not found' });
    }
    
    const exported = this.codex.exportNarrative(lawId, format);
    
    if (format === 'markdown') {
      res.type('text/markdown');
      res.send(exported);
    } else if (format === 'html') {
      res.type('text/html');
      res.send(exported);
    } else {
      res.type('text/plain');
      res.send(exported);
    }
  }
  
  /**
   * Handle agent status request
   */
  async handleAgentStatus(req, res) {
    const { id } = req.params;
    
    const agent = this.agents.get(id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    const activity = this.stats.agentActivity.get(id) || {
      requests: [],
      lastReset: Date.now()
    };
    
    const connections = Array.from(this.connections.values())
      .filter(c => c.agent.id === id);
    
    res.json({
      agent: {
        id: agent.id,
        name: agent.name,
        registered: new Date(agent.registered).toISOString()
      },
      activity: {
        requestsInWindow: activity.requests.length,
        windowResetIn: this.config.rateLimit.windowMs - (Date.now() - activity.lastReset),
        activeConnections: connections.length
      }
    });
  }
  
  /**
   * Handle API status request
   */
  async handleAPIStatus(req, res) {
    res.json({
      status: 'operational',
      version: '1.0.0',
      stats: {
        totalRequests: this.stats.totalRequests,
        totalObservations: this.stats.totalObservations,
        activeConnections: this.stats.activeConnections,
        registeredAgents: this.agents.size,
        activeLaws: this.codex.codex.laws.size,
        activeHypotheses: this.codex.hypothesisLifecycle.hypotheses.size
      },
      limits: {
        maxAgents: this.config.maxAgents,
        rateLimit: this.config.rateLimit
      }
    });
  }
  
  /**
   * Handle WebSocket messages
   */
  handleWebSocketMessage(connectionId, message) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;
    
    switch (message.type) {
      case 'subscribe':
        this.handleSubscription(connection, message.channel);
        break;
        
      case 'unsubscribe':
        this.handleUnsubscription(connection, message.channel);
        break;
        
      case 'observation':
        this.handleRealtimeObservation(connection, message.data);
        break;
        
      case 'ping':
        connection.ws.send(JSON.stringify({ type: 'pong' }));
        break;
        
      default:
        connection.ws.send(JSON.stringify({ 
          error: 'Unknown message type' 
        }));
    }
  }
  
  /**
   * Handle channel subscription
   */
  handleSubscription(connection, channel) {
    const validChannels = ['law-updates', 'hypothesis-updates', 'agent-activity'];
    
    if (!validChannels.includes(channel)) {
      connection.ws.send(JSON.stringify({ 
        error: 'Invalid channel' 
      }));
      return;
    }
    
    connection.subscriptions.add(channel);
    
    connection.ws.send(JSON.stringify({
      type: 'subscribed',
      channel
    }));
  }
  
  /**
   * Handle channel unsubscription
   */
  handleUnsubscription(connection, channel) {
    connection.subscriptions.delete(channel);
    
    connection.ws.send(JSON.stringify({
      type: 'unsubscribed',
      channel
    }));
  }
  
  /**
   * Handle realtime observation
   */
  async handleRealtimeObservation(connection, observation) {
    try {
      const result = await this.processObservation(observation, connection.agent);
      
      connection.ws.send(JSON.stringify({
        type: 'observationProcessed',
        result
      }));
      
      // Broadcast to other agents if significant
      if (result.significant) {
        this.broadcastToSubscribers('agent-activity', {
          type: 'significantObservation',
          agent: connection.agent.name,
          observation: result
        });
      }
    } catch (error) {
      connection.ws.send(JSON.stringify({
        type: 'error',
        error: error.message
      }));
    }
  }
  
  /**
   * Broadcast to channel subscribers
   */
  broadcastToSubscribers(channel, message) {
    this.connections.forEach(connection => {
      if (connection.subscriptions.has(channel)) {
        connection.ws.send(JSON.stringify(message));
      }
    });
  }
  
  /**
   * Generate authentication token
   */
  generateToken() {
    return Buffer.from(uuidv4() + ':' + Date.now()).toString('base64');
  }
  
  /**
   * Validate authentication token
   */
  validateToken(token) {
    if (!token) return null;
    
    try {
      const decoded = Buffer.from(token, 'base64').toString();
      const [id, timestamp] = decoded.split(':');
      
      // Check expiry
      if (Date.now() - parseInt(timestamp) > this.config.auth.tokenExpiry) {
        return null;
      }
      
      // Find agent with matching token
      const agent = Array.from(this.agents.values())
        .find(a => a.token === token);
        
      return agent;
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Serialize law for API response
   */
  serializeLaw(law) {
    return {
      id: law.id,
      name: law.name,
      formula: law.formula,
      description: law.description,
      confidence: law.confidence,
      parameters: law.parameters,
      evidence: law.evidence?.length || 0,
      lastUpdated: law.lastUpdated || Date.now()
    };
  }
  
  /**
   * Serialize hypothesis for API response
   */
  serializeHypothesis(hypothesis) {
    return {
      id: hypothesis.id,
      description: hypothesis.description,
      status: hypothesis.status,
      confidence: hypothesis.confidence,
      evidence: hypothesis.evidence.length,
      proposed: hypothesis.proposed,
      lastUpdated: hypothesis.lastUpdated
    };
  }
  
  /**
   * Shutdown API servers
   */
  async shutdown() {
    // Close WebSocket connections
    this.connections.forEach(connection => {
      connection.ws.send(JSON.stringify({
        type: 'serverShutdown',
        message: 'API server shutting down'
      }));
      connection.ws.close();
    });
    
    // Close servers
    if (this.wss) {
      this.wss.close();
    }
    
    if (this.server) {
      await new Promise(resolve => this.server.close(resolve));
    }
    
    console.log('🔌 Codex API shut down');
  }
}

/**
 * Create API documentation
 */
export function generateAPIDocs() {
  return `
# Codex API Documentation

## Overview
The Codex API provides programmatic access to the Temporal Patterns Codex,
allowing external agents to contribute observations and access discovered laws.

## Authentication
All requests require an authentication token obtained through agent registration.

### Register Agent
POST /api/v1/agents/register
{
  "name": "MyAgent",
  "description": "Description of agent capabilities",
  "capabilities": ["temporal_analysis", "pattern_detection"]
}

Response:
{
  "agentId": "uuid",
  "token": "base64_token",
  "expiresIn": 86400000
}

## Endpoints

### Submit Observations
POST /api/v1/observations
Headers: Authorization: Bearer <token>
{
  "observations": [
    {
      "timestamp": 1234567890,
      "type": "temporal_event",
      "data": {
        "velocity": 1.5,
        "activity": 75
      }
    }
  ]
}

### Query Laws
GET /api/v1/laws?confidence=0.7&type=rhythmic&limit=10

### Get Law Details
GET /api/v1/laws/{lawId}

### Query Hypotheses
GET /api/v1/hypotheses?status=gathering&limit=20

### Submit Evidence
POST /api/v1/hypotheses/{hypothesisId}/evidence
{
  "evidence": {
    "timestamp": 1234567890,
    "supports": true,
    "data": {}
  }
}

### Get Glyph
GET /api/v1/glyphs/{lawId}?format=svg

### Get Narrative
GET /api/v1/narratives/{lawId}?format=markdown

## WebSocket Interface
Connect to ws://localhost:8765?token=<token>

### Subscribe to Updates
{
  "type": "subscribe",
  "channel": "law-updates"
}

### Submit Realtime Observation
{
  "type": "observation",
  "data": {
    "timestamp": 1234567890,
    "type": "temporal_event",
    "data": {}
  }
}

## Rate Limits
- 100 requests per minute per agent
- 50 observations per request
- 100 concurrent WebSocket connections

## Example Client

\`\`\`javascript
class CodexClient {
  constructor(agentName) {
    this.baseURL = 'http://localhost:8765/api/v1';
    this.token = null;
    this.ws = null;
  }
  
  async register(description) {
    const response = await fetch(\`\${this.baseURL}/agents/register\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name: this.agentName,
        description 
      })
    });
    
    const data = await response.json();
    this.token = data.token;
    
    return data;
  }
  
  async submitObservations(observations) {
    const response = await fetch(\`\${this.baseURL}/observations\`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${this.token}\`
      },
      body: JSON.stringify({ observations })
    });
    
    return response.json();
  }
  
  connectWebSocket() {
    this.ws = new WebSocket(\`ws://localhost:8765?token=\${this.token}\`);
    
    this.ws.on('open', () => {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        channel: 'law-updates'
      }));
    });
    
    this.ws.on('message', (data) => {
      const message = JSON.parse(data);
      console.log('Received:', message);
    });
  }
}
\`\`\`
`;
}