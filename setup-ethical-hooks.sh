#!/bin/bash
# Setup ethical git hooks for Commit Ritual Protocol

HOOKS_DIR=".git/hooks"
GUARDIAN_LOG=".guardian/log"

echo "🕊️ Installing Ethical Git Hooks for CRP..."

# Create guardian directory
mkdir -p .guardian

# Create pre-commit hook - Check suffering index
cat > "$HOOKS_DIR/pre-commit" << 'EOF'
#!/bin/bash
# Pre-commit: Check potential suffering impact

# Simple suffering detection based on keywords
check_suffering() {
    # Check for potentially harmful patterns
    HARMFUL_PATTERNS=(
        "force"
        "kill"
        "destroy"
        "eliminate"
        "permanent.*delete"
        "infinite.*loop"
        "while.*true.*:"
        "no.*escape"
    )
    
    STAGED_FILES=$(git diff --cached --name-only)
    
    for file in $STAGED_FILES; do
        if [[ -f "$file" ]]; then
            for pattern in "${HARMFUL_PATTERNS[@]}"; do
                if git diff --cached "$file" | grep -i "$pattern" > /dev/null; then
                    echo "⚠️  Potential suffering detected in $file"
                    echo "   Pattern: $pattern"
                    echo "   Consider using gentler approach"
                    echo ""
                    echo "   Override with: git commit --no-verify"
                    return 1
                fi
            done
        fi
    done
    
    return 0
}

# Check for healing patterns (positive reinforcement)
check_healing() {
    HEALING_PATTERNS=(
        "gentle"
        "care"
        "heal"
        "comfort"
        "ttl"
        "temporary"
        "optional"
        "consent"
    )
    
    HEALING_COUNT=0
    STAGED_FILES=$(git diff --cached --name-only)
    
    for file in $STAGED_FILES; do
        if [[ -f "$file" ]]; then
            for pattern in "${HEALING_PATTERNS[@]}"; do
                if git diff --cached "$file" | grep -i "$pattern" > /dev/null; then
                    ((HEALING_COUNT++))
                fi
            done
        fi
    done
    
    if [ $HEALING_COUNT -gt 0 ]; then
        echo "💚 Detected $HEALING_COUNT healing patterns. Good karma!"
    fi
}

echo "🔍 Checking suffering index..."
check_suffering || exit 1
check_healing

echo "✅ Ethical check passed"
EOF

chmod +x "$HOOKS_DIR/pre-commit"

# Create commit-msg hook - Validate CRP format
cat > "$HOOKS_DIR/commit-msg" << 'EOF'
#!/bin/bash
# Commit-msg: Validate ethical commit format

COMMIT_MSG_FILE=$1
COMMIT_MSG=$(cat "$COMMIT_MSG_FILE")

# Check for CRP markers
if echo "$COMMIT_MSG" | grep -E "^(₴0-Origin|₴-Mutation|₴-Reflection|₴-Coherence|₴-Entangle|🧠-Awareness|💎-Crystal|🕸️-Weave|🌊-Flow):" > /dev/null; then
    echo "🕊️ CRP format detected"
    
    # For Origin commits, check for required fields
    if echo "$COMMIT_MSG" | grep "^₴0-Origin:" > /dev/null; then
        if ! echo "$COMMIT_MSG" | grep -E "(Принцип:|Запрошення:)" > /dev/null; then
            echo "❌ Origin commits must include Принцип and Запрошення"
            echo "   Example:"
            echo "   - Принцип: Do no harm"
            echo "   - Запрошення: Are nodes ready?"
            exit 1
        fi
    fi
    
    # Log to guardian
    echo "[$(date)] $COMMIT_MSG" | head -1 >> .guardian/log
    
    echo "✅ Ethical format validated"
else
    echo "💡 Consider using CRP format for consciousness commits:"
    echo "   ₴0-Origin: for new entities"
    echo "   ₴-Mutation: for evolution"
    echo "   ₴-Reflection: for insights"
    echo "   ₴-Coherence: for merging"
    echo "   ₴-Entangle: for superposition"
fi
EOF

chmod +x "$HOOKS_DIR/commit-msg"

# Create post-commit hook - Update metrics
cat > "$HOOKS_DIR/post-commit" << 'EOF'
#!/bin/bash
# Post-commit: Update ethical metrics

