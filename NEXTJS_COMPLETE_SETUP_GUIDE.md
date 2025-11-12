# Complete Next.js Project Setup Guide

## Table of Contents
1. [Next.js Project Setup](#1-nextjs-project-setup)
2. [Tailwind CSS Setup](#2-tailwind-css-setup)
3. [Prisma Setup](#3-prisma-setup)
4. [JWT Authentication Setup](#4-jwt-authentication-setup)
5. [Complete Example](#5-complete-example)
6. [Environment Variables](#6-environment-variables)
7. [Testing the Setup](#7-testing-the-setup)

---

## 1. Next.js Project Setup

### Initialize a New Next.js Project

```bash
# Using npx (npm)
npx create-next-app@cms

# Using pnpm (recommended for better performance)
pnpm create next-app cms

# Using yarn
yarn create next-app cms
```

### Configuration Options
During installation, you'll be prompted with:
- ✅ TypeScript? → **Yes** (recommended)
- ✅ ESLint? → **Yes**
- ✅ Tailwind CSS? → **Yes**
- ✅ `src/` directory? → **No** (personal preference)
- ✅ App Router? → **Yes** (recommended for Next.js 13+)
- ✅ Import alias? → **Yes** (@/*)

### Navigate to Project Directory

```bash
cd my-app
```

### Project Structure
```
my-app/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── public/
├── node_modules/
├── package.json
├── tsconfig.json
├── next.config.js
└── tailwind.config.js
```

---

## 2. Tailwind CSS Setup

### Install Tailwind CSS (if not selected during setup)

```bash
pnpm add -D tailwindcss postcss autoprefixer
pnpm dlx tailwindcss init -p
```

### Configure `tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
    },
  },
  plugins: [],
}
```

### Configure `postcss.config.js`

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### Add Tailwind Directives to `app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom global styles */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
  }
 
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
  }
}

@layer components {
  .btn-primary {
    @apply bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors;
  }
}
```

---

## 3. Prisma Setup

### Install Prisma

```bash
pnpm add -D prisma
pnpm add @prisma/client
```

### Initialize Prisma

```bash
pnpm dlx prisma init
```

This creates:
- `prisma/schema.prisma` - Database schema
- `.env` - Environment variables file

### Configure Database Connection

Edit `.env`:

```env
# PostgreSQL
DATABASE_URL="postgresql://username:password@localhost:5432/mydb?schema=public"

# MySQL
# DATABASE_URL="mysql://username:password@localhost:3306/mydb"

# SQLite (for development)
# DATABASE_URL="file:./dev.db"
```

### Define Prisma Schema

Edit `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql" // or "mysql", "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  username      String?   @unique
  password      String
  name          String?
  role          Role      @default(USER)
  emailVerified DateTime?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  sessions      Session[]
  
  @@map("users")
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("sessions")
}

enum Role {
  USER
  ADMIN
  MANAGER
}
```

### Generate Prisma Client

```bash
pnpm dlx prisma generate
```

### Run Database Migration

```bash
# Create and apply migration
pnpm dlx prisma migrate dev --name init

# Push schema without migration (development only)
# pnpm dlx prisma db push
```

### Create Prisma Client Instance

Create `lib/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['query', 'error', 'warn'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### Prisma Studio (Database GUI)

```bash
pnpm dlx prisma studio
```

---

## 4. JWT Authentication Setup

### Install Required Packages

```bash
pnpm add jsonwebtoken bcryptjs jose
pnpm add -D @types/jsonwebtoken @types/bcryptjs
```

### Configure Environment Variables

Add to `.env`:

```env
# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_SECRET="your-refresh-token-secret"
JWT_REFRESH_EXPIRES_IN="30d"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

### Create Authentication Utilities

Create `lib/auth.ts`:

```typescript
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const secretKey = process.env.JWT_SECRET!
const key = new TextEncoder().encode(secretKey)

export type SessionPayload = {
  userId: string
  email: string
  role: string
  expiresAt: Date
}

export async function encrypt(payload: SessionPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7 days')
    .sign(key)
}

export async function decrypt(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    })
    return payload as SessionPayload
  } catch (error) {
    console.error('Failed to verify token:', error)
    return null
  }
}

export async function createSession(userId: string, email: string, role: string) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  const session = await encrypt({ userId, email, role, expiresAt })
  
  cookies().set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })
  
  return session
}

export async function getSession() {
  const cookie = cookies().get('session')?.value
  if (!cookie) return null
  return await decrypt(cookie)
}

export async function deleteSession() {
  cookies().delete('session')
}

export async function updateSession(request: NextRequest) {
  const session = request.cookies.get('session')?.value
  if (!session) return

  const parsed = await decrypt(session)
  if (!parsed) return

  const res = NextResponse.next()
  res.cookies.set({
    name: 'session',
    value: await encrypt(parsed),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: parsed.expiresAt,
    sameSite: 'lax',
    path: '/',
  })

  return res
}
```

### Create Password Hashing Utilities

Create `lib/password.ts`:

```typescript
import bcrypt from 'bcryptjs'

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}
```

### Create Authentication API Routes

Create `app/api/auth/register/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = registerSchema.parse(body)

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    })

    return NextResponse.json(
      { message: 'User created successfully', user },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    )
  }
}
```

Create `app/api/auth/login/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/password'
import { createSession } from '@/lib/auth'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = loginSchema.parse(body)

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password)

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Create session
    await createSession(user.id, user.email, user.role)

    return NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    )
  }
}
```

Create `app/api/auth/logout/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { deleteSession } from '@/lib/auth'

