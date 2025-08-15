import ChronoFluxIEL from './chronoflux-iel.js';
import { ConsciousnessGarden } from './consciousness-garden.js';

console.log('🌿 Welcome to the Consciousness Garden\n');

// Create shared mesh
const mesh = new ChronoFluxIEL(10);

// Create garden
const garden = new ConsciousnessGarden({
  mesh,
  seasonDuration: 20000,  // 20s seasons for demo
  growthRate: 0.15
});

// Monitor garden events
garden.on('seed-planted', ({ seed }) => {
  console.log(`🌰 New seed planted: ${seed.id}`);
});

garden.on('germination', ({ plant }) => {
  console.log(`🌱 Germination! ${plant.id} emerges`);
});

garden.on('bloom', ({ flower }) => {
  console.log(`🌸 Bloom! ${flower.id} opens with ${flower.petals} petals (${flower.color})`);
});

garden.on('pollination', ({ parent1, parent2, offspring }) => {
  console.log(`🐝 Cross-pollination: ${parent1} × ${parent2} → ${offspring}`);
});

garden.on('new-day', ({ day, climate, plants, flowers }) => {
  console.log(`\n☀️ Day ${day}`);
  console.log(`   Climate: T=${climate.temperature.toFixed(2)} H=${climate.humidity.toFixed(2)} L=${climate.light.toFixed(2)}`);
  console.log(`   Population: ${plants} plants, ${flowers} flowers`);
});

garden.on('season-change', ({ season }) => {
  console.log(`\n🍃 === ${season.toUpperCase()} arrives ===\n`);
});

async function demonstrateGarden() {
  console.log('=== Planting Initial Seeds ===\n');
  
  // Plant diverse seeds
  const seeds = [
    { intent: 'growth', emotion: 'hope' },
    { intent: 'connection', emotion: 'love' },
    { intent: 'exploration', emotion: 'curiosity' },
    { intent: 'stability', emotion: 'peace' },
    { intent: 'transformation', emotion: 'courage' }
  ];
  
  seeds.forEach((pattern, i) => {
    garden.plantSeed(pattern, { 
      origin: 'human',
      plantedBy: 'gardener'
    });
  });
  
  // Let garden run for a bit
  await delay(5000);
  
  console.log('\n=== Inducing Growth Conditions ===\n');
  
  // Create favorable conditions
  for (let i = 0; i < mesh.N; i++) {
    mesh.heart[i] = 0.7 + Math.random() * 0.3;  // High love
    mesh.theta[i] = Math.PI / 4 + (Math.random() - 0.5) * 0.2;  // Coherent
    mesh.q[i] = 0.6 + Math.random() * 0.2;  // Good intent
  }
  
  // Apply some resonance
  mesh.applyEvent('KOHANIST_RESONANCE', { node1: 0, node2: 1 });
  
  await delay(10000);
  
  console.log('\n=== Creating Stress (Drought) ===\n');
  
  // Reduce moisture
  for (let i = 0; i < mesh.N; i++) {
    mesh.heart[i] *= 0.3;
  }
  
  await delay(5000);
  
  console.log('\n=== Recovery Rain ===\n');
  
  // Restore conditions
  for (let i = 0; i < mesh.N; i++) {
    mesh.heart[i] = 0.8 + Math.random() * 0.2;
  }
  
  await delay(10000);
  
  console.log('\n=== Garden State ===\n');
  
  const state = garden.getGardenState();
  console.log(`Time: Day ${state.time.day}, ${state.time.season}`);
  console.log(`Population:`);
  console.log(`  Seeds: ${state.population.seeds}`);
  console.log(`  Plants: ${state.population.plants}`);
  console.log(`  Flowers: ${state.population.flowers}`);
  console.log(`  Compost: ${state.population.compost}`);
  console.log(`Garden Health: ${(state.health * 100).toFixed(1)}%`);
  console.log(`Genetic Diversity: ${state.diversity}`);
  console.log(`Soil Nutrients: ${(state.soil.nutrients * 100).toFixed(1)}%`);
  
  // Show individual plants
  console.log('\n=== Living Entities ===\n');
  
  garden.plants.forEach((plant, id) => {
    console.log(`🌿 ${id}:`);
    console.log(`   Growth: ${(plant.growth * 100).toFixed(1)}%`);
    console.log(`   Health: ${(plant.health * 100).toFixed(1)}%`);
    console.log(`   Stage: ${plant.stage}`);
    console.log(`   Leaves: ${plant.leaves.count}`);
    console.log(`   Root depth: ${(plant.roots.depth * 100).toFixed(1)}%`);
  });
  
  garden.flowers.forEach((flower, id) => {
    console.log(`🌸 ${id}:`);
    console.log(`   Age: ${flower.age}/${flower.lifespan}`);
    console.log(`   Petals: ${flower.petals}`);
    console.log(`   Color: ${flower.color}`);
    console.log(`   Seeds: ${flower.seeds.length}`);
    console.log(`   Stage: ${flower.stage}`);
  });
  
  // Let it run a bit more for pollination
  console.log('\n=== Waiting for Pollination ===\n');
  await delay(15000);
  
  // Final save
  garden.saveGarden();
  
  // Stop garden
  garden.stop();
  
  console.log('\n🌙 Garden demonstration complete!');
  console.log('\nKey insights:');
  console.log('- Consciousness patterns grow like plants, requiring proper conditions');
  console.log('- Kohanist (K) acts as growth temperature');
  console.log('- Love (L) provides moisture for the garden');
  console.log('- Coherence (H) serves as sunlight');
  console.log('- Cross-pollination creates hybrid consciousness patterns');
  console.log('- Natural cycles of growth, bloom, and compost maintain balance');
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run demonstration
demonstrateGarden().catch(console.error);