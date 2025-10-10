// Test script for payment API - simulates N8N minimal response
const http = require('http');

// Create a mock N8N server that returns only orderCode
const mockN8NServer = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url.includes('/webhook/')) {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      console.log('Mock N8N received request:', body);

      // Simulate N8N's minimal response
      const response = {
        orderCode: Date.now() // Generate a unique order code
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

// Start mock server on port 8888
mockN8NServer.listen(8888, () => {
  console.log('Mock N8N server running on port 8888');
  console.log('Now update .env.local to point to http://localhost:8888/webhook/loca-noche-event1-payment');
  console.log('And http://localhost:8888/webhook/loca-noche-event2-payment');
  console.log('Then run: npm run dev');
  console.log('And test the payment flow at http://localhost:3000/tickets');
});