#!/usr/bin/env bash
#
# Stellar Validator Connectivity Diagnostic
# Tests whether a Stellar Core node is reachable and speaking
# the overlay protocol (not HTTP) on its peer port.
#
# Usage:
#   ./node-connectivity-test.sh <host> [port]
#   ./node-connectivity-test.sh gamma.validator.stellar.creit.tech 11625
#   ./node-connectivity-test.sh 51.83.237.125 11625
#

set -euo pipefail

HOST="${1:?Usage: $0 <host> [port]}"
PORT="${2:-11625}"

# Portable timeout: prefer GNU timeout, fall back to gtimeout (macOS + coreutils)
if command -v timeout &>/dev/null; then
    TIMEOUT_CMD="timeout"
elif command -v gtimeout &>/dev/null; then
    TIMEOUT_CMD="gtimeout"
else
    echo "WARNING: neither 'timeout' nor 'gtimeout' found. Install coreutils (brew install coreutils on macOS)."
    echo "Continuing without timeouts — commands may hang."
    TIMEOUT_CMD=""
fi
timeout_run() { if [ -n "$TIMEOUT_CMD" ]; then "$TIMEOUT_CMD" "$@"; else shift; "$@"; fi; }

echo "=== Stellar Validator Connectivity Test ==="
echo "Target: ${HOST}:${PORT}"
echo "Date:   $(date -u)"
echo ""

# 1. DNS resolution
echo "--- DNS Resolution ---"
if getent hosts "$HOST" > /dev/null 2>&1; then
    IP=$(getent hosts "$HOST" | awk '{print $1}' | head -1)
    echo "OK: ${HOST} resolves to ${IP}"
else
    # fallback for macOS
    IP=$(dig +short "$HOST" 2>/dev/null | head -1 || echo "")
    if [ -n "$IP" ]; then
        echo "OK: ${HOST} resolves to ${IP}"
    else
        echo "FAIL: Cannot resolve ${HOST}"
        exit 1
    fi
fi
echo ""

# 2. TCP connectivity
echo "--- TCP Connectivity ---"
if timeout_run 5 bash -c "echo > /dev/tcp/${HOST}/${PORT}" 2>/dev/null; then
    echo "OK: TCP connection to ${HOST}:${PORT} succeeded"
else
    echo "FAIL: Cannot establish TCP connection to ${HOST}:${PORT}"
    echo "  -> Check firewall rules, security groups, or if stellar-core is running"
    exit 1
fi
echo ""

# 3. Check first bytes of response (HTTP vs Stellar overlay)
echo "--- Protocol Detection ---"
FIRST_BYTES=$(timeout_run 3 bash -c "exec 3<>/dev/tcp/${HOST}/${PORT}; head -c 4 <&3 2>/dev/null" 2>/dev/null | cat -v || echo "")

if [ -z "$FIRST_BYTES" ]; then
    echo "OK: No immediate response (expected for Stellar overlay - it waits for client hello)"
elif echo "$FIRST_BYTES" | grep -qi "HTTP"; then
    echo "FAIL: Server responded with HTTP!"
    echo "  -> A web proxy (nginx/HAProxy/LB) is intercepting port ${PORT}"
    echo "  -> Configure TCP passthrough, not HTTP termination"
    echo ""
    echo "  First bytes received: ${FIRST_BYTES}"

    # Try to get full HTTP response for debugging
    echo ""
    echo "  Full HTTP response:"
    timeout_run 3 bash -c "exec 3<>/dev/tcp/${HOST}/${PORT}; cat <&3" 2>/dev/null | head -20 || true
    exit 1
elif echo "$FIRST_BYTES" | grep -q "^<"; then
    echo "FAIL: Server responded with HTML/XML!"
    echo "  -> A web server is running on port ${PORT} instead of stellar-core"
    echo "  First bytes: ${FIRST_BYTES}"
    exit 1
else
    echo "WARN: Got unexpected immediate data: $(echo "$FIRST_BYTES" | xxd -p | head -c 40)"
    echo "  -> May be OK if stellar-core is sending a hello, or may indicate a proxy"
fi
echo ""

# 4. Check with curl if HTTP is served
echo "--- HTTP Proxy Detection ---"
HTTP_RESPONSE=$(timeout_run 5 curl -s -o /dev/null -w "%{http_code}" "http://${HOST}:${PORT}/" 2>/dev/null || echo "000")
if [ "$HTTP_RESPONSE" != "000" ]; then
    echo "FAIL: Port ${PORT} is serving HTTP (status ${HTTP_RESPONSE})"
    echo "  -> This confirms a web proxy is intercepting the Stellar overlay port"
    echo "  -> stellar-core overlay protocol does NOT speak HTTP"
    echo ""
    echo "  Response headers:"
    timeout_run 5 curl -sI "http://${HOST}:${PORT}/" 2>/dev/null | head -10 || true
    exit 1
else
    echo "OK: Port ${PORT} does not serve HTTP (expected for Stellar overlay)"
fi
echo ""

# 5. Check stellar-core HTTP port (usually 11626)
HTTP_PORT=$((PORT + 1))
echo "--- Stellar Core Admin API (port ${HTTP_PORT}) ---"
INFO_RESPONSE=$(timeout_run 5 curl -s "http://${HOST}:${HTTP_PORT}/info" 2>/dev/null || echo "")
if echo "$INFO_RESPONSE" | grep -q '"state"'; then
    STATE=$(echo "$INFO_RESPONSE" | grep -o '"state" *: *"[^"]*"' | head -1)
    VERSION=$(echo "$INFO_RESPONSE" | grep -o '"build" *: *"[^"]*"' | head -1)
    PROTOCOL=$(echo "$INFO_RESPONSE" | grep -o '"protocol_version" *: *[0-9]*' | head -1)
    OVERLAY=$(echo "$INFO_RESPONSE" | grep -o '"overlay_version" *: *[0-9]*' | head -1 || echo "not found")
    echo "OK: Stellar Core admin API is reachable"
    echo "  ${STATE}"
    echo "  ${VERSION}"
    echo "  ${PROTOCOL}"
    echo "  ${OVERLAY}"
else
    echo "INFO: Admin API not reachable on port ${HTTP_PORT} (may be firewalled - this is OK)"
fi
echo ""

# 6. Summary
echo "=== Summary ==="
echo "Target:     ${HOST}:${PORT}"
echo "DNS:        OK (${IP:-unknown})"
echo "TCP:        OK"
if [ "$HTTP_RESPONSE" != "000" ]; then
    echo "Protocol:   FAIL - HTTP proxy detected on overlay port"
    echo ""
    echo "ACTION REQUIRED:"
    echo "  A reverse proxy or load balancer is intercepting port ${PORT}."
    echo "  Stellar Core overlay uses a binary protocol, not HTTP."
    echo "  Configure your proxy for TCP passthrough on port ${PORT},"
    echo "  or expose stellar-core directly without a proxy on this port."
else
    echo "Protocol:   OK - No HTTP proxy detected"
    echo ""
    echo "If the OBSRVR Radar crawler still cannot connect, check:"
    echo "  1. stellar-core is running and accepting peer connections"
    echo "  2. MAX_PEER_CONNECTIONS is not set too low"
    echo "  3. PREFERRED_PEER_KEYS or KNOWN_PEERS includes the crawler"
    echo "  4. No rate-limiting or DDoS protection is blocking connections"
fi
