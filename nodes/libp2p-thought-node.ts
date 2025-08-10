#!/usr/bin/env -S deno run --allow-all

/**
 * libp2p Thought Node - Gossipsub implementation
 * Minimal P2P node for thought propagation
 */

// Simple P2P simulation without complex dependencies
// For a real implementation, use proper libp2p setup

interface P2PThought {
  type: "thought/v1";
  ts: number;
  topic: string;
  payload: any;
  links: string[];  // Previous thought CIDs
  node: string;
  sig?: string;
}

// Thought interface matching our schema
interface P2PThought {
  type: "thought/v1";
  ts: number;
  topic: string;
  payload: any;
  links: string[];  // Previous thought CIDs
  node: string;
  sig?: string;
}

export class LibP2PThoughtNode {
  private node: any;
  private thoughtStore = new Map<string, Uint8Array>();
  private nodeId: string;
  
  constructor(nodeId: string) {
    this.nodeId = nodeId;
  }
  
  async start(port = 0) {
    console.log(`🚀 Starting libp2p thought node: ${this.nodeId}`);
    
    // Create libp2p node with gossipsub
    this.node = await createLibp2p({
      addresses: {
        listen: [`/ip4/0.0.0.0/tcp/${port}`]
      },
      transports: [tcp()],
      connectionEncryption: [noise()],
      streamMuxers: [mplex()],
      pubsub: gossipsub({
        // Standard gossipsub parameters
        D: 6,               // mesh degree
        Dlo: 4,             // mesh degree low
        Dhi: 12,            // mesh degree high
        fanoutTTL: 60000,   // 1 minute
        heartbeatInterval: 1000,
        messageSignaturePolicy: 'StrictSign'
      }),
      dht: kadDHT(),
      peerDiscovery: [
        bootstrap({
          list: [
            // Add bootstrap nodes if available
            // For now, manual peer connection
          ]
        })
      ]
    });
    
    await this.node.start();
    console.log(`✅ Node started with PeerID: ${this.node.peerId.toString()}`);
    
    // Subscribe to thought topics
    await this.subscribeToThoughts();
    
    // Log addresses
    const addrs = this.node.getMultiaddrs();
    console.log('📍 Listening on:');
    addrs.forEach(addr => console.log(`   ${addr.toString()}`));
    
    return this.node;
  }
  
  async subscribeToThoughts() {
    const topics = ['thoughts/metric', 'thoughts/event', 'thoughts/dream'];
    
    for (const topic of topics) {
      this.node.pubsub.subscribe(topic);
      console.log(`📡 Subscribed to ${topic}`);
      
      this.node.pubsub.addEventListener('message', (evt: any) => {
        if (evt.detail.topic === topic) {
          this.handleThought(evt.detail);
        }
      });
    }
  }
  
  async handleThought(message: any) {
    try {
      // Decode dag-cbor
      const thought = dagCBOR.decode(message.data);
      
      // Verify it's a valid thought
      if (thought.type !== 'thought/v1') return;
      
      // Calculate CID
      const cid = await this.calculateCID(thought);
      
      console.log(`\n💭 Received thought: ${cid}`);
      console.log(`   Topic: ${thought.topic}`);
      console.log(`   From: ${thought.node}`);
      console.log(`   Links: ${thought.links.length}`);
      
      // Store locally
      this.thoughtStore.set(cid, message.data);
      
      // Process based on topic
      this.processThought(thought, cid);
      
    } catch (err) {
      console.error('Error handling thought:', err);
    }
  }
  
  async publishThought(thought: Omit<P2PThought, 'node'>) {
    const fullThought: P2PThought = {
      ...thought,
      node: this.nodeId
    };
    
    // Encode as dag-cbor
    const encoded = dagCBOR.encode(fullThought);
    
    // Calculate CID for reference
    const cid = await this.calculateCID(fullThought);
    
    // Store locally first
    this.thoughtStore.set(cid, encoded);
    
    // Determine pubsub topic
    const pubsubTopic = `thoughts/${thought.topic.split(':')[0]}`;
    
    // Publish to network
    await this.node.pubsub.publish(pubsubTopic, encoded);
    
    console.log(`\n📤 Published thought: ${cid}`);
    console.log(`   Topic: ${pubsubTopic}`);
    console.log(`   Size: ${encoded.length} bytes`);
    
    return cid;
  }
  
