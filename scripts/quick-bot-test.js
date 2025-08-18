#!/usr/bin/env node

/**
 * Test Rapido Bot Telegram
 * 
 * Script veloce per testare se il bot risponde
 */

import https from 'https';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BASE_URL = process.argv[2] || 'https://staging-telegram-trading-bot-d6u2.encr.app';

if (!BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN mancante');
  console.log('Imposta il token: export TELEGRAM_BOT_TOKEN=your_token');
  process.exit(1);
}

async function quickTest() {
  console.log('⚡ TEST RAPIDO BOT TELEGRAM');
  console.log('===========================');
  
  try {
    // Test 1: Bot info
    console.log('1️⃣ Test bot info...');
    const botInfo = await telegramRequest('getMe');
    console.log(`   ✅ Bot: @${botInfo.username}`);
    
    // Test 2: Webhook status
    console.log('2️⃣ Test webhook...');
    const webhook = await telegramRequest('getWebhookInfo');
    console.log(`   📍 URL: ${webhook.url || 'NON CONFIGURATO'}`);
    console.log(`   📊 In coda: ${webhook.pending_update_count || 0}`);
    
    if (webhook.last_error_message) {
      console.log(`   ❌ Ultimo errore: ${webhook.last_error_message}`);
    }
    
    // Test 3: Service health
    console.log('3️⃣ Test servizio...');
    const healthUrl = `${BASE_URL}/telegram/webhook/health`;
    const healthResponse = await fetch(healthUrl);
    
    if (healthResponse.ok) {
      console.log('   ✅ Servizio online');
    } else {
      console.log(`   ❌ Servizio offline (${healthResponse.status})`);
    }
    
    // Risultato
    const webhookOk = webhook.url && webhook.url.includes(BASE_URL);
    const serviceOk = healthResponse.ok;
    
    if (webhookOk && serviceOk) {
      console.log('');
      console.log('✅ TUTTO OK - Il bot dovrebbe funzionare');
      console.log('');
      console.log('🧪 Prova a inviare /start al bot');
    } else {
      console.log('');
      console.log('❌ PROBLEMI RILEVATI');
      console.log('');
      console.log('🔧 Esegui riparazione:');
      console.log(`node scripts/diagnose-and-fix-bot.js ${BASE_URL}`);
    }
    
  } catch (error) {
    console.error('❌ Errore:', error.message);
    console.log('');
    console.log('🔧 Esegui diagnosi completa:');
    console.log(`node scripts/diagnose-and-fix-bot.js ${BASE_URL}`);
  }
}

async function telegramRequest(method) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;
  const response = await fetch(url, { method: 'POST' });
  const data = await response.json();
  
  if (data.ok) {
    return data.result;
  } else {
    throw new Error(data.description);
  }
}

quickTest();
