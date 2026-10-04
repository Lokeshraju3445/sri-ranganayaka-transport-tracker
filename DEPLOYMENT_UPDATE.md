# Deployment update — Platform Admin API v1.2

This ZIP is based on the uploaded Render-running project.

## Render

The existing `render.yaml` already runs Prisma migrations during the build:

```text
npm install && npm run check:env && npx prisma generate && npx prisma migrate deploy && npm run build
```

No manual SQL should be run on Render. Deploy this version and let the migration `20261004100000_admin_access_management` run automatically.

Required Render secrets remain:

```text
DATABASE_URL
AUTH_SECRET
ADMIN_API_KEY
```

`ADMIN_API_KEY` must be at least 32 characters.

## Database changes

The migration adds:

- `Organization.active` for safe organization deactivation/soft deletion.
- `OrganizationMembership` for multi-organization access.
- Existing users are automatically backfilled into a membership for their current organization and role.

## Important behavior

`DELETE /api/admin/organizations/:id` is a **soft delete**, not a physical database wipe. This protects transport and financial history. The organization can be restored with the activate endpoint.

`DELETE /api/admin/users/:id` remains a global soft revoke for backward compatibility.

`DELETE /api/admin/users/:id/organizations/:organizationId` revokes only one organization's access.

`DELETE /api/admin/organizations/:id/users/:userId` also revokes one organization's access. If that organization was the user's primary organization, the API automatically promotes another active membership when one exists; otherwise the user becomes inactive.

## Multi-organization sessions

Users granted access to multiple organizations can see their available organizations through:

```text
GET /api/auth/organizations
```

and switch their current signed session with:

```text
POST /api/auth/organizations/:organizationId
```

Every protected business API now revalidates the user's active organization membership and role against PostgreSQL, so revoking access invalidates that organization access even for an existing browser session.

## Verification

TypeScript was checked successfully with:

```text
./node_modules/.bin/tsc --noEmit
```

A full Next.js production build could not be executed in the isolated build environment because the Next.js native SWC binary was not present and outbound npm registry access was unavailable. Render will install the correct native dependency during its normal build.
