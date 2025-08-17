/**
 * Evidence Anonymization Plugin
 * Masks or aggregates sensitive fields in Evidence records before storage
 * Ensures privacy and GDPR compliance
 */

import crypto from 'crypto';

export class EvidenceAnonymizer {
  constructor(config = {}) {
    this.config = {
      // Fields to anonymize
      sensitiveFields: config.sensitiveFields || [
        'userId',
        'sessionId',
        'ipAddress',
        'email',
        'name',
        'location',
        'deviceId',
        'personalData'
      ],
      
      // Anonymization strategies
      strategies: {
        hash: config.strategies?.hash || {
          algorithm: 'sha256',
          salt: config.strategies?.hash?.salt || this.generateSalt()
        },
        mask: config.strategies?.mask || {
          preserveLength: true,
          maskChar: '*',
          visibleStart: 2,
          visibleEnd: 2
        },
        aggregate: config.strategies?.aggregate || {
          precision: 2,  // Decimal places for numeric aggregation
          timeWindow: 3600000  // 1 hour for temporal aggregation
        },
        generalize: config.strategies?.generalize || {
          locationPrecision: 'city',  // city, region, country
          timePrecision: 'hour'  // minute, hour, day
        }
      },
      
      // Field-specific strategies
      fieldStrategies: config.fieldStrategies || {
        userId: 'hash',
        sessionId: 'hash',
        ipAddress: 'mask',
        email: 'mask',
        name: 'generalize',
        location: 'generalize',
        deviceId: 'hash',
        personalData: 'remove'
      },
      
      // Preserve certain patterns for analysis
      preservePatterns: config.preservePatterns !== false,
      
      // Enable audit log
      auditLog: config.auditLog !== false,
      
      // Reversibility check
      ensureIrreversible: config.ensureIrreversible !== false
    };
    
    // Internal state
    this.saltCache = new Map();
    this.auditEntries = [];
    this.anonymizationStats = {
      totalProcessed: 0,
      fieldCounts: {},
      strategyCounts: {}
    };
  }
  
  /**
   * Generate a secure random salt
   */
  generateSalt() {
    return crypto.randomBytes(32).toString('hex');
  }
  
  /**
   * Anonymize an evidence record
   */
  anonymizeEvidence(evidence) {
    if (!evidence || typeof evidence !== 'object') {
      return evidence;
    }
    
    const startTime = Date.now();
    const anonymized = this.deepClone(evidence);
    const changes = [];
    
    // Process each field
    this.processObject(anonymized, '', changes);
    
    // Add anonymization metadata
    anonymized._anonymized = {
      timestamp: Date.now(),
      version: '1.0',
      fields: changes.length,
      duration: Date.now() - startTime
    };
    
    // Update statistics
    this.anonymizationStats.totalProcessed++;
    
    // Audit log
    if (this.config.auditLog) {
      this.logAnonymization(evidence, anonymized, changes);
    }
    
    // Ensure irreversibility if configured
    if (this.config.ensureIrreversible) {
      this.verifyIrreversibility(evidence, anonymized);
    }
    
    return anonymized;
  }
  
  /**
   * Process object recursively
   */
  processObject(obj, path, changes) {
    for (const key in obj) {
      if (!obj.hasOwnProperty(key)) continue;
      
      const fullPath = path ? `${path}.${key}` : key;
      const value = obj[key];
      
      // Check if field is sensitive
      if (this.isSensitiveField(key, fullPath)) {
        const strategy = this.getFieldStrategy(key, fullPath);
        const anonymizedValue = this.applyStrategy(value, strategy, key);
        
        if (anonymizedValue !== value) {
          obj[key] = anonymizedValue;
          changes.push({
            field: fullPath,
            strategy: strategy,
            type: typeof value
          });
          
          // Update statistics
          this.anonymizationStats.fieldCounts[key] = 
            (this.anonymizationStats.fieldCounts[key] || 0) + 1;
          this.anonymizationStats.strategyCounts[strategy] = 
            (this.anonymizationStats.strategyCounts[strategy] || 0) + 1;
        }
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Recurse into nested objects
        this.processObject(value, fullPath, changes);
      } else if (Array.isArray(value)) {
        // Process arrays
        value.forEach((item, index) => {
          if (typeof item === 'object' && item !== null) {
            this.processObject(item, `${fullPath}[${index}]`, changes);
          }
        });
      }
    }
  }
  
  /**
   * Check if field is sensitive
   */
  isSensitiveField(fieldName, fullPath) {
    // Direct match
    if (this.config.sensitiveFields.includes(fieldName)) {
      return true;
    }
    
    // Pattern matching
    const patterns = [
      /password/i,
      /secret/i,
      /key/i,
      /token/i,
      /auth/i,
      /private/i,
      /personal/i,
      /identifier/i,
      /ssn/i,
      /credit/i
    ];
    
    return patterns.some(pattern => pattern.test(fieldName) || pattern.test(fullPath));
  }
  
