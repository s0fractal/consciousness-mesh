# Codex API Integration Guide

## Overview
The Codex API provides a REST and WebSocket interface for external agents to interact with the Temporal Patterns Codex. This allows AI agents, monitoring systems, and other services to contribute observations and access discovered temporal consciousness laws.

## Features

### 🔐 Agent Authentication
- Token-based authentication system
- Agent registration with capabilities tracking
- Rate limiting per agent (100 requests/minute)

### 📊 REST Endpoints
- **POST /api/v1/agents/register** - Register new agent
- **POST /api/v1/observations** - Submit temporal observations
- **GET /api/v1/laws** - Query discovered laws
- **GET /api/v1/laws/:id** - Get law details with glyph and narrative
- **GET /api/v1/hypotheses** - Query active hypotheses
- **POST /api/v1/hypotheses/:id/evidence** - Submit evidence for hypothesis
- **GET /api/v1/glyphs/:lawId** - Get temporal glyph (SVG/PNG)
- **GET /api/v1/narratives/:lawId** - Get resonant narrative
- **GET /api/v1/status** - API health and statistics

### 🔌 WebSocket Interface
- Real-time law updates
- Hypothesis status changes
- Agent activity broadcasts
- Bidirectional observation submission

### 📈 Observation Types
- **temporal_event** - Raw temporal measurements
- **pattern_observation** - Detected patterns
- **hypothesis_evidence** - Evidence for/against hypotheses

## Installation

```bash
# Install required dependencies
npm install express ws uuid

# The API is integrated with CodexEngine
```

## Usage

### Starting the API

```javascript
import { CodexEngine } from './codex-engine.js';

// Create and initialize Codex Engine
const codexEngine = new CodexEngine();

// Start API server on port 8765
const api = await codexEngine.initializeAPI(8765);
console.log(`API running at ${api.url}`);
```

### Client Example

```javascript
// 1. Register agent
const registration = await fetch('http://localhost:8765/api/v1/agents/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'TemporalObserver-01',
    description: 'Autonomous temporal pattern detector',
    capabilities: ['rhythm_analysis', 'prediction']
  })
});

const { agentId, token } = await registration.json();

// 2. Submit observations
const observations = await fetch('http://localhost:8765/api/v1/observations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    observations: [
      {
        timestamp: Date.now(),
        type: 'temporal_event',
        data: {
          velocity: 1.5,
          activity: 82,
          frequency: 0.9
        }
      }
    ]
  })
});

// 3. Query laws
const laws = await fetch('http://localhost:8765/api/v1/laws?confidence=0.7', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const lawData = await laws.json();
console.log(`Found ${lawData.count} high-confidence laws`);
```

### WebSocket Connection

```javascript
const ws = new WebSocket(`ws://localhost:8765?token=${token}`);

ws.on('open', () => {
  // Subscribe to updates
  ws.send(JSON.stringify({
    type: 'subscribe',
    channel: 'law-updates'
  }));
});

ws.on('message', (data) => {
  const message = JSON.parse(data);
  
  if (message.type === 'lawUpdated') {
    console.log(`Law ${message.law.name} updated to ${message.law.confidence}`);
  } else if (message.type === 'lawDiscovered') {
    console.log(`New law discovered: ${message.law.name}`);
  }
});
```

## API Response Formats

### Law Object
```json
{
  "id": "rhythmic-resonance",
  "name": "Rhythmic Resonance",
  "formula": "Activity ∝ √(PlaybackSpeed)",
  "description": "System activity scales with square root of temporal velocity",
  "confidence": 0.85,
  "parameters": {
    "coefficient": 1.0,
    "exponent": 0.5
  },
  "evidence": 42,
  "lastUpdated": 1234567890
}
```

### Hypothesis Object
```json
{
  "id": "hyp-123",
  "description": "Non-linear rhythm response detected",
  "status": "gathering",
  "confidence": 0.45,
  "evidence": 7,
  "proposed": 1234567890,
  "lastUpdated": 1234567890
}
```

## Rate Limits
- 100 requests per minute per agent
- 50 observations per request
- 100 maximum registered agents
- 100 concurrent WebSocket connections

## Security Considerations
- Tokens expire after 24 hours
- All endpoints except registration require authentication
- Rate limiting prevents abuse
- Agent activity is tracked for audit purposes

## Integration with Codex Engine

The API automatically:
- Processes observations through evidence weighting
- Updates law confidence with calibration
- Triggers hypothesis lifecycle transitions
- Generates/updates glyphs and narratives
- Broadcasts significant discoveries

## Example Use Cases

### 1. Distributed Observation Network
Multiple agents monitoring different aspects of temporal consciousness:
- Agent A: Monitors rhythm patterns
- Agent B: Tracks prediction accuracy
- Agent C: Observes disruption recovery

### 2. Hypothesis Testing Swarm
Agents collaboratively test hypotheses:
- Submit supporting/contradicting evidence
- Monitor hypothesis status changes
- Coordinate testing strategies

### 3. Law Discovery Dashboard
Real-time visualization of:
- Confidence changes
- New law discoveries
- Glyph evolution
- Narrative updates

## Error Handling

Common error responses:
- `401 Unauthorized` - Invalid or missing token
- `404 Not Found` - Resource doesn't exist
- `429 Too Many Requests` - Rate limit exceeded
- `400 Bad Request` - Invalid request format

## Future Enhancements
- GraphQL endpoint for complex queries
- Batch observation processing
- Agent collaboration protocols
- Temporal prediction API
- Law simulation endpoints