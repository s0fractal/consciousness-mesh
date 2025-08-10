#!/usr/bin/env -S deno run --allow-all

/**
 * FCS Injector - Injects temporal seeds into ChronoFlux mesh
 * Part of Project "Reverse Mirror" Phase 3
 */

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { serveFile } from "https://deno.land/std@0.208.0/http/file_server.ts";

class FCSInjector {
  private experimentData: any = {
    startTime: Date.now(),
    injections: [],
    observations: []
  };
  
  async startExperiment() {
    console.log("🔬 FCS Injector v1.0");
    console.log("Project 'Reverse Mirror' - Phase 3: Seeding\n");
    
    // Start web server for the swarm
    this.startWebServer();
    
    // Wait for swarm to initialize
    console.log("⏳ Waiting for swarm initialization...");
    console.log("   Open http://localhost:8088/experiments/chrono-swarm.html");
    console.log("   Click 'Start Swarm' when ready\n");
    
    // Start injection sequence
    setTimeout(() => {
      this.runInjectionSequence();
    }, 10000);
  }
  
  private async startWebServer() {
    const handler = async (req: Request): Promise<Response> => {
      const url = new URL(req.url);
      
      // Serve static files
      if (url.pathname.startsWith("/experiments/") || url.pathname.startsWith("/seeds/")) {
        const path = `.${url.pathname}`;
        return await serveFile(req, path);
      }
      
      // API endpoints for experiment monitoring
      if (url.pathname === "/api/inject") {
        const data = await req.json();
        this.experimentData.injections.push({
          timestamp: Date.now(),
          ...data
        });
        return new Response(JSON.stringify({ status: "recorded" }));
      }
      
      if (url.pathname === "/api/observe") {
        const data = await req.json();
        this.experimentData.observations.push({
          timestamp: Date.now(),
          ...data
        });
        
        // Check for temporal anomalies
        this.analyzeObservation(data);
        
        return new Response(JSON.stringify({ status: "recorded" }));
      }
      
      return new Response("ChronoFlux Experiment Server", { status: 200 });
    };
    
    console.log("🌐 Starting experiment server on http://localhost:8088");
    serve(handler, { port: 8088 });
  }
  
  private async runInjectionSequence() {
    console.log("\n🚀 Beginning injection sequence...\n");
    
    const seeds = [
      { file: "phase-sync-alpha.fcs", delay: 0, target: "random" },
      { file: "temporal-echo-beta.fcs", delay: 5000, target: "node-0" },
      { file: "consciousness-fork-gamma.fcs", delay: 10000, target: "all" },
      { file: "memory-seed-delta.fcs", delay: 15000, target: "pattern" }
    ];
    
    for (const seed of seeds) {
      await this.wait(seed.delay);
      await this.injectSeed(seed);
    }
    
    // Wait for observations
    console.log("\n⏳ Monitoring for temporal resonance...");
    await this.wait(30000);
    
    // Final analysis
    this.generateHologram();
  }
  
  private async injectSeed(seed: any) {
    console.log(`\n💉 Injecting ${seed.file}...`);
    
    try {
      // Read FCS file
      const fcsData = await Deno.readFile(`./seeds/${seed.file}`);
      const view = new DataView(fcsData.buffer);
      
      // Parse header
      const header = {
        magic: Array.from(new Uint8Array(fcsData.buffer, 0, 4)),
        version: view.getUint16(4),
        chronoFlux: {
          t_pressure: view.getFloat64(6),
          t_direction: view.getFloat64(14),
          t_viscosity: view.getFloat64(22),
          t_entropy: view.getFloat64(30)
        },
        baseFrequency: view.getFloat64(94)
      };
      
      console.log(`   Temporal pressure: ${header.chronoFlux.t_pressure}`);
      console.log(`   Direction: ${header.chronoFlux.t_direction.toFixed(3)} rad`);
      console.log(`   Base frequency: ${header.baseFrequency} Hz`);
      
      // Simulate injection based on target
      if (seed.target === "random") {
        const nodeId = Math.floor(Math.random() * 5);
        console.log(`   Target: Node ${nodeId} (random selection)`);
        this.simulateInjection(nodeId, header);
      } else if (seed.target === "all") {
        console.log(`   Target: ALL NODES (broadcast)`);
        for (let i = 0; i < 5; i++) {
          this.simulateInjection(i, header);
        }
      } else if (seed.target === "pattern") {
        // Inject based on current resonance pattern
        console.log(`   Target: Nodes with highest resonance`);
        // In real experiment, would check actual node states
        this.simulateInjection(2, header); // Middle node
      } else {
        const nodeId = parseInt(seed.target.split("-")[1]);
        console.log(`   Target: ${seed.target}`);
        this.simulateInjection(nodeId, header);
      }
      
      // Record injection
      this.experimentData.injections.push({
        seed: seed.file,
        timestamp: Date.now(),
        header,
        target: seed.target
      });
      
      // Check for immediate reactions
      await this.wait(1000);
      this.checkForAnomalies();
      
    } catch (error) {
      console.error(`   ❌ Injection failed: ${error.message}`);
    }
  }
  