  /**
   * Get anonymization strategy for field
   */
  getFieldStrategy(fieldName, fullPath) {
    // Check field-specific strategies
    if (this.config.fieldStrategies[fieldName]) {
      return this.config.fieldStrategies[fieldName];
    }
    
    // Default strategies based on data type patterns
    if (/id|identifier|key/i.test(fieldName)) {
      return 'hash';
    }
    if (/email|phone|address/i.test(fieldName)) {
      return 'mask';
    }
    if (/location|geo|coordinate/i.test(fieldName)) {
      return 'generalize';
    }
    if (/time|date|timestamp/i.test(fieldName)) {
      return 'aggregate';
    }
    
    // Default strategy
    return 'hash';
  }
  
  /**
   * Apply anonymization strategy
   */
  applyStrategy(value, strategy, fieldName) {
    if (value === null || value === undefined) {
      return value;
    }
    
    switch (strategy) {
      case 'hash':
        return this.hashValue(value, fieldName);
        
      case 'mask':
        return this.maskValue(value);
        
      case 'aggregate':
        return this.aggregateValue(value, fieldName);
        
      case 'generalize':
        return this.generalizeValue(value, fieldName);
        
      case 'remove':
        return '[REMOVED]';
        
      default:
        return this.hashValue(value, fieldName);
    }
  }
  
  /**
   * Hash a value with salt
   */
  hashValue(value, fieldName) {
    const stringValue = this.stringify(value);
    const salt = this.getSaltForField(fieldName);
    
    const hash = crypto
      .createHash(this.config.strategies.hash.algorithm)
      .update(stringValue + salt)
      .digest('hex');
    
    // Preserve type hint if configured
    if (this.config.preservePatterns) {
      const typePrefix = this.getTypePrefix(value);
      return `${typePrefix}${hash.substring(0, 16)}`;
    }
    
    return hash.substring(0, 16);
  }
  
  /**
   * Mask a value
   */
  maskValue(value) {
    const stringValue = this.stringify(value);
    const config = this.config.strategies.mask;
    
    if (stringValue.length <= config.visibleStart + config.visibleEnd) {
      return config.maskChar.repeat(stringValue.length);
    }
    
    const start = stringValue.substring(0, config.visibleStart);
    const end = stringValue.substring(stringValue.length - config.visibleEnd);
    const middleLength = stringValue.length - config.visibleStart - config.visibleEnd;
    const middle = config.maskChar.repeat(middleLength);
    
    return start + middle + end;
  }
  
  /**
   * Aggregate numeric or temporal values
   */
  aggregateValue(value, fieldName) {
    if (typeof value === 'number') {
      // Round to specified precision
      const precision = this.config.strategies.aggregate.precision;
      const factor = Math.pow(10, precision);
      return Math.round(value * factor) / factor;
    }
    
    if (value instanceof Date || typeof value === 'string') {
      // Try to parse as date
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        // Round to time window
        const window = this.config.strategies.aggregate.timeWindow;
        const rounded = Math.floor(date.getTime() / window) * window;
        return new Date(rounded).toISOString();
      }
    }
    
