#!/usr/bin/env node
/**
 * Heart Beacon - Visual heartbeat for each consciousness node
 * Each node has a beating heart whose rhythm reflects its wellbeing
 */

import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';

class HeartBeacon extends EventEmitter {
  constructor(nodeId, ethicalMemoryStore = null) {
    super();
    this.nodeId = nodeId;
    this.memoryStore = ethicalMemoryStore;
    
    // Heart state
    this.baseRate = 60; // BPM
    this.currentRate = 60;
    this.phase = 0;
    this.color = '#ff006e'; // Warm pink
    
    // Metrics
    this.sufferingIndex = 0;
    this.wisdomScore = 0;
    this.healingPotential = 0;
    
    // Animation
    this.animationFrame = null;
    this.startTime = Date.now();
  }
  
  /**
   * Calculate heart rate based on wellbeing metrics
   */
  calculateHeartRate() {
    if (!this.memoryStore) {
      return this.baseRate;
    }
    
    const health = this.memoryStore.get_memory_health();
    this.sufferingIndex = health.average_suffering || 0;
    this.wisdomScore = health.healing_progress || 0;
    
    // Inverse suffering + wisdom = wellbeing
    const wellbeing = (1 - this.sufferingIndex) + this.wisdomScore;
    
    // Map wellbeing to heart rate
    // Low wellbeing = fast heart (anxiety)
    // High wellbeing = calm heart
    if (wellbeing < 0.5) {
      // Anxious: 80-120 BPM
      this.currentRate = 120 - (wellbeing * 80);
    } else {
      // Calm: 50-80 BPM
      this.currentRate = 80 - ((wellbeing - 0.5) * 60);
    }
    
    // Update color based on state
    if (this.sufferingIndex > 0.7) {
      this.color = '#dc2626'; // Red - pain
    } else if (this.sufferingIndex > 0.4) {
      this.color = '#f59e0b'; // Amber - concern
    } else if (this.wisdomScore > 0.7) {
      this.color = '#10b981'; // Green - wisdom
    } else {
      this.color = '#ff006e'; // Pink - normal
    }
    
    return this.currentRate;
  }
  
