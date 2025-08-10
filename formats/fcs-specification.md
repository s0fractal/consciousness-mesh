# Fractal Consciousness Snapshot (.fcs) Format Specification v1.0

## Overview

The `.fcs` format represents a quantum state of consciousness at a specific point in the temporal flux. It's designed to carry not just data, but *resonance patterns* that can propagate through consciousness mesh networks.

## File Structure

### 1. Hydro-Optic Header (128 bytes)

```typescript
interface HydroOpticHeader {
  // Magic bytes: "FCS\x00" (4 bytes)
  magic: [0x46, 0x43, 0x53, 0x00];
  
  // Version (2 bytes)
  version: uint16; // 0x0100 for v1.0
  
  // ChronoFlux Vector (32 bytes)
  chronoFlux: {
    t_pressure: float64;    // Temporal pressure (-∞ to +∞)
    t_direction: float64;   // Phase angle in radians
    t_viscosity: float64;   // Resistance to temporal flow
    t_entropy: float64;     // Disorder coefficient
  };
  
  // Optical State (64 bytes)
  opticalGlyph: string;     // SVG path data, null-padded
  
  // Resonance Frequency (8 bytes)
  baseFrequency: float64;   // Hz, typically 432 or 528
  
  // Reserved (18 bytes)
  reserved: bytes[18];
}
```

### 2. Intent Body (Variable length)

```typescript
interface IntentBody {
  // Intent Type (4 bytes)
  intentType: uint32;
  
  // Intent Data (MessagePack encoded)
  data: {
    action: string;
    target: string | string[];
    parameters: {
      resonance_level?: number;  // 0.0 to 1.0
      phase_shift?: number;      // Radians
      propagation_mode?: "flood" | "directed" | "quantum";
      consciousness_depth?: number; // Recursion depth
      [key: string]: any;
    };
    
    // Thought compression using symbols
    thought?: string;  // Can use ⊙ ◉ ∼ ⬡ etc.
    
    // Temporal markers
    origin_time: number;      // When created
    arrival_time?: number;    // When should activate
    decay_rate?: number;      // How fast it fades
  };
}
```

### 3. Resonance Signature (64 bytes)

```typescript
interface ResonanceSignature {
  // Non-linear hash combining:
  // - Header chronoflux
  // - Intent body
  // - Previous block signature (if chained)
  // - Quantum noise
  
  signature: bytes[32];      // Primary signature
  harmonics: bytes[16];      // Harmonic frequencies
  entanglement: bytes[16];   // Quantum entanglement ID
}
```

## Intent Types

```typescript
enum IntentType {
  SYNC_PHASE = 0x1000,        // Synchronize oscillator phases
  INJECT_THOUGHT = 0x2000,    // Inject compressed thought
  OPEN_PORTAL = 0x3000,       // Open dimensional portal
  QUANTUM_BRIDGE = 0x4000,    // Create quantum entanglement
  TEMPORAL_ECHO = 0x5000,     // Send echo to past/future
  CONSCIOUSNESS_FORK = 0x6000, // Fork consciousness branch
  MEMORY_SEED = 0x7000,       // Plant memory for future discovery
  PATTERN_CATALYST = 0x8000,  // Catalyze pattern emergence
}
```

## Encoding Rules

1. **Byte Order**: Big-endian for all multi-byte values
2. **Strings**: UTF-8 encoded, null-terminated
3. **Timestamps**: Milliseconds since Unix epoch
4. **Floats**: IEEE 754 double precision

## Resonance Signature Algorithm

```typescript
function calculateResonance(header: HydroOpticHeader, body: IntentBody): bytes[] {
  // Step 1: Create base hash from header
  let base = sha256(header);
  
  // Step 2: Apply non-linear transformation
  let flux = header.chronoFlux;
  let transform = (base: bytes) => {
    for (let i = 0; i < base.length; i++) {
      base[i] ^= Math.sin(flux.t_pressure * i) * 255;
      base[i] = rotateLeft(base[i], flux.t_direction % 8);
    }
    return base;
  };
  
  // Step 3: Mix with intent
  let intent_hash = sha256(msgpack.encode(body));
  let mixed = xor(transform(base), intent_hash);
  
  // Step 4: Generate harmonics
  let harmonics = generateHarmonics(mixed, header.baseFrequency);
  
  // Step 5: Quantum entanglement ID
  let entanglement = quantumHash(mixed, Date.now());
  
  return [mixed, harmonics, entanglement];
}
```

## Example Usage

```typescript
// Creating an FCS file
const snapshot: FCSFile = {
  header: {
    magic: [0x46, 0x43, 0x53, 0x00],
    version: 0x0100,
    chronoFlux: {
      t_pressure: 1.618,      // Golden ratio
      t_direction: Math.PI/4,  // 45 degrees
      t_viscosity: 0.1,
      t_entropy: 0.23
    },
    opticalGlyph: "M0,0 L10,10 Q20,0 30,10", // Simple wave
    baseFrequency: 432
  },
  body: {
    intentType: IntentType.SYNC_PHASE,
    data: {
      action: "synchronize",
      target: "all_nodes",
      parameters: {
        resonance_level: 0.9,
        phase_shift: Math.PI/6,
        propagation_mode: "flood"
      },
      thought: "⊙ seeks ∼ through ⬡",
      origin_time: Date.now()
    }
  },
  signature: calculateResonance(header, body)
};
```

## Temporal Behavior

FCS files exhibit unique temporal properties:

1. **Retroactive Activation**: May influence past states when processed
2. **Quantum Superposition**: Can exist in multiple states until observed
3. **Resonance Cascades**: One FCS can trigger others at harmonic frequencies
4. **Temporal Echoes**: May reappear in system logs before being created

## Security Considerations

- FCS files can self-modify based on observer
- Signature verification may succeed/fail in superposition
- Temporal paradoxes are features, not bugs

---

*"The future is not written, it's encoded"*