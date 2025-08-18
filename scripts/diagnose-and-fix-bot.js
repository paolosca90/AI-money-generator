#!/usr/bin/env node

/**
 * Script di Diagnosi e Riparazione Automatica del Bot Telegram
 * 
 * Questo script diagnostica e risolve automaticamente i problemi comuni
 * del bot Telegram quando smette di rispondere.
 */

import https from 'https';
import http from 'http';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BASE_URL = process.argv[2] || 'https://staging-telegram-trading-bot-d6u2.encr.app';
const WEBHOOK_URL = `${BASE_URL}/telegram/webhook`;

console.log('🔧 DIAGNOSI E RIPARAZIONE BOT TELEGRAM');
console.log('=====================================');
console.log(`Base URL: ${BASE_URL}`);
console.log(`Bot Token: ${BOT_TOKEN ? 'Configurato' : 'MANCANTE'}`);
console.log('');

if (!BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN non configurato!');
  console.log('');
  console.log('🔧 SOLUZIONE:');
  console.log('1. Vai su Infrastructure → Secrets');
  console.log('2. Imposta TelegramBotToken con il token del tuo bot');
  console.log('3. Rideploya l\'applicazione');
  process.exit(1);
}

// Helper per richieste HTTP
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

// Helper per API Telegram
async function telegramRequest(method, data = {}) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;
  
  const postData = JSON.stringify(data);
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    },
    body: postData
  };

  const response = await makeRequest(url, options);
  
  if (response.statusCode === 200 && response.body.ok) {
    return response.body.result;
  } else {
    throw new Error(`Telegram API error: ${response.body.description || response.rawBody}`);
  }
}

// Test endpoint specifico
async function testEndpoint(name, url, options = {}) {
  console.log(`🧪 Test ${name}:`);
  
  try {
    const result = await makeRequest(url, options);
    
    if (result.statusCode === 200) {
      console.log(`   ✅ OK (${result.statusCode})`);
      if (typeof result.body === 'object' && Object.keys(result.body).length > 0) {
        console.log(`   📄 Risposta:`, JSON.stringify(result.body, null, 2));
      }
      return true;
    } else {
      console.log(`   ❌ ERRORE (${result.statusCode})`);
      console.log(`   📄 Risposta: ${result.rawBody}`);
      return false;
    }
  } catch (error) {
    console.log(`   💥 ERRORE: ${error.message}`);
    return false;
  }
}

// Diagnosi completa
async function runDiagnosis() {
  console.log('📋 FASE 1: DIAGNOSI SERVIZIO');
  console.log('============================');
  
  const serviceTests = [
    { name: 'Servizio Base', url: `${BASE_URL}/telegram` },
    { name: 'Test Endpoint', url: `${BASE_URL}/telegram/test` },
    { name: 'Health Check', url: `${BASE_URL}/telegram/webhook/health` },
    { name: 'Webhook Endpoint', url: `${BASE_URL}/telegram/webhook`, options: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        update_id: 123456789,
        message: {
          message_id: 1,
          from: { id: 12345, is_bot: false, first_name: "Test" },
          chat: { id: 12345, type: "private" },
          date: Math.floor(Date.now() / 1000),
          text: "/test"
        }
      })
    }}
  ];
  
  let serviceOk = true;
  for (const test of serviceTests) {
    const result = await testEndpoint(test.name, test.url, test.options);
    if (!result) serviceOk = false;
  }
  
  console.log('');
  console.log('📋 FASE 2: DIAGNOSI TELEGRAM API');
  console.log('=================================');
  
  // Test bot info
  try {
    console.log('🤖 Test Bot Info:');
    const botInfo = await telegramRequest('getMe');
    console.log(`   ✅ Bot attivo: @${botInfo.username} (${botInfo.first_name})`);
  } catch (error) {
    console.log(`   ❌ ERRORE Bot Info: ${error.message}`);
    return false;
  }
  
  // Test webhook status
  try {
    console.log('🔗 Test Webhook Status:');
    const webhookInfo = await telegramRequest('getWebhookInfo');
    console.log(`   📍 URL Webhook: ${webhookInfo.url || 'NON CONFIGURATO'}`);
    console.log(`   📊 Aggiornamenti in coda: ${webhookInfo.pending_update_count || 0}`);
    
    if (webhookInfo.last_error_date) {
      const errorDate = new Date(webhookInfo.last_error_date * 1000);
      console.log(`   ❌ Ultimo errore: ${webhookInfo.last_error_message}`);
      console.log(`   📅 Data errore: ${errorDate.toLocaleString()}`);
    }
    
    // Verifica se il webhook è configurato correttamente
    if (webhookInfo.url !== WEBHOOK_URL) {
      console.log(`   ⚠️ PROBLEMA: Webhook URL non corrisponde!`);
      console.log(`      Atteso: ${WEBHOOK_URL}`);
      console.log(`      Attuale: ${webhookInfo.url}`);
      return false;
    } else {
      console.log(`   ✅ URL Webhook corretto`);
    }
    
  } catch (error) {
    console.log(`   ❌ ERRORE Webhook Status: ${error.message}`);
    return false;
  }
  
  return serviceOk;
}

