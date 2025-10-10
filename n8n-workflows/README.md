# LocaNoche N8N Workflows

## 📋 Overview

N8N workflows automate ticket generation and email delivery for the LocaNoche Oktoberfest events.

**N8N Instance:** https://tasos8.app.n8n.cloud

## ✅ Active Workflows

### 1. Payment Success & QR Generation
**Workflow ID:** `xdREda0sA8gNLabv`  
**Webhook:** `https://tasos8.app.n8n.cloud/webhook/loca-noche-payment-success`  
**Status:** ✅ ACTIVE and WORKING

**Purpose:**
- Receives Viva payment success notifications
- Generates unique QR codes for each ticket
- Sends beautiful HTML email with tickets via Brevo
- Sends admin notification

**Trigger:** Viva Payments webhook (configured in Viva dashboard)

### 2. Event 1 - Minus One Payment (Reference)
**Workflow ID:** `W16cN6mrlyKVJ7g4`  
**Webhook:** `https://tasos8.app.n8n.cloud/webhook/loca-noche-event1-payment`  
**Status:** Not used (payment creation done in app)

### 3. Event 2 - Giannis Margaris Payment (Reference)
**Workflow ID:** `OlOk9UfSvEKUveFi`  
**Webhook:** `https://tasos8.app.n8n.cloud/webhook/loca-noche-event2-payment`  
**Status:** Not used (payment creation done in app)

## 🔧 Current Architecture

**Payment Creation:** Direct Viva API (in Next.js app)
- Faster and more reliable
- No n8n dependency for payment creation
- Uses `lib/payment/n8n-payment.ts` → `vivaPaymentService`

**Payment Success:** N8N Workflow (post-payment automation)
- QR code generation
- Email delivery via Brevo
- Admin notifications
- Database logging (optional)

## 📝 Workflow Files

- `payment-success-workflow.json` - **Main active workflow** for QR & email
- `event1-minus-one-payment.json` - Reference workflow (Event 1)
- `event2-giannis-margaris-payment.json` - Reference workflow (Event 2)

## 🚀 Setup Instructions

### Prerequisites
1. N8N Cloud account: https://n8n.io
2. Viva Payments account with API access
3. Brevo account for email sending

### Import Workflow

1. Login to N8N: https://tasos8.app.n8n.cloud
2. Go to Workflows → Import from File
3. Upload `payment-success-workflow.json`
4. Configure Brevo credentials (already set)
5. Activate the workflow

### Configure Viva Webhook

**✅ Already configured in Viva dashboard:**

1. Viva Dashboard → Settings → API Access → Webhooks
2. Webhook URL: `https://tasos8.app.n8n.cloud/webhook/loca-noche-payment-success`
3. Event: **Transaction Payment Created** (EventTypeId: 1796)
4. Status: Active

### Environment Variables

Set these in Vercel:
```bash
N8N_SUCCESS_WEBHOOK_URL=https://tasos8.app.n8n.cloud/webhook/loca-noche-payment-success
```

## 🧪 Testing

### Test N8N Webhook Directly
```bash
curl "https://tasos8.app.n8n.cloud/webhook/loca-noche-payment-success"
```

Expected response:
```json
{
  "success": true,
  "processed": true,
  "status": "success",
  "message": "Payment confirmed and tickets issued."
}
```

### Test Complete Flow

1. Create payment via API:
   ```bash
   curl -X POST "https://loca-noche.vercel.app/api/payments/n8n" \
     -H "Content-Type: application/json" \
     -d '{
       "eventId": "1",
       "ticketSelections": [{"ticketTypeId": "1", "ticketTypeName": "Adult", "quantity": 1, "price": 10}],
       "total": 10,
       "customerData": {"email": "your@email.com", "firstName": "Test", "lastName": "User"}
     }'
   ```

2. Complete payment on Viva checkout page

3. Check email for QR code tickets

## 📊 Monitoring

### Check N8N Executions
```bash
# Via MCP tools in this repo
mcp_n8n-mcp_n8n_list_executions(workflowId: "xdREda0sA8gNLabv")
```

### Check Logs
- N8N Dashboard → Executions tab
- Vercel Dashboard → Deployments → View Function Logs
- Email delivery logs in Brevo dashboard

## 🔐 Credentials

### Required N8N Credentials

**Brevo (Email):**
- Type: Brevo API
- API Key: Configured in n8n
- Credential Name: "Brevo account 2"

### Viva Configuration

**In Application (not n8n):**
- Client ID, Secret managed via Vercel env vars
- Direct API integration in Next.js

## 🐛 Troubleshooting

### Emails Not Sent
1. Check n8n execution logs
2. Verify Brevo API key is valid
3. Check spam folder
4. Verify sender email: info@locanoche.com

### QR Codes Not Generated
1. Check n8n workflow is active
2. Verify webhook execution triggered
3. Check execution logs for JavaScript errors

### Webhook Not Triggered
1. Verify Viva webhook is configured and active
2. Test webhook manually
3. Check Viva transaction logs

## 📚 Related Documentation

- [DEPLOYMENT.md](../DEPLOYMENT.md) - Deployment guide
- [CLAUDE.md](../CLAUDE.md) - Development guide
- [Viva API Docs](https://developer.viva.com/smart-checkout/)
- [N8N Docs](https://docs.n8n.io/)

## ✨ Recent Updates (October 2025)

- ✅ Fixed payment creation flow (now uses direct Viva API)
- ✅ Verified success webhook working
- ✅ Enhanced QR code generation
- ✅ Improved email templates with event branding
- ✅ Added admin notifications
- ✅ Optimized for both Event 1 and Event 2

**Status:** Production ready and fully operational! 🚀
