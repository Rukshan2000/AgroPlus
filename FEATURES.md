# System Features Documentation

This document summarizes all major features of the SaaS system based on the codebase and documentation.

## Core Features

- **Authentication**
  - Secure login and registration with bcrypt-hashed passwords
  - Session cookies (HttpOnly, SameSite=Lax, secure in production)
  - 7-day session expiry
  - CSRF protection (double submit cookie and `x-csrf-token` header)

- **Role-Based Access Control (RBAC)**
  - Three roles: Admin, Manager, User
  - Server-side enforcement of permissions
  - 403 Forbidden returns for unauthorized access
  - Admin can change user roles

- **User Management**
  - User registration and login
  - Profile management (self)
  - User listing and role management (admin/manager)

- **Dashboard**
  - Overview for authenticated users
  - Access to key metrics and navigation

- **Product Management**
  - Add, update, delete, and list products
  - Bulk product operations
  - Low stock alerts
  - Product search and filtering
  - Category assignment

- **Category Management**
  - Add, update, delete, and list categories
  - Category search and filtering

- **Sales & POS System**
  - Point of Sale (POS) interface for sales
  - Add products to cart, checkout, and generate receipts
  - Sales analytics (daily, monthly, top-selling products, profit analysis)
  - Cashier performance tracking

- **Offline Support**
  - Offline-first product, category, and sales management
  - Local database sync and conflict resolution
  - Pending sync status and manual sync

- **Settings**
  - Theme selection (saved to DB and local storage)
  - User profile settings

- **UI/UX**
  - Responsive sidebar (shadcn/ui)
  - Theme toggle
  - Alert dialogs, modals, and tables for CRUD operations
  - Error pages: 403 Forbidden, 404 Not Found

- **Security**
  - Input validation with Zod on all POST/PATCH routes
  - Passwords hashed with bcryptjs
  - CSRF enforced for state-changing routes

- **API Structure**
  - RESTful API endpoints for auth, users, products, categories, sales, settings
  - Modular controllers and models for each domain

- **Testing**
  - Automated tests for authentication and user management

- **Database**
  - PostgreSQL for persistent storage
  - CouchDB/PouchDB for offline/local storage
  - Database migrations and seeding scripts

## Main Pages
- `/dashboard` (all authenticated users)
- `/users` (admin, manager)
- `/profile` (self)
- `/settings` (theme)
- `/login`, `/register`
- `/forbidden` (403), `/not-found` (404)
- `/pos` (Point of Sale)
- `/categories`, `/products`, `/sales`, `/hr`, `/offline-test`

## Components
- Sidebar, theme toggle, auth form, users table, products table, categories table, modals for add/update/delete, POS components (cart, product grid, receipt)

## Scripts
- `migrate.js`, `seed.js` for database setup
- `test` for running automated tests

---

This document provides a high-level overview. For detailed usage, refer to the README and codebase.
