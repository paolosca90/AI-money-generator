#!/usr/bin/env node
import fetch from 'node-fetch';

/**
 * Simple bot setup and test script
 * This script helps configure the bot token and test basic functionality
 */

const BOT_TOKEN = "7774671041:AAEUT6ih4lM1qWGvmsLQudHy58eWK8Kv7CY";

async function testBotToken() {
  console.log("🤖 Testing Telegram Bot Token...");
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
    const result = await response.json();
    
    if (result.ok) {
      console.log("✅ Bot token is valid!");
      console.log(`📋 Bot info:
- Name: ${result.result.first_name}
- Username: @${result.result.username}
- ID: ${result.result.id}
- Can join groups: ${result.result.can_join_groups}
- Can read all group messages: ${result.result.can_read_all_group_messages}
- Supports inline queries: ${result.result.supports_inline_queries}`);
      
      return true;
    } else {
      console.error("❌ Bot token is invalid:", result.description);
      return false;
    }
  } catch (error) {
    console.error("❌ Error testing bot token:", error.message);
    return false;
  }
}

async function setWebhook(webhookUrl) {
  console.log(`🔗 Setting webhook to: ${webhookUrl}`);
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: webhookUrl,
        max_connections: 40,
        allowed_updates: ["message", "callback_query"]
      })
    });
    
    const result = await response.json();
    
    if (result.ok) {
      console.log("✅ Webhook set successfully!");
      return true;
    } else {
      console.error("❌ Failed to set webhook:", result.description);
      return false;
    }
  } catch (error) {
    console.error("❌ Error setting webhook:", error.message);
    return false;
  }
}

async function getWebhookInfo() {
  console.log("📊 Getting webhook info...");
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
    const result = await response.json();
    
    if (result.ok) {
      const info = result.result;
      console.log(`📋 Webhook info:
- URL: ${info.url || "Not set"}
- Has custom certificate: ${info.has_custom_certificate}
- Pending updates: ${info.pending_update_count}
- Max connections: ${info.max_connections}
- Allowed updates: ${info.allowed_updates?.join(", ") || "All"}
- Last error date: ${info.last_error_date ? new Date(info.last_error_date * 1000).toISOString() : "None"}
- Last error message: ${info.last_error_message || "None"}`);
      
      return info;
    } else {
      console.error("❌ Failed to get webhook info:", result.description);
      return null;
    }
  } catch (error) {
    console.error("❌ Error getting webhook info:", error.message);
    return null;
  }
}

async function deleteWebhook() {
  console.log("🗑️ Deleting webhook...");
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`, {
      method: "POST"
    });
    
    const result = await response.json();
    
    if (result.ok) {
      console.log("✅ Webhook deleted successfully!");
      return true;
    } else {
      console.error("❌ Failed to delete webhook:", result.description);
      return false;
    }
  } catch (error) {
    console.error("❌ Error deleting webhook:", error.message);
    return false;
  }
}

async function main() {
  console.log("🚀 AI Trading Bot Setup & Test");
      console.log("=" + "=".repeat(49));
  
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case "test":
      await testBotToken();
      break;
      
    case "webhook":
      const webhookUrl = args[1];
      if (!webhookUrl) {
        console.error("❌ Please provide a webhook URL");
        console.log("Usage: node bot-setup.js webhook https://your-domain.com/telegram/webhook");
        process.exit(1);
      }
      await setWebhook(webhookUrl);
      break;
      
    case "info":
      await getWebhookInfo();
      break;
      
    case "delete":
      await deleteWebhook();
      break;
      
    case "setup":
      console.log("🔧 Running full setup...");
      await testBotToken();
      await getWebhookInfo();
      
      const currentInfo = await getWebhookInfo();
      if (currentInfo && !currentInfo.url) {
        console.log("\n⚠️ No webhook is set. You'll need to set one for the bot to work.");
        console.log("Use: node bot-setup.js webhook https://your-domain.com/telegram/webhook");
      }
      break;
      
    default:
      console.log(`
📖 Available commands:

  test     - Test if the bot token is valid
  webhook  - Set webhook URL for the bot
  info     - Get current webhook information
  delete   - Delete current webhook
  setup    - Run full setup check

Examples:
  node bot-setup.js test
  node bot-setup.js webhook https://your-app.encore.run/telegram/webhook
  node bot-setup.js info
      `);
  }
}

if (process.argv[1] === import.meta.url.replace('file://', '')) {
  main().catch(console.error);
}