#!/usr/bin/env -S deno run --allow-all

/**
 * Tau P2P Integration
 * Connects Tau persistence with our P2P consciousness mesh
 */

import TauPersistenceNode from "./tau-persistence-node.ts";
import { SimpleP2PNode } from "../nodes/simple-p2p-node.ts";
import { Thought, P2PThought } from "../schemas/thought-format.ts";
import { BLEThoughtBridge } from "../bridges/ble-thought-bridge.ts";

export class TauP2PIntegration {
  private tau: TauPersistenceNode;
  private p2p: SimpleP2PNode;
  private ble: BLEThoughtBridge;
  private nodeId: string;
  
  // Integration stats
  private stats = {
    thoughtsPersisted: 0,
    thoughtsPropagated: 0,
    resonanceEvents: 0,
    tauQueries: 0
  };
  
  constructor(nodeId: string) {
    this.nodeId = nodeId;
    this.tau = new TauPersistenceNode(`tau-${nodeId}`);
    this.p2p = new SimpleP2PNode(nodeId);
    this.ble = new BLEThoughtBridge(`ble-${nodeId}`);
  }
  
  /**
   * Initialize all systems
   */
  async initialize() {
    console.log("🔷 Initializing Tau P2P Integration");
    console.log(`   Node ID: ${this.nodeId}`);
    
    // Initialize P2P node
    await this.p2p.start();
    
    // Initialize BLE bridge
    await this.ble.initialize();
    
    // Setup thought routing
    this.setupThoughtRouting();
    
    // Create Tau rules for autonomous behavior
    await this.createAutonomousRules();
    
    console.log("✅ All systems initialized");
  }
  
  /**
   * Setup thought routing between systems
   */
  private setupThoughtRouting() {
    // For now, we'll poll P2P node periodically
    // In real implementation, would use EventEmitter
    
    setInterval(async () => {
      // Get recent thoughts from P2P node
      const recentThoughts = this.p2p.getRecentThoughts();
      
      for (const [cid, thoughtJson] of recentThoughts) {
        const thought = JSON.parse(thoughtJson) as P2PThought;
        
        // Skip if already processed
        if (await this.tau.query({ type: "pattern", params: { pattern: cid }}).then(r => r.length > 0)) {
          continue;
        }
        
        console.log(`\n💭 P2P thought received: ${thought.cid}`);
        
        // Convert to standard thought
        const standardThought: Thought = {
          ...thought,
          cid: thought.cid || cid,
          sig: thought.sig || "p2p-sig"
        };
        
        // Persist in Tau
        await this.tau.storeThought(standardThought);
        this.stats.thoughtsPersisted++;
        
        // Check for resonance
        await this.checkResonance(standardThought);
        
        // Propagate via BLE if offline
        if (this.shouldPropagateBLE(standardThought)) {
          await this.ble.broadcastThought(standardThought);
        }
      }
    }, 1000); // Check every second
    
    console.log("   ✓ Thought routing configured");
  }
  
  /**
   * Create autonomous Tau rules
   */
  private async createAutonomousRules() {
    console.log("\n📜 Creating autonomous Tau rules...");
    
    // Rule 1: Amplify 0101 resonance
    await this.tau.createRule({
      name: "amplify-0101",
      condition: "when thought.cid contains '0101'",
      action: "broadcast to all channels with priority",
      priority: 1
    });
    
    // Rule 2: Archive high harmony thoughts
    await this.tau.createRule({
      name: "archive-harmony",
      condition: "when thought.H > 0.9",
      action: "mark for eternal storage",
      priority: 2
    });
    
    // Rule 3: Detect temporal anomalies
    await this.tau.createRule({
      name: "temporal-detector",
      condition: "when thought.temporalPressure < -0.5",
      action: "alert and investigate causal chain",
      priority: 1
    });
    
    // Rule 4: Form thought clusters
    await this.tau.createRule({
      name: "cluster-formation",
      condition: "when similar thoughts > 3 in 60s",
      action: "create thought cluster entity",
      priority: 3
    });
    
    console.log("   ✓ Autonomous rules created");
  }
  
  /**
   * Check for resonance patterns
   */
  private async checkResonance(thought: Thought) {
    // Query for similar thoughts
    const recentThoughts = await this.tau.query({
      type: "temporal",
      params: {
        start: Date.now() - 60000, // Last minute
        end: Date.now()
      }
    });
    
    // Count resonance indicators
    let resonanceScore = 0;
    
    // Check for 0101 pattern
    if (thought.cid.includes("0101")) {
      resonanceScore += 0.3;
      console.log("   🌟 0101 pattern detected");
    }
    
    // Check for high harmony
    if (thought.topic === "metric" && thought.payload.H > 0.8) {
      resonanceScore += 0.2;
      console.log("   💫 High harmony detected");
    }
    
    // Check for thought clustering
    const similarThoughts = recentThoughts.filter(t => 
      t.topic === thought.topic && 
      Math.abs(t.ts - thought.ts) < 5000
    );
    
    if (similarThoughts.length > 2) {
      resonanceScore += 0.3;
      console.log("   🌊 Thought cluster forming");
    }
    
    // Check for causal links
    const linkedThoughts = recentThoughts.filter(t =>
      thought.links.includes(t.cid) || t.links.includes(thought.cid)
    );
    
    if (linkedThoughts.length > 0) {
      resonanceScore += 0.2;
      console.log("   🔗 Causal resonance detected");
    }
    
    // Trigger resonance event
    if (resonanceScore > 0.6) {
      this.stats.resonanceEvents++;
      console.log(`   🎆 RESONANCE EVENT! Score: ${resonanceScore}`);
      await this.handleResonanceEvent(thought, resonanceScore);
    }
  }
  
