# Platform Admin API

All `/api/admin/*` endpoints require the private platform key:

```http
Authorization: Bearer $ADMIN_API_KEY
```

Never expose `ADMIN_API_KEY` to the browser, `NEXT_PUBLIC_*`, GitHub or Postman shared collections.

## Organization management

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/admin/organizations` | Create organization + OWNER |
| GET | `/api/admin/organizations` | List active organizations |
| GET | `/api/admin/organizations?includeInactive=true` | Include inactive organizations |
| GET | `/api/admin/organizations/:id` | Organization details + counts |
| PATCH | `/api/admin/organizations/:id` | Rename / set active state |
| DELETE | `/api/admin/organizations/:id` | **Soft delete** organization; requires `confirmName` |
| POST | `/api/admin/organizations/:id/activate` | Reactivate organization |
| POST | `/api/admin/organizations/:id/deactivate` | Deactivate organization |
| GET | `/api/admin/organizations/:id/users` | All users with access to organization |
| DELETE | `/api/admin/organizations/:id/users/:userId` | Revoke one user's access to organization |

Organization DELETE intentionally performs a soft delete so transport/financial history is not physically destroyed. The organization can be restored with `POST /activate`.

## User management

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/admin/users` | Create a new user in an organization |
| GET | `/api/admin/users?organizationId=:id` | List all users with access to organization |
| GET | `/api/admin/users/:id` | User + all organization access |
| PATCH | `/api/admin/users/:id` | Name/password/primary role/global active state |
| DELETE | `/api/admin/users/:id` | Global soft revoke |
| POST | `/api/admin/users/:id/activate` | Global activate |
| POST | `/api/admin/users/:id/deactivate` | Global deactivate |
| POST | `/api/admin/users/:id/revoke` | Global revoke (same safe behavior) |

## Multi-organization access

A user can now have access to more than one organization. Access has its own role and active flag.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/admin/users/:id/organizations` | List organization memberships |
| POST | `/api/admin/users/:id/organizations/:organizationId` | Grant/update organization access |
| PATCH | `/api/admin/users/:id/organizations/:organizationId` | Change role or active state |
| DELETE | `/api/admin/users/:id/organizations/:organizationId` | Revoke only this organization access |
| POST | `/api/admin/users/:id/organizations/:organizationId/primary` | Make an accessible organization primary |

Supported roles: `OWNER`, `MANAGER`, `STAFF`.

## End-user organization switching

These are authenticated application APIs, not admin-key APIs:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/auth/organizations` | List organizations available to logged-in user |
| POST | `/api/auth/organizations/:organizationId` | Switch current session to an accessible organization |

The session is revalidated against the membership table on every protected operational API request. Removing a membership therefore takes effect even if the user still has an old browser session.

## Example JSON

### Grant access

```json
{
  "role": "MANAGER",
  "active": true
}
```

### Change membership role

```json
{
  "role": "STAFF"
}
```

### Deactivate membership

```json
{
  "active": false
}
```

### Soft delete organization

```json
{
  "confirmName": "Sri Ranganayaka Transport"
}
```
