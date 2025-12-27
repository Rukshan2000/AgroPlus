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
  - Product restocking with quantity tracking
  - Barcode sticker generation (individual and bulk)
  - Product inventory management

- **Category Management**
  - Add, update, delete, and list categories
  - Category search and filtering
  - Color coding for categories with visual indicators
  - Category usage tracking and deletion protection

- **Sales & POS System**
  - Point of Sale (POS) interface for sales
  - Add products to cart, checkout, and generate receipts
  - Sales analytics (daily, monthly, top-selling products, profit analysis)
  - Cashier performance tracking

- **Human Resources (HR) System**
  - Time tracking and work session management
  - Payroll calculation and management
  - Employee payroll information tracking (hourly rates, positions, hire dates)
  - Automated monthly payroll calculations
  - Payroll approval workflow
  - HR dashboard with employee statistics and analytics
  - Individual and manager access to work sessions and payroll data

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
  - RESTful API endpoints for auth, users, products, categories, sales, hr, settings
  - Public API endpoints for website integration
  - Modular controllers and models for each domain

- **Testing**
  - Automated tests for authentication and user management
  - Test coverage for core business logic
  - Integration tests for API endpoints

- **Database**
  - PostgreSQL for persistent storage
  - Database migrations and seeding scripts

## Advanced Features

- **Barcode Management**
  - Individual product barcode sticker generation with customizable layout
  - Bulk barcode generation for multiple products
  - Print-ready barcode stickers with product information
  - Downloadable barcode images in PNG format

- **Inventory Management**
  - Product restocking functionality with quantity tracking
  - Stock level monitoring and alerts
  - Inventory history and audit trails
  - Real-time stock updates across the system

- **Category Enhancement**
  - Visual category organization with color coding
  - Color picker interface for category customization
  - Category usage tracking to prevent accidental deletion
  - Enhanced category filtering and search capabilities

- **Employee Management**
  - Work session tracking with clock-in/clock-out functionality
  - Automated time calculation and reporting
  - Position and hourly rate management
  - Employee performance analytics and reporting

- **Website Integration**
  - Public API endpoints for website product display
  - Category and product data accessible for external websites
  - Seamless integration between internal management and public-facing content

## Main Pages
- `/dashboard` (all authenticated users)
- `/users` (admin, manager)
- `/profile` (self)
- `/settings` (theme)
- `/login`, `/register`
- `/forbidden` (403), `/not-found` (404)
- `/pos` (Point of Sale)
- `/categories`, `/products`, `/sales`, `/hr`, `/hr/payroll`, `/outlets`

## Components
- Sidebar, theme toggle, auth form, users table, products table, categories table, modals for add/update/delete, POS components (cart, product grid, receipt)
- Barcode generation components (individual and bulk barcode stickers)
- Product restocking modal with quantity tracking
- Category color picker and visual indicators
- HR dashboard and payroll management components

## Scripts
- `migrate.js`, `seed.js` for database setup
- `test` for running automated tests

---

This document provides a high-level overview. For detailed usage, refer to the README and codebase.

## Recent Updates

This documentation has been updated to reflect the latest features including:
- Enhanced barcode generation and management system
- Advanced inventory management with restocking capabilities  
- Comprehensive HR module with time tracking and payroll management
- Improved category management with color coding
- Website integration capabilities with public API endpoints

The system continues to evolve with new features being added regularly to meet business requirements.
