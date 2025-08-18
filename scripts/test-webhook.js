#!/usr/bin/env node

/**
 * Simple webhook endpoint test
 * Tests the webhook endpoint functionality locally without Encore dependencies
 */

import http from 'http';
import https from 'https';

// Mock Telegram update for testing
const mockTelegramUpdate = {
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
    text: "/test"
  }
};

// Mock invalid update for testing
const mockInvalidUpdate = {
  // Missing update_id
  message: {
    message_id: 1,
    text: "test"
  }
};

function testWebhookEndpoint(baseUrl, update) {
  const url = `${baseUrl}/telegram/webhook`;
  const postData = JSON.stringify(update);
  
  return new Promise((resolve, reject) => {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const protocol = baseUrl.startsWith('https:') ? https : http;
    const req = protocol.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: result
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.write(postData);
    req.end();
  });
}

function testHealthEndpoint(baseUrl) {
  const url = `${baseUrl}/telegram/webhook/health`;
  
  return new Promise((resolve, reject) => {
    const protocol = baseUrl.startsWith('https:') ? https : http;
    const req = protocol.request(url, { method: 'GET' }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({
            statusCode: res.statusCode,
            body: result
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            body: body
          });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });
}

async function runTests(baseUrl) {
  console.log(`🧪 Testing webhook endpoints at: ${baseUrl}`);
  console.log('');

  // Test 1: Health check
  console.log('1. Testing health endpoint...');
  try {
    const health = await testHealthEndpoint(baseUrl);
    if (health.statusCode === 200) {
      console.log('  ✅ Health check passed');
      console.log('  📊 Response:', health.body);
    } else {
      console.log(`  ❌ Health check failed: ${health.statusCode}`);
    }
  } catch (error) {
    console.log(`  ❌ Health check error: ${error.message}`);
  }
  console.log('');

  // Test 2: Valid webhook update
  console.log('2. Testing webhook with valid update...');
  try {
    const result = await testWebhookEndpoint(baseUrl, mockTelegramUpdate);
    if (result.statusCode === 200 && result.body.ok) {
      console.log('  ✅ Valid update test passed');
      console.log('  📊 Response:', result.body);
    } else {
      console.log(`  ❌ Valid update test failed: ${result.statusCode}`);
      console.log('  📊 Response:', result.body);
    }
  } catch (error) {
    console.log(`  ❌ Valid update test error: ${error.message}`);
  }
  console.log('');

  // Test 3: Invalid webhook update
  console.log('3. Testing webhook with invalid update...');
  try {
    const result = await testWebhookEndpoint(baseUrl, mockInvalidUpdate);
    if (result.statusCode === 200) {
      console.log('  ✅ Invalid update test passed');
      console.log('  📊 Response:', result.body);
      
      // Check if error handling worked
      if (result.body.ok === false) {
        console.log('  ✅ Error handling working correctly');
      } else {
        console.log('  ⚠️ Error handling might need attention');
      }
    } else {
      console.log(`  ❌ Invalid update test failed: ${result.statusCode}`);
    }
  } catch (error) {
    console.log(`  ❌ Invalid update test error: ${error.message}`);
  }
  console.log('');

  console.log('🏁 Test completed!');
  console.log('');
  console.log('Next steps:');
  console.log('1. If tests fail, check if the service is running');
  console.log('2. Configure webhook: TELEGRAM_BOT_TOKEN=xxx node scripts/webhook-config.js configure <webhook-url>');
  console.log('3. Monitor logs for webhook requests from Telegram');
}

// Main
const baseUrl = process.argv[2];

if (!baseUrl) {
  console.log('🧪 Webhook Test Tool');
  console.log('');
  console.log('Usage:');
  console.log('  node test-webhook.js <base-url>');
  console.log('');
  console.log('Examples:');
  console.log('  node test-webhook.js https://staging-telegram-trading-bot-d6u2.encr.app');
  console.log('  node test-webhook.js http://localhost:4000');
  process.exit(1);
}

runTests(baseUrl).catch(console.error);