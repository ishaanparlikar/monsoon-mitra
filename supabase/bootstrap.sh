#!/bin/bash
# ============================================================================
# Monsoon Assistant — Supabase Bootstrap Script
# ============================================================================
# This script:
#   1. Creates 11 test auth.users via the Supabase Admin API
#   2. Runs the migration (schema) if not yet applied
#   3. Seeds the database via seed.sql
#
# Usage:
#   chmod +x supabase/bootstrap.sh
#   SERVICE_KEY="your-service-role-key" ./supabase/bootstrap.sh
#
# Get your Service Role key from:
#   Supabase Dashboard → Project Settings → API → service_role (secret)
# ============================================================================

set -eo pipefail

PROJECT_REF="sojpmpkzpxfruuycshnd"
SUPABASE_URL="https://${PROJECT_REF}.supabase.co"

# Use env variable or prompt
SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-$SERVICE_KEY}"
if [ -z "$SERVICE_KEY" ]; then
  echo "❌ ERROR: SUPABASE_SERVICE_ROLE_KEY is not set."
  echo "   Run: SUPABASE_SERVICE_ROLE_KEY='your-key-here' ./supabase/bootstrap.sh"
  exit 1
fi

echo ""
echo "🌧️  Monsoon Assistant — Supabase Bootstrap"
echo "   Project: ${PROJECT_REF}"
echo ""

# ============================================================================
# STEP 1: Create auth users
# ============================================================================
echo "📋 Step 1: Creating test auth users..."

declare -A USERS=(
  ["a0000000-0000-0000-0000-000000000001"]="+919876543210"
  ["a0000000-0000-0000-0000-000000000002"]="+919876543211"
  ["a0000000-0000-0000-0000-000000000003"]="+919876543212"
  ["a0000000-0000-0000-0000-000000000004"]="+919876543213"
  ["a0000000-0000-0000-0000-000000000005"]="+919876543214"
  ["a0000000-0000-0000-0000-000000000006"]="+919876543215"
  ["a0000000-0000-0000-0000-000000000007"]="+919876543216"
  ["a0000000-0000-0000-0000-000000000008"]="+919876543217"
  ["a0000000-0000-0000-0000-000000000009"]="+919876543218"
  ["a0000000-0000-0000-0000-000000000010"]="+919876543219"
  ["a0000000-0000-0000-0000-000000000011"]="+919876543220"
)

SUCCESS=0
SKIP=0
FAIL=0

for UUID in "${!USERS[@]}"; do
  PHONE="${USERS[$UUID]}"
  HTTP_STATUS=$(curl -s -o /tmp/resp.json -w "%{http_code}" \
    -X POST "${SUPABASE_URL}/auth/v1/admin/users" \
    -H "Authorization: Bearer ${SERVICE_KEY}" \
    -H "apikey: ${SERVICE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"id\": \"${UUID}\", \"phone\": \"${PHONE}\", \"phone_confirm\": true}")

  if [ "$HTTP_STATUS" -eq 200 ] || [ "$HTTP_STATUS" -eq 201 ]; then
    echo "   ✅ Created user ${PHONE} (${UUID})"
    SUCCESS=$((SUCCESS+1))
  elif [ "$HTTP_STATUS" -eq 422 ]; then
    echo "   ⚠️  User ${PHONE} already exists — skipping"
    SKIP=$((SKIP+1))
  else
    echo "   ❌ Failed to create ${PHONE} (HTTP ${HTTP_STATUS})"
    cat /tmp/resp.json
    FAIL=$((FAIL+1))
  fi
done

echo ""
echo "   Users: ${SUCCESS} created, ${SKIP} skipped, ${FAIL} failed"
echo ""

if [ "$FAIL" -gt 0 ]; then
  echo "❌ Some users failed to create. Check your service role key and try again."
  exit 1
fi

# ============================================================================
# STEP 2: Run seed.sql via Supabase REST API (pg function)
# ============================================================================
echo "📋 Step 2: Seeding database..."
echo ""
echo "   The seed.sql file must be run inside the Supabase SQL Editor."
echo "   The Supabase Admin REST API doesn't support raw SQL execution."
echo ""
echo "   👉 MANUAL STEP REQUIRED:"
echo "   1. Open: https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new"
echo "   2. Copy and paste the contents of: supabase/seed.sql"
echo "   3. Click 'Run'"
echo ""

# ============================================================================
# STEP 3: Update .env with service key
# ============================================================================
echo "📋 Step 3: Update .env..."
echo ""
echo "   Add your service role key to .env:"
echo "   SUPABASE_SERVICE_ROLE_KEY=${SERVICE_KEY:0:20}..."
echo ""
echo "✅ Bootstrap complete! Auth users are created."
echo "   Next: Run seed.sql in the Supabase SQL Editor (link above)."
echo ""
