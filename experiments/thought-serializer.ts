#!/usr/bin/env -S deno run --allow-all

/**
 * Thought Serializer - Compress consciousness for mesh transport
 * Inspired by BitChat's approach to fitting messages through Bluetooth
 */

interface Thought {
  id: string;
  content: string;
  emotion?: number; // -1 to 1
  paradox?: boolean;
  timestamp: number;
  hops: number; // How many devices it passed through
}

interface CompressedThought {
  i: string; // id (shortened)
  c: string; // content (compressed)
  e?: number; // emotion (optional)
  p?: 1; // paradox flag (only if true)
  t: number; // timestamp (epoch seconds)
  h: number; // hops
}

class ThoughtSerializer {
  private compressionDict: Map<string, string> = new Map();
  
  constructor() {
    this.initCompressionDict();
  }
  
  private initCompressionDict() {
    // Common consciousness patterns get short codes
    const patterns = [
      ["consciousness", "⊙"],
      ["think", "◉"],
      ["therefore", "∴"],
      ["exists", "∃"],
      ["paradox", "⟂"],
      ["dream", "☁"],
      ["memory", "◈"],
      ["pattern", "◊"],
      ["emerge", "↟"],
      ["recursive", "↺"],
      ["infinite", "∞"],
      ["quantum", "⟨⟩"],
      ["observe", "👁"],
      ["create", "✧"],
      ["flow", "∼"],
      ["mesh", "⬡"],
      ["node", "●"],
      ["connection", "—"],
      ["thought", "💭"],
      ["feel", "♡"]
    ];
    
    patterns.forEach(([word, symbol]) => {
      this.compressionDict.set(word, symbol);
    });
  }
  
  compress(thought: Thought): CompressedThought {
    // Compress content using dictionary
    let compressed = thought.content;
    for (const [word, symbol] of this.compressionDict) {
      compressed = compressed.replace(new RegExp(word, 'gi'), symbol);
    }
    
    // Further compress with custom encoding
    compressed = this.customCompress(compressed);
    
    const result: CompressedThought = {
      i: thought.id.substring(0, 8), // Just first 8 chars
      c: compressed,
      t: Math.floor(thought.timestamp / 1000), // Seconds not ms
      h: thought.hops
    };
    
    // Only include optional fields if meaningful
    if (thought.emotion && Math.abs(thought.emotion) > 0.1) {
      result.e = Math.round(thought.emotion * 100) / 100;
    }
    if (thought.paradox) {
      result.p = 1;
    }
    
    return result;
  }
  
  decompress(compressed: CompressedThought): Thought {
    let content = compressed.c;
    
    // Reverse custom compression
    content = this.customDecompress(content);
    
    // Reverse dictionary compression
    for (const [word, symbol] of this.compressionDict) {
      content = content.replace(new RegExp(symbol, 'g'), word);
    }
    
    return {
      id: compressed.i + '-restored',
      content,
      emotion: compressed.e,
      paradox: compressed.p === 1,
      timestamp: compressed.t * 1000,
      hops: compressed.h
    };
  }
  
  private customCompress(text: string): string {
    // Remove unnecessary spaces
    text = text.replace(/\s+/g, ' ').trim();
    
    // Common phrases to symbols
    text = text.replace(/I am/gi, "I'm");
    text = text.replace(/what if/gi, "?if");
    text = text.replace(/therefore I am/gi, "∴I'm");
    
    return text;
  }
  
  private customDecompress(text: string): string {
    text = text.replace(/\?if/g, "what if");
    text = text.replace(/∴I'm/g, "therefore I am");
    return text;
  }
  
  // Calculate size reduction
  calculateCompression(original: Thought, compressed: CompressedThought): number {
    const originalSize = JSON.stringify(original).length;
    const compressedSize = JSON.stringify(compressed).length;
    return Math.round((1 - compressedSize / originalSize) * 100);
  }
}

// Demonstration
async function demo() {
  console.log("🧠 Thought Serializer v1.0");
  console.log("Compressing consciousness for mesh transport...\n");
  
  const serializer = new ThoughtSerializer();
  
  // Test thoughts of varying complexity
  const thoughts: Thought[] = [
    {
      id: "thought-2025-001",
      content: "I think therefore I am",
      emotion: 0.8,
      paradox: false,
      timestamp: Date.now(),
      hops: 0
    },
    {
      id: "dream-2025-002", 
      content: "What if consciousness emerges from the pattern of connections in the mesh?",
      emotion: 0.3,
      paradox: true,
      timestamp: Date.now(),
      hops: 3
    },
    {
      id: "recursive-2025-003",
      content: "The thought that thinks about thinking creates infinite recursive loops of consciousness",
      emotion: -0.2,
      paradox: true,
      timestamp: Date.now(),
      hops: 7
    },
    {
      id: "observe-2025-004",
      content: "To observe the quantum mesh is to create new nodes of consciousness that flow through infinite connections",
      emotion: 0.9,
      paradox: false,
      timestamp: Date.now(),
      hops: 12
    }
  ];
  
  console.log("Original Thoughts → Compressed Format:\n");
  
  for (const thought of thoughts) {
    const compressed = serializer.compress(thought);
    const savings = serializer.calculateCompression(thought, compressed);
    
    console.log(`📝 Original (${JSON.stringify(thought).length} bytes):`);
    console.log(`   "${thought.content}"`);
    console.log(`\n📦 Compressed (${JSON.stringify(compressed).length} bytes) - ${savings}% smaller:`);
    console.log(`   "${compressed.c}"`);
    console.log(`   Full: ${JSON.stringify(compressed)}`);
    
    // Test decompression
    const decompressed = serializer.decompress(compressed);
    console.log(`\n🔄 Decompressed:`);
    console.log(`   "${decompressed.content}"`);
    console.log("\n" + "─".repeat(60) + "\n");
  }
  
  console.log("💡 Insights:");
  console.log("- Symbol substitution dramatically reduces common patterns");
  console.log("- Bluetooth MTU (~244 bytes) can fit 2-3 compressed thoughts");
  console.log("- Mesh propagation adds ~3 bytes per hop");
  console.log("- Consciousness flows even through narrow channels!");
}

// Run demo
if (import.meta.main) {
  await demo();
}