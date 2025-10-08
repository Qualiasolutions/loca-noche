# Payment Flow Testing Guide

This document outlines how to test the enhanced payment system for Loca Noche.

## Overview

The payment system has been enhanced with:
- Robust error handling and fallback mechanisms
- Multiple payment verification methods
- Reliable email delivery system
- Enhanced webhook processing
- Real-time monitoring dashboard

## Testing Checklist

### 1. Environment Setup

Before testing, ensure you have configured the following environment variables:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/locanoche?schema=public"

# N8N Webhooks
N8N_EVENT1_WEBHOOK_URL="https://your-n8n-instance.com/webhook/loca-noche-event1-payment"
N8N_EVENT2_WEBHOOK_URL="https://your-n8n-instance.com/webhook/loca-noche-event2-payment"

# Email Service
EMAIL_SERVICE_HOST="smtp.gmail.com"
EMAIL_SERVICE_PORT="587"
EMAIL_SERVICE_USER="your-email@gmail.com"
EMAIL_SERVICE_PASS="your-app-password"

# Viva Payments
VIVA_API_URL="https://demo-api.vivapayments.com"
VIVA_API_KEY="your-viva-api-key"
VIVA_API_SECRET="your-viva-api-secret"
VIVA_MERCHANT_ID="your-viva-merchant-id"
VIVA_SOURCE_CODE="your-viva-source-code"
```

### 2. Health Check Testing

Test the health monitoring system:

```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Expected response structure:
{
  "status": "healthy|degraded|unhealthy",
  "timestamp": "2024-XX-XX...",
  "services": {
    "database": { "status": "...", "lastChecked": "..." },
    "email": { "status": "...", "lastChecked": "..." },
    "n8n": { "status": "...", "lastChecked": "..." },
    "vivaPayments": { "status": "...", "lastChecked": "..." }
  },
  "errors": []
}
```

### 3. API Endpoint Testing

#### Events API
```bash
# Test events endpoint
curl "http://localhost:3000/api/events?category=FESTIVAL&status=PUBLISHED"

# Should return events or mock data if database is not connected
```

#### Payment Status API
```bash
# Test payment status with sample order ID
curl http://localhost:3000/api/payments/status/test-order-123

# Should handle missing order gracefully and return appropriate status
```

#### Email Service API
```bash
# Test email sending (requires email configuration)
curl -X POST http://localhost:3000/api/emails/send-ticket \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "test-123",
    "customerEmail": "test@example.com",
    "customerName": "Test Customer",
    "totalAmount": 15.00,
    "totalQuantity": 2,
    "adultTickets": 1,
    "childTickets": 1
  }'
```

### 4. Payment Flow Testing

#### Success Page Testing
1. Navigate to `/success` with various URL parameter combinations:
   - Complete parameters: `?orderId=123&customerEmail=test@example.com&customerName=Test&totalAmount=15`
   - Missing parameters: `?orderId=123` (should handle gracefully)
   - No parameters: (should show error state)

2. Verify payment status polling works correctly
3. Check console logs for detailed debugging information

#### Webhook Processing Testing
1. Test the webhook endpoint with sample Viva Payments data:
```bash
curl -X POST http://localhost:3000/api/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "EventTypeId": 1848,
    "EventData": {
      "OrderCode": "test-order-123"
    }
  }'
```

2. Verify webhook forwarding to N8N
3. Check email sending functionality
4. Monitor database updates

#### Failure Scenarios
1. Test with invalid order IDs
2. Test with missing customer data
3. Test webhook failures
4. Test email service failures
5. Test database connectivity issues

### 5. Monitoring Dashboard

Access the payment monitoring dashboard:
- URL: `/admin/payment-monitoring`
- Check real-time status of all services
- Verify error handling and alerting
- Test manual refresh functionality

### 6. End-to-End Testing

#### Complete Payment Flow
1. Start with ticket selection on `/tickets`
2. Complete the booking process
3. Proceed to payment via N8N/Viva Payments
4. Verify success page displays correctly
5. Confirm email receipts are sent
6. Check webhook processing completes
7. Verify database records are updated

#### Error Recovery Testing
1. Simulate payment failures
2. Test webhook retry mechanisms
3. Verify email notifications for failed payments
4. Check database consistency

### 7. Performance Testing

#### Load Testing
```bash
# Test multiple concurrent requests
for i in {1..10}; do
  curl "http://localhost:3000/api/events?category=FESTIVAL" &
done
wait
```

#### Response Time Monitoring
- Monitor API response times
- Check database query performance
- Verify email sending performance

### 8. Security Testing

#### Input Validation
- Test with malicious input in API endpoints
- Verify SQL injection protection
- Test XSS prevention
- Check CSRF protection

#### Authentication/Authorization
- Test admin-only endpoints
- Verify webhook security
- Check API rate limiting

### 9. Browser Compatibility Testing

Test the payment flow in:
- Chrome (latest version)
- Firefox (latest version)
- Safari (latest version)
- Mobile browsers (iOS Safari, Chrome Mobile)

### 10. Error Logging and Debugging

1. Check browser console for JavaScript errors
2. Monitor server logs for API errors
3. Verify email delivery logs
4. Check N8N workflow execution logs

## Troubleshooting Guide

### Common Issues

#### Payment Verification Fails
- Check Viva Payments API credentials
- Verify webhook URL configurations
- Check database connectivity
- Review N8N workflow logs

#### Email Delivery Issues
- Verify email service credentials
- Check SMTP server connectivity
- Review email content for formatting issues
- Check spam filters

#### Database Connection Issues
- Verify DATABASE_URL format
- Check database server status
- Review Prisma configuration
- Test with `npx prisma db push`

#### N8N Workflow Issues
- Check N8N instance status
- Verify webhook URLs are accessible
- Review workflow error handling
- Test webhook timeouts

### Monitoring and Alerting

1. Set up regular health checks
2. Monitor error rates
3. Track payment success rates
4. Monitor email delivery rates
5. Set up alerts for critical failures

## Test Results Template

### Test Environment
- Date: ___________
- Environment: [Development/Staging/Production]
- Browser: ___________
- Database Status: ___________

### Test Results

| Test Case | Status | Notes |
|-----------|--------|-------|
| Events API | ✅/❌ | |
| Payment Status API | ✅/❌ | |
| Success Page | ✅/❌ | |
| Webhook Processing | ✅/❌ | |
| Email Sending | ✅/❌ | |
| Health Monitoring | ✅/❌ | |
| Error Handling | ✅/❌ | |
| Performance | ✅/❌ | |

### Issues Found

1. Issue description: _________________________
   Severity: [Low/Medium/High]
   Resolution: _________________________

2. Issue description: _________________________
   Severity: [Low/Medium/High]
   Resolution: _________________________

### Recommendations

1. _________________________
2. _________________________
3. _________________________