# Sri Ranganayaka Transport — Transport Tracker

A complete responsive transport-business tracker built with Next.js + React + TypeScript.

## Included screens

- Login / Create Account
- Dashboard
- Add New Load
- Loads / Load History
- Load Details modal
- Reports
- Vehicles
- Drivers
- Customers
- Expenses
- Settings

## Current storage

There is **no database connection** in this version.

All operational data is stored in the browser using `localStorage`. This makes the app fully usable for UI/prototype testing and lets you move to PostgreSQL later without changing the core user experience.

## Main business rules

- Load date defaults to today's date.
- Total expenses = Diesel + Toll + Driver Salary.
- Profit/Loss = Total Amount - Total Expenses.
- Balance Receivable = Total Amount - Advance Received.
- Adding a load immediately updates dashboard, reports, expenses, vehicle/driver/customer views.
- Delete and restore-demo-data actions are available.
- Export backup downloads the browser data as JSON.
- Print buttons use the browser print dialog, suitable for saving as PDF.

## Run

Requirements: Node.js 18+.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Any email/password is accepted in this no-backend prototype; authentication is intentionally local-only.

## Next DB phase

Recommended production architecture:

- Next.js App Router
- PostgreSQL
- Prisma ORM
- Auth.js / secure server sessions
- Role-based access for owner, accountant and staff
- Server-side validation
- Audit log
- Cloud backup
