# Manuale Utente - AI Trading Bot

## 🎯 Introduzione

Benvenuto nel tuo AI Trading Bot! Questo sistema utilizza intelligenza artificiale avanzata per analizzare i mercati finanziari e generare segnali di trading automatici.

## 📱 Come Usare il Bot Telegram

### **Comandi Principali**

#### **🔍 Analisi di Mercato**
```
/predict BTCUSD    - Analizza Bitcoin
/predict EURUSD    - Analizza Euro/Dollaro  
/predict XAUUSD    - Analizza Oro
/predict           - Analizza BTCUSD (default)
```

#### **⚡ Esecuzione Ordini**
```
/execute BTC-123456 0.1    - Esegue trade con 0.1 lotti
/execute EUR-789012 0.05   - Esegue trade con 0.05 lotti
```

#### **📊 Informazioni**
```
/status        - Stato del sistema
/performance   - Statistiche trading
/symbols       - Simboli supportati
/help          - Guida completa
```

### **Workflow Tipico**

1. **Invia** `/predict EURUSD`
2. **Ricevi** analisi completa con:
   - Direzione (LONG/SHORT)
   - Prezzo di entrata
   - Take Profit e Stop Loss
   - Livello di confidenza AI
3. **Decidi** se eseguire il trade
4. **Invia** `/execute TRADE_ID LOT_SIZE`
5. **Ricevi** conferma esecuzione

## 📈 Interpretare i Segnali

### **Esempio di Segnale**

```
📈 Trading Signal - EURUSD

🆔 Trade ID: EUR-123456
📈 Direction: LONG
💰 Entry Price: 1.0850
🎯 Take Profit: 1.0890
🛡️ Stop Loss: 1.0820
⚡ Confidence: 85%

📊 Technical Analysis:
• RSI: 35.2 (Oversold)
• MACD: BULLISH
• ATR: 0.00025
• Support: 1.0845
• Resistance: 1.0895

📰 Sentiment: 📈 +65%
```

### **Come Leggere il Segnale**

#### **🎯 Confidence Level (Enhanced System)**
- **90-95%**: Segnale eccellente ⭐⭐⭐⭐ (Grade A+)
- **85-89%**: Segnale molto forte ⭐⭐⭐ (Grade A)
- **80-84%**: Segnale forte ⭐⭐⭐ (Grade B+)
- **75-79%**: Segnale buono ⭐⭐ (Grade B)
- **60-74%**: Segnale medio ⭐ (Grade C)
- **45-59%**: Segnale debole ⚠️ (Grade D)
- **<45%**: Segnale scartato ❌ (Grade F)

#### **🔍 Enhanced Quality Factors**
- **Multi-Timeframe Confluence**: Analisi su 5m, 15m, 30m
- **Market Session Awareness**: Bonus durante sovrapposizioni di sessioni
- **Volatility Filter**: Adeguamento basato su volatilità del simbolo
- **Technical Alignment**: RSI, MACD, Bollinger Bands su più timeframe
- **Historical Performance**: Integrazione storico performance
- **Risk Adjustment**: Scoring basato su condizioni di rischio

#### **📊 Indicatori Tecnici**
- **RSI < 30**: Ipervenduto (possibile rimbalzo)
- **RSI > 70**: Ipercomprato (possibile correzione)
- **MACD BULLISH**: Momentum positivo
- **MACD BEARISH**: Momentum negativo

#### **📰 Sentiment**
- **+50% a +100%**: Sentiment molto positivo
- **+20% a +50%**: Sentiment positivo
- **-20% a +20%**: Sentiment neutro
- **-50% a -20%**: Sentiment negativo
- **-100% a -50%**: Sentiment molto negativo

## 💰 Gestione del Rischio

### **Dimensionamento Posizioni**

#### **Account Piccolo ($1,000-5,000)**
- **Lot Size**: 0.01-0.05
- **Rischio per trade**: 1-2%
- **Max trades giornalieri**: 3-5

#### **Account Medio ($5,000-20,000)**
- **Lot Size**: 0.05-0.2
- **Rischio per trade**: 1-3%
- **Max trades giornalieri**: 5-10

#### **Account Grande ($20,000+)**
- **Lot Size**: 0.1-1.0
- **Rischio per trade**: 1-2%
- **Max trades giornalieri**: 10-20

### **Regole di Risk Management**

1. **Mai rischiare più del 2% per trade**
2. **Usa sempre Stop Loss**
3. **Non aumentare lot size dopo perdite**
4. **Diversifica su più simboli**
5. **Monitora drawdown massimo**

## 🕐 Orari di Trading Ottimali

### **Forex (EUR/USD, GBP/USD, etc.)**
- **Sessione Europea**: 08:00-17:00 CET
- **Sessione Americana**: 14:00-23:00 CET
- **Overlap EU-US**: 14:00-17:00 CET (migliore)

### **Crypto (BTC/USD, ETH/USD)**
- **24/7 disponibile**
- **Volatilità alta**: 14:00-22:00 CET
- **Weekend**: Volatilità ridotta

### **Oro (XAU/USD)**
- **Sessione Europea**: 08:00-17:00 CET
- **Sessione Americana**: 14:00-23:00 CET
- **Evita**: Venerdì sera, weekend

### **Petrolio (CRUDE, BRENT)**
- **Sessione Americana**: 15:30-22:00 CET
- **Evita**: Weekend, festivi USA

## 📊 Monitoraggio Performance

### **Metriche Chiave**

#### **Win Rate**
- **>70%**: Eccellente 🔥
- **60-70%**: Buono ⚡
- **50-60%**: Medio 📊
- **<50%**: Da migliorare ⚠️

