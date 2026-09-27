#!/usr/bin/env bash
# Keep ADMIN_API_KEY out of source control.
# Example:
# export BASE_URL="https://YOUR-RENDER-SERVICE.onrender.com"
# export ADMIN_API_KEY="..."

set -euo pipefail

# Create organization + initial owner
curl -sS -X POST "$BASE_URL/api/admin/organizations" \
  -H "Authorization: Bearer $ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"Sri Ranganayaka Transport","ownerName":"Business Owner","ownerEmail":"owner@example.com","ownerPassword":"CHANGE_THIS_PASSWORD"}'

# List organizations
curl -sS "$BASE_URL/api/admin/organizations" \
  -H "Authorization: Bearer $ADMIN_API_KEY"

# Provision a user
curl -sS -X POST "$BASE_URL/api/admin/users" \
  -H "Authorization: Bearer $ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"organizationId":"ORG_ID","name":"Operations Manager","email":"manager@example.com","password":"CHANGE_THIS_PASSWORD","role":"MANAGER"}'

# List users in an organization
curl -sS "$BASE_URL/api/admin/users?organizationId=ORG_ID" \
  -H "Authorization: Bearer $ADMIN_API_KEY"

# Change role / enable / disable / reset password
curl -sS -X PATCH "$BASE_URL/api/admin/users/USER_ID" \
  -H "Authorization: Bearer $ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"role":"STAFF","active":true}'

# Revoke access
curl -sS -X DELETE "$BASE_URL/api/admin/users/USER_ID" \
  -H "Authorization: Bearer $ADMIN_API_KEY"
