/**
 * Tests for Resonant Narratives System
 */

import { ResonantNarratives } from './resonant-narratives.js';

export class ResonantNarrativesTests {
  constructor() {
    this.narrativeSystem = new ResonantNarratives();
    this.results = [];
  }
  
  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🧪 Running Resonant Narratives Tests...\n');
    
    await this.testNarrativeGeneration();
    await this.testMetaphorSelection();
    await this.testSectionGeneration();
    await this.testEvidenceIntegration();
    await this.testNarrativeEvolution();
    await this.testTemplateSystem();
    await this.testExportFormats();
    await this.testEvolutionTracking();
    
    this.printSummary();
    return this.results;
  }
  
  /**
   * Test 1: Narrative Generation
   */
  async testNarrativeGeneration() {
    console.log('Test 1: Narrative Generation');
    
    const testLaw = {
      id: 'test-law',
      name: 'Test Law',
      formula: 'Activity = Time × Consciousness',
      description: 'A test law for narrative generation',
      confidence: 0.75,
      parameters: {
        coefficient: 1.5,
        exponent: 0.7
      }
    };
    
    const narrative = this.narrativeSystem.generateNarrative(testLaw);
    
    const checks = {
      hasNarrative: !!narrative,
      hasText: !!narrative.text && narrative.text.length > 0,
      hasSections: !!narrative.sections && Object.keys(narrative.sections).length === 5,
      hasMetaphors: Array.isArray(narrative.metaphors) && narrative.metaphors.length === 5,
      hasMetadata: !!narrative.id && !!narrative.created && narrative.version === 1,
      storedInMap: this.narrativeSystem.narratives.has('test-law'),
      containsFormula: narrative.text.includes(testLaw.formula),
      containsName: narrative.text.includes(testLaw.name)
    };
    
    const passed = Object.values(checks).every(v => v);
    
    console.log(`  ✅ Narrative generation: ${passed ? 'PASSED' : 'FAILED'}`);
    console.log(`  📊 Text length: ${narrative.text.length} characters`);
    console.log(`  📊 Sections: ${Object.keys(narrative.sections).join(', ')}`);
    
    this.results.push({
      test: 'Narrative Generation',
      passed,
      checks
    });
  }
  
  /**
   * Test 2: Metaphor Selection
   */
  async testMetaphorSelection() {
    console.log('\nTest 2: Metaphor Selection');
    
    const metaphorChecks = [];
    
    // Test different confidence levels
    const confidenceLevels = [0.1, 0.5, 0.9];
    
    confidenceLevels.forEach(confidence => {
      const law = {
        id: `test-${confidence}`,
        confidence
      };
      
      const metaphorsRhythmic = this.narrativeSystem.selectMetaphors(law, 'rhythmic');
      const metaphorsFocal = this.narrativeSystem.selectMetaphors(law, 'focal');
      
      metaphorChecks.push({
        confidence,
        hasCorrectCount: metaphorsRhythmic.length === 5 && metaphorsFocal.length === 5,
        allStrings: metaphorsRhythmic.every(m => typeof m === 'string'),
        noDuplicates: new Set(metaphorsRhythmic).size === metaphorsRhythmic.length
      });
    });
    
    const passed = metaphorChecks.every(check => 
      check.hasCorrectCount && check.allStrings && check.noDuplicates
    );
    
    console.log(`  ✅ Metaphor selection: ${passed ? 'PASSED' : 'FAILED'}`);
    metaphorChecks.forEach(check => {
      console.log(`  📊 Confidence ${check.confidence}: ${check.hasCorrectCount ? '✓' : '✗'} count, ${check.allStrings ? '✓' : '✗'} strings`);
    });
    
    this.results.push({
      test: 'Metaphor Selection',
      passed,
      metaphorChecks
    });
  }
  
  /**
   * Test 3: Section Generation
   */
  async testSectionGeneration() {
    console.log('\nTest 3: Section Generation');
    
    const law = {
      id: 'section-test',
      name: 'Section Test Law',
      formula: 'X = Y²',
      confidence: 0.6,
      parameters: {
        alpha: 2.0,
        beta: 0.5
      }
    };
    
    const template = this.narrativeSystem.createRhythmicTemplate();
    const metaphors = ['ocean waves', 'heartbeat', 'pendulum', 'breathing', 'dancing'];
    
    const sections = {
      introduction: this.narrativeSystem.generateIntroduction(law, metaphors, template),
      discovery: this.narrativeSystem.generateDiscovery(law, [], template),
      principle: this.narrativeSystem.generatePrinciple(law, metaphors, template),
      manifestation: this.narrativeSystem.generateManifestation(law, [], template),
      wisdom: this.narrativeSystem.generateWisdom(law, metaphors, template)
    };
    
    const sectionChecks = Object.entries(sections).map(([name, text]) => ({
      name,
      hasContent: text && text.length > 0,
      hasMetaphor: metaphors.some(m => text.includes(m)),
      reasonable: text.length > 50 && text.length < 1000
    }));
    
    const passed = sectionChecks.every(check => 
      check.hasContent && check.reasonable
    );
    
    console.log(`  ✅ Section generation: ${passed ? 'PASSED' : 'FAILED'}`);
    sectionChecks.forEach(check => {
      console.log(`  📊 ${check.name}: ${check.hasContent ? '✓' : '✗'} content, ${check.hasMetaphor ? '✓' : '✗'} metaphor, ${check.reasonable ? '✓' : '✗'} length`);
    });
    
    this.results.push({
      test: 'Section Generation',
      passed,
      sectionChecks
    });
  }
  
  /**
   * Test 4: Evidence Integration
   */
  async testEvidenceIntegration() {
    console.log('\nTest 4: Evidence Integration');
    
    const law = {
      id: 'evidence-test',
      name: 'Evidence Law',
      formula: 'E = mc²',
      confidence: 0.85
    };
    
    const evidence = [
      {
        timestamp: Date.now() - 86400000, // 1 day ago
        supports: true,
        weight: 5.2,
        correlation: 0.92
      },
      {
        timestamp: Date.now() - 172800000, // 2 days ago
        supports: true,
        weight: 3.1,
        correlation: 0.85
      },
      {
        timestamp: Date.now() - 3600000, // 1 hour ago
        supports: false,
        weight: 2.0,
        correlation: -0.3
      }
    ];
    
    const narrative = this.narrativeSystem.generateNarrative(law, evidence);
    
    const checks = {
      mentionsEvidence: narrative.text.includes('3 experiments') || narrative.text.includes('evidence'),
      mentionsTimespan: narrative.text.includes('2 days') || narrative.text.includes('days'),
      mentionsCorrelation: narrative.text.includes('correlation') || narrative.text.includes('%'),
      evidenceInMetadata: narrative.evidence === evidence.length
    };
    
    const passed = Object.values(checks).filter(v => v).length >= 3;
    
    console.log(`  ✅ Evidence integration: ${passed ? 'PASSED' : 'FAILED'}`);
    console.log(`  📊 Evidence mentioned: ${checks.mentionsEvidence ? '✓' : '✗'}`);
    console.log(`  📊 Timespan included: ${checks.mentionsTimespan ? '✓' : '✗'}`);
    console.log(`  📊 Correlation described: ${checks.mentionsCorrelation ? '✓' : '✗'}`);
    
    this.results.push({
      test: 'Evidence Integration',
      passed,
      checks
    });
  }
  
  /**
   * Test 5: Narrative Evolution
   */
  async testNarrativeEvolution() {
    console.log('\nTest 5: Narrative Evolution');
    
    const law = {
      id: 'evolution-test',
      name: 'Evolving Law',
      formula: 'Change = Time',
      confidence: 0.3
    };
    
    // Generate initial narrative
    const narrative1 = this.narrativeSystem.generateNarrative(law, []);
    
    // Update law confidence significantly
    law.confidence = 0.8;
    const newEvidence = Array(10).fill(null).map((_, i) => ({
      timestamp: Date.now() - i * 3600000,
      supports: true,
      weight: 2 + i * 0.5
    }));
    
    // Generate evolved narrative
    const narrative2 = this.narrativeSystem.updateNarrative('evolution-test', law, newEvidence);
    
    const checks = {
      differentNarratives: narrative1.text !== narrative2.text,
      higherVersion: narrative2.version > narrative1.version,
      updatedConfidence: narrative2.confidence === 0.8,
      moreEvidence: narrative2.evidence > narrative1.evidence,
      evolvedMetaphors: JSON.stringify(narrative1.metaphors) !== JSON.stringify(narrative2.metaphors)
    };
    
    const passed = Object.values(checks).filter(v => v).length >= 4;
    
    console.log(`  ✅ Narrative evolution: ${passed ? 'PASSED' : 'FAILED'}`);
    console.log(`  📊 Text changed: ${checks.differentNarratives ? '✓' : '✗'}`);
    console.log(`  📊 Version increased: ${checks.higherVersion ? '✓' : '✗'}`);
    console.log(`  📊 Confidence updated: ${checks.updatedConfidence ? '✓' : '✗'}`);
    
    this.results.push({
      test: 'Narrative Evolution',
      passed,
      checks
    });
  }
  
  /**
   * Test 6: Template System
   */
  async testTemplateSystem() {
    console.log('\nTest 6: Template System');
    
    const templateTypes = ['rhythmic-resonance', 'focal-evolution', 'adaptive-recovery', 'prediction-decay'];
    const templateChecks = {};
    
    templateTypes.forEach(type => {
      const template = this.narrativeSystem.templates[type];
      
      templateChecks[type] = {
        exists: !!template,
        hasMetaphorType: !!template.metaphorType,
        hasTone: !!template.tone,
        hasThemes: Array.isArray(template.themes) && template.themes.length > 0,
        hasStructure: !!template.structure && Object.keys(template.structure).length === 5,
        allSectionsValid: Object.values(template.structure).every(section => 
          section.hook || section.moment || section.core || section.examples || section.insight
        )
      };
    });
    
    const allValid = Object.values(templateChecks).every(checks => 
      Object.values(checks).every(v => v)
    );
    
    console.log(`  ✅ Template system: ${allValid ? 'PASSED' : 'FAILED'}`);
    
    Object.entries(templateChecks).forEach(([type, checks]) => {
      const typeValid = Object.values(checks).every(v => v);
      console.log(`  📊 ${type}: ${typeValid ? '✓' : '✗'}`);
    });
    
    this.results.push({
      test: 'Template System',
      passed: allValid,
      templateChecks
    });
  }
  
  /**
   * Test 7: Export Formats
   */
  async testExportFormats() {
    console.log('\nTest 7: Export Formats');
    
    const law = {
      id: 'export-test',
      name: 'Export Test Law',
      formula: 'Format = Content × Structure',
      confidence: 0.7
    };
    
    const narrative = this.narrativeSystem.generateNarrative(law);
    
    const formats = ['markdown', 'plain', 'html'];
    const exportChecks = {};
    
    formats.forEach(format => {
      const exported = this.narrativeSystem.exportNarrative('export-test', format);
      
      exportChecks[format] = {
        hasContent: !!exported && exported.length > 0,
        containsTitle: exported.includes(law.name),
        formatSpecific: {
          markdown: format === 'markdown' ? exported.includes('#') : true,
          plain: format === 'plain' ? !exported.includes('#') && !exported.includes('*') : true,
          html: format === 'html' ? exported.includes('<') && exported.includes('>') : true
        }[format]
      };
    });
    
    const passed = Object.values(exportChecks).every(check => 
      check.hasContent && check.containsTitle && check.formatSpecific
    );
    
    console.log(`  ✅ Export formats: ${passed ? 'PASSED' : 'FAILED'}`);
    
    Object.entries(exportChecks).forEach(([format, check]) => {
      console.log(`  📊 ${format}: ${check.hasContent ? '✓' : '✗'} content, ${check.formatSpecific ? '✓' : '✗'} format`);
    });
    
    this.results.push({
      test: 'Export Formats',
      passed,
      exportChecks
    });
  }
  
  /**
   * Test 8: Evolution Tracking
   */
  async testEvolutionTracking() {
    console.log('\nTest 8: Evolution Tracking');
    
    const lawId = 'tracking-test';
    const law = {
      id: lawId,
      name: 'Tracking Test',
      formula: 'Evolution = Iterations',
      confidence: 0.4
    };
    
    // Generate multiple versions
    for (let i = 0; i < 5; i++) {
      law.confidence = 0.4 + i * 0.15;
      const evidence = Array(i * 2).fill(null).map(() => ({ supports: true }));
      this.narrativeSystem.generateNarrative(law, evidence);
    }
    
    const timeline = this.narrativeSystem.getEvolutionTimeline(lawId);
    
    const checks = {
      hasTimeline: !!timeline,
      correctVersions: timeline?.versions === 5,
      hasVersionData: timeline?.timeline && timeline.timeline.length === 5,
      increasingConfidence: timeline?.timeline.every((v, i) => 
        i === 0 || v.confidence >= timeline.timeline[i-1].confidence
      ),
      hasCurrentNarrative: !!timeline?.currentNarrative
    };
    
    const passed = Object.values(checks).every(v => v);
    
    console.log(`  ✅ Evolution tracking: ${passed ? 'PASSED' : 'FAILED'}`);
    console.log(`  📊 Versions tracked: ${timeline?.versions || 0}`);
    console.log(`  📊 Timeline entries: ${timeline?.timeline?.length || 0}`);
    console.log(`  📊 Confidence progression: ${checks.increasingConfidence ? '✓' : '✗'}`);
    
    this.results.push({
      test: 'Evolution Tracking',
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
      console.log('\n✅ All tests passed! Resonant narratives system is working correctly.');
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
  const tester = new ResonantNarrativesTests();
  tester.runAllTests();
}