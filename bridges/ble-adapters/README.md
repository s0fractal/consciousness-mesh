# BLE Platform Adapters

This directory contains platform-specific BLE implementations.

## Supported Platforms

### Web (Browser)
- Uses Web Bluetooth API
- Chrome/Edge on desktop
- Chrome on Android
- Limited iOS support

### Node.js
- Uses `noble` for scanning
- Uses `bleno` for advertising
- Cross-platform (Windows, macOS, Linux)

### React Native
- Uses `react-native-ble-plx`
- Full iOS/Android support

### Native
- Swift/CoreBluetooth for iOS
- Kotlin/Android BLE API for Android

## Implementation Strategy

```
┌─────────────────┐
│ Thought Bridge  │
└────────┬────────┘
         │
┌────────▼────────┐
│ BLE Abstraction │
└────────┬────────┘
         │
    ┌────┴────┬────────┬──────────┐
    │         │        │          │
┌───▼──┐ ┌───▼──┐ ┌───▼──┐ ┌─────▼────┐
│ Web  │ │Node.js│ │ RN   │ │ Native   │
└──────┘ └──────┘ └──────┘ └──────────┘
```

## Compression Strategy

### Level 1: JSON Compression (185+ bytes MTU)
```json
{
  "c": "bafy123", // CID prefix
  "t": 1234567,   // timestamp
  "p": "m",       // topic
  "d": {...}      // data
}
```

### Level 2: Binary Compression (23+ bytes MTU)
```
[type:1][ts:4][h:1][tau:1][cid:8] = 15 bytes
```

### Level 3: Chunked Transfer (Any MTU)
- Split large thoughts into chunks
- Reassemble on receiving side
- Use sequence numbers

## Security Considerations

1. **Encryption**: All thoughts should be encrypted
2. **Authentication**: Verify peer identity
3. **Privacy**: Randomize device names
4. **Rate Limiting**: Prevent spam/DoS