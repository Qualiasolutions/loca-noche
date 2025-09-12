# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Loca Noche Entertainment** - A Next.js event ticketing platform for Cyprus's premier entertainment company specializing in live concerts and cultural events.

## Commands

```bash
# Development
pnpm dev         # Start development server on http://localhost:3000

# Build & Production
pnpm build       # Build for production
pnpm start       # Start production server

# Testing
pnpm test        # Run Jest test suite
pnpm test:watch  # Run tests in watch mode
pnpm test:coverage # Run tests with coverage report

# Code Quality
pnpm lint        # Run Next.js linting

# Database (Prisma)
pnpm db:generate # Generate Prisma client
pnpm db:push     # Push schema changes to database
pnpm db:migrate  # Run database migrations
pnpm db:studio   # Open Prisma Studio
```

## Architecture

This is a Next.js 14 application using App Router with the following structure:

### Core Pages
- `/` - Coming soon landing page with newsletter signup
- `/tickets` - Event listing and ticket booking interface
- `/admin` - Admin panel for event management

### Tech Stack
- **Framework**: Next.js 14.2.16 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcrypt password hashing
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS v4 with custom animations
- **Forms**: react-hook-form with Zod validation
- **Testing**: Jest with React Testing Library, Playwright E2E
- **Package Manager**: pnpm

### Component Architecture
- All UI components are pre-built shadcn components in `/components/ui/`
- Uses Radix UI for accessibility and behavior
- Components use CVA (class-variance-authority) for variant management

### API Architecture
- RESTful API routes in `/app/api/`
- Authentication endpoints (`/auth/login`, `/auth/register`)
- Event management (`/events`, `/events/[id]`)
- Booking system (`/bookings`)
- Payment processing (`/payments/create`, `/payments/webhook`)

### Database Schema
- **User Management**: User authentication, roles (CUSTOMER, ADMIN, ORGANIZER, STAFF)
- **Event System**: Events, venues, ticket types with capacity management
- **Booking Flow**: Complete booking lifecycle with payment tracking
- **Venue Management**: Multi-section venues with seat mapping capabilities

## Key Features

- **Event Management**: Dynamic event listing with real-time availability
- **Ticket Booking**: Multi-step booking flow with quantity selection and QR code generation
- **Payment Processing**: Integrated payment system with VivaWallet support
- **Admin Dashboard**: Event creation, booking management, analytics
- **User Authentication**: JWT-based auth with role-based access control
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints
- **Dark Theme**: Entertainment-focused dark design with red/yellow accents

## Development Notes

- **Configuration**: Build ignores TypeScript/ESLint errors for faster development
- **Images**: Unoptimized images expected in `/public/` (logo.png, entertainment-bg.jpg)
- **Client Components**: Use `"use client"` directive for interactive features
- **State Management**: React hooks (useState) for booking flow state
- **Authentication**: JWT tokens with bcrypt for password hashing
- **Database**: Run `pnpm db:generate` after schema changes
- **Testing**: Jest configuration with jsdom environment for React components
- **Path Aliases**: Use `@/` for imports from project root