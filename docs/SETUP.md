# Setup Guide - AI Trading Bot

This guide covers the complete setup process for the AI Trading Bot after the major v2.0.0 integration release.

## 🎯 Overview

The AI Trading Bot now includes:
- **Enhanced AI Analysis** with VWAP and sentiment analysis
- **User Personalization** with trading mode selection and risk management
- **Subscription Management** with feature-gated access
- **Internationalization** support for English and Italian
- **VPS Management** integration

## 📋 Prerequisites

### Required
- **Node.js** 18+ and **Encore** development environment
- **PostgreSQL** database
- **Telegram Bot Token** (from @BotFather)
- **Google Gemini API Key** (for AI analysis)

### Optional (for enhanced features)
- **News API Key** (for sentiment analysis)
- **MT5 Terminal** (for live trading)
- **VPS Access** (for 24/7 operation)

## 🔧 Environment Setup

### 1. Core Configuration

Create or update your environment variables:

```bash
# Required - Core functionality
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
GEMINI_API_KEY=your_gemini_api_key_here

# Optional - Enhanced features (graceful degradation if missing)
NEWS_API_KEY=your_news_api_key_here
ADMIN_USER_ID=your_telegram_user_id

# MT5 Integration (optional)
MT5_HOST=localhost
MT5_PORT=8080

# Database (configured by Encore)
DATABASE_URL=postgresql://user:password@localhost:5432/trading_bot
```

### 2. Encore Configuration

Your `encore.app` should be configured with:

```typescript
import { api } from "encore.dev/api";

export default {
  services: [
    "analysis",    // AI analysis and prediction services
    "telegram",    // Telegram bot and user management
    "frontend"     // Web dashboard (optional)
  ]
};
```

## 📊 Database Setup

### 1. Migration Overview

The system includes these migrations:
- **Migration 3**: Placeholder (existing)
- **Migration 4**: User preferences and state management
- **Migration 5**: Client management and subscriptions

### 2. Run Migrations

```bash
# Navigate to backend directory
cd backend

# Run migrations (they are idempotent)
encore migrate up

# Verify migrations completed
encore db shell --svc=telegram
\dt  # List tables to verify user_preferences, user_states, etc.
```

### 3. Verify Database Schema

Expected tables after migration:
- `user_interactions` (existing)
- `vps_configurations` (existing)
- `user_preferences` (new)
- `user_states` (new)
- `client_configurations` (new)
- `client_usage_logs` (new)
- `client_payments` (new)

## 🚀 Deployment Process

### 1. Build and Test

```bash
# Test TypeScript compilation
cd backend
npx tsc --noEmit

# Build the project
npx tsc --build

# Test the application (if encore is available)
encore run
```

### 2. Deploy to Encore Cloud

```bash
# Deploy to staging environment
encore env deploy staging

# Run migrations on staging
encore migrate up --env=staging

# Test the deployment
curl https://staging-<your-app>.encr.app/analysis/health

# Deploy to production
encore env deploy production
encore migrate up --env=production
```

### 3. Verify Deployment

1. **Test basic functionality:**
   ```bash
   # Send /start to your bot in Telegram
   # Verify the guided setup flow works
   ```

2. **Test subscription system:**
   ```bash
   # Try /subscription command
   # Verify feature access control
   ```

3. **Test AI analysis:**
   ```bash
   # Send /predict BTCUSD
   # Verify personalized signals work
   ```

## 🛠️ Configuration Options

### 1. Subscription Tiers

The system supports three subscription levels:

#### Basic ($29/month)
- 1 VPS configuration
- 1 MT5 account
- Basic AI signals
- Standard support

#### Premium ($79/month)
- 3 VPS configurations
- 3 MT5 accounts
- Advanced AI signals
- Priority support
- Risk management tools

#### Enterprise ($199/month)
- Unlimited configurations
- 24/7 dedicated support
- Custom strategies
- Portfolio management

### 2. Feature Configuration

Control feature availability by updating `client-manager.ts`:

```typescript
function getSubscriptionFeatures(type: string): string[] {
  switch (type) {
    case "basic":
      return ["basic_signals", "vps_management", "mt5_integration"];
    case "premium":
      return ["advanced_signals", "risk_management", "priority_support"];
    case "enterprise":
      return ["premium_signals", "custom_strategies", "dedicated_support"];
  }
}
```

## 👥 User Management

### 1. Create Subscriptions

