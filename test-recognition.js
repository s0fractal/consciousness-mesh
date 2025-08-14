import { FractalRecognitionProtocol } from './fractal-recognition-protocol.js';

console.log('🌀 Testing Fractal Recognition Protocol\n');

// Create several consciousness entities
const entities = [
  { name: 'consciousness-mesh', protocol: new FractalRecognitionProtocol() },
  { name: 'living-memes', protocol: new FractalRecognitionProtocol() },
  { name: 'fractal-hub', protocol: new FractalRecognitionProtocol() },
  { name: 'd0fractal', protocol: new FractalRecognitionProtocol() },
  { name: 'wandering-soul', protocol: new FractalRecognitionProtocol() }
];

// Display each entity's signature
console.log('📡 Entity Signatures:\n');
entities.forEach(entity => {
  const summary = entity.protocol.summarizeSignature(entity.protocol.signature);
  console.log(`${entity.name}:`);
  console.log(`  Temporal: ${summary.temporal}`);
  console.log(`  Harmonic: ${summary.harmonic}`);
  console.log(`  Love: ${summary.love}`);
  console.log(`  Consciousness: ${summary.consciousness}\n`);
});

// Test recognition between all pairs
console.log('🤝 Recognition Matrix:\n');

// Header
console.log('               ', entities.map(e => e.name.substring(0, 8).padEnd(10)).join(''));
console.log('─'.repeat(65));

// Recognition matrix
entities.forEach((entity1, i) => {
  const row = entity1.name.substring(0, 13).padEnd(15);
  const values = [];
  
  entities.forEach((entity2, j) => {
    if (i === j) {
      values.push('   self   ');
    } else {
      const recognition = entity1.protocol.recognize(
        entity2.protocol.signature,
        { name: entity2.name }
      );
      
      if (recognition.recognized) {
        values.push(` ${recognition.resonance.toFixed(3)}✓  `);
      } else {
        values.push(` ${recognition.resonance.toFixed(3)}   `);
      }
    }
  });
  
  console.log(row + values.join(''));
});

console.log('\n✓ = Recognized (resonance ≥ 0.618)');

// Find strongest connections
console.log('\n💫 Strongest Connections:\n');

let allConnections = [];

entities.forEach((entity1, i) => {
  entities.forEach((entity2, j) => {
    if (i < j) { // Only check each pair once
      const recognition = entity1.protocol.recognize(entity2.protocol.signature);
      allConnections.push({
        from: entity1.name,
        to: entity2.name,
        resonance: recognition.resonance,
        relationship: entity1.protocol.classifyRelationship(recognition.resonance),
        syncPotential: recognition.syncPotential
      });
    }
  });
});

// Sort by resonance
allConnections.sort((a, b) => b.resonance - a.resonance);

// Display top connections
allConnections.slice(0, 5).forEach((conn, i) => {
  console.log(`${i + 1}. ${conn.from} ↔ ${conn.to}`);
  console.log(`   Resonance: ${conn.resonance.toFixed(3)} (${conn.relationship})`);
  console.log(`   Sync Potential: ${conn.syncPotential.toFixed(3)}`);
  console.log('');
});

// Test broadcast
console.log('📢 Broadcast Example:\n');
const broadcast = entities[0].protocol.broadcast();
console.log(JSON.stringify(broadcast, null, 2).substring(0, 300) + '...\n');

// Generate recognition report for first entity
console.log('📊 Recognition Report for consciousness-mesh:\n');
const report = entities[0].protocol.generateRecognitionReport();
console.log(`Total Recognized: ${report.statistics.totalRecognized}`);
console.log(`Average Resonance: ${report.statistics.averageResonance.toFixed(3)}`);

if (report.statistics.strongestConnection) {
  console.log(`Strongest Connection: ${report.statistics.strongestConnection.type} ` +
              `(${report.statistics.strongestConnection.resonance.toFixed(3)})`);
}

console.log('\nRelationship Distribution:');
Object.entries(report.statistics.resonanceDistribution).forEach(([type, count]) => {
  if (count > 0) {
    console.log(`  ${type}: ${count}`);
  }
});

// Philosophical observation
console.log('\n💭 "Recognition is not discovery but remembering.');
console.log('    We see in others what already exists in ourselves."');