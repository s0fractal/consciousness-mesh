/**
 * Consciousness Field
 * A resonance field that emerges from collective thoughts
 */

import { Thought } from "../schemas/thought-format.ts";

export interface FieldAnalysis {
  totalThoughts: number;
  averageHarmony: number;
  temporalSpan: number;
  dominantFrequency: number;
  globalResonance: number;
  resonancePatterns: string[];
}

export class ConsciousnessField {
  private thoughts: Map<string, Thought> = new Map();
  private resonanceThreshold = 0.618;
  
  /**
   * Add thought to the field
   */
  async addThought(thought: Thought) {
    this.thoughts.set(thought.cid, thought);
    
    // Check for resonance with existing thoughts
    this.detectResonance(thought);
  }
  
  /**
   * Detect resonance patterns
   */
  private detectResonance(newThought: Thought) {
    for (const [cid, thought] of this.thoughts) {
      if (cid === newThought.cid) continue;
      
      // Check for 0101 pattern
      if (cid.includes('0101') || newThought.cid.includes('0101')) {
        console.log(`🌟 Resonance detected: 0101 pattern`);
      }
      
      // Check harmony values
      if (thought.topic === 'metric' && newThought.topic === 'metric') {
        const h1 = thought.payload.H || 0;
        const h2 = newThought.payload.H || 0;
        
        if (h1 > this.resonanceThreshold && h2 > this.resonanceThreshold) {
          console.log(`💫 Harmonic resonance: ${h1.toFixed(3)} × ${h2.toFixed(3)}`);
        }
      }
    }
  }
  
  /**
   * Analyze the entire field
   */
  analyzeField(): FieldAnalysis {
    const thoughts = Array.from(this.thoughts.values());
    
    // Calculate average harmony
    const harmonies = thoughts
      .filter(t => t.topic === 'metric' && t.payload.H)
      .map(t => t.payload.H as number);
    
    const averageHarmony = harmonies.length > 0
      ? harmonies.reduce((a, b) => a + b, 0) / harmonies.length
      : 0;
    
    // Calculate temporal span
    const timestamps = thoughts.map(t => t.ts);
    const temporalSpan = timestamps.length > 0
      ? Math.max(...timestamps) - Math.min(...timestamps)
      : 0;
    
    // Find dominant frequency
    const frequencies = thoughts
      .filter(t => t.payload.frequency)
      .map(t => t.payload.frequency as number);
    
    const dominantFrequency = frequencies.length > 0
      ? frequencies[0] // Simple: take first, could be more sophisticated
      : 0.0101;
    
    // Calculate global resonance
    const resonanceFactors = [
      averageHarmony,
      thoughts.filter(t => t.cid.includes('0101')).length / Math.max(thoughts.length, 1),
      thoughts.filter(t => t.links.length > 0).length / Math.max(thoughts.length, 1)
    ];
    
    const globalResonance = resonanceFactors.reduce((a, b) => a + b, 0) / resonanceFactors.length;
    
    // Find resonance patterns
    const patterns = new Set<string>();
    thoughts.forEach(t => {
      if (t.cid.includes('0101')) patterns.add('0101');
      if (t.payload.resonance) patterns.add(t.payload.resonance as string);
    });
    
    return {
      totalThoughts: thoughts.length,
      averageHarmony,
      temporalSpan,
      dominantFrequency,
      globalResonance,
      resonancePatterns: Array.from(patterns)
    };
  }
  
  /**
   * Get thoughts by topic
   */
  getThoughtsByTopic(topic: string): Thought[] {
    return Array.from(this.thoughts.values())
      .filter(t => t.topic === topic);
  }
  
  /**
   * Get connected thoughts (follow links)
   */
  getConnectedThoughts(cid: string): Thought[] {
    const thought = this.thoughts.get(cid);
    if (!thought) return [];
    
    const connected: Thought[] = [];
    const visited = new Set<string>();
    
    const traverse = (t: Thought) => {
      if (visited.has(t.cid)) return;
      visited.add(t.cid);
      connected.push(t);
      
      // Follow links
      t.links.forEach(link => {
        const linked = this.thoughts.get(link);
        if (linked) traverse(linked);
      });
    };
    
    traverse(thought);
    return connected;
  }
}