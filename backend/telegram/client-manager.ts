import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { telegramDB } from "./db";
import { sendMessage } from "./telegram-client";

const adminUserId = secret("AdminUserId");

export interface ClientConfig {
  id: number;
  userId: number;
  subscriptionType: "basic" | "premium" | "enterprise";
  features: string[];
  expiryDate: Date;
  maxVpsConfigurations: number;
  maxMt5Accounts: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientSubscription {
  userId: number;
  subscriptionType: "basic" | "premium" | "enterprise";
  features: string[];
  durationDays: number;
}

// Client management API - Create new client subscription
export const createClientSubscription = api<ClientSubscription, { success: boolean; message: string }>(
  { expose: true, method: "POST", path: "/telegram/client/subscribe" },
  async (req) => {
    const { userId, subscriptionType, features, durationDays } = req;

    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + durationDays);

      const maxConfigs = getMaxConfigurationsForType(subscriptionType);
      const maxAccounts = getMaxAccountsForType(subscriptionType);

      await telegramDB.exec`
        INSERT INTO client_configurations (
          user_id, subscription_type, features, expiry_date,
          max_vps_configurations, max_mt5_accounts, is_active, created_at, updated_at
        ) VALUES (
          ${userId}, ${subscriptionType}, ${JSON.stringify(features)}, ${expiryDate},
          ${maxConfigs}, ${maxAccounts}, true, NOW(), NOW()
        )
        ON CONFLICT (user_id) DO UPDATE SET
          subscription_type = EXCLUDED.subscription_type,
          features = EXCLUDED.features,
          expiry_date = EXCLUDED.expiry_date,
          max_vps_configurations = EXCLUDED.max_vps_configurations,
          max_mt5_accounts = EXCLUDED.max_mt5_accounts,
          is_active = true,
          updated_at = NOW()
      `;

      // Send welcome message to client
      await sendWelcomeMessage(userId, subscriptionType);

      return {
        success: true,
        message: `${subscriptionType} subscription created successfully`
      };
    } catch (error) {
      console.error("Error creating client subscription:", error);
      throw APIError.internal("Failed to create client subscription");
    }
  }
);

// Get client configuration
export const getClientConfig = api<{ userId: number }, { config: ClientConfig | null }>(
  { expose: true, method: "GET", path: "/telegram/client/config/:userId" },
  async (req) => {
    const config = await telegramDB.queryRow<ClientConfig>`
      SELECT * FROM client_configurations WHERE user_id = ${req.userId}
    `;

    return { config };
  }
);

// Check if client has feature access
export async function checkClientFeature(userId: number, feature: string): Promise<boolean> {
  const config = await telegramDB.queryRow<ClientConfig>`
    SELECT features, is_active, expiry_date FROM client_configurations 
    WHERE user_id = ${userId}
  `;

  if (!config || !config.isActive) {
    return false;
  }

  if (new Date() > config.expiryDate) {
    // Subscription expired
    await telegramDB.exec`
      UPDATE client_configurations SET is_active = false WHERE user_id = ${userId}
    `;
    return false;
  }

  const features = JSON.parse(config.features as any) as string[];
  return features.includes(feature);
}

// Client command handlers
export async function handleClientCommands(chatId: number, userId: number, command: string): Promise<void> {
  const config = await telegramDB.queryRow<ClientConfig>`
    SELECT * FROM client_configurations WHERE user_id = ${userId}
  `;

  if (command === "/subscription") {
    await handleSubscriptionInfo(chatId, userId, config);
  } else if (command === "/features") {
    await handleFeaturesInfo(chatId, userId, config);
  } else if (command === "/upgrade") {
    await handleUpgradeInfo(chatId, userId);
  } else if (command === "/support") {
    await handleSupportInfo(chatId, userId);
  }
}