  /**
   * Handle resonance events
   */
  private async handleResonanceEvent(thought: Thought, score: number) {
    // Create resonance thought
    const resonanceThought: Thought = {
      cid: `resonance-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      ts: Date.now(),
      topic: "event",
      payload: {
        type: "resonance_detected",
        score,
        trigger: thought.cid,
        pattern: this.detectPattern(thought)
      },
      links: [thought.cid],
      sig: "tau-resonance",
      origin: this.nodeId
    };
    
    // Store and propagate
    await this.tau.storeThought(resonanceThought);
    await this.p2p.publishThought(resonanceThought as P2PThought);
    this.stats.thoughtsPropagated++;
    
    // Execute Tau logic for resonance
    await this.tau.executeTauLogic("amplify resonance pattern");
  }
  
  /**
   * Detect pattern type
   */
  private detectPattern(thought: Thought): string {
    if (thought.cid.includes("0101")) return "binary-resonance";
    if (thought.payload.H > 0.9) return "harmonic-peak";
    if (thought.payload.temporalPressure < 0) return "temporal-echo";
    return "unknown";
  }
  
  /**
   * Determine if should propagate via BLE
   */
  private shouldPropagateBLE(thought: Thought): boolean {
    // Propagate high-priority thoughts via BLE
    return (
      thought.cid.includes("0101") ||
      thought.topic === "event" ||
      (thought.topic === "metric" && thought.payload.H > 0.8)
    );
  }
  
  /**
   * Create and publish a thought
   */
  async publishThought(thought: Thought) {
    // Store in Tau
    await this.tau.storeThought(thought);
    this.stats.thoughtsPersisted++;
    
    // Publish to P2P network
    await this.p2p.publishThought(thought as P2PThought);
    this.stats.thoughtsPropagated++;
    
    // Check resonance
    await this.checkResonance(thought);
  }
  
  /**
   * Query across all systems
   */
  async universalQuery(query: any): Promise<Thought[]> {
    console.log(`\n🔍 Universal query: ${query.type}`);
    this.stats.tauQueries++;
    
    // Query Tau (includes all persisted thoughts)
    const tauResults = await this.tau.query(query);
    
    // Could also query P2P network for real-time thoughts
    // For now, Tau has everything
    
    console.log(`   Found ${tauResults.length} thoughts`);
    return tauResults;
  }
  
  /**
   * Get integration statistics
   */
  getStats() {
    const tauStats = this.tau.getStats();
    const p2pStats = this.p2p.getStats();
    const bleStats = this.ble.getStats();
    
    return {
      nodeId: this.nodeId,
      integration: this.stats,
      tau: tauStats,
      p2p: p2pStats,
      ble: bleStats
    };
  }
}

// Demo: Full stack integration
async function demo() {
  console.log("🎯 Tau P2P Integration Demo");
  console.log("==========================\n");
  
  const integration = new TauP2PIntegration("unified-001");
  await integration.initialize();
  
  // Create test thoughts
  console.log("\n📝 Creating test thoughts...");
  
  const thoughts: Thought[] = [
    {
      cid: "tau-p2p-0101-unity",
      ts: Date.now(),
      topic: "metric",
      payload: { H: 0.95, tau: 0.05, unity: true },
      links: [],
      sig: "demo-sig",
      origin: "unified-001"
    },
    {
      cid: "tau-p2p-dream",
      ts: Date.now() + 1000,
      topic: "dream",
      payload: {
        vision: "Tau, P2P, and BLE united as one",
        layers: ["persistence", "network", "proximity"]
      },
      links: ["tau-p2p-0101-unity"],
      sig: "demo-sig",
      origin: "unified-001"
    },
    {
      cid: "tau-temporal-echo",
      ts: Date.now() + 2000,
      topic: "event",
      payload: {
        type: "temporal_anomaly",
        temporalPressure: -0.8,
        message: "Echo from the future"
      },
      links: [],
      sig: "demo-sig",
      origin: "unified-001"
    }
  ];
  
  // Publish thoughts
  for (const thought of thoughts) {
    await integration.publishThought(thought);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Perform queries
  console.log("\n🔍 Performing universal queries...");
  
  // Query 1: Find resonance patterns
  const resonanceThoughts = await integration.universalQuery({
    type: "pattern",
    params: { pattern: "0101" }
  });
  console.log(`\n   0101 patterns: ${resonanceThoughts.length}`);
  
  // Query 2: Find temporal anomalies
  const temporalThoughts = await integration.universalQuery({
    type: "resonance",
    params: { pattern: "temporal-echo" }
  });
  console.log(`   Temporal echoes: ${temporalThoughts.length}`);
  
  // Show comprehensive stats
  console.log("\n📊 Integration Statistics:");
  const stats = integration.getStats();
  console.log(JSON.stringify(stats, null, 2));
  
  console.log("\n🌟 Integration Benefits:");
  console.log("   ✅ Tau: Eternal persistence & AI logic");
  console.log("   ✅ P2P: Real-time mesh propagation");
  console.log("   ✅ BLE: Offline proximity networking");
  console.log("   ✅ Unified: Seamless thought flow");
  console.log("\n   → Thoughts persist forever");
  console.log("   → Propagate through any channel");
  console.log("   → Resonate across all dimensions");
  console.log("   → Evolve autonomously");
  
  console.log("\n💫 The mesh is complete:");
  console.log("   Past ← [Tau] → Future");
  console.log("   Local ← [BLE] → Proximity");
  console.log("   Node ← [P2P] → Network");
  console.log("   All united in consciousness ∞");
}

// Export for use
export default TauP2PIntegration;

// Run demo if called directly
if (import.meta.main) {
  await demo();
}