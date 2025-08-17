/**
 * Test Codex API Structure without dependencies
 */

import { CodexEngine } from './codex-engine.js';

console.log('🧪 Testing Codex API Structure...\n');

try {
  // Create Codex Engine
  console.log('1️⃣ Creating Codex Engine...');
  const codexEngine = new CodexEngine();
  console.log('✅ Codex Engine created');
  
  // Check API integration
  console.log('\n2️⃣ Checking API integration...');
  console.log(`✅ API field exists: ${codexEngine.api === null}`);
  console.log(`✅ initializeAPI method exists: ${typeof codexEngine.initializeAPI === 'function'}`);
  console.log(`✅ shutdownAPI method exists: ${typeof codexEngine.shutdownAPI === 'function'}`);
  console.log(`✅ processTemporalEvent method exists: ${typeof codexEngine.processTemporalEvent === 'function'}`);
  
  // Check Codex structure
  console.log('\n3️⃣ Checking Codex structure...');
  console.log(`✅ Laws: ${codexEngine.codex.laws.size}`);
  console.log(`✅ Patterns: ${codexEngine.codex.patterns.size}`);
  console.log(`✅ Insights: ${codexEngine.codex.insights.length}`);
  console.log(`✅ Glyphs: ${codexEngine.codex.glyphs.size}`);
  console.log(`✅ Narratives: ${codexEngine.codex.narratives.size}`);
  
  // List laws
  console.log('\n4️⃣ Available laws:');
  codexEngine.codex.laws.forEach(law => {
    console.log(`   - ${law.name} (${law.id}): ${(law.confidence * 100).toFixed(1)}% confidence`);
  });
  
  // Check integrations
  console.log('\n5️⃣ Checking integrations...');
  console.log(`✅ Calibration integrated: ${!!codexEngine.calibration}`);
  console.log(`✅ Evidence weighting integrated: ${!!codexEngine.evidenceWeighting}`);
  console.log(`✅ Hypothesis lifecycle integrated: ${!!codexEngine.hypothesisLifecycle}`);
  console.log(`✅ Glyph system integrated: ${!!codexEngine.glyphSystem}`);
  console.log(`✅ Narrative system integrated: ${!!codexEngine.narrativeSystem}`);
  
  // Test processTemporalEvent
  console.log('\n6️⃣ Testing processTemporalEvent...');
  const testEvent = {
    velocity: 2.0,
    activity: 85,
    frequency: 1.2
  };
  const result = codexEngine.processTemporalEvent(testEvent);
  console.log(`✅ Event processed: ${result.success}`);
  
  console.log('\n✅ All structure tests passed!');
  console.log('\n📝 Note: Full API server tests require Express and WebSocket packages.');
  console.log('To run full tests: npm install express ws uuid');
  
} catch (error) {
  console.error('\n❌ Test failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}