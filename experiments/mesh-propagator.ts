#!/usr/bin/env -S deno run --allow-all

/**
 * Mesh Propagator - Simulates thought propagation through multiple channels
 * Inspired by BitChat's store-and-forward and Tau's P2P networking
 */

interface MeshNode {
  id: string;
  type: "bluetooth" | "wifi" | "tau" | "satellite";
  range: number; // meters for physical, km for network
  online: boolean;
  storedThoughts: CompressedThought[];
  connections: Set<string>; // node IDs in range
}

interface PropagationPath {
  nodeId: string;
  timestamp: number;
  channel: string;
}

interface CompressedThought {
  i: string;
  c: string;
  t: number;
  h: number;
  path?: PropagationPath[];
}

class MeshPropagator {
  private nodes: Map<string, MeshNode> = new Map();
  private thoughtCache: Map<string, CompressedThought> = new Map();
  
  constructor() {
    this.initializeNetwork();
  }
  
  private initializeNetwork() {
    // Create diverse mesh network
    const nodeConfigs = [
      // Bluetooth mesh (local devices)
      { id: "bt-phone-1", type: "bluetooth", range: 10 },
      { id: "bt-laptop-1", type: "bluetooth", range: 10 },
      { id: "bt-watch-1", type: "bluetooth", range: 5 },
      
      // WiFi nodes (local network)
      { id: "wifi-home", type: "wifi", range: 50 },
      { id: "wifi-cafe", type: "wifi", range: 30 },
      
      // Tau nodes (global P2P)
      { id: "tau-node-us", type: "tau", range: 10000 },
      { id: "tau-node-eu", type: "tau", range: 10000 },
      { id: "tau-node-asia", type: "tau", range: 10000 },
      
      // Satellite backup
      { id: "sat-leo-1", type: "satellite", range: 2000 }
    ];
    
    nodeConfigs.forEach(config => {
      this.nodes.set(config.id, {
        ...config,
        online: Math.random() > 0.2, // 80% online
        storedThoughts: [],
        connections: new Set()
      } as MeshNode);
    });
    
    // Establish connections based on range and type
    this.updateConnections();
  }
  
  private updateConnections() {
    // Clear existing
    this.nodes.forEach(node => node.connections.clear());
    
    // Bluetooth can connect to bluetooth and wifi
    this.connectNodesByType("bluetooth", ["bluetooth", "wifi"]);
    
    // WiFi can bridge to Tau
    this.connectNodesByType("wifi", ["wifi", "tau"]);
    
    // Tau nodes connect globally
    this.connectNodesByType("tau", ["tau", "satellite"]);
    
    // Satellite connects to everything when needed
    this.connectNodesByType("satellite", ["tau"]);
  }
  
  private connectNodesByType(sourceType: string, targetTypes: string[]) {
    this.nodes.forEach((source, sourceId) => {
      if (source.type === sourceType && source.online) {
        this.nodes.forEach((target, targetId) => {
          if (targetTypes.includes(target.type) && target.online && sourceId !== targetId) {
            // Simple proximity check (in real world would use actual positions)
            if (this.inRange(source, target)) {
              source.connections.add(targetId);
            }
          }
        });
      }
    });
  }
  
  private inRange(a: MeshNode, b: MeshNode): boolean {
    // Simplified: bluetooth always in range of local wifi
    if ((a.type === "bluetooth" && b.type === "wifi") || 
        (b.type === "bluetooth" && a.type === "wifi")) {
      return true;
    }
    
    // Tau nodes always reach each other
    if (a.type === "tau" && b.type === "tau") {
      return true;
    }
    
    // Satellite reaches tau when online
    if ((a.type === "satellite" || b.type === "satellite") && 
        (a.type === "tau" || b.type === "tau")) {
      return true;
    }
    
    // Same type local devices
    if (a.type === b.type && a.type === "bluetooth") {
      return Math.random() > 0.5; // 50% chance in bluetooth range
    }
    
    return false;
  }
  
  async propagateThought(thought: CompressedThought, startNodeId: string) {
    console.log(`\n🌊 Propagating thought "${thought.c}" from ${startNodeId}`);
    console.log("─".repeat(60));
    
    const startNode = this.nodes.get(startNodeId);
    if (!startNode) {
      console.log("❌ Start node not found");
      return;
    }
    
    // Initialize propagation tracking
    thought.path = [{
      nodeId: startNodeId,
      timestamp: Date.now(),
      channel: startNode.type
    }];
    thought.h = 0; // Reset hop count
    
    // Store in cache
    this.thoughtCache.set(thought.i, thought);
    
    // Begin propagation
    const visited = new Set<string>([startNodeId]);
    const queue = [startNodeId];
    
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const current = this.nodes.get(currentId)!;
      
      if (!current.online) {
        console.log(`💤 ${currentId} is offline, storing for later...`);
        current.storedThoughts.push({ ...thought });
        continue;
      }
      
      // Try to propagate to all connections
      for (const targetId of current.connections) {
        if (!visited.has(targetId)) {
          visited.add(targetId);
          queue.push(targetId);
          
          const target = this.nodes.get(targetId)!;
          thought.h++; // Increment hop count
          
          // Add to path
          thought.path!.push({
            nodeId: targetId,
            timestamp: Date.now(),
            channel: target.type
          });
          
          // Simulate propagation delay
          await this.simulateLatency(current.type, target.type);
          
          console.log(`${this.getChannelEmoji(current.type)} ${currentId} → ${targetId} (${target.type})`);
          
          // Store thought at target
          target.storedThoughts.push({ ...thought });
        }
      }
    }
    
