#!/usr/bin/env node

/**
 * Telegram Bot Doctor - Diagnosi e Riparazione Completa
 * 
 * Questo script diagnostica e risolve tutti i problemi comuni del bot Telegram
 */

import https from 'https';
import http from 'http';

const BOT_TOKEN = process.env.8179398505:AAFHnCT91K68GAns4Tl8mSo9WGvFNhOciy8;
const BASE_URL = process.argv[2] || 'https://staging-telegram-trading-bot-d6u2.encr.app';
const WEBHOOK_URL = `${BASE_URL}/telegram/webhook`;

console.log('🏥 TELEGRAM BOT DOCTOR');
console.log('======================');
console.log(`🔗 Base URL: ${BASE_URL}`);
console.log(`🤖 Bot Token: ${BOT_TOKEN ? '✅ Configurato' : '❌ MANCANTE'}`);
console.log(`📡 Webhook URL: ${WEBHOOK_URL}`);
console.log('');

if (!BOT_TOKEN) {
  console.error('❌ ERRORE CRITICO: TELEGRAM_BOT_TOKEN non configurato!');
  console.log('');
  console.log('🔧 SOLUZIONE IMMEDIATA:');
  console.log('1. Vai su https://t.me/BotFather');
  console.log('2. Crea un nuovo bot o usa uno esistente');
  console.log('3. Copia il token del bot');
  console.log('4. Vai su Infrastructure → Secrets in Leap');
  console.log('5. Aggiungi TelegramBotToken con il valore del token');
  console.log('6. Rideploya l\'applicazione');
  console.log('');
  console.log('Poi esegui di nuovo questo script:');
  console.log(`TELEGRAM_BOT_TOKEN=your_token node scripts/telegram-bot-doctor.js ${BASE_URL}`);
  process.exit(1);
}

// Helper per richieste HTTP con timeout e retry
async function makeRequest(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await makeRequestSingle(url, options);
    } catch (error) {
      if (i === retries - 1) throw error;
      console.log(`   ⚠️ Tentativo ${i + 1} fallito, riprovo...`);
      await sleep(1000);
    }
  }
}

function makeRequestSingle(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    const requestOptions = {
      method: 'GET',
      timeout: 15000,
      headers: {
        'User-Agent': 'TelegramBotDoctor/1.0',
        ...options.headers
      },
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
      reject(new Error('Request timeout (15s)'));
    });

    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Helper per API Telegram con retry
