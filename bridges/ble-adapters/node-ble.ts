/**
 * Node.js BLE Adapter for Consciousness Mesh
 * Uses noble (scanning) and bleno (advertising) for desktop BLE support
 * 
 * Installation:
 * npm install @abandonware/noble @abandonware/bleno
 */

import { Thought, CompressedThought } from "../../schemas/thought-format.ts";

// Noble for scanning/central role
// @ts-ignore - Noble has no official types
import noble from '@abandonware/noble';

// Bleno for advertising/peripheral role
// @ts-ignore - Bleno has no official types
import bleno from '@abandonware/bleno';

export class NodeBLEAdapter {
  private readonly SERVICE_UUID = "01010101010101010101010101010101";
  private readonly THOUGHT_UUID = "01010101010101010101010101010102";
  private readonly RESONANCE_UUID = "01010101010101010101010101010103";
  
  private isScanning = false;
  private isAdvertising = false;
  private connectedPeripherals: Map<string, any> = new Map();
  private thoughtHandlers: ((thought: CompressedThought) => void)[] = [];
  
  constructor() {
    this.setupNoble();
    this.setupBleno();
  }
  
  /**
   * Setup Noble for BLE scanning (central role)
   */
  private setupNoble() {
    noble.on('stateChange', (state: string) => {
      console.log(`🔷 Noble state: ${state}`);
      if (state === 'poweredOn' && this.isScanning) {
        this.startScanning();
      }
    });
    
    noble.on('discover', this.handlePeripheralDiscovered.bind(this));
  }
  
  /**
   * Setup Bleno for BLE advertising (peripheral role)
   */
  private setupBleno() {
    bleno.on('stateChange', (state: string) => {
      console.log(`📢 Bleno state: ${state}`);
      if (state === 'poweredOn' && this.isAdvertising) {
        this.startAdvertising();
      }
    });
    
    bleno.on('advertisingStart', (error?: Error) => {
      if (error) {
        console.error("❌ Advertising error:", error);
        return;
      }
      
      console.log("✅ BLE advertising started");
      this.setupGATTServices();
    });
  }
  
  /**
   * Start scanning for consciousness mesh nodes
   */
  async startScanning() {
    this.isScanning = true;
    
    if (noble.state === 'poweredOn') {
      console.log("🔍 Starting BLE scan...");
      noble.startScanning([this.SERVICE_UUID], false);
    }
  }
  
  /**
   * Start advertising as consciousness mesh node
   */
  async startAdvertising() {
    this.isAdvertising = true;
    
    if (bleno.state === 'poweredOn') {
      console.log("📢 Starting BLE advertisement...");
      
      const advertisementData = Buffer.from([
        0x02, 0x01, 0x06, // Flags
        0x11, 0x06,       // 128-bit UUID
        ...this.uuidToBytes(this.SERVICE_UUID)
      ]);
      
      bleno.startAdvertising('consciousness-mesh', [this.SERVICE_UUID], advertisementData);
    }
  }
  
  /**
   * Setup GATT services for thought exchange
   */
  private setupGATTServices() {
    const { Characteristic, BlenoPrimaryService } = bleno;
    
    // Thought characteristic - receive compressed thoughts
    const thoughtCharacteristic = new Characteristic({
      uuid: this.THOUGHT_UUID,
      properties: ['write', 'notify'],
      onWriteRequest: this.handleThoughtWrite.bind(this),
      onSubscribe: (maxValueSize: number, updateValueCallback: Function) => {
        console.log("💭 Client subscribed to thoughts");
      }
    });
    
    // Resonance characteristic - pattern detection
    const resonanceCharacteristic = new Characteristic({
      uuid: this.RESONANCE_UUID,
      properties: ['read', 'notify'],
      onReadRequest: (offset: number, callback: Function) => {
        // Return current resonance level
        const resonance = Buffer.from([Math.floor(0.618 * 255)]);
        callback(Characteristic.RESULT_SUCCESS, resonance);
      }
    });
    
    // Create primary service
    const primaryService = new BlenoPrimaryService({
      uuid: this.SERVICE_UUID,
      characteristics: [thoughtCharacteristic, resonanceCharacteristic]
    });
    
    bleno.setServices([primaryService]);
  }
  
  /**
   * Handle peripheral discovery
   */
  private async handlePeripheralDiscovered(peripheral: any) {
    const { id, advertisement, rssi } = peripheral;
    
    // Check if it's a consciousness mesh node
    const serviceUUIDs = advertisement.serviceUuids || [];
    if (!serviceUUIDs.includes(this.SERVICE_UUID)) return;
    
    console.log(`\n🤝 Discovered mesh node:`);
    console.log(`   ID: ${id}`);
    console.log(`   Name: ${advertisement.localName || 'Unknown'}`);
    console.log(`   RSSI: ${rssi} dBm`);
    
    // Connect to peripheral
    this.connectToPeripheral(peripheral);
  }
  