Use the API to create client subscriptions:

```bash
curl -X POST https://your-app.encr.app/telegram/client/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 123456789,
    "subscriptionType": "premium",
    "features": ["advanced_signals", "vps_management", "risk_management"],
    "durationDays": 30
  }'
```

### 2. User Setup Flow

New users will experience this flow:
1. Send `/start`
2. Choose trading mode (Scalping/Intraday/Swing)
3. Set risk percentage (1-3%)
4. Optionally set account balance
5. Complete setup and start trading

### 3. Existing Users

Existing users retain all functionality:
- Previous commands continue to work
- Use `/settings` to configure new preferences
- Use `/start` to go through setup if desired

## 🌍 Internationalization

### 1. Language Support

Currently supported:
- **English** (default)
- **Italian** (complete translation)

### 2. Adding New Languages

1. Extend `SupportedLanguage` type in `i18n.ts`
2. Add message translations to the `messages` object
3. Update language detection logic

### 3. User Language Selection

```typescript
// Set user language preference
await setUserLanguage(userId, 'it');

// Get messages in user's language
const message = getMessage('welcome.back', 'it', { mode: 'SCALPING' });
```

## 🔒 Security Configuration

### 1. Admin Access

Set the admin user ID:
```bash
ADMIN_USER_ID=your_telegram_user_id
```

### 2. Subscription Security

- All subscription changes are logged
- Feature access is validated on every command
- User permissions are cached for performance

### 3. Data Privacy

- User preferences are stored securely
- No sensitive trading data is logged
- GDPR-compliant user data handling

## 📊 Monitoring & Analytics

### 1. System Health

Monitor these endpoints:
- `/analysis/health` - AI system status
- `/telegram/health` - Bot status
- Database connection status

### 2. User Analytics

Track usage with:
- `client_usage_logs` table
- Subscription status monitoring
- Feature usage patterns

### 3. Performance Metrics

Monitor:
- Response times for `/predict` commands
- AI analysis success rates
- User engagement metrics

## 🐛 Troubleshooting

### 1. Common Issues

#### Bot Not Responding
```bash
# Check bot token
curl https://api.telegram.org/bot<TOKEN>/getMe

# Check webhook
curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo
```

#### Database Issues
```bash
# Check connection
encore db shell --svc=telegram

# Verify migrations
SELECT * FROM encore_migrations;
```

#### AI Analysis Errors
```bash
# Check Gemini API key
curl -H "x-goog-api-key: YOUR_KEY" \
  "https://generativelanguage.googleapis.com/v1beta/models"
```

### 2. Error Logs

Check logs for common errors:
- `TypeError: Cannot read property` - Missing user preferences
- `API error 401` - Invalid API keys
- `Database connection` - Migration or connection issues

### 3. User Support

Direct users to:
1. `/support` command for built-in help
2. `/subscription` to check their plan
3. `/settings` to verify preferences
4. Contact admin with their User ID

## 🔄 Backup & Recovery

### 1. Database Backup

```bash
# Create backup
pg_dump $DATABASE_URL > backup.sql

# Restore backup
psql $DATABASE_URL < backup.sql
```

### 2. Configuration Backup

Backup these files:
- `backend/telegram/client-manager.ts`
- `backend/telegram/user-state-manager.ts`
- `backend/telegram/i18n.ts`
- Environment variables

### 3. User Data Migration

If migrating users:
1. Export `user_preferences` table
2. Export `client_configurations` table
3. Preserve user IDs and chat IDs
4. Test migration with small subset first

## 📈 Scaling Considerations

### 1. Database Optimization

- Add indexes for frequently queried fields
- Consider read replicas for analytics
- Monitor query performance

### 2. API Rate Limits

- Implement rate limiting for AI analysis
- Cache results for repeated requests
- Monitor API usage quotas

### 3. User Growth

- Plan for increased subscription management
- Scale VPS management capabilities
- Consider geographic distribution

## 🔮 Future Upgrades

### 1. Planned Enhancements

- Mobile app integration
- Advanced portfolio management
- Real-time market data feeds
- Social trading features

### 2. Technical Roadmap

- GraphQL API layer
- Microservices architecture
- Real-time WebSocket connections
- Enhanced caching layer

### 3. Business Features

- Affiliate program
- Enterprise white-labeling
- Advanced analytics dashboard
- Custom strategy development

---

For additional support, contact the development team or refer to the inline help system via the `/support` command in the bot.