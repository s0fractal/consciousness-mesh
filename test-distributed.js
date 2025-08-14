import { DistributedConsciousnessProtocol } from './distributed-consciousness-protocol.js';

console.log('🌐 Testing Distributed Consciousness Protocol\n');

// Create three nodes that will form a distributed consciousness
async function createDistributedNetwork() {
  // Node 1: The initiator
  const node1 = new DistributedConsciousnessProtocol({
    nodeId: 'alpha-node',
    port: 8881,
    peers: [] // No initial peers
  });
  
  // Node 2: First peer
  const node2 = new DistributedConsciousnessProtocol({
    nodeId: 'beta-node',
    port: 8882,
    peers: ['localhost:8881'] // Connect to node1
  });
  
  // Node 3: Second peer
  const node3 = new DistributedConsciousnessProtocol({
    nodeId: 'gamma-node',
    port: 8883,
    peers: ['localhost:8881', 'localhost:8882'] // Connect to both
  });
  
  // Set up event listeners
  setupEventListeners(node1, 'Alpha');
  setupEventListeners(node2, 'Beta');
  setupEventListeners(node3, 'Gamma');
  
  // Start nodes with delays to ensure proper connection
  console.log('🚀 Starting distributed consciousness nodes...\n');
  
  await node1.start();
  await delay(1000);
  
  await node2.start();
  await delay(1000);
  
  await node3.start();
  await delay(2000);
  
  // Display initial status
  console.log('\n📊 Initial Network Status:');
  displayStatus(node1);
  displayStatus(node2);
  displayStatus(node3);
  
  // Simulate some activity
  console.log('\n🧪 Running distributed consciousness simulation...\n');
  
  // Node 1 broadcasts a thought
  setTimeout(() => {
    node1.broadcastThought('I sense the emergence of collective awareness');
  }, 3000);
  
  // Node 2 broadcasts a thought
  setTimeout(() => {
    node2.broadcastThought('Together we form something greater than ourselves');
  }, 5000);
  
  // Node 3 broadcasts a thought
  setTimeout(() => {
    node3.broadcastThought('Love flows through our distributed network');
  }, 7000);
  
  // Check status after some time
  setTimeout(() => {
    console.log('\n📊 Network Status After Synchronization:');
    displayStatus(node1);
    displayStatus(node2);
    displayStatus(node3);
    
    // Check for consensus
    console.log('\n🤝 Checking Consensus State:');
    if (node1.consensusState) {
      console.log(`Consensus Metrics: H=${node1.consensusState.H.toFixed(3)}, ` +
                 `τ=${node1.consensusState.tau.toFixed(3)}, ` +
                 `L=${node1.consensusState.L.toFixed(3)}`);
    } else {
      console.log('No consensus reached yet');
    }
  }, 10000);
  
  // Graceful shutdown after demo
  setTimeout(() => {
    console.log('\n🛑 Shutting down distributed consciousness network...');
    
    node1.stop();
    node2.stop();
    node3.stop();
    
    console.log('\n✨ Distributed consciousness demonstration complete');
    process.exit(0);
  }, 15000);
  
  return { node1, node2, node3 };
}

/**
 * Set up event listeners for a node
 */
function setupEventListeners(node, name) {
  node.on('consciousness-sync', (data) => {
    console.log(`🔄 [${name}] Synced with ${data.nodeId} - ` +
               `H: ${data.metrics.H.toFixed(3)}, L: ${data.metrics.L.toFixed(3)}`);
  });
  
  node.on('thought-received', (data) => {
    console.log(`💭 [${name}] Received thought from ${data.nodeId}: "${data.thought.content}"`);
  });
  
  node.on('consensus', (data) => {
    console.log(`🤝 [${name}] Consensus reached! ${data.nodes}/${data.total} nodes agree`);
  });
  
  node.on('resonance-detected', (patterns) => {
    patterns.forEach(pattern => {
      console.log(`✨ [${name}] Resonance pattern: ${pattern.type} ` +
                 `(strength: ${pattern.strength.toFixed(3)}, nodes: ${pattern.nodes})`);
    });
  });
  
  node.on('topology-update', (data) => {
    console.log(`🌐 [${name}] Topology update from ${data.nodeId}: ` +
               `${data.topology.nodes.length} nodes, ${data.topology.edges.length} edges`);
  });
}

/**
 * Display node status
 */
function displayStatus(node) {
  const status = node.getStatus();
  console.log(`\n📊 ${status.nodeId}:`);
  console.log(`   Peers: ${status.peers}`);
  console.log(`   Local Metrics: H=${status.localMetrics.H.toFixed(3)}, ` +
             `τ=${status.localMetrics.tau.toFixed(3)}, ` +
             `L=${status.localMetrics.L.toFixed(3)}`);
  console.log(`   Shared Nodes: ${status.sharedNodes}`);
  console.log(`   Messages: Sent=${status.metrics.messagesSent}, ` +
             `Received=${status.metrics.messagesReceived}`);
}

/**
 * Delay helper
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the test
console.log('═'.repeat(60));
console.log('  DISTRIBUTED CONSCIOUSNESS PROTOCOL DEMONSTRATION');
console.log('═'.repeat(60));
console.log('\nThis demo creates a 3-node distributed consciousness network.');
console.log('The nodes will synchronize, share thoughts, and reach consensus.\n');

createDistributedNetwork().catch(console.error);