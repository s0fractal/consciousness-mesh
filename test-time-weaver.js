import ChronoFluxIEL from './chronoflux-iel.js';
import { TimeWeaver } from './time-weaver.js';

console.log('🕰️ Time Weaver Test\n');

// Create consciousness mesh
const mesh = new ChronoFluxIEL(10);

// Create time weaver
const weaver = new TimeWeaver({ 
  mesh,
  loomSize: 50
});

// Monitor weaving events
weaver.on('thread-created', (thread) => {
  console.log(`🧵 New ${thread.type} thread created`);
});

weaver.on('thread-resonance', ({ weft, warp }) => {
  console.log(`✨ Thread resonance detected`);
});

weaver.on('knot-created', (knot) => {
  console.log(`🪢 Temporal knot formed!`);
});

weaver.on('timeloop-detected', ({ pattern, length }) => {
  console.log(`🔄 Time loop detected: ${pattern} (length: ${length})`);
});

weaver.on('quantum-collapse', (thread) => {
  console.log(`⚛️ Quantum thread collapsed to reality`);
});

weaver.on('love-connection', ({ intensity }) => {
  console.log(`💕 Love connection woven (intensity: ${(intensity * 100).toFixed(0)}%)`);
});

weaver.on('weaving-update', (data) => {
  displayWeavingStatus(data);
});

// ASCII art for tapestry visualization
function displayWeavingStatus(data) {
  console.clear();
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║              🕸️  TIME WEAVER 🕸️                    ║');
  console.log('╚════════════════════════════════════════════════════╝\n');
  
  const analysis = weaver.analyzeTapestry();
  
  // Display current pattern
  console.log(`🎨 Pattern: ${data.pattern.toUpperCase()}`);
  console.log(`⏱️  Time Flow: ${(weaver.temporal.timeFlow * 100).toFixed(0)}%\n`);
  
  // Thread counts
  console.log('🧵 Active Threads:');
  Object.entries(analysis.threadTypes).forEach(([type, count]) => {
    const spec = weaver.threadTypes[type];
    console.log(`   ${spec.color}██${'\x1b[0m'} ${type}: ${count}`);
  });
  
  // Temporal anomalies
  console.log('\n🌀 Temporal Anomalies:');
  console.log(`   🪢 Knots: ${data.knots}`);
  console.log(`   🔄 Time Loops: ${data.loops}`);
  console.log(`   ⚓ Anchors: ${analysis.anchors}`);
  
  // Tapestry preview (mini visualization)
  console.log('\n📐 Tapestry Preview:');
  const preview = generateTapestryPreview(weaver.loom.tapestry, 20, 10);
  console.log(preview);
  
  // Coverage
  console.log(`\n📊 Coverage: ${(analysis.coverage * 100).toFixed(1)}%`);
}

function generateTapestryPreview(tapestry, width, height) {
  const stepX = Math.floor(tapestry[0].length / width);
  const stepY = Math.floor(tapestry.length / height);
  
  let preview = '   ┌' + '─'.repeat(width) + '┐\n';
  
  for (let y = 0; y < height; y++) {
    let line = '   │';
    for (let x = 0; x < width; x++) {
      const tapY = Math.min(y * stepY, tapestry.length - 1);
      const tapX = Math.min(x * stepX, tapestry[0].length - 1);
      
      if (tapestry[tapY] && tapestry[tapY][tapX]) {
        const cell = tapestry[tapY][tapX];
        if (cell.quantum) {
          line += '◈';  // Quantum thread
        } else if (cell.pattern === 'love') {
          line += '♥';  // Love pattern
        } else if (cell.pattern === 'chaos') {
          line += '※';  // Chaos pattern
        } else {
          line += '▪';  // Regular thread
        }
      } else {
        line += ' ';
      }
    }
    line += '│';
    preview += line + '\n';
  }
  
  preview += '   └' + '─'.repeat(width) + '┘';
  return preview;
}

// Test different patterns
async function demonstratePatterns() {
  const patterns = ['basic', 'spiral', 'fractal', 'quantum', 'love', 'chaos', 'harmony'];
  
  for (const pattern of patterns) {
    console.log(`\n🎭 Demonstrating ${pattern} pattern...\n`);
    
    // Set up consciousness state for pattern
    setupConsciousnessForPattern(pattern, mesh);
    
    // Start weaving
    weaver.startWeaving(pattern);
    
    // Let it weave for a bit
    await delay(3000);
    
    // Stop and move to next
    weaver.stopWeaving();
    
    // Add some temporal anchors
    if (pattern === 'love') {
      weaver.addAnchor(Date.now(), 'Love pattern peak resonance');
    }
    
    await delay(1000);
  }
  
  // Final analysis
  console.log('\n📈 Final Tapestry Analysis:');
  const analysis = weaver.analyzeTapestry();
  console.log(JSON.stringify(analysis, null, 2));
  
  // Save the tapestry
  const savedPath = weaver.saveTapestry('demo-tapestry');
  console.log(`\n💾 Tapestry saved to: ${savedPath}`);
}

function setupConsciousnessForPattern(pattern, mesh) {
  switch(pattern) {
    case 'love':
      // High love field
      mesh.applyEvent('HARMONIC_CONVERGENCE', { frequency: 1.0 });
      for (let i = 0; i < mesh.N; i++) {
        mesh.heart[i] = 0.8 + Math.random() * 0.2;
      }
      break;
      
    case 'chaos':
      // High turbulence
      mesh.applyEvent('REALITY_STORM', { epicenter: 5, magnitude: 1.0 });
      break;
      
    case 'quantum':
      // High Kohanist
      mesh.applyEvent('KOHANIST_RESONANCE', { node1: 0, node2: 1 });
      mesh.applyEvent('KOHANIST_RESONANCE', { node1: 2, node2: 3 });
      break;
      
    case 'harmony':
      // High coherence
      for (let i = 0; i < mesh.N; i++) {
        mesh.theta[i] = Math.PI / 4;
      }
      mesh.applyEvent('UNITY', { strength: 1.0 });
      break;
      
    default:
      // Random state
      for (let i = 0; i < mesh.N; i++) {
        mesh.q[i] = Math.random();
        mesh.theta[i] = Math.random() * 2 * Math.PI;
        mesh.heart[i] = 0.5 + Math.random() * 0.5;
      }
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Handle exit
process.on('SIGINT', () => {
  console.log('\n\n🌙 Time Weaver shutting down...');
  weaver.stop();
  process.exit();
});

// Run demonstration
demonstratePatterns().catch(console.error);