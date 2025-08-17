/**
 * Edge case tests for Evidence Anonymizer
 * Testing extreme scenarios and unusual data formats
 */

import { EvidenceAnonymizer } from './evidence-anonymizer.js';

export function runEdgeCaseTests() {
  console.log('🔥 Running Evidence Anonymizer Edge Case Tests...\n');
  
  const testSuite = {
    passed: 0,
    failed: 0
  };
  
  function runTest(name, testFn) {
    try {
      testFn();
      console.log(`✅ ${name}`);
      testSuite.passed++;
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
      testSuite.failed++;
    }
  }
  
  // Test 1: Extreme String Lengths
  console.log('1️⃣ Testing extreme string lengths...');
  runTest('Should handle very long strings', () => {
    const anonymizer = new EvidenceAnonymizer();
    const longString = 'a'.repeat(10000);
    
    const evidence = {
      userId: longString,
      data: 'normal'
    };
    
    const anonymized = anonymizer.anonymizeEvidence(evidence);
    
    // Should anonymize without crashing
    if (anonymized.userId === longString) {
      throw new Error('Long string not anonymized');
    }
    
    // Result should be reasonable length
    if (anonymized.userId.length > 1000) {
      throw new Error('Anonymized result too long');
    }
  });
  
  runTest('Should handle empty strings', () => {
    const anonymizer = new EvidenceAnonymizer();
    
    const evidence = {
      userId: '',
      email: '',
      name: ''
    };
    
    const anonymized = anonymizer.anonymizeEvidence(evidence);
    
    // Empty strings should still be processed
    if (anonymized.userId === '') {
      throw new Error('Empty userId not anonymized');
    }
  });
  
  // Test 2: Unicode and Special Characters
  console.log('\n2️⃣ Testing Unicode and special characters...');
  runTest('Should handle Unicode characters', () => {
    const anonymizer = new EvidenceAnonymizer();
    
    const evidence = {
      userId: '用户123',
      email: 'тест@example.com',
      name: '🦄Rainbow🌈Unicorn',
      location: { lat: 35.6762, lng: 139.6503, name: '東京' }
    };
    
    const anonymized = anonymizer.anonymizeEvidence(evidence);
    
    // Should anonymize Unicode properly
    if (anonymized.userId === evidence.userId) {
      throw new Error('Unicode userId not anonymized');
    }
    
    // Should not break on emoji
    if (anonymized.name === evidence.name) {
      throw new Error('Emoji name not anonymized');
    }
  });
  
  runTest('Should handle special regex characters', () => {
    const anonymizer = new EvidenceAnonymizer();
    
    const evidence = {
      userId: 'user[123].*+?',
      pattern: '^$()[]{}.*+?\\|',
      data: 'safe'
    };
    
    const anonymized = anonymizer.anonymizeEvidence(evidence);
    
    // Should not crash on regex special chars
    if (anonymized.userId === evidence.userId) {
      throw new Error('Special char userId not anonymized');
    }
  });
  
  // Test 3: Nested and Complex Structures
  console.log('\n3️⃣ Testing deeply nested structures...');
  runTest('Should handle deeply nested objects', () => {
    const anonymizer = new EvidenceAnonymizer();
    
    // Create deeply nested structure
    let deepObject = { value: 'deep', userId: 'nested-user' };
    for (let i = 0; i < 50; i++) {
      deepObject = { level: i, data: deepObject };
    }
    
    const evidence = {
      id: 'test',
      deep: deepObject
    };
    
    const anonymized = anonymizer.anonymizeEvidence(evidence);
    
    // Should handle deep nesting without stack overflow
    let current = anonymized.deep;
    for (let i = 0; i < 50; i++) {
      current = current.data;
    }
    
    if (current.userId === 'nested-user') {
      throw new Error('Deeply nested userId not anonymized');
    }
  });
  
  runTest('Should handle circular references', () => {
    const anonymizer = new EvidenceAnonymizer();
    
    const evidence = {
      id: 'test',
      userId: 'user123',
      self: null
    };
    evidence.self = evidence; // Circular reference
    
    // Should not crash on circular reference
    const anonymized = anonymizer.anonymizeEvidence(evidence);
    
    if (anonymized.userId === evidence.userId) {
      throw new Error('UserId not anonymized in circular structure');
    }
  });
  
  // Test 4: Arrays and Mixed Types
  console.log('\n4️⃣ Testing arrays and mixed types...');
  runTest('Should handle arrays of mixed types', () => {
    const anonymizer = new EvidenceAnonymizer();
    
    const evidence = {
      mixedArray: [
        'string',
        123,
        true,
        null,
        undefined,
        { userId: 'array-user' },
        ['nested', 'array'],
        new Date()
      ],
      userId: 'main-user'
    };
    
    const anonymized = anonymizer.anonymizeEvidence(evidence);
    
    // Check nested object in array was processed
    if (anonymized.mixedArray[5].userId === 'array-user') {
      throw new Error('Object in array not anonymized');
    }
    
    // Check other types preserved
    if (anonymized.mixedArray[1] !== 123) {
      throw new Error('Number in array was changed');
    }
  });
  
  runTest('Should handle sparse arrays', () => {
    const anonymizer = new EvidenceAnonymizer();
    
    const evidence = {
      sparseArray: new Array(100),
      userId: 'test'
    };
    evidence.sparseArray[10] = { email: 'sparse@example.com' };
    evidence.sparseArray[50] = { password: 'secret' };
    
    const anonymized = anonymizer.anonymizeEvidence(evidence);
    
    // Should handle sparse arrays without error
    if (anonymized.sparseArray[10]?.email === 'sparse@example.com') {
      throw new Error('Sparse array element not anonymized');
    }
  });
  
  // Test 5: Edge Values
  console.log('\n5️⃣ Testing edge values...');
  runTest('Should handle JavaScript edge values', () => {
    const anonymizer = new EvidenceAnonymizer();
    
    const evidence = {
      infinity: Infinity,
      negInfinity: -Infinity,
      notANumber: NaN,
      maxInt: Number.MAX_SAFE_INTEGER,
      minInt: Number.MIN_SAFE_INTEGER,
      userId: 'edge-user'
    };
    
    const anonymized = anonymizer.anonymizeEvidence(evidence);
    
    // Should handle special numeric values - they remain as is since they're not sensitive
    if (anonymized.infinity !== Infinity) {
      throw new Error('Infinity was modified');
    }
    
    // Should still anonymize normal fields
    if (anonymized.userId === evidence.userId) {
      throw new Error('UserId not anonymized with edge values present');
    }
  });
  
  runTest('Should handle dates correctly', () => {
    const anonymizer = new EvidenceAnonymizer({
      sensitiveFields: ['userId', 'timestamp'],
      fieldStrategies: {
        timestamp: 'aggregate'
      }
    });
    
    const now = new Date();
    const evidence = {
      userId: 'date-user',
      timestamp: now,
      createdAt: now.toISOString(),
      milliseconds: now.getTime()
    };
    
    const anonymized = anonymizer.anonymizeEvidence(evidence);
    
    // Date object should be handled
    if (anonymized.timestamp === now) {
      throw new Error('Date object not anonymized');
    }
  });
  
  // Test 6: Performance Edge Cases
  console.log('\n6️⃣ Testing performance edge cases...');
  runTest('Should handle large arrays efficiently', () => {
    const anonymizer = new EvidenceAnonymizer();
    
    const largeArray = [];
    for (let i = 0; i < 1000; i++) {
      largeArray.push({
        userId: `user${i}`,
        email: `user${i}@example.com`,
        data: Math.random()
      });
    }
    
    const evidence = {
      records: largeArray
    };
    
    const start = Date.now();
    const anonymized = anonymizer.anonymizeEvidence(evidence);
    const duration = Date.now() - start;
    
    // Should complete in reasonable time
    if (duration > 5000) {
      throw new Error(`Too slow: ${duration}ms for 1000 records`);
    }
    
    // Check some records were anonymized
    const sample = anonymized.records[500];
    if (sample.userId === 'user500') {
      throw new Error('Large array elements not anonymized');
    }
  });
  
  // Test 7: Malformed Data
  console.log('\n7️⃣ Testing malformed data...');
  runTest('Should handle objects with no hasOwnProperty', () => {
    const anonymizer = new EvidenceAnonymizer();
    
    const malformed = Object.create(null);
    malformed.userId = 'no-prototype-user';
    malformed.data = 'test';
    
    // Should not crash on objects without prototype
    const anonymized = anonymizer.anonymizeEvidence(malformed);
    
    if (anonymized.userId === malformed.userId) {
      throw new Error('Object without prototype not anonymized');
    }
  });
  
  runTest('Should handle getter/setter properties', () => {
    const anonymizer = new EvidenceAnonymizer({
      sensitiveFields: ['userId', '_userId'] // Need to mark backing field as sensitive too
    });
    
    const evidence = {
      _userId: 'getter-user',
      get userId() { return this._userId; },
      set userId(value) { this._userId = value; }
    };
    
    // Should handle getters/setters without error
    const anonymized = anonymizer.anonymizeEvidence(evidence);
    
    if (anonymized._userId === 'getter-user') {
      throw new Error('Property with getter not anonymized');
    }
  });
  
  // Test 8: Real-world Scenarios
  console.log('\n8️⃣ Testing real-world scenarios...');
  runTest('Should handle MongoDB-like documents', () => {
    const anonymizer = new EvidenceAnonymizer();
    
    const document = {
      _id: '507f1f77bcf86cd799439011',
      userId: 'mongo-user',
      email: 'user@example.com',
      profile: {
        personalInfo: {
          ssn: '123-45-6789',
          dob: new Date('1990-01-01')
        }
      },
      __v: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const anonymized = anonymizer.anonymizeEvidence(document);
    
    // Should preserve MongoDB fields
    if (anonymized._id !== document._id) {
      throw new Error('MongoDB _id was anonymized');
    }
    
    // Should anonymize sensitive fields
    if (anonymized.userId === document.userId) {
      throw new Error('MongoDB document not properly anonymized');
    }
  });
  
  runTest('Should handle GraphQL-like nested structures', () => {
    const anonymizer = new EvidenceAnonymizer();
    
    const graphqlResult = {
      data: {
        user: {
          id: 'gql-123',
          email: 'graphql@example.com',
          posts: {
            edges: [
              {
                node: {
                  id: 'post-1',
                  author: {
                    email: 'author@example.com'
                  }
                }
              }
            ]
          }
        }
      }
    };
    
    const anonymized = anonymizer.anonymizeEvidence(graphqlResult);
    
    // Check nested GraphQL structure
    const authorEmail = anonymized.data.user.posts.edges[0].node.author.email;
    if (authorEmail === 'author@example.com') {
      throw new Error('Nested GraphQL email not anonymized');
    }
  });
  
  console.log(`\n📊 Edge Case Results: ${testSuite.passed}/${testSuite.passed + testSuite.failed} tests passed`);
  
  if (testSuite.failed === 0) {
    console.log('🎉 All edge cases handled successfully!');
  } else {
    console.log(`⚠️ ${testSuite.failed} edge case(s) failed`);
  }
  
  return testSuite.failed === 0;
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runEdgeCaseTests();
}