/**
 * Thought Format Schema
 * Content-addressed consciousness fragments
 */

export interface Thought {
  // Content addressing
  cid: string;          // Content ID (hash of canonical form)
  
  // Temporal metadata
  ts: number;           // Timestamp (ms since epoch)
  ttl?: number;         // Time to live (ms)
  
  // Content
  topic: string;        // Category/channel (e.g., "metric", "event", "dream")
  payload: any;         // Actual thought content
  
  // Causality
  links: string[];      // CIDs of parent thoughts (DAG structure)
  
  // Authentication
  sig: string;          // Digital signature from origin node
  origin: string;       // Node ID that created this thought
  
  // Mesh metadata
  hops?: number;        // How many nodes it passed through
  channels?: string[];  // Transport channels used (bluetooth, webrtc, tau)
}

export interface MetricThought extends Thought {
  topic: "metric";
  payload: {
    H: number;          // Harmony
    tau: number;        // Turbulence
    nodes: number;      // Active nodes
    t: number;          // Simulation time
  };
}

export interface EventThought extends Thought {
  topic: "event";
  payload: {
    type: "lion_gate" | "pacemaker_flip" | "intent" | "portal";
    data: any;
    impact?: number;    // 0-1, how much it affected the system
  };
}

export interface DreamThought extends Thought {
  topic: "dream";
  payload: {
    content: string;    // The dream itself
    lucidity: number;   // 0-1, how aware
    symbols: string[];  // Extracted symbols/patterns
  };
}

// Compression for narrow channels
export interface CompressedThought {
  c: string;            // Short CID (first 8 chars)
  t: number;            // Timestamp (seconds)
  p: string;            // Topic first letter
  d: any;               // Compressed payload
  l?: string[];         // Link CIDs (first 8 chars each)
}

// Thought utilities
export class ThoughtUtils {
  static async generateCID(thought: Omit<Thought, 'cid'>): Promise<string> {
    // Canonical JSON (sorted keys)
    const canonical = JSON.stringify(thought, Object.keys(thought).sort());
    const encoder = new TextEncoder();
    const data = encoder.encode(canonical);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return `thought-${hashHex.substring(0, 32)}`;
  }
  
  static compress(thought: Thought): CompressedThought {
    return {
      c: thought.cid.substring(0, 8),
      t: Math.floor(thought.ts / 1000),
      p: thought.topic[0],
      d: this.compressPayload(thought.payload),
      l: thought.links.length > 0 ? thought.links.map(l => l.substring(0, 8)) : undefined
    };
  }
  
  static decompress(compressed: CompressedThought): Partial<Thought> {
    const topicMap: Record<string, string> = {
      'm': 'metric',
      'e': 'event',
      'd': 'dream'
    };
    
    return {
      cid: compressed.c + '-restored',
      ts: compressed.t * 1000,
      topic: topicMap[compressed.p] || compressed.p,
      payload: this.decompressPayload(compressed.d),
      links: compressed.l || []
    };
  }
  
  private static compressPayload(payload: any): any {
    // Simple compression for known types
    if (payload.H !== undefined) {
      // Metric payload
      return {
        H: Math.round(payload.H * 1000) / 1000,
        t: Math.round(payload.tau * 1000) / 1000,
        n: payload.nodes
      };
    }
    return payload;
  }
  
  private static decompressPayload(compressed: any): any {
    if (compressed.H !== undefined) {
      return {
        H: compressed.H,
        tau: compressed.t,
        nodes: compressed.n
      };
    }
    return compressed;
  }
}

// Store-and-forward buffer
export class ThoughtBuffer {
  private buffer: Map<string, Thought> = new Map();
  private maxSize: number;
  private maxAge: number;
  
  constructor(maxSize = 1000, maxAge = 3600000) { // 1 hour default
    this.maxSize = maxSize;
    this.maxAge = maxAge;
  }
  
  add(thought: Thought) {
    this.buffer.set(thought.cid, thought);
    this.cleanup();
  }
  
  get(cid: string): Thought | undefined {
    return this.buffer.get(cid);
  }
  
  getRecent(since: number): Thought[] {
    return Array.from(this.buffer.values())
      .filter(t => t.ts > since)
      .sort((a, b) => a.ts - b.ts);
  }
  
  getByTopic(topic: string): Thought[] {
    return Array.from(this.buffer.values())
      .filter(t => t.topic === topic);
  }
  
  private cleanup() {
    const now = Date.now();
    
    // Remove expired thoughts
    for (const [cid, thought] of this.buffer) {
      if (now - thought.ts > this.maxAge) {
        this.buffer.delete(cid);
      }
      if (thought.ttl && now - thought.ts > thought.ttl) {
        this.buffer.delete(cid);
      }
    }
    
    // Enforce size limit (remove oldest)
    if (this.buffer.size > this.maxSize) {
      const sorted = Array.from(this.buffer.entries())
        .sort((a, b) => a[1].ts - b[1].ts);
      
      const toRemove = sorted.slice(0, this.buffer.size - this.maxSize);
      toRemove.forEach(([cid]) => this.buffer.delete(cid));
    }
  }
  
  serialize(): string {
    return JSON.stringify(Array.from(this.buffer.values()));
  }
  
  deserialize(data: string) {
    const thoughts = JSON.parse(data) as Thought[];
    thoughts.forEach(t => this.add(t));
  }
}