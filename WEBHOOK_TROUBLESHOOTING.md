# Webhook 404 Error - Troubleshooting Guide

## Problem Summary
The Telegram bot is receiving 404 errors when Telegram tries to send updates to the webhook URL.

**Error Details:**
```json
{
  "url": "https://staging-telegram-trading-bot-d6u2.encr.app/telegram/webhook",
  "pending_update_count": 4,
  "last_error_message": "Wrong response from the webhook: 404 Not Found"
}
```

## Quick Fix Steps

### 1. Run the Automatic Fix Script
```bash
# Set your bot token
export TELEGRAM_BOT_TOKEN=your_bot_token_here

# Run the fix script
node scripts/fix-webhook.js https://staging-telegram-trading-bot-d6u2.encr.app
```

### 2. Manual Fix Steps

#### Step A: Test the Webhook Endpoint
```bash
# Test if the service is running
curl https://staging-telegram-trading-bot-d6u2.encr.app/telegram/test

# Test webhook health
curl https://staging-telegram-trading-bot-d6u2.encr.app/telegram/webhook/health

# Test service info
curl https://staging-telegram-trading-bot-d6u2.encr.app/telegram
```

#### Step B: Reconfigure the Webhook
```bash
# Remove existing webhook
TELEGRAM_BOT_TOKEN=your_token node scripts/webhook-config.js remove

# Set new webhook
TELEGRAM_BOT_TOKEN=your_token node scripts/webhook-config.js configure https://staging-telegram-trading-bot-d6u2.encr.app/telegram/webhook

# Check status
TELEGRAM_BOT_TOKEN=your_token node scripts/webhook-config.js status
```

#### Step C: Test with Real Message
1. Send `/start` to your bot in Telegram
2. Check application logs for webhook requests
3. Verify the bot responds

## Diagnostic Tools

### 1. Comprehensive Diagnostics
```bash
# Run full diagnostic suite
node scripts/debug-webhook.js https://staging-telegram-trading-bot-d6u2.encr.app
```

### 2. Test Individual Endpoints
```bash
# Test webhook endpoint directly
curl -X POST https://staging-telegram-trading-bot-d6u2.encr.app/telegram/webhook \
  -H "Content-Type: application/json" \
  -d '{"update_id": 123, "message": {"message_id": 1, "from": {"id": 1, "is_bot": false, "first_name": "Test"}, "chat": {"id": 1, "type": "private"}, "date": 1234567890, "text": "/test"}}'
```

### 3. Check Webhook Status
```bash
# Get current webhook info from Telegram
curl "https://api.telegram.org/bot<YOUR_TOKEN>/getWebhookInfo"
```

## Common Causes and Solutions

### 1. Service Not Deployed
**Symptoms:** All endpoints return connection errors
**Solution:** 
```bash
# Deploy the service
encore env deploy staging

# Verify deployment
curl https://staging-telegram-trading-bot-d6u2.encr.app/telegram/test
```

### 2. Wrong Webhook URL
**Symptoms:** Telegram shows webhook configured but returns 404
**Solution:**
```bash
# Verify correct URL format
echo "Expected: https://staging-telegram-trading-bot-d6u2.encr.app/telegram/webhook"

# Reconfigure with correct URL
TELEGRAM_BOT_TOKEN=your_token node scripts/webhook-config.js configure https://staging-telegram-trading-bot-d6u2.encr.app/telegram/webhook
```

### 3. Routing Issues
**Symptoms:** Some endpoints work, webhook doesn't
**Solution:**
- Check if `/telegram/webhook` endpoint is properly exposed
- Verify the `expose: true` setting in the API definition
- Test with the enhanced webhook endpoint

### 4. SSL/Certificate Issues
**Symptoms:** Telegram can't reach HTTPS endpoints
**Solution:**
- Verify SSL certificate is valid
- Test with `curl -v` to check SSL handshake
- Ensure domain is accessible from external networks

## Enhanced Webhook Features

The updated webhook endpoint now includes:

### 1. Enhanced Error Handling
- Comprehensive input validation
- Detailed error logging with timestamps
- Graceful error recovery

### 2. Better Logging
```
[2024-01-15T10:30:00.000Z] 🔄 Received Telegram webhook update: {...}
[2024-01-15T10:30:00.000Z] ✅ Update validation passed for update_id: 123
[2024-01-15T10:30:00.000Z] 📨 Processing message from user 456: "/start"
[2024-01-15T10:30:00.000Z] 🎉 Webhook processing completed successfully in 150ms
```

### 3. Multiple Test Endpoints
- `GET /telegram/test` - Basic connectivity test
- `GET /telegram/webhook/health` - Health check with uptime
- `GET /telegram` - Service information
- `POST /telegram/webhook/test` - Webhook testing endpoint

### 4. Webhook Management
- `POST /telegram/webhook/configure` - Configure webhook via API
- `GET /telegram/webhook/info` - Get webhook status
- `POST /telegram/webhook/remove` - Remove webhook

## Monitoring

### 1. Check Application Logs
Look for these log patterns:
```
✅ Webhook processing completed successfully
❌ Validation error: Missing or invalid update_id
🔄 Received Telegram webhook update
```

### 2. Monitor Webhook Status
```bash
# Check webhook status regularly
TELEGRAM_BOT_TOKEN=your_token node scripts/webhook-config.js status
```

### 3. Test Bot Functionality
```bash
# Send test message to bot
# Expected: Bot responds with setup flow or help message
```

## Prevention

### 1. Health Monitoring
Set up monitoring for:
- `GET /telegram/webhook/health` (should return 200)
- Webhook error count from Telegram API
- Application logs for webhook errors

### 2. Automated Testing
```bash
# Add to CI/CD pipeline
node scripts/debug-webhook.js $DEPLOYMENT_URL
```

### 3. Webhook Validation
- Always test webhook after deployment
- Verify webhook URL matches deployment URL
- Check SSL certificate validity

## Support

If the issue persists after following this guide:

1. **Check the enhanced logs** for detailed error information
2. **Run the diagnostic script** for comprehensive testing
3. **Verify all endpoints** are responding correctly
4. **Test with a simple message** to the bot
5. **Contact support** with the diagnostic output

The enhanced webhook system should resolve the 404 errors and provide much better visibility into any remaining issues.
