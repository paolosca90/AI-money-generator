# Manuale Utente - AI Trading Bot

## 🎯 Introduzione

Benvenuto nel tuo AI Trading Bot! Questo sistema utilizza intelligenza artificiale avanzata per analizzare i mercati finanziari e generare segnali di trading automatici.

## 📱 Come Usare il Bot Telegram

### **Comandi Principali**

#### **🔍 Analisi di Mercato**
-   `/segnale <ASSET> [TF]`: Richiede un'analisi per un asset (es. `/segnale EURUSD`). Se l'affidabilità è bassa, suggerisce alternative.
-   `/affidabilita <ASSET>`: Ottieni solo il punteggio di affidabilità per un asset.
-   `/lista_asset`: Mostra tutti gli asset supportati.

#### **⚡ Esecuzione e Gestione Ordini**
-   `/ordina <ASSET> <direzione> <rischio> <SL> <TP>`: Inserisce un ordine immediato (avanzato).
-   `/stato`: Mostra le tue posizioni aperte e il PnL attuale.
-   `/chiudi <ID_ORDINE>`: Chiude una posizione aperta specificando l'ID del ticket MT5.

#### **⚙️ Configurazione**
-   `/start`: Avvia il bot e la configurazione guidata iniziale.
-   `/config_rischio`: Modifica le tue impostazioni di rischio (es. % di rischio per trade).
-   `/imposta`: Configura parametri di default per i tuoi trade (avanzato).
-   `/help`: Mostra la lista completa dei comandi.

### **Workflow Tipico**

1.  **Invia** `/segnale EURUSD`.
2.  **Ricevi** un'analisi completa con:
    *   Direzione (LONG/SHORT)
    *   Prezzo di entrata, Take Profit, Stop Loss
    *   Livello di affidabilità AI (%) e RR (Risk/Reward)
    *   Scadenza del segnale (prima della chiusura di New York)
3.  **Decidi** se eseguire il trade.
4.  **Clicca** il pulsante "Esegui" sotto al messaggio del segnale.
5.  **Monitora** i tuoi trade con `/stato`.

## 📈 Interpretare i Segnali

### **Esempio di Segnale**

```
📈 Segnale INTRADAY - EURUSD

🆔 Trade ID: EUR-123456
📈 Direzione: **LONG**
💰 Prezzo Entrata: 1.0850
🎯 Take Profit: 1.0890
🛡️ Stop Loss: 1.0820
🔥 Affidabilità: **85%**
📊 Rischio/Rendimento: 1:2.50
⏱️ Scadenza: 22:00 CET

📊 **Analisi Strategia:**
Setup Intraday selezionato. Buona volatilità e trend rialzista confermato su più timeframe.

🧠 **Analisi Tecnica AI:**
• Trend: UPTREND
• Supporto: 1.0845
• Resistenza: 1.0895
• Smart Money: ACCUMULATION

💡 **Gestione Rischio:**
Usa sempre lo stop loss. Non rischiare più del 2% del capitale per trade.
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

## 🕐 Chiusura Automatica (Fine Sessione NY)

Per ridurre il rischio overnight, tutti i trade intraday vengono **chiusi automaticamente** poco prima della fine della sessione di New York (circa 22:00/23:00 CET).

-   Ogni segnale ha una `Scadenza`.
-   Un servizio automatico monitora e chiude le posizioni che raggiungono la scadenza.
-   Riceverai una notifica su Telegram quando un trade viene chiuso automaticamente.

## 📞 Supporto e Assistenza

-   `/help`: Per la lista completa dei comandi.
-   `/stato`: Per verificare lo stato del sistema e delle tue posizioni.
-   Contatta il supporto se hai problemi con la configurazione o l'uso del bot.

---

**Disclaimer**: Il trading comporta rischi significativi. Le informazioni fornite sono a scopo didattico e non costituiscono consulenza finanziaria. Opera responsabilmente.
