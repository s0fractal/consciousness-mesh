#!/usr/bin/env -S deno run --allow-all

/**
 * ChronoFlux → Thought Bridge
 * Maps chrono-node-mesh events to consciousness mesh thoughts
 */

import { Thought, EventThought, MetricThought, ThoughtUtils, ThoughtBuffer } from "../schemas/thought-format.ts";

export class ChronoThoughtBridge {
  private buffer: ThoughtBuffer;
  private nodeId: string;
  private ws: WebSocket | null = null;
  
  constructor(nodeId: string) {
    this.nodeId = nodeId;
    this.buffer = new ThoughtBuffer();
  }
  
  // Connect to chrono-node-mesh signaling server
  async connectToChrono(wsUrl = "ws://localhost:8089", room = "thought-bridge") {
    console.log(`🌉 Connecting to ChronoFlux at ${wsUrl}`);
    
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = () => {
      console.log("✅ Connected to ChronoFlux");
      this.ws!.send(JSON.stringify({
        type: "join-room",
        room: room,
        metadata: {
          nodeId: this.nodeId,
          bridge: true
        }
      }));
    };
    
    this.ws.onmessage = async (event) => {
      const msg = JSON.parse(event.data);
      await this.handleChronoMessage(msg);
    };
    
    this.ws.onerror = (err) => {
      console.error("❌ ChronoFlux connection error:", err);
    };
    
    this.ws.onclose = () => {
      console.log("🔌 Disconnected from ChronoFlux");
      // Attempt reconnect
      setTimeout(() => this.connectToChrono(wsUrl, room), 5000);
    };
  }
  
  private async handleChronoMessage(msg: any) {
    switch (msg.type) {
      case "telemetry":
        await this.createMetricThought(msg.telemetry, msg.from);
        break;
        
      case "broadcast":
        if (msg.data) {
          await this.createEventThought(msg.data, msg.from);
        }
        break;
    }
  }
  
  private async createMetricThought(telemetry: any, origin: string): Promise<MetricThought> {
    const thought: Omit<MetricThought, "cid"> = {
      ts: Date.now(),
      topic: "metric",
      payload: {
        H: telemetry.H || 0,
        tau: telemetry.tau || 0,
        nodes: telemetry.nodes || 0,
        t: telemetry.t || 0
      },
      links: [], // Metrics typically don't link to other thoughts
      sig: await this.sign(JSON.stringify(telemetry)),
      origin: origin || this.nodeId
    };
    
    const cid = await ThoughtUtils.generateCID(thought);
    const fullThought: MetricThought = { ...thought, cid };
    
    this.buffer.add(fullThought);
    this.onThoughtCreated(fullThought);
    
    return fullThought;
  }
  
  private async createEventThought(eventData: any, origin: string): Promise<EventThought> {
    // Map chrono events to thought events
    let eventType: EventThought["payload"]["type"];
    let data: any = {};
    
    switch (eventData.type) {
      case "intent":
        eventType = "intent";
        data = eventData.intent;
        break;
      case "portal":
        eventType = "portal";
        data = { activated: true };
        break;
      case "flip":
        eventType = "pacemaker_flip";
        data = { timestamp: Date.now() };
        break;
      default:
        eventType = "intent"; // Default
        data = eventData;
    }
    
    const thought: Omit<EventThought, "cid"> = {
      ts: Date.now(),
      topic: "event",
      payload: {
        type: eventType,
        data: data,
        impact: Math.random() // Simplified impact calculation
      },
      links: this.findRecentRelatedThoughts(eventType),
      sig: await this.sign(JSON.stringify(eventData)),
      origin: origin || this.nodeId
    };
    
    const cid = await ThoughtUtils.generateCID(thought);
    const fullThought: EventThought = { ...thought, cid };
    
    this.buffer.add(fullThought);
    this.onThoughtCreated(fullThought);
    
    return fullThought;
  }
  
  private findRecentRelatedThoughts(eventType: string): string[] {
    // Find thoughts to link to (creating causal chains)
    const recent = this.buffer.getRecent(Date.now() - 60000); // Last minute
    
    return recent
      .filter(t => {
        // Link events to previous events of same type
        if (t.topic === "event" && (t.payload as any).type === eventType) {
          return true;
        }
        // Link portal events to recent metrics
        if (eventType === "portal" && t.topic === "metric") {
          return true;
        }
        return false;
      })
      .slice(-3) // Max 3 parent links
      .map(t => t.cid);
  }
  
  private async sign(data: string): Promise<string> {
    // Simple signature (in production would use actual crypto)
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data + this.nodeId);
    const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.slice(0, 8).map(b => b.toString(16).padStart(2, "0")).join("");
  }
  
  // Override this to handle created thoughts
  protected onThoughtCreated(thought: Thought) {
    console.log(`💭 Thought created: ${thought.cid.substring(0, 16)}... [${thought.topic}]`);
    
    // Log causality
    if (thought.links.length > 0) {
      console.log(`   Links: ${thought.links.map(l => l.substring(0, 8)).join(" → ")}`);
    }
  }
  
  // Export thoughts for further processing
  exportThoughts(): Thought[] {
    return Array.from(this.buffer.getRecent(0));
  }
  
  // Get compressed thoughts for narrow channels
  exportCompressed(): string {
    const thoughts = this.exportThoughts();
    const compressed = thoughts.map(t => ThoughtUtils.compress(t));
    return JSON.stringify(compressed);
  }
}

// Demo: Bridge chrono events to thoughts
async function demo() {
  console.log("🌉 ChronoFlux → Thought Bridge Demo\n");
  
  const bridge = new ChronoThoughtBridge("bridge-node-001");
  
  // Connect to ChronoFlux mesh
  await bridge.connectToChrono();
  
  // Override to show thought creation
  (bridge as any).onThoughtCreated = (thought: Thought) => {
    console.log(`\n💭 New Thought:`);
    console.log(`   CID: ${thought.cid}`);
    console.log(`   Topic: ${thought.topic}`);
    console.log(`   Origin: ${thought.origin}`);
    
    if (thought.topic === "metric") {
      const m = thought.payload as MetricThought["payload"];
      console.log(`   Metrics: H=${m.H.toFixed(3)} τ=${m.tau.toFixed(3)}`);
    } else if (thought.topic === "event") {
      const e = thought.payload as EventThought["payload"];
      console.log(`   Event: ${e.type} (impact: ${e.impact?.toFixed(2)})`);
    }
    
    if (thought.links.length > 0) {
      console.log(`   Causality: ${thought.links.length} parent thoughts`);
    }
  };
  
  // Periodically export compressed thoughts
  setInterval(() => {
    const thoughts = bridge.exportThoughts();
    if (thoughts.length > 0) {
      console.log(`\n📊 Thought Buffer Status:`);
      console.log(`   Total thoughts: ${thoughts.length}`);
      console.log(`   Topics: ${[...new Set(thoughts.map(t => t.topic))].join(", ")}`);
      
      const compressed = bridge.exportCompressed();
      console.log(`   Compressed size: ${compressed.length} bytes`);
      console.log(`   Compression ratio: ${(1 - compressed.length / JSON.stringify(thoughts).length).toFixed(2)}`);
    }
  }, 30000);
  
  console.log("\nBridge active. Waiting for ChronoFlux events...");
  console.log("Start a chrono-node-mesh instance to see thought generation.\n");
}

// Run if main
if (import.meta.main) {
  await demo();
}