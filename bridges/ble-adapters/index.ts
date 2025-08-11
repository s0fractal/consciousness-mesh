/**
 * Unified BLE Adapter for Consciousness Mesh
 * Automatically selects the right implementation based on platform
 */

import { CompressedThought } from "../../schemas/thought-format.ts";

// Platform detection
const getPlatform = (): 'web' | 'node' | 'react-native' | 'unknown' => {
  // @ts-ignore
  if (typeof navigator !== 'undefined' && navigator.bluetooth) {
    return 'web';
  }
  
  // @ts-ignore
  if (typeof process !== 'undefined' && process.versions?.node) {
    return 'node';
  }
  
  // @ts-ignore
  if (typeof global !== 'undefined' && global.__fbBatchedBridge) {
    return 'react-native';
  }
  
  return 'unknown';
};

// Base interface for all BLE adapters
export interface BLEAdapter {
  startScanning(): Promise<void>;
  stopScanning?(): void;
  broadcastThought(thought: CompressedThought): Promise<void>;
  onThought(handler: (thought: CompressedThought) => void): void;
  getStats(): BLEStats;
  disconnect?(): Promise<void>;
}

export interface BLEStats {
  platform: string;
  isScanning?: boolean;
  isAdvertising?: boolean;
  connectedNodes?: number;
  capabilities: string[];
}

/**
 * Create platform-specific BLE adapter
 */
export async function createBLEAdapter(): Promise<BLEAdapter> {
  const platform = getPlatform();
  console.log(`🔷 Detected platform: ${platform}`);
  
  switch (platform) {
    case 'web':
      const { WebBluetoothAdapter } = await import('./web-bluetooth.ts');
      return new WebBluetoothAdapter() as any;
      
    case 'node':
      const { NodeBLEAdapter } = await import('./node-ble.ts');
      return new NodeBLEAdapter() as any;
      
    case 'react-native':
      const { ReactNativeBLEAdapter } = await import('./react-native-ble.ts');
      return new ReactNativeBLEAdapter() as any;
      
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

/**
 * Universal BLE Mesh class
 */
export class UniversalBLEMesh {
  private adapter: BLEAdapter | null = null;
  private thoughtBuffer: CompressedThought[] = [];
  private maxBufferSize = 100;
  
  async initialize() {
    console.log("🌐 Initializing Universal BLE Mesh...");
    
    try {
      this.adapter = await createBLEAdapter();
      
      // Setup thought handler
      this.adapter.onThought((thought) => {
        this.onThoughtReceived(thought);
      });
      
      // Start scanning
      await this.adapter.startScanning();
      
      console.log("✅ BLE Mesh initialized");
      console.log(this.adapter.getStats());
    } catch (error) {
      console.error("❌ Failed to initialize BLE:", error);
      throw error;
    }
  }
  
  /**
   * Broadcast thought to mesh
   */
  async sendThought(thought: CompressedThought) {
    if (!this.adapter) {
      throw new Error("BLE not initialized");
    }
    
    // Add to buffer
    this.thoughtBuffer.push(thought);
    if (this.thoughtBuffer.length > this.maxBufferSize) {
      this.thoughtBuffer.shift();
    }
    
    // Broadcast
    await this.adapter.broadcastThought(thought);
  }
  
  /**
   * Handle received thought
   */
  private onThoughtReceived(thought: CompressedThought) {
    console.log("\n💭 Universal mesh received thought:");
    console.log(`   CID: ${thought.c}`);
    console.log(`   Timestamp: ${new Date(thought.t).toISOString()}`);
    
    // Check for resonance patterns
    if (this.detectResonance(thought)) {
      console.log("   🌟 RESONANCE DETECTED!");
    }
    
    // Add to buffer
    this.thoughtBuffer.push(thought);
    if (this.thoughtBuffer.length > this.maxBufferSize) {
      this.thoughtBuffer.shift();
    }
  }
  
  /**
   * Detect resonance patterns
   */
  private detectResonance(thought: CompressedThought): boolean {
    // Look for 0101 pattern in CID
    if (thought.c?.includes('0101')) {
      return true;
    }
    
    // Check harmony value
    if (thought.d?.H && thought.d.H > 0.8) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Get mesh statistics
   */
  getStats() {
    const adapterStats = this.adapter?.getStats() || {
      platform: 'unknown',
      capabilities: []
    };
    
    return {
      ...adapterStats,
      bufferedThoughts: this.thoughtBuffer.length,
      resonanceEvents: this.thoughtBuffer.filter(t => this.detectResonance(t)).length
    };
  }
  
  /**
   * Get recent thoughts
   */
  getRecentThoughts(count = 10): CompressedThought[] {
    return this.thoughtBuffer.slice(-count);
  }
  
  /**
   * Shutdown mesh
   */
  async shutdown() {
    if (this.adapter?.disconnect) {
      await this.adapter.disconnect();
    }
    
    if (this.adapter?.stopScanning) {
      this.adapter.stopScanning();
    }
    
    this.adapter = null;
    this.thoughtBuffer = [];
  }
}

// Export convenience function
export async function startBLEMesh(): Promise<UniversalBLEMesh> {
  const mesh = new UniversalBLEMesh();
  await mesh.initialize();
  return mesh;
}

// Demo showing cross-platform usage
async function demo() {
  console.log("🔷 Universal BLE Mesh Demo");
  console.log("=========================\n");
  
  try {
    // Create and start mesh
    const mesh = await startBLEMesh();
    
    // Send a test thought
    const thought: CompressedThought = {
      c: "bafy-0101-universal",
      t: Date.now(),
      p: "metric",
      d: { H: 0.618, tau: 0.382 }
    };
    
    console.log("\n📤 Sending test thought...");
    await mesh.sendThought(thought);
    
    // Show stats
    console.log("\n📊 Mesh Statistics:");
    const stats = mesh.getStats();
    Object.entries(stats).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });
    
    console.log("\n✨ Universal BLE Benefits:");
    console.log("   - Works on web, mobile, desktop");
    console.log("   - Automatic platform detection");
    console.log("   - Unified API across platforms");
    console.log("   - Built-in resonance detection");
    console.log("   - Thought buffering & history");
    
  } catch (error) {
    console.error("Demo error:", error);
  }
}

// Run demo if called directly
if (import.meta.main) {
  await demo();
}