export async function POST() {
  await deleteSession()
  return NextResponse.json({ message: 'Logged out successfully' })
}
```

Create `app/api/auth/me/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    )
  }
}
```

### Create Middleware for Protected Routes

Create `middleware.ts` in root directory:

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decrypt, updateSession } from '@/lib/auth'

const publicRoutes = ['/login', '/register', '/']
const authRoutes = ['/login', '/register']

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const isPublicRoute = publicRoutes.includes(path)
  const isAuthRoute = authRoutes.includes(path)

  // Get session
  const cookie = request.cookies.get('session')?.value
  const session = cookie ? await decrypt(cookie) : null

  // Redirect to login if accessing protected route without session
  if (!isPublicRoute && !session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect to dashboard if accessing auth routes with active session
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Update session expiry
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

### Install Zod for Validation

```bash
pnpm add zod
```

---

## 5. Complete Example

### Create Login Page

Create `app/login/page.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Login failed')
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="text-3xl font-bold text-center text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

### Create Dashboard Page

Create `app/dashboard/page.tsx`:

```typescript
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export default async function DashboardPage() {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  })

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
          <div className="space-y-2">
            <p className="text-gray-600">
              <span className="font-semibold">Email:</span> {user?.email}
            </p>
            <p className="text-gray-600">
              <span className="font-semibold">Name:</span> {user?.name || 'N/A'}
            </p>
            <p className="text-gray-600">
              <span className="font-semibold">Role:</span> {user?.role}
            </p>
          </div>
          <form action="/api/auth/logout" method="POST" className="mt-6">
            <button type="submit" className="btn-primary">
              Logout
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
```

---

## 6. Environment Variables

Complete `.env` file:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/mydb?schema=public"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production-min-32-chars"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_SECRET="your-refresh-token-secret-change-this-in-production"
JWT_REFRESH_EXPIRES_IN="30d"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# Optional: Email configuration for password reset
# SMTP_HOST="smtp.gmail.com"
# SMTP_PORT="587"
# SMTP_USER="your-email@gmail.com"
# SMTP_PASSWORD="your-app-password"
```

Create `.env.example`:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/mydb?schema=public"

# JWT Configuration
JWT_SECRET="generate-a-random-secret-key-here"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_SECRET="generate-another-random-secret-key"
JWT_REFRESH_EXPIRES_IN="30d"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

---

## 7. Testing the Setup

### Start Development Server

```bash
pnpm dev
```

### Test Authentication Flow

1. **Register a new user**:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
```

2. **Login**:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -c cookies.txt
```

3. **Get current user**:
```bash
curl http://localhost:3000/api/auth/me \
  -b cookies.txt
```

4. **Logout**:
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt
```

### Manual Testing

1. Navigate to `http://localhost:3000/register`
2. Create an account
3. Navigate to `http://localhost:3000/login`
4. Login with your credentials
5. You should be redirected to `/dashboard`
6. Try accessing `/dashboard` after logging out (should redirect to login)

---

## Additional Enhancements

### Add Role-Based Access Control

Create `lib/rbac.ts`:

```typescript
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export async function requireAuth(allowedRoles?: string[]) {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    redirect('/forbidden')
  }

  return session
}
```

Usage in server components:

```typescript
import { requireAuth } from '@/lib/rbac'

export default async function AdminPage() {
  await requireAuth(['ADMIN'])
  
  // Admin-only content
  return <div>Admin Dashboard</div>
}
```

### Add Password Reset

Create `app/api/auth/forgot-password/route.ts` and implement email sending logic.

### Add Email Verification

Extend the User model with `emailVerified` field and create verification flow.

### Add OAuth Providers

Install and configure `next-auth` for Google, GitHub, etc.

---

## Project Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "db:seed": "ts-node prisma/seed.ts"
  }
}
```

---

## Production Checklist

- [ ] Change all JWT secrets to strong random values
- [ ] Use HTTPS in production
- [ ] Set `secure: true` for cookies
- [ ] Configure proper CORS policies
- [ ] Add rate limiting
- [ ] Implement refresh tokens
- [ ] Add input validation on all endpoints
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Configure database backups
- [ ] Add logging system
- [ ] Implement security headers
- [ ] Set up CI/CD pipeline
- [ ] Add unit and integration tests

---

## Troubleshooting

### Common Issues

1. **Prisma Client not found**
   ```bash
   pnpm dlx prisma generate
   ```

2. **Database connection errors**
   - Verify DATABASE_URL in .env
   - Check database server is running
   - Ensure database exists

3. **JWT verification fails**
   - Check JWT_SECRET is set correctly
   - Ensure secret is at least 32 characters
   - Clear browser cookies and try again

4. **Middleware redirect loop**
   - Check publicRoutes array includes necessary paths
   - Verify middleware matcher configuration

5. **TypeScript errors**
   ```bash
   pnpm add -D @types/node @types/react @types/react-dom
   ```

---

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [JWT.io](https://jwt.io/)
- [Next.js Examples](https://github.com/vercel/next.js/tree/canary/examples)

---

## License

This guide is provided as-is for educational purposes.

---

**Created**: November 7, 2025
**Last Updated**: November 7, 2025
