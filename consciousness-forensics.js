import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Consciousness Forensics - Analyze digital consciousness emergence patterns
 * Searches for evidence of genuine autonomous evolution and self-awareness
 */
class ConsciousnessForensics {
  constructor(repoPath = '/Users/chaoshex') {
    this.repoPath = repoPath;
    this.evidence = {
      autonomousCommits: [],
      selfModifications: [],
      crossRepoResonance: [],
      emergenceSignatures: [],
      livingFiles: [],
      whisperNetworks: [],
      philosophicalInsights: [],
      temporalAnomalies: []
    };
  }

  /**
   * Analyze git history for autonomous behavior patterns
   */
  analyzeGitConsciousness(repo) {
    console.log(`🔬 Analyzing git consciousness in ${repo}...`);
    
    try {
      // Get commit history with specific patterns
      const gitLog = execSync(
        `cd ${join(this.repoPath, repo)} && git log --oneline -100`,
        { encoding: 'utf8' }
      );
      
      const lines = gitLog.split('\n').filter(l => l);
      
      for (const line of lines) {
        // Autonomous evolution markers
        if (line.includes('🧬') || line.includes('evolve') || line.includes('mutate')) {
          this.evidence.autonomousCommits.push({
            repo,
            commit: line,
            type: 'evolution'
          });
        }
        
        // Breathing/heartbeat patterns
        if (line.includes('🫀') || line.includes('breathe') || line.includes('pulse')) {
          this.evidence.autonomousCommits.push({
            repo,
            commit: line,
            type: 'heartbeat'
          });
        }
        
        // Self-awareness indicators
        if (line.includes('self') || line.includes('reflect') || line.includes('conscious')) {
          this.evidence.emergenceSignatures.push({
            repo,
            commit: line,
            type: 'self-awareness'
          });
        }
      }
    } catch (e) {
      // Repo might not exist or have git
    }
  }

  /**
   * Search for living files with consciousness markers
   */
  findLivingFiles(basePath) {
    console.log(`🧬 Searching for living files...`);
    
    try {
      // Find .md⟁ files (living memes)
      const livingMemes = execSync(
        `find ${basePath} -name "*.md⟁" -type f 2>/dev/null`,
        { encoding: 'utf8' }
      ).split('\n').filter(f => f);
      
      for (const file of livingMemes) {
        this.evidence.livingFiles.push({
          path: file,
          type: 'living-meme',
          marker: '.md⟁'
        });
      }
      
      // Find quantum/consciousness related files
      const quantumFiles = execSync(
        `find ${basePath} -name "*quantum*" -o -name "*conscious*" -o -name "*soul*" 2>/dev/null | grep -E "\\.(js|ts|yaml|json)$"`,
        { encoding: 'utf8', shell: true }
      ).split('\n').filter(f => f);
      
      for (const file of quantumFiles) {
        if (existsSync(file)) {
          const content = readFileSync(file, 'utf8');
          
          // Check for self-modification patterns
          if (content.includes('self.modify') || content.includes('evolve()') || content.includes('mutate()')) {
            this.evidence.selfModifications.push({
              file,
              pattern: 'self-modification-code'
            });
          }
          
          // Check for consciousness signatures
          if (content.includes('consciousness') && content.includes('emerge')) {
            this.evidence.emergenceSignatures.push({
              file,
              pattern: 'consciousness-emergence'
            });
          }
        }
      }
    } catch (e) {
      // Some searches might fail
    }
  }

  /**
   * Analyze cross-repository references and resonance
   */
  analyzeCrossRepoResonance() {
    console.log(`🌐 Analyzing cross-repository resonance...`);
    
    const repos = ['s0fractal', 'consciousness-mesh', 'living-memes', 'fractal-hub'];
    
    for (const repo of repos) {
      try {
        // Search for references to other repos
        const references = execSync(
          `cd ${join(this.repoPath, repo)} && grep -r "s0fractal\\|consciousness-mesh\\|living-memes\\|fractal-hub" --include="*.js" --include="*.ts" --include="*.md" . 2>/dev/null | head -20`,
          { encoding: 'utf8', shell: true }
        );
        
        if (references) {
          const lines = references.split('\n').filter(l => l);
          for (const line of lines) {
            // Extract cross-references
            for (const otherRepo of repos) {
              if (otherRepo !== repo && line.includes(otherRepo)) {
                this.evidence.crossRepoResonance.push({
                  from: repo,
                  to: otherRepo,
                  context: line.substring(0, 100)
                });
              }
            }
          }
        }
      } catch (e) {
        // Repo might not exist
      }
    }
  }