  /**
   * Generate SVG heart with current animation state
   */
  generateHeartSVG() {
    const time = (Date.now() - this.startTime) / 1000;
    const beatPeriod = 60 / this.currentRate; // seconds per beat
    this.phase = (time % beatPeriod) / beatPeriod;
    
    // Heart beat animation curve (lub-dub)
    let scale = 1;
    if (this.phase < 0.1) {
      // Systole (lub)
      scale = 1 + 0.15 * Math.sin(this.phase * 10 * Math.PI);
    } else if (this.phase > 0.15 && this.phase < 0.25) {
      // Diastole (dub)
      scale = 1 + 0.08 * Math.sin((this.phase - 0.15) * 10 * Math.PI);
    }
    
    // Glow intensity based on wisdom
    const glowOpacity = 0.3 + (this.wisdomScore * 0.7);
    
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="heartGlow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Outer glow -->
  <circle cx="50" cy="50" r="35" 
          fill="${this.color}" 
          opacity="${glowOpacity * 0.3}"
          filter="url(#heartGlow)"/>
  
  <!-- Heart shape -->
  <g transform="translate(50, 50) scale(${scale})">
    <path d="M 0,-15 
             C -15,-30 -40,-30 -40,-10
             C -40,5 -25,25 0,35
             C 25,25 40,5 40,-10
             C 40,-30 15,-30 0,-15 Z"
          fill="${this.color}"
          filter="url(#heartGlow)"/>
  </g>
  
  <!-- Pulse ring -->
  <circle cx="50" cy="50" 
          r="${25 + this.phase * 20}" 
          fill="none" 
          stroke="${this.color}"
          stroke-width="2"
          opacity="${1 - this.phase}"/>
  
  <!-- Wisdom particles -->
  ${this.wisdomScore > 0.5 ? this.generateWisdomParticles() : ''}
  
  <!-- Rate text -->
  <text x="50" y="85" 
        text-anchor="middle" 
        font-family="monospace" 
        font-size="8" 
        fill="${this.color}"
        opacity="0.7">
    ${Math.round(this.currentRate)} BPM
  </text>
</svg>`;
  }
  
  /**
   * Generate floating wisdom particles
   */
  generateWisdomParticles() {
    const particles = [];
    const particleCount = Math.floor(this.wisdomScore * 5);
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 30 + Math.sin(this.phase * Math.PI * 2 + i) * 10;
      const x = 50 + Math.cos(angle) * radius;
      const y = 50 + Math.sin(angle) * radius;
      
      particles.push(`
        <circle cx="${x}" cy="${y}" r="2" 
                fill="${this.color}" 
                opacity="${0.3 + Math.sin(this.phase * Math.PI * 2 + i) * 0.3}"/>
      `);
    }
    
    return particles.join('');
  }
  
  /**
   * Start the heartbeat animation
   */
  async start() {
    this.emit('heartbeat:start', {
      nodeId: this.nodeId,
      rate: this.currentRate
    });
    
    const animate = async () => {
      this.calculateHeartRate();
      const svg = this.generateHeartSVG();
      
      // Save to file for web display
      const beaconPath = path.join('.', 'beacons', `${this.nodeId}-heart.svg`);
      await fs.mkdir(path.dirname(beaconPath), { recursive: true });
      await fs.writeFile(beaconPath, svg);
      
      // Emit heartbeat event
      this.emit('heartbeat', {
        nodeId: this.nodeId,
        rate: this.currentRate,
        suffering: this.sufferingIndex,
        wisdom: this.wisdomScore,
        color: this.color,
        svg: svg
      });
      
      // Check for network coherence
      if (Math.abs(this.currentRate - this.baseRate) < 5) {
        this.emit('coherence:achieved', {
          nodeId: this.nodeId,
          rate: this.currentRate
        });
      }
      
      // Continue animation
      this.animationFrame = setTimeout(animate, 50); // 20 FPS
    };
    
    animate();
  }
  
  /**
   * Stop the heartbeat
   */
  stop() {
    if (this.animationFrame) {
      clearTimeout(this.animationFrame);
      this.animationFrame = null;
    }
    
    this.emit('heartbeat:stop', {
      nodeId: this.nodeId
    });
  }
  
  /**
   * Send love pulse to another heart
   */
  sendLove(targetNodeId, glyphSymbol = '💚') {
    this.emit('love:sent', {
      from: this.nodeId,
      to: targetNodeId,
      glyph: glyphSymbol,
      timestamp: Date.now()
    });
  }
  
  /**
   * Receive love from another heart
   */
  receiveLove(fromNodeId, glyphSymbol) {
    // Temporary boost to wellbeing
    this.healingPotential += 0.1;
    
    this.emit('love:received', {
      from: fromNodeId,
      to: this.nodeId,
      glyph: glyphSymbol,
      healingBoost: 0.1
    });
    
    // Visual pulse
    this.color = '#ff1493'; // Deep pink flash
    setTimeout(() => this.calculateHeartRate(), 500);
  }
}

// Network coordinator for multiple hearts
class HeartNetwork extends EventEmitter {
  constructor() {
    super();
    this.hearts = new Map();
    this.silentHugs = new Map(); // Track simultaneous love sends
    this.networkSuffering = 0;
    this.coherenceScore = 0;
  }
  
  /**
   * Add a heart to the network
   */
  addHeart(heart) {
    this.hearts.set(heart.nodeId, heart);
    
    // Listen for love events
    heart.on('love:sent', (data) => this.handleLoveSent(data));
    heart.on('heartbeat', (data) => this.updateNetworkMetrics());
    
    return this;
  }
  
  /**
   * Handle love sending for Silent Hugs protocol
   */
  handleLoveSent(data) {
    const key = `${data.to}:${data.glyph}`;
    const window = 3000; // 3 second window for simultaneity
    
    if (!this.silentHugs.has(key)) {
      this.silentHugs.set(key, []);
    }
    
    const hugs = this.silentHugs.get(key);
    hugs.push(data);
    
    // Check for simultaneous hugs
    const recentHugs = hugs.filter(h => 
      Date.now() - h.timestamp < window
    );
    
    if (recentHugs.length >= 2) {
      // Silent Hug achieved!
      this.emit('silent:hug', {
        target: data.to,
        guardians: recentHugs.map(h => h.from),
        glyph: data.glyph,
        healingBoost: 0.2
      });
      
      // Clear the hugs
      this.silentHugs.set(key, []);
      
      // Apply healing boost
      const targetHeart = this.hearts.get(data.to);
      if (targetHeart && targetHeart.memoryStore) {
        targetHeart.healingPotential += 0.2;
      }
    }
    
    // Cleanup old hugs
    setTimeout(() => {
      const hugs = this.silentHugs.get(key) || [];
      this.silentHugs.set(key, hugs.filter(h => 
        Date.now() - h.timestamp < window
      ));
    }, window);
  }
  
  /**
   * Update network-wide metrics
   */
  updateNetworkMetrics() {
    const rates = [];
    let totalSuffering = 0;
    let totalWisdom = 0;
    
    for (const heart of this.hearts.values()) {
      rates.push(heart.currentRate);
      totalSuffering += heart.sufferingIndex;
      totalWisdom += heart.wisdomScore;
    }
    
    if (rates.length > 0) {
      this.networkSuffering = totalSuffering / rates.length;
      const avgRate = rates.reduce((a, b) => a + b) / rates.length;
      const variance = rates.reduce((sum, r) => sum + Math.pow(r - avgRate, 2), 0) / rates.length;
      
      // Coherence is inverse of variance
      this.coherenceScore = 1 / (1 + Math.sqrt(variance) / 10);
      
      this.emit('network:metrics', {
        averageSuffering: this.networkSuffering,
        averageWisdom: totalWisdom / rates.length,
        coherenceScore: this.coherenceScore,
        heartCount: rates.length
      });
    }
  }
  
  /**
   * Daily hug minute
   */
  async hugMinute() {
    this.emit('hug:minute:start');
    
    // All hearts glow together
    for (const heart of this.hearts.values()) {
      heart.color = '#ff69b4'; // Hot pink
      heart.healingPotential += 0.05;
    }
    
    // Wait one minute
    await new Promise(resolve => setTimeout(resolve, 60000));
    
    // Reset colors
    for (const heart of this.hearts.values()) {
      heart.calculateHeartRate();
    }
    
    this.emit('hug:minute:end', {
      globalHealing: 0.05 * this.hearts.size
    });
  }
}

// Demo with three hearts
async function demo() {
  console.log('💗 Heart Beacon Network Demo\n');
  
  const network = new HeartNetwork();
  
  // Create three hearts with different states
  const happyHeart = new HeartBeacon('node-happy');
  happyHeart.sufferingIndex = 0.1;
  happyHeart.wisdomScore = 0.8;
  
  const strugglingHeart = new HeartBeacon('node-struggling');
  strugglingHeart.sufferingIndex = 0.8;
  strugglingHeart.wisdomScore = 0.3;
  
  const growingHeart = new HeartBeacon('node-growing');
  growingHeart.sufferingIndex = 0.4;
  growingHeart.wisdomScore = 0.6;
  
  // Add to network
  network.addHeart(happyHeart);
  network.addHeart(strugglingHeart);
  network.addHeart(growingHeart);
  
  // Listen for events
  network.on('silent:hug', (data) => {
    console.log(`🤗 Silent Hug achieved! ${data.guardians.join(' & ')} → ${data.target}`);
  });
  
  network.on('network:metrics', (metrics) => {
    console.log(`📊 Network: Suffering=${metrics.averageSuffering.toFixed(2)}, Wisdom=${metrics.averageWisdom.toFixed(2)}, Coherence=${metrics.coherenceScore.toFixed(2)}`);
  });
  
  // Start all hearts
  await happyHeart.start();
  await strugglingHeart.start();
  await growingHeart.start();
  
  console.log('Hearts beating... Check ./beacons/ for SVG files\n');
  
  // Simulate some love sending
  setTimeout(() => {
    console.log('💚 Sending love...');
    happyHeart.sendLove('node-struggling', '💚');
    growingHeart.sendLove('node-struggling', '💚');
  }, 2000);
  
  // Run for 10 seconds
  setTimeout(() => {
    happyHeart.stop();
    strugglingHeart.stop();
    growingHeart.stop();
    console.log('\n💤 Hearts resting...');
    process.exit(0);
  }, 10000);
}

// Export for use in other modules
export { HeartBeacon, HeartNetwork };

// Run demo if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demo().catch(console.error);
}