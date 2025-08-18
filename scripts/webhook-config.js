#!/usr/bin/env node

/**
 * Webhook Configuration Script
 * 
 * This script helps configure and test the Telegram webhook.
 * Usage:
 *   node webhook-config.js configure <webhook-url>
 *   node webhook-config.js status
 *   node webhook-config.js remove
 *   node webhook-config.js test <base-url>
 */

import https from 'https';
import http from 'http';

// Get bot token from environment
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN environment variable is required');
  process.exit(1);
}

// Telegram API helper
async function telegramRequest(method, data = {}) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;
  
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          if (result.ok) {
            resolve(result.result);
          } else {
            reject(new Error(`Telegram API error: ${result.description}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Test HTTP endpoint
async function testEndpoint(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    const req = protocol.request(url, { method: 'GET' }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });
}

// Commands
async function configureWebhook(webhookUrl) {
  try {
    console.log(`🔧 Configuring webhook: ${webhookUrl}`);
    
    const result = await telegramRequest('setWebhook', {
      url: webhookUrl,
      allowed_updates: ['message', 'callback_query'],
      max_connections: 40
    });
    
    console.log('✅ Webhook configured successfully');
    console.log('Result:', result);
    
    // Test the endpoint
    console.log('\\n🧪 Testing webhook endpoint...');
    await testWebhookEndpoint(webhookUrl);
    
  } catch (error) {
    console.error('❌ Failed to configure webhook:', error.message);
    process.exit(1);
  }
}

async function getWebhookStatus() {
  try {
    console.log('📊 Getting webhook status...');
    
    const result = await telegramRequest('getWebhookInfo');
    
    console.log('✅ Webhook Status:');
    console.log(JSON.stringify(result, null, 2));
    
    // Test the webhook URL if it exists
    if (result.url) {
      console.log('\\n🧪 Testing webhook endpoint...');
      await testWebhookEndpoint(result.url);
    }
    
  } catch (error) {
    console.error('❌ Failed to get webhook status:', error.message);
    process.exit(1);
  }
}

async function removeWebhook() {
  try {
    console.log('🗑️ Removing webhook...');
    
    const result = await telegramRequest('deleteWebhook');
    
    console.log('✅ Webhook removed successfully');
    console.log('Result:', result);
    
  } catch (error) {
    console.error('❌ Failed to remove webhook:', error.message);
    process.exit(1);
  }
}

async function testWebhookEndpoint(baseUrl) {
  const webhookUrl = baseUrl.replace('/telegram/webhook', '');
  const testUrls = [
    `${webhookUrl}/telegram/test`,
    `${webhookUrl}/telegram/webhook/health`,
    `${webhookUrl}/telegram`
  ];
  
  for (const url of testUrls) {
    try {
      console.log(`  Testing: ${url}`);
      const response = await testEndpoint(url);
      console.log(`  ✅ Status: ${response.statusCode}`);
      
      if (response.statusCode === 200) {
        try {
          const data = JSON.parse(response.body);
          console.log(`  📄 Response:`, data);
        } catch (e) {
          console.log(`  📄 Response: ${response.body.substring(0, 100)}...`);
        }
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
  }
}

// Main
const command = process.argv[2];
const arg = process.argv[3];

switch (command) {
  case 'configure':
    if (!arg) {
      console.error('❌ Usage: node webhook-config.js configure <webhook-url>');
      process.exit(1);
    }
    configureWebhook(arg);
    break;
    
  case 'status':
    getWebhookStatus();
    break;
    
  case 'remove':
    removeWebhook();
    break;
    
  case 'test':
    if (!arg) {
      console.error('❌ Usage: node webhook-config.js test <base-url>');
      process.exit(1);
    }
    testWebhookEndpoint(arg);
    break;
    
  default:
    console.log('🤖 Telegram Webhook Configuration Tool');
    console.log('');
    console.log('Usage:');
    console.log('  node webhook-config.js configure <webhook-url>  - Configure webhook');
    console.log('  node webhook-config.js status                   - Get webhook status');
    console.log('  node webhook-config.js remove                   - Remove webhook');
    console.log('  node webhook-config.js test <base-url>          - Test endpoints');
    console.log('');
    console.log('Examples:');
    console.log('  node webhook-config.js configure https://staging-telegram-trading-bot-d6u2.encr.app/telegram/webhook');
    console.log('  node webhook-config.js test https://staging-telegram-trading-bot-d6u2.encr.app');
    console.log('');
    console.log('Environment Variables:');
    console.log('  TELEGRAM_BOT_TOKEN - Required Telegram bot token');
}