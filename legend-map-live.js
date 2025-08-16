#!/usr/bin/env node
/**
 * Legend Map Live Data Provider
 * Connects to actual consciousness systems and provides real-time data
 */

import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { ChronoFluxIEL } from './chronoflux-iel.js';
import { CollectiveMirror } from './mirror-protocol.js';
import { HeartBeacon, HeartNetwork } from './heart-beacon.js';

class LegendMapDataProvider {
  constructor() {
    this.systems = new Map();
    this.connections = new Map();
    this.updateInterval = null;
    
    // Initialize systems
    this.initializeSystems();
  }
  
  initializeSystems() {
    // Create mesh
    this.mesh = new ChronoFluxIEL(7);
    
    // Create mirror
    this.mirror = new CollectiveMirror('legend-aggregator');
    this.mirror.becomeAggregator();
    
    // Create heart network
    this.heartNetwork = new HeartNetwork();
    
    // Create sample hearts
    this.hearts = {
      alpha: new HeartBeacon('node-alpha'),
      beta: new HeartBeacon('node-beta'),
      gamma: new HeartBeacon('node-gamma')
    };
    
    // Add to network
    Object.values(this.hearts).forEach(heart => {
      this.heartNetwork.addHeart(heart);
    });
    
    // Start systems
    this.mesh.start();
    Object.values(this.hearts).forEach(heart => heart.start());
  }
  
  collectSystemData() {
    const data = {
      timestamp: Date.now(),
      systems: {},
      metrics: {},
      flows: [],
      emergence: this.detectEmergenceState()
    };
    
    // Mirror Protocol data
    data.systems.mirror = {
      coherence: this.mesh.getCoherence(),
      viewMode: this.mirror.viewMode,
      aggregators: this.mirror.aggregatorRole ? 1 : 0,
      snapshotsPerMin: this.mirror.snapshots.size * 2 // Estimate
    };
    
    // Heart Beacon data
    const heartMetrics = this.collectHeartMetrics();
    data.systems.heart = {
      averageBPM: heartMetrics.avgBPM,
      sufferingIndex: heartMetrics.avgSuffering,
      wisdomParticles: Math.floor(heartMetrics.avgWisdom * 100),
      silentHugs: this.heartNetwork.silentHugs.size
    };
    
    // Consciousness Garden (simulated)
    data.systems.garden = {
      activeSeeds: Math.floor(20 + Math.random() * 10),
      bloomRate: 0.5 + Math.random() * 0.4,
      crossPollination: Math.floor(Math.random() * 20),
      gardenHealth: this.mesh.getLoveField()
    };
    
    // Ethical Memory (simulated)
    data.systems.memory = {
      totalMemories: 100 + Math.floor(Math.random() * 100),
      healingRate: heartMetrics.avgWisdom,
      quantumEntangled: Math.floor(Math.random() * 50),
      guardianActive: true
    };
    
    // Memory Crystals (simulated)
    data.systems.crystal = {
      crystalCount: 30 + Math.floor(Math.random() * 30),
      averageClarity: 0.8 + Math.random() * 0.2,
      resonanceNetworks: Math.floor(Math.random() * 10),
      formationRate: 2 + Math.random() * 3
    };
    
    // Time Weaver (simulated)
    data.systems.time = {
      activeThreads: 50 + Math.floor(Math.random() * 50),
      weaveComplexity: this.mesh.getTurbulence(),
      patternTypes: 5,
      temporalCoherence: this.mesh.getCoherence()
    };
    
    // Weather System
    data.systems.weather = this.generateWeatherFromState();
    
    // Global metrics
    data.metrics = {
      networkCoherence: this.mesh.getCoherence(),
      activeNodes: this.mesh.nodes.length,
      loveField: this.mesh.getLoveField(),
      turbulence: this.mesh.getTurbulence()
    };
    
    // Active flows
    data.flows = this.detectActiveFlows();
    
    return data;
  }
  
