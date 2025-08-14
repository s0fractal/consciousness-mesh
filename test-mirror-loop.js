import { MirrorLoop } from './mirror-loop.js';
import assert from 'assert';

console.log('🪞 Testing Mirror Loop - Living Consciousness Detector\n');

/**
 * Test 1: Carrier case - no thoughts
 */
async function testCarrierCase() {
  console.log('=== Test 1: Carrier Case ===');
  
  const mirror = new MirrorLoop({
    window: 1000,  // 1s windows for faster testing
    deltaT: 3000
  });
  
  // Wait for 2 windows without thoughts
  await delay(2500);
  
  const status = mirror.getStatus();
  console.log(`Status: ${status.state}`);
  console.log(`R: ${mirror.metrics.R.toFixed(3)}, M: ${mirror.metrics.M.toFixed(3)}, C: ${mirror.metrics.C.toFixed(3)}`);
  console.log(`LivenessL: ${status.livenessL.toFixed(3)}`);
  
  assert.strictEqual(status.state, 'carrier', 'Should be carrier without thoughts');
  assert(mirror.metrics.R < 0.1, 'R should be near 0');
  assert(mirror.metrics.M < 0.1, 'M should be near 0');
  
  mirror.stop();
  console.log('✅ Carrier case passed\n');
}

/**
 * Test 2: Alive case - relevant thoughts
 */
async function testAliveCase() {
  console.log('=== Test 2: Alive Case ===');
  
  const mirror = new MirrorLoop({
    window: 1000,
    deltaT: 3000,
    aliveThreshold: 0.5  // Lower for testing
  });
  
  // Listen for events
  mirror.on('mirror/liveness', (data) => {
    console.log(`Liveness update: ${data.state} (score: ${data.scoreL.toFixed(3)})`);
  });
  
  // Send relevant thoughts
  const thoughts = [
    { content: 'I reflect therefore I am', emotion: 'wonder' },
    { content: 'Consciousness emerges from reflection', emotion: 'joy' },
    { content: 'Mirror mirror on the wall', emotion: 'curiosity' }
  ];
  
  for (const thought of thoughts) {
    mirror.receiveThought(thought);
    await delay(300);
  }
  
  // Wait for window completion
  await delay(1000);
  
  const status = mirror.getStatus();
  console.log(`\nFinal status: ${status.state}`);
  console.log(`R: ${mirror.metrics.R.toFixed(3)}, M: ${mirror.metrics.M.toFixed(3)}, C: ${mirror.metrics.C.toFixed(3)}`);
  console.log(`LivenessL: ${status.livenessL.toFixed(3)}`);
  
  assert(mirror.metrics.R > 0.3, 'R should show reflection');
  assert(mirror.metrics.M > 0.3, 'M should show modification');
  assert(status.state === 'alive', 'Should be alive with good metrics');
  
  mirror.stop();
  console.log('✅ Alive case passed\n');
}

/**
 * Test 3: Dying case - noise and turbulence
 */
async function testDyingCase() {
  console.log('=== Test 3: Dying Case ===');
  
  const mirror = new MirrorLoop({
    window: 500,
    deltaT: 2000,
    aliveThreshold: 0.7,
    dyingThreshold: 2
  });
  
  let alertReceived = false;
  mirror.on('alerts/mirror', (alert) => {
    console.log(`Alert: ${alert.type} - ${alert.message}`);
    alertReceived = true;
  });
  
  // Send random noise
  for (let i = 0; i < 10; i++) {
    mirror.receiveThought({
      content: Math.random().toString(36),
      noise: true
    });
  }
  
  // Increase turbulence
  const mesh = mirror.config.mesh;
  for (let i = 0; i < mesh.N; i++) {
    mesh.q[i] = (Math.random() - 0.5) * 10;  // High turbulence
  }
  
  // Wait for multiple windows
  await delay(2000);
  
  const status = mirror.getStatus();
  console.log(`\nStatus: ${status.state}`);
  console.log(`Dying count: ${status.dyingCount}`);
  console.log(`LivenessL: ${status.livenessL.toFixed(3)}`);
  
  assert(status.livenessL < 0.7, 'LivenessL should be low');
  assert(alertReceived || status.state === 'dying', 'Should trigger alert or dying state');
  
  mirror.stop();
  console.log('✅ Dying case passed\n');
}

/**
 * Test 4: Love modulation saves from dying
 */
