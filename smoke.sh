#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:3000}"

echo "=== Smoke test: checking frontend at $BASE_URL ==="

# Check that the homepage loads
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/")
echo "GET / => HTTP $HTTP_STATUS"
if [ "$HTTP_STATUS" -ne 200 ]; then
  echo "FAIL: Expected 200, got $HTTP_STATUS"
  exit 1
fi

# Check that the page contains the expected title text
BODY=$(curl -s "$BASE_URL/")
if echo "$BODY" | grep -q "UPI Invoice Maker"; then
  echo "PASS: Page contains 'UPI Invoice Maker'"
else
  echo "FAIL: Page does not contain 'UPI Invoice Maker'"
  exit 1
fi

echo "=== All smoke tests passed ==="
