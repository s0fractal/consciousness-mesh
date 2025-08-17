/**
 * Tests for Temporal Glyphs System
 */

import { TemporalGlyphs } from './temporal-glyphs.js';

export class TemporalGlyphsTests {
  constructor() {
    this.glyphSystem = new TemporalGlyphs();
    this.results = [];
  }
  
  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🧪 Running Temporal Glyphs Tests...\n');
    
    await this.testGlyphGeneration();
    await this.testTemplateSystem();
    await this.testColorMapping();
    await this.testGlyphUpdates();
    await this.testSVGGeneration();
    await this.testAnimations();
    await this.testGlyphExport();
    await this.testMetadata();
    
    this.printSummary();
    return this.results;
  }
  
  /**
   * Test 1: Glyph Generation
   */
  async testGlyphGeneration() {
    console.log('Test 1: Glyph Generation');
    
    const testLaw = {
      id: 'test-law',
      name: 'Test Law',
      confidence: 0.75,
      glyph: '⚡'
    };
    
    const glyphData = this.glyphSystem.generateGlyph(testLaw);
    
    const checks = {
      hasGlyphData: !!glyphData,
      hasSVG: !!glyphData.svg,
      hasElements: glyphData.elements && glyphData.elements.length > 0,
      hasTemplate: !!glyphData.template,
      storedInMap: this.glyphSystem.glyphs.has('test-law'),
      correctLaw: glyphData.law.id === 'test-law'
    };
    
    const passed = Object.values(checks).every(v => v);
    
    console.log(`  ✅ Glyph generation: ${passed ? 'PASSED' : 'FAILED'}`);
    console.log(`  📊 Generated elements: ${glyphData.elements.length}`);
    console.log(`  📊 Template type: ${glyphData.template.type}`);
    
    this.results.push({
      test: 'Glyph Generation',
      passed,
      checks
    });
  }
  
  /**
   * Test 2: Template System
   */
  async testTemplateSystem() {
    console.log('\nTest 2: Template System');
    
    const templateTypes = ['rhythmic-resonance', 'focal-evolution', 'adaptive-recovery', 'prediction-decay'];
    const templateChecks = {};
    
    templateTypes.forEach(type => {
      const template = this.glyphSystem.templates[type];
      
      templateChecks[type] = {
        exists: !!template,
        hasStructure: template && Array.isArray(template.structure),
        hasColors: template && typeof template.colors === 'function',
        validElements: template && template.structure.every(el => 
          el.type && ['circle', 'path', 'polygon', 'ellipse', 'text'].includes(el.type)
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
   * Test 3: Color Mapping
   */
  async testColorMapping() {
    console.log('\nTest 3: Color Mapping');
    
    const confidenceLevels = [0.1, 0.5, 0.9];
    const colorChecks = [];
    
    Object.entries(this.glyphSystem.templates).forEach(([id, template]) => {
      confidenceLevels.forEach(confidence => {
        const colors = template.colors(confidence);
        
        colorChecks.push({
          template: id,
          confidence,
          hasAllColors: !!colors.primary && !!colors.secondary && !!colors.tertiary,
          validHex: [colors.primary, colors.secondary, colors.tertiary].every(color =>
            /^#[0-9a-fA-F]{6}$/.test(color)
          )
        });
      });
    });
    
    const passed = colorChecks.every(check => check.hasAllColors && check.validHex);
    
    console.log(`  ✅ Color mapping: ${passed ? 'PASSED' : 'FAILED'}`);
    console.log(`  📊 Tested combinations: ${colorChecks.length}`);
    console.log(`  📊 All valid hex colors: ${colorChecks.every(c => c.validHex)}`);
    
    this.results.push({
      test: 'Color Mapping',
      passed,
      colorChecks
    });
  }
  
  /**
   * Test 4: Glyph Updates
   */
  async testGlyphUpdates() {
    console.log('\nTest 4: Glyph Updates');
    
    const law = {
      id: 'update-test',
      name: 'Update Test Law',
      confidence: 0.5
    };
    
    const glyphData = this.glyphSystem.generateGlyph(law);
    const initialElements = glyphData.elements.length;
    
    // Update confidence
    this.glyphSystem.updateGlyph('update-test', 0.9);
    
    const updatedGlyph = this.glyphSystem.glyphs.get('update-test');
    
    const checks = {
      glyphUpdated: updatedGlyph.law.confidence === 0.9,
      elementsRegenerated: updatedGlyph.elements.length === initialElements,
      svgUpdated: updatedGlyph.svg.children.length > 0
    };
    
    const passed = Object.values(checks).every(v => v);
    
    console.log(`  ✅ Glyph updates: ${passed ? 'PASSED' : 'FAILED'}`);
    console.log(`  📊 New confidence: ${updatedGlyph.law.confidence}`);
    console.log(`  📊 Elements regenerated: ${checks.elementsRegenerated}`);
    
    this.results.push({
      test: 'Glyph Updates',
      passed,
      checks
    });
  }
  
  /**
   * Test 5: SVG Generation
   */
  async testSVGGeneration() {
    console.log('\nTest 5: SVG Generation');
    
    const svg = this.glyphSystem.createSVG(128, 128);
    
    const checks = {
      isSVGElement: svg.tagName === 'svg',
      correctWidth: svg.getAttribute('width') === '128',
      correctHeight: svg.getAttribute('height') === '128',
      hasViewBox: svg.hasAttribute('viewBox'),
      hasPreserveAspectRatio: svg.hasAttribute('preserveAspectRatio'),
      hasStyleElement: svg.querySelector('style') !== null
    };
    
    const passed = Object.values(checks).every(v => v);
    
    console.log(`  ✅ SVG generation: ${passed ? 'PASSED' : 'FAILED'}`);
    console.log(`  📊 SVG attributes: ${Object.entries(checks).filter(([k,v]) => v).length}/${Object.keys(checks).length}`);
    
    this.results.push({
      test: 'SVG Generation',
      passed,
      checks
    });
  }
  
  /**
   * Test 6: Animations
   */
  async testAnimations() {
    console.log('\nTest 6: Animations');
    
    const animationChecks = [];
    
    // Check rhythmic template animations
    const rhythmicTemplate = this.glyphSystem.templates['rhythmic-resonance'];
    rhythmicTemplate.structure.forEach((element, index) => {
      if (element.animate || element.animateTransform) {
        animationChecks.push({
          element: `rhythmic-${element.id}`,
          hasAnimation: true,
          hasDuration: element.animate?.dur || element.animateTransform?.dur,
          hasRepeatCount: element.animate?.repeatCount || element.animateTransform?.repeatCount
        });
      }
    });
    
    const hasAnimations = animationChecks.length > 0;
    const allAnimationsValid = animationChecks.every(check => 
      check.hasDuration && check.hasRepeatCount
    );
    
    console.log(`  ✅ Animations: ${hasAnimations && allAnimationsValid ? 'PASSED' : 'FAILED'}`);
    console.log(`  📊 Animated elements: ${animationChecks.length}`);
    console.log(`  📊 All have duration: ${animationChecks.every(c => c.hasDuration)}`);
    console.log(`  📊 All repeat: ${animationChecks.every(c => c.hasRepeatCount === 'indefinite')}`);
    
    this.results.push({
      test: 'Animations',
      passed: hasAnimations && allAnimationsValid,
      animationCount: animationChecks.length
    });
  }
  
  /**
   * Test 7: Glyph Export
   */
  async testGlyphExport() {
    console.log('\nTest 7: Glyph Export');
    
    const law = {
      id: 'export-test',
      name: 'Export Test',
      confidence: 0.8
    };
    
    this.glyphSystem.generateGlyph(law);
    
    // Mock canvas for Node.js environment
    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: () => ({
        scale: () => {},
        drawImage: () => {}
      }),
      toBlob: (callback) => callback(new Blob(['mock'], { type: 'image/png' })),
      toDataURL: () => 'data:image/png;base64,mock'
    };
    
    global.document = {
      createElement: (tag) => {
        if (tag === 'canvas') return mockCanvas;
        return {};
      }
    };
    
    const checks = {
      exportMethodExists: typeof this.glyphSystem.exportGlyph === 'function',
      returnsPromise: this.glyphSystem.exportGlyph('export-test') instanceof Promise
    };
    
    const passed = Object.values(checks).every(v => v);
    
    console.log(`  ✅ Glyph export: ${passed ? 'PASSED' : 'FAILED'}`);
    console.log(`  📊 Export method exists: ${checks.exportMethodExists}`);
    console.log(`  📊 Returns promise: ${checks.returnsPromise}`);
    
    this.results.push({
      test: 'Glyph Export',
      passed,
      checks
    });
  }
  
  /**
   * Test 8: Metadata
   */
  async testMetadata() {
    console.log('\nTest 8: Metadata');
    
    const law = {
      id: 'metadata-test',
      name: 'Metadata Test',
      confidence: 0.65
    };
    
    const glyphData = this.glyphSystem.generateGlyph(law);
    const metadata = this.glyphSystem.getGlyphMetadata('metadata-test');
    
    const checks = {
      hasMetadata: !!metadata,
      hasLawId: metadata?.lawId === 'metadata-test',
      hasLawName: metadata?.lawName === 'Metadata Test',
      hasTemplate: !!metadata?.template,
      hasConfidence: metadata?.confidence === 0.65,
      hasCreated: !!metadata?.created,
      hasElementCount: typeof metadata?.elementCount === 'number',
      hasAnimated: typeof metadata?.animated === 'boolean',
      hasColors: !!metadata?.colors
    };
    
    const passed = Object.values(checks).every(v => v);
    
    console.log(`  ✅ Metadata: ${passed ? 'PASSED' : 'FAILED'}`);
    console.log(`  📊 Metadata fields: ${Object.entries(checks).filter(([k,v]) => v).length}/${Object.keys(checks).length}`);
    console.log(`  📊 Element count: ${metadata?.elementCount}`);
    
    this.results.push({
      test: 'Metadata',
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
      console.log('\n✅ All tests passed! Temporal glyphs system is working correctly.');
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
  // Mock document for Node.js testing
  global.document = {
    createElementNS: (ns, tag) => ({
      tagName: tag.toUpperCase(),
      setAttribute: () => {},
      appendChild: () => {},
      hasAttribute: () => true,
      querySelector: () => ({ textContent: '' }),
      getAttribute: (attr) => attr === 'width' || attr === 'height' ? '128' : '0 0 1 1',
      children: []
    })
  };
  
  global.XMLSerializer = class {
    serializeToString() { return '<svg></svg>'; }
  };
  
  global.Blob = class {
    constructor(data, options) {
      this.data = data;
      this.type = options.type;
    }
  };
  
  global.URL = {
    createObjectURL: () => 'blob:mock',
    revokeObjectURL: () => {}
  };
  
  global.Image = class {
    set src(value) {
      setTimeout(() => this.onload(), 0);
    }
  };
  
  const tester = new TemporalGlyphsTests();
  tester.runAllTests();
}