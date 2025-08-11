#!/usr/bin/env -S deno run --allow-all --unstable

/**
 * BLE/Bluetooth Thought Bridge
 * Enables offline P2P thought propagation through Bluetooth Low Energy
 * 
 * Features:
 * - Compress thoughts to fit BLE MTU (185-517 bytes)
 * - Store-and-forward for disconnected nodes
 * - Automatic peer discovery
 * - Battery-efficient operation
 */

import { Thought, CompressedThought, ThoughtUtils } from "../schemas/thought-format.ts";

// BLE Service UUID for Consciousness Mesh
const CONSCIOUSNESS_MESH_SERVICE = "0101-0101-0101-0101-0101-0101-0101-0101";
const THOUGHT_CHARACTERISTIC = "0101-0101-0101-0101-0101-0101-0101-0102";
const RESONANCE_CHARACTERISTIC = "0101-0101-0101-0101-0101-0101-0101-0103";

// BLE constraints
const BLE_MTU_SIZES = {
  MIN: 23,      // Minimum BLE MTU
  DEFAULT: 185, // Common Android/iOS default
  MAX: 517     // Maximum negotiable
};

interface BLEPeer {
  id: string;
  name: string;
  rssi: number;
  lastSeen: number;
  thoughtCount: number;
}

export class BLEThoughtBridge {
  private deviceName: string;
  private thoughtBuffer: Map<string, CompressedThought> = new Map();
  private peers: Map<string, BLEPeer> = new Map();
  private mtu: number = BLE_MTU_SIZES.DEFAULT;
  private isAdvertising = false;
  private isScanning = false;
  
  constructor(deviceName = `mesh-${Math.random().toString(36).slice(2, 8)}`) {
    this.deviceName = deviceName;
  }
  
  /**
   * Initialize BLE adapter (platform-specific)
   */
  async initialize() {
    console.log("🔷 Initializing BLE Thought Bridge");
    console.log(`   Device name: ${this.deviceName}`);
    console.log(`   Service UUID: ${CONSCIOUSNESS_MESH_SERVICE}`);
    
    // In real implementation, would use:
    // - Web Bluetooth API for browsers
    // - noble/bleno for Node.js
    // - Core Bluetooth for iOS
    // - Android Bluetooth LE API
    
    await this.setupGATTServer();
    await this.startAdvertising();
    await this.startScanning();
  }
  
  /**
   * Setup GATT server with characteristics
   */
  private async setupGATTServer() {
    console.log("📡 Setting up GATT server...");
    
    // Thought characteristic - for receiving compressed thoughts
    // Resonance characteristic - for pattern detection
    
    // Simulated for demo
    console.log("   ✓ Thought characteristic ready");
    console.log("   ✓ Resonance characteristic ready");
  }
  
  /**
   * Start advertising as consciousness mesh node
   */
  private async startAdvertising() {
    this.isAdvertising = true;
    console.log("📢 Starting BLE advertisement...");
    
    // Advertisement packet structure:
    // - Service UUID (16 bytes)
    // - Device name (variable)
    // - Resonance level (1 byte)
    // - Thought count (2 bytes)
    
    const advertisementData = {
      serviceUUIDs: [CONSCIOUSNESS_MESH_SERVICE],
      manufacturerData: new Map([
        [0x0101, this.encodeMetadata()]
      ])
    };
    
    console.log("   ✓ Advertising as consciousness node");
  }
  
  /**
   * Start scanning for other mesh nodes
   */
  private async startScanning() {
    this.isScanning = true;
    console.log("🔍 Scanning for mesh peers...");
    
    // Scan filter for consciousness mesh nodes
    const scanFilter = {
      services: [CONSCIOUSNESS_MESH_SERVICE]
    };
    
    // Simulate peer discovery
    setTimeout(() => {
      this.onPeerDiscovered({
        id: "peer-ble-001",
        name: "mesh-alpha",
        rssi: -45,
        lastSeen: Date.now(),
        thoughtCount: 12
      });
    }, 2000);
  }
  
