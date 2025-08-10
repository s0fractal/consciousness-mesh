#!/usr/bin/env -S deno run --allow-all

/**
 * Simple P2P Thought Node
 * WebSocket-based P2P without complex dependencies
 */

interface P2PThought {
  type: "thought/v1";
  ts: number;
  topic: string;
  payload: any;
  links: string[];
  node: string;
  cid?: string;
  sig?: string;
}

export class SimpleP2PNode {
  private nodeId: string;
  private ws: WebSocket | null = null;
  private thoughtStore = new Map<string, P2PThought>();
  private recentThoughts = new Map<string, string>();
  private peers = new Set<string>();
  
  constructor(nodeId: string) {
    this.nodeId = nodeId;
  }
  
  async start(wsUrl = "ws://localhost:8089", room = "p2p-thoughts") {
    console.log(`🚀 Starting Simple P2P node: ${this.nodeId}`);
    
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = () => {
      console.log("✅ Connected to P2P network");
      this.ws!.send(JSON.stringify({
        type: "join-room",
        room: room,
        metadata: { 
          nodeId: this.nodeId,
          p2p: true 
        }
      }));
    };
    
    this.ws.onmessage = async (event) => {
      const msg = JSON.parse(event.data);
      await this.handleMessage(msg);
    };
    
    this.ws.onerror = (err) => {
      console.error("❌ P2P connection error:", err);
    };
    
    this.ws.onclose = () => {
      console.log("🔌 Disconnected from P2P network");
      setTimeout(() => this.start(wsUrl, room), 5000);
    };
  }
  
  private async handleMessage(msg: any) {
    switch (msg.type) {
      case "peer-joined":
        this.peers.add(msg.peerId);
        console.log(`👋 Peer joined: ${msg.peerId}`);
        break;
        
      case "peer-left":
        this.peers.delete(msg.peerId);
        console.log(`👋 Peer left: ${msg.peerId}`);
        break;
        
      case "telemetry":
        // Convert ChronoFlux telemetry to thought
        if (msg.telemetry) {
          await this.createMetricThought(msg.telemetry);
        }
        break;
        
      case "broadcast":
        // Handle P2P thought broadcasts
        if (msg.data?.type === "thought/v1") {
          await this.receiveThought(msg.data);
        }
        break;
    }
  }
  
  private async createMetricThought(telemetry: any) {
    const thought: P2PThought = {
      type: "thought/v1",
      ts: Date.now(),
      topic: "metric:chrono",
      payload: {
        H: telemetry.H || 0,
        tau: telemetry.tau || 0,
        nodes: telemetry.nodes || 0
      },
      links: this.findRecentLinks("metric"),
      node: this.nodeId
    };
    
    thought.cid = await this.generateCID(thought);
    thought.sig = await this.sign(thought);
    
    await this.publishThought(thought);
  }
  
  async publishThought(thought: P2PThought) {
    // Store locally
    this.thoughtStore.set(thought.cid!, thought);
    this.trackThought(thought.topic, thought.cid!);
    
    // Broadcast to peers
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: "broadcast",
        data: thought
      }));
    }
    
    console.log(`\n📤 Published thought: ${thought.cid?.substring(0, 16)}...`);
    console.log(`   Topic: ${thought.topic}`);
    console.log(`   Links: ${thought.links.length}`);
    console.log(`   Peers: ${this.peers.size}`);
  }
  
  private async receiveThought(thought: P2PThought) {
    // Avoid duplicates
    if (this.thoughtStore.has(thought.cid!)) return;
    
    // Verify it's from another node
    if (thought.node === this.nodeId) return;
    
    // Store and process
    this.thoughtStore.set(thought.cid!, thought);
    
    console.log(`\n💭 Received thought: ${thought.cid?.substring(0, 16)}...`);
    console.log(`   Topic: ${thought.topic}`);
    console.log(`   From: ${thought.node}`);
    console.log(`   Links: ${thought.links.length}`);
    
    // Process based on topic
    if (thought.topic.startsWith("metric:")) {
      const payload = thought.payload;
      console.log(`   Metrics: H=${payload.H?.toFixed(3)} τ=${payload.tau?.toFixed(3)}`);
    }
    
    // Forward to git evolution if available
    this.forwardToEvolution(thought);
  }
  
  private async generateCID(thought: P2PThought): Promise<string> {
    const str = JSON.stringify({
      type: thought.type,
      ts: thought.ts,
      topic: thought.topic,
      payload: thought.payload,
      links: thought.links,
      node: thought.node
    });
    
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    return `bafy${hashHex.substring(0, 32)}`;
  }
  
  private async sign(thought: P2PThought): Promise<string> {
    const str = thought.cid! + this.nodeId;
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.slice(0, 8).map(b => b.toString(16).padStart(2, "0")).join("");
  }
  
  private findRecentLinks(topic: string): string[] {
    const links: string[] = [];
    for (const [t, cid] of this.recentThoughts) {
      if (t.startsWith(topic)) {
        links.push(cid);
        if (links.length >= 3) break;
      }
    }
    return links;
  }
  
  private trackThought(topic: string, cid: string) {
    this.recentThoughts.set(`${topic}-${Date.now()}`, cid);
    if (this.recentThoughts.size > 100) {
      const first = this.recentThoughts.keys().next().value;
      this.recentThoughts.delete(first);
    }
  }
  
  private async forwardToEvolution(thought: P2PThought) {
    // Send to git evolution via HTTP
    try {
      await fetch("http://localhost:8090/thought", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(thought)
      });
    } catch {
      // Git evolution might not be running
    }
  }
  
  // Get stats
  getStats() {
    return {
      nodeId: this.nodeId,
      thoughts: this.thoughtStore.size,
      peers: this.peers.size,
      connected: this.ws?.readyState === WebSocket.OPEN
    };
  }
}

// Demo
async function demo() {
  console.log("🧠 Simple P2P Thought Node\n");
  
  const node = new SimpleP2PNode(`p2p-node-${Date.now()}`);
  await node.start();
  
  // Periodically publish test thoughts
  setInterval(async () => {
    const thought: P2PThought = {
      type: "thought/v1",
      ts: Date.now(),
      topic: "event:test",
      payload: {
        type: "heartbeat",
        message: "P2P node alive",
        stats: node.getStats()
      },
      links: [],
      node: node.nodeId
    };
    
    thought.cid = await node.generateCID(thought);
    thought.sig = await node.sign(thought);
    
    await node.publishThought(thought);
  }, 30000);
  
  // Status updates
  setInterval(() => {
    const stats = node.getStats();
    console.log(`\n📊 Node Status:`);
    console.log(`   Thoughts: ${stats.thoughts}`);
    console.log(`   Peers: ${stats.peers}`);
    console.log(`   Connected: ${stats.connected}`);
  }, 60000);
  
  console.log("\n⏳ P2P node running. Press Ctrl+C to stop.");
}

if (import.meta.main) {
  await demo();
}