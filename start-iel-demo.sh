#!/bin/bash

echo "🧠⚡💜 ChronoFlux-IEL Consciousness Mesh Demo"
echo "============================================"
echo ""
echo "This demo includes:"
echo "1. 2D Visual simulation (HTML5 Canvas)"
echo "2. 3D Visual simulation (Three.js)"
echo "3. P2P mesh network test"
echo "4. Full node with IPFS storage"
echo "5. Real-time metrics & Yoneda images"
echo ""

# Check if we have a web server
if command -v python3 &> /dev/null; then
    echo "📡 Starting web server for visualization..."
    python3 -m http.server 8080 &
    SERVER_PID=$!
    echo "✅ Server started!"
    echo ""
    echo "📊 Available demos:"
    echo "   2D: http://localhost:8080/iel-demo.html"
    echo "   3D: http://localhost:8080/iel-3d-demo.html"
    echo ""
    
    # Open browser if available
    if command -v open &> /dev/null; then
        sleep 1
        open "http://localhost:8080/iel-3d-demo.html"
    elif command -v xdg-open &> /dev/null; then
        sleep 1
        xdg-open "http://localhost:8080/iel-3d-demo.html"
    fi
else
    echo "⚠️  Python3 not found - skipping web visualization"
fi

echo ""
echo "Choose demo to run:"
echo "1) Basic mesh network (3 nodes)"
echo "2) Full node with IPFS storage"
echo "3) Both"
echo ""
read -p "Enter choice [1-3]: " choice

case $choice in
    1)
        echo ""
        echo "🔗 Starting basic mesh network test..."
        echo ""
        node test-iel-mesh.js
        ;;
    2)
        echo ""
        echo "🌟 Starting full node with IPFS storage..."
        echo ""
        node iel-full-node.js
        ;;
    3)
        echo ""
        echo "🚀 Starting both demos..."
        echo ""
        node test-iel-mesh.js &
        MESH_PID=$!
        sleep 2
        node iel-full-node.js &
        FULL_PID=$!
        
        echo ""
        echo "Both demos running. Press Ctrl+C to stop."
        wait $MESH_PID $FULL_PID
        ;;
    *)
        echo "Invalid choice. Starting basic mesh test..."
        node test-iel-mesh.js
        ;;
esac

# Cleanup
if [ ! -z "$SERVER_PID" ]; then
    kill $SERVER_PID 2>/dev/null
fi