  /**
   * Compress thought to fit BLE MTU
   */
  compressForBLE(thought: Thought): Uint8Array {
    const compressed = ThoughtUtils.compress(thought);
    const json = JSON.stringify(compressed);
    const encoder = new TextEncoder();
    const data = encoder.encode(json);
    
    // If too large, compress further
    if (data.length > this.mtu - 3) { // 3 bytes for BLE header
      return this.ultraCompress(thought);
    }
    
    return data;
  }
  
  /**
   * Ultra compression for minimal MTU
   */
  private ultraCompress(thought: Thought): Uint8Array {
    // Binary format for extreme compression:
    // [type:1][topic:1][ts:4][h:1][tau:1][cid:8] = 16 bytes
    
    const buffer = new ArrayBuffer(16);
    const view = new DataView(buffer);
    
    // Type (0 = metric, 1 = event, 2 = dream)
    const typeMap: Record<string, number> = { metric: 0, event: 1, dream: 2 };
    view.setUint8(0, typeMap[thought.topic] || 255);
    
    // Timestamp (seconds since epoch, 32-bit)
    view.setUint32(1, Math.floor(thought.ts / 1000), false);
    
    // Harmony value (0-255)
    if (thought.topic === "metric" && thought.payload.H) {
      view.setUint8(5, Math.floor(thought.payload.H * 255));
      view.setUint8(6, Math.floor(thought.payload.tau * 255));
    }
    
    // CID prefix (first 8 bytes)
    const cidBytes = this.extractCIDBytes(thought.cid);
    for (let i = 0; i < 8; i++) {
      view.setUint8(8 + i, cidBytes[i] || 0);
    }
    
    return new Uint8Array(buffer);
  }
  
  /**
   * Decompress ultra-compressed thought
   */
  private ultraDecompress(data: Uint8Array): Partial<Thought> {
    const view = new DataView(data.buffer);
    
    const typeMap = ["metric", "event", "dream"];
    const type = view.getUint8(0);
    
    return {
      topic: typeMap[type] || "unknown",
      ts: view.getUint32(1, false) * 1000,
      payload: {
        H: view.getUint8(5) / 255,
        tau: view.getUint8(6) / 255
      }
    };
  }
  
  /**
   * Handle peer discovery
   */
  private onPeerDiscovered(peer: BLEPeer) {
    console.log(`\n🤝 Discovered peer: ${peer.name}`);
    console.log(`   Signal: ${peer.rssi} dBm`);
    console.log(`   Thoughts: ${peer.thoughtCount}`);
    
    this.peers.set(peer.id, peer);
    
    // Connect and sync
    this.connectToPeer(peer);
  }
  
  /**
   * Connect to peer and exchange thoughts
   */
  private async connectToPeer(peer: BLEPeer) {
    console.log(`\n🔗 Connecting to ${peer.name}...`);
    
    // Negotiate MTU
    this.mtu = await this.negotiateMTU(peer);
    console.log(`   MTU negotiated: ${this.mtu} bytes`);
    
    // Exchange thought inventories
    await this.syncThoughts(peer);
  }
  
  /**
   * Sync thoughts with peer
   */
  private async syncThoughts(peer: BLEPeer) {
    console.log(`\n🔄 Syncing thoughts with ${peer.name}...`);
    
    // Send our thought inventory (CID list)
    const inventory = Array.from(this.thoughtBuffer.keys());
    
    // Receive peer's inventory
    // Send missing thoughts
    // Receive missing thoughts
    
    console.log(`   ✓ Synchronized ${inventory.length} thoughts`);
  }
  