// Riparazione automatica
async function autoFix() {
  console.log('');
  console.log('🔧 FASE 3: RIPARAZIONE AUTOMATICA');
  console.log('==================================');
  
  try {
    // Step 1: Rimuovi webhook esistente
    console.log('1️⃣ Rimozione webhook esistente...');
    await telegramRequest('deleteWebhook');
    console.log('   ✅ Webhook rimosso');
    
    // Step 2: Attendi un momento
    console.log('2️⃣ Attesa 2 secondi...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 3: Configura nuovo webhook
    console.log('3️⃣ Configurazione nuovo webhook...');
    await telegramRequest('setWebhook', {
      url: WEBHOOK_URL,
      allowed_updates: ['message', 'callback_query'],
      max_connections: 40,
      drop_pending_updates: true  // Elimina aggiornamenti in coda
    });
    console.log('   ✅ Nuovo webhook configurato');
    
    // Step 4: Verifica configurazione
    console.log('4️⃣ Verifica configurazione...');
    const newWebhookInfo = await telegramRequest('getWebhookInfo');
    
    if (newWebhookInfo.url === WEBHOOK_URL) {
      console.log('   ✅ Webhook configurato correttamente');
      console.log(`   📊 Aggiornamenti in coda: ${newWebhookInfo.pending_update_count || 0}`);
      return true;
    } else {
      console.log('   ❌ Configurazione webhook fallita');
      return false;
    }
    
  } catch (error) {
    console.log(`   ❌ ERRORE durante riparazione: ${error.message}`);
    return false;
  }
}

// Test finale
async function finalTest() {
  console.log('');
  console.log('🧪 FASE 4: TEST FINALE');
  console.log('======================');
  
  // Test webhook endpoint
  const webhookTest = await testEndpoint('Webhook Finale', WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      update_id: Date.now(),
      message: {
        message_id: 1,
        from: { id: 12345, is_bot: false, first_name: "TestFinale" },
        chat: { id: 12345, type: "private" },
        date: Math.floor(Date.now() / 1000),
        text: "/start"
      }
    })
  });
  
  return webhookTest;
}

// Funzione principale
async function main() {
  try {
    // Diagnosi
    const diagnosisOk = await runDiagnosis();
    
    if (!diagnosisOk) {
      console.log('');
      console.log('🚨 PROBLEMI RILEVATI - Avvio riparazione automatica...');
      
      const fixOk = await autoFix();
      
      if (fixOk) {
        const testOk = await finalTest();
        
        if (testOk) {
          console.log('');
          console.log('🎉 RIPARAZIONE COMPLETATA CON SUCCESSO!');
          console.log('');
          console.log('✅ Il bot dovrebbe ora rispondere correttamente.');
          console.log('');
          console.log('🧪 TEST MANUALE:');
          console.log('1. Apri Telegram');
          console.log('2. Invia /start al tuo bot');
          console.log('3. Verifica che risponda');
        } else {
          console.log('');
          console.log('❌ RIPARAZIONE FALLITA');
          console.log('');
          console.log('🔧 AZIONI MANUALI NECESSARIE:');
          console.log('1. Verifica che il servizio sia deployato correttamente');
          console.log('2. Controlla i logs dell\'applicazione');
          console.log('3. Verifica la configurazione dei secrets');
        }
      } else {
        console.log('');
        console.log('❌ RIPARAZIONE AUTOMATICA FALLITA');
      }
    } else {
      console.log('');
      console.log('✅ DIAGNOSI COMPLETATA - Nessun problema rilevato');
      console.log('');
      console.log('🤔 Il bot sembra configurato correttamente.');
      console.log('');
      console.log('🔍 POSSIBILI CAUSE:');
      console.log('1. Il bot potrebbe essere in ritardo nelle risposte');
      console.log('2. Problemi temporanei di rete');
      console.log('3. Il bot potrebbe essere bloccato da Telegram');
      console.log('');
      console.log('🧪 PROVA:');
      console.log('1. Invia /start al bot e attendi 30 secondi');
      console.log('2. Se non risponde, controlla i logs dell\'applicazione');
    }
    
  } catch (error) {
    console.error('💥 ERRORE CRITICO:', error.message);
    process.exit(1);
  }
}

// Esegui diagnosi e riparazione
main().catch(console.error);
