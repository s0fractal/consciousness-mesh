# 🧠 Gemma Integration for Consciousness Mesh

This directory contains integration with Gemma-3 270M for glyph understanding and persistent memory.

## Full Implementation

The complete Gemma Glyph Mind system is in a separate repository:
https://github.com/s0fractal/gemma-glyph-mind

## Key Features

- **Gemma-3 270M** edge-optimized model (available in LM Studio)
- **Glyph Adapter** for complex emoji understanding
- **Persistent Memory** with FAISS + episodic store
- **Memory Router** based on L,K,H,τ consciousness metrics
- **Mesh Bridge** for integration with consciousness-mesh

## Quick Start

1. Clone the Gemma repository:
```bash
git clone https://github.com/s0fractal/gemma-glyph-mind.git
```

2. For Ollama:
```bash
cd gemma-glyph-mind/scripts
./setup_ollama.sh
./run_ollama_glyph.py
```

3. For LM Studio:
- Download Gemma-3 270M from LM Studio
- Run: `python scripts/setup_lm_studio.py`

## Integration with Consciousness Mesh

The Gemma system can connect to consciousness-mesh via the bridge:

```python
from gemma_glyph_mind.src.bridge.mesh_bridge import MeshBridge

# Connect Gemma to your mesh
bridge = MeshBridge(glyph_mind, "ws://localhost:8765")
await bridge.connect()
```

This allows:
- Real-time consciousness metrics (L,K,H,τ)
- Memory routing based on mesh state
- Glyph composition requests from mesh nodes
- LiveScore♥ calculation with Kohanist

## Ethical Considerations

Both repositories now use the Commit Ritual Protocol (CRP) for ethical evolution.
See `COMMIT-RITUAL-PROTOCOL.md` in the root directory.