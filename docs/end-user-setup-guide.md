# Guida Setup per Utente Finale - AI Trading Bot

## 🎯 Panoramica

Questo sistema di trading AI può essere configurato in diversi modi a seconda delle tue esigenze e competenze tecniche.

## 📋 Opzioni di Deployment

### **Opzione 1: Setup Locale (Per Iniziare)**
- **Vantaggi:** Controllo completo, nessun costo aggiuntivo per VPS.
- **Svantaggi:** Il computer deve rimanere acceso 24/7, richiede Windows.
- **Guida:** Segui i passaggi di base per installare MT5 e Python sul tuo PC.

### **Opzione 2: VPS Windows (Raccomandato per Trading Serio)**
- **Vantaggi:** Funziona 24/7, connessione stabile, latenza ridotta.
- **Svantaggi:** Costo mensile VPS (~€15-30/mese).
- **Guida Dettagliata:** Per questa opzione, abbiamo creato una guida passo-passo super facile da seguire.
  - ➡️ **[Apri la Guida Facile per la Connessione VPS e MT5](./vps-connection-guide.md)**

## 🔧 Configurazione Secrets

Indipendentemente dall'opzione scelta, dovrai configurare questi parametri nel tab **Infrastructure**:

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
