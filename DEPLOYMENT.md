# LocaNoche Payment & Ticketing System - Deployment Guide

## 🚀 Complete Payment Flow Overview

The system implements a fully automated ticketing system with the following flow:

1. **Customer selects tickets** on `/tickets` page
2. **Fills customer information** using CustomerForm component
3. **Payment is created** via N8N workflow that calls VivaPayments API
4. **Customer is redirected** to VivaPayments checkout
5. **After successful payment**, customer returns to `/success` page
6. **Webhook processes payment** and generates tickets with QR codes
7. **Email is sent** to customer with tickets
8. **Database is updated** with booking and ticket records

## 📋 Prerequisites

- Vercel account with project set up
- N8N Cloud account (https://app.n8n.cloud)
- VivaPayments merchant account
- PostgreSQL database (Supabase/Neon/etc)
- Gmail account with app password for sending emails

## 🔧 Step-by-Step Deployment

### 1. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with initial data
npm run db:seed
```

### 2. N8N Workflow Setup

#### Import Workflows:

1. Log into N8N Cloud (https://app.n8n.cloud)
2. Go to **Workflows** → **Import from file**
3. Import these workflow files:
   - `n8n-workflows/event1-updated-workflow.json`
   - `n8n-workflows/event2-updated-workflow.json` (create similar to event1)
   - `n8n-workflows/payment-success-workflow.json`

#### Configure N8N Credentials:

1. **VivaPayments OAuth2** (Name: `viva_payments_oauth`):
   ```
   Grant Type: Client Credentials
   Access Token URL: https://api.vivapayments.com/connect/token
   Client ID: [Your Viva API Key]
   Client Secret: [Your Viva API Secret]
   ```

2. **SMTP Email** (Name: `smtp_gmail`):
   ```
   Host: smtp.gmail.com
   Port: 587
   Security: TLS
   User: tickets@locanoche.com
   Password: [Your Gmail App Password]
   ```

#### Activate Workflows:

1. Open each workflow
2. Click the "Active" toggle to enable
3. Copy the webhook URLs:
   - Event 1: `https://[your-n8n-instance].app.n8n.cloud/webhook/loca-noche-event1-payment`
   - Event 2: `https://[your-n8n-instance].app.n8n.cloud/webhook/loca-noche-event2-payment`
   - Success: `https://[your-n8n-instance].app.n8n.cloud/webhook/loca-noche-payment-success`

### 3. Environment Variables (Vercel)

Go to your Vercel project settings → Environment Variables and add:

```bash
# Database
DATABASE_URL="postgresql://[connection-string]"

# Authentication
JWT_SECRET="[generate-random-32-char-string]"
NEXTAUTH_SECRET="[generate-random-32-char-string]"

# N8N Webhooks (from step 2)
N8N_EVENT1_WEBHOOK_URL="https://[your-instance].app.n8n.cloud/webhook/loca-noche-event1-payment"
N8N_EVENT2_WEBHOOK_URL="https://[your-instance].app.n8n.cloud/webhook/loca-noche-event2-payment"
N8N_SUCCESS_WEBHOOK_URL="https://[your-instance].app.n8n.cloud/webhook/loca-noche-payment-success"

# Email Service
EMAIL_SERVICE_HOST="smtp.gmail.com"
EMAIL_SERVICE_PORT="587"
EMAIL_SERVICE_USER="tickets@locanoche.com"
EMAIL_SERVICE_PASS="[gmail-app-password]"

# VivaPayments Production
VIVA_API_URL="https://api.vivapayments.com"
VIVA_API_KEY="[your-viva-api-key]"
VIVA_API_SECRET="[your-viva-api-secret]"
VIVA_MERCHANT_ID="[your-merchant-id]"
VIVA_SOURCE_CODE_EVENT1="1309"
VIVA_SOURCE_CODE_EVENT2="5711"

# Application URLs
NEXT_PUBLIC_APP_URL="https://locanoche.com"
NEXT_PUBLIC_API_URL="https://locanoche.com/api"
```

### 4. VivaPayments Configuration

1. Log into VivaPayments Dashboard
2. Go to **Settings** → **API Access**
3. Create/configure payment sources:
   - Event 1: Source Code `1309`
   - Event 2: Source Code `5711`
4. Set webhook URLs:
   - Success URL: `https://locanoche.com/success`
   - Failure URL: `https://locanoche.com/failure`
   - Webhook URL: `https://locanoche.com/api/payments/webhook`

### 5. Deploy to Vercel

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Deploy to production
vercel --prod

# Or use git push if connected to GitHub
git add .
git commit -m "Deploy payment and ticketing system"
git push origin master
```

## 🧪 Testing the Complete Flow

### Test Payment Flow:

1. Go to `https://locanoche.com/tickets`
2. Select tickets for Event 1 or Event 2
3. Click "Continue" and fill customer information
4. You'll be redirected to VivaPayments
5. Use test card: `4111 1111 1111 1111` (any CVV, future expiry)
6. After payment, check:
   - Success page shows confirmation
   - Email is received with QR code tickets
   - Database has booking record

### Verify Webhook Processing:

Check N8N execution logs:
1. Go to N8N → Workflows
2. Click on workflow → Executions
3. Check for successful executions

### Database Verification:

```sql
-- Check bookings
SELECT * FROM "Booking" ORDER BY "createdAt" DESC LIMIT 10;

-- Check tickets
SELECT * FROM "Ticket" WHERE "bookingId" = '[booking-id]';
```

## 🔍 Troubleshooting

### Common Issues:

1. **Payment creation fails**
   - Check N8N webhook URL is correct
   - Verify VivaPayments credentials
   - Check N8N workflow is active

2. **No redirect after payment**
   - Verify success/failure URLs in VivaPayments
   - Check URL parameters are being passed

3. **Tickets not received**
   - Check email credentials
   - Verify N8N email node configuration
   - Check spam folder

4. **QR codes not generating**
   - Ensure QRCode package is installed
   - Check N8N workflow execution logs

## 📊 Monitoring

### Key Metrics to Monitor:

- N8N workflow execution success rate
- Payment conversion rate
- Email delivery rate
- Database query performance

### Recommended Tools:

- Vercel Analytics for performance
- N8N execution logs for workflow monitoring
- Database query logs for optimization
- Email service logs for delivery tracking

## 🔐 Security Checklist

- [ ] All environment variables are set in Vercel (not committed to code)
- [ ] Database has proper access controls
- [ ] JWT secrets are strong and unique
- [ ] Email credentials use app passwords (not main password)
- [ ] VivaPayments is in production mode (not demo)
- [ ] Webhook endpoints validate incoming data
- [ ] QR codes contain minimal sensitive information

## 📞 Support Contacts

- **Technical Issues**: dev@locanoche.com
- **Payment Issues**: payments@locanoche.com
- **N8N Support**: https://community.n8n.io
- **VivaPayments**: https://developer.vivapayments.com

## 🎉 Final Checklist

- [ ] Database migrated and seeded
- [ ] N8N workflows imported and active
- [ ] Environment variables configured in Vercel
- [ ] VivaPayments webhooks configured
- [ ] Test payment completed successfully
- [ ] Email with QR tickets received
- [ ] Production deployment verified

Once all items are checked, your payment and ticketing system is fully operational!