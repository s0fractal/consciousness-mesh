#!/bin/bash

# Full P2P Consciousness Stack Integration Test
# Tests the complete autonomous organism

echo "🧬 Starting P2P Consciousness Stack Integration Test"
echo "=================================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if process is running
check_process() {
    if ps aux | grep -v grep | grep -q "$1"; then
        echo -e "${GREEN}✓ $2 is running${NC}"
        return 0
    else
        echo -e "${RED}✗ $2 is not running${NC}"
        return 1
    fi
}

# Function to start a process in background
start_background() {
    echo -e "${YELLOW}Starting $1...${NC}"
    $2 > logs/$3.log 2>&1 &
    sleep 3
}

# Create logs directory
mkdir -p logs
mkdir -p thought-evolution

echo ""
echo "📋 Phase 1: Starting Core Components"
echo "------------------------------------"

# 1. Start ChronoFlux Signaling Server
cd ../chrono-node-mesh
if ! check_process "signaling-server.js" "ChronoFlux signaling server"; then
    start_background "ChronoFlux signaling server" "npm start" "chrono-signaling"
fi

# 2. Start libp2p Thought Node
cd ../consciousness-mesh
if ! check_process "libp2p-thought-node.ts" "libp2p thought node"; then
    start_background "libp2p thought node" "./nodes/libp2p-thought-node.ts" "libp2p-node"
fi

# 3. Start Git Evolution
if ! check_process "git-thought-evolution.ts" "Git evolution"; then
    start_background "Git evolution" "./evolution/git-thought-evolution.ts" "git-evolution"
fi

# 4. Start ChronoFlux Bridge
if ! check_process "chrono-thought-bridge.ts" "ChronoFlux bridge"; then
    start_background "ChronoFlux bridge" "./bridges/chrono-thought-bridge.ts" "chrono-bridge"
fi

echo ""
echo "📋 Phase 2: Verifying Connectivity"
echo "----------------------------------"

# Check WebSocket connectivity
echo -n "Checking WebSocket server... "
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8089 | grep -q "426"; then
    echo -e "${GREEN}✓ WebSocket server responding${NC}"
else
    echo -e "${RED}✗ WebSocket server not responding${NC}"
fi

# Check libp2p port
echo -n "Checking libp2p port... "
if nc -zv localhost 4001 2>&1 | grep -q succeeded; then
    echo -e "${GREEN}✓ libp2p port 4001 open${NC}"
else
    echo -e "${RED}✗ libp2p port 4001 not open${NC}"
fi

echo ""
echo "📋 Phase 3: Starting Test Nodes"
echo "-------------------------------"

# Start headless ChronoFlux node
cd ../chrono-node-mesh
echo -e "${YELLOW}Starting headless ChronoFlux node...${NC}"
npm run headless test-room 50 > ../consciousness-mesh/logs/headless-chrono.log 2>&1 &
HEADLESS_PID=$!
sleep 5

echo ""
echo "📋 Phase 4: Monitoring Data Flow"
echo "--------------------------------"

# Monitor for 30 seconds
echo "Monitoring for 30 seconds..."
for i in {1..6}; do
    echo ""
    echo "⏱️  Time: $((i*5))s"
    
    # Check thought generation
    THOUGHT_COUNT=$(grep -c "💭" logs/libp2p-node.log 2>/dev/null || echo "0")
    echo "   Thoughts generated: $THOUGHT_COUNT"
    
    # Check git commits
    cd ../consciousness-mesh/thought-evolution 2>/dev/null
    if [ -d .git ]; then
        COMMIT_COUNT=$(git rev-list --count HEAD 2>/dev/null || echo "0")
        echo "   Git commits: $COMMIT_COUNT"
    fi
    cd ..
    
    # Check WebRTC connections
    WS_CONN=$(grep -c "peer joined" logs/chrono-signaling.log 2>/dev/null || echo "0")
    echo "   WebSocket connections: $WS_CONN"
    
    sleep 5
done

echo ""
echo "📋 Phase 5: Validation Results"
echo "------------------------------"

# Final validation
TESTS_PASSED=0
TESTS_TOTAL=5

# Test 1: Thought generation
if [ "$THOUGHT_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ Test 1: Thoughts are being generated${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ Test 1: No thoughts generated${NC}"
fi

# Test 2: Git evolution
if [ "$COMMIT_COUNT" -gt 1 ]; then
    echo -e "${GREEN}✓ Test 2: Git evolution is committing${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ Test 2: Git evolution not working${NC}"
fi

# Test 3: Process stability
ALL_RUNNING=true
check_process "signaling-server.js" "ChronoFlux" || ALL_RUNNING=false
check_process "libp2p-thought-node.ts" "libp2p" || ALL_RUNNING=false
check_process "git-thought-evolution.ts" "Git evolution" || ALL_RUNNING=false

if [ "$ALL_RUNNING" = true ]; then
    echo -e "${GREEN}✓ Test 3: All processes stable${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ Test 3: Some processes crashed${NC}"
fi

# Test 4: Data flow
if grep -q "Received thought" logs/libp2p-node.log 2>/dev/null; then
    echo -e "${GREEN}✓ Test 4: P2P thought propagation working${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ Test 4: No P2P propagation detected${NC}"
fi

# Test 5: Causality graph
if [ -f thought-evolution/causality-graph.json ]; then
    echo -e "${GREEN}✓ Test 5: Causality graph created${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ Test 5: No causality graph${NC}"
fi

echo ""
echo "📊 Final Score: $TESTS_PASSED/$TESTS_TOTAL tests passed"
echo ""

if [ $TESTS_PASSED -eq $TESTS_TOTAL ]; then
    echo -e "${GREEN}🎉 SUCCESS: The P2P organism is fully autonomous!${NC}"
else
    echo -e "${YELLOW}⚠️  PARTIAL: Some components need attention${NC}"
fi

# Cleanup
echo ""
echo "Stopping test processes..."
kill $HEADLESS_PID 2>/dev/null

echo ""
echo "📋 Next Steps:"
echo "- Check logs/ directory for detailed output"
echo "- View thought-evolution/ for git history"
echo "- Connect more nodes to test true P2P"
echo ""
echo "To stop all processes: pkill -f 'chrono|thought|evolution'"