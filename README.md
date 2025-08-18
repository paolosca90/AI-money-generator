# 🤖 AI Trading Bot - Telegram Integration

## 🚨 Bot Non Risponde? Risoluzione Automatica

Se il bot Telegram ha smesso di rispondere, usa questo script per diagnosticare e risolvere automaticamente il problema:

### 🔧 Riparazione Automatica (Raccomandato)

```bash
# Imposta il token del bot
export TELEGRAM_BOT_TOKEN=your_bot_token_here

# Esegui diagnosi e riparazione automatica
node scripts/telegram-bot-doctor.js https://staging-telegram-trading-bot-d6u2.encr.app
```

### ⚡ Test Rapido

```bash
# Test veloce per verificare lo stato
export TELEGRAM_BOT_TOKEN=your_bot_token_here
node scripts/quick-bot-test.js https://staging-telegram-trading-bot-d6u2.encr.app
```

### 🔍 Diagnosi Manuale (Se gli script automatici non funzionano)

```bash
# Test completo degli endpoint
node scripts/debug-webhook.js https://staging-telegram-trading-bot-d6u2.encr.app

# Configurazione manuale webhook
node scripts/webhook-config.js configure https://staging-telegram-trading-bot-d6u2.encr.app/telegram/webhook

# Verifica stato webhook
node scripts/webhook-config.js status
```

## 🎯 Problemi Comuni e Soluzioni

### 1. Bot Token Non Configurato
**Sintomi**: Bot non risponde, errori di autenticazione
**Soluzione**:
1. Vai su Infrastructure → Secrets
2. Imposta `TelegramBotToken` con il token del tuo bot
3. Rideploya l'applicazione

### 2. Webhook Non Configurato
**Sintomi**: Bot non riceve messaggi
**Soluzione**:
```bash
export TELEGRAM_BOT_TOKEN=your_token
node scripts/telegram-bot-doctor.js your_app_url
```

### 3. Servizio Offline
**Sintomi**: Tutti gli endpoint restituiscono errori
**Soluzione**:
1. Verifica che l'applicazione sia deployata
2. Controlla i logs per errori
3. Rideploya se necessario

### 4. Database Non Accessibile
**Sintomi**: Errori di database nei logs
**Soluzione**:
1. Verifica le migrazioni: `encore migrate up`
2. Controlla la connessione database
3. Verifica i permessi

## 📊 Monitoraggio

### Endpoint di Salute
- `GET /telegram/webhook/health` - Stato servizio e configurazione bot
- `GET /telegram/test` - Test connettività base
- `GET /telegram` - Informazioni servizio completo

### Logs Importanti
Cerca questi pattern nei logs:
- `✅ Webhook processing completed` - Elaborazione riuscita
- `❌ Validation error` - Errori di validazione
- `🔄 Received Telegram webhook update` - Aggiornamenti ricevuti
- `💥 Webhook processing error` - Errori di elaborazione

## 🛠️ Sviluppo e Debug

### Test Locale
```bash
# Avvia il servizio localmente
encore run

# Testa gli endpoint
curl http://localhost:4000/telegram/test
curl http://localhost:4000/telegram/webhook/health

# Configura webhook per test locale (con ngrok)
ngrok http 4000
node scripts/webhook-config.js configure https://your-ngrok-url.ngrok.io/telegram/webhook
```

### Struttura Codice
```
backend/telegram/
├── webhook.ts              # Endpoint webhook principale
├── message-processor.ts    # Elaborazione messaggi
├── telegram-client.ts      # Client API Telegram
├── user-state-manager.ts   # Gestione stato utenti
├── i18n.ts                # Internazionalizzazione
└── db.ts                  # Database connection

scripts/
├── telegram-bot-doctor.js  # Diagnosi e riparazione automatica (NUOVO)
├── quick-bot-test.js       # Test rapido
├── debug-webhook.js        # Debug completo
└── webhook-config.js       # Configurazione webhook
```

## 🔐 Sicurezza

- Il bot token è gestito tramite Encore secrets
- Tutti gli endpoint webhook validano l'input
- Gli errori sono loggati ma non esposti agli utenti
- Le richieste malformate vengono gestite gracefully

## 📈 Performance

- Timeout di 15 secondi per le richieste
- Logging dettagliato per il debugging
- Gestione errori che previene retry infiniti da Telegram
- Validazione input per prevenire errori di elaborazione
- Retry automatico per richieste fallite

## 🆘 Supporto

Se i problemi persistono dopo aver seguito questa guida:

1. **Esegui il Doctor Script**: `node scripts/telegram-bot-doctor.js <your-url>`
2. **Controlla i logs** dell'applicazione per errori specifici
3. **Verifica la configurazione** dei secrets
4. **Testa manualmente** gli endpoint con curl
5. **Contatta il supporto** con i logs e i risultati dei test

## 🔄 Changelog v3.1.0

### Nuove Funzionalità
- **Telegram Bot Doctor**: Script di diagnosi e riparazione automatica
- **Enhanced Error Handling**: Gestione errori migliorata nel webhook
- **Better Logging**: Log più dettagliati per debugging
- **Health Check Improvements**: Controlli di salute più completi
- **Automatic Retry**: Retry automatico per richieste fallite

### Miglioramenti
- Timeout aumentato a 15 secondi per richieste
- Validazione input migliorata
- Gestione token bot più robusta
- Endpoint di test più informativi

---

Per ulteriori informazioni, consulta la documentazione completa in `docs/SETUP.md`.
