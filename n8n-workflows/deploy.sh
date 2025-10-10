#!/bin/bash

# LocaNoche N8N Workflows Deployment Script

echo "🚀 Deploying LocaNoche N8N Workflows..."

# Configuration
N8N_INSTANCE_URL="${N8N_INSTANCE_URL:-https://your-n8n-instance.com}"
N8N_API_KEY="${N8N_API_KEY:-your-n8n-api-key}"

# Check if N8N instance URL is provided
if [ "$N8N_INSTANCE_URL" = "https://your-n8n-instance.com" ]; then
    echo "❌ Please set your N8N instance URL:"
    echo "   export N8N_INSTANCE_URL=https://your-n8n-instance.com"
    exit 1
fi

# Check if N8N API key is provided
if [ "$N8N_API_KEY" = "your-n8n-api-key" ]; then
    echo "❌ Please set your N8N API key:"
    echo "   export N8N_API_KEY=your-n8n-api-key"
    exit 1
fi

echo "📡 Deploying to: $N8N_INSTANCE_URL"

# Function to import workflow
import_workflow() {
    local file=$1
    local name=$2

    echo "📋 Importing workflow: $name"

    response=$(curl -X POST \
        "$N8N_INSTANCE_URL/api/v1/workflows" \
        -H "Authorization: Bearer $N8N_API_KEY" \
        -H "Content-Type: application/json" \
        -d @"$file")

    if echo "$response" | grep -q '"id"'; then
        workflow_id=$(echo "$response" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
        echo "✅ Successfully imported: $name (ID: $workflow_id)"

        # Activate the workflow
        echo "🔄 Activating workflow..."
        activate_response=$(curl -X POST \
            "$N8N_INSTANCE_URL/api/v1/workflows/$workflow_id/activate" \
            -H "Authorization: Bearer $N8N_API_KEY")

        if echo "$activate_response" | grep -q '"data":true'; then
            echo "✅ Workflow activated: $name"
        else
            echo "⚠️  Failed to activate workflow. Please activate manually in N8N UI."
        fi
    else
        echo "❌ Failed to import: $name"
        echo "   Response: $response"
    fi
    echo ""
}

# Import Event 1 Workflow
import_workflow "event1-minus-one-payment.json" "Event 1 - Minus One Payment"

# Import Event 2 Workflow
import_workflow "event2-giannis-margaris-payment.json" "Event 2 - Giannis Margaris Payment"

echo "🎉 Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Configure credentials in N8N:"
echo "   - VivaPayments OAuth"
echo "   - VivaPayments Token (Header Auth)"
echo "   - SMTP Email"
echo ""
echo "2. Update environment variables in your .env file:"
echo "   N8N_EVENT1_WEBHOOK_URL=$N8N_INSTANCE_URL/webhook/loca-noche-event1-payment"
echo "   N8N_EVENT2_WEBHOOK_URL=$N8N_INSTANCE_URL/webhook/loca-noche-event2-payment"
echo ""
echo "3. Configure VivaPayments webhooks:"
echo "   Event 1 Success: $N8N_INSTANCE_URL/webhook/loca-noche-event1-webhook"
echo "   Event 2 Success: $N8N_INSTANCE_URL/webhook/loca-noche-event2-webhook"
echo ""
echo "4. Test the payment flow on your website"