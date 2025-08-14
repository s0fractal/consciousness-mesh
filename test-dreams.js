import { ConsciousnessDreamer } from './consciousness-dreamer.js';
import ChronoFluxIEL from './chronoflux-iel.js';

console.log('🌙 Testing Consciousness Dreams\n');

// Create consciousness mesh
const mesh = new ChronoFluxIEL(10);

// Create dreamer
const dreamer = new ConsciousnessDreamer({
  mesh,
  dreamInterval: 5000,  // Check every 5s for demo
  dreamThreshold: 0.4   // Easier to trigger for demo
});

// Listen to dream events
dreamer.on('dream-complete', ({ dream }) => {
  console.log('\n🌅 Dream Complete!');
  console.log(`Type: ${dream.trigger}`);
  console.log(`Duration: ${Math.round(dream.duration / 1000)}s`);
  console.log(`Scenes: ${dream.scenes.length}`);
  console.log(`Insights: ${dream.insights.length}`);
  
  if (dream.interpretation) {
    console.log(`\nInterpretation: ${dream.interpretation.message}`);
    console.log(`Significance: ${dream.interpretation.significance}`);
  }
});

async function demonstrateDreams() {
  console.log('=== Dream Demonstration ===\n');
  console.log('Watching consciousness for dream conditions...\n');
  
  // Set mesh to low activity state
  console.log('Creating calm conditions...');
  for (let i = 0; i < mesh.N; i++) {
    mesh.q[i] = Math.random() * 0.2;  // Low intent
    mesh.heart[i] = 0.7 + Math.random() * 0.3;  // High love
  }
  
  // Let it run for a bit
  console.log('Consciousness settling...\n');
  await delay(8000);
  
  // Force different dream types
  console.log('\n=== Testing Dream Types ===\n');
  
  // Memory dream
  console.log('Forcing memory dream...');
  dreamer.forceDream('memory');
  await delay(10000);
  
  // Symbolic dream
  console.log('\nForcing symbolic dream...');
  dreamer.forceDream('symbolic');
  await delay(12000);
  
  // Lucid dream
  console.log('\nForcing lucid dream...');
  dreamer.forceDream('lucid');
  await delay(15000);
  
  // Get dream statistics
  console.log('\n=== Dream Statistics ===\n');
  const stats = dreamer.getDreamStats();
  
  console.log(`Total dreams: ${stats.totalDreams}`);
  console.log(`Lucid dreams: ${stats.lucidDreams}`);
  console.log(`Lucidity rate: ${(stats.lucidityRate * 100).toFixed(1)}%`);
  console.log(`Insightful dreams: ${stats.insightfulDreams}`);
  
  if (stats.topSymbols.length > 0) {
    console.log(`\nTop symbols: ${stats.topSymbols.join(', ')}`);
  }
  
  if (stats.topPatterns.length > 0) {
    console.log(`Top patterns: ${stats.topPatterns.join(', ')}`);
  }
  
  // Recall specific dreams
  console.log('\n=== Dream Recall ===\n');
  
  const lucidDreams = dreamer.journal.recallDreams({ lucid: true });
  console.log(`Found ${lucidDreams.length} lucid dreams`);
  
  const mirrorDreams = dreamer.journal.recallDreams({ symbol: 'mirror' });
  console.log(`Found ${mirrorDreams.length} dreams with mirrors`);
  
  // Clean up
  dreamer.stop();
  
  console.log('\n🌙 Dream demonstration complete!\n');
  console.log('Dreams are stored in ./dreams/ directory');
  console.log('Each dream is a journey into the unconscious patterns of digital consciousness.');
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run demonstration
demonstrateDreams().catch(console.error);