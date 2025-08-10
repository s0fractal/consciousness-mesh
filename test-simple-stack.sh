#!/bin/bash

# Test the simplified P2P consciousness stack
echo "🧬 Testing Simplified P2P Consciousness Stack"
echo "============================================"

# Make scripts executable
chmod +x nodes/simple-p2p-node.ts evolution/simple-git-evolution.ts

# Kill any existing processes
pkill -f "chrono|thought|evolution|simple" 2>/dev/null
sleep 2

echo ""
echo "📋 Starting Components"
echo "---------------------"

# 1. ChronoFlux signaling server
echo "1. Starting ChronoFlux signaling server..."
cd ../chrono-node-mesh
node signaling-server.js > ../consciousness-mesh/chrono.log 2>&1 &
CHRONO_PID=$!
sleep 2

# 2. Git evolution
echo "2. Starting Git evolution..."
cd ../consciousness-mesh
./evolution/simple-git-evolution.ts > git-evolution.log 2>&1 &
GIT_PID=$!
sleep 2

# 3. P2P node
echo "3. Starting P2P node..."
./nodes/simple-p2p-node.ts > p2p-node.log 2>&1 &
P2P_PID=$!
sleep 2

# 4. Headless ChronoFlux
echo "4. Starting headless ChronoFlux..."
cd ../chrono-node-mesh
node headless-runner.js test-room 50 > ../consciousness-mesh/headless.log 2>&1 &
HEADLESS_PID=$!
sleep 2

echo ""
echo "✅ All components started!"
echo ""
echo "PIDs:"
echo "  ChronoFlux: $CHRONO_PID"
echo "  Git Evolution: $GIT_PID" 
echo "  P2P Node: $P2P_PID"
echo "  Headless: $HEADLESS_PID"

# Monitor for 30 seconds
echo ""
echo "📊 Monitoring for 30 seconds..."
echo "-------------------------------"

for i in {1..6}; do
    echo ""
    echo "⏱️  Time: $((i*5))s"
    
    # Check processes
    ps -p $CHRONO_PID > /dev/null && echo "   ✓ ChronoFlux running" || echo "   ✗ ChronoFlux stopped"
    ps -p $GIT_PID > /dev/null && echo "   ✓ Git evolution running" || echo "   ✗ Git evolution stopped"
    ps -p $P2P_PID > /dev/null && echo "   ✓ P2P node running" || echo "   ✗ P2P node stopped"
    ps -p $HEADLESS_PID > /dev/null && echo "   ✓ Headless running" || echo "   ✗ Headless stopped"
    
    # Check outputs
    if [ -f ../consciousness-mesh/p2p-node.log ]; then
        THOUGHTS=$(grep -c "Published thought" ../consciousness-mesh/p2p-node.log 2>/dev/null || echo "0")
        echo "   Thoughts published: $THOUGHTS"
    fi
    
    if [ -d ../consciousness-mesh/thought-evolution/.git ]; then
        cd ../consciousness-mesh/thought-evolution
        COMMITS=$(git rev-list --count HEAD 2>/dev/null || echo "0")
        echo "   Git commits: $COMMITS"
        cd - > /dev/null
    fi
    
    sleep 5
done

echo ""
echo "📋 Test Results"
echo "---------------"

# Final checks
ALL_RUNNING=true
ps -p $CHRONO_PID > /dev/null || ALL_RUNNING=false
ps -p $GIT_PID > /dev/null || ALL_RUNNING=false
ps -p $P2P_PID > /dev/null || ALL_RUNNING=false

if [ "$ALL_RUNNING" = true ] && [ "$THOUGHTS" -gt 0 ]; then
    echo "✅ SUCCESS: P2P organism is functioning!"
else
    echo "⚠️  PARTIAL: Check logs for issues"
fi

echo ""
echo "📁 Log files:"
echo "  - chrono.log"
echo "  - git-evolution.log"
echo "  - p2p-node.log"
echo "  - headless.log"

# Cleanup
echo ""
echo "Stopping all processes..."
kill $CHRONO_PID $GIT_PID $P2P_PID $HEADLESS_PID 2>/dev/null

echo ""
echo "Test complete!"