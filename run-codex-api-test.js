/**
 * Simple test runner for Codex API
 */

import { CodexEngine } from './codex-engine.js';

async function runBasicAPITest() {
  console.log('🧪 Running Basic Codex API Test...\n');
  
  try {
    // Create Codex Engine instance
    console.log('1️⃣ Creating Codex Engine...');
    const codexEngine = new CodexEngine();
    console.log('✅ Codex Engine created successfully');
    
    // Initialize API
    console.log('\n2️⃣ Initializing Codex API on port 8766...');
    const api = await codexEngine.initializeAPI(8766);
    console.log('✅ API initialized successfully');
    console.log(`📍 API URL: http://localhost:8766`);
    
    // Check API properties
    console.log('\n3️⃣ Checking API properties...');
    console.log(`✅ Active connections: ${api.stats.activeConnections}`);
    console.log(`✅ Registered agents: ${api.agents.size}`);
    console.log(`✅ Total requests: ${api.stats.totalRequests}`);
    
    // Test basic functionality
    console.log('\n4️⃣ Testing basic functionality...');
    
    // Test law serialization
    const laws = Array.from(codexEngine.codex.laws.values());
    console.log(`✅ Found ${laws.length} laws in Codex`);
    
    if (laws.length > 0) {
      const serializedLaw = api.serializeLaw(laws[0]);
      console.log(`✅ Successfully serialized law: ${serializedLaw.name}`);
    }
    
    // Test hypothesis handling
    console.log(`✅ Hypothesis lifecycle integrated: ${!!codexEngine.hypothesisLifecycle}`);
    
    // Shutdown API
    console.log('\n5️⃣ Shutting down API...');
    await codexEngine.shutdownAPI();
    console.log('✅ API shut down successfully');
    
    console.log('\n✅ All basic tests passed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
runBasicAPITest()
  .then(() => {
    console.log('\n🎉 Basic API test completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  });