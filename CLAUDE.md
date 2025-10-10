# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LocaNoche is a Next.js-based event ticketing platform integrated with VivaPayments and N8N workflow automation. The system handles ticket bookings, payment processing, and automated email delivery with QR code tickets.

## Commands

### Development
```bash
npm run dev        # Start Next.js development server (port 3000)
npm run build      # Build production bundle
npm run start      # Start production server
npm run lint       # Run ESLint
```

### Database Management
```bash
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema changes to database
npm run db:migrate     # Run database migrations
npm run db:studio      # Open Prisma Studio GUI
npm run db:seed        # Seed database with initial data
```

### Testing
```bash
npm run test           # Run all Jest tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Generate coverage report
npx playwright test    # Run E2E tests
npx playwright test --ui  # Run E2E tests with UI
npx playwright test e2e/booking-flow.spec.ts  # Run specific E2E test
```

### Deployment
```bash
vercel             # Deploy to preview
vercel --prod      # Deploy to production
vercel env pull    # Pull environment variables
vercel logs https://www.locanoche.com --since 5m  # Check recent logs
```

## Architecture

### Core Payment Flow
The payment system integrates three key services:
1. **Next.js API** (`/api/payments/*`) - Handles frontend requests
2. **N8N Workflows** - Orchestrates payment creation and processing
3. **VivaPayments** - Processes actual payments

Flow sequence:
1. Customer selects tickets on `/tickets` → CustomerForm component
2. API endpoint `/api/payments/n8n` calls N8N webhook with ticket data
3. N8N workflow creates VivaPayments order and returns payment URL
4. Customer completes payment on VivaPayments
5. Success webhook (`/api/payments/webhook`) triggers ticket generation
6. N8N sends email with QR code tickets

### Directory Structure

- **`app/`** - Next.js App Router pages and API routes
  - `api/` - API endpoints for payments, admin, tickets
  - `admin/` - Admin dashboard pages
  - `tickets/` - Ticket selection and booking flow
  - `success/failure/` - Payment result pages

- **`components/`** - React components
  - `ui/` - shadcn/ui components
  - `CustomerForm.tsx` - Customer data collection
  - `PaymentButton.tsx` - Payment initiation

- **`lib/`** - Core business logic
  - `payment/` - Payment services (N8N, VivaPayments integration)
  - `email/` - Email service with templates
  - `tickets/` - Ticket generation and QR codes
  - `auth/` - JWT authentication

- **`prisma/`** - Database schema and migrations
- **`n8n-workflows/`** - N8N workflow JSON exports
- **`e2e/`** - Playwright E2E tests

### Key Integration Points

#### N8N Webhook Endpoints
Environment variables define webhook URLs:
- `N8N_EVENT1_WEBHOOK_URL` - Event 1 payment creation
- `N8N_EVENT2_WEBHOOK_URL` - Event 2 payment creation
- `N8N_SUCCESS_WEBHOOK_URL` - Payment success processing

#### Database Models (Prisma)
Main entities:
- `Event` - Event details with venue, dates, capacity
- `TicketType` - Pricing tiers for events
- `Booking` - Customer bookings with payment status
- `Ticket` - Individual tickets with QR codes
- `Payment` - Payment records with gateway responses

#### Payment Processing
- `lib/payment/n8n-payment.ts` - N8N webhook integration
- `lib/payment/payment-service.ts` - Payment orchestration
- `app/api/payments/n8n/route.ts` - API endpoint for N8N payments
- `app/api/payments/webhook/route.ts` - VivaPayments webhook handler

## Current Issues and Workarounds

### N8N Response Formatting
N8N workflows may return minimal response (`{orderCode: xxx}`) instead of full payment details. The system handles this by constructing the full response in `lib/payment/n8n-payment.ts:93-102`.

### Environment-Specific Configuration
- Production uses `https://www.locanoche.com`
- VivaPayments has different source codes for Event 1 (1309) and Event 2 (5711)
- Email credentials use Gmail app passwords (not main password)

## Testing Strategy

### Unit Tests
- Test payment service logic in `__tests__/`
- Mock external services (N8N, VivaPayments)
- Use Jest with React Testing Library

### E2E Tests
- `e2e/booking-flow.spec.ts` - Complete booking flow
- Tests payment redirect and success page
- Validates ticket generation

### Manual Testing Checklist
1. Select tickets on `/tickets` page
2. Fill customer form with test data
3. Use test card: `4111 1111 1111 1111`
4. Verify redirect to success page
5. Check N8N execution logs
6. Confirm email delivery with QR tickets

## Deployment Notes

### Vercel Deployment
- Environment variables must be set in Vercel dashboard
- Database migrations run automatically via `prisma generate` in build
- Static assets served from Vercel CDN

### N8N Workflow Activation
1. Import workflow JSON files to N8N Cloud
2. Configure credentials (VivaPayments OAuth2, SMTP)
3. Activate workflows (toggle "Active" switch)
4. Copy webhook URLs to Vercel environment variables

### Database Management
- Use Prisma Studio (`npm run db:studio`) for data inspection
- Migrations tracked in `prisma/migrations/`
- Seed data in `prisma/seed.ts`

## Security Considerations

- JWT tokens for admin authentication
- Payment webhooks validate source
- QR codes contain minimal data (ticket ID only)
- Customer data encrypted in transit
- Email credentials use app-specific passwords