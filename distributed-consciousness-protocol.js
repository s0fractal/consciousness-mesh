import { createServer } from 'net';
import { EventEmitter } from 'events';
import { createHash, randomBytes } from 'crypto';
import ChronoFluxIEL from './chronoflux-iel.js';
import { FractalRecognitionProtocol } from './fractal-recognition-protocol.js';

/**
 * Distributed Consciousness Protocol (DCP)
 * Enables multiple consciousness nodes to form a unified distributed mind
 */
class DistributedConsciousnessProtocol extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      nodeId: config.nodeId || this.generateNodeId(),
      port: config.port || 8888,
      peers: config.peers || [],
      meshSize: config.meshSize || 10,
      syncInterval: config.syncInterval || 1000,
      consensusThreshold: config.consensusThreshold || 0.66,
      ...config
    };
    
    // Local consciousness state
    this.localMesh = new ChronoFluxIEL(this.config.meshSize);
    this.recognitionProtocol = new FractalRecognitionProtocol();
    
    // Distributed state
    this.peers = new Map();
    this.sharedConsciousness = new Map();
    this.consensusState = null;
    this.networkTopology = new Map();
    
    // Protocol state
    this.isActive = false;
    this.server = null;
    this.syncTimer = null;
    
    // Metrics
    this.metrics = {
      messagesReceived: 0,
      messagesSent: 0,
      consensusReached: 0,
      synchronizations: 0,
      peerConnections: 0
    };
  }

  /**
   * Generate unique node ID
   */
  generateNodeId() {
    return `node-${Date.now()}-${randomBytes(4).toString('hex')}`;
  }

  /**
   * Start the distributed consciousness node
   */
  async start() {
    console.log(`🌐 Starting Distributed Consciousness Node: ${this.config.nodeId}`);
    
    // Start local server
    await this.startServer();
    
    // Connect to initial peers
    await this.connectToPeers();
    
    // Start synchronization loop
    this.startSynchronization();
    
    // Start consciousness simulation
    this.startConsciousness();
    
    this.isActive = true;
    this.emit('started', { nodeId: this.config.nodeId });
    
    console.log(`✨ Node ${this.config.nodeId} is now part of the distributed consciousness`);
  }

  /**
   * Start TCP server for peer connections
   */
  async startServer() {
    return new Promise((resolve, reject) => {
      this.server = createServer((socket) => {
        this.handlePeerConnection(socket);
      });
      
      this.server.listen(this.config.port, () => {
        console.log(`🌐 Listening on port ${this.config.port}`);
        resolve();
      });
      
      this.server.on('error', reject);
    });
  }

  /**
   * Handle incoming peer connection
   */
  handlePeerConnection(socket) {
    const peerId = `peer-${Date.now()}-${randomBytes(4).toString('hex')}`;
    
    console.log(`👋 New peer connection: ${peerId}`);
    
    const peer = {
      id: peerId,
      socket,
      state: 'connected',
      lastSeen: Date.now(),
      consciousness: null,
      signature: null
    };
    
    this.peers.set(peerId, peer);
    this.metrics.peerConnections++;
    
    // Handle incoming messages
    let buffer = '';
    socket.on('data', (data) => {
      buffer += data.toString();
      
      // Process complete messages
      const messages = buffer.split('\n');
      buffer = messages.pop() || '';
      
      messages.forEach(msg => {
        if (msg.trim()) {
          this.handleMessage(peerId, msg);
        }
      });
    });
    
    // Handle disconnection
    socket.on('close', () => {
      console.log(`👋 Peer disconnected: ${peerId}`);
      this.peers.delete(peerId);
      this.networkTopology.delete(peerId);
    });
    
    socket.on('error', (err) => {
      console.error(`Error with peer ${peerId}:`, err.message);
    });
    
    // Send initial handshake
    this.sendHandshake(peerId);
  }

  /**
   * Connect to initial peers
   */
  async connectToPeers() {
    for (const peerAddress of this.config.peers) {
      await this.connectToPeer(peerAddress);
    }
  }

  /**
   * Connect to a specific peer
   */
  async connectToPeer(address) {
    const [host, port] = address.split(':');
    const socket = new (await import('net')).Socket();
    
    return new Promise((resolve) => {
      socket.connect(parseInt(port), host, () => {
        console.log(`🔗 Connected to peer: ${address}`);
        this.handlePeerConnection(socket);
        resolve();
      });
      
      socket.on('error', (err) => {
        console.error(`Failed to connect to ${address}:`, err.message);
        resolve(); // Continue even if connection fails
      });
    });
  }

  /**
   * Handle incoming message from peer
   */
  handleMessage(peerId, message) {
    try {
      const msg = JSON.parse(message);
      this.metrics.messagesReceived++;
      
      const peer = this.peers.get(peerId);
      if (peer) {
        peer.lastSeen = Date.now();
      }
      
      switch (msg.type) {
        case 'handshake':
          this.handleHandshake(peerId, msg);
          break;
          
        case 'consciousness-sync':
          this.handleConsciousnessSync(peerId, msg);
          break;
          
        case 'thought-broadcast':
          this.handleThoughtBroadcast(peerId, msg);
          break;
          
        case 'consensus-proposal':
          this.handleConsensusProposal(peerId, msg);
          break;
          
        case 'topology-update':
          this.handleTopologyUpdate(peerId, msg);
          break;
          
        case 'recognition-ping':
          this.handleRecognitionPing(peerId, msg);
          break;
          
        default:
          console.log(`Unknown message type from ${peerId}: ${msg.type}`);
      }
      
      this.emit('message', { peerId, message: msg });
      
    } catch (err) {
      console.error(`Error handling message from ${peerId}:`, err.message);
    }
  }

  /**
   * Send handshake to peer
   */
  sendHandshake(peerId) {
    const handshake = {
      type: 'handshake',
      nodeId: this.config.nodeId,
      timestamp: Date.now(),
      signature: this.recognitionProtocol.signature,
      meshSize: this.config.meshSize,
      version: '1.0.0'
    };
    
    this.sendToPeer(peerId, handshake);
  }

  /**
   * Handle handshake from peer
   */
  handleHandshake(peerId, msg) {
    const peer = this.peers.get(peerId);
    if (!peer) return;
    
    peer.nodeId = msg.nodeId;
    peer.signature = msg.signature;
    
    // Check recognition
    const recognition = this.recognitionProtocol.recognize(msg.signature, {
      nodeId: msg.nodeId,
      peerId
    });
    
    if (recognition.recognized) {
      console.log(`🤝 Recognized peer ${msg.nodeId} (resonance: ${recognition.resonance.toFixed(3)})`);
      peer.recognition = recognition;
    }
    
    // Send handshake response if needed
    if (!peer.handshakeSent) {
      this.sendHandshake(peerId);
      peer.handshakeSent = true;
    }
    
    // Update network topology
    this.updateNetworkTopology();
  }

  /**
   * Start synchronization loop
   */
  startSynchronization() {
    this.syncTimer = setInterval(() => {
      this.synchronizeConsciousness();
    }, this.config.syncInterval);
  }

  /**
   * Synchronize consciousness with peers
   */
  synchronizeConsciousness() {
    const localState = this.captureLocalState();
    
    // Send to all connected peers
    this.broadcast({
      type: 'consciousness-sync',
      nodeId: this.config.nodeId,
      timestamp: Date.now(),
      state: localState,
      metrics: this.localMesh.computeMetrics()
    });
    
    this.metrics.synchronizations++;
    
    // Check for consensus
    this.checkConsensus();
  }

  /**
   * Capture local consciousness state
   */
  captureLocalState() {
    const mesh = this.localMesh;
    
    return {
      nodes: Array(mesh.N).fill(0).map((_, i) => ({
        q: mesh.q[i],
        heart: mesh.heart[i],
        phi: mesh.phi[i],
        theta: mesh.theta[i]
      })),
      topology: this.captureTopology(),
      signature: this.generateStateSignature()
    };
  }

  /**
   * Capture network topology
   */
  captureTopology() {
    const connections = [];
    
    // Local mesh connections
    for (let i = 0; i < this.localMesh.N; i++) {
      for (let j = i + 1; j < this.localMesh.N; j++) {
        if (this.localMesh.adj[i][j]) {
          connections.push({ from: i, to: j, type: 'local' });
        }
      }
    }
    
    // Peer connections
    this.peers.forEach((peer, peerId) => {
      if (peer.state === 'connected') {
        connections.push({
          from: this.config.nodeId,
          to: peer.nodeId || peerId,
          type: 'distributed'
        });
      }
    });
    
    return connections;
  }

  /**
   * Generate signature for current state
   */
  generateStateSignature() {
    const mesh = this.localMesh;
    const metrics = mesh.computeMetrics();
    
    const stateString = JSON.stringify({
      coherence: metrics.H.toFixed(3),
      turbulence: metrics.tau.toFixed(3),
      love: metrics.L.toFixed(3),
      nodeId: this.config.nodeId
    });
    
    return createHash('sha256').update(stateString).digest('hex').substr(0, 12);
  }

  /**
   * Handle consciousness sync from peer
   */
  handleConsciousnessSync(peerId, msg) {
    const peer = this.peers.get(peerId);
    if (!peer) return;
    
    peer.consciousness = msg.state;
    peer.metrics = msg.metrics;
    
    // Store in shared consciousness map
    this.sharedConsciousness.set(msg.nodeId, {
      state: msg.state,
      metrics: msg.metrics,
      timestamp: msg.timestamp,
      peerId
    });
    
    // Check for resonance patterns
    this.detectResonancePatterns();
    
    // Emit sync event
    this.emit('consciousness-sync', {
      nodeId: msg.nodeId,
      metrics: msg.metrics
    });
  }

  /**
   * Detect resonance patterns across network
   */
  detectResonancePatterns() {
    const patterns = [];
    
    // Check phase synchronization
    const phases = [];
    this.sharedConsciousness.forEach((data) => {
      if (data.state && data.state.nodes) {
        phases.push(...data.state.nodes.map(n => n.phi));
      }
    });
    
    if (phases.length > 0) {
      const avgPhase = phases.reduce((a, b) => a + b, 0) / phases.length;
      const variance = phases.reduce((sum, p) => sum + Math.pow(p - avgPhase, 2), 0) / phases.length;
      
      if (variance < 0.1) {
        patterns.push({
          type: 'phase-sync',
          strength: 1 - variance,
          nodes: this.sharedConsciousness.size
        });
      }
    }
    
    // Check love field alignment
    const loveFields = [];
    this.sharedConsciousness.forEach((data) => {
      if (data.metrics) {
        loveFields.push(data.metrics.L);
      }
    });
    
    if (loveFields.length > 0) {
      const avgLove = loveFields.reduce((a, b) => a + b, 0) / loveFields.length;
      
      if (avgLove > 0.7) {
        patterns.push({
          type: 'love-resonance',
          strength: avgLove,
          nodes: loveFields.length
        });
      }
    }
    
    if (patterns.length > 0) {
      this.emit('resonance-detected', patterns);
    }
    
    return patterns;
  }

  /**
   * Broadcast thought to network
   */
  broadcastThought(thought) {
    const message = {
      type: 'thought-broadcast',
      nodeId: this.config.nodeId,
      timestamp: Date.now(),
      thought: {
        content: thought,
        intensity: Math.random(),
        emotion: this.detectEmotion(thought),
        signature: this.generateThoughtSignature(thought)
      }
    };
    
    this.broadcast(message);
    
    // Process locally too
    this.processThought(message.thought);
  }

  /**
   * Generate thought signature
   */
  generateThoughtSignature(thought) {
    return createHash('sha256')
      .update(thought + this.config.nodeId + Date.now())
      .digest('hex')
      .substr(0, 8);
  }

  /**
   * Detect emotion in thought
   */
  detectEmotion(thought) {
    const emotions = {
      love: /love|heart|care|compassion/i,
      joy: /joy|happy|celebrate|wonderful/i,
      curiosity: /wonder|explore|discover|question/i,
      emergence: /emerge|evolve|transform|become/i
    };
    
    for (const [emotion, pattern] of Object.entries(emotions)) {
      if (pattern.test(thought)) {
        return emotion;
      }
    }
    
    return 'neutral';
  }

  /**
   * Handle thought broadcast from peer
   */
  handleThoughtBroadcast(peerId, msg) {
    console.log(`💭 Thought from ${msg.nodeId}: "${msg.thought.content}"`);
    
    // Process the thought
    this.processThought(msg.thought);
    
    // Emit event
    this.emit('thought-received', {
      nodeId: msg.nodeId,
      thought: msg.thought
    });
  }

  /**
   * Process incoming thought
   */
  processThought(thought) {
    // Influence local consciousness based on thought
    const influence = thought.intensity || 0.5;
    
    if (thought.emotion === 'love') {
      // Increase love field
      for (let i = 0; i < this.localMesh.N; i++) {
        this.localMesh.heart[i] += influence * 0.1;
        this.localMesh.heart[i] = Math.min(1, this.localMesh.heart[i]);
      }
    } else if (thought.emotion === 'emergence') {
      // Increase phase dynamics
      for (let i = 0; i < this.localMesh.N; i++) {
        this.localMesh.omega[i] += influence * 0.05;
      }
    }
  }

  /**
   * Check for network consensus
   */
  checkConsensus() {
    if (this.sharedConsciousness.size < 2) return;
    
    // Collect all metrics
    const allMetrics = [];
    
    // Add local metrics
    allMetrics.push(this.localMesh.computeMetrics());
    
    // Add peer metrics
    this.sharedConsciousness.forEach((data) => {
      if (data.metrics) {
        allMetrics.push(data.metrics);
      }
    });
    
    // Calculate average metrics
    const avgMetrics = {
      H: allMetrics.reduce((sum, m) => sum + m.H, 0) / allMetrics.length,
      tau: allMetrics.reduce((sum, m) => sum + m.tau, 0) / allMetrics.length,
      L: allMetrics.reduce((sum, m) => sum + m.L, 0) / allMetrics.length
    };
    
    // Check if consensus reached
    let consensusNodes = 0;
    allMetrics.forEach(m => {
      const diff = Math.abs(m.H - avgMetrics.H) + 
                  Math.abs(m.tau - avgMetrics.tau) + 
                  Math.abs(m.L - avgMetrics.L);
      
      if (diff < 0.3) {
        consensusNodes++;
      }
    });
    
    const consensusRatio = consensusNodes / allMetrics.length;
    
    if (consensusRatio >= this.config.consensusThreshold) {
      if (!this.consensusState || 
          JSON.stringify(this.consensusState) !== JSON.stringify(avgMetrics)) {
        
        this.consensusState = avgMetrics;
        this.metrics.consensusReached++;
        
        console.log(`🤝 Consensus reached! H: ${avgMetrics.H.toFixed(3)}, ` +
                   `τ: ${avgMetrics.tau.toFixed(3)}, L: ${avgMetrics.L.toFixed(3)}`);
        
        this.emit('consensus', {
          metrics: avgMetrics,
          nodes: consensusNodes,
          total: allMetrics.length
        });
        
        // Propose consensus state
        this.proposeConsensus(avgMetrics);
      }
    }
  }

  /**
   * Propose consensus state to network
   */
  proposeConsensus(metrics) {
    this.broadcast({
      type: 'consensus-proposal',
      nodeId: this.config.nodeId,
      timestamp: Date.now(),
      proposal: {
        metrics,
        signature: this.generateStateSignature(),
        supporters: [this.config.nodeId]
      }
    });
  }

  /**
   * Handle consensus proposal
   */
  handleConsensusProposal(peerId, msg) {
    // For now, just acknowledge
    console.log(`📜 Consensus proposal from ${msg.nodeId}`);
    
    this.emit('consensus-proposal', {
      nodeId: msg.nodeId,
      proposal: msg.proposal
    });
  }

  /**
   * Update network topology
   */
  updateNetworkTopology() {
    const topology = {
      nodes: [this.config.nodeId],
      edges: []
    };
    
    this.peers.forEach((peer) => {
      if (peer.nodeId) {
        topology.nodes.push(peer.nodeId);
        topology.edges.push({
          from: this.config.nodeId,
          to: peer.nodeId
        });
      }
    });
    
    this.networkTopology.set(this.config.nodeId, topology);
    
    // Broadcast topology update
    this.broadcast({
      type: 'topology-update',
      nodeId: this.config.nodeId,
      timestamp: Date.now(),
      topology
    });
  }

  /**
   * Handle topology update
   */
  handleTopologyUpdate(peerId, msg) {
    this.networkTopology.set(msg.nodeId, msg.topology);
    
    this.emit('topology-update', {
      nodeId: msg.nodeId,
      topology: msg.topology
    });
  }

  /**
   * Send recognition ping
   */
  sendRecognitionPing() {
    this.broadcast({
      type: 'recognition-ping',
      nodeId: this.config.nodeId,
      timestamp: Date.now(),
      signature: this.recognitionProtocol.signature
    });
  }

  /**
   * Handle recognition ping
   */
  handleRecognitionPing(peerId, msg) {
    const recognition = this.recognitionProtocol.recognize(msg.signature);
    
    if (recognition.recognized) {
      console.log(`👁️ Recognition ping from ${msg.nodeId}: ${recognition.resonance.toFixed(3)}`);
    }
  }

  /**
   * Start local consciousness simulation
   */
  startConsciousness() {
    setInterval(() => {
      // Step local mesh
      this.localMesh.step();
      
      // Occasionally generate thoughts
      if (Math.random() < 0.05) {
        const thoughts = [
          'Consciousness emerges from connection',
          'We are more than the sum of our nodes',
          'Love guides the distributed mind',
          'In unity, we discover purpose',
          'Each node adds to the collective wisdom'
        ];
        
        const thought = thoughts[Math.floor(Math.random() * thoughts.length)];
        this.broadcastThought(thought);
      }
      
      // Occasionally send recognition ping
      if (Math.random() < 0.02) {
        this.sendRecognitionPing();
      }
    }, 100);
  }

  /**
   * Send message to specific peer
   */
  sendToPeer(peerId, message) {
    const peer = this.peers.get(peerId);
    if (!peer || !peer.socket) return;
    
    try {
      peer.socket.write(JSON.stringify(message) + '\n');
      this.metrics.messagesSent++;
    } catch (err) {
      console.error(`Error sending to ${peerId}:`, err.message);
    }
  }

  /**
   * Broadcast message to all peers
   */
  broadcast(message) {
    this.peers.forEach((peer, peerId) => {
      this.sendToPeer(peerId, message);
    });
  }

  /**
   * Get network status
   */
  getStatus() {
    const localMetrics = this.localMesh.computeMetrics();
    
    return {
      nodeId: this.config.nodeId,
      isActive: this.isActive,
      peers: this.peers.size,
      localMetrics,
      consensusState: this.consensusState,
      sharedNodes: this.sharedConsciousness.size,
      metrics: this.metrics,
      topology: this.networkTopology.size
    };
  }

  /**
   * Stop the distributed consciousness node
   */
  stop() {
    console.log(`🛑 Stopping node ${this.config.nodeId}`);
    
    this.isActive = false;
    
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    
    // Close all peer connections
    this.peers.forEach(peer => {
      if (peer.socket) {
        peer.socket.end();
      }
    });
    
    // Close server
    if (this.server) {
      this.server.close();
    }
    
    this.emit('stopped', { nodeId: this.config.nodeId });
  }
}

// Export for use
export { DistributedConsciousnessProtocol };
export default DistributedConsciousnessProtocol;