# RCS CLI Webhook Dashboard

A simple Node.js Express server that listens for webhook events and logs HTTP POST payloads to the console. Perfect for debugging and monitoring RCS (Rich Communication Services) events or any webhook integrations.

## Features

- 🎯 **Multiple Webhook Endpoints**: Generic webhook, RCS-specific webhook, and catch-all endpoints
- 📋 **Detailed Logging**: Headers, payloads, query parameters, and timestamps
- 🎨 **Color-coded Output**: Different visual indicators for different webhook types
- 📱 **RCS Payload Parsing**: Automatically extracts and highlights key RCS event data
- ❤️ **Health Check**: Built-in health check endpoint for monitoring
- 🚀 **Easy Setup**: Simple installation and configuration

## Installation

1. **Navigate to the project directory:**
   ```bash
   cd rcs-cli-dashboard
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Optional - Create environment file:**
   ```bash
   # Create .env file for custom port (optional)
   echo "PORT=3001" > .env
   ```

## Usage

### Start the Server

```bash
npm start
# or
npm run dev
```

The server will start and display:
```
🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀
🎯 RCS CLI Webhook Dashboard is running!
📡 Server: http://localhost:3001
🔔 Generic Webhook: http://localhost:3001/webhook
📱 RCS Webhook: http://localhost:3001/rcs-webhook
❤️  Health Check: http://localhost:3001/health
🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀

📋 Waiting for webhook events...
```

## Available Endpoints

### 1. Root Endpoint
- **URL**: `GET http://localhost:3001/`
- **Purpose**: Server status and endpoint information

### 2. Health Check
- **URL**: `GET http://localhost:3001/health`
- **Purpose**: Health monitoring

### 3. Generic Webhook
- **URL**: `POST http://localhost:3001/webhook`
- **Purpose**: Captures any webhook payload with standard logging

### 4. RCS-Specific Webhook
- **URL**: `POST http://localhost:3001/rcs-webhook`
- **Purpose**: Specialized for RCS events with enhanced parsing and extraction

### 5. Catch-all Webhook
- **URL**: `POST http://localhost:3001/webhook/*`
- **Purpose**: Captures webhooks sent to any `/webhook/...` path

## Testing the Webhook Server

### Test with curl

**Generic webhook:**
```bash
curl -X POST http://localhost:3001/webhook \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, webhook!", "timestamp": "2024-01-15T10:30:00Z"}'
```

**RCS webhook with sample payload:**
```bash
curl -X POST http://localhost:3001/rcs-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "rcs",
    "data": {
      "context": {
        "buttonPayload": "btn_4_1_route_map",
        "buttonType": "ACTION",
        "channelPayload": {
          "userEvent": {
            "senderPhoneNumber": "+61456529125",
            "messageId": "Mx4j0813TNQeuVjpAChX=lPw",
            "sendTime": "2025-09-29T11:44:22.15958Z",
            "agentId": "signal_sydney_2025_rpmzz2aq_agent@rbm.goog",
            "suggestionResponse": {
              "postbackData": "btn_4_1_route_map",
              "text": "View route map",
              "type": "ACTION"
            }
          }
        }
      }
    }
  }'
```

### Expected Console Output

**Generic Webhook:**
```
================================================================================
🔔 WEBHOOK RECEIVED at 2024-01-15T10:30:00.000Z
================================================================================

📋 HEADERS:
{
  "host": "localhost:3001",
  "user-agent": "curl/7.68.0",
  "accept": "*/*",
  "content-type": "application/json",
  "content-length": "67"
}

📦 PAYLOAD:
{
  "message": "Hello, webhook!",
  "timestamp": "2024-01-15T10:30:00Z"
}

================================================================================
```

