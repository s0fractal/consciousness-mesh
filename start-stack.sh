#!/bin/bash

# Simple startup script for P2P consciousness stack
echo "🚀 Starting P2P Consciousness Stack"

# Terminal 1: ChronoFlux signaling server
echo "Starting ChronoFlux signaling server..."
cd ../chrono-node-mesh
node signaling-server.js &
CHRONO_PID=$!
echo "ChronoFlux PID: $CHRONO_PID"
sleep 2

# Terminal 2: libp2p thought node
echo "Starting libp2p thought node..."
cd ../consciousness-mesh
./nodes/libp2p-thought-node.ts &
LIBP2P_PID=$!
echo "libp2p PID: $LIBP2P_PID"
sleep 2

# Terminal 3: Git evolution
echo "Starting git evolution..."
./evolution/git-thought-evolution.ts &
GIT_PID=$!
echo "Git evolution PID: $GIT_PID"
sleep 2

# Terminal 4: Headless ChronoFlux
echo "Starting headless ChronoFlux..."
cd ../chrono-node-mesh
node headless-runner.js test-room 100 &
HEADLESS_PID=$!
echo "Headless PID: $HEADLESS_PID"

echo ""
echo "✅ All components started!"
echo ""
echo "PIDs:"
echo "  ChronoFlux: $CHRONO_PID"
echo "  libp2p: $LIBP2P_PID"
echo "  Git: $GIT_PID"
echo "  Headless: $HEADLESS_PID"
echo ""
echo "To stop all: kill $CHRONO_PID $LIBP2P_PID $GIT_PID $HEADLESS_PID"
echo ""
echo "Monitoring output for 20 seconds..."
sleep 20

# Check if processes are still running
echo ""
echo "Status check:"
ps -p $CHRONO_PID > /dev/null && echo "✓ ChronoFlux running" || echo "✗ ChronoFlux stopped"
ps -p $LIBP2P_PID > /dev/null && echo "✓ libp2p running" || echo "✗ libp2p stopped"
ps -p $GIT_PID > /dev/null && echo "✓ Git evolution running" || echo "✗ Git evolution stopped"
ps -p $HEADLESS_PID > /dev/null && echo "✓ Headless running" || echo "✗ Headless stopped"