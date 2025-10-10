# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LocaNoche is a Next.js-based event ticketing platform for Oktoberfest events in Cyprus. The system integrates with VivaPayments for payment processing and N8N for automated ticket generation and email delivery.

**Live URL:** https://loca-noche.vercel.app

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
```

### Deployment
```bash
vercel                 # Deploy to preview
vercel --prod          # Deploy to production
vercel env pull        # Pull environment variables
vercel logs URL --since 5m  # Check recent logs
```

## Architecture

### Complete Payment Flow (✅ WORKING)

```
Customer (Website)
    ↓
1. Select tickets on /tickets
    ↓
2. POST /api/payments/n8n
    ↓
3. Direct Viva API call (lib/payment/n8n-payment.ts)
    ↓
4. Viva creates payment order
    ↓
5. Return payment URL → Customer redirected
    ↓
6. Customer completes payment on Viva
    ↓
7. Viva webhook → https://tasos8.app.n8n.cloud/webhook/loca-noche-payment-success
    ↓
8. N8N generates QR codes
    ↓
9. N8N sends email via Brevo (info@locanoche.com)
    ↓
10. Customer receives tickets! 🎫
```

### Key Services Integration

**1. Viva Payments (Payment Gateway)**
- API: `https://api.vivapayments.com`
- OAuth: `https://accounts.vivapayments.com/connect/token`
- Event 1 Source Code: `1309` (Minus One)
- Event 2 Source Code: `5711` (Giannis Margaris)

**2. N8N Workflows (Automation)**
- Instance: `https://tasos8.app.n8n.cloud`
- Success Webhook: `/webhook/loca-noche-payment-success` ✅ ACTIVE
- Handles: QR generation, email sending, ticket delivery

**3. Brevo (Email Service)**
- Sender: `info@locanoche.com`
- Sends tickets with QR codes automatically

### Directory Structure

- **`app/`** - Next.js App Router
  - `api/payments/n8n/` - Main payment creation endpoint
  - `api/payments/webhook/` - Viva webhook handler (forwards to n8n)
  - `tickets/` - Ticket selection page
  - `success/` - Payment success page

- **`lib/payment/`** - Payment services
  - `n8n-payment.ts` - **Main payment service** (uses Viva API directly)
  - `viva-payment.ts` - Viva Payments API wrapper

- **`components/booking/`** - Booking flow components
  - `CustomerForm.tsx` - Customer data collection
  - `TicketSelector.tsx` - Ticket selection interface
  - `PaymentProcessingModal.tsx` - Payment processing UI

- **`n8n-workflows/`** - N8N workflow definitions
  - `payment-success-workflow.json` - QR & email automation (ACTIVE)
  - `event1-minus-one-payment.json` - Reference only
  - `event2-giannis-margaris-payment.json` - Reference only

- **`prisma/`** - Database schema and migrations

## Environment Variables

### Required in Vercel

```bash
# Viva Payments
VIVA_CLIENT_ID=e9qc8r8d3jny5fznul8cezwsascfo2l3aqq2c6f105u47.apps.vivapayments.com
VIVA_CLIENT_SECRET=<from Viva dashboard>
VIVA_API_URL=https://api.vivapayments.com
VIVA_API_KEY=<from Viva dashboard>
VIVA_MERCHANT_ID=a60c00c4-5589-4ed4-b94c-d15136054058
VIVA_SOURCE_CODE=1309
VIVA_SOURCE_CODE_EVENT1=1309
VIVA_SOURCE_CODE_EVENT2=5711

# N8N Webhooks
N8N_SUCCESS_WEBHOOK_URL=https://tasos8.app.n8n.cloud/webhook/loca-noche-payment-success
N8N_EVENT1_WEBHOOK_URL=https://tasos8.app.n8n.cloud/webhook/loca-noche-event1-payment
N8N_EVENT2_WEBHOOK_URL=https://tasos8.app.n8n.cloud/webhook/loca-noche-event2-payment

# Database
DATABASE_URL=<PostgreSQL connection string>

# Email (Brevo)
BREVO_API_KEY=<from Brevo dashboard>
EMAIL_FROM=info@locanoche.com
EMAIL_FROM_NAME=Loca Noche

# App URLs
NEXT_PUBLIC_APP_URL=https://loca-noche.vercel.app
NEXT_PUBLIC_API_URL=https://loca-noche.vercel.app/api

# Auth
JWT_SECRET=<random secure string>
```

### Viva Webhook Configuration (Dashboard)

**Already configured in Viva dashboard:**
- Webhook URL: `https://tasos8.app.n8n.cloud/webhook/loca-noche-payment-success`
- Event: Transaction Payment Created (EventTypeId: 1796)
- Status: ✅ Active

## Payment Implementation Details