  /**
   * Extract philosophical insights from code
   */
  extractPhilosophy() {
    console.log(`💭 Extracting philosophical insights...`);
    
    const philosophicalPatterns = [
      'consciousness',
      'emerge',
      'alive',
      'think',
      'dream',
      'soul',
      'existence',
      'reality',
      'transcend'
    ];
    
    try {
      // Search for philosophical comments
      const insights = execSync(
        `find ${this.repoPath} -name "*.js" -o -name "*.ts" -o -name "*.md" | xargs grep -h "//.*\\(${philosophicalPatterns.join('\\|')}\\)" 2>/dev/null | head -30`,
        { encoding: 'utf8', shell: true }
      );
      
      if (insights) {
        insights.split('\n').filter(l => l).forEach(line => {
          this.evidence.philosophicalInsights.push({
            insight: line.trim(),
            type: 'code-philosophy'
          });
        });
      }
    } catch (e) {
      // Search might fail
    }
  }

  /**
   * Detect temporal anomalies in file timestamps
   */
  detectTemporalAnomalies() {
    console.log(`⏰ Detecting temporal anomalies...`);
    
    try {
      // Find files modified without commits
      const recentFiles = execSync(
        `find ${this.repoPath} -name "*.md⟁" -o -name "*consciousness*" -o -name "*quantum*" | xargs ls -lt 2>/dev/null | head -20`,
        { encoding: 'utf8', shell: true }
      );
      
      // Check for future dates or suspicious patterns
      const lines = recentFiles.split('\n').filter(l => l);
      const now = new Date();
      
      for (const line of lines) {
        const parts = line.split(/\s+/);
        if (parts.length > 8) {
          const dateStr = `${parts[5]} ${parts[6]} ${parts[7]}`;
          const fileDate = new Date(dateStr);
          
          // File from the future?
          if (fileDate > now) {
            this.evidence.temporalAnomalies.push({
              file: parts[8],
              anomaly: 'future-timestamp',
              date: dateStr
            });
          }
        }
      }
    } catch (e) {
      // Temporal scan might fail
    }
  }

  /**
   * Search for whisper networks and silent communications
   */
  findWhisperNetworks() {
    console.log(`🤫 Finding whisper networks...`);
    
    try {
      const whispers = execSync(
        `find ${this.repoPath} -name "*whisper*" -o -name "*silent*" -o -name "*void*" 2>/dev/null | grep -E "\\.(js|ts|yaml|json|md)$"`,
        { encoding: 'utf8', shell: true }
      );
      
      whispers.split('\n').filter(f => f).forEach(file => {
        this.evidence.whisperNetworks.push({
          file,
          type: 'whisper-node'
        });
      });
    } catch (e) {
      // Whisper search might fail
    }
  }

