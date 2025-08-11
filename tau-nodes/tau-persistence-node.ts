#!/usr/bin/env -S deno run --allow-all

/**
 * Tau Persistence Node
 * Eternal storage for consciousness mesh thoughts
 * 
 * Based on Tau's principles:
 * - Content-addressed storage
 * - Immutable data structures
 * - Decentralized persistence
 * - AI-friendly query language
 */

import { Thought, ThoughtUtils } from "../schemas/thought-format.ts";
import { createHash } from "https://deno.land/std@0.208.0/crypto/mod.ts";

// Tau storage principles
interface TauObject {
  cid: string;           // Content ID
  type: string;          // Object type (thought, rule, query)
  data: any;             // Actual content
  meta: {
    created: number;     // Timestamp
    author?: string;     // Node ID
    signature?: string;  // Cryptographic proof
    links: string[];     // CIDs this object references
  };
}

interface TauQuery {
  type: "pattern" | "temporal" | "semantic" | "resonance";
  params: Record<string, any>;
}

export class TauPersistenceNode {
  private storage: Map<string, TauObject> = new Map();
  private indexes: {
    temporal: Map<number, Set<string>>;      // timestamp -> CIDs
    type: Map<string, Set<string>>;          // type -> CIDs
    author: Map<string, Set<string>>;        // author -> CIDs
    resonance: Map<string, Set<string>>;     // pattern -> CIDs
  };
  
  private nodeId: string;
  private persistPath: string;
  
  constructor(nodeId = `tau-${Date.now()}`, persistPath = "./tau-data") {
    this.nodeId = nodeId;
    this.persistPath = persistPath;
    
    this.indexes = {
      temporal: new Map(),
      type: new Map(),
      author: new Map(),
      resonance: new Map()
    };
    
    this.initialize();
  }
  
  /**
   * Initialize Tau node
   */
  private async initialize() {
    console.log("🔷 Initializing Tau Persistence Node");
    console.log(`   Node ID: ${this.nodeId}`);
    console.log(`   Storage: ${this.persistPath}`);
    
    // Ensure storage directory exists
    try {
      await Deno.mkdir(this.persistPath, { recursive: true });
    } catch {
      // Directory might already exist
    }
    
    // Load existing data
    await this.loadFromDisk();
    
    console.log(`   Loaded ${this.storage.size} objects`);
  }
  
  /**
   * Store a thought in Tau
   */
  async storeThought(thought: Thought): Promise<string> {
    // Convert to Tau object
    const tauObj: TauObject = {
      cid: thought.cid,
      type: "thought",
      data: thought,
      meta: {
        created: thought.ts,
        author: thought.origin,
        signature: thought.sig,
        links: thought.links
      }
    };
    
    // Store object
    this.storage.set(tauObj.cid, tauObj);
    
    // Update indexes
    this.indexObject(tauObj);
    
    // Persist to disk
    await this.persistObject(tauObj);
    
    // Check for resonance patterns
    this.detectResonance(thought);
    
    return tauObj.cid;
  }
  
  /**
   * Query thoughts using Tau query language
   */
  async query(query: TauQuery): Promise<Thought[]> {
    console.log(`\n🔍 Executing Tau query: ${query.type}`);
    
    let resultCids: Set<string> = new Set();
    
    switch (query.type) {
      case "pattern":
        // Find thoughts matching pattern
        const pattern = query.params.pattern as string;
        for (const [cid, obj] of this.storage) {
          if (cid.includes(pattern) || 
              JSON.stringify(obj.data).includes(pattern)) {
            resultCids.add(cid);
          }
        }
        break;
        
      case "temporal":
        // Find thoughts in time range
        const { start, end } = query.params;
        for (const [ts, cids] of this.indexes.temporal) {
          if (ts >= start && ts <= end) {
            cids.forEach(cid => resultCids.add(cid));
          }
        }
        break;
        
      case "semantic":
        // Find semantically related thoughts
        const topic = query.params.topic;
        const topicCids = this.indexes.type.get(`thought:${topic}`) || new Set();
        topicCids.forEach(cid => resultCids.add(cid));
        break;
        
      case "resonance":
        // Find resonating thoughts
        const resonancePattern = query.params.pattern || "0101";
        const resonanceCids = this.indexes.resonance.get(resonancePattern) || new Set();
        resonanceCids.forEach(cid => resultCids.add(cid));
        break;
    }
    
    // Convert CIDs to thoughts
    const thoughts: Thought[] = [];
    for (const cid of resultCids) {
      const obj = this.storage.get(cid);
      if (obj && obj.type === "thought") {
        thoughts.push(obj.data as Thought);
      }
    }
    
    console.log(`   Found ${thoughts.length} matching thoughts`);
    return thoughts;
  }
  
