# SaaS Application with PostgreSQL

A production-ready Next.js SaaS application with PostgreSQL database, authentication, and role-based access control.

## Prerequisites

- Node.js (18 or later)
- PostgreSQL database
- npm or pnpm package manager

## Database Setup

1. **Create PostgreSQL Database**
   ```bash
   # Connect to PostgreSQL as superuser
   sudo -u postgres psql

   # Create database and user
   CREATE DATABASE saas;
   CREATE USER postgres WITH PASSWORD '1998';
   GRANT ALL PRIVILEGES ON DATABASE saas TO postgres;
   \q
   ```

2. **Environment Configuration**
   The `.env` file is already configured with your database settings:
   ```
   DB_HOST=127.0.0.1
   DB_PORT=5432
   DB_DATABASE=saas
   DB_USERNAME=postgres
   DB_PASSWORD=1998
   DATABASE_URL="postgresql://postgres:1998@127.0.0.1:5432/saas"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

## Installation & Setup

1. **Install Dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

2. **Run Database Migrations**
   ```bash
   npm run db:migrate
   ```
   This will create the necessary tables (users, sessions, migrations).

3. **Seed the Database**
   ```bash
   npm run db:seed
   ```
   This will create default users:
   - Admin: admin@example.com / AdminPass123!
   - Manager: manager@example.com / ManagerPass123!
   - User: user@example.com / UserPass123!

4. **Or Setup Database in One Command**
   ```bash
   npm run db:setup
   ```

## Running the Application

```bash
npm run dev
# or
pnpm dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed the database with initial data
- `npm run db:setup` - Run migrations and seeding
- `npm run db:reset` - Reset database (migrate + seed)
\`\`\`

2. Configure env
Copy `.env.example` to `.env` and fill `DATABASE_URL`.

3. Run DB migrations
\`\`\`
npm run migrate
\`\`\`

4. Seed demo users (admin/manager/user)
\`\`\`
npm run seed
\`\`\`

5. Dev server
\`\`\`
npm run dev
\`\`\`
Visit http://localhost:3000

### Demo accounts
- admin@example.com / AdminPass123!
- manager@example.com / ManagerPass123!
- user@example.com / UserPass123!

## Scripts (add to your package.json)
\`\`\`
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "migrate": "node ./scripts/migrate.js",
  "seed": "node ./scripts/seed.js",
  "test": "vitest"
}
\`\`\`

## Features

- Auth: bcrypt-hashed passwords, session cookie (HttpOnly, SameSite=Lax), 7-day expiry
- CSRF: double submit cookie and `x-csrf-token` header checked on mutating routes
- RBAC: Admin/Manager/User with server-side enforcement and 403 returns
- UI: shadcn Sidebar (collapsible) and Theme toggle (saved to DB and local storage)
- Pages:
  - /dashboard (all authenticated)
  - /users (admin, manager); admin can change roles
  - /profile (self)
  - /settings (theme)
  - /login, /register
  - /forbidden (403), /not-found (404)

## Structure

\`\`\`
app/
  (app)/
    layout.jsx
    dashboard/page.jsx
    users/page.jsx
    profile/page.jsx
    settings/page.jsx
  login/page.jsx
  register/page.jsx
  forbidden/page.jsx
  not-found.jsx
  api/
    auth/
      csrf/route.js
      me/route.js
      login/route.js
      register/route.js
      logout/route.js
    users/route.js
    users/[id]/role/route.js
    user/theme/route.js
components/
  sidebar.jsx
  theme-toggle.jsx
  auth-form.jsx
  users-table.jsx
controllers/
  authController.js
  userController.js
  settingsController.js
lib/
  db.js
  hash.js
  auth.js
  rbac.js
  csrf.js
  validators.js
models/
  userModel.js
  sessionModel.js
scripts/
  migrate.js
  seed.js
  sql/
    001_init.sql
    002_demo_data.sql
tests/
  auth.test.js
  users.test.js
vitest.config.js
.env.example
README.md
\`\`\`

## Security Notes

- Session cookie is HttpOnly + SameSite=Lax, secure in production
- CSRF enforced for state-changing routes with double-submit header/cookie
- Input validation with Zod on all POST/PATCH routes
- Passwords hashed with bcryptjs

## Deployment

- Vercel: Use `DATABASE_URL` from Neon or Supabase. Next.js App Router deploys seamlessly [^1]. 
- Heroku: Add `@neondatabase/serverless` compatible `DATABASE_URL` (or standard Postgres), set env vars, run:
  \`\`\`
  npm run migrate && npm run seed
  \`\`\`
- Add build and start commands to package.json. Ensure `DATABASE_URL` is configured.

## Testing

\`\`\`
npm run test
\`\`\`

Includes examples for password hashing and RBAC on users controller.

## Common Pitfalls

- Missing `DATABASE_URL`: migrations will fail
- Not sending `x-csrf-token` on PATCH/POST to protected routes
- Attempting to access /users without proper role -> 403 by design
- Ensure cookies work over HTTPS in production (`secure: true`)

## References

- App Router, Server Components, Route Handlers [^1]
- Postgres in serverless (Neon) [^2]
- shadcn/ui Sidebar patterns [^3]

[^1]: https://nextjs.org/docs/app
[^2]: https://vercel.com/guides/nextjs-prisma-postgres
[^3]: https://ui.shadcn.com/docs/components/sidebar
