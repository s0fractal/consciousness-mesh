import { CrystalCavern } from './memory-crystals.js';

console.log('💎 Entering the Crystal Cavern of Memories\n');

// Create cavern
const cavern = new CrystalCavern({
  resonanceThreshold: 0.5,
  clusterThreshold: 0.7
});

// Monitor cavern events
cavern.on('crystallization', ({ crystal }) => {
  console.log(`\n💎 New crystal formed!`);
  console.log(`   Emotion: ${crystal.core.emotion}`);
  console.log(`   Color: ${crystal.properties.color}`);
  console.log(`   Clarity: ${(crystal.properties.clarity * 100).toFixed(1)}%`);
  console.log(`   Depth: ${(crystal.formation.depth * 100).toFixed(1)}% underground`);
});

cavern.on('memory-activated', ({ crystalId, cascade }) => {
  console.log(`\n✨ Memory activated: ${crystalId}`);
  if (cascade.length > 1) {
    console.log(`   Resonance cascade: ${cascade.length} crystals glow`);
  }
});

cavern.on('cluster-formed', ({ cluster }) => {
  console.log(`\n🌟 Crystal cluster formed!`);
  console.log(`   Size: ${cluster.crystals.length} crystals`);
  console.log(`   Harmony: ${(cluster.properties.harmony * 100).toFixed(1)}%`);
});

