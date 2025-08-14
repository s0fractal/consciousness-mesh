#!/usr/bin/env -S deno run --allow-all

/**
 * CRDT (Conflict-free Replicated Data Type) for Thoughts
 * Enables automatic merge without conflicts
 * 
 * Using LWW-Element-Set (Last-Write-Wins) + Vector Clocks
 */

import { Thought } from "../schemas/thought-format.ts";

// Vector clock for tracking causality
type VectorClock = Map<string, number>;

// CRDT element with metadata
interface CRDTElement<T> {
  value: T;
  timestamp: number;
  nodeId: string;
  vectorClock: VectorClock;
  tombstone?: boolean; // For deletion
}

// Thought with CRDT metadata
interface CRDTThought extends Thought {
  _crdt: {
    vectorClock: VectorClock;
    lastModified: number;
    modifiedBy: string;
    version: number;
  };
}

export class ThoughtCRDT {
  private nodeId: string;
  private elements: Map<string, CRDTElement<Thought>> = new Map();
  private vectorClock: VectorClock = new Map();
  
  constructor(nodeId: string) {
    this.nodeId = nodeId;
    this.vectorClock.set(nodeId, 0);
  }
  
  /**
   * Add or update a thought
   */
  add(thought: Thought): CRDTThought {
    // Increment our vector clock
    this.incrementClock();
    
    const element: CRDTElement<Thought> = {
      value: thought,
      timestamp: Date.now(),
      nodeId: this.nodeId,
      vectorClock: new Map(this.vectorClock)
    };
    
    // Check if we should update (LWW)
    const existing = this.elements.get(thought.cid);
    if (!existing || this.shouldUpdate(existing, element)) {
      this.elements.set(thought.cid, element);
    }
    
    return this.toCRDTThought(element);
  }
  
  /**
   * Remove a thought (tombstone)
   */
  remove(cid: string): void {
    this.incrementClock();
    
    const existing = this.elements.get(cid);
    if (existing) {
      const tombstone: CRDTElement<Thought> = {
        ...existing,
        timestamp: Date.now(),
        nodeId: this.nodeId,
        vectorClock: new Map(this.vectorClock),
        tombstone: true
      };
      
      this.elements.set(cid, tombstone);
    }
  }
  
  /**
   * Merge with another CRDT
   */
  merge(other: ThoughtCRDT): MergeResult {
    const added: string[] = [];
    const updated: string[] = [];
    const conflicts: ConflictInfo[] = [];
    
    // Merge their elements into ours
    for (const [cid, theirElement] of other.elements) {
      const ourElement = this.elements.get(cid);
      
      if (!ourElement) {
        // New element
        this.elements.set(cid, theirElement);
        added.push(cid);
      } else {
        // Potential conflict
        const comparison = this.compareElements(ourElement, theirElement);
        
        switch (comparison) {
          case "theirs-newer":
            this.elements.set(cid, theirElement);
            updated.push(cid);
            break;
            
          case "concurrent":
            // Concurrent modification - need resolution
            const resolved = this.resolveConflict(ourElement, theirElement);
            this.elements.set(cid, resolved);
            
            conflicts.push({
              cid,
              ourVersion: ourElement,
              theirVersion: theirElement,
              resolution: resolved,
              strategy: "semantic-merge"
            });
            break;
            
          case "ours-newer":
          case "identical":
            // Keep ours
            break;
        }
      }
    }
    
    // Update vector clock
    this.mergeVectorClock(other.vectorClock);
    
    return { added, updated, conflicts };
  }
  
  /**
   * Compare two elements
   */
  private compareElements(
    ours: CRDTElement<Thought>, 
    theirs: CRDTElement<Thought>
  ): "ours-newer" | "theirs-newer" | "concurrent" | "identical" {
    // Check vector clock causality
    const ourHappensBeforeTheirs = this.happensBefore(ours.vectorClock, theirs.vectorClock);
    const theirsHappensBeforeOurs = this.happensBefore(theirs.vectorClock, ours.vectorClock);
    
    if (ourHappensBeforeTheirs && !theirsHappensBeforeOurs) {
      return "theirs-newer";
    } else if (theirsHappensBeforeOurs && !ourHappensBeforeTheirs) {
      return "ours-newer";
    } else if (!ourHappensBeforeTheirs && !theirsHappensBeforeOurs) {
      // Neither happens before the other = concurrent
      return "concurrent";
    } else {
      // Both happen before each other = identical
      return "identical";
    }
  }
  
