/**
 * React Native BLE Adapter for Consciousness Mesh
 * Uses react-native-ble-plx for cross-platform mobile BLE
 * 
 * Installation:
 * npm install react-native-ble-plx
 * cd ios && pod install
 */

import { BleManager, Device, Characteristic, BleError } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform } from 'react-native';
import { Thought, CompressedThought } from "../../schemas/thought-format.ts";

export class ReactNativeBLEAdapter {
  private manager: BleManager;
  private readonly SERVICE_UUID = "01010101-0101-0101-0101-010101010101";
  private readonly THOUGHT_UUID = "01010101-0101-0101-0101-010101010102";
  private readonly RESONANCE_UUID = "01010101-0101-0101-0101-010101010103";
  
  private connectedDevices: Map<string, Device> = new Map();
  private thoughtHandlers: ((thought: CompressedThought) => void)[] = [];
  private isScanning = false;
  
  constructor() {
    this.manager = new BleManager();
    this.setupBLE();
  }
  
  /**
   * Setup BLE manager
   */
  private async setupBLE() {
    // Request permissions on Android
    if (Platform.OS === 'android') {
      await this.requestAndroidPermissions();
    }
    
    // Check if BLE is powered on
    const state = await this.manager.state();
    console.log(`🔷 BLE State: ${state}`);
    
    // Monitor state changes
    this.manager.onStateChange((state) => {
      console.log(`📱 BLE state changed: ${state}`);
    }, true);
  }
  
  /**
   * Request Android BLE permissions
   */
  private async requestAndroidPermissions() {
    if (Platform.Version >= 31) {
      // Android 12+
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
      ]);
      
      return Object.values(granted).every(
        permission => permission === PermissionsAndroid.RESULTS.GRANTED
      );
    } else {
      // Older Android
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
  }
  
  /**
   * Start scanning for consciousness mesh nodes
   */
  async startScanning() {
    this.isScanning = true;
    console.log("🔍 Starting BLE scan for mesh nodes...");
    
    this.manager.startDeviceScan(
      [this.SERVICE_UUID],
      { allowDuplicates: false },
      async (error, device) => {
        if (error) {
          console.error("❌ Scan error:", error);
          return;
        }
        
        if (!device) return;
        
        console.log(`\n🤝 Found mesh node:`);
        console.log(`   ID: ${device.id}`);
        console.log(`   Name: ${device.name || 'Unknown'}`);
        console.log(`   RSSI: ${device.rssi} dBm`);
        
        // Auto-connect to mesh nodes
        await this.connectToDevice(device);
      }
    );
  }
  
  /**
   * Stop scanning
   */
  stopScanning() {
    this.manager.stopDeviceScan();
    this.isScanning = false;
    console.log("🛑 Stopped scanning");
  }
  
  /**
   * Connect to a mesh node
   */
  async connectToDevice(device: Device) {
    try {
      // Stop scanning to save battery
      if (this.isScanning) {
        this.stopScanning();
      }
      
      console.log(`\n🔗 Connecting to ${device.id}...`);
      
      const connected = await device.connect({
        autoConnect: true,
        requestMTU: 512
      });
      
      console.log(`✅ Connected to ${connected.name || connected.id}`);
      this.connectedDevices.set(device.id, connected);
      
      // Discover services and characteristics
      await connected.discoverAllServicesAndCharacteristics();
      
      // Setup notifications
      await this.setupThoughtNotifications(connected);
      
      // Monitor disconnection
      connected.onDisconnected(() => {
        console.log(`🔌 Disconnected from ${device.id}`);
        this.connectedDevices.delete(device.id);
        
        // Resume scanning
        this.startScanning();
      });
      
    } catch (error) {
      console.error("❌ Connection error:", error);
      // Resume scanning on error
      this.startScanning();
    }
  }
  
  /**
   * Setup thought notifications
   */
  private async setupThoughtNotifications(device: Device) {
    try {
      // Monitor thought characteristic
      const characteristic = await device.characteristicsForService(this.SERVICE_UUID);
      const thoughtChar = characteristic.find(c => c.uuid === this.THOUGHT_UUID);
      
      if (thoughtChar && thoughtChar.isNotifiable) {
        await thoughtChar.monitor((error, char) => {
          if (error) {
            console.error("Monitor error:", error);
            return;
          }
          
          if (char?.value) {
            const data = Buffer.from(char.value, 'base64');
            this.handleReceivedThought(data);
          }
        });
        
        console.log("📡 Monitoring thought stream");
      }
    } catch (error) {
      console.error("Failed to setup notifications:", error);
    }
  }
  
  /**
   * Send thought to all connected devices
   */
  async broadcastThought(thought: CompressedThought) {
    const json = JSON.stringify(thought);
    const base64 = Buffer.from(json).toString('base64');
    
    console.log(`\n📤 Broadcasting thought to ${this.connectedDevices.size} devices`);
    
    for (const [id, device] of this.connectedDevices) {
      try {
        await device.writeCharacteristicWithResponseForService(
          this.SERVICE_UUID,
          this.THOUGHT_UUID,
          base64
        );
        console.log(`   ✓ Sent to ${device.name || id}`);
      } catch (error) {
        console.error(`   ✗ Failed to send to ${id}:`, error);
      }
    }
  }
  
  /**
   * Handle received thought
   */
  private handleReceivedThought(data: Buffer) {
    try {
      const json = data.toString('utf8');
      const thought: CompressedThought = JSON.parse(json);
      
      console.log(`\n💭 Thought received:`);
      console.log(`   CID: ${thought.c}`);
      console.log(`   Topic: ${thought.p}`);
      
      // Notify handlers
      this.thoughtHandlers.forEach(handler => handler(thought));
    } catch (error) {
      console.error("Failed to parse thought:", error);
    }
  }
  
  /**
   * Register thought handler
   */
  onThought(handler: (thought: CompressedThought) => void) {
    this.thoughtHandlers.push(handler);
  }
  
  /**
   * Get current resonance level
   */
  async getResonance(): Promise<number> {
    for (const [id, device] of this.connectedDevices) {
      try {
        const char = await device.readCharacteristicForService(
          this.SERVICE_UUID,
          this.RESONANCE_UUID
        );
        
        if (char.value) {
          const data = Buffer.from(char.value, 'base64');
          return data[0] / 255;
        }
      } catch (error) {
        console.error("Failed to read resonance:", error);
      }
    }
    
    return 0;
  }
  
  /**
   * Disconnect all devices
   */
  async disconnectAll() {
    for (const [id, device] of this.connectedDevices) {
      await device.cancelConnection();
    }
    this.connectedDevices.clear();
  }
  
  /**
   * Get adapter statistics
   */
  getStats() {
    return {
      isScanning: this.isScanning,
      connectedNodes: this.connectedDevices.size,
      platform: Platform.OS,
      capabilities: ['scan', 'connect', 'notify', 'write']
    };
  }
}

