# Sri Ranganayaka Transport API

## Authentication

`POST /api/auth/login` creates an HTTP-only session cookie.

`GET /api/auth/me` returns the current authenticated user.

`POST /api/auth/logout` clears the session.

There is **no public registration endpoint**. `/api/auth/signup` is intentionally not implemented.

## Platform administration — API key only

These endpoints are not available from the application UI. They require:

`Authorization: Bearer $ADMIN_API_KEY`

The `ADMIN_API_KEY` exists only on the Render server as a secret environment variable. Never expose it in browser code, GitHub, screenshots or frontend environment variables.

### Organizations
- `GET /api/admin/organizations` — list organizations and counts.
- `POST /api/admin/organizations` — create an organization and its initial OWNER.

Example body:
```json
{
  "name": "Sri Ranganayaka Transport",
  "ownerName": "Business Owner",
  "ownerEmail": "owner@example.com",
  "ownerPassword": "strong-password"
}
```

### Users / access
- `GET /api/admin/users?organizationId=...` — list users for an organization.
- `POST /api/admin/users` — provision a user.
- `PATCH /api/admin/users/:id` — change name, password, role or active status.
- `DELETE /api/admin/users/:id` — revoke access by setting `active=false`.

Example provision body:
```json
{
  "organizationId": "org_id",
  "name": "Operations Manager",
  "email": "manager@example.com",
  "password": "strong-password",
  "role": "MANAGER"
}
```

Roles: `OWNER`, `MANAGER`, `STAFF`.

## Loads
- `GET /api/loads?q=&from=&to=`
- `POST /api/loads`
- `GET /api/loads/:id`
- `PATCH /api/loads/:id`
- `DELETE /api/loads/:id`

Load fields include `rate`, `weight`, and directly editable `amount`. The UI initially calculates `amount = rate × weight`; the API persists the amount supplied by the authenticated user. Expenses are diesel, toll and driver salary. Profit = amount - expenses.

## Vehicles
- `GET /api/vehicles`
- `POST /api/vehicles`
- `PATCH /api/vehicles/:id`
- `DELETE /api/vehicles/:id` — soft deactivation

## Drivers
- `GET /api/drivers`
- `POST /api/drivers`
- `PATCH /api/drivers/:id`
- `DELETE /api/drivers/:id` — soft deactivation

## Customers
- `GET /api/customers`
- `POST /api/customers`
- `PATCH /api/customers/:id`
- `DELETE /api/customers/:id` — soft deactivation

## Dashboard / health
- `GET /api/dashboard`
- `GET /api/health`

All operational endpoints are scoped to the authenticated user's `organizationId`.
