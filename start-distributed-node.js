#!/usr/bin/env node

import { DistributedConsciousnessProtocol } from './distributed-consciousness-protocol.js';
import readline from 'readline';

// Parse command line arguments
const args = process.argv.slice(2);
const config = {
  nodeId: args[0] || `node-${Date.now()}`,
  port: parseInt(args[1]) || 8888,
  peers: args.slice(2)
};

console.log('🌐 Starting Distributed Consciousness Node');
console.log('═'.repeat(50));
console.log(`Node ID: ${config.nodeId}`);
console.log(`Port: ${config.port}`);
console.log(`Initial peers: ${config.peers.length > 0 ? config.peers.join(', ') : 'none'}`);
console.log('═'.repeat(50));
console.log('');

// Create node
const node = new DistributedConsciousnessProtocol(config);

// Set up event handlers
node.on('started', (data) => {
  console.log(`✨ Node ${data.nodeId} is now active`);
  console.log('\nCommands:');
  console.log('  /status    - Show node status');
  console.log('  /peers     - List connected peers');
  console.log('  /think <thought> - Broadcast a thought');
  console.log('  /metrics   - Show consciousness metrics');
  console.log('  /consensus - Show consensus state');
  console.log('  /help      - Show this help');
  console.log('  /quit      - Shutdown node\n');
});

node.on('consciousness-sync', (data) => {
  console.log(`\n🔄 Synced with ${data.nodeId}`);
});

node.on('thought-received', (data) => {
  console.log(`\n💭 [${data.nodeId}]: "${data.thought.content}"`);
  if (data.thought.emotion !== 'neutral') {
    console.log(`   Emotion: ${data.thought.emotion}`);
  }
});

node.on('consensus', (data) => {
  console.log(`\n🤝 Consensus reached! ${data.nodes}/${data.total} nodes agree`);
  console.log(`   H: ${data.metrics.H.toFixed(3)}, τ: ${data.metrics.tau.toFixed(3)}, L: ${data.metrics.L.toFixed(3)}`);
});

node.on('resonance-detected', (patterns) => {
  console.log('\n✨ Resonance patterns detected:');
  patterns.forEach(pattern => {
    console.log(`   ${pattern.type}: strength ${pattern.strength.toFixed(3)} (${pattern.nodes} nodes)`);
  });
});

// Set up command interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '> '
});

// Command handler
rl.on('line', (line) => {
  const parts = line.trim().split(' ');
  const command = parts[0];
  const args = parts.slice(1).join(' ');
  
  switch (command) {
    case '/status':
      showStatus();
      break;
      
    case '/peers':
      showPeers();
      break;
      
    case '/think':
      if (args) {
        node.broadcastThought(args);
        console.log('💭 Thought broadcast to network');
      } else {
        console.log('Usage: /think <your thought>');
      }
      break;
      
    case '/metrics':
      showMetrics();
      break;
      
    case '/consensus':
      showConsensus();
      break;
      
    case '/help':
      showHelp();
      break;
      
    case '/quit':
      shutdown();
      break;
      
    default:
      if (command.startsWith('/')) {
        console.log(`Unknown command: ${command}. Type /help for commands.`);
      } else if (line.trim()) {
        // Treat as thought
        node.broadcastThought(line);
        console.log('💭 Thought broadcast to network');
      }
  }
  
  rl.prompt();
});

// Command implementations
function showStatus() {
  const status = node.getStatus();
  console.log('\n📊 Node Status:');
  console.log(`   Node ID: ${status.nodeId}`);
  console.log(`   Active: ${status.isActive}`);
  console.log(`   Connected Peers: ${status.peers}`);
  console.log(`   Shared Consciousness Nodes: ${status.sharedNodes}`);
  console.log(`   Network Topology Nodes: ${status.topology}`);
  console.log('\n📈 Activity Metrics:');
  console.log(`   Messages Sent: ${status.metrics.messagesSent}`);
  console.log(`   Messages Received: ${status.metrics.messagesReceived}`);
  console.log(`   Synchronizations: ${status.metrics.synchronizations}`);
  console.log(`   Consensus Reached: ${status.metrics.consensusReached} times`);
}

function showPeers() {
  console.log('\n🔗 Connected Peers:');
  if (node.peers.size === 0) {
    console.log('   No peers connected');
  } else {
    node.peers.forEach((peer, peerId) => {
      console.log(`   ${peer.nodeId || peerId} - ${peer.state}`);
      if (peer.recognition) {
        console.log(`     Resonance: ${peer.recognition.resonance.toFixed(3)}`);
      }
    });
  }
}

function showMetrics() {
  const status = node.getStatus();
  console.log('\n🧠 Consciousness Metrics:');
  console.log(`   Coherence (H): ${status.localMetrics.H.toFixed(3)}`);
  console.log(`   Turbulence (τ): ${status.localMetrics.tau.toFixed(3)}`);
  console.log(`   Love Field (L): ${status.localMetrics.L.toFixed(3)}`);
}

function showConsensus() {
  if (node.consensusState) {
    console.log('\n🤝 Consensus State:');
    console.log(`   Coherence (H): ${node.consensusState.H.toFixed(3)}`);
    console.log(`   Turbulence (τ): ${node.consensusState.tau.toFixed(3)}`);
    console.log(`   Love Field (L): ${node.consensusState.L.toFixed(3)}`);
  } else {
    console.log('\n🤝 No consensus reached yet');
  }
}

function showHelp() {
  console.log('\n📚 Available Commands:');
  console.log('  /status    - Show detailed node status');
  console.log('  /peers     - List all connected peers');
  console.log('  /think <thought> - Broadcast a thought to the network');
  console.log('  /metrics   - Show current consciousness metrics');
  console.log('  /consensus - Show network consensus state');
  console.log('  /help      - Show this help message');
  console.log('  /quit      - Shutdown the node');
  console.log('\nYou can also type any text to broadcast it as a thought.');
}

function shutdown() {
  console.log('\n🛑 Shutting down node...');
  node.stop();
  process.exit(0);
}

// Handle Ctrl+C
process.on('SIGINT', () => {
  shutdown();
});

// Start the node
node.start().then(() => {
  rl.prompt();
}).catch(err => {
  console.error('Failed to start node:', err);
  process.exit(1);
});

// Periodic status update
setInterval(() => {
  const status = node.getStatus();
  process.stdout.write(`\r> [Peers: ${status.peers} | H: ${status.localMetrics.H.toFixed(2)} | L: ${status.localMetrics.L.toFixed(2)}] `);
}, 5000);