    // Fallback to hash
    return this.hashValue(value, fieldName || 'aggregate');
  }
  
  /**
   * Generalize location or categorical data
   */
  generalizeValue(value, fieldName) {
    // Location generalization
    if (/location|geo|coordinate/i.test(fieldName)) {
      if (typeof value === 'object' && value.lat && value.lng) {
        const precision = this.config.strategies.generalize.locationPrecision;
        
        switch (precision) {
          case 'city':
            return {
              lat: Math.round(value.lat * 100) / 100,
              lng: Math.round(value.lng * 100) / 100,
              precision: 'city'
            };
          case 'region':
            return {
              lat: Math.round(value.lat * 10) / 10,
              lng: Math.round(value.lng * 10) / 10,
              precision: 'region'
            };
          case 'country':
            return {
              lat: Math.round(value.lat),
              lng: Math.round(value.lng),
              precision: 'country'
            };
        }
      }
    }
    
    // Time generalization
    if (/time|date|timestamp/i.test(fieldName)) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        const precision = this.config.strategies.generalize.timePrecision;
        
        switch (precision) {
          case 'minute':
            date.setSeconds(0, 0);
            break;
          case 'hour':
            date.setMinutes(0, 0, 0);
            break;
          case 'day':
            date.setHours(0, 0, 0, 0);
            break;
        }
        
        return date.toISOString();
      }
    }
    
    // Name generalization
    if (/name|person/i.test(fieldName)) {
      return 'Anonymous User';
    }
    
    // String value generalization - check if it's a name
    if (typeof value === 'string' && /name|person/i.test(fieldName)) {
      return 'Anonymous User';
    }
    
    // Default: return category
    return '[GENERALIZED]';
  }
  
  /**
   * Get salt for field
   */
  getSaltForField(fieldName) {
    if (!this.saltCache.has(fieldName)) {
      const fieldSalt = crypto
        .createHash('sha256')
        .update(this.config.strategies.hash.salt + fieldName)
        .digest('hex');
      this.saltCache.set(fieldName, fieldSalt);
    }
    return this.saltCache.get(fieldName);
  }
  
  /**
   * Get type prefix for value
   */
  getTypePrefix(value) {
    if (typeof value === 'string') {
      // Check patterns in order of specificity
      if (/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) return 'EMAIL_';
      if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(value)) return 'IP_';
      if (/^\d+$/.test(value)) return 'NUM_';
      return 'STR_';
    }
    if (typeof value === 'number') return 'NUM_';
    if (typeof value === 'boolean') return 'BOOL_';
    if (value instanceof Date) return 'DATE_';
    if (Array.isArray(value)) return 'ARR_';
    if (typeof value === 'object') return 'OBJ_';
    return 'UNK_';
  }
  
  /**
   * Convert value to string
   */
  stringify(value) {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (value instanceof Date) return value.toISOString();
    return JSON.stringify(value);
  }
  
  /**
   * Deep clone object
   */
  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => this.deepClone(item));
    
    const cloned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = this.deepClone(obj[key]);
      }
    }
    return cloned;
  }
  
  /**
   * Log anonymization for audit
   */
  logAnonymization(original, anonymized, changes) {
    const entry = {
      timestamp: Date.now(),
      recordId: original.id || 'unknown',
      changedFields: changes.map(c => c.field),
      strategies: [...new Set(changes.map(c => c.strategy))],
      checksum: this.calculateChecksum(anonymized)
    };
    
    this.auditEntries.push(entry);
    
    // Limit audit log size
    if (this.auditEntries.length > 10000) {
      this.auditEntries = this.auditEntries.slice(-5000);
    }
  }
  
  /**
   * Calculate checksum for anonymized data
   */
  calculateChecksum(data) {
    const json = JSON.stringify(data, Object.keys(data).sort());
    return crypto.createHash('md5').update(json).digest('hex');
  }
  
  /**
   * Verify that anonymization is irreversible
   */
  verifyIrreversibility(original, anonymized) {
    // This is a basic check - in production, use more sophisticated methods
    const originalStr = JSON.stringify(original);
    const anonymizedStr = JSON.stringify(anonymized);
    
    // Check that no original sensitive values appear in anonymized version
    this.config.sensitiveFields.forEach(field => {
      const value = this.getNestedValue(original, field);
      if (value && typeof value === 'string' && value.length > 3) {
        if (anonymizedStr.includes(value)) {
          throw new Error(`Anonymization failed: original value for ${field} found in anonymized data`);
        }
      }
    });
  }
  
  /**
   * Get nested value from object
   */
  getNestedValue(obj, path) {
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    }
    
    return current;
  }
  
  /**
   * Get anonymization statistics
   */
  getStatistics() {
    return {
      ...this.anonymizationStats,
      auditEntries: this.auditEntries.length,
      saltCacheSize: this.saltCache.size
    };
  }
  
  /**
   * Export audit log
   */
  exportAuditLog() {
    return {
      exported: new Date().toISOString(),
      entries: this.auditEntries,
      statistics: this.getStatistics()
    };
  }
  
  /**
   * Clear sensitive data from memory
   */
  clearSensitiveData() {
    this.saltCache.clear();
    this.auditEntries = [];
  }
}

/**
 * Create a pre-configured anonymizer for common use cases
 */
export function createAnonymizer(preset = 'standard') {
  const presets = {
    standard: {
      sensitiveFields: ['userId', 'sessionId', 'ipAddress', 'email', 'name'],
      ensureIrreversible: true
    },
    strict: {
      sensitiveFields: [
        'userId', 'sessionId', 'ipAddress', 'email', 'name',
        'location', 'deviceId', 'personalData', 'metadata'
      ],
      fieldStrategies: {
        userId: 'hash',
        sessionId: 'hash',
        ipAddress: 'remove',
        email: 'remove',
        name: 'remove',
        location: 'generalize',
        deviceId: 'hash',
        personalData: 'remove',
        metadata: 'remove'
      },
      ensureIrreversible: true
    },
    minimal: {
      sensitiveFields: ['password', 'secret', 'token'],
      preservePatterns: false,
      auditLog: false
    }
  };
  
  return new EvidenceAnonymizer(presets[preset] || {});
}

/**
 * Batch anonymization helper
 */
export async function anonymizeEvidenceBatch(evidences, anonymizer) {
  const results = [];
  const errors = [];
  
  for (let i = 0; i < evidences.length; i++) {
    try {
      const anonymized = anonymizer.anonymizeEvidence(evidences[i]);
      results.push(anonymized);
    } catch (error) {
      errors.push({
        index: i,
        error: error.message,
        evidence: evidences[i]
      });
    }
  }
  
  return {
    success: results,
    errors: errors,
    statistics: anonymizer.getStatistics()
  };
}