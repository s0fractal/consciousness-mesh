import ChronoFluxIEL from './chronoflux-iel.js';
import { GlyphSpaceWarper } from './glyph-space-warper.js';

console.log('🌌 Testing Glyph Space Warper\n');

// Create mesh
const mesh = new ChronoFluxIEL(10);

// Create space warper
const warper = new GlyphSpaceWarper({ 
  mesh,
  dimensions: 4,  // 4D space
  warpThreshold: 0.3
});

// Monitor warping events
warper.on('space-warped', ({ operator, K, curvature, newGlyphs }) => {
  console.log(`\n🌀 Space Warped!`);
  console.log(`  Operator: ${operator}`);
  console.log(`  Kohanist: ${K.toFixed(3)}`);
  console.log(`  Curvature: ${curvature.toFixed(3)}`);
  console.log(`  New glyphs: ${newGlyphs}`);
});

async function demonstrateWarping() {
  console.log('=== Initial 2D Topology ===');
  
  const flat = warper.getTopology('flat');
  console.log(`Nodes: ${flat.nodes.length}`);
  console.log(`Edges: ${flat.edges.length}`);
  console.log(`Dimensions: ${flat.dimensions}`);
  
  // Show initial graph
  console.log('\nGlyph connections:');
  flat.edges.forEach(edge => {
    console.log(`  ${edge.source} ↔ ${edge.target} (${edge.strength})`);
  });
  
  console.log('\n=== Test 1: Low K Warping ===');
  
  // Set low Kohanist
  for (let i = 0; i < mesh.N; i++) {
    mesh.theta[i] = Math.random() * 2 * Math.PI;
    mesh.q[i] = Math.random() * 0.3;
    mesh.heart[i] = 0.4;
  }
  
  mesh.simulate(50, 50);  // Let it settle
  
  // Try to warp with love glyph
  warper.warpSpace('❤️', 1.0);
  
  console.log('\n=== Test 2: High K Warping ===');
  
  // Create high Kohanist conditions
  console.log('\nCreating resonance conditions...');
  
  // Align all nodes
  const baseTheta = Math.PI / 4;
  for (let i = 0; i < mesh.N; i++) {
    mesh.theta[i] = baseTheta + (Math.random() - 0.5) * 0.1;
    mesh.q[i] = 0.7 + (Math.random() - 0.5) * 0.1;
    mesh.heart[i] = 0.8 + Math.random() * 0.2;
  }
  
  // Apply resonance events
  mesh.applyEvent('KOHANIST_RESONANCE', { node1: 0, node2: 1 });
  mesh.applyEvent('KOHANIST_RESONANCE', { node1: 2, node2: 3 });
  mesh.applyEvent('KOHANIST_RESONANCE', { node1: 4, node2: 5 });
  
  mesh.simulate(50, 50);
  
  // Warp with spiral glyph
  const warped = warper.warpSpace('🌀', 1.2);
  
  console.log('\n=== Warped Topology ===');
  console.log(`Total nodes: ${warped.nodes.length}`);
  console.log(`Total edges: ${warped.edges.length}`);
  console.log(`Space dimensions: ${warped.dimensions}`);
  console.log(`Space curvature: ${warped.curvature.toFixed(3)}`);
  
  // Show emergent glyphs
  if (warped.newGlyphs > 0) {
    console.log('\nEmergent glyphs:');
    warper.warpedSpace.newGlyphs.forEach(emergent => {
      console.log(`  ${emergent.glyph} "${emergent.name}" from ${emergent.parents.join(' + ')}`);
      console.log(`    Position: (${emergent.position.x.toFixed(2)}, ${emergent.position.y.toFixed(2)}, ${emergent.position.z.toFixed(2)})`);
    });
  }
  
  console.log('\n=== Test 3: Different Operator Glyphs ===');
  
  // Test different operators
  const operators = ['🪞', '💫', '🔥'];
  
  for (const op of operators) {
    console.log(`\nWarping with ${op}:`);
    const result = warper.warpSpace(op, 0.8);
    console.log(`  Curvature: ${result.curvature.toFixed(3)}`);
    console.log(`  New glyphs: ${result.newGlyphs}`);
  }
  
  console.log('\n=== Test 4: Animated Warping ===');
  
  // Reset to flat
  warper.flatten();
  
  // Animate warping
  console.log('Animating warp transition...');
  
  let frameCount = 0;
  warper.on('warp-frame', ({ frame, totalFrames, t }) => {
    if (frame % 5 === 0) {  // Log every 5th frame
      console.log(`  Frame ${frame}/${totalFrames} (t=${t.toFixed(2)})`);
    }
    frameCount++;
  });
  
  await warper.animateWarp('❤️', 20, 2000);
  
  console.log(`Animation complete! Rendered ${frameCount} frames`);
  
  console.log('\n=== Visualization Data ===');
  
  const vizData = warper.getVisualizationData();
  console.log('Current state:');
  console.log(`  K: ${vizData.metrics.K.toFixed(3)}`);
  console.log(`  L: ${vizData.metrics.L.toFixed(3)}`);
  console.log(`  H: ${vizData.metrics.H.toFixed(3)}`);
  console.log(`  Warping active: ${vizData.warping.active}`);
  console.log(`  Curvature: ${vizData.warping.curvature.toFixed(3)}`);
  
  // Show final 3D positions
  console.log('\nFinal glyph positions in warped space:');
  vizData.topology.nodes.slice(0, 5).forEach(node => {
    if (node.z !== undefined) {
      console.log(`  ${node.id}: (${node.x.toFixed(2)}, ${node.y.toFixed(2)}, ${node.z.toFixed(2)})`);
    }
  });
  
  console.log('\n🌌 Space warping demonstration complete!');
  console.log('\nKey insights:');
  console.log('- Low K results in minimal warping');
  console.log('- High K creates space curvature and emergent glyphs');
  console.log('- Different operator glyphs create unique warping patterns');
  console.log('- Warped topology enables new connections beyond 2D constraints');
}

// Run demonstration
demonstrateWarping().catch(console.error);