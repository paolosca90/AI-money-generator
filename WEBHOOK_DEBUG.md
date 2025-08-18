# Webhook Debugging Guide

This guide helps diagnose and fix the "404 Not Found" error when Telegram attempts to send updates to the webhook.

## Problem Analysis

The webhook endpoint is implemented at `/telegram/webhook` but Telegram is receiving a 404 error when trying to reach:
`https://staging-telegram-trading-bot-d6u2.encr.app/telegram/webhook`

## Enhanced Features

### 1. Improved Webhook Endpoint (`/telegram/webhook`)
- ✅ Enhanced error logging with timestamps
- ✅ Better error handling and validation
- ✅ Processing time tracking
- ✅ Detailed error information logging

### 2. New Debug Endpoints

#### Health Check: `GET /telegram/webhook/health`
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "telegram-webhook",
  "version": "1.0.0"
}
```

#### Service Info: `GET /telegram`
Lists all available endpoints in the telegram service.

#### Simple Test: `GET /telegram/test`
Basic endpoint to test routing and connectivity.

### 3. Webhook Management Endpoints

#### Configure Webhook: `POST /telegram/webhook/configure`
```json
{
  "webhookUrl": "https://your-domain.com/telegram/webhook",
  "secretToken": "optional-secret"
}
```

#### Get Webhook Status: `GET /telegram/webhook/info`
Returns current webhook configuration from Telegram.

#### Remove Webhook: `POST /telegram/webhook/remove`
Removes the current webhook configuration.

## Debugging Steps

### Step 1: Test Basic Connectivity
```bash
# Test if the service is reachable
curl https://staging-telegram-trading-bot-d6u2.encr.app/telegram/test

# Test health check
curl https://staging-telegram-trading-bot-d6u2.encr.app/telegram/webhook/health

# List available endpoints
curl https://staging-telegram-trading-bot-d6u2.encr.app/telegram
```

### Step 2: Check Current Webhook Status
```bash
# Using the webhook config script
TELEGRAM_BOT_TOKEN=your_bot_token node scripts/webhook-config.js status

# Or manually via API
curl "https://api.telegram.org/bot<YOUR_TOKEN>/getWebhookInfo"
```

### Step 3: Test Webhook Endpoint
```bash
# Test the actual webhook endpoint
curl -X POST https://staging-telegram-trading-bot-d6u2.encr.app/telegram/webhook \
  -H "Content-Type: application/json" \
  -d '{"update_id": 123, "message": {"message_id": 1, "from": {"id": 1, "is_bot": false, "first_name": "Test"}, "chat": {"id": 1, "type": "private"}, "date": 1234567890, "text": "/test"}}'
```

### Step 4: Reconfigure Webhook
```bash
# Using the webhook config script
TELEGRAM_BOT_TOKEN=your_bot_token node scripts/webhook-config.js configure https://staging-telegram-trading-bot-d6u2.encr.app/telegram/webhook

# Or via the API endpoint
curl -X POST https://staging-telegram-trading-bot-d6u2.encr.app/telegram/webhook/configure \
  -H "Content-Type: application/json" \
  -d '{"webhookUrl": "https://staging-telegram-trading-bot-d6u2.encr.app/telegram/webhook"}'
```

## Common Issues and Solutions

### 1. Service Not Running
**Symptoms**: All endpoints return connection errors
**Solution**: Ensure the Encore application is deployed and running

### 2. Routing Issues
**Symptoms**: 404 errors for specific endpoints
**Solution**: Check if the Encore service is properly configured and deployed

### 3. SSL/TLS Issues
**Symptoms**: Telegram cannot reach HTTPS endpoints
**Solution**: Ensure SSL certificate is valid and the domain is accessible

### 4. Wrong Webhook URL
**Symptoms**: Telegram shows webhook as configured but returns 404
**Solution**: Use the webhook configuration script to reset the webhook URL

## Monitoring and Logs

### Enhanced Logging
The webhook now logs:
- Timestamp for each request
- Processing time
- Detailed error information
- Request validation results

### Log Format Example
```
[2024-01-15T10:30:00.000Z] Received Telegram webhook update: {...}
[2024-01-15T10:30:00.000Z] Processing message from user 123 in chat 456: /start
[2024-01-15T10:30:00.000Z] Webhook processing completed successfully in 150ms
```

## Testing Locally

### Using ngrok
1. Install ngrok: `npm install -g ngrok`
2. Run the application locally: `encore run` (if you have Encore CLI)
3. Expose with ngrok: `ngrok http 4000`
4. Configure webhook with ngrok URL: `node scripts/webhook-config.js configure https://abc123.ngrok.io/telegram/webhook`

### Manual Testing
```bash
# Test webhook with sample data
curl -X POST http://localhost:4000/telegram/webhook \
  -H "Content-Type: application/json" \
  -d '{"update_id": 123, "message": {"message_id": 1, "from": {"id": 1, "is_bot": false, "first_name": "Test"}, "chat": {"id": 1, "type": "private"}, "date": 1234567890, "text": "/test"}}'
```

## Next Steps

1. **Deploy the changes** to the staging environment
2. **Test endpoints** using the curl commands above
3. **Reconfigure webhook** using the provided script
4. **Monitor logs** for any remaining issues
5. **Test with actual Telegram messages** to verify functionality

## Troubleshooting Checklist

- [ ] Service is deployed and running
- [ ] Basic endpoints (`/telegram/test`, `/telegram/webhook/health`) are accessible
- [ ] Webhook endpoint responds to POST requests
- [ ] Webhook URL is correctly configured in Telegram
- [ ] SSL certificate is valid
- [ ] No firewall or proxy issues blocking requests
- [ ] Application logs show webhook requests being received