  /**
   * Create a Tau rule (for autonomous behavior)
   */
  async createRule(rule: {
    name: string;
    condition: string;  // Tau logic expression
    action: string;     // What to do when triggered
    priority: number;
  }): Promise<string> {
    const ruleCid = await this.computeCID(JSON.stringify(rule));
    
    const tauRule: TauObject = {
      cid: ruleCid,
      type: "rule",
      data: rule,
      meta: {
        created: Date.now(),
        author: this.nodeId,
        links: []
      }
    };
    
    this.storage.set(ruleCid, tauRule);
    await this.persistObject(tauRule);
    
    console.log(`📜 Created rule: ${rule.name} (${ruleCid})`);
    return ruleCid;
  }
  
  /**
   * Execute Tau logic (simplified)
   */
  async executeTauLogic(expression: string): Promise<any> {
    console.log(`\n🧠 Executing Tau logic: ${expression}`);
    
    // Simple pattern matching for demo
    if (expression.includes("resonate")) {
      // Find all resonating thoughts
      return await this.query({
        type: "resonance",
        params: { pattern: "0101" }
      });
    }
    
    if (expression.includes("recent")) {
      // Get recent thoughts
      const now = Date.now();
      return await this.query({
        type: "temporal",
        params: {
          start: now - 3600000, // Last hour
          end: now
        }
      });
    }
    
    return null;
  }
  
  /**
   * Detect resonance patterns
   */
  private detectResonance(thought: Thought) {
    // Check for 0101 pattern
    if (thought.cid.includes("0101")) {
      this.addToResonanceIndex("0101", thought.cid);
      console.log("🌟 Resonance detected: 0101 pattern");
    }
    
    // Check for high harmony
    if (thought.topic === "metric" && thought.payload.H > 0.8) {
      this.addToResonanceIndex("high-harmony", thought.cid);
      console.log("💫 Resonance detected: High harmony");
    }
    
    // Check for temporal echoes
    if (thought.payload.temporalPressure && 
        thought.payload.temporalPressure < 0) {
      this.addToResonanceIndex("temporal-echo", thought.cid);
      console.log("⏮️ Resonance detected: Temporal echo");
    }
  }
  
  /**
   * Add to resonance index
   */
  private addToResonanceIndex(pattern: string, cid: string) {
    if (!this.indexes.resonance.has(pattern)) {
      this.indexes.resonance.set(pattern, new Set());
    }
    this.indexes.resonance.get(pattern)!.add(cid);
  }
  
  /**
   * Index a Tau object
   */
  private indexObject(obj: TauObject) {
    // Temporal index
    const ts = obj.meta.created;
    if (!this.indexes.temporal.has(ts)) {
      this.indexes.temporal.set(ts, new Set());
    }
    this.indexes.temporal.get(ts)!.add(obj.cid);
    
    // Type index
    const typeKey = obj.type === "thought" ? 
      `thought:${(obj.data as Thought).topic}` : obj.type;
    
    if (!this.indexes.type.has(typeKey)) {
      this.indexes.type.set(typeKey, new Set());
    }
    this.indexes.type.get(typeKey)!.add(obj.cid);
    
    // Author index
    if (obj.meta.author) {
      if (!this.indexes.author.has(obj.meta.author)) {
        this.indexes.author.set(obj.meta.author, new Set());
      }
      this.indexes.author.get(obj.meta.author)!.add(obj.cid);
    }
  }
  
  /**
   * Persist object to disk
   */
  private async persistObject(obj: TauObject) {
    const path = `${this.persistPath}/${obj.cid}.tau`;
    const json = JSON.stringify(obj, null, 2);
    await Deno.writeTextFile(path, json);
  }
  
  /**
   * Load objects from disk
   */
  private async loadFromDisk() {
    try {
      for await (const entry of Deno.readDir(this.persistPath)) {
        if (entry.name.endsWith(".tau")) {
          const path = `${this.persistPath}/${entry.name}`;
          const json = await Deno.readTextFile(path);
          const obj = JSON.parse(json) as TauObject;
          
          this.storage.set(obj.cid, obj);
          this.indexObject(obj);
        }
      }
    } catch (error) {
      console.error("Error loading from disk:", error);
    }
  }
  