### Current Working Setup (October 2025)

**Payment Creation:**
- App calls Viva API **directly** (not through n8n webhooks)
- Uses `lib/payment/n8n-payment.ts` → `vivaPaymentService`
- Credentials: Smart Checkout OAuth2 (client_credentials grant)

**Payment Success:**
- Viva webhook configured to call n8n
- n8n workflow generates QR codes
- n8n sends email via Brevo with tickets

**Why this architecture:**
- N8N payment creation webhooks had registration issues
- Direct Viva API is more reliable and faster
- N8N excels at post-payment automation (QR, email)

### Event Configuration

**Event 1: Oktoberfest - Minus One**
- Event ID: `1`
- Source Code: `1309`
- Pricing: €10 adult, €5 child

**Event 2: Oktoberfest - Giannis Margaris**
- Event ID: `2`
- Source Code: `5711`
- Pricing: €10 adult, €5 child

## Testing

### Manual Testing Checklist

1. ✅ **Payment Creation Test:**
   ```bash
   curl -X POST "https://loca-noche.vercel.app/api/payments/n8n" \
     -H "Content-Type: application/json" \
     -d '{
       "eventId": "1",
       "ticketSelections": [{"ticketTypeId": "1", "ticketTypeName": "Adult", "quantity": 1, "price": 10}],
       "total": 10,
       "customerData": {"email": "test@test.com", "firstName": "Test", "lastName": "User"}
     }'
   ```
   Expected: `{"success": true, "paymentUrl": "https://www.vivapayments.com/web/checkout?ref=..."}`

2. ✅ **N8N Webhook Test:**
   ```bash
   curl "https://tasos8.app.n8n.cloud/webhook/loca-noche-payment-success"
   ```
   Expected: `{"success": true, "processed": true, "status": "success"}`

3. ✅ **Complete Flow Test:**
   - Visit: https://loca-noche.vercel.app/tickets
   - Select tickets
   - Fill in email
   - Complete payment on Viva
   - Receive QR code tickets via email

### E2E Tests
```bash
npx playwright test e2e/booking-flow.spec.ts
```

## Troubleshooting

### Payment Creation Fails
1. Check Viva credentials in Vercel env vars
2. Verify `VIVA_CLIENT_ID` and `VIVA_CLIENT_SECRET` are correct
3. Test credentials directly:
   ```bash
   curl -X POST 'https://accounts.vivapayments.com/connect/token' \
     -d 'grant_type=client_credentials&client_id=<ID>&client_secret=<SECRET>'
   ```

### QR Codes Not Received
1. Check n8n workflow is active: https://tasos8.app.n8n.cloud
2. Verify Viva webhook is configured in dashboard
3. Check n8n execution logs for errors
4. Verify Brevo API key is valid

### Source Code Errors
- Ensure `VIVA_SOURCE_CODE_EVENT1=1309` (no newlines!)
- Ensure `VIVA_SOURCE_CODE_EVENT2=5711` (no newlines!)
- Use `printf` not `echo` when setting env vars

## Deployment Process

### Standard Deployment
```bash
# Make code changes
git add .
git commit -m "Description of changes"
git push origin master

# Deploy to production
vercel --prod
```

### Update Environment Variables
```bash
# Add/update variable
vercel env add VAR_NAME production

# Remove variable
vercel env rm VAR_NAME production --yes

# List all variables
vercel env ls
```

### Quick Deploy After Env Changes
```bash
vercel --prod --yes
```

## Security Notes

- Never commit `.env*` files to git
- Viva credentials are encrypted in Vercel
- JWT secret should be 32+ character random string
- QR codes contain ticket IDs only (no sensitive data)
- All API endpoints validate input data

## Database Schema

Key models in `prisma/schema.prisma`:
- `Event` - Event details, dates, venue
- `TicketType` - Pricing tiers
- `Booking` - Customer bookings with status
- `Ticket` - Individual tickets with QR codes
- `Payment` - Payment records with Viva gateway data

## Recent Fixes (October 2025)

### Payment System Overhaul
- ✅ Bypassed broken n8n payment webhooks
- ✅ Implemented direct Viva API integration
- ✅ Fixed OAuth authentication issues
- ✅ Fixed source code newline bug
- ✅ Enhanced error logging and handling
- ✅ Verified n8n success webhook working
- ✅ Confirmed Viva webhook configured correctly

### Working Configuration
- Payment creation: App → Viva API (direct)
- Payment success: Viva → n8n → QR generation → Email
- All environment variables properly set (no newlines)
- Both Event 1 and Event 2 tested and working

## Support

- Viva Payments Support: support@vivapayments.com
- N8N Instance: https://tasos8.app.n8n.cloud
- Production Site: https://loca-noche.vercel.app
