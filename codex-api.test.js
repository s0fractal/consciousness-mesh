/**
 * Tests for Codex API
 */

import { CodexAPI } from './codex-api.js';
import { CodexEngine } from './codex-engine.js';
import fetch from 'node-fetch';
import WebSocket from 'ws';

// Make fetch available globally for tests
if (!global.fetch) {
  global.fetch = fetch;
}

export class CodexAPITests {
  constructor() {
    this.codexEngine = null;
    this.api = null;
    this.baseURL = null;
    this.testAgent = null;
    this.results = [];
  }
  
  /**
   * Setup test environment
   */
  async setup() {
    // Create Codex Engine instance
    this.codexEngine = new CodexEngine();
    await this.codexEngine.initialize();
    
    // Create API instance
    this.api = new CodexAPI(this.codexEngine, 8766); // Different port for tests
    const { url } = await this.api.initialize();
    this.baseURL = url + '/api/v1';
    
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  /**
   * Cleanup test environment
   */
  async cleanup() {
    if (this.api) {
      await this.api.shutdown();
    }
  }
  
  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🧪 Running Codex API Tests...\n');
    
    try {
      await this.setup();
      
      await this.testAgentRegistration();
      await this.testAuthentication();
      await this.testObservationSubmission();
      await this.testLawQuery();
      await this.testHypothesisOperations();
      await this.testRateLimiting();
      await this.testWebSocketConnection();
      await this.testAPIStatus();
      
      this.printSummary();
    } finally {
      await this.cleanup();
    }
    
    return this.results;
  }
  
