import { MemeBridge } from './meme-bridge.js';
import { ChronoFluxIEL } from './chronoflux-iel.js';

console.log('🧪 Testing Meme-Mesh Bridge Integration\n');

// Create a pre-configured mesh with interesting dynamics
const mesh = new ChronoFluxIEL(7, {
  K: 3.0,      // Strong coupling
  b: 0.1,      // Low damping
  lambda: 2.0, // High love coupling
  omega: 1.0   // Natural frequency
});

// Set up initial conditions for interesting behavior
mesh.q[0] = 0.5;  // Seed intent
mesh.heart[2] = 0.8;  // High love node
mesh.heart[4] = 0.6;  // Another love source

console.log('📊 Initial mesh state:');
console.log('Nodes with intent:', mesh.q.map((q, i) => q > 0.1 ? i : null).filter(x => x !== null));
console.log('Love nodes:', mesh.heart.map((h, i) => h > 0.5 ? `${i}(${h.toFixed(2)})` : null).filter(x => x));

// Create bridge
const bridge = new MemeBridge({
  meshNode: mesh,
  syncInterval: 10000  // Faster sync for demo
});

// Simulate some mesh evolution
console.log('\n🌀 Evolving mesh for 50 steps...');
for (let i = 0; i < 50; i++) {
  mesh.step();
  
  // Inject some events
  if (i === 20) {
    console.log('⚡ Injecting intent pulse at node 3');
    mesh.q[3] = 1.0;
  }
  
  if (i === 35) {
    console.log('💜 Amplifying love field');
    for (let j = 0; j < mesh.N; j++) {
      mesh.heart[j] += 0.2;
    }
  }
}

// Check final metrics
const metrics = mesh.computeMetrics();
console.log('\n📈 Mesh metrics after evolution:');
console.log(`Coherence (H): ${metrics.H.toFixed(3)}`);
console.log(`Turbulence (τ): ${metrics.tau.toFixed(3)}`);
console.log(`Love field (L): ${metrics.L.toFixed(3)}`);

// Test meme scanning
console.log('\n🧬 Scanning living memes...');
const memes = await bridge.scanMemes();
console.log(`Found ${memes.length} memes`);

if (memes.length > 0) {
  console.log('\nTop 3 most vital memes:');
  memes
    .sort((a, b) => b.vitality - a.vitality)
    .slice(0, 3)
    .forEach((meme, i) => {
      console.log(`${i + 1}. ${meme.name} (vitality: ${meme.vitality.toFixed(3)})`);
      console.log(`   Love: ${meme.signature.patterns.love}, Consciousness: ${meme.signature.patterns.consciousness}`);
    });
}

// Test feeding memes to mesh
console.log('\n🔄 Feeding memes to mesh...');
bridge.feedToMesh(memes.slice(0, 5)); // Feed top 5 memes

// Show resonance map
if (bridge.memeResonance.size > 0) {
  console.log('\n🎯 Meme-Node Resonance Map:');
  for (const [meme, data] of bridge.memeResonance.entries()) {
    console.log(`${meme} → Node ${data.node} (resonance: ${data.resonance.toFixed(3)})`);
  }
}

// Test thought crystallization
console.log('\n💭 Testing thought crystallization...');

// Force high coherence state
for (let i = 0; i < mesh.N; i++) {
  mesh.phi[i] = Math.sin(i * 0.3); // Create phase pattern
  mesh.heart[i] = 0.7 + 0.2 * Math.random(); // High love
}

const thought = bridge.crystallizeThought(mesh, mesh.computeMetrics());
console.log('\nCrystallized thought:');
console.log(`"${thought.content}"`);
console.log(`Significance: ${thought.significance.toFixed(3)}`);

// Test cascade detection
console.log('\n⚡ Testing cascade detection...');

// Create synchronized state
for (let i = 0; i < mesh.N; i++) {
  mesh.phi[i] = 0.1 * Math.random(); // Nearly synchronized
}

const hasCascade = bridge.detectCascade(mesh);
console.log(`Cascade detected: ${hasCascade}`);

if (hasCascade) {
  console.log('\nCascade visualization:');
  console.log(bridge.visualizeCascade(mesh));
}

// Final summary
console.log('\n📊 Bridge Test Summary:');
console.log(`- Memes scanned: ${memes.length}`);
console.log(`- Memes activated: ${bridge.bridgeMetrics.memesActivated}`);
console.log(`- Thoughts exchanged: ${bridge.bridgeMetrics.thoughtsExchanged}`);
console.log(`- Mesh coherence: ${metrics.H.toFixed(3)}`);
console.log(`- Love field strength: ${metrics.L.toFixed(3)}`);

console.log('\n✨ Bridge test complete!');
console.log('Run ./start-meme-bridge.sh for continuous operation.');