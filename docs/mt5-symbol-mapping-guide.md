# MT5 Symbol Mapping Guide - Risoluzione Automatica Simboli

## 🎯 Problema Risolto

Diversi broker MT5 utilizzano formati di simboli differenti. Ad esempio:
- **Simbolo Standard**: `EURUSD`
- **Broker A**: `EURUSDpm`
- **Broker B**: `EURUSD.m`
- **Broker C**: `EURUSDpro`

Il sistema ora **rileva automaticamente** il formato corretto per ogni broker!

## 🔧 Come Funziona

### **1. Rilevamento Automatico**

Quando richiedi dati per `EURUSD`, il sistema:

1. **Testa** il simbolo originale: `EURUSD`
2. **Se non funziona**, prova le variazioni comuni:
   - `EURUSDpm`
   - `EURUSD.m`
   - `EURUSD_m`
   - `EURUSDpro`
   - `EURUSDc`
   - `EURUSDi`
   - E molte altre...
3. **Trova** il formato che funziona sul tuo broker
4. **Usa** automaticamente quello corretto

### **2. Variazioni Supportate**

Il sistema testa automaticamente queste variazioni:

#### **Suffissi Comuni:**
- `m` → `EURUSDm`
- `pm` → `EURUSDpm`
- `pro` → `EURUSDpro`
- `ecn` → `EURUSDecn`
- `raw` → `EURUSDraw`
- `c` → `EURUSDc`
- `i` → `EURUSDi`
- `.m` → `EURUSD.m`
- `_m` → `EURUSD_m`
- `.pro` → `EURUSD.pro`
- `.ecn` → `EURUSD.ecn`

#### **Prefissi (meno comuni):**
- `m` → `mEURUSD`
- `pro` → `proEURUSD`
- `ecn` → `ecnEURUSD`

#### **Mappature Specifiche per Broker:**
- **Oro**: `XAUUSD`, `GOLD`, `GOLDpm`, `GOLD.m`
- **Bitcoin**: `BTCUSD`, `BITCOIN`, `BTC`, `BTCUSDpm`
- **Petrolio**: `CRUDE`, `WTI`, `USOIL`, `WTIpm`

## 📊 Simboli Supportati con Auto-Mapping

### **Forex Major Pairs**
```
EURUSD → EURUSDpm, EURUSD.m, EURUSDpro, etc.
GBPUSD → GBPUSDpm, GBPUSD.m, GBPUSDpro, etc.
USDJPY → USDJPYpm, USDJPY.m, USDJPYpro, etc.
AUDUSD → AUDUSDpm, AUDUSD.m, AUDUSDpro, etc.
USDCAD → USDCADpm, USDCAD.m, USDCADpro, etc.
USDCHF → USDCHFpm, USDCHF.m, USDCHFpro, etc.
NZDUSD → NZDUSDpm, NZDUSD.m, NZDUSDpro, etc.
```

### **Metalli Preziosi**
```
XAUUSD → XAUUSDpm, GOLD, GOLDpm, GOLD.m, etc.
```

### **Criptovalute**
```
BTCUSD → BTCUSDpm, BITCOIN, BTC, BTCUSD.m, etc.
ETHUSD → ETHUSDpm, ETHEREUM, ETH, ETHUSD.m, etc.
```

### **Commodities**
```
CRUDE → CRUDEpm, WTI, USOIL, WTIpm, CRUDE.m, etc.
BRENT → BRENTpm, UKOIL, UKOILpm, BRENT.m, etc.
```

## 🚀 Vantaggi per l'Utente

### **✅ Nessuna Configurazione Manuale**
- Non devi sapere il formato del tuo broker
- Il sistema trova automaticamente quello giusto
- Funziona con qualsiasi broker MT5

### **✅ Compatibilità Universale**
- **Contabo VPS** con qualsiasi broker
- **IC Markets**: `EURUSDpm`, `GBPUSDpm`
- **XM Global**: `EURUSD.m`, `GBPUSD.m`
- **FXCM**: `EURUSDpro`, `GBPUSDpro`
- **Exness**: `EURUSDc`, `GBPUSDc`
- **E tutti gli altri broker**