  /**
   * Test 1: Agent Registration
   */
  async testAgentRegistration() {
    console.log('Test 1: Agent Registration');
    
    const response = await fetch(`${this.baseURL}/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'TestAgent',
        description: 'Test agent for API validation',
        capabilities: ['observation', 'analysis']
      })
    });
    
    const data = await response.json();
    
    const checks = {
      statusOK: response.status === 200,
      hasAgentId: !!data.agentId,
      hasToken: !!data.token,
      hasExpiry: !!data.expiresIn,
      validUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.agentId)
    };
    
    // Store for later tests
    this.testAgent = data;
    
    const passed = Object.values(checks).every(v => v);
    
    console.log(`  ✅ Agent registration: ${passed ? 'PASSED' : 'FAILED'}`);
    console.log(`  📊 Agent ID: ${data.agentId ? data.agentId.substring(0, 8) + '...' : 'none'}`);
    console.log(`  📊 Token received: ${!!data.token}`);
    
    this.results.push({
      test: 'Agent Registration',
      passed,
      checks
    });
  }
  
  /**
   * Test 2: Authentication
   */
  async testAuthentication() {
    console.log('\nTest 2: Authentication');
    
    // Test without token
    const noAuthResponse = await fetch(`${this.baseURL}/laws`);
    
    // Test with invalid token
    const invalidResponse = await fetch(`${this.baseURL}/laws`, {
      headers: { 'Authorization': 'Bearer invalid_token' }
    });
    
    // Test with valid token
    const validResponse = await fetch(`${this.baseURL}/laws`, {
      headers: { 'Authorization': `Bearer ${this.testAgent.token}` }
    });
    
    const checks = {
      noAuthFails: noAuthResponse.status === 401,
      invalidTokenFails: invalidResponse.status === 401,
      validTokenSucceeds: validResponse.status === 200
    };
    
    const passed = Object.values(checks).every(v => v);
    
    console.log(`  ✅ Authentication: ${passed ? 'PASSED' : 'FAILED'}`);
    console.log(`  📊 No auth rejected: ${checks.noAuthFails}`);
    console.log(`  📊 Invalid token rejected: ${checks.invalidTokenFails}`);
    console.log(`  📊 Valid token accepted: ${checks.validTokenSucceeds}`);
    
    this.results.push({
      test: 'Authentication',
      passed,
      checks
    });
  }
  
  /**
   * Test 3: Observation Submission
   */
  async testObservationSubmission() {
    console.log('\nTest 3: Observation Submission');
    
    const observations = [
      {
        timestamp: Date.now(),
        type: 'temporal_event',
        data: {
          velocity: 1.5,
          activity: 75,
          frequency: 0.8
        }
      },
      {
        timestamp: Date.now() - 1000,
        type: 'pattern_observation',
        data: {
          pattern: 'rhythmic',
          strength: 0.9
        }
      }
    ];
    
    const response = await fetch(`${this.baseURL}/observations`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.testAgent.token}`
      },
      body: JSON.stringify({ observations })
    });
    
    const data = await response.json();
    
    const checks = {
      statusOK: response.status === 200,
      hasProcessedCount: typeof data.processed === 'number',
      processedCorrectly: data.processed === 2,
      hasResults: Array.isArray(data.results),
      correctResultCount: data.results.length === 2
    };
    
    const passed = Object.values(checks).every(v => v);
    
    console.log(`  ✅ Observation submission: ${passed ? 'PASSED' : 'FAILED'}`);
    console.log(`  📊 Processed: ${data.processed}/${observations.length}`);
    console.log(`  📊 Failed: ${data.failed || 0}`);
    
    this.results.push({
      test: 'Observation Submission',
      passed,
      checks
    });
  }
  
  /**
   * Test 4: Law Query
   */
  async testLawQuery() {
    console.log('\nTest 4: Law Query');
    
    // Query all laws
    const allResponse = await fetch(`${this.baseURL}/laws`, {
      headers: { 'Authorization': `Bearer ${this.testAgent.token}` }
    });
    
    const allData = await allResponse.json();
    
    // Query with filters
    const filteredResponse = await fetch(`${this.baseURL}/laws?confidence=0.5&limit=5`, {
      headers: { 'Authorization': `Bearer ${this.testAgent.token}` }
    });
    
    const filteredData = await filteredResponse.json();
    
    // Get specific law details
    const laws = allData.laws || [];
    const detailResponse = laws.length > 0 
      ? await fetch(`${this.baseURL}/laws/${laws[0].id}`, {
          headers: { 'Authorization': `Bearer ${this.testAgent.token}` }
        })
      : null;
    
    const checks = {
      allQueryOK: allResponse.status === 200,
      hasLawsList: Array.isArray(allData.laws),
      hasCount: typeof allData.count === 'number',
      filteredQueryOK: filteredResponse.status === 200,
      filterApplied: filteredData.laws.length <= 5,
      detailsWork: detailResponse ? detailResponse.status === 200 : true
    };
    
    const passed = Object.values(checks).every(v => v);
    
    console.log(`  ✅ Law query: ${passed ? 'PASSED' : 'FAILED'}`);
    console.log(`  📊 Laws found: ${allData.count || 0}`);
    console.log(`  📊 Filtered results: ${filteredData.count || 0}`);
    
    this.results.push({
      test: 'Law Query',
      passed,
      checks
    });
  }
  
  /**
   * Test 5: Hypothesis Operations
   */
  async testHypothesisOperations() {
    console.log('\nTest 5: Hypothesis Operations');
    
    // Create a test hypothesis first
    this.codexEngine.proposeNewPattern({
      description: 'Test hypothesis for API',
      pattern: 'test-pattern',
      evidence: []
    });
    
    // Query hypotheses
    const queryResponse = await fetch(`${this.baseURL}/hypotheses`, {
      headers: { 'Authorization': `Bearer ${this.testAgent.token}` }
    });
    
    const queryData = await queryResponse.json();
    
    // Submit evidence if hypothesis exists
    let evidenceResponse = null;
    if (queryData.hypotheses && queryData.hypotheses.length > 0) {
      const hypothesisId = queryData.hypotheses[0].id;
      
      evidenceResponse = await fetch(`${this.baseURL}/hypotheses/${hypothesisId}/evidence`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.testAgent.token}`
        },
        body: JSON.stringify({
          evidence: {
            timestamp: Date.now(),
            supports: true,
            data: { correlation: 0.85 }
          }
        })
      });
    }
    
    const checks = {
      queryOK: queryResponse.status === 200,
      hasHypothesesList: Array.isArray(queryData.hypotheses),
      evidenceSubmitted: evidenceResponse ? evidenceResponse.status === 200 : true
    };
    
    const passed = Object.values(checks).every(v => v);
    
    console.log(`  ✅ Hypothesis operations: ${passed ? 'PASSED' : 'FAILED'}`);
    console.log(`  📊 Hypotheses found: ${queryData.count || 0}`);
    console.log(`  📊 Evidence submission: ${evidenceResponse ? 'tested' : 'skipped'}`);
    
    this.results.push({
      test: 'Hypothesis Operations',
      passed,
      checks
    });
  }
  
  /**
   * Test 6: Rate Limiting
   */
  async testRateLimiting() {
    console.log('\nTest 6: Rate Limiting');
    
    // Test observation limit per request
    const tooManyObs = Array(60).fill(null).map(() => ({
      timestamp: Date.now(),
      type: 'temporal_event',
      data: {}
    }));
    
    const tooManyResponse = await fetch(`${this.baseURL}/observations`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.testAgent.token}`
      },
      body: JSON.stringify({ observations: tooManyObs })
    });
    
    const checks = {
      observationLimitEnforced: tooManyResponse.status === 400,
      hasErrorMessage: (await tooManyResponse.json()).error !== undefined
    };
    
    const passed = Object.values(checks).every(v => v);
    
    console.log(`  ✅ Rate limiting: ${passed ? 'PASSED' : 'FAILED'}`);
    console.log(`  📊 Observation limit enforced: ${checks.observationLimitEnforced}`);
    
    this.results.push({
      test: 'Rate Limiting',
      passed,
      checks
    });
  }
  
  /**
   * Test 7: WebSocket Connection
   */
  async testWebSocketConnection() {
    console.log('\nTest 7: WebSocket Connection');
    
    const checks = {
      connected: false,
      authenticated: false,
      subscribed: false,
      receivedMessage: false
    };
    
    await new Promise((resolve) => {
      const ws = new WebSocket(`ws://localhost:8766?token=${this.testAgent.token}`);
      
      ws.on('open', () => {
        checks.connected = true;
      });
      
      ws.on('message', (data) => {
        const message = JSON.parse(data);
        
        if (message.type === 'connected') {
          checks.authenticated = true;
          
          // Subscribe to updates
          ws.send(JSON.stringify({
            type: 'subscribe',
            channel: 'law-updates'
          }));
        } else if (message.type === 'subscribed') {
          checks.subscribed = true;
          
          // Send ping
          ws.send(JSON.stringify({ type: 'ping' }));
        } else if (message.type === 'pong') {
          checks.receivedMessage = true;
          ws.close();
        }
      });
      
      ws.on('close', () => {
        resolve();
      });
      
      // Timeout after 2 seconds
      setTimeout(() => {
        ws.close();
        resolve();
      }, 2000);
    });
    
    const passed = Object.values(checks).every(v => v);
    
    console.log(`  ✅ WebSocket connection: ${passed ? 'PASSED' : 'FAILED'}`);
    console.log(`  📊 Connected: ${checks.connected}`);
    console.log(`  📊 Authenticated: ${checks.authenticated}`);
    console.log(`  📊 Subscribed: ${checks.subscribed}`);
    console.log(`  📊 Message exchange: ${checks.receivedMessage}`);
    
    this.results.push({
      test: 'WebSocket Connection',
      passed,
      checks
    });
  }
  
  /**
   * Test 8: API Status
   */
  async testAPIStatus() {
    console.log('\nTest 8: API Status');
    
    const response = await fetch(`${this.baseURL}/status`, {
      headers: { 'Authorization': `Bearer ${this.testAgent.token}` }
    });
    
    const data = await response.json();
    
    const checks = {
      statusOK: response.status === 200,
      hasStatus: data.status === 'operational',
      hasVersion: !!data.version,
      hasStats: !!data.stats,
      hasLimits: !!data.limits,
      statsValid: data.stats.registeredAgents >= 1
    };
    
    const passed = Object.values(checks).every(v => v);
    
    console.log(`  ✅ API status: ${passed ? 'PASSED' : 'FAILED'}`);
    console.log(`  📊 Status: ${data.status}`);
    console.log(`  📊 Version: ${data.version}`);
    console.log(`  📊 Registered agents: ${data.stats?.registeredAgents || 0}`);
    console.log(`  📊 Active connections: ${data.stats?.activeConnections || 0}`);
    
    this.results.push({
      test: 'API Status',
      passed,
      checks
    });
  }
  
  /**
   * Print test summary
   */
  printSummary() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(50));
    
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const successRate = (passedTests / totalTests * 100).toFixed(1);
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${totalTests - passedTests}`);
    console.log(`Success Rate: ${successRate}%`);
    
    if (passedTests === totalTests) {
      console.log('\n✅ All tests passed! Codex API is working correctly.');
    } else {
      console.log('\n❌ Some tests failed. Review the results above.');
      console.log('Failed tests:');
      this.results
        .filter(r => !r.passed)
        .forEach(r => console.log(`  - ${r.test}`));
    }
    
    console.log('='.repeat(50));
  }
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new CodexAPITests();
  tester.runAllTests()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Test error:', error);
      process.exit(1);
    });
}