**RCS Webhook:**
```
🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢
📱 RCS WEBHOOK RECEIVED at 2024-01-15T10:30:00.000Z
🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢

📋 HEADERS:
{
  "host": "localhost:3001",
  "user-agent": "curl/7.68.0",
  "content-type": "application/json"
}

📱 RCS EVENT PAYLOAD:
{
  "type": "rcs",
  "data": { ... }
}

🎯 EXTRACTED RCS DATA:
   Button Payload: btn_4_1_route_map
   Button Type: ACTION
   Phone Number: +61456529125
   Message ID: Mx4j0813TNQeuVjpAChX=lPw
   Agent ID: signal_sydney_2025_rpmzz2aq_agent@rbm.goog
   Send Time: 2025-09-29T11:44:22.15958Z
   Suggestion Text: View route map
   Postback Data: btn_4_1_route_map
   Response Type: ACTION

🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢
```

## Integration with Twilio

To use this server as a webhook endpoint for Twilio services:

1. **Make your server publicly accessible** (for production):
   - Use ngrok: `ngrok http 3001`
   - Deploy to cloud service (Heroku, Vercel, etc.)

2. **Configure Twilio webhook URL**:
   - For RCS events: `https://your-domain.com/rcs-webhook`
   - For other events: `https://your-domain.com/webhook`

3. **Using with ngrok** (for development):
   ```bash
   # In one terminal - start the webhook server
   npm start
   
   # In another terminal - expose via ngrok
   ngrok http 3001
   
   # Use the ngrok URL in Twilio console:
   # https://abcd1234.ngrok.io/rcs-webhook
   ```

## Configuration

### Environment Variables

Create a `.env` file to customize settings:

```bash
# Server port (default: 3001)
PORT=3001

# Add any other custom configuration here
```

### Customizing the Server

The server is designed to be easily customizable. Key areas you can modify:

- **Add new endpoints**: Follow the existing pattern in `server.js`
- **Change logging format**: Modify the `prettyPrintJson` or console.log statements
- **Add authentication**: Add middleware for webhook verification
- **Store payloads**: Add database integration to persist webhook data

## Production Deployment

### Using PM2 (Process Manager)

```bash
# Install PM2 globally
npm install -g pm2

# Start the application with PM2
pm2 start server.js --name rcs-webhook-server

# Check status
pm2 status

# View logs
pm2 logs rcs-webhook-server
```

### Using Docker

```bash
# Create Dockerfile
cat > Dockerfile << 'EOF'
FROM node:18-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
EOF

# Build and run
docker build -t rcs-webhook-server .
docker run -p 3001:3001 rcs-webhook-server
```

### Environment-specific Configuration

**Development:**
- Uses default port 3001
- Detailed console logging
- No authentication required

**Production:**
- Set `PORT` via environment variable
- Consider adding webhook signature verification
- Use process manager (PM2) or container orchestration
- Add proper logging solution (Winston, etc.)

## Troubleshooting

### Common Issues

1. **Port already in use**
   - Change the port in `.env` file: `PORT=3002`
   - Kill existing process: `lsof -ti:3001 | xargs kill -9`

2. **Webhook not receiving data**
   - Check if the server is running: `curl http://localhost:3001/health`
   - Verify the webhook URL is correct
   - Check firewall settings

3. **Large payloads**
   - The server accepts up to 10MB payloads by default
   - Modify the `limit` parameter in bodyParser configuration if needed

### Debug Mode

To enable more verbose logging, you can modify the server to log additional information:

```javascript
// Add this to server.js for more debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});
```

## Integration Examples

### With Twilio Sync Service

Use this webhook server alongside the Twilio RCS Dashboard:

1. Start this webhook server: `npm start`
2. Expose via ngrok: `ngrok http 3001`
3. Configure Twilio to send webhooks to: `https://xyz.ngrok.io/rcs-webhook`
4. Events will be logged here AND can be forwarded to Sync Service

### With Custom Processing

Add custom processing logic to the webhook handlers:

```javascript
// In server.js, add custom processing
app.post('/rcs-webhook', (req, res) => {
  // ... existing logging code ...
  
  // Custom processing
  if (req.body.type === 'rcs') {
    // Forward to other systems
    // Save to database
    // Trigger notifications
    // etc.
  }
  
  res.status(200).json({ received: true });
});
```

## License

MIT License - feel free to modify and use as needed.
