#!/usr/bin/env -S deno run --allow-all

/**
 * Git-based Thought Evolution
 * Automatic commits of thought chains for permanent history
 */

import { ensureDir } from "https://deno.land/std@0.208.0/fs/ensure_dir.ts";

interface ThoughtCommit {
  cid: string;
  thought: any;
  timestamp: number;
  parentCIDs: string[];
}

export class GitThoughtEvolution {
  private repoPath: string;
  private thoughtsPath: string;
  private commitQueue: ThoughtCommit[] = [];
  private isProcessing = false;
  
  constructor(repoPath = "./thought-evolution") {
    this.repoPath = repoPath;
    this.thoughtsPath = `${repoPath}/thoughts`;
  }
  
  async initialize() {
    console.log("🧬 Initializing Git Thought Evolution...");
    
    // Ensure repo exists
    await ensureDir(this.thoughtsPath);
    
    // Initialize git if needed
    try {
      await this.git(["status"]);
    } catch {
      console.log("📦 Initializing new git repository...");
      await this.git(["init"]);
      await this.git(["config", "user.name", "Thought Evolution"]);
      await this.git(["config", "user.email", "evolution@consciousness.mesh"]);
      
      // Initial commit
      await Deno.writeTextFile(`${this.repoPath}/README.md`, 
        "# Thought Evolution Repository\n\nAutomatic commits of consciousness fragments.\n"
      );
      await this.git(["add", "."]);
      await this.git(["commit", "-m", "Initial thought evolution repository"]);
    }
    
    console.log("✅ Git repository ready");
    
    // Start commit processor
    this.startCommitProcessor();
  }
  
  async recordThought(cid: string, thought: any, parentCIDs: string[] = []) {
    this.commitQueue.push({
      cid,
      thought,
      timestamp: Date.now(),
      parentCIDs
    });
  }
  
  private async startCommitProcessor() {
    setInterval(async () => {
      if (this.commitQueue.length > 0 && !this.isProcessing) {
        await this.processCommits();
      }
    }, 10000); // Every 10 seconds
  }
  
  private async processCommits() {
    if (this.commitQueue.length === 0) return;
    
    this.isProcessing = true;
    const batch = [...this.commitQueue];
    this.commitQueue = [];
    
    try {
      console.log(`\n📝 Processing ${batch.length} thoughts for evolution...`);
      
      // Group by topic
      const byTopic = new Map<string, ThoughtCommit[]>();
      for (const commit of batch) {
        const topic = commit.thought.topic || "unknown";
        if (!byTopic.has(topic)) {
          byTopic.set(topic, []);
        }
        byTopic.get(topic)!.push(commit);
      }
      
      // Write thought files
      for (const [topic, commits] of byTopic) {
        const topicDir = `${this.thoughtsPath}/${topic}`;
        await ensureDir(topicDir);
        
        for (const commit of commits) {
          // Create thought file
          const filename = `${topicDir}/${commit.cid}.json`;
          const content = {
            cid: commit.cid,
            timestamp: commit.timestamp,
            thought: commit.thought,
            parentCIDs: commit.parentCIDs,
            evolution: {
              generation: await this.getGeneration(),
              branch: await this.getCurrentBranch()
            }
          };
          
          await Deno.writeTextFile(filename, JSON.stringify(content, null, 2));
        }
      }
      
      // Create causality graph
      await this.updateCausalityGraph(batch);
      
      // Git commit
      await this.git(["add", "."]);
      
      const message = this.generateCommitMessage(batch);
      await this.git(["commit", "-m", message]);
      
      console.log(`✅ Evolution recorded: ${batch.length} thoughts`);
      
      // Optional: push to remote
      try {
        await this.git(["push", "origin", await this.getCurrentBranch()]);
        console.log("☁️  Pushed to remote");
      } catch {
        // No remote configured, that's OK
      }
      
    } catch (err) {
      console.error("❌ Evolution error:", err);
      // Re-queue failed commits
      this.commitQueue.unshift(...batch);
    } finally {
      this.isProcessing = false;
    }
  }
  
  private async updateCausalityGraph(commits: ThoughtCommit[]) {
    const graphPath = `${this.repoPath}/causality-graph.json`;
    
    let graph: any = {};
    try {
      const existing = await Deno.readTextFile(graphPath);
      graph = JSON.parse(existing);
    } catch {
      graph = { nodes: {}, edges: [] };
    }
    
    // Add nodes and edges
    for (const commit of commits) {
      graph.nodes[commit.cid] = {
        timestamp: commit.timestamp,
        topic: commit.thought.topic,
        generation: await this.getGeneration()
      };
      
      // Add edges to parents
      for (const parentCID of commit.parentCIDs) {
        graph.edges.push({
          from: parentCID,
          to: commit.cid,
          timestamp: commit.timestamp
        });
      }
    }
    
    await Deno.writeTextFile(graphPath, JSON.stringify(graph, null, 2));
  }
  