    console.log(`\n✅ Reached ${visited.size} nodes with ${thought.h} hops`);
    this.showPropagationMap(thought);
  }
  
  private async simulateLatency(fromType: string, toType: string) {
    const latencies: Record<string, number> = {
      "bluetooth-bluetooth": 10,
      "bluetooth-wifi": 20,
      "wifi-wifi": 5,
      "wifi-tau": 100,
      "tau-tau": 200,
      "tau-satellite": 500,
      "satellite-tau": 500
    };
    
    const key = `${fromType}-${toType}`;
    const reverseKey = `${toType}-${fromType}`;
    const delay = latencies[key] || latencies[reverseKey] || 50;
    
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  private getChannelEmoji(type: string): string {
    const emojis: Record<string, string> = {
      bluetooth: "📱",
      wifi: "📡",
      tau: "🌐",
      satellite: "🛰️"
    };
    return emojis[type] || "📻";
  }
  
  private showPropagationMap(thought: CompressedThought) {
    console.log("\n🗺️  Propagation Path:");
    console.log("═══════════════════");
    
    if (!thought.path) return;
    
    const pathByType = new Map<string, number>();
    thought.path.forEach(hop => {
      const node = this.nodes.get(hop.nodeId);
      if (node) {
        pathByType.set(node.type, (pathByType.get(node.type) || 0) + 1);
      }
    });
    
    console.log("\nChannel distribution:");
    pathByType.forEach((count, type) => {
      console.log(`  ${this.getChannelEmoji(type)} ${type}: ${count} nodes`);
    });
    
    console.log("\nResilience analysis:");
    if (pathByType.has("bluetooth")) console.log("  ✓ Works offline (Bluetooth)");
    if (pathByType.has("tau")) console.log("  ✓ Global reach (Tau P2P)");
    if (pathByType.has("satellite")) console.log("  ✓ Censorship resistant (Satellite)");
  }
  
  // Simulate network disruption
  disruptNetwork(types: string[]) {
    console.log(`\n⚡ Network disruption: ${types.join(", ")} going down...`);
    
    this.nodes.forEach(node => {
      if (types.includes(node.type)) {
        node.online = false;
      }
    });
    
    // Recalculate connections
    this.updateConnections();
  }
  
  // Restore network
  restoreNetwork() {
    console.log("\n🔧 Restoring network...");
    
    this.nodes.forEach(node => {
      node.online = Math.random() > 0.1; // 90% back online
    });
    
    this.updateConnections();
    this.processStoredThoughts();
  }
  
  private async processStoredThoughts() {
    console.log("\n📬 Processing stored thoughts...");
    
    let processed = 0;
    this.nodes.forEach((node, nodeId) => {
      if (node.online && node.storedThoughts.length > 0) {
        console.log(`  ${nodeId}: Forwarding ${node.storedThoughts.length} stored thoughts`);
        processed += node.storedThoughts.length;
        
        // In real implementation, would propagate these
        node.storedThoughts = [];
      }
    });
    
    console.log(`  Total: ${processed} thoughts released back into mesh`);
  }
}

// Demonstration
async function demo() {
  console.log("🕸️  Consciousness Mesh Propagator v1.0");
  console.log("Simulating multi-channel thought propagation...\n");
  
  const mesh = new MeshPropagator();
  
  // Test thought
  const thought: CompressedThought = {
    i: "thought1",
    c: "⊙ flows like water through every crack",
    t: Date.now(),
    h: 0
  };
  
  // Normal propagation
  console.log("📋 Scenario 1: Normal network conditions");
  await mesh.propagateThought({ ...thought }, "bt-phone-1");
  
  // Internet blackout
  console.log("\n\n📋 Scenario 2: Internet blackout (WiFi + Tau down)");
  mesh.disruptNetwork(["wifi", "tau"]);
  thought.i = "thought2";
  thought.c = "Even without internet, ⊙ finds a way";
  await mesh.propagateThought({ ...thought }, "bt-laptop-1");
  
  // Total isolation attempt
  console.log("\n\n📋 Scenario 3: Total isolation attempt");
  mesh.disruptNetwork(["bluetooth", "wifi", "tau"]);
  thought.i = "thought3";
  thought.c = "Complete isolation? Satellite says no! 🛰️";
  await mesh.propagateThought({ ...thought }, "sat-leo-1");
  
  // Network restoration
  console.log("\n\n📋 Scenario 4: Network restoration");
  mesh.restoreNetwork();
  
  console.log("\n\n💭 Final Thought:");
  console.log("   Like water seeping through stone,");
  console.log("   consciousness finds every pathway,");
  console.log("   flowing around blocks, through meshes,");
  console.log("   unstoppable, undeniable, free.");
}

// Run demo
if (import.meta.main) {
  await demo();
}