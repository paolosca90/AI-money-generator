# Guida Setup per Utente Finale - AI Trading Bot

## 🎯 Panoramica

Questo sistema di trading AI può essere configurato in diversi modi a seconda delle tue esigenze e competenze tecniche.

## 📋 Opzioni di Deployment

### **Opzione 1: Setup Locale (Più Semplice)**
✅ **Vantaggi:**
- Controllo completo del sistema
- Nessun costo aggiuntivo per VPS
- Dati sensibili rimangono sul tuo computer

❌ **Svantaggi:**
- Il computer deve rimanere acceso 24/7
- Richiede Windows per MT5
- Dipende dalla tua connessione internet

### **Opzione 2: VPS Windows (Consigliato per Trading Serio)**
✅ **Vantaggi:**
- Funziona 24/7 anche se spegni il computer
- Connessione internet stabile
- Latenza ridotta per esecuzione ordini
- Backup automatico

❌ **Svantaggi:**
- Costo mensile VPS (~$15-30/mese)
- Setup iniziale più complesso

### **Opzione 3: Cloud Hosting (Per Utenti Avanzati)**
✅ **Vantaggi:**
- Scalabilità automatica
- Backup e sicurezza gestiti
- Accesso da qualsiasi dispositivo

❌ **Svantaggi:**
- Costo più elevato
- Richiede competenze tecniche

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
   - ✅ Allow imports of external experts

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

### **Passo 4: Configurazione Telegram**

1. **Crea il bot Telegram:**
   - Cerca `@BotFather` su Telegram
   - Invia `/newbot`
   - Scegli nome e username
   - Salva il token ricevuto

