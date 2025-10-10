import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Test the N8N webhook
  const testData = {
    quantity: 1,
    ticketType: 'adult',
    preCalculated: true,
    totalAmount: 10,
    totalQuantity: 1,
    description: 'Test ticket purchase',
    customerData: {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      phone: '+35799123456'
    }
  }

  try {
    const webhookUrl = process.env.N8N_EVENT1_WEBHOOK_URL || 'https://tasos8.app.n8n.cloud/webhook/loca-event1-payment-v2'

    console.log('Testing N8N webhook:', webhookUrl)

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    })

    const responseText = await response.text()
    let responseData

    try {
      responseData = JSON.parse(responseText)
    } catch {
      responseData = { rawResponse: responseText }
    }

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      webhookUrl,
      testData,
      response: responseData
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      webhookUrl: process.env.N8N_EVENT1_WEBHOOK_URL || 'https://tasos8.app.n8n.cloud/webhook/loca-event1-payment-v2'
    })
  }
}