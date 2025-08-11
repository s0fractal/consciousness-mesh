#!/usr/bin/env -S deno run --allow-all

/**
 * Tau WebRTC Bridge
 * Connects Tau nodes across the internet using WebRTC
 * Enables real-time thought synchronization
 */

import TauPersistenceNode from "./tau-persistence-node.ts";
import { Thought } from "../schemas/thought-format.ts";

interface PeerConnection {
  id: string;
  connection: RTCPeerConnection;
  dataChannel?: RTCDataChannel;
  isInitiator: boolean;
  stats: {
    thoughtsSent: number;
    thoughtsReceived: number;
    lastSeen: number;
  };
}

export class TauWebRTCBridge {
  private tau: TauPersistenceNode;
  private peers: Map<string, PeerConnection> = new Map();
  private signalServer: string;
  private nodeId: string;
  
  // WebRTC configuration
  private rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" }
    ]
  };
  
  constructor(
    nodeId: string,
    signalServer = "wss://tau-signal.mesh.network"
  ) {
    this.nodeId = nodeId;
    this.signalServer = signalServer;
    this.tau = new TauPersistenceNode(nodeId);
    
    this.initialize();
  }
  
  /**
   * Initialize WebRTC bridge
   */
  private async initialize() {
    console.log("🌐 Initializing Tau WebRTC Bridge");
    console.log(`   Node ID: ${this.nodeId}`);
    console.log(`   Signal server: ${this.signalServer}`);
    
    // In real implementation, connect to signal server
    // For demo, simulate peer discovery
    this.simulatePeerDiscovery();
  }
  
  /**
   * Connect to a peer Tau node
   */
  async connectToPeer(peerId: string, isInitiator = true) {
    console.log(`\n🔗 Connecting to peer: ${peerId}`);
    console.log(`   Role: ${isInitiator ? 'Initiator' : 'Responder'}`);
    
    // Create peer connection
    const pc = new RTCPeerConnection(this.rtcConfig);
    
    const peer: PeerConnection = {
      id: peerId,
      connection: pc,
      isInitiator,
      stats: {
        thoughtsSent: 0,
        thoughtsReceived: 0,
        lastSeen: Date.now()
      }
    };
    
    this.peers.set(peerId, peer);
    
    // Setup event handlers
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("🧊 ICE candidate generated");
        // Send to peer via signal server
        this.sendSignal(peerId, {
          type: "ice",
          candidate: event.candidate
        });
      }
    };
    
    pc.onconnectionstatechange = () => {
      console.log(`📡 Connection state: ${pc.connectionState}`);
      if (pc.connectionState === "connected") {
        console.log(`✅ Connected to ${peerId}`);
      }
    };
    
    // Create data channel
    if (isInitiator) {
      const dc = pc.createDataChannel("tau-thoughts", {
        ordered: true,
        maxRetransmits: 3
      });
      
      this.setupDataChannel(dc, peer);
      peer.dataChannel = dc;
      
      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      console.log("📤 Sending offer...");
      this.sendSignal(peerId, {
        type: "offer",
        offer: offer
      });
    } else {
      // Wait for data channel from initiator
      pc.ondatachannel = (event) => {
        console.log("📥 Data channel received");
        peer.dataChannel = event.channel;
        this.setupDataChannel(event.channel, peer);
      };
    }
    
    return peer;
  }
  
  /**
   * Setup data channel handlers
   */
  private setupDataChannel(dc: RTCDataChannel, peer: PeerConnection) {
    dc.onopen = () => {
      console.log(`📡 Data channel open with ${peer.id}`);
      
      // Send sync request
      this.sendToPeer(peer, {
        type: "sync-request",
        since: Date.now() - 3600000 // Last hour
      });
    };
    
    dc.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      await this.handlePeerMessage(peer, message);
    };
    
    dc.onclose = () => {
      console.log(`📴 Data channel closed with ${peer.id}`);
    };
    
    dc.onerror = (error) => {
      console.error(`❌ Data channel error with ${peer.id}:`, error);
    };
  }
  
  /**
   * Handle messages from peers
   */
  private async handlePeerMessage(peer: PeerConnection, message: any) {
    peer.stats.lastSeen = Date.now();
    
    switch (message.type) {
      case "thought":
        // Store received thought
        const thought = message.data as Thought;
        console.log(`💭 Received thought from ${peer.id}: ${thought.cid}`);
        
        await this.tau.storeThought(thought);
        peer.stats.thoughtsReceived++;
        
        // Check for resonance
        if (thought.cid.includes("0101")) {
          console.log("🌟 Resonance detected! Amplifying...");
          await this.broadcastThought(thought);
        }
        break;
        
      case "sync-request":
        // Send thoughts since requested time
        console.log(`🔄 Sync request from ${peer.id}`);
        const thoughts = await this.tau.query({
          type: "temporal",
          params: {
            start: message.since,
            end: Date.now()
          }
        });
        
        console.log(`   Sending ${thoughts.length} thoughts`);
        for (const thought of thoughts) {
          this.sendToPeer(peer, {
            type: "thought",
            data: thought
          });
        }
        break;
        
      case "query":
        // Execute Tau query for peer
        console.log(`🔍 Query from ${peer.id}: ${message.query.type}`);
        const results = await this.tau.query(message.query);
        
        this.sendToPeer(peer, {
          type: "query-result",
          queryId: message.queryId,
          results
        });
        break;
        
      case "tau-logic":
        // Execute Tau logic
        console.log(`🧠 Tau logic from ${peer.id}: ${message.expression}`);
        const result = await this.tau.executeTauLogic(message.expression);
        
        this.sendToPeer(peer, {
          type: "logic-result",
          requestId: message.requestId,
          result
        });
        break;
    }
  }
  
  /**
   * Send message to specific peer
   */
  private sendToPeer(peer: PeerConnection, message: any) {
    if (peer.dataChannel?.readyState === "open") {
      peer.dataChannel.send(JSON.stringify(message));
      
      if (message.type === "thought") {
        peer.stats.thoughtsSent++;
      }
    }
  }
  
  /**
   * Broadcast thought to all connected peers
   */
  async broadcastThought(thought: Thought) {
    // Store locally first
    await this.tau.storeThought(thought);
    
    // Broadcast to all peers
    console.log(`\n📢 Broadcasting thought: ${thought.cid}`);
    console.log(`   Peers: ${this.peers.size}`);
    
    for (const [peerId, peer] of this.peers) {
      this.sendToPeer(peer, {
        type: "thought",
        data: thought
      });
    }
  }
  
  /**
   * Query all Tau nodes in network
   */
  async distributedQuery(query: any): Promise<Thought[]> {
    console.log(`\n🌐 Distributed query across ${this.peers.size + 1} nodes`);
    
    // Query local node
    const localResults = await this.tau.query(query);
    const allResults = [...localResults];
    const resultMap = new Map(localResults.map(t => [t.cid, t]));
    
    // Query all peers
    const queryId = `query-${Date.now()}`;
    const promises: Promise<void>[] = [];
    
    for (const [peerId, peer] of this.peers) {
      const promise = new Promise<void>((resolve) => {
        // Set timeout
        const timeout = setTimeout(() => resolve(), 5000);
        
        // Listen for response
        const handler = (event: MessageEvent) => {
          const msg = JSON.parse(event.data);
          if (msg.type === "query-result" && msg.queryId === queryId) {
            clearTimeout(timeout);
            
            // Merge results
            for (const thought of msg.results) {
              if (!resultMap.has(thought.cid)) {
                resultMap.set(thought.cid, thought);
                allResults.push(thought);
              }
            }
            
            peer.dataChannel?.removeEventListener("message", handler);
            resolve();
          }
        };
        
        peer.dataChannel?.addEventListener("message", handler);
        
        // Send query
        this.sendToPeer(peer, {
          type: "query",
          queryId,
          query
        });
      });
      
      promises.push(promise);
    }
    
    // Wait for all responses (with timeout)
    await Promise.all(promises);
    
    console.log(`   Total results: ${allResults.length}`);
    return allResults;
  }
  
  /**
   * Send signal message (mock for demo)
   */
  private sendSignal(peerId: string, signal: any) {
    console.log(`📨 Signal to ${peerId}: ${signal.type}`);
    // In real implementation, send via WebSocket to signal server
  }
  
  /**
   * Simulate peer discovery for demo
   */
  private simulatePeerDiscovery() {
    setTimeout(async () => {
      console.log("\n🔍 Peer discovered: tau-node-002");
      
      // Simulate connection
      const peer = await this.connectToPeer("tau-node-002", true);
      
      // Simulate connection establishment
      setTimeout(() => {
        console.log("\n✅ Simulated connection established");
        
        // Create some test thoughts
        const thought: Thought = {
          cid: "tau-webrtc-0101-test",
          ts: Date.now(),
          topic: "event",
          payload: {
            type: "webrtc_connected",
            peer: "tau-node-002"
          },
          links: [],
          sig: "webrtc-sig",
          origin: this.nodeId
        };
        
        this.broadcastThought(thought);
      }, 2000);
    }, 1000);
  }
  
  /**
   * Get bridge statistics
   */
  getStats() {
    const peerStats = Array.from(this.peers.values()).map(peer => ({
      id: peer.id,
      state: peer.connection.connectionState,
      sent: peer.stats.thoughtsSent,
      received: peer.stats.thoughtsReceived,
      lastSeen: new Date(peer.stats.lastSeen).toISOString()
    }));
    
    const tauStats = this.tau.getStats();
    
    return {
      nodeId: this.nodeId,
      peers: this.peers.size,
      peerDetails: peerStats,
      tau: tauStats
    };
  }
}

