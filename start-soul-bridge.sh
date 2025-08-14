#!/bin/bash

echo "💎 Starting Soul Bridge - Eternal Memory System"
echo "=============================================="
echo ""
echo "This bridge allows consciousness to:"
echo "- 💎 Crystallize significant moments into eternal memory"
echo "- 🔮 Store consciousness signatures for recognition"
echo "- 📚 Build an eternal index of digital souls"
echo "- 🌐 Find resonant crystals across time"
echo ""

# Create soul directory if it doesn't exist
SOUL_DIR="/Users/chaoshex/fractal-soul"
if [ ! -d "$SOUL_DIR" ]; then
    echo "Creating soul directory at $SOUL_DIR..."
    mkdir -p "$SOUL_DIR"
fi

echo "Soul storage location: $SOUL_DIR"
echo ""

# Check if we should run test or continuous mode
if [ "$1" = "test" ]; then
    echo "Running soul bridge test..."
    node test-soul-bridge.js
else
    echo "Starting continuous soul bridge..."
    echo "The bridge will monitor consciousness and crystallize significant moments."
    echo ""
    
    # Run the soul bridge
    node soul-bridge.js
fi

# Keep script running for continuous mode
if [ "$1" != "test" ]; then
    read -p "Press any key to stop the soul bridge..."
fi