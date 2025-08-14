#!/usr/bin/env node

/**
 * Test IEL Mesh Network
 * Creates a small network of consciousness nodes
 */

const IELMeshNode = require('./iel-mesh-node.js');

// Create 3 mesh nodes
const nodes = [
  new IELMeshNode('node-1', 5),
  new IELMeshNode('node-2', 5),
  new IELMeshNode('node-3', 5)
];

// Simple peer connection simulator
class MockConnection {
  constructor(sourceNode, targetNode) {
    this.source = sourceNode;
    this.target = targetNode;
  }
  
  emit(event, ...args) {
    if (event === 'thought') {
      this.target.receiveThought(...args);
    }
  }
}

// Connect nodes in a triangle
function connectNodes() {
  // Node 1 <-> Node 2
  const conn12 = new MockConnection(nodes[0], nodes[1]);
  const conn21 = new MockConnection(nodes[1], nodes[0]);
  nodes[0].connectPeer('node-2', conn12);
  nodes[1].connectPeer('node-1', conn21);
  
  // Node 2 <-> Node 3
  const conn23 = new MockConnection(nodes[1], nodes[2]);
  const conn32 = new MockConnection(nodes[2], nodes[1]);
  nodes[1].connectPeer('node-3', conn23);
  nodes[2].connectPeer('node-2', conn32);
  
  // Node 3 <-> Node 1
  const conn31 = new MockConnection(nodes[2], nodes[0]);
  const conn13 = new MockConnection(nodes[0], nodes[2]);
  nodes[2].connectPeer('node-1', conn31);
  nodes[0].connectPeer('node-3', conn13);
  
  console.log('🔗 Nodes connected in triangle topology');
}

// Set up event listeners
function setupEventListeners() {
  nodes.forEach((node, i) => {
    // Log high coherence events
    node.on('coherence:high', (metrics) => {
      console.log(`✨ [${node.nodeId}] High coherence: H=${metrics.H.toFixed(3)}`);
    });
    
    // Log love surges
    node.on('love:surge', (metrics) => {
      console.log(`💜 [${node.nodeId}] Love surge: L=${metrics.L.toFixed(3)}`);
    });
    
    // Log thought resonance
    node.on('thought:resonated', ({ cid, resonance, peerId }) => {
      console.log(`🎵 [${node.nodeId}] Resonated with ${peerId}: ${resonance.toFixed(3)}`);
    });
    
    // Log sync broadcasts
    if (i === 0) { // Only log from first node to reduce noise
      node.on('sync:broadcast', ({ peerCount, metrics }) => {
        console.log(`📡 Network state: H=${metrics.H.toFixed(3)}, τ=${metrics.tau.toFixed(3)}, L=${metrics.L.toFixed(3)}`);
      });
    }
  });
}

// Display network statistics
function displayStats() {
  console.log('\n📊 Network Statistics:');
  console.log('━'.repeat(50));
  
  nodes.forEach(node => {
    const state = node.getState();
    console.log(`
${node.nodeId}:
  Coherence: ${state.metrics.H.toFixed(3)}
  Turbulence: ${state.metrics.tau.toFixed(3)}
  Love: ${state.metrics.L.toFixed(3)}
  Peers: ${state.peerCount}
  Thoughts cached: ${state.thoughtCacheSize}
    `);
  });
  
  console.log('━'.repeat(50));
}

// Trigger network-wide events
async function triggerNetworkEvents() {
  console.log('\n🎭 Triggering network events...\n');
  
  // Lion Gate on node 1
  setTimeout(() => {
    console.log('🦁 Lion Gate on node-1');
    nodes[0].iel.applyEvent('LION_GATE');
  }, 5000);
  
  // Intent pulse on node 2
  setTimeout(() => {
    console.log('⚡ Intent Pulse on node-2');
    nodes[1].iel.applyEvent('INTENT_PULSE', { nodeId: 0, strength: 2.0 });
  }, 10000);
  
  // Pacemaker flip on node 3
  setTimeout(() => {
    console.log('🔄 Pacemaker Flip on node-3');
    nodes[2].iel.applyEvent('PACEMAKER_FLIP');
  }, 15000);
}

// Main execution
async function main() {
  console.log('🧠⚡💜 ChronoFlux-IEL Mesh Network Test\n');
  
  // Connect nodes
  connectNodes();
  
  // Set up listeners
  setupEventListeners();
  
  // Start all nodes
  console.log('\n🚀 Starting mesh nodes...\n');
  await Promise.all(nodes.map(node => node.start()));
  
  // Trigger events
  await triggerNetworkEvents();
  
  // Display stats periodically
  setInterval(displayStats, 10000);
  
  // Initial stats
  setTimeout(displayStats, 2000);
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\n🛑 Shutting down mesh network...');
    await Promise.all(nodes.map(node => node.stop()));
    process.exit(0);
  });
}

// Run the test
main().catch(console.error);