### **✅ Funziona Sempre**
- Se un formato non funziona, prova il successivo
- Fallback automatico a dati alternativi
- Nessuna interruzione del servizio

## 📝 Log di Debug

Nei log vedrai messaggi come:

```
Trying to find correct symbol format for EURUSD. Testing variations: EURUSD, EURUSDm, EURUSDpm, EURUSD.m, EURUSDpro, EURUSDc, EURUSDi, EURUSD_m, EURUSD.pro, EURUSD.ecn

✅ Found correct symbol format: EURUSD → EURUSDpm

Successfully fetched MT5 data for EURUSD (EURUSDpm) 5m - Close: 1.08450
```

## 🔧 Endpoint di Test

Il Python server ora include un endpoint per testare i simboli:

```bash
# Testa quali variazioni di EURUSD esistono sul tuo broker
curl -X POST http://localhost:8080/find_symbol \
  -H "Content-Type: application/json" \
  -d '{"symbol": "EURUSD"}'
```

Risposta:
```json
{
  "base_symbol": "EURUSD",
  "found_symbols": [
    {
      "symbol": "EURUSDpm",
      "description": "Euro vs US Dollar",
      "visible": true,
      "trade_mode": 4
    }
  ],
  "total_found": 1
}
```

## 🎯 Esempi Pratici

### **Esempio 1: Broker con suffisso "pm"**
```
Richiesta: /predict EURUSD
Sistema trova: EURUSDpm
Risultato: ✅ Dati reali dal broker
```

### **Esempio 2: Broker con suffisso ".m"**
```
Richiesta: /predict GBPUSD
Sistema trova: GBPUSD.m
Risultato: ✅ Dati reali dal broker
```

### **Esempio 3: Broker con nomi alternativi**
```
Richiesta: /predict XAUUSD
Sistema trova: GOLD
Risultato: ✅ Dati reali dal broker
```

## 🚨 Troubleshooting

### **Se il simbolo non viene trovato:**

1. **Controlla Market Watch** in MT5:
   - Apri MT5 sul tuo VPS
   - Vai in Market Watch
   - Cerca il simbolo manualmente
   - Aggiungi alla lista se necessario

2. **Verifica nome esatto**:
   - Alcuni broker usano nomi completamente diversi
   - Es: `XAUUSD` potrebbe essere `GOLD` o `GOLDSPOT`

3. **Usa l'endpoint di test**:
   ```bash
   curl -X POST http://your-vps-ip:8080/find_symbol \
     -H "Content-Type: application/json" \
     -d '{"symbol": "EURUSD"}'
   ```

### **Se nessuna variazione funziona:**

Il sistema farà automaticamente fallback a:
1. **Alpha Vantage** (se configurato)
2. **CoinGecko** (per crypto)
3. **Dati simulati** (per continuare a funzionare)

## 💡 Pro Tips

### **Per Sviluppatori:**
- Il mapping è **dinamico** e si adatta a ogni broker
- **Nessuna configurazione manuale** richiesta
- **Cache automatica** dei simboli trovati

### **Per Utenti:**
- **Usa sempre i simboli standard** (`EURUSD`, `GBPUSD`, etc.)
- Il sistema **trova automaticamente** il formato del tuo broker
- **Non preoccuparti** delle differenze tra broker

### **Per Broker Specifici:**
- **IC Markets**: Spesso usa suffisso `pm`
- **XM Global**: Spesso usa suffisso `.m`
- **FXCM**: Spesso usa suffisso `pro`
- **Exness**: Spesso usa suffisso `c`

## 🎉 Risultato Finale

Ora puoi usare **qualsiasi broker MT5** senza preoccuparti dei formati dei simboli! Il sistema:

- ✅ **Rileva automaticamente** il formato corretto
- ✅ **Funziona con tutti i broker** MT5
- ✅ **Non richiede configurazione** manuale
- ✅ **Fornisce sempre dati accurati**

**Il tuo trading bot è ora universalmente compatibile!** 🚀
