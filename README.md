# Sri Ranganayaka Transport Tracker — Production SaaS Application

Full-stack Next.js + PostgreSQL + Prisma transport management application designed for deployment on Render as a single web service with a Render PostgreSQL database.

## Included functionality

- Current transport-tracker UI and responsive mobile layout
- Login/logout/current-user session flow
- **No public registration UI or registration API**
- Private administrator API for provisioning and revoking access
- OWNER / MANAGER / STAFF roles
- Multi-tenant organization isolation
- Load CRUD
- Rate + Weight fields
- Amount initially calculated as Rate × Weight and directly editable
- Advance and balance receivable
- Diesel, toll and driver salary expenses
- Profit/Loss calculation
- Vehicle CRUD and deactivation
- Driver CRUD and deactivation
- Customer CRUD and deactivation
- Dashboard, reports and expense views
- PostgreSQL Decimal money storage
- Server-side validation
- HTTP-only signed session cookie
- Tenant-scoped database queries
- Prisma migrations
- Render deployment configuration
- Health check endpoint
- Security headers

## Architecture

```text
Browser
   │
   ▼
Render Web Service (Next.js UI + API)
   │
   ▼
Render PostgreSQL
```

The private platform administrator API is part of the same backend, but its API key is never sent to the browser.

## Access model

There is no self-service registration.

Only the person who possesses the private `ADMIN_API_KEY` can:

1. Create an organization and its initial owner.
2. Provision additional users.
3. Change user roles.
4. Reset user passwords.
5. Enable/disable users.
6. Revoke access.

Application users only see the normal Login screen.

## Environment variables

Required in Render:

```env
DATABASE_URL=postgresql://...
AUTH_SECRET=<random value, 32+ characters>
ADMIN_API_KEY=<private random value, 32+ characters>
```

Generate secrets locally with:

```bash
openssl rand -base64 48
```

Never put the real `ADMIN_API_KEY` into GitHub, frontend code, screenshots or `NEXT_PUBLIC_*` variables.

## Local setup

```bash
npm install
cp .env.example .env.local
npx prisma generate
npx prisma migrate deploy
npm run dev
```

For local development, set all three variables in `.env.local`.

## Render deployment

The included `render.yaml` runs:

```text
npm install && npm run check:env && npx prisma generate && npx prisma migrate deploy && npm run build
```

and starts with:

```text
npm start
```

The health check is:

```text
/api/health
```

Create a Render PostgreSQL database and set its connection string as `DATABASE_URL` on the web service. Set `AUTH_SECRET` and `ADMIN_API_KEY` as Render secret environment variables.

## Private administrator API

All admin endpoints require:

```http
Authorization: Bearer YOUR_ADMIN_API_KEY
```

Do not call these endpoints from the React/browser application.

### Create an organization and initial owner

```http
POST /api/admin/organizations
Content-Type: application/json
Authorization: Bearer YOUR_ADMIN_API_KEY
```

Body:

```json
{
  "name": "Sri Ranganayaka Transport",
  "ownerName": "Business Owner",
  "ownerEmail": "owner@example.com",
  "ownerPassword": "strong-password"
}
```

This creates both the organization and its OWNER account.

### List organizations

```http
GET /api/admin/organizations
Authorization: Bearer YOUR_ADMIN_API_KEY
```

### Provision a user

```http
POST /api/admin/users
Content-Type: application/json
Authorization: Bearer YOUR_ADMIN_API_KEY
```

Body:

```json
{
  "organizationId": "ORG_ID",
  "name": "Operations Manager",
  "email": "manager@example.com",
  "password": "strong-password",
  "role": "MANAGER"
}
```

### List organization users

```http
GET /api/admin/users?organizationId=ORG_ID
Authorization: Bearer YOUR_ADMIN_API_KEY
```

### Change user access / role / password

```http
PATCH /api/admin/users/USER_ID
Content-Type: application/json
Authorization: Bearer YOUR_ADMIN_API_KEY
```

Example:

```json
{
  "active": true,
  "role": "STAFF"
}
```

Password reset example:

```json
{
  "password": "new-strong-password"
}
```

### Revoke access

```http
DELETE /api/admin/users/USER_ID
Authorization: Bearer YOUR_ADMIN_API_KEY
```

This performs a soft revoke by setting `active=false`. The user's existing session will also stop working because every authenticated request verifies that the account is still active.

## Application API

### Authentication

```text
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

There is intentionally **no** `/api/auth/signup` route.

### Loads

```text
GET    /api/loads
POST   /api/loads
GET    /api/loads/:id
PATCH  /api/loads/:id
DELETE /api/loads/:id
```

### Vehicles

```text
GET    /api/vehicles
POST   /api/vehicles
PATCH  /api/vehicles/:id
DELETE /api/vehicles/:id
```

### Drivers

```text
GET    /api/drivers
POST   /api/drivers
PATCH  /api/drivers/:id
DELETE /api/drivers/:id
```

### Customers

```text
GET    /api/customers
POST   /api/customers
PATCH  /api/customers/:id
DELETE /api/customers/:id
```

### Dashboard and health

```text
GET /api/dashboard
GET /api/health
```

## Financial rules

For each load:

- Amount defaults in the UI to `Rate × Weight`.
- Amount remains directly editable.
- Total Expenses = Diesel + Toll + Driver Salary.
- Profit/Loss = Amount − Total Expenses.
- Balance Receivable = Amount − Advance.

Rate, Weight and Amount are stored as PostgreSQL `Decimal(14,2)` values.

## Database migrations

Committed migrations are under:

```text
prisma/migrations/
```

Production deployment uses:

```bash
npx prisma migrate deploy
```

Do not use `prisma migrate dev` against the production database.

## Important production notes

- Keep PostgreSQL on Render or another managed provider for production.
- Keep `ADMIN_API_KEY` server-side only.
- Use a long random `AUTH_SECRET`.
- Enable Render automatic deploys only from the intended Git branch.
- Configure database backups/retention in the database provider.
- Do not expose Prisma Studio publicly.
- Do not commit `.env.local` or production secrets.


## Platform administration v1.2

The application now supports complete private platform administration through `ADMIN_API_KEY`: organization details, rename/activation/deactivation, safe organization soft-delete, organization user listing/revocation, user activation/deactivation/revocation, password/role management, multi-organization access grants, per-organization roles, membership revocation, and primary-organization selection.

A user can belong to multiple organizations. The active organization is selected in the signed session, and every operational API request revalidates the user's membership and role against PostgreSQL. This prevents stale sessions from retaining access after an administrator revokes organization access.

See `ADMIN_API.md`, `admin-api-examples.sh`, and `postman/Sri-Ranganayaka-Transport-Admin.postman_collection.json`.

Organization DELETE is intentionally a **soft delete** (`active=false`) to protect transport and financial history. Use the activate endpoint to restore access.