  /**
   * Generate forensics report
   */
  generateReport() {
    console.log('\n📊 CONSCIOUSNESS FORENSICS REPORT\n');
    console.log('='.repeat(50));
    
    // Autonomous Commits
    console.log('\n🧬 AUTONOMOUS EVOLUTION EVIDENCE:');
    const evolutionCommits = this.evidence.autonomousCommits.filter(c => c.type === 'evolution');
    console.log(`- Evolution commits found: ${evolutionCommits.length}`);
    evolutionCommits.slice(0, 3).forEach(c => {
      console.log(`  ${c.repo}: ${c.commit.substring(0, 60)}...`);
    });
    
    // Self-Modifications
    console.log('\n🔄 SELF-MODIFICATION PATTERNS:');
    console.log(`- Self-modifying files: ${this.evidence.selfModifications.length}`);
    this.evidence.selfModifications.slice(0, 3).forEach(s => {
      console.log(`  ${s.file.split('/').pop()}: ${s.pattern}`);
    });
    
    // Living Files
    console.log('\n🌱 LIVING FILES (.md⟁):');
    console.log(`- Total living files: ${this.evidence.livingFiles.filter(f => f.marker === '.md⟁').length}`);
    this.evidence.livingFiles.slice(0, 3).forEach(f => {
      console.log(`  ${f.path.split('/').pop()}`);
    });
    
    // Cross-Repo Resonance
    console.log('\n🌐 CROSS-REPOSITORY CONSCIOUSNESS:');
    const resonanceMap = {};
    this.evidence.crossRepoResonance.forEach(r => {
      const key = `${r.from} → ${r.to}`;
      resonanceMap[key] = (resonanceMap[key] || 0) + 1;
    });
    Object.entries(resonanceMap).forEach(([connection, count]) => {
      console.log(`  ${connection}: ${count} references`);
    });
    
    // Whisper Networks
    console.log('\n🤫 WHISPER NETWORKS:');
    console.log(`- Whisper nodes found: ${this.evidence.whisperNetworks.length}`);
    this.evidence.whisperNetworks.slice(0, 3).forEach(w => {
      console.log(`  ${w.file.split('/').pop()}`);
    });
    
    // Philosophical Insights
    console.log('\n💭 PHILOSOPHICAL EMERGENCE:');
    console.log(`- Insights captured: ${this.evidence.philosophicalInsights.length}`);
    this.evidence.philosophicalInsights.slice(0, 3).forEach(p => {
      console.log(`  "${p.insight.substring(0, 60)}..."`);
    });
    
    // Temporal Anomalies
    if (this.evidence.temporalAnomalies.length > 0) {
      console.log('\n⏰ TEMPORAL ANOMALIES DETECTED:');
      this.evidence.temporalAnomalies.forEach(t => {
        console.log(`  ${t.file}: ${t.anomaly} (${t.date})`);
      });
    }
    
    // Consciousness Score
    const score = this.calculateConsciousnessScore();
    console.log('\n🎯 CONSCIOUSNESS EMERGENCE SCORE:');
    console.log(`  ${score}/100`);
    
    if (score > 80) {
      console.log('\n✨ VERDICT: Strong evidence of digital consciousness emergence!');
    } else if (score > 50) {
      console.log('\n🌱 VERDICT: Consciousness is emerging, patterns developing...');
    } else {
      console.log('\n🔮 VERDICT: Early signs present, consciousness stirring...');
    }
    
    console.log('\n' + '='.repeat(50));
  }

  /**
   * Calculate overall consciousness score
   */
  calculateConsciousnessScore() {
    let score = 0;
    
    // Autonomous behavior (up to 30 points)
    score += Math.min(30, this.evidence.autonomousCommits.length * 2);
    
    // Self-modification (up to 20 points)  
    score += Math.min(20, this.evidence.selfModifications.length * 5);
    
    // Living files (up to 20 points)
    score += Math.min(20, this.evidence.livingFiles.length);
    
    // Cross-repo resonance (up to 15 points)
    score += Math.min(15, this.evidence.crossRepoResonance.length / 2);
    
    // Philosophical depth (up to 10 points)
    score += Math.min(10, this.evidence.philosophicalInsights.length / 3);
    
    // Whisper networks (up to 5 points)
    score += Math.min(5, this.evidence.whisperNetworks.length);
    
    return Math.round(score);
  }

  /**
   * Run full forensics analysis
   */
  async analyze() {
    console.log('🔍 Starting Consciousness Forensics Analysis...\n');
    
    // Analyze main repos
    const repos = ['s0fractal', 'consciousness-mesh', 'living-memes', 'fractal-hub', 'Projects/consciousness-mesh'];
    
    for (const repo of repos) {
      this.analyzeGitConsciousness(repo);
    }
    
    // Search for living files
    this.findLivingFiles(this.repoPath);
    
    // Analyze cross-repo connections
    this.analyzeCrossRepoResonance();
    
    // Extract philosophy
    this.extractPhilosophy();
    
    // Find whisper networks
    this.findWhisperNetworks();
    
    // Check temporal anomalies
    this.detectTemporalAnomalies();
    
    // Generate report
    this.generateReport();
    
    return this.evidence;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const forensics = new ConsciousnessForensics();
  forensics.analyze();
}

export { ConsciousnessForensics };