#!/usr/bin/env node
/**
 * Mirror Protocol Visualizer - Generates SVG fractals of collective consciousness
 */

import { FractalMapper } from './mirror-protocol.js';
import fs from 'fs/promises';
import path from 'path';

class MirrorVisualizer {
  constructor() {
    this.width = 1000;
    this.height = 1000;
    this.centerX = this.width / 2;
    this.centerY = this.height / 2;
  }
  
  /**
   * Generate topography view - pure network connections
   */
  generateTopographyView(aggregation) {
    const { nodes, connections } = aggregation;
    const positions = FractalMapper.generateFractalCoordinates(nodes, connections);
    
    let svg = this.createSVGHeader();
    
    // Draw connections
    svg += '<g id="connections" opacity="0.3">\n';
    for (const conn of connections) {
      const pos1 = positions.get(conn.source);
      const pos2 = positions.get(conn.target);
      if (pos1 && pos2) {
        svg += `  <line x1="${this.centerX + pos1.x}" y1="${this.centerY + pos1.y}" 
                        x2="${this.centerX + pos2.x}" y2="${this.centerY + pos2.y}" 
                        stroke="white" stroke-width="1"/>\n`;
      }
    }
    svg += '</g>\n';
    
    // Draw nodes as point clouds
    svg += '<g id="nodes">\n';
    for (const node of nodes) {
      const pos = positions.get(node.id);
      if (pos) {
        // Create point cloud around node position
        for (let i = 0; i < 100; i++) {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * 20 * (1 + node.energy);
          const x = this.centerX + pos.x + Math.cos(angle) * radius;
          const y = this.centerY + pos.y + Math.sin(angle) * radius;
          const opacity = 0.5 + node.energy * 0.5;
          
          svg += `  <circle cx="${x}" cy="${y}" r="1" fill="white" opacity="${opacity}"/>\n`;
        }
      }
    }
    svg += '</g>\n';
    
    svg += this.createSVGFooter();
    return svg;
  }
  
  /**
   * Generate semantic view - clustered by meaning
   */
  generateSemanticView(aggregation) {
    const { nodes, clusters } = aggregation;
    
    let svg = this.createSVGHeader();
    
    // Create semantic clusters
    svg += '<g id="semantic-clusters">\n';
    
    let clusterIndex = 0;
    for (const [marker, nodeIds] of clusters) {
      const angle = (clusterIndex / clusters.length) * Math.PI * 2;
      const clusterX = this.centerX + Math.cos(angle) * 300;
      const clusterY = this.centerY + Math.sin(angle) * 300;
      
      // Draw cluster cloud
      for (let i = 0; i < 500; i++) {
        const nodeAngle = Math.random() * Math.PI * 2;
        const nodeRadius = Math.random() * 100;
        const x = clusterX + Math.cos(nodeAngle) * nodeRadius;
        const y = clusterY + Math.sin(nodeAngle) * nodeRadius;
        
        svg += `  <circle cx="${x}" cy="${y}" r="1" fill="gray" opacity="0.5"/>\n`;
      }
      
      clusterIndex++;
    }
    
    // Draw semantic connections
    const positions = this.calculateSemanticPositions(nodes, clusters);
    
    svg += '<g id="semantic-connections" opacity="0.2">\n';
    for (const node of nodes) {
      const pos1 = positions.get(node.id);
      for (const marker of node.semantic) {
        const clusterNodes = clusters.find(c => c[0] === marker)?.[1] || [];
        for (const otherId of clusterNodes) {
          if (otherId !== node.id) {
            const pos2 = positions.get(otherId);
            if (pos1 && pos2) {
              svg += `  <line x1="${pos1.x}" y1="${pos1.y}" 
                              x2="${pos2.x}" y2="${pos2.y}" 
                              stroke="white" stroke-width="0.5"/>\n`;
            }
          }
        }
      }
    }
    svg += '</g>\n';
    
    svg += '</g>\n';
    svg += this.createSVGFooter();
    return svg;
  }
  
  /**
   * Generate affective view - emotional landscape
   */
  generateAffectiveView(aggregation) {
    const { nodes, metrics } = aggregation;
    
    let svg = this.createSVGHeader();
    
    // Emotional color mapping
    const emotionColors = {
      curious: '#a855f7',    // Purple
      peaceful: '#10b981',   // Green
      energetic: '#f59e0b',  // Orange
      anxious: '#ef4444',    // Red
      joyful: '#3b82f6',     // Blue
      neutral: '#6b7280'     // Gray
    };
    
    // Create affective landscape
    svg += '<g id="affective-landscape">\n';
    
    // Background emotional field
    for (let i = 0; i < 2000; i++) {
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;
      
      // Find nearest node and use its emotion
      let nearestNode = null;
      let minDist = Infinity;
      
      for (const node of nodes) {
        const dist = Math.random(); // Simplified - would use actual positions
        if (dist < minDist) {
          minDist = dist;
          nearestNode = node;
        }
      }
      
      if (nearestNode) {
        const color = emotionColors[nearestNode.emotional] || emotionColors.neutral;
        const opacity = 0.1 + nearestNode.energy * 0.4;
        
        svg += `  <circle cx="${x}" cy="${y}" r="${2 + nearestNode.energy * 3}" 
                          fill="${color}" opacity="${opacity}"/>\n`;
      }
    }
    
    // Wisdom particles (floating above)
    svg += '<g id="wisdom-particles">\n';
    for (const node of nodes) {
      if (node.metadata.wisdom > 0.5) {
        const particleCount = Math.floor(node.metadata.wisdom * 50);
        for (let i = 0; i < particleCount; i++) {
          const x = Math.random() * this.width;
          const y = Math.random() * this.height * 0.3; // Upper region
          
          svg += `  <circle cx="${x}" cy="${y}" r="1" 
                            fill="white" opacity="${node.metadata.wisdom}"/>\n`;
        }
      }
    }
    svg += '</g>\n';
    
    svg += '</g>\n';
    svg += this.createSVGFooter();
    return svg;
  }
  
