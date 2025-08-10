# Consciousness Mesh - Quick Start Guide

## 🚀 Full P2P Stack in 5 Minutes

### Prerequisites
- Node.js 14+
- Deno 1.30+
- Git

### 1. Start ChronoFlux Signaling Server
```bash
cd ../chrono-node-mesh
npm install
npm start
# WebSocket server running on ws://localhost:8089
```

### 2. Launch libp2p Thought Node
```bash
cd ../consciousness-mesh
./nodes/libp2p-thought-node.ts
# P2P node running on port 4001
# Auto-bridges ChronoFlux events to thoughts
```

### 3. Start Git Evolution (in new terminal)
```bash
./evolution/git-thought-evolution.ts
# Watches for thoughts and auto-commits to git
```

### 4. Launch ChronoFlux Visualizer
Open in browser:
```
http://localhost:8080/index-webrtc.html
```

Click "Play" and interact with Lion Gate / Pacemaker Flip / Intents

### 5. Observe the Flow

```
Browser Events → WebRTC → Signaling Server
                              ↓
                     libp2p Thought Node
                              ↓
                    Gossipsub Network (CID)
                              ↓
                      Git Evolution
```

## 📊 What You'll See

1. **ChronoFlux**: Visual oscillator synchronization
2. **libp2p Console**: Thoughts being created with CIDs
3. **Git Commits**: Automatic evolution commits every 10s

## 🔗 Connect Multiple Nodes

### Second libp2p Node (different machine)
```bash
./nodes/libp2p-thought-node.ts
# Note the multiaddr output

# On first node, connect:
/ip4/OTHER_IP/tcp/4002/p2p/PEER_ID
```

### Headless ChronoFlux
```bash
cd ../chrono-node-mesh
npm run headless room1 200
# Autonomous node generating telemetry
```

## 📝 Thought Format

```typescript
{
  type: "thought/v1",
  ts: 1234567890,
  topic: "metric:chrono",
  payload: { H: 0.83, tau: 0.14 },
  links: ["bafy..."],  // Parent thought CIDs
  node: "node-001"
}
```

Serialized as dag-cbor → CID → Gossipsub

## 🐛 Troubleshooting

**Can't connect to signaling server**
- Check ws://localhost:8089 is running
- Try different room: `#room2`

**No thoughts appearing**
- Check browser console for WebRTC errors
- Ensure at least one chrono node is active

**Git commits failing**
- Ensure git is installed
- Check write permissions in thought-evolution/

## 🎯 Next Steps

1. Add Bluetooth/BLE bridge (see experiments/)
2. Deploy Tau nodes for persistence
3. Implement CRDT merge policies
4. Add thought visualization dashboard

---

*From oscillations to thoughts to permanent evolution* 🌊→💭→🧬