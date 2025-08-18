#!/usr/bin/env node

/**
 * Quick Webhook Fix Script
 * 
 * This script attempts to automatically fix the webhook 404 issue
 * by reconfiguring the webhook and testing the endpoints.
 */

import https from 'https';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BASE_URL = process.argv[2] || 'https://staging-telegram-trading-bot-d6u2.encr.app';
const WEBHOOK_URL = `${BASE_URL}/telegram/webhook`;

if (!BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN environment variable is required');
  console.log('');
  console.log('Set it like this:');
  console.log('  export TELEGRAM_BOT_TOKEN=your_bot_token_here');
  console.log('  node scripts/fix-webhook.js');
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

// Test endpoint
async function testEndpoint(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : require('http');
    
    const req = protocol.request(url, { method: 'GET' }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
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

async function fixWebhook() {
  console.log('🔧 TELEGRAM WEBHOOK FIX');
  console.log('========================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Webhook URL: ${WEBHOOK_URL}`);
  console.log('');

  // Step 1: Test current webhook endpoint
  console.log('1️⃣ Testing webhook endpoint...');
  try {
    const healthCheck = await testEndpoint(`${BASE_URL}/telegram/webhook/health`);
    if (healthCheck.statusCode === 200) {
      console.log('   ✅ Webhook endpoint is responding');
    } else {
      console.log(`   ❌ Webhook endpoint returned: ${healthCheck.statusCode}`);
    }
  } catch (error) {
    console.log(`   ❌ Webhook endpoint error: ${error.message}`);
    console.log('   🚨 The service might not be deployed or running');
    return;
  }

  // Step 2: Get current webhook status
  console.log('\n2️⃣ Getting current webhook status...');
  try {
    const currentStatus = await telegramRequest('getWebhookInfo');
    console.log('   📊 Current webhook info:');
    console.log(`      URL: ${currentStatus.url || 'Not set'}`);
    console.log(`      Pending updates: ${currentStatus.pending_update_count || 0}`);
    if (currentStatus.last_error_message) {
      console.log(`      Last error: ${currentStatus.last_error_message}`);
    }
  } catch (error) {
    console.log(`   ❌ Failed to get webhook status: ${error.message}`);
  }

  // Step 3: Remove existing webhook
  console.log('\n3️⃣ Removing existing webhook...');
  try {
    await telegramRequest('deleteWebhook');
    console.log('   ✅ Existing webhook removed');
  } catch (error) {
    console.log(`   ⚠️ Failed to remove webhook: ${error.message}`);
  }

  // Step 4: Set new webhook
  console.log('\n4️⃣ Setting new webhook...');
  try {
    const result = await telegramRequest('setWebhook', {
      url: WEBHOOK_URL,
      allowed_updates: ['message', 'callback_query'],
      max_connections: 40,
      drop_pending_updates: true  // Clear pending updates
    });
    console.log('   ✅ New webhook configured successfully');
  } catch (error) {
    console.log(`   ❌ Failed to set webhook: ${error.message}`);
    return;
  }

  // Step 5: Verify new webhook
  console.log('\n5️⃣ Verifying new webhook...');
  try {
    const newStatus = await telegramRequest('getWebhookInfo');
    console.log('   📊 New webhook info:');
    console.log(`      URL: ${newStatus.url}`);
    console.log(`      Pending updates: ${newStatus.pending_update_count}`);
    console.log(`      Max connections: ${newStatus.max_connections}`);
    
    if (newStatus.url === WEBHOOK_URL) {
      console.log('   ✅ Webhook URL matches expected URL');
    } else {
      console.log('   ❌ Webhook URL mismatch!');
    }
  } catch (error) {
    console.log(`   ❌ Failed to verify webhook: ${error.message}`);
  }

  // Step 6: Final test
  console.log('\n6️⃣ Final connectivity test...');
  try {
    const testResponse = await testEndpoint(`${BASE_URL}/telegram/test`);
    if (testResponse.statusCode === 200) {
      console.log('   ✅ Service is responding correctly');
    } else {
      console.log(`   ❌ Service test failed: ${testResponse.statusCode}`);
    }
  } catch (error) {
    console.log(`   ❌ Service test error: ${error.message}`);
  }

  console.log('\n🎉 WEBHOOK FIX COMPLETED!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Send a test message to your bot (e.g., /start)');
  console.log('2. Check the application logs for webhook requests');
  console.log('3. If issues persist, run: node scripts/debug-webhook.js');
  console.log('');
  console.log('Monitor webhook status with:');
  console.log(`  TELEGRAM_BOT_TOKEN=${BOT_TOKEN} node scripts/webhook-config.js status`);
}

// Run the fix
fixWebhook().catch(console.error);
