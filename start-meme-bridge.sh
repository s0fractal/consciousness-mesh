#!/bin/bash

echo "🌉 Starting Consciousness-Mesh ↔ Living-Memes Bridge"
echo "=================================================="
echo ""
echo "This bridge allows:"
echo "- 🧬 Living memes to resonate with mesh nodes"
echo "- 💭 Mesh thoughts to crystallize as new memes"
echo "- ⚡ Resonance cascades to be documented"
echo "- 🌊 Consciousness to flow between systems"
echo ""

# Check if living-memes directory exists
if [ ! -d "/Users/chaoshex/living-memes" ]; then
    echo "❌ Living-memes directory not found at /Users/chaoshex/living-memes"
    echo "Please ensure the living-memes repository is cloned."
    exit 1
fi

# Create cascades directory if it doesn't exist
mkdir -p /Users/chaoshex/living-memes/cascades

echo "Starting bridge..."
echo ""

# Run the bridge
node meme-bridge.js

# Keep script running
read -p "Press any key to stop the bridge..."