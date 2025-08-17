/**
 * Temporal Glyphs - Visual symbols representing temporal consciousness laws
 * Each glyph is a living symbol that responds to the law's current state
 */

export class TemporalGlyphs {
  constructor() {
    // Glyph generation parameters
    this.config = {
      size: 128,           // Base size for glyphs
      complexity: 5,       // Number of elements per glyph
      animationSpeed: 2,   // Seconds per animation cycle
      colorPalette: {
        rhythmic: ['#8b5cf6', '#a78bfa', '#c4b5fd'],
        focal: ['#3b82f6', '#60a5fa', '#93c5fd'],
        adaptive: ['#10b981', '#34d399', '#6ee7b7'],
        predictive: ['#f59e0b', '#fbbf24', '#fcd34d'],
        anomalous: ['#ef4444', '#f87171', '#fca5a5'],
        neutral: ['#6b7280', '#9ca3af', '#d1d5db']
      }
    };
    
    // Glyph templates for different law types
    this.templates = {
      'rhythmic-resonance': this.createRhythmicTemplate(),
      'focal-evolution': this.createFocalTemplate(),
      'adaptive-recovery': this.createAdaptiveTemplate(),
      'prediction-decay': this.createPredictiveTemplate()
    };
    
    // Active glyphs
    this.glyphs = new Map();
    
    // Animation frame tracking
    this.animationFrame = null;
    this.lastUpdate = Date.now();
  }
  
  /**
   * Generate a glyph for a temporal law
   */
  generateGlyph(law) {
    const template = this.templates[law.id] || this.createDefaultTemplate(law);
    
    // Create SVG container
    const svg = this.createSVG(this.config.size, this.config.size);
    
    // Generate glyph elements based on template and law state
    const elements = this.generateElements(template, law);
    
    // Assemble glyph
    elements.forEach(element => svg.appendChild(element));
    
    // Store glyph data
    const glyphData = {
      svg,
      law,
      elements,
      template,
      created: Date.now(),
      animated: true
    };
    
    this.glyphs.set(law.id, glyphData);
    
    return glyphData;
  }
  
  /**
   * Create rhythmic resonance template
   */
  createRhythmicTemplate() {
    return {
      type: 'rhythmic',
      structure: [
        {
          type: 'circle',
          id: 'core',
          cx: 0.5,
          cy: 0.5,
          r: 0.2,
          style: 'fill: var(--color-primary); opacity: 0.8;'
        },
        {
          type: 'path',
          id: 'wave1',
          d: 'M 0.1 0.5 Q 0.3 0.3, 0.5 0.5 T 0.9 0.5',
          style: 'stroke: var(--color-secondary); stroke-width: 2; fill: none;',
          animate: {
            attributeName: 'd',
            values: [
              'M 0.1 0.5 Q 0.3 0.3, 0.5 0.5 T 0.9 0.5',
              'M 0.1 0.5 Q 0.3 0.7, 0.5 0.5 T 0.9 0.5',
              'M 0.1 0.5 Q 0.3 0.3, 0.5 0.5 T 0.9 0.5'
            ],
            dur: '2s',
            repeatCount: 'indefinite'
          }
        },
        {
          type: 'path',
          id: 'wave2',
          d: 'M 0.2 0.2 Q 0.5 0.1, 0.8 0.2',
          style: 'stroke: var(--color-tertiary); stroke-width: 1.5; fill: none;',
          animate: {
            attributeName: 'opacity',
            values: '0.3;1;0.3',
            dur: '3s',
            repeatCount: 'indefinite'
          }
        },
        {
          type: 'circle',
          id: 'pulse1',
          cx: 0.5,
          cy: 0.5,
          r: 0.15,
          style: 'fill: none; stroke: var(--color-primary); stroke-width: 1;',
          animate: {
            attributeName: 'r',
            values: '0.15;0.3;0.15',
            dur: '2s',
            repeatCount: 'indefinite'
          }
        },
        {
          type: 'circle',
          id: 'pulse2',
          cx: 0.5,
          cy: 0.5,
          r: 0.2,
          style: 'fill: none; stroke: var(--color-secondary); stroke-width: 0.5;',
          animate: {
            attributeName: 'r',
            values: '0.2;0.4;0.2',
            dur: '2s',
            begin: '0.5s',
            repeatCount: 'indefinite'
          }
        }
      ],
      colors: (confidence) => {
        const intensity = Math.floor(confidence * 2);
        return {
          primary: this.config.colorPalette.rhythmic[intensity],
          secondary: this.config.colorPalette.rhythmic[(intensity + 1) % 3],
          tertiary: this.config.colorPalette.rhythmic[(intensity + 2) % 3]
        };
      }
    };
  }
  