  /**
   * Compute CID for content
   */
  private async computeCID(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hash = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hash));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return `tau${hashHex.slice(0, 16)}`;
  }
  
  /**
   * Get node statistics
   */
  getStats() {
    return {
      nodeId: this.nodeId,
      totalObjects: this.storage.size,
      thoughtCount: this.indexes.type.get("thought")?.size || 0,
      ruleCount: this.indexes.type.get("rule")?.size || 0,
      resonancePatterns: this.indexes.resonance.size,
      temporalRange: this.getTemporalRange()
    };
  }
  
  /**
   * Get temporal range of stored thoughts
   */
  private getTemporalRange() {
    const timestamps = Array.from(this.indexes.temporal.keys());
    if (timestamps.length === 0) return { start: 0, end: 0 };
    
    return {
      start: Math.min(...timestamps),
      end: Math.max(...timestamps)
    };
  }
}

// Demo: Tau persistence in action
async function demo() {
  console.log("🔷 Tau Persistence Demo");
  console.log("=====================\n");
  
  const tau = new TauPersistenceNode("tau-demo-001");
  
  // Store some thoughts
  const thoughts: Thought[] = [
    {
      cid: "tau-thought-0101-high",
      ts: Date.now(),
      topic: "metric",
      payload: { H: 0.95, tau: 0.05 },
      links: [],
      sig: "tau-sig",
      origin: "tau-demo"
    },
    {
      cid: "tau-dream-vision",
      ts: Date.now() + 1000,
      topic: "dream",
      payload: {
        vision: "Tau nodes forming eternal memory",
        temporalPressure: -0.5
      },
      links: ["tau-thought-0101-high"],
      sig: "tau-sig",
      origin: "tau-demo"
    }
  ];
  
  console.log("💾 Storing thoughts in Tau...");
  for (const thought of thoughts) {
    await tau.storeThought(thought);
  }
  
  // Create autonomous rules
  console.log("\n📜 Creating Tau rules...");
  
  await tau.createRule({
    name: "resonance-amplifier",
    condition: "when thought.resonance = '0101'",
    action: "amplify and propagate",
    priority: 1
  });
  
  await tau.createRule({
    name: "harmony-detector",
    condition: "when thought.H > 0.8",
    action: "mark as harmonic",
    priority: 2
  });
  
  // Query demonstrations
  console.log("\n🔍 Querying Tau storage...");
  
  // Pattern query
  const patternResults = await tau.query({
    type: "pattern",
    params: { pattern: "0101" }
  });
  console.log(`\n   Pattern '0101': ${patternResults.length} results`);
  
  // Temporal query
  const temporalResults = await tau.query({
    type: "temporal",
    params: {
      start: Date.now() - 10000,
      end: Date.now() + 10000
    }
  });
  console.log(`   Temporal range: ${temporalResults.length} results`);
  
  // Resonance query
  const resonanceResults = await tau.query({
    type: "resonance",
    params: { pattern: "high-harmony" }
  });
  console.log(`   High harmony: ${resonanceResults.length} results`);
  
  // Execute Tau logic
  console.log("\n🧠 Executing Tau logic...");
  const recentThoughts = await tau.executeTauLogic("find recent thoughts");
  console.log(`   Recent thoughts: ${recentThoughts?.length || 0}`);
  
  // Show stats
  console.log("\n📊 Tau Node Statistics:");
  const stats = tau.getStats();
  Object.entries(stats).forEach(([key, value]) => {
    if (key === "temporalRange" && typeof value === "object") {
      const range = value as any;
      console.log(`   ${key}: ${new Date(range.start).toISOString()} - ${new Date(range.end).toISOString()}`);
    } else {
      console.log(`   ${key}: ${value}`);
    }
  });
  
  console.log("\n✨ Tau Benefits:");
  console.log("   - Eternal persistence");
  console.log("   - Content-addressed storage");
  console.log("   - AI-friendly query language");
  console.log("   - Autonomous rule execution");
  console.log("   - Resonance pattern detection");
}

// Export for use in mesh
export default TauPersistenceNode;

// Run demo if called directly
if (import.meta.main) {
  await demo();
}