async function telegramRequest(method, data = {}, retries = 3) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;
  
  for (let i = 0; i < retries; i++) {
    try {
      const postData = JSON.stringify(data);
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        body: postData
      };

      const response = await makeRequestSingle(url, options);
      
      if (response.statusCode === 200 && response.body.ok) {
        return response.body.result;
      } else {
        throw new Error(`Telegram API error: ${response.body.description || response.rawBody}`);
      }
    } catch (error) {
      if (i === retries - 1) throw error;
      console.log(`   ⚠️ Tentativo API ${i + 1} fallito, riprovo...`);
      await sleep(1000);
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test endpoint con dettagli completi
async function testEndpoint(name, url, options = {}) {
  console.log(`🧪 Test ${name}:`);
  console.log(`   🔗 URL: ${url}`);
  
  try {
    const result = await makeRequest(url, options);
    
    if (result.statusCode === 200) {
      console.log(`   ✅ Status: ${result.statusCode} OK`);
      if (typeof result.body === 'object' && Object.keys(result.body).length > 0) {
        console.log(`   📄 Risposta:`, JSON.stringify(result.body, null, 2));
      } else if (result.rawBody) {
        console.log(`   📄 Risposta: ${result.rawBody.substring(0, 200)}${result.rawBody.length > 200 ? '...' : ''}`);
      }
      return { success: true, result };
    } else {
      console.log(`   ❌ Status: ${result.statusCode}`);
      console.log(`   📄 Errore: ${result.rawBody}`);
      return { success: false, result };
    }
  } catch (error) {
    console.log(`   💥 Errore: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Test webhook con payload reale
async function testWebhookWithPayload(name, payload) {
  const url = `${BASE_URL}/telegram/webhook`;
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Telegram-Bot-Api-Secret-Token': 'test-secret'
    },
    body: JSON.stringify(payload)
  };
  
  return await testEndpoint(`Webhook ${name}`, url, options);
}

// Diagnosi completa del servizio
async function diagnoseService() {
  console.log('🔍 FASE 1: DIAGNOSI SERVIZIO');
  console.log('============================');
  
  const endpoints = [
    { name: 'Root Service', url: `${BASE_URL}/telegram` },
    { name: 'Test Endpoint', url: `${BASE_URL}/telegram/test` },
    { name: 'Health Check', url: `${BASE_URL}/telegram/webhook/health` },
    { name: 'Webhook Info', url: `${BASE_URL}/telegram/webhook/info` }
  ];
  
  let serviceHealthy = true;
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint.name, endpoint.url);
    if (!result.success) {
      serviceHealthy = false;
    }
    console.log('');
  }
  
  return serviceHealthy;
}

// Test webhook con diversi payload
async function testWebhookEndpoint() {
  console.log('🔍 FASE 2: TEST WEBHOOK ENDPOINT');
  console.log('================================');
  
  const testPayloads = [
    {
      name: 'Messaggio Valido',
      payload: {
        update_id: Date.now(),
        message: {
          message_id: 1,
          from: { id: 12345, is_bot: false, first_name: "TestUser" },
          chat: { id: 12345, type: "private" },
          date: Math.floor(Date.now() / 1000),
          text: "/start"
        }
      }
    },
    {
      name: 'Callback Query',
      payload: {
        update_id: Date.now() + 1,
        callback_query: {
          id: "test_callback",
          from: { id: 12345, is_bot: false, first_name: "TestUser" },
          message: {
            message_id: 1,
            chat: { id: 12345, type: "private" },
            date: Math.floor(Date.now() / 1000)
          },
          data: "test_data"
        }
      }
    },
    {
      name: 'Update Invalido',
      payload: {
        // Manca update_id
        message: { message_id: 1, text: "test" }
      }
    },
    {
      name: 'Payload Vuoto',
      payload: {}
    }
  ];
  
  let webhookWorking = true;
  
  for (const test of testPayloads) {
    const result = await testWebhookWithPayload(test.name, test.payload);
    if (!result.success && test.name !== 'Update Invalido') {
      webhookWorking = false;
    }
    console.log('');
  }
  
  return webhookWorking;
}

// Diagnosi Telegram API
async function diagnoseTelegramAPI() {
  console.log('🔍 FASE 3: DIAGNOSI TELEGRAM API');
  console.log('=================================');
  
  try {
    // Test 1: Bot info
    console.log('🤖 Test Bot Info:');
    const botInfo = await telegramRequest('getMe');
    console.log(`   ✅ Bot attivo: @${botInfo.username} (${botInfo.first_name})`);
    console.log(`   🆔 Bot ID: ${botInfo.id}`);
    console.log(`   🔧 Può unirsi ai gruppi: ${botInfo.can_join_groups ? 'Sì' : 'No'}`);
    console.log(`   📝 Può leggere tutti i messaggi: ${botInfo.can_read_all_group_messages ? 'Sì' : 'No'}`);
    console.log('');
    
    // Test 2: Webhook status
    console.log('🔗 Test Webhook Status:');
    const webhookInfo = await telegramRequest('getWebhookInfo');
    console.log(`   📍 URL Webhook: ${webhookInfo.url || 'NON CONFIGURATO'}`);
    console.log(`   📊 Aggiornamenti in coda: ${webhookInfo.pending_update_count || 0}`);
    console.log(`   🔗 Connessioni max: ${webhookInfo.max_connections || 'N/A'}`);
    console.log(`   📋 Aggiornamenti permessi: ${webhookInfo.allowed_updates ? webhookInfo.allowed_updates.join(', ') : 'Tutti'}`);
    
    if (webhookInfo.last_error_date) {
      const errorDate = new Date(webhookInfo.last_error_date * 1000);
      console.log(`   ❌ Ultimo errore: ${webhookInfo.last_error_message}`);
      console.log(`   📅 Data errore: ${errorDate.toLocaleString()}`);
    } else {
      console.log(`   ✅ Nessun errore recente`);
    }
    
    console.log('');
    
    // Verifica URL webhook
    const expectedUrl = WEBHOOK_URL;
    if (webhookInfo.url === expectedUrl) {
      console.log('   ✅ URL Webhook corretto');
      return { botOk: true, webhookOk: true, webhookInfo };
    } else if (!webhookInfo.url) {
      console.log('   ⚠️ Webhook non configurato');
      return { botOk: true, webhookOk: false, webhookInfo };
    } else {
      console.log(`   ❌ URL Webhook errato!`);
      console.log(`      Atteso: ${expectedUrl}`);
      console.log(`      Attuale: ${webhookInfo.url}`);
      return { botOk: true, webhookOk: false, webhookInfo };
    }
    
  } catch (error) {
    console.log(`   ❌ Errore API Telegram: ${error.message}`);
    return { botOk: false, webhookOk: false, error: error.message };
  }
}

// Riparazione automatica
async function autoRepair() {
  console.log('🔧 FASE 4: RIPARAZIONE AUTOMATICA');
  console.log('==================================');
  
  try {
    // Step 1: Rimuovi webhook esistente
    console.log('1️⃣ Rimozione webhook esistente...');
    try {
      await telegramRequest('deleteWebhook', { drop_pending_updates: true });
      console.log('   ✅ Webhook rimosso (aggiornamenti in coda eliminati)');
    } catch (error) {
      console.log(`   ⚠️ Errore rimozione webhook: ${error.message}`);
    }
    
    // Step 2: Attesa
    console.log('2️⃣ Attesa 3 secondi per stabilizzazione...');
    await sleep(3000);
    
    // Step 3: Test servizio prima di configurare
    console.log('3️⃣ Verifica servizio prima della configurazione...');
    const healthTest = await testEndpoint('Pre-config Health', `${BASE_URL}/telegram/webhook/health`);
    
    if (!healthTest.success) {
      console.log('   ❌ Servizio non risponde! Impossibile configurare webhook.');
      console.log('   🔧 Verifica che l\'applicazione sia deployata e funzionante.');
      return false;
    }
    
    // Step 4: Configura nuovo webhook
    console.log('4️⃣ Configurazione nuovo webhook...');
    const webhookConfig = {
      url: WEBHOOK_URL,
      allowed_updates: ['message', 'callback_query'],
      max_connections: 40,
      drop_pending_updates: true,
      secret_token: 'ai-trading-bot-secret-2024'
    };
    
    await telegramRequest('setWebhook', webhookConfig);
    console.log('   ✅ Nuovo webhook configurato');
    console.log(`   🔗 URL: ${WEBHOOK_URL}`);
    
    // Step 5: Verifica configurazione
    console.log('5️⃣ Verifica configurazione...');
    await sleep(2000);
    
    const newWebhookInfo = await telegramRequest('getWebhookInfo');
    
    if (newWebhookInfo.url === WEBHOOK_URL) {
      console.log('   ✅ Webhook configurato correttamente');
      console.log(`   📊 Aggiornamenti in coda: ${newWebhookInfo.pending_update_count || 0}`);
      
      // Step 6: Test finale
      console.log('6️⃣ Test finale del webhook...');
      const finalTest = await testWebhookWithPayload('Test Finale', {
        update_id: Date.now(),
        message: {
          message_id: 1,
          from: { id: 12345, is_bot: false, first_name: "TestFinale" },
          chat: { id: 12345, type: "private" },
          date: Math.floor(Date.now() / 1000),
          text: "/start"
        }
      });
      
      if (finalTest.success) {
        console.log('   ✅ Test finale superato!');
        return true;
      } else {
        console.log('   ❌ Test finale fallito');
        return false;
      }
    } else {
      console.log('   ❌ Configurazione webhook fallita');
      console.log(`      Atteso: ${WEBHOOK_URL}`);
      console.log(`      Ottenuto: ${newWebhookInfo.url}`);
      return false;
    }
    
  } catch (error) {
    console.log(`   ❌ Errore durante riparazione: ${error.message}`);
    return false;
  }
}

// Test manuale guidato
async function guidedManualTest() {
  console.log('🧪 FASE 5: TEST MANUALE GUIDATO');
  console.log('================================');
  
  try {
    const botInfo = await telegramRequest('getMe');
    const botUsername = botInfo.username;
    
    console.log('📱 ISTRUZIONI PER TEST MANUALE:');
    console.log('');
    console.log(`1. Apri Telegram sul tuo telefono o computer`);
    console.log(`2. Cerca il bot: @${botUsername}`);
    console.log(`3. Avvia una conversazione cliccando "START" o inviando /start`);
    console.log(`4. Il bot dovrebbe rispondere entro 5-10 secondi`);
    console.log('');
    console.log('✅ RISPOSTE ATTESE:');
    console.log('   • Messaggio di benvenuto con setup guidato');
    console.log('   • Menu con pulsanti interattivi');
    console.log('   • Richiesta di configurazione modalità trading');
    console.log('');
    console.log('❌ SE IL BOT NON RISPONDE:');
    console.log('   • Attendi 30 secondi e riprova');
    console.log('   • Controlla i logs dell\'applicazione');
    console.log('   • Esegui di nuovo questo script');
    console.log('');
    console.log('🔍 COMANDI DI TEST:');
    console.log('   /start - Avvia il bot');
    console.log('   /help - Mostra aiuto');
    console.log('   /status - Stato del sistema');
    console.log('   /segnale BTCUSD - Test analisi AI');
    
  } catch (error) {
    console.log(`❌ Impossibile ottenere info bot: ${error.message}`);
  }
}

// Funzione principale
async function main() {
  try {
    console.log('🚀 Avvio diagnosi completa...');
    console.log('');
    
    // Fase 1: Diagnosi servizio
    const serviceHealthy = await diagnoseService();
    
    // Fase 2: Test webhook
    const webhookWorking = await testWebhookEndpoint();
    
    // Fase 3: Diagnosi Telegram API
    const telegramStatus = await diagnoseTelegramAPI();
    
    // Valutazione risultati
    console.log('📊 RISULTATI DIAGNOSI');
    console.log('=====================');
    console.log(`🖥️ Servizio: ${serviceHealthy ? '✅ Funzionante' : '❌ Problemi rilevati'}`);
    console.log(`🔗 Webhook Endpoint: ${webhookWorking ? '✅ Funzionante' : '❌ Problemi rilevati'}`);
    console.log(`🤖 Bot Telegram: ${telegramStatus.botOk ? '✅ Attivo' : '❌ Problemi rilevati'}`);
    console.log(`📡 Webhook Config: ${telegramStatus.webhookOk ? '✅ Corretto' : '❌ Da configurare'}`);
    console.log('');
    
    // Decisione riparazione
    if (serviceHealthy && telegramStatus.botOk && !telegramStatus.webhookOk) {
      console.log('🔧 RIPARAZIONE NECESSARIA: Webhook non configurato correttamente');
      console.log('');
      
      const repairSuccess = await autoRepair();
      
      if (repairSuccess) {
        console.log('');
        console.log('🎉 RIPARAZIONE COMPLETATA CON SUCCESSO!');
        console.log('');
        await guidedManualTest();
      } else {
        console.log('');
        console.log('❌ RIPARAZIONE FALLITA');
        console.log('');
        console.log('🔧 AZIONI MANUALI NECESSARIE:');
        console.log('1. Verifica che il servizio sia deployato correttamente');
        console.log('2. Controlla i logs dell\'applicazione per errori');
        console.log('3. Verifica la configurazione TelegramBotToken nei secrets');
        console.log('4. Prova a ridepployare l\'applicazione');
      }
    } else if (!serviceHealthy) {
      console.log('❌ PROBLEMA CRITICO: Il servizio non risponde');
      console.log('');
      console.log('🔧 SOLUZIONI:');
      console.log('1. Verifica che l\'applicazione sia deployata');
      console.log('2. Controlla i logs per errori di avvio');
      console.log('3. Verifica la configurazione dei secrets');
      console.log('4. Prova a ridepployare con: encore env deploy staging');
    } else if (!telegramStatus.botOk) {
      console.log('❌ PROBLEMA CRITICO: Bot Telegram non accessibile');
      console.log('');
      console.log('🔧 SOLUZIONI:');
      console.log('1. Verifica che il token sia corretto');
      console.log('2. Controlla che il bot non sia stato disabilitato');
      console.log('3. Prova a creare un nuovo bot con @BotFather');
    } else {
      console.log('✅ TUTTO FUNZIONANTE!');
      console.log('');
      console.log('Il bot dovrebbe rispondere correttamente.');
      console.log('');
      await guidedManualTest();
    }
    
  } catch (error) {
    console.error('💥 ERRORE CRITICO:', error.message);
    console.log('');
    console.log('🆘 SUPPORTO:');
    console.log('1. Verifica la connessione internet');
    console.log('2. Controlla che tutti i servizi siano online');
    console.log('3. Prova a eseguire di nuovo lo script tra qualche minuto');
    process.exit(1);
  }
}

// Esegui diagnosi
if (!process.argv[2]) {
  console.log('🏥 Telegram Bot Doctor');
  console.log('');
  console.log('Uso:');
  console.log('  TELEGRAM_BOT_TOKEN=your_token node scripts/telegram-bot-doctor.js <base-url>');
  console.log('');
  console.log('Esempi:');
  console.log('  TELEGRAM_BOT_TOKEN=123:ABC node scripts/telegram-bot-doctor.js https://staging-telegram-trading-bot-d6u2.encr.app');
  console.log('  TELEGRAM_BOT_TOKEN=123:ABC node scripts/telegram-bot-doctor.js http://localhost:4000');
  console.log('');
  console.log('Variabili Ambiente:');
  console.log('  TELEGRAM_BOT_TOKEN - Token del bot Telegram (obbligatorio)');
  process.exit(1);
}

main().catch(console.error);
