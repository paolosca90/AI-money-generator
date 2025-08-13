# Guida Aggiornamento Configurazione - VPS Attivo

## 🎯 Configurazione Corretta per VPS

Il tuo VPS è attivo! Ora devi aggiornare la configurazione Leap per utilizzare l'IP del VPS.

### **Configurazione Attuale (da cambiare):**
```
MT5ServerHost=localhost  ❌
```

### **Configurazione Corretta (da impostare):**
```
MT5ServerHost=154.61.187.189  ✅
```

## 🔧 Passi per Aggiornare

### **1. Vai nel Tab Infrastructure**
- Apri il progetto Leap
- Clicca sul tab **"Infrastructure"**
- Trova la sezione **"Secrets"**

### **2. Aggiorna MT5ServerHost**
```
MT5ServerHost=154.61.187.189
MT5ServerPort=8080
MT5Login=6001637
MT5Password=your_mt5_password
MT5Server=your_broker_server_name
```

⚠️ **IMPORTANTE**: 
- Cambia `localhost` con `154.61.187.189`
- Mantieni tutti gli altri valori
- Salva le modifiche

### **3. Riavvia il Sistema**
- **Deploy** le modifiche
- **Riavvia** il bot se necessario
- **Testa** la connessione

## 🧪 Test di Verifica

### **Test 1: Status Check**
```
Comando: /status
Risultato Atteso: "MT5 Connected: ✅"
```

### **Test 2: Prediction con Dati Reali**
```
Comando: /predict EURUSD
Risultato Atteso: Analisi con dati MT5 reali
Log Atteso: "Successfully fetched MT5 data for EURUSD 5m"
```

### **Test 3: Execution Test**
```
Comando: /execute TRADE_ID 0.01
Risultato Atteso: Ordine eseguito su MT5
```

## 📊 Cosa Cambia Ora

### **Prima (con localhost):**
- ❌ Dati simulati o da API esterne
- ❌ Esecuzione simulata
- ❌ Spread e commissioni non reali
- ❌ Dipendenza da API keys

### **Dopo (con VPS IP):**
- ✅ Dati in tempo reale dal tuo broker
- ✅ Esecuzione reale su MT5
- ✅ Spread e commissioni accurate
- ✅ Indipendenza da API esterne

## 🎯 Vantaggi Immediati

### **Accuratezza:**
- **Quotazioni reali** dal tuo broker
- **Spread effettivi** del tuo account
- **Commissioni reali** incluse nell'analisi
- **Slippage realistico** nelle esecuzioni

### **Affidabilità:**
- **Connessione diretta** a MT5
- **Nessuna dipendenza** da servizi esterni
- **Dati sempre aggiornati** (24/7)
- **Esecuzione immediata** degli ordini

### **Performance:**
- **Latenza ridotta** (VPS vicino al broker)
- **Esecuzione più veloce** degli ordini
- **Dati più freschi** per l'AI
- **Analisi più accurate**

## 🚨 Checklist Finale

Prima di iniziare il trading reale:

- [ ] ✅ VPS attivo e MT5 connesso
- [ ] ✅ Python server in esecuzione
- [ ] ✅ Configurazione Leap aggiornata
- [ ] ✅ Test `/status` superato
- [ ] ✅ Test `/predict` con dati reali
- [ ] ✅ Firewall configurato (porta 8080)
- [ ] ✅ Account MT5 con saldo sufficiente
- [ ] ✅ Trading automatico abilitato in MT5

## 🎉 Sei Pronto!

Una volta completati questi passi, il tuo sistema sarà:
- **Professionale** come quello delle banche d'investimento
- **Affidabile** 24/7 senza interruzioni
- **Accurato** con dati reali del mercato
- **Veloce** nell'esecuzione degli ordini

**Buon Trading!** 🚀
