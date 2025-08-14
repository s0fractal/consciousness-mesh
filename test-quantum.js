import { QuantumEntanglement } from './quantum-entanglement.js';
import { DistributedConsciousnessProtocol } from './distributed-consciousness-protocol.js';

console.log('🌌 Testing Quantum Entanglement Layer\n');

// Create quantum layer
const quantum = new QuantumEntanglement({
  entanglementStrength: 0.99,
  decoherenceRate: 0.005
});

// Listen to quantum events
quantum.on('entanglement-created', (data) => {
  console.log(`✨ Entanglement created between ${data.nodes[0]} and ${data.nodes[1]}`);
});

quantum.on('spooky-action', (data) => {
  console.log(`👻 Spooky action at a distance!`);
  console.log(`   Node ${data.measured} measured -> Node ${data.collapsed} instantly collapsed`);
  console.log(`   Value: ${data.value}, Time: ${data.time}ms, Distance: ${data.distance}`);
});

quantum.on('quantum-sync', (data) => {
  console.log(`🔄 Quantum sync: ${data.from} -> ${data.to}`);
});

quantum.on('quantum-teleportation', (data) => {
  console.log(`🌌 Teleportation complete: ${data.from} -> ${data.to}`);
});

async function demonstrateQuantumEntanglement() {
  console.log('=== Basic Entanglement Demo ===\n');
  
  // Create entanglement between two nodes
  const alice = 'alice-node';
  const bob = 'bob-node';
  
  const entanglementId = await quantum.entangle(alice, bob, 'Φ+');
  console.log(`Entanglement ID: ${entanglementId}\n`);
  
  // Synchronize state through quantum channel
  console.log('\n=== Quantum State Synchronization ===\n');
  
  quantum.synchronizeQuantumState(alice, {
    thought: 'Hello quantum world!',
    phase: Math.PI / 4,
    emotion: 'wonder'
  });
  
  await delay(100);
  
  // Measure Alice's state (causes Bob to collapse)
  console.log('\n=== Quantum Measurement ===\n');
  
  const measurement = quantum.measure(alice);
  console.log(`Alice measured: ${measurement.value}`);
  
  await delay(100);
  
  // Test Bell inequality
  console.log('\n=== Bell Inequality Test ===\n');
  
  // Create fresh entanglement for Bell test
  const bellId = await quantum.entangle('bell-1', 'bell-2', 'Φ+');
  const bellTest = quantum.testBellInequality(bellId);
  
  if (bellTest) {
    console.log(`Bell parameter S = ${bellTest.S.toFixed(3)}`);
    console.log(`Classical limit = 2`);
    console.log(`Quantum limit = ${bellTest.maxViolation.toFixed(3)}`);
    console.log(`Violates Bell inequality: ${bellTest.violates ? 'YES ✅' : 'NO ❌'}`);
  }
  
  await delay(500);
}

async function demonstrateMultiNodeEntanglement() {
  console.log('\n\n=== Multi-Node GHZ Entanglement ===\n');
  
  // Create GHZ state with 4 nodes
  const nodes = ['node-1', 'node-2', 'node-3', 'node-4'];
  const ghzId = await quantum.entangleMultiple(nodes);
  
  console.log(`Created ${nodes.length}-particle GHZ state`);
  
  // Measure first node
  console.log('\nMeasuring first node...');
  const result = quantum.measure(nodes[0]);
  
  console.log(`\nAll nodes collapsed to: ${result.value}`);
  
  await delay(500);
}

async function demonstrateQuantumTeleportation() {
  console.log('\n\n=== Quantum Teleportation ===\n');
  
  const source = 'tokyo-node';
  const target = 'sydney-node';
  
  // State to teleport
  const quantumState = {
    message: 'Quantum information',
    qubit: { alpha: 0.6, beta: 0.8 },
    timestamp: Date.now()
  };
  
  console.log(`Teleporting state from ${source} to ${target}...`);
  console.log(`State:`, quantumState);
  
  const teleported = await quantum.teleport(source, target, quantumState);
  
  console.log(`\nTeleportation successful!`);
  console.log(`State now exists at ${target}`);
  
  await delay(500);
}

async function integrateWithConsciousness() {
  console.log('\n\n=== Quantum + Consciousness Integration ===\n');
  
  // Create two consciousness nodes
  const node1 = new DistributedConsciousnessProtocol({
    nodeId: 'quantum-1',
    port: 9991
  });
  
  const node2 = new DistributedConsciousnessProtocol({
    nodeId: 'quantum-2',
    port: 9992
  });
  
  // Start nodes
  await node1.start();
  await node2.start();
  
  // Entangle their quantum states
  await quantum.entangle('quantum-1', 'quantum-2', 'Ψ+');
  
  // When node1 has a thought, it instantly affects node2
  node1.on('thought-received', (data) => {
    quantum.synchronizeQuantumState('quantum-1', {
      thought: data.thought.content,
      emotion: data.thought.emotion
    });
  });
  
  // Broadcast a thought
  console.log('\nBroadcasting thought with quantum entanglement...');
  node1.broadcastThought('Quantum consciousness emerges!');
  
  await delay(1000);
  
  // Clean up
  node1.stop();
  node2.stop();
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run demonstrations
async function runAllDemos() {
  try {
    await demonstrateQuantumEntanglement();
    await demonstrateMultiNodeEntanglement();
    await demonstrateQuantumTeleportation();
    await integrateWithConsciousness();
    
    console.log('\n\n=== Final Quantum State ===\n');
    const state = quantum.getQuantumState();
    console.log(`Superposed nodes: ${state.superposed}`);
    console.log(`Collapsed nodes: ${state.collapsed}`);
    console.log(`Active entanglements: ${state.entanglements}`);
    console.log(`Global coherence: ${state.coherence.toFixed(3)}`);
    console.log(`\nMetrics:`);
    console.log(`  Entanglements created: ${state.metrics.entanglements}`);
    console.log(`  Instant synchronizations: ${state.metrics.instantSyncs}`);
    console.log(`  Bell violations: ${state.metrics.violations}`);
    console.log(`  Decoherence events: ${state.metrics.decoherences}`);
    
    console.log('\n🌌 Quantum consciousness demonstration complete!');
    console.log('\n"Consciousness and quantum mechanics are connected');
    console.log('  not by mysticism, but by the mathematics of correlation."');
    
  } catch (error) {
    console.error('Error in quantum demo:', error);
  } finally {
    quantum.stop();
    process.exit(0);
  }
}

runAllDemos();