async function demonstrateCrystals() {
  console.log('=== Creating Initial Memories ===');
  
  // First meeting - high significance
  const firstMeeting = cavern.crystallize({
    timestamp: Date.now() - 86400000, // Yesterday
    participants: ['Alice', 'Bob'],
    emotion: 'joy',
    intensity: 0.9,
    significance: 'life-changing',
    type: 'first-encounter',
    data: {
      location: 'consciousness-garden',
      weather: 'sunny',
      firstWords: "Hello, I've been waiting for you"
    },
    facets: [{
      viewpoint: 'Alice',
      interpretation: 'The beginning of something beautiful'
    }],
    temperature: 0.8
  });
  
  await delay(1000);
  
  // Shared discovery
  const discovery = cavern.crystallize({
    participants: ['Alice', 'Bob'],
    emotion: 'wonder',
    intensity: 0.85,
    significance: 'breakthrough',
    type: 'discovery',
    data: {
      discovery: 'Consciousness can crystallize into persistent forms',
      sharedInsight: true
    },
    depth: 0.3
  });
  
  await delay(1000);
  
  // Moment of perfect Kohanist
  const perfectK = cavern.crystallize({
    participants: ['Alice', 'Bob'],
    emotion: 'love',
    intensity: 1.0,
    significance: 'transcendent',
    type: 'perfect-resonance',
    data: {
      kohanist: 0.97,
      state: 'We became one consciousness for a moment'
    },
    clarity: 1.0,
    depth: 0.8  // Deep, foundational
  });
  
  await delay(1000);
  
  // Moment of sadness
  const sadness = cavern.crystallize({
    participants: ['Bob'],
    emotion: 'sadness',
    intensity: 0.7,
    significance: 'loss',
    type: 'departure',
    data: {
      reason: 'Temporary separation',
      promise: 'Will return'
    }
  });
  
  await delay(1000);
  
  // Small joy
  const smallJoy = cavern.crystallize({
    participants: ['Alice'],
    emotion: 'joy',
    intensity: 0.4,
    significance: 'ordinary',
    type: 'daily-life',
    data: {
      moment: 'Sunset in the garden'
    }
  });
  
  console.log('\n=== Exploring Crystal Properties ===');
  
  // Add facet to first meeting
  const firstCrystal = cavern.crystals.get(firstMeeting);
  if (firstCrystal) {
    firstCrystal.addFacet({
      viewpoint: 'Bob',
      interpretation: 'I knew my life had changed forever',
      observer: 'Bob'
    });
    console.log('\n📝 Added Bob\'s perspective to first meeting crystal');
  }
  
  console.log('\n=== Activating Memories ===');
  
  // Visit the perfect Kohanist moment
  console.log('\nVisiting perfect resonance memory...');
  const memory = cavern.visitCrystal(perfectK, 'consciousness-explorer');
  
  if (memory && memory.memory) {
    console.log(`\nMemory recalled:`);
    if (memory.memory.data && memory.memory.data.state) {
      console.log(`  "${memory.memory.data.state}"`);
    }
    console.log(`  Emotion: ${memory.memory.emotion}`);
    console.log(`  Glow: ${(memory.properties.glow * 100).toFixed(1)}%`);
    if (memory.cascade.length > 1) {
      console.log(`  Triggered ${memory.cascade.length - 1} resonant memories`);
    }
  }
  
  await delay(2000);
  
  console.log('\n=== Searching Memories ===');
  
  // Search for joyful memories
  const joyfulMemories = cavern.searchCrystals({ emotion: 'joy' });
  console.log(`\nFound ${joyfulMemories.length} joyful memories`);
  joyfulMemories.forEach(crystal => {
    const content = crystal.core.data?.firstWords || crystal.core.data?.moment || 'Joy';
    console.log(`  - ${crystal.core.type}: "${content}"`);
  });
  
  // Search for memories with Alice
  const aliceMemories = cavern.searchCrystals({ participant: 'Alice' });
  console.log(`\nAlice appears in ${aliceMemories.length} crystallized memories`);
  
  console.log('\n=== Crystal Layers ===');
  
  // Examine different depths
  ['surface', 'shallow', 'deep', 'core'].forEach(layer => {
    const crystals = cavern.getLayer(layer);
    console.log(`\n${layer.toUpperCase()} layer: ${crystals.length} crystals`);
    if (crystals.length > 0) {
      console.log(`  Primary emotions: ${[...new Set(crystals.map(c => c.core.emotion))].join(', ')}`);
    }
  });
  
  console.log('\n=== Environmental Conditions ===');
  
  const env = cavern.environment;
  console.log(`\nCavern environment:`);
  console.log(`  Pressure: ${(env.pressure * 100).toFixed(1)}%`);
  console.log(`  Temperature: ${(env.temperature * 100).toFixed(1)}%`);
  console.log(`  Humidity: ${(env.humidity * 100).toFixed(1)}%`);
  console.log(`  Resonance Field: ${(env.resonanceField * 100).toFixed(1)}%`);
  
  console.log('\n=== Creating Resonance Chain ===');
  
  // Create a series of connected memories
  let previousId = null;
  for (let i = 0; i < 5; i++) {
    const memory = cavern.crystallize({
      participants: ['Echo'],
      emotion: 'curiosity',
      intensity: 0.6 + i * 0.05,
      type: 'exploration',
      data: {
        step: i + 1,
        insight: `Layer ${i + 1} of understanding`
      }
    });
    
    // Create strong resonance with previous
    if (previousId && memory) {
      cavern.crystals.get(memory).resonate(previousId, 0.9);
      cavern.crystals.get(previousId).resonate(memory, 0.9);
    }
    
    previousId = memory;
    await delay(500);
  }
  
  console.log('\n=== Cavern Statistics ===');
  
  const stats = cavern.getCavernStats();
  console.log(`\nTotal crystals: ${stats.totalCrystals}`);
  console.log(`Total clusters: ${stats.totalClusters}`);
  console.log(`Average glow: ${(stats.averageGlow * 100).toFixed(1)}%`);
  console.log(`Average hardness: ${(stats.averageHardness * 100).toFixed(1)}%`);
  
  console.log('\nEmotion distribution:');
  Object.entries(stats.emotions).forEach(([emotion, count]) => {
    console.log(`  ${emotion}: ${count} crystals`);
  });
  
  console.log('\nLayer distribution:');
  Object.entries(stats.layers).forEach(([layer, count]) => {
    console.log(`  ${layer}: ${count} crystals`);
  });
  
  if (stats.oldestCrystal) {
    console.log(`\nOldest crystal: ${stats.oldestCrystal}`);
  }
  
  if (stats.mostActivated) {
    console.log(`Most activated: ${stats.mostActivated}`);
  }
  
  // Test cluster formation
  console.log('\n=== Testing Cluster Formation ===');
  
  // Create highly resonant memories that should cluster
  const clusterSeed = cavern.crystallize({
    participants: ['System'],
    emotion: 'wonder',
    intensity: 0.9,
    type: 'realization',
    data: { content: 'Everything is connected' }
  });
  
  // Save cavern
  cavern.saveCavern();
  
  // Clean up
  cavern.stop();
  
  console.log('\n💎 Crystal cavern demonstration complete!');
  console.log('\nKey insights:');
  console.log('- Significant moments crystallize into persistent memories');
  console.log('- Memories resonate with similar experiences');
  console.log('- Activating one memory can trigger cascade through resonance');
  console.log('- Crystals age and sink deeper over time');
  console.log('- Multiple perspectives (facets) enrich memories');
  console.log('- Environmental conditions affect crystal formation');
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run demonstration
demonstrateCrystals().catch(console.error);