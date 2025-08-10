#!/bin/bash

echo "🔬 P2P Organism Autonomy Verification"
echo "===================================="
echo ""

# Check running processes
echo "📋 Active Components:"
CHRONO_COUNT=$(ps aux | grep -v grep | grep -c "signaling-server.js" || echo "0")
P2P_COUNT=$(ps aux | grep -v grep | grep -c "simple-p2p-node.ts" || echo "0")
GIT_COUNT=$(ps aux | grep -v grep | grep -c "simple-git-evolution.ts" || echo "0")
HEADLESS_COUNT=$(ps aux | grep -v grep | grep -c "headless-runner.js" || echo "0")

echo "   ChronoFlux servers: $CHRONO_COUNT"
echo "   P2P nodes: $P2P_COUNT"
echo "   Git evolution: $GIT_COUNT"
echo "   Headless nodes: $HEADLESS_COUNT"

# Check thought evolution
echo ""
echo "📊 Thought Evolution:"
if [ -d thought-evolution/.git ]; then
    cd thought-evolution
    COMMIT_COUNT=$(git rev-list --count HEAD 2>/dev/null || echo "0")
    THOUGHT_COUNT=$(find thoughts -name "*.json" 2>/dev/null | wc -l | tr -d ' ')
    echo "   Git commits: $COMMIT_COUNT"
    echo "   Stored thoughts: $THOUGHT_COUNT"
    
    if [ -f stats.json ]; then
        echo ""
        echo "   Statistics:"
        cat stats.json | grep -E '"total"|"lastUpdate"' | sed 's/^/     /'
    fi
    cd ..
fi

# Check network activity
echo ""
echo "🌐 Network Activity:"
if [ -f p2p-node.log ]; then
    PUBLISHED=$(grep -c "Published thought" p2p-node.log 2>/dev/null || echo "0")
    RECEIVED=$(grep -c "Received thought" p2p-node.log 2>/dev/null || echo "0")
    echo "   Thoughts published: $PUBLISHED"
    echo "   Thoughts received: $RECEIVED"
fi

# Verify autonomous operation
echo ""
echo "🤖 Autonomy Check:"
AUTONOMOUS=true

if [ $CHRONO_COUNT -eq 0 ]; then
    echo "   ❌ No ChronoFlux servers running"
    AUTONOMOUS=false
else
    echo "   ✅ ChronoFlux oscillation active"
fi

if [ $P2P_COUNT -eq 0 ]; then
    echo "   ❌ No P2P nodes running"
    AUTONOMOUS=false
else
    echo "   ✅ P2P thought propagation active"
fi

if [ $COMMIT_COUNT -gt 1 ]; then
    echo "   ✅ Git evolution tracking history"
else
    echo "   ⚠️  Git evolution needs more time"
fi

if [ $THOUGHT_COUNT -gt 0 ]; then
    echo "   ✅ Thoughts persisting to storage"
else
    echo "   ⚠️  No thoughts stored yet"
fi

# Final verdict
echo ""
echo "🎯 Final Verdict:"
if [ "$AUTONOMOUS" = true ] && [ $COMMIT_COUNT -gt 1 ]; then
    echo "   🎉 The P2P organism is FULLY AUTONOMOUS!"
    echo "   It can survive without human intervention."
elif [ "$AUTONOMOUS" = true ]; then
    echo "   ✅ The P2P organism is ACTIVE"
    echo "   Give it more time to evolve."
else
    echo "   ⚠️  The P2P organism needs attention"
    echo "   Some components are not running."
fi

echo ""
echo "💡 Next Steps:"
echo "   - Add more P2P nodes: ./nodes/simple-p2p-node.ts"
echo "   - View thought evolution: cd thought-evolution && git log"
echo "   - Monitor real-time: tail -f p2p-node.log"
echo "   - Add Bluetooth bridge for offline mesh"