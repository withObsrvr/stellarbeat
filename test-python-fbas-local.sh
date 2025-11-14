#!/usr/bin/env bash
#
# Test script to verify Python FBAS scanner works locally before production deployment
#

set -e

echo "=================================================="
echo "Python FBAS Local Testing Script"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

test_passed() {
    echo -e "${GREEN}✓ $1${NC}"
    ((TESTS_PASSED++))
}

test_failed() {
    echo -e "${RED}✗ $1${NC}"
    ((TESTS_FAILED++))
}

test_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

echo "1. Checking if Docker container is running..."
if docker ps | grep -q python-fbas-service; then
    CONTAINER_ID=$(docker ps --filter ancestor=python-fbas-service --format "{{.ID}}")
    test_passed "Docker container running (ID: $CONTAINER_ID)"
else
    test_failed "Docker container not running. Please start it with: docker run -p 8082:8080 python-fbas-service"
    exit 1
fi

echo ""
echo "2. Testing python-fbas CLI inside Docker container..."
if docker exec "$CONTAINER_ID" python-fbas --help > /dev/null 2>&1; then
    test_passed "python-fbas CLI works inside container"
else
    test_failed "python-fbas CLI failed inside container"
    exit 1
fi

echo ""
echo "3. Testing Python FBAS service health endpoint..."
HEALTH_RESPONSE=$(curl -s http://localhost:8082/health)
if echo "$HEALTH_RESPONSE" | jq -e '.status == "healthy"' > /dev/null 2>&1; then
    test_passed "Health endpoint responding: $HEALTH_RESPONSE"
else
    test_failed "Health endpoint failed or returned unhealthy status"
    exit 1
fi

echo ""
echo "4. Testing top tier analysis..."
TOP_TIER_RESPONSE=$(curl -s -X POST http://localhost:8082/analyze/top-tier \
  -H "Content-Type: application/json" \
  -d '{
    "nodes": [
      {"publicKey": "GCGB2S2KGYARPVIA37HYZXVRM2YZUEXA6S33ZU5BUDC6THSB62LZSTYH", "name": "SDF 1", "quorumSet": {"threshold": 3, "validators": ["GCGB2S2KGYARPVIA37HYZXVRM2YZUEXA6S33ZU5BUDC6THSB62LZSTYH", "GABMKJM6I25XI4K7U6XWMULOUQIQ27BCTMLS6BYYSOWKTBUXVRJSXHYQ", "GCM6QMP3DLRPTAZW2UZPCPX2LF3SXWXKPMP3GKFZBDSF3QZGV2G5QSTK"], "innerQuorumSets": []}},
      {"publicKey": "GABMKJM6I25XI4K7U6XWMULOUQIQ27BCTMLS6BYYSOWKTBUXVRJSXHYQ", "name": "SDF 2", "quorumSet": {"threshold": 3, "validators": ["GCGB2S2KGYARPVIA37HYZXVRM2YZUEXA6S33ZU5BUDC6THSB62LZSTYH", "GABMKJM6I25XI4K7U6XWMULOUQIQ27BCTMLS6BYYSOWKTBUXVRJSXHYQ", "GCM6QMP3DLRPTAZW2UZPCPX2LF3SXWXKPMP3GKFZBDSF3QZGV2G5QSTK"], "innerQuorumSets": []}},
      {"publicKey": "GCM6QMP3DLRPTAZW2UZPCPX2LF3SXWXKPMP3GKFZBDSF3QZGV2G5QSTK", "name": "SDF 3", "quorumSet": {"threshold": 3, "validators": ["GCGB2S2KGYARPVIA37HYZXVRM2YZUEXA6S33ZU5BUDC6THSB62LZSTYH", "GABMKJM6I25XI4K7U6XWMULOUQIQ27BCTMLS6BYYSOWKTBUXVRJSXHYQ", "GCM6QMP3DLRPTAZW2UZPCPX2LF3SXWXKPMP3GKFZBDSF3QZGV2G5QSTK"], "innerQuorumSets": []}}
    ]
  }')

if echo "$TOP_TIER_RESPONSE" | jq -e 'has("top_tier")' > /dev/null 2>&1; then
    TOP_TIER_SIZE=$(echo "$TOP_TIER_RESPONSE" | jq -r '.top_tier_size')
    EXEC_TIME=$(echo "$TOP_TIER_RESPONSE" | jq -r '.execution_time_ms')
    test_passed "Top tier analysis succeeded (size: $TOP_TIER_SIZE, time: ${EXEC_TIME}ms)"
else
    test_failed "Top tier analysis failed: $TOP_TIER_RESPONSE"
    exit 1
fi

echo ""
echo "5. Testing blocking sets analysis..."
BLOCKING_RESPONSE=$(curl -s -X POST http://localhost:8082/analyze/blocking-sets \
  -H "Content-Type: application/json" \
  -d '{
    "nodes": [
      {"publicKey": "GCGB2S2KGYARPVIA37HYZXVRM2YZUEXA6S33ZU5BUDC6THSB62LZSTYH", "name": "SDF 1", "quorumSet": {"threshold": 2, "validators": ["GCGB2S2KGYARPVIA37HYZXVRM2YZUEXA6S33ZU5BUDC6THSB62LZSTYH", "GABMKJM6I25XI4K7U6XWMULOUQIQ27BCTMLS6BYYSOWKTBUXVRJSXHYQ"], "innerQuorumSets": []}},
      {"publicKey": "GABMKJM6I25XI4K7U6XWMULOUQIQ27BCTMLS6BYYSOWKTBUXVRJSXHYQ", "name": "SDF 2", "quorumSet": {"threshold": 2, "validators": ["GCGB2S2KGYARPVIA37HYZXVRM2YZUEXA6S33ZU5BUDC6THSB62LZSTYH", "GABMKJM6I25XI4K7U6XWMULOUQIQ27BCTMLS6BYYSOWKTBUXVRJSXHYQ"], "innerQuorumSets": []}}
    ]
  }')

if echo "$BLOCKING_RESPONSE" | jq -e 'has("min_size")' > /dev/null 2>&1; then
    MIN_SIZE=$(echo "$BLOCKING_RESPONSE" | jq -r '.min_size')
    EXEC_TIME=$(echo "$BLOCKING_RESPONSE" | jq -r '.execution_time_ms')
    test_passed "Blocking sets analysis succeeded (min size: $MIN_SIZE, time: ${EXEC_TIME}ms)"
else
    test_failed "Blocking sets analysis failed: $BLOCKING_RESPONSE"
    exit 1
fi

echo ""
echo "6. Testing splitting sets analysis..."
SPLITTING_RESPONSE=$(curl -s -X POST http://localhost:8082/analyze/splitting-sets \
  -H "Content-Type: application/json" \
  -d '{
    "nodes": [
      {"publicKey": "GCGB2S2KGYARPVIA37HYZXVRM2YZUEXA6S33ZU5BUDC6THSB62LZSTYH", "name": "SDF 1", "quorumSet": {"threshold": 2, "validators": ["GCGB2S2KGYARPVIA37HYZXVRM2YZUEXA6S33ZU5BUDC6THSB62LZSTYH", "GABMKJM6I25XI4K7U6XWMULOUQIQ27BCTMLS6BYYSOWKTBUXVRJSXHYQ"], "innerQuorumSets": []}},
      {"publicKey": "GABMKJM6I25XI4K7U6XWMULOUQIQ27BCTMLS6BYYSOWKTBUXVRJSXHYQ", "name": "SDF 2", "quorumSet": {"threshold": 2, "validators": ["GCGB2S2KGYARPVIA37HYZXVRM2YZUEXA6S33ZU5BUDC6THSB62LZSTYH", "GABMKJM6I25XI4K7U6XWMULOUQIQ27BCTMLS6BYYSOWKTBUXVRJSXHYQ"], "innerQuorumSets": []}}
    ]
  }')

if echo "$SPLITTING_RESPONSE" | jq -e 'has("min_size")' > /dev/null 2>&1; then
    MIN_SIZE=$(echo "$SPLITTING_RESPONSE" | jq -r '.min_size')
    EXEC_TIME=$(echo "$SPLITTING_RESPONSE" | jq -r '.execution_time_ms')
    test_passed "Splitting sets analysis succeeded (min size: $MIN_SIZE, time: ${EXEC_TIME}ms)"
else
    test_failed "Splitting sets analysis failed: $SPLITTING_RESPONSE"
    exit 1
fi

echo ""
echo "7. Testing quorums analysis..."
QUORUM_RESPONSE=$(curl -s -X POST http://localhost:8082/analyze/quorums \
  -H "Content-Type: application/json" \
  -d '{
    "nodes": [
      {"publicKey": "GCGB2S2KGYARPVIA37HYZXVRM2YZUEXA6S33ZU5BUDC6THSB62LZSTYH", "name": "SDF 1", "quorumSet": {"threshold": 2, "validators": ["GCGB2S2KGYARPVIA37HYZXVRM2YZUEXA6S33ZU5BUDC6THSB62LZSTYH", "GABMKJM6I25XI4K7U6XWMULOUQIQ27BCTMLS6BYYSOWKTBUXVRJSXHYQ"], "innerQuorumSets": []}},
      {"publicKey": "GABMKJM6I25XI4K7U6XWMULOUQIQ27BCTMLS6BYYSOWKTBUXVRJSXHYQ", "name": "SDF 2", "quorumSet": {"threshold": 2, "validators": ["GCGB2S2KGYARPVIA37HYZXVRM2YZUEXA6S33ZU5BUDC6THSB62LZSTYH", "GABMKJM6I25XI4K7U6XWMULOUQIQ27BCTMLS6BYYSOWKTBUXVRJSXHYQ"], "innerQuorumSets": []}}
    ]
  }')

if echo "$QUORUM_RESPONSE" | jq -e 'has("has_quorum_intersection")' > /dev/null 2>&1; then
    HAS_QI=$(echo "$QUORUM_RESPONSE" | jq -r '.has_quorum_intersection')
    EXEC_TIME=$(echo "$QUORUM_RESPONSE" | jq -r '.execution_time_ms')
    test_passed "Quorum analysis succeeded (intersection: $HAS_QI, time: ${EXEC_TIME}ms)"
else
    test_failed "Quorum analysis failed: $QUORUM_RESPONSE"
    exit 1
fi

echo ""
echo "8. Checking backend configuration..."
if grep -q "ENABLE_PYTHON_FBAS=true" apps/backend/.env 2>/dev/null; then
    test_passed "ENABLE_PYTHON_FBAS=true in backend .env"
else
    test_warning "ENABLE_PYTHON_FBAS not set to true in backend .env"
fi

if grep -q "PYTHON_FBAS_SERVICE_URL=http://localhost:8082" apps/backend/.env 2>/dev/null; then
    test_passed "PYTHON_FBAS_SERVICE_URL correctly configured"
else
    test_warning "PYTHON_FBAS_SERVICE_URL not pointing to http://localhost:8082"
fi

echo ""
echo "=================================================="
echo "Test Summary"
echo "=================================================="
echo -e "${GREEN}Tests passed: $TESTS_PASSED${NC}"
if [ $TESTS_FAILED -gt 0 ]; then
    echo -e "${RED}Tests failed: $TESTS_FAILED${NC}"
    echo ""
    echo "❌ Some tests failed. Please fix the issues before deploying to production."
    exit 1
else
    echo ""
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo ""
    echo "✅ Python FBAS scanner is working correctly locally."
    echo ""
    echo "Next steps:"
    echo "  1. Run a full network scan to verify integration: pnpm start:scan-network 0 0"
    echo "  2. Check logs for 'Python FBAS analysis succeeded'"
    echo "  3. If successful, proceed with Terraform deployment to production"
    echo ""
fi
