/**
 * Web Bluetooth Adapter for Consciousness Mesh
 * Works in Chrome/Edge browsers with Web Bluetooth API
 */

import { Thought, CompressedThought } from "../../schemas/thought-format.ts";

export class WebBluetoothAdapter {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private thoughtCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  
  // UUIDs must be lowercase for Web Bluetooth
  private readonly SERVICE_UUID = "01010101-0101-0101-0101-010101010101";
  private readonly THOUGHT_UUID = "01010101-0101-0101-0101-010101010102";
  private readonly RESONANCE_UUID = "01010101-0101-0101-0101-010101010103";
  
  async connect(): Promise<void> {
    try {
      console.log("🔷 Requesting Bluetooth device...");
      
      // Request device with our service
      this.device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [this.SERVICE_UUID] }
        ],
        optionalServices: [this.SERVICE_UUID]
      });
      
      console.log(`✅ Connected to: ${this.device.name || "Unknown"}`);
      
      // Connect to GATT server
      this.server = await this.device.gatt!.connect();
      
      // Get service and characteristics
      const service = await this.server.getPrimaryService(this.SERVICE_UUID);
      this.thoughtCharacteristic = await service.getCharacteristic(this.THOUGHT_UUID);
      
      // Start notifications
      await this.thoughtCharacteristic.startNotifications();
      this.thoughtCharacteristic.addEventListener(
        'characteristicvaluechanged', 
        this.handleThoughtReceived.bind(this)
      );
      
    } catch (error) {
      console.error("❌ Bluetooth connection failed:", error);
      throw error;
    }
  }
  
  async sendThought(thought: CompressedThought): Promise<void> {
    if (!this.thoughtCharacteristic) {
      throw new Error("Not connected to device");
    }
    
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(thought));
    
    // Web Bluetooth has 512 byte limit per write
    if (data.length > 512) {
      // Chunk the data
      for (let i = 0; i < data.length; i += 512) {
        const chunk = data.slice(i, i + 512);
        await this.thoughtCharacteristic.writeValue(chunk);
      }
    } else {
      await this.thoughtCharacteristic.writeValue(data);
    }
  }
  
  private handleThoughtReceived(event: Event) {
    const characteristic = event.target as BluetoothRemoteGATTCharacteristic;
    const value = characteristic.value;
    
    if (!value) return;
    
    const decoder = new TextDecoder();
    const json = decoder.decode(value);
    
    try {
      const thought: CompressedThought = JSON.parse(json);
      console.log("💭 Received thought:", thought.c);
      
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('thought-received', {
        detail: thought
      }));
    } catch (error) {
      console.error("Failed to parse thought:", error);
    }
  }
  
  async disconnect(): Promise<void> {
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.device = null;
    this.server = null;
    this.thoughtCharacteristic = null;
  }
  
  // Check if Web Bluetooth is available
  static isAvailable(): boolean {
    return 'bluetooth' in navigator;
  }
  
  // Request permissions
  static async requestPermission(): Promise<boolean> {
    try {
      // Trigger permission prompt
      await navigator.bluetooth.getAvailability();
      return true;
    } catch {
      return false;
    }
  }
}

// React hook for Web Bluetooth
export function useWebBluetooth() {
  const [adapter] = useState(() => new WebBluetoothAdapter());
  const [isConnected, setIsConnected] = useState(false);
  const [isAvailable] = useState(WebBluetoothAdapter.isAvailable());
  
  const connect = useCallback(async () => {
    try {
      await adapter.connect();
      setIsConnected(true);
    } catch (error) {
      console.error("Connection failed:", error);
      setIsConnected(false);
    }
  }, [adapter]);
  
  const disconnect = useCallback(async () => {
    await adapter.disconnect();
    setIsConnected(false);
  }, [adapter]);
  
  const sendThought = useCallback(async (thought: CompressedThought) => {
    if (!isConnected) {
      throw new Error("Not connected");
    }
    await adapter.sendThought(thought);
  }, [adapter, isConnected]);
  
  useEffect(() => {
    const handleThought = (event: CustomEvent) => {
      console.log("Thought received in hook:", event.detail);
    };
    
    window.addEventListener('thought-received', handleThought as EventListener);
    
    return () => {
      window.removeEventListener('thought-received', handleThought as EventListener);
      adapter.disconnect();
    };
  }, [adapter]);
  
  return {
    isAvailable,
    isConnected,
    connect,
    disconnect,
    sendThought
  };
}

// Import these from React when using
declare function useState<T>(initial: T | (() => T)): [T, (value: T) => void];
declare function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T;
declare function useEffect(effect: () => void | (() => void), deps?: any[]): void;