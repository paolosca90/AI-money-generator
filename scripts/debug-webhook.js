#!/usr/bin/env node

/**
 * Advanced Webhook Debugging Script
 * 
 * This script provides comprehensive debugging for the Telegram webhook issue.
 * It tests all endpoints and provides detailed diagnostics.
 */

import https from 'https';
import http from 'http';

// Configuration
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BASE_URL = process.argv[2] || 'https://staging-telegram-trading-bot-d6u2.encr.app';

// Mock Telegram updates for testing
const mockUpdates = {
  validMessage: {
    update_id: 123456789,
    message: {
      message_id: 1,
      from: {
        id: 12345,
        is_bot: false,
        first_name: "Test",
        username: "testuser"
      },
      chat: {
        id: 12345,
        type: "private"
      },
      date: Math.floor(Date.now() / 1000),
      text: "/start"
    }
  },
  validCallback: {
    update_id: 123456790,
    callback_query: {
      id: "test_callback",
      from: {
        id: 12345,
        is_bot: false,
        first_name: "Test"
      },
      message: {
        message_id: 1,
        chat: {
          id: 12345,
          type: "private"
        },
        date: Math.floor(Date.now() / 1000)
      },
      data: "test_data"
    }
  },
  invalidUpdate: {
    // Missing update_id
    message: {
      message_id: 1,
      text: "test"
    }
  },
  emptyUpdate: {}
};

// HTTP request helper
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    const requestOptions = {
      method: 'GET',
      timeout: 10000,
      ...options
    };

    const req = protocol.request(url, requestOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = body ? JSON.parse(body) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: result,
            rawBody: body
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body,
            rawBody: body
          });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Test individual endpoint
async function testEndpoint(name, url, options = {}) {
  console.log(`\n🧪 Testing ${name}:`);
  console.log(`   URL: ${url}`);
  
  try {
    const result = await makeRequest(url, options);
    
    if (result.statusCode === 200) {
      console.log(`   ✅ Status: ${result.statusCode} OK`);
      if (typeof result.body === 'object') {
        console.log(`   📄 Response:`, JSON.stringify(result.body, null, 4));
      } else {
        console.log(`   📄 Response: ${result.body}`);
      }
    } else {
      console.log(`   ❌ Status: ${result.statusCode}`);
      console.log(`   📄 Response: ${result.rawBody}`);
    }
    
    return result;
  } catch (error) {
    console.log(`   💥 Error: ${error.message}`);
    return { error: error.message };
  }
}

// Test webhook with specific update
async function testWebhookWithUpdate(name, update) {
  const url = `${BASE_URL}/telegram/webhook`;
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(update)
  };
  
  return await testEndpoint(`Webhook - ${name}`, url, options);
}

// Get Telegram webhook info
async function getTelegramWebhookInfo() {
  if (!BOT_TOKEN) {
    console.log('\n⚠️ TELEGRAM_BOT_TOKEN not set, skipping Telegram API check');
    return null;
  }

  console.log('\n📡 Getting Telegram webhook info...');
  
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`;
    const result = await makeRequest(url);
    
    if (result.statusCode === 200 && result.body.ok) {
      console.log('   ✅ Telegram API response:');
      console.log(JSON.stringify(result.body.result, null, 4));
      return result.body.result;
    } else {
      console.log('   ❌ Telegram API error:', result.body);
      return null;
    }
  } catch (error) {
    console.log('   💥 Error:', error.message);
    return null;
  }
}

// Main debugging function
async function runDiagnostics() {
  console.log('🔍 TELEGRAM WEBHOOK DIAGNOSTICS');
  console.log('================================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Bot Token: ${BOT_TOKEN ? 'Set' : 'Not set'}`);
  console.log('');

  // Test 1: Basic connectivity
  console.log('📋 PHASE 1: BASIC CONNECTIVITY');
  await testEndpoint('Service Root', `${BASE_URL}/telegram`);
  await testEndpoint('Test Endpoint', `${BASE_URL}/telegram/test`);
  await testEndpoint('Health Check', `${BASE_URL}/telegram/webhook/health`);

  // Test 2: Webhook endpoint tests
  console.log('\n📋 PHASE 2: WEBHOOK ENDPOINT TESTS');
  await testWebhookWithUpdate('Valid Message', mockUpdates.validMessage);
  await testWebhookWithUpdate('Valid Callback', mockUpdates.validCallback);
  await testWebhookWithUpdate('Invalid Update', mockUpdates.invalidUpdate);
  await testWebhookWithUpdate('Empty Update', mockUpdates.emptyUpdate);

  // Test 3: Webhook management endpoints
  console.log('\n📋 PHASE 3: WEBHOOK MANAGEMENT');
  await testEndpoint('Webhook Info', `${BASE_URL}/telegram/webhook/info`);

  // Test 4: Telegram API status
  console.log('\n📋 PHASE 4: TELEGRAM API STATUS');
  const webhookInfo = await getTelegramWebhookInfo();

  // Summary and recommendations
  console.log('\n📋 DIAGNOSTIC SUMMARY');
  console.log('====================');
  
  if (webhookInfo) {
    if (webhookInfo.url) {
      console.log(`✅ Webhook URL configured: ${webhookInfo.url}`);
      
      if (webhookInfo.pending_update_count > 0) {
        console.log(`⚠️ Pending updates: ${webhookInfo.pending_update_count}`);
      }
      
      if (webhookInfo.last_error_date) {
        const errorDate = new Date(webhookInfo.last_error_date * 1000);
        console.log(`❌ Last error: ${webhookInfo.last_error_message} (${errorDate.toISOString()})`);
      }
    } else {
      console.log('❌ No webhook URL configured');
    }
  }

  console.log('\n🔧 RECOMMENDED ACTIONS:');
  console.log('1. Verify all endpoints return 200 OK');
  console.log('2. Check webhook URL matches your deployment');
  console.log('3. Reconfigure webhook if needed:');
  console.log(`   TELEGRAM_BOT_TOKEN=${BOT_TOKEN || 'YOUR_TOKEN'} node scripts/webhook-config.js configure ${BASE_URL}/telegram/webhook`);
  console.log('4. Monitor logs for incoming webhook requests');
  console.log('5. Test with a real message to your bot');
}

// Run diagnostics
if (!process.argv[2]) {
  console.log('🔍 Telegram Webhook Diagnostics');
  console.log('');
  console.log('Usage:');
  console.log('  node debug-webhook.js <base-url>');
  console.log('');
  console.log('Examples:');
  console.log('  node debug-webhook.js https://staging-telegram-trading-bot-d6u2.encr.app');
  console.log('  node debug-webhook.js http://localhost:4000');
  console.log('');
  console.log('Environment Variables:');
  console.log('  TELEGRAM_BOT_TOKEN - Your Telegram bot token (optional for API checks)');
  process.exit(1);
}

runDiagnostics().catch(console.error);