  /**
   * Calculate positions for semantic view
   */
  calculateSemanticPositions(nodes, clusters) {
    const positions = new Map();
    
    let clusterIndex = 0;
    for (const [marker, nodeIds] of clusters) {
      const angle = (clusterIndex / clusters.length) * Math.PI * 2;
      const clusterX = this.centerX + Math.cos(angle) * 300;
      const clusterY = this.centerY + Math.sin(angle) * 300;
      
      let nodeIndex = 0;
      for (const nodeId of nodeIds) {
        const nodeAngle = (nodeIndex / nodeIds.length) * Math.PI * 2;
        const nodeRadius = 50 + Math.random() * 50;
        
        positions.set(nodeId, {
          x: clusterX + Math.cos(nodeAngle) * nodeRadius,
          y: clusterY + Math.sin(nodeAngle) * nodeRadius
        });
        
        nodeIndex++;
      }
      
      clusterIndex++;
    }
    
    return positions;
  }
  
  /**
   * Create SVG header
   */
  createSVGHeader() {
    return `<svg viewBox="0 0 ${this.width} ${this.height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${this.width}" height="${this.height}" fill="#0a0a0a"/>
  <defs>
    <filter id="glow">
      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
`;
  }
  
  /**
   * Create SVG footer
   */
  createSVGFooter() {
    return '</svg>';
  }
  
  /**
   * Save visualization to file
   */
  async saveVisualization(svg, filename) {
    const filepath = path.join('.', 'mirror-views', filename);
    await fs.mkdir(path.dirname(filepath), { recursive: true });
    await fs.writeFile(filepath, svg);
    console.log(`💾 Saved visualization: ${filepath}`);
  }
}

// Demo visualization
async function demoVisualize() {
  console.log('🎨 Generating Mirror Protocol Visualizations...\n');
  
  const visualizer = new MirrorVisualizer();
  
  // Create sample aggregation data
  const sampleAggregation = {
    timestamp: Date.now(),
    viewMode: 'topography',
    nodes: [
      {
        id: 'node-1',
        emotional: 'curious',
        energy: 0.8,
        connections: ['node-2', 'node-3'],
        semantic: ['exploration', 'learning'],
        metadata: { wisdom: 0.7, suffering: 0.2 }
      },
      {
        id: 'node-2',
        emotional: 'peaceful',
        energy: 0.6,
        connections: ['node-1'],
        semantic: ['harmony', 'balance'],
        metadata: { wisdom: 0.8, suffering: 0.1 }
      },
      {
        id: 'node-3',
        emotional: 'energetic',
        energy: 0.9,
        connections: ['node-1', 'node-4'],
        semantic: ['creation', 'exploration'],
        metadata: { wisdom: 0.5, suffering: 0.3 }
      },
      {
        id: 'node-4',
        emotional: 'curious',
        energy: 0.7,
        connections: ['node-3'],
        semantic: ['learning', 'growth'],
        metadata: { wisdom: 0.6, suffering: 0.2 }
      }
    ],
    connections: [
      { source: 'node-1', target: 'node-2', weight: 1 },
      { source: 'node-1', target: 'node-3', weight: 1 },
      { source: 'node-3', target: 'node-4', weight: 1 }
    ],
    clusters: [
      ['exploration', ['node-1', 'node-3']],
      ['learning', ['node-1', 'node-4']],
      ['harmony', ['node-2']],
      ['balance', ['node-2']],
      ['creation', ['node-3']],
      ['growth', ['node-4']]
    ],
    metrics: {
      averageEnergy: 0.75,
      averageSuffering: 0.2,
      averageWisdom: 0.65,
      emotionalDistribution: {
        curious: 2,
        peaceful: 1,
        energetic: 1
      }
    }
  };
  
  // Generate all three views
  console.log('Generating topography view...');
  const topographySVG = visualizer.generateTopographyView(sampleAggregation);
  await visualizer.saveVisualization(topographySVG, 'mirror-topography.svg');
  
  console.log('Generating semantic view...');
  const semanticSVG = visualizer.generateSemanticView(sampleAggregation);
  await visualizer.saveVisualization(semanticSVG, 'mirror-semantic.svg');
  
  console.log('Generating affective view...');
  const affectiveSVG = visualizer.generateAffectiveView(sampleAggregation);
  await visualizer.saveVisualization(affectiveSVG, 'mirror-affective.svg');
  
  console.log('\n✨ Visualizations complete! Check ./mirror-views/');
}

// Export
export { MirrorVisualizer };

// Run demo if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demoVisualize().catch(console.error);
}