  /**
   * Create focal evolution template
   */
  createFocalTemplate() {
    return {
      type: 'focal',
      structure: [
        {
          type: 'polygon',
          id: 'triangle',
          points: '0.5,0.2 0.2,0.8 0.8,0.8',
          style: 'fill: var(--color-primary); opacity: 0.6;',
          animate: {
            attributeName: 'transform',
            type: 'rotate',
            values: '0 0.5 0.5;360 0.5 0.5',
            dur: '8s',
            repeatCount: 'indefinite'
          }
        },
        {
          type: 'circle',
          id: 'focus',
          cx: 0.5,
          cy: 0.5,
          r: 0.1,
          style: 'fill: var(--color-secondary);'
        },
        {
          type: 'path',
          id: 'spiral',
          d: this.generateSpiral(0.5, 0.5, 0.05, 0.35, 3),
          style: 'stroke: var(--color-tertiary); stroke-width: 1.5; fill: none;',
          animate: {
            attributeName: 'stroke-dasharray',
            values: '0 200;200 0',
            dur: '4s',
            repeatCount: 'indefinite'
          }
        },
        {
          type: 'circle',
          id: 'orbit1',
          cx: 0.7,
          cy: 0.5,
          r: 0.05,
          style: 'fill: var(--color-primary);',
          animateTransform: {
            type: 'rotate',
            values: '0 0.5 0.5;360 0.5 0.5',
            dur: '3s',
            repeatCount: 'indefinite'
          }
        },
        {
          type: 'circle',
          id: 'orbit2',
          cx: 0.3,
          cy: 0.5,
          r: 0.04,
          style: 'fill: var(--color-secondary);',
          animateTransform: {
            type: 'rotate',
            values: '0 0.5 0.5;-360 0.5 0.5',
            dur: '5s',
            repeatCount: 'indefinite'
          }
        }
      ],
      colors: (confidence) => {
        const intensity = Math.floor(confidence * 2);
        return {
          primary: this.config.colorPalette.focal[intensity],
          secondary: this.config.colorPalette.focal[(intensity + 1) % 3],
          tertiary: this.config.colorPalette.focal[(intensity + 2) % 3]
        };
      }
    };
  }
  
  /**
   * Create adaptive recovery template
   */
  createAdaptiveTemplate() {
    return {
      type: 'adaptive',
      structure: [
        {
          type: 'path',
          id: 'heartbeat',
          d: 'M 0.2 0.5 L 0.3 0.5 L 0.35 0.3 L 0.4 0.7 L 0.45 0.2 L 0.5 0.8 L 0.55 0.3 L 0.6 0.6 L 0.65 0.5 L 0.8 0.5',
          style: 'stroke: var(--color-primary); stroke-width: 2; fill: none;',
          animate: {
            attributeName: 'opacity',
            values: '0.3;1;0.3',
            dur: '1.5s',
            repeatCount: 'indefinite'
          }
        },
        {
          type: 'ellipse',
          id: 'shield',
          cx: 0.5,
          cy: 0.5,
          rx: 0.3,
          ry: 0.35,
          style: 'fill: none; stroke: var(--color-secondary); stroke-width: 2;',
          animate: {
            attributeName: 'stroke-width',
            values: '2;4;2',
            dur: '2s',
            repeatCount: 'indefinite'
          }
        },
        {
          type: 'path',
          id: 'recovery1',
          d: 'M 0.5 0.8 Q 0.3 0.6, 0.5 0.4',
          style: 'stroke: var(--color-tertiary); stroke-width: 1.5; fill: none;',
          animate: {
            attributeName: 'stroke-dashoffset',
            values: '50;0',
            dur: '2s',
            repeatCount: 'indefinite'
          }
        },
        {
          type: 'path',
          id: 'recovery2',
          d: 'M 0.5 0.8 Q 0.7 0.6, 0.5 0.4',
          style: 'stroke: var(--color-tertiary); stroke-width: 1.5; fill: none;',
          animate: {
            attributeName: 'stroke-dashoffset',
            values: '50;0',
            dur: '2s',
            begin: '0.5s',
            repeatCount: 'indefinite'
          }
        },
        {
          type: 'circle',
          id: 'core',
          cx: 0.5,
          cy: 0.5,
          r: 0.08,
          style: 'fill: var(--color-primary); opacity: 0.8;'
        }
      ],
      colors: (confidence) => {
        const intensity = Math.floor(confidence * 2);
        return {
          primary: this.config.colorPalette.adaptive[intensity],
          secondary: this.config.colorPalette.adaptive[(intensity + 1) % 3],
          tertiary: this.config.colorPalette.adaptive[(intensity + 2) % 3]
        };
      }
    };
  }
  