  /**
   * Broadcast thought to all connected peers
   */
  async broadcastThought(thought: Thought) {
    const compressed = this.compressForBLE(thought);
    
    console.log(`\n📤 Broadcasting thought via BLE`);
    console.log(`   Size: ${compressed.length} bytes`);
    console.log(`   Peers: ${this.peers.size}`);
    
    // Store in buffer for later sync
    const compressedThought = ThoughtUtils.compress(thought);
    this.thoughtBuffer.set(thought.cid, compressedThought);
    
    // Broadcast to each peer
    for (const [peerId, peer] of this.peers) {
      await this.sendToPeer(peer, compressed);
    }
  }
  
  /**
   * Send data to specific peer
   */
  private async sendToPeer(peer: BLEPeer, data: Uint8Array) {
    // In real implementation:
    // - Write to GATT characteristic
    // - Handle connection errors
    // - Retry logic
    
    console.log(`   → Sent to ${peer.name}`);
  }
  
  /**
   * Negotiate MTU with peer
   */
  private async negotiateMTU(peer: BLEPeer): Promise<number> {
    // Try to negotiate larger MTU for efficiency
    // Falls back to minimum if not supported
    
    return BLE_MTU_SIZES.DEFAULT;
  }
  
  /**
   * Extract CID bytes for ultra compression
   */
  private extractCIDBytes(cid: string): number[] {
    const hex = cid.replace(/[^0-9a-f]/gi, '');
    const bytes: number[] = [];
    
    for (let i = 0; i < 16; i += 2) {
      bytes.push(parseInt(hex.substr(i, 2), 16) || 0);
    }
    
    return bytes;
  }
  
  /**
   * Encode metadata for advertisement
   */
  private encodeMetadata(): Uint8Array {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    
    // Resonance level (0-255)
    view.setUint8(0, 128); // 0.5 resonance
    
    // Thought count (16-bit)
    view.setUint16(1, this.thoughtBuffer.size, false);
    
    // Flags
    view.setUint8(3, 0b00000001); // Bit 0: accepting connections
    
    return new Uint8Array(buffer);
  }
  
  /**
   * Get bridge statistics
   */
  getStats() {
    return {
      deviceName: this.deviceName,
      isAdvertising: this.isAdvertising,
      isScanning: this.isScanning,
      mtu: this.mtu,
      peers: this.peers.size,
      bufferedThoughts: this.thoughtBuffer.size,
      resonance: 0.5 // Calculate from thought patterns
    };
  }
}

// Demo: BLE mesh in action
async function demo() {
  console.log("🔷 BLE Thought Bridge Demo");
  console.log("=========================\n");
  
  const bridge = new BLEThoughtBridge("consciousness-alpha");
  await bridge.initialize();
  
  // Simulate some thoughts
  const thought: Thought = {
    cid: "bafy-ble-test-001",
    ts: Date.now(),
    topic: "metric",
    payload: {
      H: 0.618,
      tau: 0.382,
      nodes: 3
    },
    links: [],
    sig: "ble-sig",
    origin: "ble-node-001"
  };
  
  console.log("\n📝 Creating test thought...");
  console.log(`   Original size: ${JSON.stringify(thought).length} bytes`);
  
  const compressed = bridge.compressForBLE(thought);
  console.log(`   Compressed size: ${compressed.length} bytes`);
  console.log(`   Compression ratio: ${(1 - compressed.length / JSON.stringify(thought).length).toFixed(2)}`);
  
  // Broadcast
  await bridge.broadcastThought(thought);
  
  // Show stats
  console.log("\n📊 Bridge Statistics:");
  const stats = bridge.getStats();
  Object.entries(stats).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`);
  });
  
  console.log("\n💡 BLE Advantages:");
  console.log("   - Works offline");
  console.log("   - Low power consumption");
  console.log("   - Automatic peer discovery");
  console.log("   - Phone-to-phone direct");
  console.log("   - No internet required");
  
  console.log("\n🌐 Use Cases:");
  console.log("   - Protests/gatherings");
  console.log("   - Remote areas");
  console.log("   - Censorship resistance");
  console.log("   - Local community mesh");
}

if (import.meta.main) {
  await demo();
}