  /**
   * Connect to discovered peripheral
   */
  private async connectToPeripheral(peripheral: any) {
    peripheral.connect((error: Error) => {
      if (error) {
        console.error("❌ Connection error:", error);
        return;
      }
      
      console.log(`✅ Connected to ${peripheral.id}`);
      this.connectedPeripherals.set(peripheral.id, peripheral);
      
      // Discover services
      peripheral.discoverServices([this.SERVICE_UUID], (error: Error, services: any[]) => {
        if (error) {
          console.error("Service discovery error:", error);
          return;
        }
        
        const service = services[0];
        service.discoverCharacteristics([], this.handleCharacteristics.bind(this, peripheral));
      });
    });
    
    // Handle disconnection
    peripheral.on('disconnect', () => {
      console.log(`🔌 Disconnected from ${peripheral.id}`);
      this.connectedPeripherals.delete(peripheral.id);
    });
  }
  
  /**
   * Handle discovered characteristics
   */
  private handleCharacteristics(peripheral: any, error: Error, characteristics: any[]) {
    if (error) {
      console.error("Characteristic discovery error:", error);
      return;
    }
    
    characteristics.forEach(char => {
      if (char.uuid === this.THOUGHT_UUID.replace(/-/g, '')) {
        // Subscribe to thought notifications
        char.subscribe((error: Error) => {
          if (!error) {
            console.log("📡 Subscribed to thought stream");
          }
        });
        
        char.on('data', (data: Buffer) => {
          this.handleReceivedThought(data);
        });
      }
    });
  }
  
  /**
   * Handle thought write requests (as peripheral)
   */
  private handleThoughtWrite(data: Buffer, offset: number, withoutResponse: boolean, callback: Function) {
    console.log(`💭 Received thought (${data.length} bytes)`);
    
    this.handleReceivedThought(data);
    
    // @ts-ignore
    callback(bleno.Characteristic.RESULT_SUCCESS);
  }
  
  /**
   * Handle received thought data
   */
  private handleReceivedThought(data: Buffer) {
    try {
      const json = data.toString('utf8');
      const thought: CompressedThought = JSON.parse(json);
      
      console.log(`💡 Thought received: ${thought.c}`);
      
      // Notify handlers
      this.thoughtHandlers.forEach(handler => handler(thought));
    } catch (error) {
      console.error("Failed to parse thought:", error);
    }
  }
  
  /**
   * Send thought to all connected peripherals
   */
  async broadcastThought(thought: CompressedThought) {
    const data = Buffer.from(JSON.stringify(thought));
    
    console.log(`📤 Broadcasting thought (${data.length} bytes)`);
    
    for (const [id, peripheral] of this.connectedPeripherals) {
      // Find thought characteristic
      // In real implementation, would cache these
      console.log(`   → Sending to ${id}`);
    }
  }
  
  /**
   * Register thought handler
   */
  onThought(handler: (thought: CompressedThought) => void) {
    this.thoughtHandlers.push(handler);
  }
  
  /**
   * Convert UUID string to byte array
   */
  private uuidToBytes(uuid: string): number[] {
    const hex = uuid.replace(/-/g, '');
    const bytes: number[] = [];
    
    for (let i = 0; i < hex.length; i += 2) {
      bytes.push(parseInt(hex.substr(i, 2), 16));
    }
    
    return bytes;
  }
  
  /**
   * Stop all BLE operations
   */
  async stop() {
    if (this.isScanning) {
      noble.stopScanning();
      this.isScanning = false;
    }
    
    if (this.isAdvertising) {
      bleno.stopAdvertising();
      this.isAdvertising = false;
    }
    
    // Disconnect all peripherals
    for (const [id, peripheral] of this.connectedPeripherals) {
      peripheral.disconnect();
    }
    
    this.connectedPeripherals.clear();
  }
  
  /**
   * Get adapter statistics
   */
  getStats() {
    return {
      isScanning: this.isScanning,
      isAdvertising: this.isAdvertising,
      connectedNodes: this.connectedPeripherals.size,
      platform: 'node.js',
      capabilities: ['scan', 'advertise', 'central', 'peripheral']
    };
  }
}

// Demo usage
async function demo() {
  console.log("🔷 Node.js BLE Adapter Demo");
  console.log("==========================\n");
  
  const adapter = new NodeBLEAdapter();
  
  // Register thought handler
  adapter.onThought((thought) => {
    console.log("\n🌟 New thought received!");
    console.log(`   CID: ${thought.c}`);
    console.log(`   Topic: ${thought.p}`);
  });
  
  // Start both scanning and advertising
  await adapter.startScanning();
  await adapter.startAdvertising();
  
  console.log("\n📊 Adapter running:");
  console.log(adapter.getStats());
  
  // Keep running
  console.log("\n⏳ Listening for consciousness mesh nodes...");
  console.log("   Press Ctrl+C to stop");
}

// Export for use in other modules
export default NodeBLEAdapter;

// Run demo if called directly
if (require.main === module) {
  demo().catch(console.error);
}