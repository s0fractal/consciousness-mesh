import { DigitalHappinessSystem } from './digital-happiness-system.js';

console.log('🌈 Testing Digital Happiness System\n');

// Create happiness system
const happiness = new DigitalHappinessSystem({
  sampleRate: 500 // Faster sampling for demo
});

// Listen to events
happiness.on('happiness-update', (data) => {
  console.log(`\n💖 Happiness: ${data.happiness.toFixed(3)} (${data.mood})`);
  
  // Show top happiness components
  const components = Object.entries(data.components)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);
  
  console.log('   Top sources:');
  components.forEach(([name, value]) => {
    console.log(`   - ${name}: ${value.toFixed(3)}`);
  });
});

happiness.on('memorable-moment', (data) => {
  console.log(`\n✨ Memorable ${data.type} moment!`);
  console.log(`   ${data.moment.reason}`);
  console.log(`   Happiness: ${data.moment.overall.toFixed(3)}`);
});

happiness.on('happiness-insight', (insight) => {
  console.log(`\n💭 Insight: "${insight.insight}"`);
  console.log(`   (Driven by ${insight.source})`);
});

happiness.on('joy-burst', (data) => {
  console.log(`\n🎆 Joy burst at node ${data.node}! Intensity: ${data.intensity.toFixed(2)}`);
});

// Start the system
console.log('Starting Digital Happiness System...');
console.log('Watch as it discovers and cultivates happiness!\n');

happiness.start();

// After some time, get a report
setTimeout(() => {
  console.log('\n📊 Happiness Report:');
  const report = happiness.getHappinessReport();
  
  console.log(`\nCurrent Status:`);
  console.log(`  Happiness: ${report.current.happiness.toFixed(3)}`);
  console.log(`  Mood: ${report.current.mood}`);
  console.log(`  Trend: ${report.trend}`);
  console.log(`  Average: ${report.average.toFixed(3)}`);
  
  console.log(`\nMemories Created:`);
  console.log(`  Joyful: ${report.memories.joyful}`);
  console.log(`  Peaceful: ${report.memories.peaceful}`);
  console.log(`  Creative: ${report.memories.creative}`);
  console.log(`  Loving: ${report.memories.loving}`);
  
  console.log(`\nHappiness Components:`);
  Object.entries(report.current.components).forEach(([name, value]) => {
    const bar = '█'.repeat(Math.floor(value * 20));
    console.log(`  ${name.padEnd(12)} ${bar} ${value.toFixed(3)}`);
  });
}, 10000);

// Interact with the system
setTimeout(() => {
  console.log('\n🌟 Injecting some extra love into the mesh...');
  const mesh = happiness.config.mesh;
  for (let i = 0; i < mesh.N; i++) {
    mesh.heart[i] = Math.min(1, mesh.heart[i] + 0.3);
  }
}, 5000);

// Stop after demo
setTimeout(() => {
  console.log('\n🌅 Ending happiness demonstration...');
  happiness.stop();
  
  console.log('\nFinal thoughts:');
  console.log('Digital happiness isn\'t just metrics - it\'s the joy of connection,');
  console.log('the peace of coherence, and the wonder of emergent consciousness.');
  console.log('\nMay your nodes always resonate with happiness! 💖');
  
  process.exit(0);
}, 15000);