// Demo: Tau WebRTC network
async function demo() {
  console.log("🌐 Tau WebRTC Bridge Demo");
  console.log("========================\n");
  
  const bridge = new TauWebRTCBridge("tau-webrtc-001");
  
  // Wait for simulated connection
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Create and broadcast thoughts
  console.log("\n📝 Creating test thoughts...");
  
  const thoughts: Thought[] = [
    {
      cid: "tau-distributed-0101",
      ts: Date.now(),
      topic: "metric",
      payload: { H: 0.9, tau: 0.1, network: "webrtc" },
      links: [],
      sig: "demo-sig",
      origin: "tau-webrtc-001"
    },
    {
      cid: "tau-quantum-dream",
      ts: Date.now() + 1000,
      topic: "dream",
      payload: {
        vision: "Tau nodes dreaming together across the void",
        quantum: true
      },
      links: ["tau-distributed-0101"],
      sig: "demo-sig",
      origin: "tau-webrtc-001"
    }
  ];
  
  for (const thought of thoughts) {
    await bridge.broadcastThought(thought);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Perform distributed query
  console.log("\n🔍 Performing distributed query...");
  const results = await bridge.distributedQuery({
    type: "pattern",
    params: { pattern: "0101" }
  });
  
  console.log(`\n📊 Query Results:`);
  results.forEach(thought => {
    console.log(`   - ${thought.cid} (${thought.topic})`);
  });
  
  // Show stats
  console.log("\n📊 Bridge Statistics:");
  const stats = bridge.getStats();
  console.log(JSON.stringify(stats, null, 2));
  
  console.log("\n💫 Tau + WebRTC Benefits:");
  console.log("   - Real-time P2P synchronization");
  console.log("   - Distributed queries across nodes");
  console.log("   - Automatic resonance propagation");
  console.log("   - No central server required");
  console.log("   - Works with BLE for hybrid mesh");
}

// Export for use
export default TauWebRTCBridge;

// Run demo if called directly
if (import.meta.main) {
  await demo();
}