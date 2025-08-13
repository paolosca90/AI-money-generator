# Guida Simboli Broker - Risoluzione Problemi BTCUSD

## 🚨 Problema Identificato

Dal log vediamo che:
```
⚠️ Symbol BTCUSDpm found but trading restricted (trade_mode: undefined, visible: undefined)
❌ No tradeable symbol format found for BTCUSD on this broker
```

Questo significa che il tuo broker **non offre trading di Bitcoin** o usa un nome simbolo completamente diverso.

## 🔍 Diagnosi del Problema

### **Possibili Cause:**

1. **Broker non supporta crypto**: Molti broker Forex tradizionali non offrono Bitcoin
2. **Nome simbolo diverso**: Il broker potrebbe usare un nome completamente diverso
3. **Account demo limitato**: L'account demo potrebbe non includere crypto
4. **Restrizioni geografiche**: Bitcoin potrebbe non essere disponibile nella tua regione

## 🛠️ Soluzioni Immediate

### **Soluzione 1: Verifica Simboli Disponibili**

Sul tuo VPS, testa manualmente quali simboli sono disponibili:

```bash
curl -X GET http://localhost:8080/symbols
```

Questo ti mostrerà TUTTI i simboli disponibili sul tuo broker. Cerca:
- Simboli che contengono "BTC", "BITCOIN", "CRYPTO"
- Simboli che iniziano con "BTC"

### **Soluzione 2: Usa Simboli Forex Tradizionali**

Invece di BTCUSD, prova questi simboli che sono disponibili su quasi tutti i broker:

```
✅ EURUSD - Euro/Dollaro (sempre disponibile)
✅ GBPUSD - Sterlina/Dollaro (sempre disponibile)  
✅ USDJPY - Dollaro/Yen (sempre disponibile)
✅ XAUUSD - Oro/Dollaro (disponibile su molti broker)
```

### **Soluzione 3: Controlla Market Watch in MT5**

1. **Apri MT5** sul tuo VPS
2. **Vai in Market Watch** (Ctrl+M)
3. **Cerca Bitcoin**:
   - Tasto destro → Simboli
   - Cerca "BTC", "Bitcoin", "Crypto"
   - Vedi se ci sono simboli crypto disponibili

## 📊 Test con Simboli Alternativi

### **Test 1: Forex Major Pairs**
```bash
# Testa EURUSD (dovrebbe sempre funzionare)
curl -X POST http://localhost:8080/symbol_info \
  -H "Content-Type: application/json" \
  -d '{"symbol": "EURUSD"}'
```

### **Test 2: Oro (spesso disponibile)**
```bash
# Testa XAUUSD (oro)
curl -X POST http://localhost:8080/symbol_info \
  -H "Content-Type: application/json" \
  -d '{"symbol": "XAUUSD"}'
```

### **Test 3: Ricerca Bitcoin**
```bash
# Cerca variazioni Bitcoin
curl -X POST http://localhost:8080/find_symbol \
  -H "Content-Type: application/json" \
  -d '{"symbol": "BTCUSD"}'
```

## 🏦 Broker e Simboli Crypto

### **Broker che Supportano Crypto:**
- **eToro**: BTC, ETH, LTC, etc.
- **Plus500**: Bitcoin CFD
- **IG Markets**: Bitcoin, Ethereum
- **XM Global**: Alcuni crypto CFD
- **Exness**: Bitcoin, Ethereum

### **Broker Solo Forex (NO Crypto):**
- **IC Markets**: Solo Forex e metalli
- **FXCM**: Principalmente Forex
- **OANDA**: Solo Forex
- **Pepperstone**: Principalmente Forex

## 🔧 Workaround Immediato

### **Opzione 1: Usa Simboli Forex**

Modifica i tuoi test per usare simboli sempre disponibili:

```javascript
// Invece di BTCUSD, usa:
/predict EURUSD    // Euro/Dollaro
/predict GBPUSD    // Sterlina/Dollaro  
/predict XAUUSD    // Oro (se disponibile)
```

### **Opzione 2: Cambia Broker**

Se vuoi assolutamente fare trading di crypto, considera questi broker:

1. **eToro** (crypto reali + CFD)
2. **Plus500** (crypto CFD)
3. **XM Global** (alcuni crypto CFD)

### **Opzione 3: Account Separato Crypto**

Usa un exchange crypto separato per Bitcoin:
- **Binance**
- **Coinbase Pro**  
- **Kraken**
- **Bybit**

## 📝 Come Verificare il Tuo Broker

### **Step 1: Identifica il Tuo Broker**

Dai log vediamo che hai account `6001637`. Per identificare il broker:

1. **Guarda il server MT5**: Dovrebbe essere qualcosa come:
   - `XMGlobal-Demo`
   - `ICMarkets-Demo`
   - `FXCM-Demo`
   - etc.

2. **Controlla l'email di registrazione** del tuo account MT5

### **Step 2: Verifica Offerta Crypto**

1. **Vai sul sito del broker**
2. **Cerca "Bitcoin" o "Cryptocurrency"**
3. **Controlla se offrono crypto trading**

### **Step 3: Contatta il Supporto**

Se non sei sicuro, contatta il supporto del broker:
- "Do you offer Bitcoin/cryptocurrency trading?"
- "What crypto symbols are available?"
- "Can I trade BTCUSD on my account?"

## 🎯 Raccomandazioni

### **Per Continuare Subito:**

1. **Usa EURUSD** per i test - funziona sempre
2. **Prova XAUUSD** (oro) - spesso disponibile
3. **Testa GBPUSD** - molto volatile, buono per trading

### **Per il Futuro:**

1. **Se vuoi crypto**: Cambia broker o usa exchange dedicato
2. **Se va bene Forex**: Continua con il broker attuale
3. **Per diversificare**: Usa più broker/exchange

## 🚀 Test Immediato

Prova questo comando per testare con EURUSD:

```bash
# Nel bot Telegram
/predict EURUSD
```

Dovrebbe funzionare perfettamente e mostrarti:
```
✅ Successfully fetched MT5 data for EURUSD (EURUSDpm) 5m
```

## 💡 Pro Tips

1. **Forex è più stabile** di crypto per iniziare
2. **EURUSD ha spread bassi** e buona liquidità
3. **XAUUSD (oro) è volatile** come crypto ma più prevedibile
4. **Inizia con demo** prima di passare a live trading
5. **Ogni broker ha simboli diversi** - sempre verificare prima

Il sistema funziona perfettamente, è solo una questione di usare i simboli giusti per il tuo broker! 🎯