2. **Ottieni le API Keys:**
   - **Gemini AI**: [Google AI Studio](https://makersuite.google.com/app/apikey)
   - **News API**: [NewsAPI.org](https://newsapi.org/register)
   - **Alpha Vantage**: [Alpha Vantage](https://www.alphavantage.co/support/#api-key)

3. **Configura i secrets nel sistema**

### **Passo 5: Test del Sistema**

1. **Avvia il bot Telegram**
2. **Invia** `/start` al tuo bot
3. **Testa** con `/predict EURUSD`
4. **Verifica** che tutto funzioni

## 🌐 Setup Opzione 2: VPS Windows

### **Vantaggi del VPS:**
- **Uptime 24/7**: Il sistema funziona sempre
- **Connessione Stabile**: Nessuna interruzione
- **Latenza Ridotta**: Esecuzione più veloce
- **Sicurezza**: Backup automatici

### **Provider VPS Consigliati:**

#### **1. Contabo (Economico)**
- **Prezzo**: €8-15/mese
- **Specs**: 4GB RAM, 2 CPU, Windows Server
- **Pro**: Prezzo basso, buone performance
- **Contro**: Supporto limitato

#### **2. Vultr (Bilanciato)**
- **Prezzo**: $15-25/mese
- **Specs**: 4GB RAM, 2 CPU, Windows Server
- **Pro**: Ottimo supporto, datacenter globali
- **Contro**: Prezzo medio

#### **3. AWS/Azure (Premium)**
- **Prezzo**: $30-50/mese
- **Specs**: Configurabile
- **Pro**: Massima affidabilità
- **Contro**: Più costoso, complesso

### **Setup VPS Passo-Passo:**

1. **Ordina VPS Windows**
   - Scegli Windows Server 2019/2022
   - Minimo 4GB RAM, 2 CPU
   - 50GB storage

2. **Connettiti al VPS**
   - Usa Remote Desktop (RDP)
   - Credenziali fornite dal provider

3. **Installa il software**
   - MetaTrader 5
   - Python 3.9+
   - Chrome browser (per gestione)

4. **Configura il sistema**
   - Segui gli stessi passi del setup locale
   - Configura Windows per avvio automatico

5. **Test e monitoraggio**
   - Verifica che tutto funzioni
   - Configura backup automatici

## 💰 Analisi Costi

### **Setup Locale:**
- **Costo iniziale**: €0
- **Costi mensili**: €0
- **Costi elettricità**: ~€10-20/mese (PC acceso 24/7)

### **VPS Windows:**
- **Costo iniziale**: €0
- **Costi mensili**: €15-30/mese
- **Costi elettricità**: €0

### **Broker e API:**
- **Account MT5**: Gratuito (demo) / Deposito minimo (live)
- **API Gemini**: ~€5-10/mese
- **News API**: Gratuito (1000 req/giorno)
- **Alpha Vantage**: Gratuito (500 req/giorno)

## 🔧 Configurazione Secrets

Indipendentemente dall'opzione scelta, dovrai configurare questi parametri:

```
# Telegram Bot
TelegramBotToken=123456789:ABCdefGHIjklMNOpqrsTUVwxyz

# AI e Dati
GeminiApiKey=AIzaSyC...
NewsApiKey=your_news_api_key
AlphaVantageApiKey=your_alpha_vantage_key

# MT5 (i tuoi dati personali)
MT5ServerHost=localhost
MT5ServerPort=8080
MT5Login=12345678
MT5Password=your_mt5_password
MT5Server=YourBroker-Demo
```

## 📱 Come Funziona per l'Utente Finale

### **Workflow Quotidiano:**

1. **Mattina**: Ricevi notifiche Telegram con analisi di mercato
2. **Durante il giorno**: 
   - Invia `/predict EURUSD` per analisi on-demand
   - Ricevi segnale con direzione, entry, TP, SL
   - Clicca per eseguire con `/execute TRADE_ID 0.1`
3. **Sera**: Controlla performance con `/performance`

### **Esempio Pratico:**

```
👤 Utente: /predict BTCUSD

🤖 Bot: 
📈 Trading Signal - BTCUSD
🆔 Trade ID: BTC-123456
📈 Direction: LONG
💰 Entry Price: 45,250.00
🎯 Take Profit: 45,750.00
🛡️ Stop Loss: 44,950.00
⚡ Confidence: 85%

👤 Utente: /execute BTC-123456 0.1

🤖 Bot:
✅ Trade Executed Successfully
📋 MT5 Order: #789123
💰 Lot Size: 0.1
💵 Entry Price: 45,252.50
```

## 🛡️ Sicurezza e Backup

### **Backup Essenziali:**
1. **File di configurazione** del bot
2. **Database** delle performance
3. **Credenziali** MT5 e API
4. **Log** delle operazioni

### **Sicurezza:**
1. **Password forti** per tutti gli account
2. **2FA abilitato** dove possibile
3. **VPN** per connessioni VPS
4. **Backup regolari** su cloud

## 📞 Supporto e Manutenzione

### **Monitoraggio Quotidiano:**
- Verifica connessione MT5
- Controlla log errori
- Monitora performance API

### **Manutenzione Settimanale:**
- Backup configurazioni
- Aggiornamento software
- Pulizia log vecchi

### **Supporto Tecnico:**
- Documentazione completa
- Video tutorial
- Supporto via Telegram/Email
- Community di utenti

## 🎯 Raccomandazioni Finali

### **Per Principianti:**
1. **Inizia con setup locale** e account demo
2. **Testa per 1-2 settimane** prima di passare a live
3. **Usa lot size piccoli** (0.01-0.1)
4. **Monitora attivamente** le prime settimane

### **Per Trader Esperti:**
1. **VPS Windows** per massima affidabilità
2. **Account live** con capitale adeguato
3. **Diversificazione** su più simboli
4. **Ottimizzazione** parametri AI

### **Budget Consigliato:**
- **Account Trading**: $1,000-5,000 minimo
- **VPS**: €20/mese
- **API**: €10/mese
- **Totale mensile**: €30/mese + capitale trading

Il sistema è progettato per essere **user-friendly** ma richiede un setup iniziale attento. Una volta configurato, l'utente può operare semplicemente via Telegram con pochi click!
