# 🔧 MT5 Connection Fix Guide - Risoluzione Immediata

## 🚨 Problema Identificato

Dai log vedo che il sistema sta tentando di connettersi a MT5 ma riceve errori "fetch failed". Questo significa che il bot non riesce a raggiungere il server Python MT5.

## ✅ Soluzione Immediata

### **Passo 1: Aggiorna la Configurazione**

Nel tab **Infrastructure** di Leap, aggiorna questo secret:

**CAMBIA DA:**
```
MT5ServerHost=localhost
```

**A:**
```
MT5ServerHost=154.61.187.189
```

### **Passo 2: Verifica Altri Settings**

Assicurati che questi secrets siano configurati correttamente:

```
MT5ServerHost=154.61.187.189  ← QUESTO È IL CAMBIAMENTO PRINCIPALE
MT5ServerPort=8080
MT5Login=6001637
MT5Password=your_mt5_password
MT5Server=your_broker_server_name
```

### **Passo 3: Verifica VPS**

1. **Connettiti al tuo VPS** (154.61.187.189)
2. **Controlla che MT5 sia aperto** e connesso
3. **Verifica che il Python server sia in esecuzione**:
   ```bash
   cd C:\TradingBot
   python mt5-python-server.py
   ```
4. **Dovresti vedere**:
   ```
   ✅ MT5 connesso con successo!
   🚀 Avvio server su porta 8080...
   ```

### **Passo 4: Test Manuale**

Dal tuo computer, testa la connessione:

```bash
curl http://154.61.187.189:8080/status
```

**Risposta attesa:**
```json
{
  "connected": true,
  "trade_allowed": true,
  "server": "YourBroker-Demo",
  "login": 6001637,
  "balance": 10000.0
}
```

## 🔍 Diagnosi del Problema

### **Errore Attuale:**
```
Error fetching MT5 data for EURUSD: fetch failed
```

### **Causa:**
Il sistema sta cercando di connettersi a `localhost` invece dell'IP del VPS (154.61.187.189).

### **Perché Succede:**
- Il bot Leap gira su server cloud
- Il VPS MT5 gira su 154.61.187.189
- `localhost` dal server Leap non può raggiungere il VPS

## 🎯 Risultato Atteso

Dopo la correzione, nei log dovresti vedere:

```
Successfully fetched MT5 data for EURUSD (EURUSDpm) 5m - Close: 1.08450
```

Invece di:
```
Error fetching MT5 data for EURUSD: fetch failed
MT5 data unavailable for EURUSD 5m, falling back to Alpha Vantage
```

## 🚨 Checklist Verifica

- [ ] ✅ MT5ServerHost aggiornato a 154.61.187.189
- [ ] ✅ VPS in esecuzione e raggiungibile
- [ ] ✅ MT5 aperto e connesso sul VPS
- [ ] ✅ Python server in esecuzione su VPS
- [ ] ✅ Porta 8080 aperta sul VPS
- [ ] ✅ Test manuale con curl funzionante

## 🔧 Troubleshooting Aggiuntivo

### **Se il test curl fallisce:**

1. **Controlla Firewall Windows** sul VPS:
   - Apri Windows Defender Firewall
   - Aggiungi regola in entrata per porta 8080

2. **Controlla Firewall Provider VPS**:
   - Vai nel pannello di controllo del tuo provider VPS
   - Assicurati che la porta 8080 sia aperta

3. **Riavvia Servizi** sul VPS:
   - Chiudi MT5
   - Ferma Python server (Ctrl+C)
   - Riapri MT5 e fai login
   - Riavvia Python server

### **Se MT5 non si connette:**

1. **Verifica credenziali** MT5
2. **Controlla connessione internet** del VPS
3. **Riavvia MT5** e fai login manualmente
4. **Abilita trading automatico** in MT5

## 💡 Suggerimenti

### **Per Evitare Problemi Futuri:**

1. **Mantieni VPS sempre acceso**
2. **Configura avvio automatico** per MT5 e Python server
3. **Monitora connessione** regolarmente
4. **Fai backup** della configurazione

### **Monitoraggio:**

Usa questi comandi per verificare lo stato:

```bash
# Test connessione
curl http://154.61.187.189:8080/status

# Test dati simbolo
curl -X POST http://154.61.187.189:8080/rates \
  -H "Content-Type: application/json" \
  -d '{"symbol": "EURUSD", "timeframe": "5m", "count": 10}'
```

## 🎉 Successo!

Una volta completata la configurazione, il tuo bot:

- ✅ **Userà dati MT5 reali** invece di Alpha Vantage
- ✅ **Avrà spread accurati** del tuo broker
- ✅ **Eseguirà ordini reali** su MT5
- ✅ **Funzionerà 24/7** senza interruzioni

**Il cambiamento principale è semplicemente aggiornare `MT5ServerHost` da `localhost` a `154.61.187.189`!** 🚀