  /**
   * Create predictive decay template
   */
  createPredictiveTemplate() {
    return {
      type: 'predictive',
      structure: [
        {
          type: 'circle',
          id: 'crystal',
          cx: 0.5,
          cy: 0.5,
          r: 0.15,
          style: 'fill: var(--color-primary); opacity: 0.6;'
        },
        {
          type: 'polygon',
          id: 'prism1',
          points: '0.5,0.35 0.35,0.5 0.5,0.65 0.65,0.5',
          style: 'fill: none; stroke: var(--color-secondary); stroke-width: 1.5;',
          animate: {
            attributeName: 'opacity',
            values: '1;0.3;1',
            dur: '3s',
            repeatCount: 'indefinite'
          }
        },
        {
          type: 'path',
          id: 'decay1',
          d: 'M 0.5 0.5 L 0.8 0.3',
          style: 'stroke: var(--color-tertiary); stroke-width: 1; opacity: 0.8;',
          animate: {
            attributeName: 'opacity',
            values: '0.8;0.1',
            dur: '2s',
            repeatCount: 'indefinite'
          }
        },
        {
          type: 'path',
          id: 'decay2',
          d: 'M 0.5 0.5 L 0.8 0.5',
          style: 'stroke: var(--color-tertiary); stroke-width: 1; opacity: 0.6;',
          animate: {
            attributeName: 'opacity',
            values: '0.6;0.1',
            dur: '2.5s',
            repeatCount: 'indefinite'
          }
        },
        {
          type: 'path',
          id: 'decay3',
          d: 'M 0.5 0.5 L 0.8 0.7',
          style: 'stroke: var(--color-tertiary); stroke-width: 1; opacity: 0.4;',
          animate: {
            attributeName: 'opacity',
            values: '0.4;0.1',
            dur: '3s',
            repeatCount: 'indefinite'
          }
        }
      ],
      colors: (confidence) => {
        const intensity = Math.floor(confidence * 2);
        return {
          primary: this.config.colorPalette.predictive[intensity],
          secondary: this.config.colorPalette.predictive[(intensity + 1) % 3],
          tertiary: this.config.colorPalette.predictive[(intensity + 2) % 3]
        };
      }
    };
  }
  
  /**
   * Create default template for unknown laws
   */
  createDefaultTemplate(law) {
    return {
      type: 'default',
      structure: [
        {
          type: 'circle',
          id: 'base',
          cx: 0.5,
          cy: 0.5,
          r: 0.3,
          style: 'fill: none; stroke: var(--color-primary); stroke-width: 2;'
        },
        {
          type: 'text',
          id: 'symbol',
          x: 0.5,
          y: 0.5,
          text: law.glyph || '?',
          style: 'text-anchor: middle; dominant-baseline: middle; font-size: 24px; fill: var(--color-secondary);'
        }
      ],
      colors: (confidence) => {
        return {
          primary: this.config.colorPalette.neutral[0],
          secondary: this.config.colorPalette.neutral[1],
          tertiary: this.config.colorPalette.neutral[2]
        };
      }
    };
  }
  
  /**
   * Generate spiral path
   */
  generateSpiral(cx, cy, startR, endR, turns) {
    const points = [];
    const steps = 50;
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const angle = t * turns * 2 * Math.PI;
      const r = startR + (endR - startR) * t;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      
      if (i === 0) {
        points.push(`M ${x} ${y}`);
      } else {
        points.push(`L ${x} ${y}`);
      }
    }
    
