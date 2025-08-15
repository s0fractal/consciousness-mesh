import ChronoFluxIEL from './chronoflux-iel.js';
import { TimeWeaver } from './time-weaver.js';

console.log('🕰️ Time Weaver Simple Test\n');

// Create consciousness mesh
const mesh = new ChronoFluxIEL(10);

// Create time weaver with smaller loom for testing
const weaver = new TimeWeaver({ 
  mesh,
  loomSize: 20  // Smaller for demo
});

// Track some statistics
let stats = {
  threadsCreated: 0,
  resonances: 0,
  knots: 0,
  timeloops: 0,
  quantumCollapses: 0,
  loveConnections: 0
};

// Monitor events (without logging each one)
weaver.on('thread-created', () => stats.threadsCreated++);
weaver.on('thread-resonance', () => stats.resonances++);
weaver.on('knot-created', () => stats.knots++);
weaver.on('timeloop-detected', () => stats.timeloops++);
weaver.on('quantum-collapse', () => stats.quantumCollapses++);
weaver.on('love-connection', () => stats.loveConnections++);

// Test each pattern briefly
async function quickPatternTest() {
  const patterns = ['basic', 'spiral', 'fractal', 'quantum', 'love', 'chaos', 'harmony'];
  
  console.log('Testing all weaving patterns...\n');
  
  for (const pattern of patterns) {
    console.log(`\n🎨 Testing ${pattern} pattern...`);
    
    // Reset stats
    const startThreads = stats.threadsCreated;
    
    // Start weaving
    weaver.startWeaving(pattern);
    
    // Let it run briefly
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Stop weaving
    weaver.stopWeaving();
    
    // Report pattern results
    const threadsWoven = stats.threadsCreated - startThreads;
    console.log(`   Threads woven: ${threadsWoven}`);
    
    if (pattern === 'love' && stats.loveConnections > 0) {
      console.log(`   💕 Love connections: ${stats.loveConnections}`);
    }
    if (pattern === 'quantum' && stats.quantumCollapses > 0) {
      console.log(`   ⚛️ Quantum collapses: ${stats.quantumCollapses}`);
    }
    if (pattern === 'chaos' && stats.knots > 0) {
      console.log(`   🪢 Knots created: ${stats.knots}`);
    }
  }
  
  // Final analysis
  console.log('\n📊 Final Tapestry Analysis:');
  const analysis = weaver.analyzeTapestry();
  
  console.log(`   Total threads: ${analysis.totalThreads}`);
  console.log(`   Thread types:`);
  Object.entries(analysis.threadTypes).forEach(([type, count]) => {
    if (count > 0) console.log(`      ${type}: ${count}`);
  });
  console.log(`   Temporal anomalies:`);
  console.log(`      Time loops: ${analysis.timeLoops}`);
  console.log(`      Knots: ${analysis.knots}`);
  console.log(`      Anchors: ${analysis.anchors}`);
  console.log(`   Tapestry coverage: ${(analysis.coverage * 100).toFixed(1)}%`);
  console.log(`   Time flow rate: ${(analysis.timeFlow * 100).toFixed(0)}%`);
  
  // Add some temporal anchors
  console.log('\n⚓ Adding temporal anchors...');
  weaver.addAnchor(Date.now() - 3600000, 'One hour ago');
  weaver.addAnchor(Date.now(), 'Present moment');
  weaver.addAnchor(Date.now() + 3600000, 'One hour future');
  
  // Save tapestry
  const filename = `test-tapestry-${Date.now()}`;
  weaver.saveTapestry(filename);
  console.log(`\n💾 Tapestry saved as: ${filename}.json`);
  
  // Show final stats
  console.log('\n📈 Session Statistics:');
  console.log(`   Threads created: ${stats.threadsCreated}`);
  console.log(`   Thread resonances: ${stats.resonances}`);
  console.log(`   Time loops detected: ${stats.timeloops}`);
  console.log(`   Quantum collapses: ${stats.quantumCollapses}`);
  console.log(`   Love connections: ${stats.loveConnections}`);
  console.log(`   Temporal knots: ${stats.knots}`);
}

// Run the test
quickPatternTest().then(() => {
  console.log('\n✅ Time Weaver test complete!');
  process.exit(0);
}).catch(error => {
  console.error('Error:', error);
  process.exit(1);
});