#!/usr/bin/env bash
# Platform administration API examples.
# Keep ADMIN_API_KEY out of source control.
# export BASE_URL="https://sri-ranganayaka-transport-tracker.onrender.com"
# export ADMIN_API_KEY="your-32-plus-character-secret"
set -euo pipefail

AUTH=(-H "Authorization: Bearer $ADMIN_API_KEY" -H "Content-Type: application/json")

# 1) Create organization + initial owner
curl -sS -X POST "$BASE_URL/api/admin/organizations" "${AUTH[@]}" \
  -d '{"name":"Sri Ranganayaka Transport","ownerName":"Business Owner","ownerEmail":"owner@example.com","ownerPassword":"CHANGE_THIS_PASSWORD"}'

# 2) List active organizations
curl -sS "$BASE_URL/api/admin/organizations" -H "Authorization: Bearer $ADMIN_API_KEY"

# 3) List active + inactive organizations
curl -sS "$BASE_URL/api/admin/organizations?includeInactive=true" -H "Authorization: Bearer $ADMIN_API_KEY"

# 4) Get one organization
curl -sS "$BASE_URL/api/admin/organizations/$ORG_ID" -H "Authorization: Bearer $ADMIN_API_KEY"

# 5) Rename / activate / deactivate organization
curl -sS -X PATCH "$BASE_URL/api/admin/organizations/$ORG_ID" "${AUTH[@]}" -d '{"name":"New Transport Name"}'
curl -sS -X POST "$BASE_URL/api/admin/organizations/$ORG_ID/deactivate" -H "Authorization: Bearer $ADMIN_API_KEY"
curl -sS -X POST "$BASE_URL/api/admin/organizations/$ORG_ID/activate" -H "Authorization: Bearer $ADMIN_API_KEY"

# 6) Delete organization (SAFE SOFT DELETE; requires exact name confirmation)
curl -sS -X DELETE "$BASE_URL/api/admin/organizations/$ORG_ID" "${AUTH[@]}" \
  -d '{"confirmName":"Sri Ranganayaka Transport"}'

# 7) Provision a new user in an organization
curl -sS -X POST "$BASE_URL/api/admin/users" "${AUTH[@]}" \
  -d '{"organizationId":"ORG_ID","name":"Operations Manager","email":"manager@example.com","password":"CHANGE_THIS_PASSWORD","role":"MANAGER"}'

# 8) List users who have access to an organization
curl -sS "$BASE_URL/api/admin/users?organizationId=$ORG_ID" -H "Authorization: Bearer $ADMIN_API_KEY"

# 9) List users directly under an organization (same access view)
curl -sS "$BASE_URL/api/admin/organizations/$ORG_ID/users" -H "Authorization: Bearer $ADMIN_API_KEY"

# 10) Get one user + all organization memberships
curl -sS "$BASE_URL/api/admin/users/$USER_ID" -H "Authorization: Bearer $ADMIN_API_KEY"

# 11) Update user role / active / name / reset password
curl -sS -X PATCH "$BASE_URL/api/admin/users/$USER_ID" "${AUTH[@]}" \
  -d '{"role":"STAFF","active":true}'
curl -sS -X PATCH "$BASE_URL/api/admin/users/$USER_ID" "${AUTH[@]}" \
  -d '{"password":"NEW_STRONG_PASSWORD"}'

# 12) Existing DELETE user endpoint = global revoke (safe soft revoke)
curl -sS -X DELETE "$BASE_URL/api/admin/users/$USER_ID" -H "Authorization: Bearer $ADMIN_API_KEY"

# 13) Explicit activate / deactivate / revoke
curl -sS -X POST "$BASE_URL/api/admin/users/$USER_ID/activate" -H "Authorization: Bearer $ADMIN_API_KEY"
curl -sS -X POST "$BASE_URL/api/admin/users/$USER_ID/deactivate" -H "Authorization: Bearer $ADMIN_API_KEY"
curl -sS -X POST "$BASE_URL/api/admin/users/$USER_ID/revoke" -H "Authorization: Bearer $ADMIN_API_KEY"

# 14) List all organizations a user can access
curl -sS "$BASE_URL/api/admin/users/$USER_ID/organizations" -H "Authorization: Bearer $ADMIN_API_KEY"

# 15) Grant organization access to an existing user
curl -sS -X POST "$BASE_URL/api/admin/users/$USER_ID/organizations/$ORG_ID" "${AUTH[@]}" \
  -d '{"role":"MANAGER","active":true}'

# 16) Change role or active state for organization-specific access
curl -sS -X PATCH "$BASE_URL/api/admin/users/$USER_ID/organizations/$ORG_ID" "${AUTH[@]}" \
  -d '{"role":"STAFF","active":true}'

# 17) Revoke this user's access to one organization only
curl -sS -X DELETE "$BASE_URL/api/admin/users/$USER_ID/organizations/$ORG_ID" -H "Authorization: Bearer $ADMIN_API_KEY"

# 18) Delete/revoke a user from a specific organization.
# If it is the user's primary organization, the API automatically moves the user to another active membership.
curl -sS -X DELETE "$BASE_URL/api/admin/organizations/$ORG_ID/users/$USER_ID" -H "Authorization: Bearer $ADMIN_API_KEY"

# 19) Make an accessible organization the user's primary organization
curl -sS -X POST "$BASE_URL/api/admin/users/$USER_ID/organizations/$ORG_ID/primary" -H "Authorization: Bearer $ADMIN_API_KEY"

# 20) Logged-in user: list organizations available to the current session
curl -sS -b cookies.txt "$BASE_URL/api/auth/organizations"

# 21) Logged-in user: switch current session to another organization
curl -sS -X POST -b cookies.txt -c cookies.txt "$BASE_URL/api/auth/organizations/$ORG_ID"