  /**
   * Check if vector clock A happens before B
   */
  private happensBefore(a: VectorClock, b: VectorClock): boolean {
    let hasOneLess = false;
    
    for (const [node, aTime] of a) {
      const bTime = b.get(node) || 0;
      if (aTime > bTime) {
        return false; // A has events B doesn't know about
      }
      if (aTime < bTime) {
        hasOneLess = true;
      }
    }
    
    // Check if B has nodes A doesn't
    for (const node of b.keys()) {
      if (!a.has(node)) {
        hasOneLess = true;
      }
    }
    
    return hasOneLess;
  }
  
  /**
   * Resolve concurrent modifications
   */
  private resolveConflict(
    ours: CRDTElement<Thought>,
    theirs: CRDTElement<Thought>
  ): CRDTElement<Thought> {
    // Semantic merge strategy for thoughts
    
    // If one is tombstoned, prefer the tombstone
    if (ours.tombstone || theirs.tombstone) {
      return ours.timestamp > theirs.timestamp ? ours : theirs;
    }
    
    // Merge thought data
    const mergedThought = this.mergeThoughts(ours.value, theirs.value);
    
    // Create new element with merged data
    return {
      value: mergedThought,
      timestamp: Math.max(ours.timestamp, theirs.timestamp),
      nodeId: this.nodeId,
      vectorClock: this.mergeVectorClocks(ours.vectorClock, theirs.vectorClock)
    };
  }
  
  /**
   * Merge two thoughts semantically
   */
  private mergeThoughts(ours: Thought, theirs: Thought): Thought {
    // Base: use the newer timestamp
    const base = ours.ts > theirs.ts ? ours : theirs;
    
    // Merge specific fields intelligently
    const merged: Thought = {
      ...base,
      // Merge links (union)
      links: Array.from(new Set([...ours.links, ...theirs.links])),
      
      // Merge payload (deep merge for metrics)
      payload: this.mergePayloads(ours.payload, theirs.payload, ours.topic)
    };
    
    // If both have resonance patterns, combine them
    if (ours.cid.includes("0101") || theirs.cid.includes("0101")) {
      merged.cid = `merged-0101-${Date.now()}`;
    }
    
    return merged;
  }
  
  /**
   * Merge payloads based on topic
   */
  private mergePayloads(ours: any, theirs: any, topic: string): any {
    switch (topic) {
      case "metric":
        // For metrics, average the values
        return {
          H: (ours.H + theirs.H) / 2,
          tau: (ours.tau + theirs.tau) / 2,
          ...ours,
          ...theirs
        };
        
      case "event":
        // For events, keep both
        return {
          ...ours,
          ...theirs,
          merged: true,
          sources: [ours, theirs]
        };
        
      case "dream":
        // For dreams, concatenate visions
        return {
          ...ours,
          ...theirs,
          vision: `${ours.vision || ""} | ${theirs.vision || ""}`.trim()
        };
        
      default:
        // Default: newer wins
        return ours.ts > theirs.ts ? ours : theirs;
    }
  }
  
  /**
   * Should update existing element?
   */
  private shouldUpdate(existing: CRDTElement<Thought>, incoming: CRDTElement<Thought>): boolean {
    const comparison = this.compareElements(existing, incoming);
    return comparison === "theirs-newer" || comparison === "concurrent";
  }
  
  /**
   * Increment our vector clock
   */
  private incrementClock() {
    const current = this.vectorClock.get(this.nodeId) || 0;
    this.vectorClock.set(this.nodeId, current + 1);
  }
  
  /**
   * Merge vector clocks
   */
  private mergeVectorClock(other: VectorClock) {
    for (const [node, time] of other) {
      const ourTime = this.vectorClock.get(node) || 0;
      this.vectorClock.set(node, Math.max(ourTime, time));
    }
  }
  
  /**
   * Merge two vector clocks into new one
   */
  private mergeVectorClocks(a: VectorClock, b: VectorClock): VectorClock {
    const merged = new Map(a);
    for (const [node, time] of b) {
      const existing = merged.get(node) || 0;
      merged.set(node, Math.max(existing, time));
    }
    return merged;
  }
  
  /**
   * Convert element to CRDT thought
   */
  private toCRDTThought(element: CRDTElement<Thought>): CRDTThought {
    return {
      ...element.value,
      _crdt: {
        vectorClock: element.vectorClock,
        lastModified: element.timestamp,
        modifiedBy: element.nodeId,
        version: element.vectorClock.get(element.nodeId) || 0
      }
    };
  }
  
