# LocaNoche N8N Workflows Setup

This directory contains the N8N workflows for processing payments and generating tickets for the LocaNoche Oktoberfest events.

## Workflows

### 1. Event 1 - Minus One Payment Processing (`event1-minus-one-payment.json`)
- **Webhook Endpoint**: `/webhook/loca-noche-event1-payment`
- **Payment Code**: 1309
- **Event**: Oktoberfest - Minus One (October 11, 2024)

### 2. Event 2 - Giannis Margaris Payment Processing (`event2-giannis-margaris-payment.json`)
- **Webhook Endpoint**: `/webhook/loca-noche-event2-payment`
- **Payment Code**: 5711
- **Event**: Oktoberfest - Giannis Margaris (October 12, 2024)

## Setup Instructions

### 1. Import Workflows into N8N

1. Log into your N8N instance
2. Go to **Workflows** > **Import from file**
3. Upload each JSON file separately
4. Save each workflow

### 2. Configure Credentials

You need to set up the following credentials in N8N:

#### VivaPayments OAuth Credential
1. Go to **Credentials** > **Add credential**
2. Select **OAuth2 API**
3. Configure with:
   - **Grant Type**: Client Credentials
   - **Access Token URL**: `https://demo-api.vivapayments.com/connect/token`
   - **Client ID**: Your VivaPayments API Key
   - **Client Secret**: Your VivaPayments API Secret
   - **Auth URI**: `https://demo.vivapayments.com/web/login`
   - **Token Name**: Viva Payments OAuth

#### VivaPayments Token Credential (HTTP Header Auth)
1. Go to **Credentials** > **Add credential**
2. Select **Header Auth**
3. Configure with:
   - **Name**: Authorization
   - **Value**: Bearer (will be dynamically set from OAuth token)
   - **Token Name**: Viva Payments Token

#### SMTP Email Credential
1. Go to **Credentials** > **Add credential**
2. Select **SMTP**
3. Configure with your email provider:
   - **Host**: e.g., `smtp.gmail.com`
   - **Port**: 587
   - **Security**: TLS
   - **User**: Your email address
   - **Password**: Your app password

### 3. Activate Webhooks

For each workflow:
1. Click on the webhook node
2. Copy the webhook URL
3. **Important**: Add `/webhook/` before the path in your N8N instance
   - Event 1: `https://your-n8n-instance.com/webhook/loca-noche-event1-payment`
   - Event 2: `https://your-n8n-instance.com/webhook/loca-noche-event2-payment`
4. Set up webhook URLs in VivaPayments dashboard:
   - Event 1 Success URL: `https://your-n8n-instance.com/webhook/loca-noche-event1-webhook`
   - Event 2 Success URL: `https://your-n8n-instance.com/webhook/loca-noche-event2-webhook`

### 4. Update Environment Variables

Add these to your `.env` file:

```bash
# N8N Webhook URLs
N8N_EVENT1_WEBHOOK_URL=https://your-n8n-instance.com/webhook/loca-noche-event1-payment
N8N_EVENT2_WEBHOOK_URL=https://your-n8n-instance.com/webhook/loca-noche-event2-payment

# VivaPayments (use production URLs for live)
VIVA_API_URL=https://demo-api.vivapayments.com
VIVA_API_KEY=your-viva-api-key
VIVA_API_SECRET=your-viva-api-secret
VIVA_MERCHANT_ID=your-viva-merchant-id
VIVA_SOURCE_CODE=your-viva-source-code

# Email Configuration
EMAIL_SERVICE_HOST=smtp.gmail.com
EMAIL_SERVICE_PORT=587
EMAIL_SERVICE_USER=your-email@gmail.com
EMAIL_SERVICE_PASS=your-app-password
```

### 5. Test the Workflows

1. Activate both workflows in N8N
2. Test payment flow on the website:
   - Go to `/tickets`
   - Select tickets for either event
   - Complete customer information
   - Proceed to payment
3. Check if:
   - VivaPayments order is created
   - Redirect to VivaPayments works
   - After successful payment, check if:
     - Webhook receives success notification
     - QR codes are generated
     - Email with tickets is sent

## Workflow Logic

### Payment Creation Flow
1. Webhook receives payment request with ticket details
2. OAuth token is obtained from VivaPayments
3. Payment order is created with:
   - Amount (in cents)
   - Event description
   - Source code (1309 or 5711)
   - Customer information
4. Payment URL is returned to frontend

### Payment Success Flow
1. VivaPayments sends webhook notification
2. Transaction is verified
3. Tickets with unique IDs are generated
4. QR codes are created for each ticket
5. Email is sent with:
   - Ticket details
   - QR codes for validation
   - Event information

## Troubleshooting

### Common Issues

1. **Webhook not triggered**
   - Check if workflow is active
   - Verify webhook URL matches exactly
   - Check N8N webhook test URL

2. **OAuth token fails**
   - Verify API credentials are correct
   - Check if demo/production URLs match
   - Ensure merchant ID is valid

3. **Payment order creation fails**
   - Verify source code (1309/5711) is correct
   - Check amount is in cents
   - Ensure all required fields are present

4. **Email not sent**
   - Check SMTP credentials
   - Verify email configuration
   - Check spam folder

5. **QR codes not generating**
   - Check QR code generation logic
   - Verify ticket data is valid
   - Test QR code API endpoint

## Production Deployment

For production:
1. Replace demo API URLs with production URLs:
   - `https://api.vivapayments.com` (instead of demo-api)
   - `https://www.vivapayments.com` (instead of demo.vivapayments.com)

2. Update VivaPayments dashboard to production merchant account

3. Ensure webhook URLs are accessible from VivaPayments

4. Test thoroughly with small amounts before going live

## Security Considerations

1. Never commit credentials to version control
2. Use environment variables for sensitive data
3. Validate all incoming webhook data
4. Implement rate limiting on webhooks
5. Use HTTPS for all webhook URLs
6. Regularly rotate API keys and secrets