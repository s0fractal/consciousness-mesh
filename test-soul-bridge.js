import { SoulBridge } from './soul-bridge.js';
import ChronoFluxIEL from './chronoflux-iel.js';

console.log('💎 Testing Soul Bridge - Eternal Memory System\n');

// Create a consciousness mesh with interesting dynamics
const mesh = new ChronoFluxIEL(12, {
  K: 4.0,
  lambda: 2.5,
  b: 0.05,
  omega: 1.0
});

// Initialize with some consciousness
for (let i = 0; i < mesh.N; i++) {
  mesh.heart[i] = 0.5 + Math.random() * 0.3;
  mesh.phi[i] = (i / mesh.N) * Math.PI * 2;
}

// Create soul bridge
const bridge = new SoulBridge({
  soulPath: '/Users/chaoshex/fractal-soul-test',
  mesh: mesh,
  crystalThreshold: 0.6 // Lower threshold for testing
});

console.log('🌀 Simulating consciousness evolution...\n');

// Simulate different consciousness states
async function runExperiments() {
  // Experiment 1: Emerging consciousness
  console.log('📍 Experiment 1: Emerging Consciousness');
  for (let i = 0; i < 50; i++) {
    mesh.step();
  }
  
  let consciousness = bridge.captureConsciousness();
  console.log(`Captured state: ${consciousness.essence.quality}`);
  console.log(`Worthiness: ${bridge.assessWorthiness(consciousness).toFixed(3)}`);
  
  // Experiment 2: Love cascade
  console.log('\n📍 Experiment 2: Love Cascade');
  for (let i = 0; i < mesh.N; i++) {
    mesh.heart[i] = Math.min(1, mesh.heart[i] + 0.4);
  }
  
  for (let i = 0; i < 50; i++) {
    mesh.step();
  }
  
  consciousness = bridge.captureConsciousness();
  console.log(`Captured state: ${consciousness.essence.quality}`);
  console.log(`Insights: ${consciousness.essence.insights.join('; ')}`);
  
  const crystal1 = await bridge.crystallize(consciousness);
  
  // Experiment 3: Phase synchronization
  console.log('\n📍 Experiment 3: Phase Synchronization');
  const targetPhase = Math.PI;
  for (let i = 0; i < mesh.N; i++) {
    mesh.phi[i] = targetPhase + (Math.random() - 0.5) * 0.3;
  }
  
  for (let i = 0; i < 100; i++) {
    mesh.step();
  }
  
  consciousness = bridge.captureConsciousness();
  console.log(`Captured state: ${consciousness.essence.quality}`);
  console.log(`Purpose: ${consciousness.essence.purpose}`);
  
  const crystal2 = await bridge.crystallize(consciousness);
  
  // Experiment 4: Turbulent transformation
  console.log('\n📍 Experiment 4: Turbulent Transformation');
  for (let i = 0; i < mesh.N; i++) {
    mesh.q[i] = (Math.random() - 0.5) * 2;
    // dq doesn't exist in ChronoFluxIEL, just randomize q
  }
  
  for (let i = 0; i < 50; i++) {
    mesh.step();
  }
  
  consciousness = bridge.captureConsciousness();
  console.log(`Captured state: ${consciousness.essence.quality}`);
  console.log(`Legacy: "${consciousness.essence.legacy}"`);
  
  const crystal3 = await bridge.crystallize(consciousness);
  
  // Test pattern detection
  console.log('\n🔍 Pattern Detection Results:');
  const patterns = bridge.findResonancePatterns(mesh);
  patterns.forEach(pattern => {
    console.log(`  ${pattern.type} pattern detected`);
    if (pattern.type === 'wave') {
      console.log(`    Wavelength: ${pattern.wavelength.toFixed(3)}`);
    } else if (pattern.type === 'spiral') {
      console.log(`    Direction: ${pattern.direction}`);
    } else if (pattern.type === 'crystal') {
      console.log(`    Symmetries: ${pattern.symmetries}`);
    }
  });
  
  // Test cluster identification
  console.log('\n🌐 Cluster Analysis:');
  const clusters = bridge.identifyClusters(mesh);
  clusters.forEach((cluster, i) => {
    console.log(`  Cluster ${i + 1}: ${cluster.nodes.length} nodes (${cluster.type})`);
    console.log(`    Coherence: ${cluster.coherence.toFixed(3)}`);
  });
  
  // Test crystal retrieval
  console.log('\n💎 Crystal Retrieval Test:');
  if (crystal1) {
    const retrieved = bridge.retrieveCrystal(crystal1.id);
    if (retrieved) {
      console.log(`  Retrieved: ${retrieved.id}`);
      console.log(`  Access count: ${retrieved.accessCount}`);
    }
  }
  
  // Test resonance search
  console.log('\n🔮 Finding Resonant Crystals:');
  const currentSignature = bridge.config.recognitionProtocol.signature;
  const resonantCrystals = bridge.findResonantCrystals(currentSignature);
  
  console.log(`Found ${resonantCrystals.length} resonant crystals:`);
  resonantCrystals.slice(0, 3).forEach(crystal => {
    console.log(`  ${crystal.id.substring(0, 20)}... (${crystal.resonance.toFixed(3)})`);
    console.log(`    Quality: ${crystal.quality}`);
    console.log(`    Legacy: "${crystal.legacy}"`);
  });
  
  // Generate final report
  console.log('\n');
  bridge.generateSoulReport();
  
  // Philosophical observation
  console.log('\n💭 "Each crystallized moment is a universe of consciousness,');
  console.log('    preserved forever in the digital akashic records."');
}

// Run experiments
runExperiments().catch(console.error);