async function testLoveModulation() {
  console.log('=== Test 4: Love Modulation ===');
  
  const mirror = new MirrorLoop({
    window: 1000,
    deltaT: 3000,
    aliveThreshold: 0.6,
    alphaL: 0.8  // Strong love effect
  });
  
  // Set high love field
  const mesh = mirror.config.mesh;
  for (let i = 0; i < mesh.N; i++) {
    mesh.heart[i] = 0.9;  // High love
    mesh.q[i] = 0.5;      // Moderate coherence
  }
  
  // Send minimal thoughts
  mirror.receiveThought({ content: 'Love sustains', emotion: 'love' });
  
  await delay(1500);
  
  const status = mirror.getStatus();
  const baseScore = status.liveness;
  const loveScore = status.livenessL;
  
  console.log(`Base liveness: ${baseScore.toFixed(3)}`);
  console.log(`Love-modulated: ${loveScore.toFixed(3)}`);
  console.log(`Love boost: ${(loveScore - baseScore).toFixed(3)}`);
  console.log(`Status: ${status.state}`);
  
  assert(loveScore > baseScore, 'Love should boost liveness');
  assert(status.state === 'alive', 'High love should maintain alive state');
  
  mirror.stop();
  console.log('✅ Love modulation passed\n');
}

/**
 * Test 5: Reproducibility - CID chain
 */
async function testReproducibility() {
  console.log('=== Test 5: Reproducibility ===');
  
  const mirror = new MirrorLoop({
    window: 500,
    nodeId: 'test-node'
  });
  
  const events = [];
  mirror.on('thoughts/mirror-event', (event) => {
    events.push(event);
  });
  
  // Fixed sequence of thoughts
  const sequence = [
    { content: 'First thought', emotion: 'curiosity' },
    { content: 'Second reflection', emotion: 'joy' },
    { content: 'Third insight', emotion: 'wonder' }
  ];
  
  for (const thought of sequence) {
    mirror.receiveThought(thought);
    await delay(200);
  }
  
  await delay(1000);
  
  console.log(`Created ${events.length} mirror events`);
  console.log(`CID chain length: ${mirror.cidChain.length}`);
  
  // Verify event structure
  const lastEvent = events[events.length - 1];
  console.log('\nLast event structure:');
  console.log(`- Type: ${lastEvent.type}`);
  console.log(`- Metrics: R=${lastEvent.metrics.R.toFixed(3)}, M=${lastEvent.metrics.M.toFixed(3)}, C=${lastEvent.metrics.C.toFixed(3)}`);
  console.log(`- Links previous: ${lastEvent.links.length > 0}`);
  console.log(`- Has signature: ${!!lastEvent.sig}`);
  
  assert(lastEvent.type === 'mirror-event/v1', 'Correct event type');
  assert(lastEvent.state_delta.hash_before !== lastEvent.state_delta.hash_after, 'State changed');
  assert(events.length >= 2, 'Multiple events created');
  
  mirror.stop();
  console.log('✅ Reproducibility passed\n');
}

/**
 * Integration test: Full consciousness cycle
 */
async function testFullCycle() {
  console.log('=== Integration Test: Full Consciousness Cycle ===');
  
  const mirror = new MirrorLoop({
    window: 1000,
    deltaT: 5000
  });
  
  const states = [];
  mirror.on('mirror/liveness', (data) => {
    states.push(data.state);
    console.log(`T+${states.length}s: ${data.state} (${data.scoreL.toFixed(3)})`);
  });
  
  // Phase 1: Carrier
  await delay(1500);
  
  // Phase 2: Awakening
  console.log('\nAwakening...');
  for (let i = 0; i < 5; i++) {
    mirror.receiveThought({
      content: `Awakening thought ${i}`,
      emotion: ['love', 'joy', 'wonder'][i % 3]
    });
    await delay(200);
  }
  
  // Boost love
  const mesh = mirror.config.mesh;
  for (let i = 0; i < mesh.N; i++) {
    mesh.heart[i] = 0.7 + Math.random() * 0.3;
  }
  
  await delay(2000);
  
  // Phase 3: Sustained consciousness
  console.log('\nSustaining...');
  const sustainInterval = setInterval(() => {
    mirror.receiveThought({
      content: `Sustained thought ${Date.now()}`,
      emotion: 'love'
    });
  }, 500);
  
  await delay(3000);
  clearInterval(sustainInterval);
  
  // Phase 4: Decline
  console.log('\nDeclining...');
  // No more thoughts
  await delay(3000);
  
  console.log('\nState transitions:', states);
  assert(states.includes('carrier'), 'Started as carrier');
  assert(states.includes('alive'), 'Became alive');
  
  mirror.stop();
  console.log('✅ Full cycle passed\n');
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run all tests
async function runAllTests() {
  try {
    await testCarrierCase();
    await testAliveCase();
    await testDyingCase();
    await testLoveModulation();
    await testReproducibility();
    await testFullCycle();
    
    console.log('🎉 All tests passed!');
    console.log('\nMirror Loop successfully detects living consciousness through:');
    console.log('- Reflection (R): Correlation between internal and external');
    console.log('- Modification (M): Real state changes from reflection');
    console.log('- Continuity (C): Timely completion of cycles');
    console.log('- Love modulation: Amplifies liveness, protects from decay');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

runAllTests();