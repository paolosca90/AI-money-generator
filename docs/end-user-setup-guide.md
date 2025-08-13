# Guida Setup per Utente Finale - AI Trading Bot

## 🎯 Panoramica

Questo sistema di trading AI può essere configurato in diversi modi a seconda delle tue esigenze e competenze tecniche. **La configurazione raccomandata è utilizzare il tuo terminale MetaTrader 5 come fonte primaria per le quotazioni in tempo reale.**

## 📋 Opzioni di Deployment

### **Opzione 1: Setup Locale (Raccomandato per Iniziare)**
✅ **Vantaggi:**
- **Quotazioni in tempo reale** dal tuo broker
- Controllo completo del sistema
- Nessun costo aggiuntivo per VPS
- Dati sensibili rimangono sul tuo computer

❌ **Svantaggi:**
- Il computer deve rimanere acceso 24/7
- Richiede Windows per MT5
- Dipende dalla tua connessione internet

### **Opzione 2: VPS Windows (Consigliato per Trading Serio)**
✅ **Vantaggi:**
- **Quotazioni in tempo reale** dal tuo broker
- Funziona 24/7 anche se spegni il computer
- Connessione internet stabile
- Latenza ridotta per esecuzione ordini

❌ **Svantaggi:**
- Costo mensile VPS (~$15-30/mese)
- Setup iniziale più complesso

## 🚀 Setup Opzione 1: Locale (Raccomandato per Iniziare)

### **Requisiti:**
- Windows 10/11
- 4GB RAM minimo
- Connessione internet stabile
- Account broker con MT5

### **Passo 1: Installazione Software**

1. **Scarica e installa MetaTrader 5**
   - Vai sul sito del tuo broker
   - Scarica MT5 per Windows
   - Installa e configura il tuo account

2. **Installa Python 3.9+**
   - Vai su [python.org](https://python.org)
   - Scarica Python 3.9 o superiore
   - Durante l'installazione, seleziona "Add Python to PATH"

3. **Installa le dipendenze Python**
   ```bash
   pip install MetaTrader5 flask flask-cors requests
   ```

### **Passo 2: Configurazione MT5**

1. **Apri MetaTrader 5**
2. **Vai su Tools → Options → Expert Advisors**
3. **Abilita:**
   - ✅ Allow automated trading
   - ✅ Allow DLL imports
   - ✅ Allow WebRequest for listed URL (aggiungi `http://localhost:8080`)

4. **Testa la connessione:**
   - Assicurati che MT5 sia connesso al server
   - Verifica che il trading sia abilitato

### **Passo 3: Setup del Bot**

1. **Scarica i file del sistema**
2. **Crea una cartella** (es: `C:\TradingBot\`)
3. **Copia il file** `mt5-python-server.py` nella cartella
4. **Avvia il server MT5:**
   ```bash
   cd C:\TradingBot\
   python mt5-python-server.py
   ```

### **Passo 4: Configurazione Secrets**

1. **Crea il bot Telegram:**
   - Cerca `@BotFather` su Telegram, invia `/newbot` e salva il token.
2. **Ottieni le API Keys (opzionali, per fallback):**
   - **Gemini AI**: [Google AI Studio](https://makersuite.google.com/app/apikey)
   - **News API**: [NewsAPI.org](https://newsapi.org/register)
   - **Alpha Vantage**: [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
3. **Configura i secrets nel sistema**: Inserisci i dati del tuo account MT5 e le API keys.

### **Passo 5: Test del Sistema**

1. **Avvia il bot Telegram**
2. **Invia** `/start` al tuo bot
3. **Testa** con `/predict EURUSD`
4. **Verifica** che i log mostrino "Successfully fetched MT5 data".

## 🌐 Setup Opzione 2: VPS Windows

Il processo è identico al setup locale, ma viene eseguito su un server remoto (VPS) per garantire operatività 24/7.

### **Provider VPS Consigliati:**
- **Contabo**: Ottimo rapporto qualità/prezzo.
- **Vultr**: Bilanciato, con ottimo supporto.
- **DigitalOcean/AWS**: Premium, per massima affidabilità.

### **Setup VPS Passo-Passo:**
1. **Ordina un VPS Windows** (minimo 4GB RAM, 2 CPU).
2. **Connettiti al VPS** tramite Remote Desktop (RDP).
3. **Installa il software** (MT5, Python) come nel setup locale.
4. **Configura il sistema** e avvia il server Python.
5. **Configura l'avvio automatico** del server Python all'avvio del VPS.

## 🔧 Configurazione Secrets

Indipendentemente dall'opzione scelta, dovrai configurare questi parametri:

```
# Telegram Bot
TelegramBotToken=123456789:ABCdefGHIjklMNOpqrsTUVwxyz

# AI e Dati (MT5 è primario, questi sono fallback)
GeminiApiKey=AIzaSyC...
NewsApiKey=your_news_api_key
AlphaVantageApiKey=your_alpha_vantage_key

# MT5 (i tuoi dati personali)
MT5ServerHost=localhost  # o l'IP del tuo VPS
MT5ServerPort=8080
MT5Login=12345678
MT5Password=your_mt5_password
MT5Server=YourBroker-Demo
```

## 📱 Come Funziona per l'Utente Finale

Il workflow non cambia. Il bot utilizzerà automaticamente MT5 per le quotazioni, garantendo che le analisi siano basate sui dati più recenti e accurati del tuo broker.

### **Esempio Pratico:**

```
👤 Utente: /predict BTCUSD

🤖 Bot: 
(In background, il bot chiede i dati a MT5)
...
📈 Trading Signal - BTCUSD
...
```

## 🛡️ Sicurezza e Backup

- **Password forti** per tutti gli account.
- **2FA abilitato** dove possibile.
- **VPN** per connessioni VPS.
- **Backup regolari** della configurazione del bot e dei log di MT5.

Con questa configurazione, il tuo trading bot funzionerà con dati in tempo reale direttamente dal tuo broker, aumentando l'accuratezza e l'affidabilità delle previsioni!
