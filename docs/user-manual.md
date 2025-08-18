# Manuale Utente - AI Trading Bot

## 🎯 Introduzione

Benvenuto nel tuo AI Trading Bot! Questo sistema utilizza intelligenza artificiale avanzata per analizzare i mercati finanziari e generare segnali di trading automatici con chiusura automatica ottimizzata.

## 📱 Come Usare il Bot Telegram

### **Comandi Principali**

#### **🔍 Analisi di Mercato**
-   `/segnale <ASSET>`: Richiede un'analisi per un asset (es. `/segnale EURUSD`). Se l'affidabilità è bassa, suggerisce alternative.
-   `/scalping <ASSET>`: Analisi specifica per trading veloce (1-15 minuti)
-   `/intraday <ASSET>`: Analisi per day trading ottimizzato (1-6 ore con chiusura automatica)
-   `/affidabilita <ASSET>`: Ottieni solo il punteggio di affidabilità per un asset.
-   `/lista_asset`: Mostra tutti gli asset supportati.

#### **⚡ Esecuzione e Gestione Ordini**
-   `/ordina <TRADE_ID> <DIMENSIONE_LOTTO>`: Esegue un trade specifico
-   `/stato`: Mostra le tue posizioni aperte e il PnL attuale.
-   `/chiudi <ID_ORDINE>`: Chiude una posizione aperta specificando l'ID del ticket MT5.

#### **⚙️ Configurazione**
-   `/start`: Avvia il bot e la configurazione guidata iniziale.
-   `/config_rischio`: Modifica le tue impostazioni di rischio (es. % di rischio per trade).
-   `/impostazioni`: Visualizza e modifica le tue preferenze di trading
-   `/help`: Mostra la lista completa dei comandi.

### **Workflow Tipico**

1.  **Invia** `/segnale EURUSD` o `/intraday EURUSD`.
2.  **Ricevi** un'analisi completa con:
    *   Direzione (LONG/SHORT)
    *   Prezzo di entrata, Take Profit, Stop Loss
    *   Livello di affidabilità AI (%) e RR (Risk/Reward)
    *   **Scadenza automatica** per evitare rischio overnight
3.  **Decidi** se eseguire il trade.
4.  **Clicca** il pulsante "Esegui" sotto al messaggio del segnale.
5.  **Monitora** i tuoi trade con `/stato`.

## 📈 Interpretare i Segnali

### **Esempio di Segnale INTRADAY**

```
📈 Segnale INTRADAY - EURUSD

🆔 Trade ID: EUR-123456
📈 Direzione: **LONG**
💰 Prezzo Entrata: 1.0850
🎯 Take Profit: 1.0890
🛡️ Stop Loss: 1.0820
🔥 Affidabilità: **85%**
📊 Rischio/Rendimento: 1:2.50
⏱️ Tempo Max Mantenimento: 6h
⏰ Scadenza: 15/01/2025 21:30

📊 **Analisi Strategia:**
Setup Intraday ottimizzato per chiusura automatica prima della sessione NY.
Buona volatilità e trend rialzista confermato su più timeframe.

🧠 **Analisi Tecnica AI:**
• Trend: UPTREND
• Supporto: 1.0845
• Resistenza: 1.0895
• Smart Money: ACCUMULATION

💡 **Gestione Rischio:**
Usa sempre lo stop loss. Chiusura automatica garantita entro 6 ore.
```

### **Affidabilità e Alternative**

Se un segnale ha un'affidabilità **< 70%**, il bot non lo mostra ma cerca alternative migliori:

```
⚠️ Il segnale per BTCUSD ha un'affidabilità bassa (65%).

💡 **Alternative Consigliate:**
1. **EURUSD** - Affidabilità: **88%** (LONG)
2. **XAUUSD** - Affidabilità: **82%** (LONG)
3. **GBPUSD** - Affidabilità: **75%** (SHORT)

Usa `/segnale <ASSET>` per analizzare una di queste alternative.
```

## 💰 Gestione del Rischio e Lottaggio

Il bot calcola automaticamente la **dimensione del lotto** per te!

-   **Come funziona**: Tu imposti la percentuale di rischio (es. 1% del tuo capitale) con `/config_rischio`. Il bot calcola il lottaggio esatto per quel trade in modo che, se lo stop loss viene colpito, tu perda solo la percentuale che hai definito.
-   **Esempio**:
    *   Capitale: €10,000
    *   Rischio per trade: 1% (€100)
    *   Distanza SL: 20 pips
    *   Il bot calcolerà il lotto corretto per rischiare esattamente €100.

## 🕐 Chiusura Automatica Ottimizzata

### **Strategia INTRADAY (Ottimizzata)**
- **Durata massima**: 6 ore (ridotta da 8 ore)
- **Chiusura automatica**: Entro le 21:30 CET per evitare il rischio overnight
- **Monitoraggio**: Controllo ogni minuto per chiusura tempestiva

### **Strategia SCALPING**
- **Durata massima**: 15 minuti
- **Chiusura rapida**: Per profitti veloci e rischio limitato

### **Come Funziona**
1. Ogni segnale ha una **scadenza calcolata** automaticamente
2. Un servizio automatico monitora tutte le posizioni aperte
3. Le posizioni vengono chiuse automaticamente prima della scadenza
4. Ricevi una notifica su Telegram quando un trade viene chiuso automaticamente

### **Vantaggi**
- **Nessun rischio overnight**: Tutte le posizioni INTRADAY chiuse entro la sessione
- **Gestione automatica**: Non devi preoccuparti di dimenticare posizioni aperte
- **Ottimizzazione profitti**: Chiusura prima di movimenti avversi notturni

## 📊 Strategie di Trading

### **⚡ SCALPING**
- **Durata**: 1-15 minuti
- **Ideale per**: Trading attivo, profitti rapidi
- **Rischio/Rendimento**: 1:1.5
- **Confidenza minima**: 90%

### **📈 INTRADAY (Ottimizzato)**
- **Durata**: 1-6 ore (massimo)
- **Ideale per**: Day trading, approccio bilanciato
- **Rischio/Rendimento**: 1:2.0
- **Confidenza minima**: 80%
- **Chiusura automatica**: Garantita entro 21:30 CET

## 📞 Supporto e Assistenza

-   `/help`: Per la lista completa dei comandi.
-   `/stato`: Per verificare lo stato del sistema e delle tue posizioni.
-   `/impostazioni`: Per vedere e modificare le tue preferenze
-   Contatta il supporto se hai problemi con la configurazione o l'uso del bot.

---

**Disclaimer**: Il trading comporta rischi significativi. Le informazioni fornite sono a scopo didattico e non costituiscono consulenza finanziaria. Opera responsabilmente.