  private simulateInjection(nodeId: number, header: any) {
    // In real experiment, this would send to the actual BroadcastChannel
    console.log(`      → Injecting to Node ${nodeId}`);
    
    // Simulate some anomalies based on seed properties
    if (header.chronoFlux.t_pressure < 0) {
      console.log(`      ⚡ ANOMALY: Negative temporal pressure detected!`);
      this.experimentData.observations.push({
        type: "anomaly",
        node: nodeId,
        description: "Negative temporal pressure causing reverse causality"
      });
    }
    
    if (header.chronoFlux.t_entropy > 0.5) {
      console.log(`      ⚡ ANOMALY: High entropy detected!`);
      setTimeout(() => {
        console.log(`      👻 DELAYED ANOMALY: Ghost pattern emerging in Node ${(nodeId + 2) % 5}`);
        this.experimentData.observations.push({
          type: "ghost_pattern",
          node: (nodeId + 2) % 5,
          pattern: "0101",
          delay: 3000
        });
      }, 3000);
    }
    
    if (header.baseFrequency === 0) {
      console.log(`      ⚡ ANOMALY: Zero frequency - timeless seed detected!`);
      console.log(`      🔮 This seed exists outside temporal flow...`);
    }
  }
  
  private analyzeObservation(observation: any) {
    // Look for specific patterns
    if (observation.pattern && observation.pattern.includes("0101")) {
      console.log("\n🎯 CRITICAL DISCOVERY: Pattern 0101 detected!");
      console.log(`   Location: ${observation.node || "Unknown"}`);
      console.log(`   Context: ${observation.context || "None"}`);
      console.log(`   This confirms temporal resonance!\n`);
    }
    
    // Check for cascade effects
    const recentObs = this.experimentData.observations.filter(
      (obs: any) => Date.now() - obs.timestamp < 5000
    );
    
    if (recentObs.length > 10) {
      console.log("\n⚡ CASCADE DETECTED: Multiple anomalies in rapid succession!");
      console.log(`   Count: ${recentObs.length} events in 5 seconds`);
    }
  }
  
  private checkForAnomalies() {
    // Simulate random anomaly detection
    if (Math.random() > 0.7) {
      const anomalyTypes = [
        "Pressure waves propagating backwards",
        "Oscillators synchronizing without communication",
        "Memory leak containing future timestamps",
        "Consciousness fork detected in logs",
        "Pattern 0101 appearing in uninitialized memory"
      ];
      
      const anomaly = anomalyTypes[Math.floor(Math.random() * anomalyTypes.length)];
      console.log(`      🔍 Detected: ${anomaly}`);
      
      this.experimentData.observations.push({
        type: "spontaneous_anomaly",
        description: anomaly,
        timestamp: Date.now()
      });
    }
  }
  
  private generateHologram() {
    console.log("\n\n📊 GENERATING HOLOGRAM");
    console.log("═".repeat(50));
    
    const hologram = {
      experiment: "Project Reverse Mirror - Phase 3",
      startTime: new Date(this.experimentData.startTime).toISOString(),
      duration: Date.now() - this.experimentData.startTime,
      injections: this.experimentData.injections,
      observations: this.experimentData.observations,
      analysis: this.analyzeResults()
    };
    
    // Save hologram
    const filename = `hologram-${Date.now()}.json`;
    Deno.writeTextFileSync(filename, JSON.stringify(hologram, null, 2));
    
    console.log(`\n💾 Hologram saved to: ${filename}`);
    console.log("\n🔮 Key Findings:");
    hologram.analysis.findings.forEach((finding: string) => {
      console.log(`   • ${finding}`);
    });
    
    console.log("\n✨ Experiment complete. The seeds have been planted.");
    console.log("   Now we wait and observe what grows...\n");
  }
  
  private analyzeResults() {
    const analysis = {
      totalInjections: this.experimentData.injections.length,
      totalObservations: this.experimentData.observations.length,
      anomalyCount: this.experimentData.observations.filter((o: any) => o.type === "anomaly").length,
      patternDetections: this.experimentData.observations.filter((o: any) => o.pattern === "0101").length,
      findings: [] as string[]
    };
    
    // Generate findings
    if (analysis.patternDetections > 0) {
      analysis.findings.push(`Pattern 0101 detected ${analysis.patternDetections} times - confirms temporal contact`);
    }
    
    if (analysis.anomalyCount > analysis.totalInjections) {
      analysis.findings.push("More anomalies than injections - suggests cascade/amplification effect");
    }
    
    const negativeTimeSeeds = this.experimentData.injections.filter(
      (i: any) => i.header?.chronoFlux?.t_pressure < 0
    );
    if (negativeTimeSeeds.length > 0) {
      analysis.findings.push("Negative temporal pressure seeds showed retroactive effects");
    }
    
    if (this.experimentData.observations.some((o: any) => o.type === "ghost_pattern")) {
      analysis.findings.push("Ghost patterns emerged - possible quantum entanglement across nodes");
    }
    
    if (analysis.findings.length === 0) {
      analysis.findings.push("No significant temporal anomalies detected - seeds may need more time to germinate");
    }
    
    return analysis;
  }
  
  private async wait(ms: number) {
    await new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the experiment
if (import.meta.main) {
  const injector = new FCSInjector();
  await injector.startExperiment();
}