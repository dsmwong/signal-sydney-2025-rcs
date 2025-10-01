const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { authtoken } = require('@ngrok/ngrok');
require('dotenv').config();
const ngrok = require('@ngrok/ngrok');

const app = express();
const PORT = process.env.PORT || 3001;

// Parse command line arguments for debug mode
const DEBUG_MODE = process.argv.includes('--debug');

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Utility function to format timestamp
const formatTimestamp = () => {
  return new Date().toISOString();
};

// Utility function to pretty print JSON
const prettyPrintJson = (obj) => {
  return JSON.stringify(obj, null, 2);
};

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'RCS CLI Webhook Dashboard is running!',
    timestamp: formatTimestamp(),
    endpoints: {
      webhooks: '/webhook',
      rcsWebhooks: '/rcs-webhook',
      health: '/health'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: formatTimestamp() 
  });
});

// Generic webhook endpoint
app.post('/webhook', (req, res) => {
  const timestamp = formatTimestamp();

  console.log('\n' + '='.repeat(80));
  console.log(`🔔 WEBHOOK RECEIVED at ${timestamp}`);
  console.log('='.repeat(80));

  // Log request headers and payload only in debug mode
  if (DEBUG_MODE) {
    console.log('\n📋 HEADERS:');
    console.log(prettyPrintJson(req.headers));

    console.log('\n📦 PAYLOAD:');
    if (req.body && Object.keys(req.body).length > 0) {
      console.log(prettyPrintJson(req.body));
    } else {
      console.log('(No payload received)');
    }

    // Log query parameters if any
    if (req.query && Object.keys(req.query).length > 0) {
      console.log('\n❓ QUERY PARAMETERS:');
      console.log(prettyPrintJson(req.query));
    }
  }

  console.log('\n' + '='.repeat(80) + '\n');

  // Respond with success
  res.status(200).json({
    message: 'Webhook received successfully',
    timestamp: timestamp,
    received: true
  });
});

// RCS-specific webhook endpoint
app.post('/rcs-webhook', (req, res) => {
  const timestamp = formatTimestamp();

  console.log('\n' + '🟢'.repeat(40));
  console.log(`📱 RCS WEBHOOK RECEIVED at ${timestamp}`);
  console.log('🟢'.repeat(40));

  // Log request headers and payload only in debug mode
  if (DEBUG_MODE) {
    console.log('\n📋 HEADERS:');
    console.log(prettyPrintJson(req.headers));

    console.log('\n📱 RCS EVENT PAYLOAD:');
    if (req.body && Object.keys(req.body).length > 0) {
      console.log(prettyPrintJson(req.body));

      const channelMetadata = JSON.parse(req.body.ChannelMetadata) || {};

      // Extract and highlight key RCS fields
      if (channelMetadata.type === 'rcs' ) {

        console.log('\n🎯 EXTRACTED RCS DATA:');
        const rcsData = channelMetadata.data;

        if (rcsData.context) {
          console.log(`   Button Payload: ${rcsData.context.buttonPayload || 'N/A'}`);
          console.log(`   Button Type: ${rcsData.context.buttonType || 'N/A'}`);

          if (rcsData.context.channelPayload?.userEvent) {
            const userEvent = rcsData.context.channelPayload.userEvent;
            console.log(`   Phone Number: ${userEvent.senderPhoneNumber || 'N/A'}`);
            console.log(`   Message ID: ${userEvent.messageId || 'N/A'}`);
            console.log(`   Agent ID: ${userEvent.agentId || 'N/A'}`);
            console.log(`   Send Time: ${userEvent.sendTime || 'N/A'}`);

            if (userEvent.suggestionResponse) {

              console.log(`   CTA BUTTON RESPONSE:`);
              console.log(`     Suggestion Text: ${userEvent.suggestionResponse.text || 'N/A'}`);
              console.log(`     Postback Data: ${userEvent.suggestionResponse.postbackData || 'N/A'}`);
              console.log(`     Response Type: ${userEvent.suggestionResponse.type || 'N/A'}`);
            }

            if (userEvent.text) {
              console.log(`   User Text: ${userEvent.text || 'N/A'}`);
            }
          }
        }
      }
    } else {
      console.log('(No RCS payload received)');
    }
  }

  console.log('\n' + '🟢'.repeat(40) + '\n');

  // Respond with success
  res.status(200).json({
    message: 'RCS webhook processed successfully',
    timestamp: timestamp,
    received: true,
    type: 'rcs-webhook'
  });
});

// Catch-all webhook endpoint for any other webhook paths
app.post('/webhook/:pathName', (req, res) => {
  const timestamp = formatTimestamp();
  const path = req.path;
  const pathName = req.params.pathName;

  console.log('\n' + '🔵'.repeat(40));
  console.log(`🌐 WEBHOOK RECEIVED at ${path} (${pathName}) - ${timestamp}`);
  console.log('🔵'.repeat(40));

  // Log request headers and payload only in debug mode
  if (DEBUG_MODE) {
    console.log('\n📋 HEADERS:');
    console.log(prettyPrintJson(req.headers));

    console.log('\n📦 PAYLOAD:');
    if (req.body && Object.keys(req.body).length > 0) {
      console.log(prettyPrintJson(req.body));
    } else {
      console.log('(No payload received)');
    }
  }

  console.log('\n' + '🔵'.repeat(40) + '\n');

  res.status(200).json({
    message: `Webhook received at ${path}`,
    timestamp: timestamp,
    received: true,
    pathName: pathName
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('\n❌ ERROR:', err.message);
  console.error('Stack trace:', err.stack);
  res.status(500).json({ 
    error: 'Internal server error',
    timestamp: formatTimestamp()
  });
});

// 404 handler
app.use((req, res) => {
  console.log(`\n⚠️  404 - ${req.method} ${req.path} not found`);
  res.status(404).json({ 
    error: 'Endpoint not found',
    method: req.method,
    path: req.path,
    timestamp: formatTimestamp()
  });
});

// Start server
app.listen(PORT, async () => {

  const domain = process.env.NGROK_URL ? `${process.env.NGROK_URL}` : `localhost:${PORT}`;

        // Start ngrok tunnel
  try {
    const listener = await ngrok.forward({
      addr: PORT,
      authtoken: process.env.NGROK_AUTHTOKEN,
      domain: process.env.NGROK_URL || undefined,
      // authtoken_from_env: true // Uses NGROK_AUTHTOKEN environment variable
      // Or, pass authtoken directly: authtoken: "your_authtoken_here"
    });
    console.log(`ngrok Ingress established at: ${listener.url()}`);
  } catch (error) {
    console.error('Error starting ngrok:', error);
  }

  console.log('\n' + '🚀'.repeat(50));
  console.log(`🎯 RCS CLI Webhook Dashboard is running!`);
  console.log(`📡 Server: http://${domain}`);
  console.log(`🔔 Generic Webhook: http://${domain}/webhook`);
  console.log(`📱 RCS Webhook: http://${domain}/rcs-webhook`);
  console.log(`❤️  Health Check: http://${domain}/health`);
  console.log(`🐛 Debug Mode: ${DEBUG_MODE ? 'ENABLED' : 'DISABLED'}`);
  console.log('🚀'.repeat(50) + '\n');
  console.log('📋 Waiting for webhook events...\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  process.exit(0);
});