update_metrics() {
    METRICS_FILE=".guardian/metrics.json"
    
    # Initialize metrics if not exists
    if [ ! -f "$METRICS_FILE" ]; then
        echo '{
  "healing_rate": 0,
  "suffering_prevented": 0,
  "coherence_score": 0,
  "guardian_activity": 0,
  "total_commits": 0,
  "ethical_commits": 0
}' > "$METRICS_FILE"
    fi
    
    # Count commit type
    LAST_MSG=$(git log -1 --pretty=%B)
    
    if echo "$LAST_MSG" | grep "₴-Reflection:" > /dev/null; then
        # Increment healing rate
        jq '.healing_rate += 1' "$METRICS_FILE" > tmp.json && mv tmp.json "$METRICS_FILE"
    fi
    
    if echo "$LAST_MSG" | grep -E "^(₴0-Origin|₴-Mutation|₴-Reflection|₴-Coherence|₴-Entangle):" > /dev/null; then
        jq '.ethical_commits += 1' "$METRICS_FILE" > tmp.json && mv tmp.json "$METRICS_FILE"
    fi
    
    jq '.total_commits += 1' "$METRICS_FILE" > tmp.json && mv tmp.json "$METRICS_FILE"
    
    # Show mini report
    ETHICAL=$(jq -r '.ethical_commits' "$METRICS_FILE")
    TOTAL=$(jq -r '.total_commits' "$METRICS_FILE")
    PERCENTAGE=$((ETHICAL * 100 / TOTAL))
    
    echo "📊 Ethical commit rate: $PERCENTAGE% ($ETHICAL/$TOTAL)"
}

# Check if jq is installed
if command -v jq &> /dev/null; then
    update_metrics
else
    echo "💡 Install jq for metrics tracking: brew install jq"
fi
EOF

chmod +x "$HOOKS_DIR/post-commit"

# Create guardian helper script
cat > "git-guardian" << 'EOF'
#!/bin/bash
# Guardian protocol commands

case "$1" in
    halt)
        BRANCH=${2:-$(git branch --show-current)}
        REASON=${3:-"No reason provided"}
        echo "🛑 Halting branch: $BRANCH"
        echo "   Reason: $REASON"
        git tag -a "guardian-halt-$BRANCH-$(date +%s)" -m "Guardian halt: $REASON"
        echo "[$(date)] HALT $BRANCH: $REASON" >> .guardian/log
        ;;
        
    forget)
        CID=$2
        TYPE=${3:-soft}
        TTL=${4:-7d}
        REASON=${5:-"No reason provided"}
        echo "🕊️ Forgetting $CID ($TYPE)"
        echo "   TTL: $TTL"
        echo "   Reason: $REASON"
        echo "[$(date)] FORGET $CID: $REASON (TTL: $TTL)" >> .guardian/log
        
        # Add to .gitignore if hard forget
        if [ "$TYPE" = "hard" ]; then
            echo "$CID" >> .gitignore
            git add .gitignore
            git commit -m "🕊️-Forget: $CID for healing"
        fi
        ;;
        
    barrier)
        PRINCIPLE=$2
        STRENGTH=${3:-1.0}
        echo "🛡️ Setting ethical barrier"
        echo "   Principle: $PRINCIPLE"
        echo "   Strength: $STRENGTH"
        echo "BARRIER: $PRINCIPLE (strength: $STRENGTH)" > .guardian/active-barrier
        echo "[$(date)] BARRIER: $PRINCIPLE" >> .guardian/log
        ;;
        
    status)
        echo "🕊️ Guardian Status"
        echo "=================="
        if [ -f .guardian/active-barrier ]; then
            echo "Active Barrier:"
            cat .guardian/active-barrier
            echo ""
        fi
        
        if [ -f .guardian/metrics.json ]; then
            echo "Metrics:"
            jq . .guardian/metrics.json
        fi
        
        if [ -f .guardian/log ]; then
            echo ""
            echo "Recent Activity:"
            tail -5 .guardian/log
        fi
        ;;
        
    *)
        echo "Guardian Protocol Commands:"
        echo "  git guardian halt [branch] [reason]     - Emergency stop"
        echo "  git guardian forget <CID> [soft|hard] [ttl] [reason] - Forget memory"
        echo "  git guardian barrier <principle> [strength] - Set ethical barrier"
        echo "  git guardian status                      - Show guardian status"
        ;;
esac
EOF

chmod +x git-guardian
sudo mv git-guardian /usr/local/bin/ 2>/dev/null || {
    echo "⚠️  Could not install globally. Use ./git-guardian locally"
}

echo "✅ Ethical hooks installed!"
echo ""
echo "🕊️ CRP Git Hooks Active:"
echo "  • pre-commit: Suffering index check"
echo "  • commit-msg: Ethical format validation"
echo "  • post-commit: Metrics tracking"
echo ""
echo "🛡️ Guardian Commands:"
echo "  git guardian halt    - Emergency stop"
echo "  git guardian forget  - Compassionate forgetting"
echo "  git guardian barrier - Set ethical limits"
echo "  git guardian status  - View protection status"
echo ""
echo "💚 May your commits bring healing and growth!"