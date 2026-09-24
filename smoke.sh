#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:3000}"
PASS=0
FAIL=0

pass() { echo "  ✅ PASS: $1"; PASS=$((PASS + 1)); }
fail() { echo "  ❌ FAIL: $1"; FAIL=$((FAIL + 1)); }

echo "=== Smoke tests: Live Invoice Preview — $BASE_URL ==="
echo ""

# ── Wait for the app to be ready (up to 30 seconds) ──────────
echo "⏳ Waiting for app to be ready..."
READY=0
for i in $(seq 1 30); do
  if curl -s -o /dev/null -w "" "$BASE_URL/" 2>/dev/null; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/")
    if [ "$HTTP_CODE" = "200" ]; then
      READY=1
      echo "  App ready after ${i}s"
      break
    fi
  fi
  sleep 1
done

if [ "$READY" -ne 1 ]; then
  echo "FATAL: App not ready after 30s"
  exit 1
fi

# ── Fetch the homepage ───────────────────────────────────────
BODY=$(curl -s "$BASE_URL/")

check() {
  local label="$1"
  local pattern="$2"
  local source="${3:-BODY}"
  local content
  if [ "$source" = "PREVIEW" ]; then
    content="$PREVIEW_BODY"
  else
    content="$BODY"
  fi
  if echo "$content" | grep -q "$pattern"; then
    pass "$label"
  else
    fail "$label — pattern not found: $pattern"
  fi
}

echo ""
echo "── AC1: Real-time preview updates (page structure) ────────"
check "Page contains 'UPI Invoice Maker' title" "UPI Invoice Maker"
check "Page contains invoice-preview div (id)" "invoice-preview"

echo ""
echo "── AC2: Invoice meta with date labels (dd/mm/yy format) ──"
check "Invoice No label present" "Invoice No"
check "Issued label present" "Issued"
check "Due Date label present" "Due Date"

echo ""
echo "── AC3: From section with sender placeholder ──────────────"
check "From label present" "From"
check "Your Name placeholder present" "Your Name"

echo ""
echo "── AC4: To section with client placeholder ────────────────"
check "To label present" ">To<"
check "Client Name placeholder present" "Client Name"

echo ""
echo "── AC5: Line items table headers ──────────────────────────"
check "Description column header" "Description"
check "Qty column header" "Qty"
check "Price column header" "Price"
check "Amount column header" "Amount"

echo ""
echo "── AC6: Totals section with INR formatting ────────────────"
check "Subtotal label present" "Subtotal"
check "Total label present" "Total"
check "₹ currency symbol present" "₹"

echo ""
echo "── AC7: Shimmer animation for QR placeholder ──────────────"
# The shimmer CSS renders on /preview-test (which has a UPI ID set)
# because the homepage defaults to empty upiId (QR section hidden).
PREVIEW_BODY=$(curl -s "$BASE_URL/preview-test")
PREVIEW_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/preview-test")
if [ "$PREVIEW_STATUS" = "200" ]; then
  pass "Preview-test page loads (HTTP 200)"
else
  fail "Preview-test page returned HTTP $PREVIEW_STATUS"
fi
check "Shimmer CSS keyframes present on preview-test" "shimmer" "PREVIEW"
check "Pay via UPI label present" "Pay via UPI" "PREVIEW"

echo ""
echo "════════════════════════════════════════════════════════════"
echo "Results: $PASS passed, $FAIL failed"
echo "════════════════════════════════════════════════════════════"

if [ "$FAIL" -gt 0 ]; then
  echo "FAILED"
  exit 1
fi

echo "ALL SMOKE TESTS PASSED"
exit 0