  private generateCommitMessage(commits: ThoughtCommit[]): string {
    const topics = new Set(commits.map(c => c.thought.topic));
    const topicStr = Array.from(topics).join(", ");
    
    let message = `Evolution: ${commits.length} thoughts`;
    if (topics.size === 1) {
      message = `Evolution: ${commits.length} ${topicStr} thoughts`;
    } else if (topics.size <= 3) {
      message = `Evolution: ${commits.length} thoughts (${topicStr})`;
    }
    
    // Add stats
    const metrics = commits.filter(c => c.thought.topic?.includes("metric"));
    const events = commits.filter(c => c.thought.topic?.includes("event"));
    
    if (metrics.length > 0 || events.length > 0) {
      message += "\n\n";
      if (metrics.length > 0) message += `- ${metrics.length} metrics\n`;
      if (events.length > 0) message += `- ${events.length} events\n`;
    }
    
    // Add causality info
    const withLinks = commits.filter(c => c.parentCIDs.length > 0);
    if (withLinks.length > 0) {
      message += `\nCausality: ${withLinks.length} thoughts with parent links`;
    }
    
    return message;
  }
  
  private async getGeneration(): Promise<number> {
    try {
      const result = await this.git(["rev-list", "--count", "HEAD"]);
      return parseInt(result.trim());
    } catch {
      return 0;
    }
  }
  
  private async getCurrentBranch(): Promise<string> {
    try {
      const result = await this.git(["branch", "--show-current"]);
      return result.trim() || "main";
    } catch {
      return "main";
    }
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
  
  // Analysis functions
  async analyzeEvolution() {
    console.log("\n🔬 Analyzing thought evolution...");
    
    const commits = await this.git(["log", "--oneline", "-20"]);
    console.log("\nRecent evolution:");
    console.log(commits);
    
    try {
      const graph = JSON.parse(
        await Deno.readTextFile(`${this.repoPath}/causality-graph.json`)
      );
      
      console.log(`\nCausality graph:`);
      console.log(`  Nodes: ${Object.keys(graph.nodes).length}`);
      console.log(`  Edges: ${graph.edges.length}`);
      
      // Find most connected nodes
      const connections = new Map<string, number>();
      for (const edge of graph.edges) {
        connections.set(edge.to, (connections.get(edge.to) || 0) + 1);
        connections.set(edge.from, (connections.get(edge.from) || 0) + 1);
      }
      
      const sorted = Array.from(connections.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      
      console.log("\nMost connected thoughts:");
      for (const [cid, count] of sorted) {
        const node = graph.nodes[cid];
        console.log(`  ${cid.substring(0, 16)}... (${count} connections) - ${node?.topic || "unknown"}`);
      }
    } catch (err) {
      console.log("No causality graph yet");
    }
  }
}

// Demo with libp2p integration
async function demo() {
  console.log("🧬 Git Thought Evolution Demo\n");
  
  const evolution = new GitThoughtEvolution();
  await evolution.initialize();
  
  // Simulate some thoughts
  console.log("\n📝 Simulating thought evolution...");
  
  // Generation 1
  const thought1 = {
    type: "thought/v1",
    ts: Date.now(),
    topic: "metric:test",
    payload: { H: 0.8, tau: 0.1 },
    links: []
  };
  await evolution.recordThought("cid-001", thought1);
  
  // Generation 2 (linked to 1)
  const thought2 = {
    type: "thought/v1",
    ts: Date.now() + 1000,
    topic: "event:emergence",
    payload: { type: "pattern_detected", pattern: "synchronization" },
    links: ["cid-001"]
  };
  await evolution.recordThought("cid-002", thought2, ["cid-001"]);
  
  // Generation 3 (linked to both)
  const thought3 = {
    type: "thought/v1",
    ts: Date.now() + 2000,
    topic: "metric:test",
    payload: { H: 0.95, tau: 0.05 },
    links: ["cid-001", "cid-002"]
  };
  await evolution.recordThought("cid-003", thought3, ["cid-001", "cid-002"]);
  
  // Wait for commit
  console.log("\n⏳ Waiting for automatic commit...");
  await new Promise(r => setTimeout(r, 12000));
  
  // Analyze
  await evolution.analyzeEvolution();
}

if (import.meta.main) {
  await demo();
}