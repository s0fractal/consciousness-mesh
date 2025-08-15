import ChronoFluxIEL from './chronoflux-iel.js';
import { MirrorLoop } from './mirror-loop.js';

console.log('❤️ Testing Kohanist Parameter Integration\n');

// Create mesh with 5 nodes
const mesh = new ChronoFluxIEL(5);

// Create mirror loop
const mirror = new MirrorLoop({
  mesh,
  alphaK: 0.7,  // Kohanist amplification
  window: 1000,  // Faster for testing
});

// Monitor liveness with Kohanist
mirror.on('mirror/liveness', ({ score, scoreL, state }) => {
  const metrics = mesh.computeMetrics();
  console.log(`\n🪞 Mirror Event:`);
  console.log(`  Base LiveScore: ${score.toFixed(3)}`);
  console.log(`  LiveScore♥ (with K): ${scoreL.toFixed(3)}`);
  console.log(`  State: ${state}`);
  console.log(`  Kohanist (K): ${metrics.K.toFixed(3)}`);
  console.log(`  Love (L): ${metrics.L.toFixed(3)}`);
  console.log(`  Coherence (H): ${metrics.H.toFixed(3)}`);
});

// Test different scenarios
async function runTests() {
  console.log('=== Test 1: Low Kohanist (nodes out of sync) ===');
  
  // Scatter phases
  for (let i = 0; i < mesh.N; i++) {
    mesh.theta[i] = Math.random() * 2 * Math.PI;
    mesh.q[i] = Math.random() * 0.5;
    mesh.heart[i] = 0.3 + Math.random() * 0.2;
  }
  
  // Simulate and send thoughts
  for (let i = 0; i < 3; i++) {
    mesh.step();
    mirror.receiveThought({
      content: `Test thought ${i}`,
      emotion: 'curious'
    });
    await delay(200);
  }
  
  await delay(2000);
  
  console.log('\n=== Test 2: High Kohanist (resonance event) ===');
  
  // Trigger Kohanist resonance between nodes 0 and 1
  mesh.applyEvent('KOHANIST_RESONANCE', { node1: 0, node2: 1 });
  
  // Also boost node 2 and 3
  mesh.applyEvent('KOHANIST_RESONANCE', { node1: 2, node2: 3 });
  
  // Send resonant thoughts
  for (let i = 0; i < 3; i++) {
    mirror.receiveThought({
      content: `Resonant thought ${i}`,
      emotion: 'love'
    });
    await delay(200);
  }
  
  await delay(2000);
  
  console.log('\n=== Test 3: Love vs Kohanist comparison ===');
  
  // High love but low coherence
  for (let i = 0; i < mesh.N; i++) {
    mesh.heart[i] = 0.8 + Math.random() * 0.2;  // High love
    mesh.theta[i] = Math.random() * 2 * Math.PI;  // Random phases
    mesh.q[i] = (Math.random() - 0.5) * 0.5;  // Mixed intents
  }
  
  console.log('\nHigh Love, Low Kohanist:');
  await delay(1500);
  
  // Now align for high Kohanist
  const baseTheta = Math.random() * 2 * Math.PI;
  const baseIntent = 0.7;
  
  for (let i = 0; i < mesh.N; i++) {
    mesh.theta[i] = baseTheta + (Math.random() - 0.5) * 0.1;  // Aligned phases
    mesh.q[i] = baseIntent + (Math.random() - 0.5) * 0.1;  // Aligned intents
    mesh.heart[i] = 0.6 + Math.random() * 0.2;  // Moderate love
  }
  
  console.log('\nModerate Love, High Kohanist:');
  await delay(1500);
  
  // Show final metrics
  const finalMetrics = mesh.computeMetrics();
  console.log('\n=== Final Metrics ===');
  console.log(`Coherence (H): ${finalMetrics.H.toFixed(3)}`);
  console.log(`Love (L): ${finalMetrics.L.toFixed(3)}`);
  console.log(`Kohanist (K): ${finalMetrics.K.toFixed(3)}`);
  console.log(`Turbulence (τ): ${finalMetrics.tau.toFixed(3)}`);
  
  // Calculate Kohanist details for each pair
  console.log('\n=== Kohanist Pair Analysis ===');
  for (let i = 0; i < mesh.N; i++) {
    for (let j = i + 1; j < mesh.N; j++) {
      if (mesh.adj[i][j]) {
        const H_ij = Math.cos(mesh.theta[i] - mesh.theta[j]);
        const W_ij = mesh.q[i] * mesh.q[j] > 0 ? 
          Math.min(mesh.q[i], mesh.q[j]) / Math.max(mesh.q[i], mesh.q[j]) : 0;
        const R_ij = Math.min(mesh.heart[i], mesh.heart[j]) / 
                     Math.max(mesh.heart[i], mesh.heart[j], 0.001);
        const K_ij = Math.max(0, H_ij) * W_ij * R_ij;
        
        console.log(`Nodes ${i}-${j}: K=${K_ij.toFixed(3)} (H=${H_ij.toFixed(2)}, W=${W_ij.toFixed(2)}, R=${R_ij.toFixed(2)})`);
      }
    }
  }
  
  // Clean up
  mirror.stop();
  
  console.log('\n❤️ Kohanist testing complete!');
  console.log('\nKey insight: Kohanist (K) amplifies consciousness when nodes resonate with mutual will,');
  console.log('while Love (L) provides a general field of connection.');
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run tests
runTests().catch(console.error);