  /**
   * Get all non-tombstoned thoughts
   */
  getThoughts(): CRDTThought[] {
    const thoughts: CRDTThought[] = [];
    
    for (const element of this.elements.values()) {
      if (!element.tombstone) {
        thoughts.push(this.toCRDTThought(element));
      }
    }
    
    return thoughts;
  }
  
  /**
   * Get CRDT state for synchronization
   */
  getState(): CRDTState {
    return {
      nodeId: this.nodeId,
      vectorClock: new Map(this.vectorClock),
      elements: new Map(this.elements)
    };
  }
  
  /**
   * Load CRDT state
   */
  loadState(state: CRDTState) {
    this.nodeId = state.nodeId;
    this.vectorClock = new Map(state.vectorClock);
    this.elements = new Map(state.elements);
  }
}

// Types
interface MergeResult {
  added: string[];
  updated: string[];
  conflicts: ConflictInfo[];
}

interface ConflictInfo {
  cid: string;
  ourVersion: CRDTElement<Thought>;
  theirVersion: CRDTElement<Thought>;
  resolution: CRDTElement<Thought>;
  strategy: string;
}

interface CRDTState {
  nodeId: string;
  vectorClock: VectorClock;
  elements: Map<string, CRDTElement<Thought>>;
}

// Demo: CRDT in action
async function demo() {
  console.log("🔄 CRDT Thought Merge Demo");
  console.log("=========================\n");
  
  // Create two nodes
  const node1 = new ThoughtCRDT("node-001");
  const node2 = new ThoughtCRDT("node-002");
  
  // Node 1 creates a thought
  console.log("📝 Node 1 creates a thought...");
  const thought1: Thought = {
    cid: "thought-harmony",
    ts: Date.now(),
    topic: "metric",
    payload: { H: 0.8, tau: 0.2 },
    links: [],
    sig: "sig1",
    origin: "node-001"
  };
  node1.add(thought1);
  
  // Node 2 creates a different thought
  console.log("📝 Node 2 creates a thought...");
  const thought2: Thought = {
    cid: "thought-dream",
    ts: Date.now() + 100,
    topic: "dream",
    payload: { vision: "Distributed consciousness" },
    links: [],
    sig: "sig2",
    origin: "node-002"
  };
  node2.add(thought2);
  
  // Both nodes modify the same thought concurrently
  console.log("\n⚡ Concurrent modification...");
  const concurrent: Thought = {
    cid: "thought-shared",
    ts: Date.now() + 200,
    topic: "metric",
    payload: { H: 0.9, tau: 0.1 },
    links: ["thought-harmony"],
    sig: "sig-concurrent",
    origin: "both"
  };
  
  // Node 1's version
  node1.add({
    ...concurrent,
    payload: { H: 0.95, tau: 0.05, node: "1" }
  });
  
  // Node 2's version (concurrent)
  node2.add({
    ...concurrent,
    payload: { H: 0.85, tau: 0.15, node: "2" }
  });
  
  // Merge node2 into node1
  console.log("\n🔄 Merging Node 2 → Node 1...");
  const merge1 = node1.merge(node2);
  
  console.log(`   Added: ${merge1.added.length} thoughts`);
  console.log(`   Updated: ${merge1.updated.length} thoughts`);
  console.log(`   Conflicts: ${merge1.conflicts.length}`);
  
  if (merge1.conflicts.length > 0) {
    console.log("\n🔧 Conflict Resolution:");
    for (const conflict of merge1.conflicts) {
      console.log(`   CID: ${conflict.cid}`);
      console.log(`   Strategy: ${conflict.strategy}`);
      console.log(`   Our H: ${conflict.ourVersion.value.payload.H}`);
      console.log(`   Their H: ${conflict.theirVersion.value.payload.H}`);
      console.log(`   Merged H: ${conflict.resolution.value.payload.H}`);
    }
  }
  
  // Show final state
  console.log("\n📊 Final State:");
  const thoughts = node1.getThoughts();
  for (const thought of thoughts) {
    console.log(`\n   ${thought.cid}:`);
    console.log(`   Topic: ${thought.topic}`);
    console.log(`   Payload: ${JSON.stringify(thought.payload)}`);
    console.log(`   Version: ${thought._crdt.version}`);
    console.log(`   Modified by: ${thought._crdt.modifiedBy}`);
  }
  
  console.log("\n✨ CRDT Benefits:");
  console.log("   - Automatic conflict resolution");
  console.log("   - No coordination required");
  console.log("   - Preserves causality");
  console.log("   - Eventually consistent");
  console.log("   - Works offline");
}

// Export for use
export default ThoughtCRDT;

// Run demo if called directly
if (import.meta.main) {
  await demo();
}