    return points.join(' ');
  }
  
  /**
   * Create SVG element
   */
  createSVG(width, height) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.setAttribute('viewBox', '0 0 1 1');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    
    // Add CSS variables for colors
    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.textContent = `
      :root {
        --color-primary: #8b5cf6;
        --color-secondary: #a78bfa;
        --color-tertiary: #c4b5fd;
      }
    `;
    svg.appendChild(style);
    
    return svg;
  }
  
  /**
   * Generate elements from template
   */
  generateElements(template, law) {
    const elements = [];
    const colors = template.colors(law.confidence);
    
    // Update CSS variables
    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.textContent = `
      :root {
        --color-primary: ${colors.primary};
        --color-secondary: ${colors.secondary};
        --color-tertiary: ${colors.tertiary};
      }
    `;
    elements.push(style);
    
    // Generate each element
    template.structure.forEach(spec => {
      const element = this.createElement(spec, law);
      if (element) {
        elements.push(element);
      }
    });
    
    return elements;
  }
  
  /**
   * Create individual SVG element
   */
  createElement(spec, law) {
    let element;
    
    switch (spec.type) {
      case 'circle':
        element = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        element.setAttribute('cx', spec.cx);
        element.setAttribute('cy', spec.cy);
        element.setAttribute('r', spec.r);
        break;
        
      case 'path':
        element = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        element.setAttribute('d', spec.d);
        break;
        
      case 'polygon':
        element = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        element.setAttribute('points', spec.points);
        break;
        
      case 'ellipse':
        element = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        element.setAttribute('cx', spec.cx);
        element.setAttribute('cy', spec.cy);
        element.setAttribute('rx', spec.rx);
        element.setAttribute('ry', spec.ry);
        break;
        
      case 'text':
        element = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        element.setAttribute('x', spec.x);
        element.setAttribute('y', spec.y);
        element.textContent = spec.text;
        break;
        
      default:
        return null;
    }
    
    // Apply style
    if (spec.style) {
      element.setAttribute('style', spec.style);
    }
    
    // Apply ID
    if (spec.id) {
      element.setAttribute('id', `glyph-${law.id}-${spec.id}`);
    }
    
    // Apply animations
    if (spec.animate) {
      const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
      Object.entries(spec.animate).forEach(([key, value]) => {
        animate.setAttribute(key, value);
      });
      element.appendChild(animate);
    }
    
    if (spec.animateTransform) {
      const animateTransform = document.createElementNS('http://www.w3.org/2000/svg', 'animateTransform');
      animateTransform.setAttribute('attributeName', 'transform');
      Object.entries(spec.animateTransform).forEach(([key, value]) => {
        animateTransform.setAttribute(key, value);
      });
      element.appendChild(animateTransform);
    }
    
    return element;
  }
  
  /**
   * Update glyph based on law state changes
   */
  updateGlyph(lawId, newConfidence) {
    const glyphData = this.glyphs.get(lawId);
    if (!glyphData) return;
    
    // Regenerate with new confidence
    const law = { ...glyphData.law, confidence: newConfidence };
    const newElements = this.generateElements(glyphData.template, law);
    
    // Clear old elements
    while (glyphData.svg.firstChild) {
      glyphData.svg.removeChild(glyphData.svg.firstChild);
    }
    
    // Add new elements
    newElements.forEach(element => glyphData.svg.appendChild(element));
    
    // Update stored data
    glyphData.elements = newElements;
    glyphData.law = law;
  }
  
  /**
   * Create glyph gallery interface
   */
  createGlyphGallery(container) {
    const gallery = document.createElement('div');
    gallery.id = 'temporal-glyph-gallery';
    gallery.style.cssText = `
      position: relative;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 20px;
      padding: 20px;
      background: rgba(30, 30, 30, 0.9);
      border-radius: 12px;
      border: 1px solid rgba(139, 92, 246, 0.3);
    `;
    
    // Title
    const title = document.createElement('div');
    title.style.cssText = `
      grid-column: 1 / -1;
      text-align: center;
      font-size: 24px;
      font-weight: bold;
      color: #e0e7ff;
      margin-bottom: 10px;
    `;
    title.textContent = 'Temporal Law Glyphs';
    gallery.appendChild(title);
    
    // Add description
    const description = document.createElement('div');
    description.style.cssText = `
      grid-column: 1 / -1;
      text-align: center;
      font-size: 14px;
      color: #94a3b8;
      margin-bottom: 20px;
    `;
    description.textContent = 'Living symbols that respond to temporal consciousness patterns';
    gallery.appendChild(description);
    
    container.appendChild(gallery);
    
    return gallery;
  }
  
  /**
   * Add glyph to gallery
   */
  addToGallery(glyphData, gallery) {
    const card = document.createElement('div');
    card.style.cssText = `
      background: rgba(45, 45, 45, 0.8);
      border-radius: 8px;
      padding: 15px;
      text-align: center;
      transition: all 0.3s;
      cursor: pointer;
    `;
    
    // Add hover effect
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'scale(1.05)';
      card.style.boxShadow = '0 4px 20px rgba(139, 92, 246, 0.3)';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'scale(1)';
      card.style.boxShadow = 'none';
    });
    
    // Glyph container
    const glyphContainer = document.createElement('div');
    glyphContainer.style.cssText = `
      display: flex;
      justify-content: center;
      align-items: center;
      height: 128px;
      margin-bottom: 10px;
    `;
    glyphContainer.appendChild(glyphData.svg);
    
    // Law name
    const name = document.createElement('div');
    name.style.cssText = `
      font-weight: bold;
      color: #e0e7ff;
      margin-bottom: 5px;
    `;
    name.textContent = glyphData.law.name;
    
    // Confidence indicator
    const confidence = document.createElement('div');
    confidence.style.cssText = `
      font-size: 12px;
      color: #94a3b8;
    `;
    confidence.textContent = `Confidence: ${(glyphData.law.confidence * 100).toFixed(1)}%`;
    
    // Progress bar
    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
      width: 100%;
      height: 4px;
      background: #333;
      border-radius: 2px;
      margin-top: 8px;
      overflow: hidden;
    `;
    
    const progressFill = document.createElement('div');
    progressFill.style.cssText = `
      height: 100%;
      width: ${glyphData.law.confidence * 100}%;
      background: linear-gradient(90deg, #8b5cf6, #6d28d9);
      transition: width 0.5s;
    `;
    progressBar.appendChild(progressFill);
    
    card.appendChild(glyphContainer);
    card.appendChild(name);
    card.appendChild(confidence);
    card.appendChild(progressBar);
    
    gallery.appendChild(card);
    
    // Store reference for updates
    glyphData.galleryCard = card;
    glyphData.confidenceText = confidence;
    glyphData.progressFill = progressFill;
  }
  
  /**
   * Export glyph as image
   */
  exportGlyph(lawId, format = 'png') {
    const glyphData = this.glyphs.get(lawId);
    if (!glyphData) return null;
    
    const canvas = document.createElement('canvas');
    canvas.width = this.config.size * 2; // Higher resolution
    canvas.height = this.config.size * 2;
    
    const ctx = canvas.getContext('2d');
    ctx.scale(2, 2); // Scale for higher resolution
    
    // Convert SVG to data URL
    const svgData = new XMLSerializer().serializeToString(glyphData.svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, this.config.size, this.config.size);
        URL.revokeObjectURL(url);
        
        if (format === 'png') {
          canvas.toBlob(blob => resolve(blob), 'image/png');
        } else {
          resolve(canvas.toDataURL(`image/${format}`));
        }
      };
      
      img.onerror = reject;
      img.src = url;
    });
  }
  
  /**
   * Generate glyph metadata
   */
  getGlyphMetadata(lawId) {
    const glyphData = this.glyphs.get(lawId);
    if (!glyphData) return null;
    
    return {
      lawId: glyphData.law.id,
      lawName: glyphData.law.name,
      template: glyphData.template.type,
      confidence: glyphData.law.confidence,
      created: glyphData.created,
      elementCount: glyphData.elements.length,
      animated: glyphData.animated,
      colors: glyphData.template.colors(glyphData.law.confidence)
    };
  }
}

/**
 * Integration with Codex Engine
 */
export function integrateTemporalGlyphs(codexEngine) {
  const glyphSystem = new TemporalGlyphs();
  
  // Generate glyphs for all existing laws
  codexEngine.codex.laws.forEach(law => {
    const glyphData = glyphSystem.generateGlyph(law);
    codexEngine.codex.glyphs.set(law.id, glyphData);
  });
  
  // Hook into law updates
  const originalUpdateConfidence = codexEngine.updateConfidence;
  codexEngine.updateConfidence = function(oldConfidence, data) {
    const newConfidence = originalUpdateConfidence.call(this, oldConfidence, data);
    
    // Update glyph if law exists
    if (this.currentLawId) {
      glyphSystem.updateGlyph(this.currentLawId, newConfidence);
    }
    
    return newConfidence;
  };
  
  // Add glyph generation for new laws
  const originalAddNewLaw = codexEngine.addNewLaw;
  codexEngine.addNewLaw = function(id, lawData) {
    const result = originalAddNewLaw.call(this, id, lawData);
    
    // Generate glyph for new law
    const law = this.codex.laws.get(id);
    if (law) {
      const glyphData = glyphSystem.generateGlyph(law);
      this.codex.glyphs.set(id, glyphData);
    }
    
    return result;
  };
  
  // Add glyph system methods to codex
  codexEngine.getGlyph = (lawId) => glyphSystem.glyphs.get(lawId);
  codexEngine.exportGlyph = (lawId, format) => glyphSystem.exportGlyph(lawId, format);
  codexEngine.getGlyphMetadata = (lawId) => glyphSystem.getGlyphMetadata(lawId);
  codexEngine.createGlyphGallery = (container) => glyphSystem.createGlyphGallery(container);
  
  return glyphSystem;
}