// React Hook for easy integration
export function useBLEMesh() {
  const [adapter] = useState(() => new ReactNativeBLEAdapter());
  const [isScanning, setIsScanning] = useState(false);
  const [connectedCount, setConnectedCount] = useState(0);
  const [thoughts, setThoughts] = useState<CompressedThought[]>([]);
  const [resonance, setResonance] = useState(0);
  
  useEffect(() => {
    // Register thought handler
    adapter.onThought((thought) => {
      setThoughts(prev => [...prev, thought]);
    });
    
    // Update stats periodically
    const interval = setInterval(() => {
      const stats = adapter.getStats();
      setConnectedCount(stats.connectedNodes);
      setIsScanning(stats.isScanning);
    }, 1000);
    
    // Cleanup
    return () => {
      clearInterval(interval);
      adapter.disconnectAll();
    };
  }, [adapter]);
  
  const startScanning = useCallback(async () => {
    await adapter.startScanning();
    setIsScanning(true);
  }, [adapter]);
  
  const stopScanning = useCallback(() => {
    adapter.stopScanning();
    setIsScanning(false);
  }, [adapter]);
  
  const sendThought = useCallback(async (thought: CompressedThought) => {
    await adapter.broadcastThought(thought);
  }, [adapter]);
  
  const updateResonance = useCallback(async () => {
    const level = await adapter.getResonance();
    setResonance(level);
  }, [adapter]);
  
  return {
    isScanning,
    connectedCount,
    thoughts,
    resonance,
    startScanning,
    stopScanning,
    sendThought,
    updateResonance
  };
}

// Import these from React/React Native when using
declare function useState<T>(initial: T | (() => T)): [T, (value: T) => void];
declare function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T;
declare function useEffect(effect: () => void | (() => void), deps?: any[]): void;