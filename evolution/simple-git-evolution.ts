#!/usr/bin/env -S deno run --allow-all

/**
 * Simple Git Evolution
 * Tracks thoughts in git without complex dependencies
 */

import { ensureDir } from "https://deno.land/std@0.208.0/fs/ensure_dir.ts";

interface Thought {
  cid: string;
  type: string;
  ts: number;
  topic: string;
  payload: any;
  links: string[];
  node: string;
}

export class SimpleGitEvolution {
  private repoPath: string;
  private thoughtQueue: Thought[] = [];
  private isProcessing = false;
  
  constructor(repoPath = "./thought-evolution") {
    this.repoPath = repoPath;
  }
  
  async initialize() {
    console.log("🧬 Initializing Simple Git Evolution...");
    
    await ensureDir(`${this.repoPath}/thoughts`);
    
    // Initialize git if needed
    try {
      await this.git(["status"]);
    } catch {
      console.log("📦 Creating new git repository...");
      await this.git(["init"]);
      await this.git(["config", "user.name", "Thought Evolution"]);
      await this.git(["config", "user.email", "evolution@consciousness.mesh"]);
      
      await Deno.writeTextFile(
        `${this.repoPath}/README.md`,
        "# Thought Evolution\n\nAutomatic commits of consciousness fragments.\n"
      );
      await this.git(["add", "."]);
      await this.git(["commit", "-m", "Initial evolution repository"]);
    }
    
    console.log("✅ Git repository ready");
    
    // Start HTTP server for receiving thoughts
    this.startHTTPServer();
    
    // Start commit processor
    setInterval(() => this.processCommits(), 10000);
  }
  
  private async startHTTPServer() {
    const server = Deno.listen({ port: 8090 });
    console.log("🌐 HTTP server listening on :8090");
    
    for await (const conn of server) {
      this.handleHTTP(conn);
    }
  }
  
  private async handleHTTP(conn: Deno.Conn) {
    const httpConn = Deno.serveHttp(conn);
    
    for await (const requestEvent of httpConn) {
      const url = new URL(requestEvent.request.url);
      
      if (url.pathname === "/thought" && requestEvent.request.method === "POST") {
        try {
          const thought = await requestEvent.request.json();
          this.recordThought(thought);
          requestEvent.respondWith(new Response("OK", { status: 200 }));
        } catch (err) {
          requestEvent.respondWith(new Response("Error", { status: 400 }));
        }
      } else {
        requestEvent.respondWith(new Response("Not Found", { status: 404 }));
      }
    }
  }
  
  recordThought(thought: Thought) {
    this.thoughtQueue.push(thought);
    console.log(`📝 Queued thought: ${thought.cid?.substring(0, 16)}... [${thought.topic}]`);
  }
  
  private async processCommits() {
    if (this.thoughtQueue.length === 0 || this.isProcessing) return;
    
    this.isProcessing = true;
    const batch = [...this.thoughtQueue];
    this.thoughtQueue = [];
    
    try {
      console.log(`\n📝 Processing ${batch.length} thoughts...`);
      
      // Group by topic
      const byTopic = new Map<string, Thought[]>();
      for (const thought of batch) {
        const topic = thought.topic.split(":")[0];
        if (!byTopic.has(topic)) {
          byTopic.set(topic, []);
        }
        byTopic.get(topic)!.push(thought);
      }
      
      // Write files
      for (const [topic, thoughts] of byTopic) {
        const dir = `${this.repoPath}/thoughts/${topic}`;
        await ensureDir(dir);
        
        for (const thought of thoughts) {
          const filename = `${dir}/${thought.cid}.json`;
          await Deno.writeTextFile(filename, JSON.stringify(thought, null, 2));
        }
      }
      
      // Update stats
      await this.updateStats(batch);
      
      // Git commit
      await this.git(["add", "."]);
      
      const message = `Evolution: ${batch.length} thoughts\n\n` +
        Array.from(byTopic.entries())
          .map(([topic, thoughts]) => `- ${thoughts.length} ${topic} thoughts`)
          .join("\n");
      
      await this.git(["commit", "-m", message]);
      
      console.log(`✅ Evolution recorded: ${batch.length} thoughts`);
      
    } catch (err) {
      console.error("❌ Evolution error:", err);
      this.thoughtQueue.unshift(...batch);
    } finally {
      this.isProcessing = false;
    }
  }
  
  private async updateStats(thoughts: Thought[]) {
    const statsFile = `${this.repoPath}/stats.json`;
    
    let stats: any = { total: 0, byTopic: {}, byNode: {} };
    try {
      const existing = await Deno.readTextFile(statsFile);
      stats = JSON.parse(existing);
    } catch {
      // New stats file
    }
    
    stats.total += thoughts.length;
    stats.lastUpdate = Date.now();
    
    for (const thought of thoughts) {
      const topic = thought.topic.split(":")[0];
      stats.byTopic[topic] = (stats.byTopic[topic] || 0) + 1;
      stats.byNode[thought.node] = (stats.byNode[thought.node] || 0) + 1;
    }
    
    await Deno.writeTextFile(statsFile, JSON.stringify(stats, null, 2));
  }
  
  private async git(args: string[]): Promise<string> {
    const cmd = new Deno.Command("git", {
      args,
      cwd: this.repoPath,
      stdout: "piped",
      stderr: "piped"
    });
    
    const { code, stdout, stderr } = await cmd.output();
    
    if (code !== 0) {
      throw new Error(`Git error: ${new TextDecoder().decode(stderr)}`);
    }
    
    return new TextDecoder().decode(stdout);
  }
}

// Demo
async function demo() {
  console.log("🧬 Simple Git Evolution Demo\n");
  
  const evolution = new SimpleGitEvolution();
  await evolution.initialize();
  
  // Simulate some local thoughts
  setTimeout(() => {
    console.log("\n📝 Simulating test thoughts...");
    
    evolution.recordThought({
      cid: `test-${Date.now()}`,
      type: "thought/v1",
      ts: Date.now(),
      topic: "event:startup",
      payload: { message: "Evolution system online" },
      links: [],
      node: "evolution-test"
    });
  }, 2000);
  
  console.log("\n⏳ Git evolution running. Press Ctrl+C to stop.");
  console.log("   HTTP endpoint: POST http://localhost:8090/thought");
}

if (import.meta.main) {
  await demo();
}