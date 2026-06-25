#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -e

# Arguments
API_URL=${1:-"http://localhost:8000"}
FRONTEND_URL=${2:-"http://localhost:3000"}

echo "=================================================="
echo "Starting VietNews Production Smoke Tests..."
echo "API URL: $API_URL"
echo "Frontend URL: $FRONTEND_URL"
echo "=================================================="

# Helper function for checking http status code
check_status() {
  local url=$1
  local expected=$2
  local description=$3

  echo -n "Checking $description ($url)... "
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" "$url")

  if [ "$code" -eq "$expected" ]; then
    echo -e "\e[32mPASSED (HTTP $code)\e[0m"
  else
    echo -e "\e[31mFAILED (HTTP $code, expected $expected)\e[0m"
    exit 1
  fi
}

# 1. Check API articles endpoint status
check_status "$API_URL/api/articles" 200 "API Articles Listing"

# 2. Check API banner status
check_status "$API_URL/api/banner" 200 "API Banner Endpoint"

# 3. Verify API banner JSON structure (must be an array of length 0 to 5)
echo -n "Validating API Banner JSON payload... "
BANNER_JSON=$(curl -s "$API_URL/api/banner")

# Validate array format and length using Python one-liner
if python3 -c "import json, sys; data = json.loads(sys.stdin.read()); sys.exit(0 if isinstance(data, list) and len(data) <= 5 else 1)" <<< "$BANNER_JSON"; then
  echo -e "\e[32mPASSED (Valid array, size <= 5)\e[0m"
else
  echo -e "\e[31mFAILED (Invalid payload format or size)\e[0m"
  echo "Response was: $BANNER_JSON"
  exit 1
fi

# 4. Check Frontend Home Page status
check_status "$FRONTEND_URL" 200 "Frontend Next.js Homepage"

echo "=================================================="
echo -e "\e[32mALL SMOKE TESTS PASSED SUCCESSFULLY!\e[0m"
echo "=================================================="
exit 0
