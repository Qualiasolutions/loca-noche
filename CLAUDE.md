# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev              # Start development server (http://localhost:3000)
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run Next.js linting

# Database (Prisma + SQLite)
npm run db:generate     # Generate Prisma client after schema changes
npm run db:push         # Push schema changes to database
npm run db:migrate      # Run database migrations
npm run db:studio       # Open Prisma Studio GUI
npm run db:seed         # Seed database with sample events (tsx prisma/seed.ts)

# Testing
npm run test            # Run Jest unit tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Generate coverage report (80% threshold required)

# Run specific test
npm test -- --testNamePattern="should validate booking"
npm test -- app/api/bookings/__tests__/route.test.ts

# Deployment
vercel --prod           # Deploy to Vercel production
```

## Architecture

**Event Ticketing Platform** built with Next.js 14 App Router for Cyprus's Loca Noche Entertainment company. Features complete payment integration with VivaPayments and comprehensive event management.

### Project Structure
```
app/
├── api/                # RESTful API endpoints
│   ├── auth/          # JWT authentication (login, register)
│   ├── bookings/      # Booking management
│   ├── events/        # Event CRUD operations
│   ├── payments/      # Payment processing & webhooks
│   └── tickets/       # Ticket validation & QR codes
├── admin/             # Admin dashboard pages
├── tickets/           # Public ticket booking interface
├── success/           # Payment success page
└── failure/           # Payment failure page

components/
├── ui/                # shadcn/ui components (pre-built)
└── booking/           # Custom booking flow components

prisma/
├── schema.prisma      # Database schema definition
└── seed.ts           # Database seeding script
```

### Key Technologies
- **Runtime**: Next.js 14.2.16 with App Router, React 18
- **Database**: SQLite (dev) via Prisma ORM 6.16.1, PostgreSQL (prod)
- **UI Library**: shadcn/ui with Radix UI primitives, CVA for variants
- **Styling**: Tailwind CSS v4 + framer-motion animations
- **Forms**: react-hook-form + Zod validation
- **Auth**: JWT (jsonwebtoken) + bcryptjs hashing
- **Payments**: VivaPayments integration with webhook handling
- **Testing**: Jest + React Testing Library (80% coverage), Playwright E2E

### Database Schema Overview
The Prisma schema defines a comprehensive ticketing system:
- **Users**: Multi-role system (CUSTOMER, ADMIN, ORGANIZER, STAFF)
- **Events**: Categories, status tracking, venue association
- **Venues**: Sections with seat mapping capabilities
- **Bookings**: Complete lifecycle from PENDING to CONFIRMED/REFUNDED
- **Payments**: Gateway integration, refund management
- **Tickets**: QR code generation, validation tracking

### API Endpoints Pattern
All API routes follow RESTful conventions in `app/api/`:
- Authentication: `/api/auth/[login|register]`
- Resources: `/api/[resource]/route.ts` for collection operations
- Individual: `/api/[resource]/[id]/route.ts` for specific items
- Webhooks: `/api/payments/webhook` for payment notifications

### Component Patterns
- **Client Components**: Mark with `"use client"` for interactivity
- **Server Components**: Default for data fetching and static content
- **UI Components**: Pre-configured shadcn components in `/components/ui/`
- **Import Alias**: Use `@/` for root imports (e.g., `@/lib/utils`)

#### Key Booking Components:
- **TicketSelector** (`/components/booking/TicketSelector.tsx`):
  - Handles mixed ticket selection with quantity controls
  - Supports adult/child ticket combinations
  - Real-time total calculation and purchase flow
  - Sends structured data to payment API

## Development Workflow

### Database Changes
1. Modify `prisma/schema.prisma`
2. Run `npm run db:generate` to update Prisma client
3. Run `npm run db:push` to apply changes to database
4. Update seed data if needed: `npm run db:seed`

### Testing Approach
- Unit tests in `__tests__/` directories
- Coverage requirement: 80% for all metrics
- E2E tests in `/e2e/` (Playwright, excluded from coverage)
- Run before commit: `npm run test && npm run lint`

### Payment Integration

**N8N + VivaPayments Integration**: Complete automation system with dual payment processing:

#### N8N Workflow Endpoints:
- **Event 1 (Minus One)**: `/webhook/loca-noche-event1-payment` (Payment Code: 1309)
- **Event 2 (Giannis Margaris)**: `/webhook/loca-noche-event2-payment` (Payment Code: 5711)

#### Payment Flow Architecture:
1. **Frontend**: `TicketSelector` component handles mixed ticket selection
2. **API**: `/api/payments/n8n` supports both mixed and legacy ticket formats
3. **N8N Service**: `lib/payment/n8n-payment.ts` manages webhook communication
4. **Workflows**: Automated Viva OAuth + payment order creation

#### Mixed Ticket Support:
- **New Format**: Sends `preCalculated: true` with `totalAmount` and `totalQuantity`
- **Legacy Format**: Single ticket type with `ticketType` and `quantity`
- **Backward Compatible**: N8N workflows handle both formats seamlessly

#### Environment Variables:
Required environment variables for payment processing and N8N integration:
- `N8N_EVENT1_WEBHOOK_URL`: Webhook endpoint for Event 1 payment processing
- `N8N_EVENT2_WEBHOOK_URL`: Webhook endpoint for Event 2 payment processing
- `VIVA_API_KEY`: VivaPayments API key
- `VIVA_CLIENT_ID`: VivaPayments OAuth client ID
- `VIVA_CLIENT_SECRET`: VivaPayments OAuth client secret
- `VIVA_MERCHANT_ID`: VivaPayments merchant identifier

#### Pricing Structure:
- Adult tickets: €10 each
- Child tickets: €5 each
- Mixed selections: Frontend calculates total, N8N uses pre-calculated amount

### Build Configuration
The `next.config.mjs` intentionally ignores TypeScript/ESLint errors during build for rapid development. Ensure code quality with:
- `npm run lint` before commits
- `npm run test:coverage` for test validation

### N8N Automation Workflows

The platform uses N8N for automated payment processing:

#### Workflow Structure (Both Events):
1. **Webhook Trigger**: Receives payment requests from frontend
2. **Viva OAuth**: Automatically obtains access token
3. **Payment Logic**: Handles both mixed and legacy ticket calculations
4. **Viva API**: Creates payment orders with correct amounts
5. **Response**: Returns payment URL and order details

#### Debugging Workflows:
- **Test Mixed Tickets**: Send `preCalculated: true` with `totalAmount`
- **Test Legacy**: Send `ticketType` and `quantity` only
- **Console Logs**: Check N8N execution logs for calculation details
- **Webhook URLs**: Both production webhooks are active and tested

#### MCP N8N Integration:
- Use `mcp__n8n-mcp__*` tools for workflow management
- Can update workflows programmatically via MCP tools
- Full validation and testing capabilities through MCP

## Important Guidelines

NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.