async function handleSubscriptionInfo(chatId: number, userId: number, config: ClientConfig | null): Promise<void> {
  if (!config) {
    const message = `
❌ **No Active Subscription**

You don't have an active subscription. To access the AI Trading Bot features, please choose a plan:

**📊 Available Plans:**

🥉 **BASIC** - €29/month
• 1 VPS configuration
• 1 MT5 account
• Basic AI signals
• Standard support

🥈 **PREMIUM** - €79/month
• 3 VPS configurations
• 3 MT5 accounts
• Advanced AI signals
• Priority support
• Risk management tools

🥇 **ENTERPRISE** - €199/month
• Unlimited VPS configurations
• Unlimited MT5 accounts
• Premium AI signals
• 24/7 dedicated support
• Custom strategies
• Portfolio management

Contact @your_support_bot to subscribe!
    `;
    
    await sendMessage(chatId, message);
    return;
  }

  const features = JSON.parse(config.features as any) as string[];
  const daysUntilExpiry = Math.ceil((config.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const statusEmoji = config.isActive ? "🟢" : "🔴";

  const message = `
📋 **Your Subscription**

**Plan:** ${statusEmoji} ${config.subscriptionType.toUpperCase()}
**Status:** ${config.isActive ? "ACTIVE" : "EXPIRED"}
**Expires:** ${config.expiryDate.toLocaleDateString()} (${daysUntilExpiry} days)

**Your Limits:**
• VPS Configurations: ${config.maxVpsConfigurations}
• MT5 Accounts: ${config.maxMt5Accounts}

**Available Features:**
${features.map(f => `• ${getFeatureDescription(f)}`).join('\n')}

**Need help?** Use /support for assistance.
**Want to upgrade?** Use /upgrade to see options.
  `;

  await sendMessage(chatId, message);
}

async function handleFeaturesInfo(chatId: number, userId: number, config: ClientConfig | null): Promise<void> {
  if (!config || !config.isActive) {
    await sendMessage(chatId, "❌ You need an active subscription to access features. Use `/subscription` for more info.");
    return;
  }

  const features = JSON.parse(config.features as any) as string[];
  
  const message = `
🎯 **Your Available Features**

${features.map(feature => {
    const desc = getFeatureDescription(feature);
    const command = getFeatureCommand(feature);
    return `✅ **${desc}**${command ? `\n   Command: ${command}` : ''}`;
  }).join('\n\n')}

**Usage Tips:**
• Use \`/vps_setup\` to configure your VPS
• Use \`/predict SYMBOL\` for AI analysis
• Use \`/performance\` to track results
• Use \`/help\` for all commands

**Need more features?** Use \`/upgrade\` to see premium options.
  `;

  await sendMessage(chatId, message);
}

async function handleUpgradeInfo(chatId: number, userId: number): Promise<void> {
  const message = `
🚀 **Upgrade Your Plan**

**Why Upgrade?**
• More VPS configurations
• Advanced AI strategies
• Priority support
• Exclusive features

**📊 Upgrade Options:**

**BASIC → PREMIUM (+€50/month)**
• 3x more VPS configurations
• Advanced risk management
• Priority support
• Custom indicators

**PREMIUM → ENTERPRISE (+€120/month)**
• Unlimited configurations
• 24/7 dedicated support
• Custom AI strategies
• Portfolio management
• White-label options

**🎁 Special Offers:**
• Annual plans: 2 months FREE
• Referral bonus: 1 month FREE
• Enterprise trial: 7 days FREE

**Ready to upgrade?**
Contact @your_support_bot with your user ID: \`${userId}\`
  `;

  await sendMessage(chatId, message);
}

async function handleSupportInfo(chatId: number, userId: number): Promise<void> {
  const message = `
🆘 **Support & Help**

**📞 Contact Options:**

**🤖 Bot Support:** @your_support_bot
**📧 Email:** support@yourdomain.com
**💬 Telegram:** @your_support_channel

**🔧 Self-Help:**
• \`/help\` - All available commands
• \`/status\` - Check system status
• \`/vps_status\` - Check VPS status
• \`/subscription\` - Check your plan

**📚 Documentation:**
• Setup guides in bot menu
• Video tutorials: /tutorials
• FAQ: /faq

**⚡ Priority Support:**
Premium and Enterprise users get priority support with guaranteed response times.

**Your User ID:** \`${userId}\`
(Include this when contacting support)
  `;

  await sendMessage(chatId, message);
}

function getMaxConfigurationsForType(type: string): number {
  switch (type) {
    case "basic": return 1;
    case "premium": return 3;
    case "enterprise": return 999;
    default: return 1;
  }
}

function getMaxAccountsForType(type: string): number {
  switch (type) {
    case "basic": return 1;
    case "premium": return 3;
    case "enterprise": return 999;
    default: return 1;
  }
}

function getFeatureDescription(feature: string): string {
  const descriptions: { [key: string]: string } = {
    "basic_signals": "Basic AI Trading Signals",
    "advanced_signals": "Advanced AI Trading Signals",
    "premium_signals": "Premium AI Trading Signals",
    "risk_management": "Risk Management Tools",
    "portfolio_management": "Portfolio Management",
    "custom_strategies": "Custom Trading Strategies",
    "priority_support": "Priority Customer Support",
    "dedicated_support": "24/7 Dedicated Support",
    "vps_management": "VPS Management",
    "mt5_integration": "MetaTrader 5 Integration",
    "analytics": "Advanced Analytics",
    "backtesting": "Strategy Backtesting",
    "auto_trading": "Automated Trading",
    "multi_account": "Multi-Account Management",
    "api_access": "API Access",
    "white_label": "White Label Options"
  };
  
  return descriptions[feature] || feature;
}

function getFeatureCommand(feature: string): string | null {
  const commands: { [key: string]: string } = {
    "basic_signals": "/predict",
    "advanced_signals": "/predict",
    "premium_signals": "/predict", 
    "vps_management": "/vps",
    "mt5_integration": "/status",
    "analytics": "/performance",
    "auto_trading": "/execute"
  };
  
  return commands[feature] || null;
}

async function sendWelcomeMessage(userId: number, subscriptionType: string): Promise<void> {
  try {
    // Get user's chat ID
    const user = await telegramDB.queryRow`
      SELECT chat_id FROM user_interactions 
      WHERE user_id = ${userId} 
      ORDER BY created_at DESC 
      LIMIT 1
    `;

    if (user?.chat_id) {
      const features = getSubscriptionFeatures(subscriptionType);
      
      const message = `
🎉 **Welcome to AI Trading Bot!**

Your **${subscriptionType.toUpperCase()}** subscription is now active!

**🎯 What you can do now:**

${features.map(f => `• ${getFeatureDescription(f)}`).join('\n')}

**🚀 Quick Start:**
1. Use \`/vps_setup\` to configure your VPS
2. Use \`/predict BTCUSD\` for your first AI signal
3. Use \`/help\` to see all commands

**📚 Need help?**
• Use \`/support\` for assistance
• Check \`/features\` for your available tools

**Happy Trading!** 📈💰
      `;
      
      await sendMessage(user.chat_id, message);
    }
  } catch (error) {
    console.error("Failed to send welcome message:", error);
  }
}

function getSubscriptionFeatures(type: string): string[] {
  switch (type) {
    case "basic":
      return [
        "basic_signals",
        "vps_management", 
        "mt5_integration",
        "analytics"
      ];
    case "premium":
      return [
        "advanced_signals",
        "vps_management",
        "mt5_integration", 
        "analytics",
        "risk_management",
        "priority_support",
        "backtesting"
      ];
    case "enterprise":
      return [
        "premium_signals",
        "vps_management",
        "mt5_integration",
        "analytics", 
        "risk_management",
        "portfolio_management",
        "custom_strategies",
        "dedicated_support",
        "multi_account",
        "api_access",
        "white_label"
      ];
    default:
      return ["basic_signals"];
  }
}