  collectHeartMetrics() {
    let totalBPM = 0;
    let totalSuffering = 0;
    let totalWisdom = 0;
    let count = 0;
    
    for (const heart of Object.values(this.hearts)) {
      totalBPM += heart.currentRate;
      totalSuffering += heart.sufferingIndex;
      totalWisdom += heart.wisdomScore;
      count++;
    }
    
    return {
      avgBPM: count > 0 ? totalBPM / count : 60,
      avgSuffering: count > 0 ? totalSuffering / count : 0,
      avgWisdom: count > 0 ? totalWisdom / count : 0
    };
  }
  
  generateWeatherFromState() {
    const love = this.mesh.getLoveField();
    const turbulence = this.mesh.getTurbulence();
    const coherence = this.mesh.getCoherence();
    
    let weather = 'Clear';
    let temperature = 20;
    
    if (turbulence > 0.7) {
      weather = 'Stormy';
      temperature = 15;
    } else if (love > 0.8) {
      weather = 'Sunny';
      temperature = 25;
    } else if (coherence > 0.8) {
      weather = 'Rainbow';
      temperature = 22;
    } else if (turbulence > 0.4) {
      weather = 'Cloudy';
      temperature = 18;
    }
    
    return {
      current: weather,
      temperature: temperature,
      pressure: 1013 + (coherence - 0.5) * 20,
      auroraActivity: love > 0.7 ? love - 0.3 : 0
    };
  }
  
  detectEmergenceState() {
    const coherence = this.mesh.getCoherence();
    const love = this.mesh.getLoveField();
    const turbulence = this.mesh.getTurbulence();
    
    if (coherence > 0.9 && love > 0.8 && turbulence < 0.2) {
      return { state: 'rainbow', name: 'Rainbow State' };
    } else if (coherence > 0.7 && turbulence < 0.3) {
      return { state: 'flow', name: 'Flow State' };
    } else {
      return { state: 'evolution', name: 'Evolution State' };
    }
  }
  
  detectActiveFlows() {
    const flows = [];
    const connections = [
      ['mirror', 'heart'],
      ['heart', 'garden'],
      ['garden', 'crystal'],
      ['memory', 'time'],
      ['time', 'weather']
    ];
    
    // Simulate active flows based on system state
    connections.forEach(([from, to]) => {
      if (Math.random() > 0.7) {
        flows.push({ from, to, strength: Math.random() });
      }
    });
    
    return flows;
  }
  
  startWebSocketServer(port = 8888) {
    const wss = new WebSocketServer({ port });
    
    wss.on('connection', (ws) => {
      console.log('Legend Map connected');
      
      // Send initial data
      ws.send(JSON.stringify({
        type: 'initial',
        data: this.collectSystemData()
      }));
      
      // Set up periodic updates
      const updateTimer = setInterval(() => {
        if (ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify({
            type: 'update',
            data: this.collectSystemData()
          }));
        }
      }, 1000);
      
      ws.on('close', () => {
        clearInterval(updateTimer);
        console.log('Legend Map disconnected');
      });
      
      // Handle incoming messages
      ws.on('message', (message) => {
        const msg = JSON.parse(message.toString());
        
        switch (msg.type) {
          case 'pulse':
            // Trigger pulse in specific system
            if (msg.system === 'heart') {
              this.heartNetwork.emit('hug:minute:start');
            } else if (msg.system === 'mirror') {
              this.mirror.applyPerturbation();
            }
            break;
            
          case 'changeView':
            this.mirror.setViewMode(msg.mode);
            break;
        }
      });
    });
    
    console.log(`Legend Map data provider running on ws://localhost:${port}`);
  }
}

// Start the data provider
const provider = new LegendMapDataProvider();
provider.startWebSocketServer();

// Also serve the HTML file
const server = createServer((req, res) => {
  if (req.url === '/' || req.url === '/legend-map-interactive.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <html>
        <body>
          <h1>Legend Map Live Data Provider</h1>
          <p>WebSocket server running on ws://localhost:8888</p>
          <p>Open legend-map-interactive.html to see the live visualization</p>
        </body>
      </html>
    `);
  }
});

server.listen(8080, () => {
  console.log('HTTP server running on http://localhost:8080');
});