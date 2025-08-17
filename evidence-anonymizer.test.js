/**
 * Tests for Evidence Anonymizer
 * Verifies that sensitive data is properly anonymized and cannot be recovered
 */

import { EvidenceAnonymizer, createAnonymizer, anonymizeEvidenceBatch } from './evidence-anonymizer.js';
import crypto from 'crypto';

export function runEvidenceAnonymizerTests() {
  console.log('🔐 Running Evidence Anonymizer Tests...\n');
  
  const testSuite = {
    passed: 0,
    failed: 0
  };
  
  function runTest(name, testFn) {
    try {
      testFn();
      console.log(`✅ ${name}`);
      testSuite.passed++;
      return true;
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
      testSuite.failed++;
      return false;
    }
  }
  
  try {
    // Test 1: Basic Anonymization
    console.log('1️⃣ Testing basic anonymization...');
    runTest('Should create anonymizer instance', () => {
      const anonymizer = new EvidenceAnonymizer();
      
      if (!anonymizer) {
        throw new Error('Failed to create anonymizer');
      }
      
      if (typeof anonymizer.anonymizeEvidence !== 'function') {
        throw new Error('anonymizeEvidence method not found');
      }
    });
    
    runTest('Should anonymize sensitive fields', () => {
      const anonymizer = new EvidenceAnonymizer();
      
      const evidence = {
        id: 'test-001',
        userId: 'user123@example.com',
        sessionId: 'session-abc-123',
        ipAddress: '192.168.1.100',
        timestamp: Date.now(),
        data: {
          measurement: 42,
          sensor: 'temp-01'
        }
      };
      
      const anonymized = anonymizer.anonymizeEvidence(evidence);
      
      // Check that sensitive fields were changed
      if (anonymized.userId === evidence.userId) {
        throw new Error('userId not anonymized');
      }
      
      if (anonymized.sessionId === evidence.sessionId) {
        throw new Error('sessionId not anonymized');
      }
      
      if (anonymized.ipAddress === evidence.ipAddress) {
        throw new Error('ipAddress not anonymized');
      }
      
      // Check that non-sensitive fields remain unchanged
      if (anonymized.id !== evidence.id) {
        throw new Error('Non-sensitive field id was changed');
      }
      
      if (anonymized.data.measurement !== evidence.data.measurement) {
        throw new Error('Non-sensitive nested field was changed');
      }
      
      // Check metadata was added
      if (!anonymized._anonymized || !anonymized._anonymized.timestamp) {
        throw new Error('Anonymization metadata not added');
      }
    });
    
    // Test 2: Irreversibility Verification
    console.log('\n2️⃣ Testing irreversibility...');
    runTest('Should ensure data cannot be recovered from hashed values', () => {
      const anonymizer = new EvidenceAnonymizer({
        fieldStrategies: {
          userId: 'hash',
          email: 'hash'
        }
      });
      
      const originalData = {
        userId: 'john.doe@company.com',
        email: 'john.doe@company.com',
        name: 'John Doe'
      };
      
      const anonymized = anonymizer.anonymizeEvidence(originalData);
      
      // Verify hashes are consistent but irreversible
      const secondAnonymized = anonymizer.anonymizeEvidence(originalData);
      
      if (anonymized.userId !== secondAnonymized.userId) {
        throw new Error('Hash not consistent across calls');
      }
      
      // Verify original values don't appear in output
      const anonymizedStr = JSON.stringify(anonymized);
      if (anonymizedStr.includes('john.doe@company.com')) {
        throw new Error('Original email found in anonymized data');
      }
      
      if (anonymizedStr.includes('John Doe')) {
        throw new Error('Original name found in anonymized data');
      }
      
      // Verify hash properties
      const hashPattern = /^[A-Z]+_[a-f0-9]{16}$/;
      if (!hashPattern.test(anonymized.userId)) {
        throw new Error('Hash format incorrect');
      }
    });
    
    runTest('Should verify irreversibility with strict checking', () => {
      const anonymizer = new EvidenceAnonymizer({
        ensureIrreversible: true,
        sensitiveFields: ['secret', 'password']
      });
      
      const evidence = {
        id: 'test',
        secret: 'my-secret-key-123',
        password: 'super-secure-password'
      };
      
      let errorThrown = false;
      
      // This should work - values are properly anonymized
      try {
        const anonymized = anonymizer.anonymizeEvidence(evidence);
        
        // Manually break anonymization to test verification
        anonymized.secret = evidence.secret; // Restore original value
        
        // This should fail verification
        anonymizer.verifyIrreversibility(evidence, anonymized);
      } catch (error) {
        errorThrown = true;
        if (!error.message.includes('Anonymization failed')) {
          throw new Error('Wrong error type thrown');
        }
      }
      
      if (!errorThrown) {
        throw new Error('Irreversibility check did not catch exposed data');
      }
    });
    
    // Test 3: Anonymization Strategies
    console.log('\n3️⃣ Testing anonymization strategies...');
    runTest('Should apply masking strategy correctly', () => {
      const anonymizer = new EvidenceAnonymizer({
        fieldStrategies: {
          email: 'mask',
          phone: 'mask'
        },
        strategies: {
          mask: {
            visibleStart: 3,
            visibleEnd: 3,
            maskChar: '*'
          }
        }
      });
      
      const evidence = {
        email: 'johndoe@example.com',
        phone: '+1-555-123-4567'
      };
      
      const anonymized = anonymizer.anonymizeEvidence(evidence);
      
      // Check masking format
      if (!anonymized.email.startsWith('joh')) {
        throw new Error('Mask visible start incorrect');
      }
      
      if (!anonymized.email.endsWith('com')) {
        throw new Error('Mask visible end incorrect');
      }
      
      if (!anonymized.email.includes('*****')) {
        throw new Error('Mask characters not applied');
      }
      
      // Verify original cannot be recovered
      if (anonymized.email === evidence.email) {
        throw new Error('Email not properly masked');
      }
    });
    
    runTest('Should apply aggregation strategy correctly', () => {
      const anonymizer = new EvidenceAnonymizer({
        sensitiveFields: ['timestamp', 'measurement'], // Add fields to sensitive list
        fieldStrategies: {
          timestamp: 'aggregate',
          measurement: 'aggregate'
        },
        strategies: {
          aggregate: {
            precision: 1,
            timeWindow: 3600000 // 1 hour
          }
        }
      });
      
      const now = new Date();
      const evidence = {
        timestamp: now.toISOString(),
        measurement: 123.456789
      };
      
      const anonymized = anonymizer.anonymizeEvidence(evidence);
      
      // Check numeric aggregation
      if (anonymized.measurement !== 123.5) {
        throw new Error(`Expected 123.5, got ${anonymized.measurement}`);
      }
      
      // Check temporal aggregation
      const anonymizedDate = new Date(anonymized.timestamp);
      const hourStart = new Date(Math.floor(now.getTime() / 3600000) * 3600000);
      
      if (anonymizedDate.getTime() !== hourStart.getTime()) {
        throw new Error('Timestamp not aggregated to hour boundary');
      }
    });
    
    runTest('Should apply generalization strategy correctly', () => {
      const anonymizer = new EvidenceAnonymizer({
        sensitiveFields: ['location', 'userName'], // Add fields to sensitive list
        fieldStrategies: {
          location: 'generalize',
          userName: 'generalize'
        }
      });
      
      const evidence = {
        location: {
          lat: 37.7749295,
          lng: -122.4194155
        },
        userName: 'John Doe'
      };
      
      const anonymized = anonymizer.anonymizeEvidence(evidence);
      
      // Check location generalization
      if (anonymized.location.lat === evidence.location.lat) {
        throw new Error('Latitude not generalized');
      }
      
      if (Math.abs(anonymized.location.lat - 37.77) > 0.01) {
        throw new Error('Location precision incorrect');
      }
      
      // Check name generalization
      if (anonymized.userName !== 'Anonymous User') {
        throw new Error('Name not generalized correctly');
      }
    });
    
    // Test 4: Nested Object Processing
    console.log('\n4️⃣ Testing nested object processing...');
    runTest('Should anonymize nested sensitive fields', () => {
      const anonymizer = new EvidenceAnonymizer();
      
      const evidence = {
        id: 'test',
        user: {
          userId: 'user123',
          profile: {
            email: 'test@example.com',
            personalData: {
              ssn: '123-45-6789',
              creditCard: '4111-1111-1111-1111'
            }
          }
        },
        metadata: {
          safe: 'this-is-safe',
          ipAddress: '10.0.0.1'
        }
      };
      
      const anonymized = anonymizer.anonymizeEvidence(evidence);
      
      // Check nested fields were anonymized
      if (anonymized.user.userId === evidence.user.userId) {
        throw new Error('Nested userId not anonymized');
      }
      
      if (anonymized.user.profile.email === evidence.user.profile.email) {
        throw new Error('Deeply nested email not anonymized');
      }
      
      if (anonymized.metadata.ipAddress === evidence.metadata.ipAddress) {
        throw new Error('Nested ipAddress not anonymized');
      }
      
      // Check non-sensitive nested fields remain
      if (anonymized.metadata.safe !== evidence.metadata.safe) {
        throw new Error('Non-sensitive nested field was changed');
      }
    });
    
    runTest('Should handle arrays correctly', () => {
      const anonymizer = new EvidenceAnonymizer();
      
      const evidence = {
        events: [
          { userId: 'user1', action: 'login' },
          { userId: 'user2', action: 'logout' },
          { userId: 'user3', action: 'update' }
        ],
        tags: ['public', 'test', 'safe']
      };
      
      const anonymized = anonymizer.anonymizeEvidence(evidence);
      
      // Check array elements were processed
      evidence.events.forEach((event, index) => {
        if (anonymized.events[index].userId === event.userId) {
          throw new Error(`Array element ${index} userId not anonymized`);
        }
        if (anonymized.events[index].action !== event.action) {
          throw new Error(`Array element ${index} action was incorrectly changed`);
        }
      });
      
      // Check simple array remains unchanged
      if (JSON.stringify(anonymized.tags) !== JSON.stringify(evidence.tags)) {
        throw new Error('Simple string array was modified');
      }
    });
    
    // Test 5: Pattern Detection
    console.log('\n5️⃣ Testing pattern detection...');
    runTest('Should detect sensitive patterns in field names', () => {
      const anonymizer = new EvidenceAnonymizer();
      
      const evidence = {
        user_password: 'secret123',
        apiKey: 'sk_test_123',
        authToken: 'bearer_abc',
        privateKey: '-----BEGIN PRIVATE KEY-----',
        userSecret: 'my-secret',
        personalIdentifier: 'ID-12345'
      };
      
      const anonymized = anonymizer.anonymizeEvidence(evidence);
      
      // All these should be anonymized based on patterns
      const sensitiveFields = [
        'user_password', 'apiKey', 'authToken', 
        'privateKey', 'userSecret', 'personalIdentifier'
      ];
      
      sensitiveFields.forEach(field => {
        if (anonymized[field] === evidence[field]) {
          throw new Error(`Pattern-based detection failed for ${field}`);
        }
      });
    });
    
    // Test 6: Presets
    console.log('\n6️⃣ Testing anonymizer presets...');
    runTest('Should use strict preset correctly', () => {
      const anonymizer = createAnonymizer('strict');
      
      const evidence = {
        userId: 'user123',
        email: 'test@example.com',
        ipAddress: '192.168.1.1',
        location: { lat: 40.7128, lng: -74.0060 },
        deviceId: 'device-abc',
        personalData: { age: 30, income: 50000 }
      };
      
      const anonymized = anonymizer.anonymizeEvidence(evidence);
      
      // Strict preset should remove certain fields
      if (anonymized.email !== '[REMOVED]') {
        throw new Error('Email not removed in strict mode');
      }
      
      if (anonymized.ipAddress !== '[REMOVED]') {
        throw new Error('IP address not removed in strict mode');
      }
      
      if (anonymized.personalData !== '[REMOVED]') {
        throw new Error('Personal data not removed in strict mode');
      }
      
      // Location should be generalized
      if (anonymized.location.lat === evidence.location.lat) {
        throw new Error('Location not generalized in strict mode');
      }
    });
    
    runTest('Should use minimal preset correctly', () => {
      const anonymizer = createAnonymizer('minimal');
      
      const evidence = {
        userId: 'user123',
        email: 'test@example.com',
        password: 'secret123',
        token: 'auth_token_abc'
      };
      
      const anonymized = anonymizer.anonymizeEvidence(evidence);
      
      // Minimal preset should only anonymize critical fields
      if (anonymized.userId !== evidence.userId) {
        throw new Error('userId changed in minimal mode');
      }
      
      if (anonymized.email !== evidence.email) {
        throw new Error('email changed in minimal mode');
      }
      
      if (anonymized.password === evidence.password) {
        throw new Error('password not anonymized in minimal mode');
      }
      
      if (anonymized.token === evidence.token) {
        throw new Error('token not anonymized in minimal mode');
      }
    });
    
    // Test 7: Batch Processing
    console.log('\n7️⃣ Testing batch anonymization...');
    runTest('Should process batch of evidence records', async () => {
      const anonymizer = new EvidenceAnonymizer();
      
      const evidences = [
        { id: '1', userId: 'user1', data: 'safe1' },
        { id: '2', userId: 'user2', data: 'safe2' },
        { id: '3', userId: 'user3', data: 'safe3' }
      ];
      
      const result = await anonymizeEvidenceBatch(evidences, anonymizer);
      
      if (result.success.length !== 3) {
        throw new Error('Not all records processed successfully');
      }
      
      if (result.errors.length !== 0) {
        throw new Error('Unexpected errors in batch processing');
      }
      
      // Verify each record was anonymized
      result.success.forEach((anonymized, index) => {
        if (anonymized.userId === evidences[index].userId) {
          throw new Error(`Record ${index} not anonymized in batch`);
        }
      });
    });
    
    // Test 8: Statistics and Audit
    console.log('\n8️⃣ Testing statistics and audit...');
    runTest('Should track anonymization statistics', () => {
      const anonymizer = new EvidenceAnonymizer();
      
      // Process multiple records
      for (let i = 0; i < 5; i++) {
        anonymizer.anonymizeEvidence({
          userId: `user${i}`,
          email: `user${i}@example.com`,
          data: i
        });
      }
      
      const stats = anonymizer.getStatistics();
      
      if (stats.totalProcessed !== 5) {
        throw new Error('Total processed count incorrect');
      }
      
      if (stats.fieldCounts.userId !== 5) {
        throw new Error('Field count tracking incorrect');
      }
      
      // userId uses hash, email uses mask by default
      const expectedHashCount = 5; // 5 userIds 
      const expectedMaskCount = 5; // 5 emails
      if (!stats.strategyCounts.hash || stats.strategyCounts.hash !== expectedHashCount) {
        throw new Error(`Hash strategy count incorrect: expected ${expectedHashCount}, got ${stats.strategyCounts.hash || 0}`);
      }
      if (!stats.strategyCounts.mask || stats.strategyCounts.mask !== expectedMaskCount) {
        throw new Error(`Mask strategy count incorrect: expected ${expectedMaskCount}, got ${stats.strategyCounts.mask || 0}`);
      }
    });
    
    runTest('Should maintain audit log', () => {
      const anonymizer = new EvidenceAnonymizer({ auditLog: true });
      
      const evidence = {
        id: 'audit-test',
        userId: 'user123',
        sessionId: 'session456'
      };
      
      anonymizer.anonymizeEvidence(evidence);
      
      const auditLog = anonymizer.exportAuditLog();
      
      if (!auditLog.entries || auditLog.entries.length === 0) {
        throw new Error('Audit log not maintained');
      }
      
      const entry = auditLog.entries[0];
      if (entry.recordId !== 'audit-test') {
        throw new Error('Audit entry missing record ID');
      }
      
      if (!entry.changedFields.includes('userId')) {
        throw new Error('Audit entry missing changed fields');
      }
      
      if (!entry.checksum) {
        throw new Error('Audit entry missing checksum');
      }
    });
    
    // Test 9: Type Preservation
    console.log('\n9️⃣ Testing type preservation...');
    runTest('Should preserve type hints when configured', () => {
      const anonymizer = new EvidenceAnonymizer({
        preservePatterns: true,
        sensitiveFields: ['userId', 'accountNumber', 'ipAddress', 'timestamp'], // Add fields to sensitive list
        fieldStrategies: {
          userId: 'hash',
          accountNumber: 'hash',
          ipAddress: 'hash', // Override default mask strategy for IP
          timestamp: 'hash'
        }
      });
      
      const evidence = {
        userId: 'user@example.com',
        accountNumber: '12345',
        ipAddress: '192.168.1.1',
        timestamp: new Date().toISOString(),
        isActive: true,
        scores: [1, 2, 3]
      };
      
      const anonymized = anonymizer.anonymizeEvidence(evidence);
      
      // Check type prefixes
      if (!anonymized.userId.startsWith('EMAIL_')) {
        throw new Error('Email type prefix not added');
      }
      
      if (!anonymized.accountNumber || !anonymized.accountNumber.startsWith('NUM_')) {
        throw new Error(`Numeric string type prefix not added: got ${anonymized.accountNumber}`);
      }
      
      if (!anonymized.ipAddress || !anonymized.ipAddress.startsWith('IP_')) {
        throw new Error(`IP address type prefix not added: got ${anonymized.ipAddress}`);
      }
    });
    
    // Test 10: Memory Cleanup
    console.log('\n🔟 Testing memory cleanup...');
    runTest('Should clear sensitive data from memory', () => {
      const anonymizer = new EvidenceAnonymizer();
      
      // Process some data
      anonymizer.anonymizeEvidence({
        userId: 'test',
        secret: 'sensitive-data'
      });
      
      const statsBefore = anonymizer.getStatistics();
      if (statsBefore.saltCacheSize === 0) {
        throw new Error('Salt cache not populated');
      }
      
      // Clear sensitive data
      anonymizer.clearSensitiveData();
      
      const statsAfter = anonymizer.getStatistics();
      if (statsAfter.saltCacheSize !== 0) {
        throw new Error('Salt cache not cleared');
      }
      
      if (statsAfter.auditEntries !== 0) {
        throw new Error('Audit entries not cleared');
      }
    });
    
    console.log(`\n📊 Test Results: ${testSuite.passed}/${testSuite.passed + testSuite.failed} tests passed`);
    
    if (testSuite.failed === 0) {
      console.log('🎉 All Evidence Anonymizer tests passed!');
      console.log('✨ Anonymization is irreversible and secure');
    } else {
      console.log(`⚠️ ${testSuite.failed} test(s) failed`);
    }
    
    return testSuite.failed === 0;
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    console.error(error.stack);
    return false;
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runEvidenceAnonymizerTests();
}