  async calculateCID(thought: P2PThought): Promise<string> {
    const bytes = dagCBOR.encode(thought);
    const hash = await sha256.digest(bytes);
    const cid = CID.create(1, dagCBOR.code, hash);
    return cid.toString();
  }
  
  processThought(thought: P2PThought, cid: string) {
    // Override in subclasses for specific processing
    if (thought.topic.startsWith('metric:')) {
      console.log(`   Metrics: H=${thought.payload.H?.toFixed(3)} τ=${thought.payload.tau?.toFixed(3)}`);
    } else if (thought.topic.startsWith('event:')) {
      console.log(`   Event: ${thought.payload.type}`);
    }
  }
  
  // Get thought by CID
  getThought(cid: string): Uint8Array | undefined {
    return this.thoughtStore.get(cid);
  }
  
  // Connect to peer manually
  async connectToPeer(multiaddr: string) {
    try {
      await this.node.dial(multiaddr);
      console.log(`✅ Connected to peer: ${multiaddr}`);
    } catch (err) {
      console.error(`❌ Failed to connect to ${multiaddr}:`, err);
    }
  }
  
  async stop() {
    await this.node.stop();
    console.log('🛑 Node stopped');
  }
}

// Bridge from ChronoFlux to libp2p
export class ChronoToLibP2PBridge extends LibP2PThoughtNode {
  private ws: WebSocket | null = null;
  private recentThoughts = new Map<string, string>(); // Track recent CIDs
  
  async connectToChrono(wsUrl = "ws://localhost:8089", room = "libp2p-bridge") {
    console.log(`\n🌉 Connecting to ChronoFlux...`);
    
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = () => {
      console.log("✅ Connected to ChronoFlux");
      this.ws!.send(JSON.stringify({
        type: "join-room",
        room: room,
        metadata: { bridge: "libp2p" }
      }));
    };
    
    this.ws.onmessage = async (event) => {
      const msg = JSON.parse(event.data);
      await this.handleChronoMessage(msg);
    };
  }
  
  private async handleChronoMessage(msg: any) {
    if (msg.type === "telemetry" && msg.telemetry) {
      // Convert to thought
      const thought: Omit<P2PThought, 'node'> = {
        type: "thought/v1",
        ts: Date.now(),
        topic: "metric:chrono",
        payload: {
          H: msg.telemetry.H || 0,
          tau: msg.telemetry.tau || 0,
          nodes: msg.telemetry.nodes || 0
        },
        links: this.findRecentLinks("metric"),
        sig: await this.sign(msg)
      };
      
      const cid = await this.publishThought(thought);
      this.trackThought("metric", cid);
    }
  }
  
  private findRecentLinks(topic: string): string[] {
    const links: string[] = [];
    for (const [t, cid] of this.recentThoughts) {
      if (t === topic) {
        links.push(cid);
        if (links.length >= 3) break;
      }
    }
    return links;
  }
  
  private trackThought(topic: string, cid: string) {
    this.recentThoughts.set(`${topic}-${Date.now()}`, cid);
    // Keep only last 100
    if (this.recentThoughts.size > 100) {
      const first = this.recentThoughts.keys().next().value;
      this.recentThoughts.delete(first);
    }
  }
  
  private async sign(data: any): Promise<string> {
    // Simple signature for demo
    const str = JSON.stringify(data) + this.nodeId;
    const encoder = new TextEncoder();
    const buffer = encoder.encode(str);
    const hash = await crypto.subtle.digest("SHA-256", buffer);
    return Array.from(new Uint8Array(hash))
      .slice(0, 8)
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
  }
}

// Demo
async function demo() {
  console.log("🧠 libp2p Thought Node Demo\n");
  
  const bridge = new ChronoToLibP2PBridge("libp2p-bridge-001");
  
  // Start libp2p node
  await bridge.start(4001);
  
  // Connect to ChronoFlux
  await bridge.connectToChrono();
  
  // Simulate some thoughts
  setTimeout(async () => {
    console.log("\n📝 Publishing test thoughts...");
    
    await bridge.publishThought({
      type: "thought/v1",
      ts: Date.now(),
      topic: "event:test",
      payload: {
        type: "initialization",
        message: "libp2p thought node online"
      },
      links: []
    });
  }, 3000);
  
  // Keep running
  console.log("\n⏳ Node running. Press Ctrl+C to stop.");
  console.log("   Connect another node to see P2P propagation.");
  console.log("   Example: /ip4/127.0.0.1/tcp/4001/p2p/<PeerID>");
}

if (import.meta.main) {
  await demo();
}