#### **Profit Factor**
- **>2.0**: Eccellente 🔥
- **1.5-2.0**: Buono ⚡
- **1.0-1.5**: Medio 📊
- **<1.0**: Perdita ❌

#### **Drawdown Massimo**
- **<10%**: Ottimo controllo rischio
- **10-20%**: Accettabile
- **20-30%**: Alto rischio
- **>30%**: Rivedi strategia

### **Comando Performance**

```
/performance

📊 Trading Performance

🔥 Win Rate: 72.5%
⚡ Profit Factor: 1.85
📈 Total Trades: 45
💰 Avg Profit: $125.50
📉 Avg Loss: $67.80
🎯 Best Trade: $340.00
📊 Avg Confidence: 78%

📈 Performance Rating:
⚡ Good - Solid trading results!
```

## 🎯 Strategie di Trading

### **Strategia Conservativa (Enhanced)**
- **Confidence minima**: 85% (Grade A+/A)
- **Lot size**: 0.01-0.05
- **Simboli**: Major pairs (EUR/USD, GBP/USD)
- **Obiettivo**: 5-10% mensile
- **Filtri**: Solo segnali con multi-timeframe confluence >70%

### **Strategia Bilanciata (Enhanced)**
- **Confidence minima**: 80% (Grade B+)
- **Lot size**: 0.05-0.1
- **Simboli**: Major + Minor pairs
- **Obiettivo**: 10-20% mensile
- **Filtri**: Sessioni di trading attive, volatilità normale

### **Strategia Aggressiva (Enhanced)**
- **Confidence minima**: 75% (Grade B)
- **Lot size**: 0.1-0.5
- **Simboli**: Tutti i simboli disponibili
- **Obiettivo**: 20-50% mensile
- **⚠️ Rischio**: Alto ma con filtri di qualità migliorati

## 🚨 Gestione Errori Comuni

### **"Trade execution failed"**
**Cause possibili:**
- MT5 non connesso
- Margine insufficiente
- Mercato chiuso
- Simbolo non disponibile

**Soluzioni:**
1. Verifica connessione MT5
2. Controlla saldo account
3. Verifica orari di mercato
4. Riduci lot size

### **"Prediction failed"**
**Cause possibili:**
- API Gemini non disponibile
- Simbolo non supportato
- Problemi di connessione

**Soluzioni:**
1. Riprova dopo qualche minuto
2. Verifica simbolo corretto
3. Controlla connessione internet

### **"Bot not responding"**
**Cause possibili:**
- Server Python offline
- Token Telegram scaduto
- Problemi VPS

**Soluzioni:**
1. Riavvia server Python
2. Verifica token Telegram
3. Controlla stato VPS

## 📚 Simboli Supportati

### **💱 Forex Major Pairs**
- **EURUSD** - Euro/Dollaro USA
- **GBPUSD** - Sterlina/Dollaro USA
- **USDJPY** - Dollaro USA/Yen
- **AUDUSD** - Dollaro Australiano/USA
- **USDCAD** - Dollaro USA/Canadese
- **USDCHF** - Dollaro USA/Franco Svizzero

### **💰 Cryptocurrency**
- **BTCUSD** - Bitcoin/Dollaro USA
- **ETHUSD** - Ethereum/Dollaro USA

### **🥇 Precious Metals**
- **XAUUSD** - Oro/Dollaro USA

### **🛢️ Commodities**
- **CRUDE** - Petrolio WTI
- **BRENT** - Petrolio Brent

## 🔧 Configurazioni Avanzate

### **Personalizzazione Alerts**

Puoi configurare il bot per ricevere solo segnali che rispettano i tuoi criteri:

```
Confidence minima: 75%
Simboli preferiti: EURUSD, GBPUSD, BTCUSD
Orari trading: 08:00-20:00 CET
Max trades/giorno: 5
```

### **Integrazione con Altri Tool**

Il bot può essere integrato con:
- **TradingView** per analisi aggiuntive
- **MetaTrader** per esecuzione automatica
- **Excel/Google Sheets** per tracking performance
- **Discord/Slack** per notifiche team

## 📞 Supporto e Assistenza

### **Canali di Supporto**
- **Telegram**: @TradingBotSupport
- **Email**: support@tradingbot.com
- **Discord**: TradingBot Community
- **Documentazione**: docs.tradingbot.com

### **FAQ Rapide**

**Q: Posso usare il bot su più account MT5?**
A: Sì, puoi configurare più istanze del bot.

**Q: Il bot funziona con tutti i broker?**
A: Sì, con qualsiasi broker che supporta MT5.

**Q: Posso modificare i parametri AI?**
A: I parametri base sono fissi, ma puoi personalizzare filtri e risk management.

**Q: Quanto capitale serve per iniziare?**
A: Minimo $500 per demo, $1000+ per live trading.

**Q: Il bot garantisce profitti?**
A: No, il trading comporta sempre rischi. Usa solo capitale che puoi permetterti di perdere.

## ⚠️ Disclaimer

**AVVISO DI RISCHIO**: Il trading di CFD, Forex e Criptovalute comporta un alto livello di rischio e può non essere adatto a tutti gli investitori. Prima di decidere di fare trading, dovresti considerare attentamente i tuoi obiettivi di investimento, il livello di esperienza e la propensione al rischio. Esiste la possibilità di perdere parte o tutto l'investimento iniziale, quindi non dovresti investire denaro che non puoi permetterti di perdere.

Le performance passate non sono indicative di risultati futuri. I risultati possono variare significativamente tra diversi investitori.

Questo bot è uno strumento di assistenza al trading e non costituisce consulenza finanziaria. Tutte le decisioni di trading sono di tua esclusiva responsabilità.

---

**Buon Trading! 🚀**
