# Tutorial VPS Setup - Guida Completa

## 🎯 Perché Usare un VPS per il Trading Bot?

### **Vantaggi Chiave:**
- ⏰ **24/7 Uptime**: Il bot funziona sempre, anche quando il tuo PC è spento
- 🌐 **Connessione Stabile**: Nessuna interruzione di corrente o internet
- ⚡ **Latenza Ridotta**: Esecuzione ordini più veloce
- 🔒 **Sicurezza**: Ambiente isolato e protetto
- 💾 **Backup Automatico**: I tuoi dati sono al sicuro

## 🏆 Provider VPS Consigliati

### **1. Contabo (Migliore Rapporto Qualità/Prezzo)**

**Specifiche Consigliate:**
- **Piano**: VPS M (Windows)
- **RAM**: 8GB
- **CPU**: 4 vCPU
- **Storage**: 200GB SSD
- **Prezzo**: ~€12/mese
- **Datacenter**: Germania (buono per Europa)

**Pro:**
✅ Prezzo molto competitivo
✅ Buone performance
✅ Supporto in italiano

**Contro:**
❌ Supporto non 24/7
❌ Setup manuale richiesto

**Link**: [contabo.com](https://contabo.com)

### **2. Vultr (Bilanciato)**

**Specifiche Consigliate:**
- **Piano**: Regular Performance 8GB
- **RAM**: 8GB
- **CPU**: 4 vCPU
- **Storage**: 160GB SSD
- **Prezzo**: ~$24/mese
- **Datacenter**: Amsterdam/Londra

**Pro:**
✅ Ottimo supporto 24/7
✅ Datacenter in Europa
✅ Interface user-friendly
✅ Backup automatici

**Contro:**
❌ Prezzo medio-alto
❌ Fatturazione oraria

**Link**: [vultr.com](https://vultr.com)

### **3. DigitalOcean (Premium)**

**Specifiche Consigliate:**
- **Piano**: Basic Droplet 8GB
- **RAM**: 8GB
- **CPU**: 4 vCPU
- **Storage**: 160GB SSD
- **Prezzo**: ~$48/mese
- **Datacenter**: Amsterdam

**Pro:**
✅ Massima affidabilità
✅ Documentazione eccellente
✅ Monitoring avanzato
✅ API complete

**Contro:**
❌ Prezzo elevato
❌ Più complesso per principianti

**Link**: [digitalocean.com](https://digitalocean.com)

## 🚀 Setup Passo-Passo (Vultr)

### **Passo 1: Creazione Account**

1. **Vai su** [vultr.com](https://vultr.com)
2. **Clicca** "Sign Up"
3. **Inserisci** email e password
4. **Verifica** l'email
5. **Aggiungi** metodo di pagamento

### **Passo 2: Deploy Server**

1. **Clicca** "Deploy New Server"
2. **Scegli**:
   - **Type**: Regular Performance
   - **Location**: Amsterdam (per Europa)
   - **OS**: Windows Server 2022
   - **Size**: 8GB RAM / 4 vCPU
3. **Aggiungi** etichetta: "TradingBot"
4. **Clicca** "Deploy Now"

⏱️ **Tempo di setup**: 5-10 minuti

### **Passo 3: Connessione RDP**

1. **Aspetta** che il server sia "Running"
2. **Clicca** sul server nella dashboard
3. **Copia** IP, Username, Password
4. **Apri** Remote Desktop su Windows:
   - Premi `Win + R`
   - Digita `mstsc`
   - Inserisci IP del server
   - Inserisci credenziali

### **Passo 4: Configurazione Windows**

1. **Disabilita** Windows Defender (temporaneamente)
2. **Installa** Chrome browser
3. **Configura** Windows Update
4. **Crea** cartella `C:\TradingBot\`

### **Passo 5: Installazione Software**

#### **A. MetaTrader 5**
1. **Vai** sul sito del tuo broker
2. **Scarica** MT5 per Windows
3. **Installa** e configura account
4. **Abilita** trading automatico

#### **B. Python 3.9+**
1. **Vai** su [python.org](https://python.org)
2. **Scarica** Python 3.9+
3. **Installa** con "Add to PATH"
4. **Apri** Command Prompt
5. **Installa** dipendenze:
```bash
pip install MetaTrader5 flask flask-cors requests
```

### **Passo 6: Setup Trading Bot**

1. **Copia** i file del bot in `C:\TradingBot\`
2. **Configura** i secrets con i tuoi dati
3. **Testa** la connessione MT5
4. **Avvia** il server Python:
```bash
cd C:\TradingBot\
python mt5-python-server.py
```

### **Passo 7: Configurazione Avvio Automatico**

#### **A. Crea Script Batch**
Crea file `start_bot.bat`:
```batch
@echo off
cd C:\TradingBot\
python mt5-python-server.py
pause
```

#### **B. Aggiungi a Startup**
1. **Premi** `Win + R`
2. **Digita** `shell:startup`
3. **Copia** `start_bot.bat` nella cartella
4. **Riavvia** il server per testare

## 🔧 Configurazione Avanzata

### **Firewall Settings**

1. **Apri** Windows Firewall
2. **Aggiungi** regola in entrata:
   - **Porta**: 8080
   - **Protocollo**: TCP
   - **Azione**: Consenti

### **Backup Automatico**

Crea script `backup.bat`:
```batch
@echo off
set backup_dir=C:\Backups\%date:~-4,4%-%date:~-10,2%-%date:~-7,2%
mkdir "%backup_dir%"
xcopy "C:\TradingBot\*" "%backup_dir%\" /E /Y
echo Backup completed: %backup_dir%
```

Aggiungi a Task Scheduler per esecuzione giornaliera.

### **Monitoring Script**

Crea `monitor.py`:
```python
import requests
import time
import smtplib
from email.mime.text import MIMEText

def check_bot_status():
    try:
        response = requests.get("http://localhost:8080/status", timeout=10)
        return response.status_code == 200
    except:
        return False

def send_alert(message):
    # Configura con le tue credenziali email
    sender = "your_email@gmail.com"
    password = "your_password"
    recipient = "your_phone@sms-gateway.com"
    
    msg = MIMEText(message)
    msg['Subject'] = "Trading Bot Alert"
    msg['From'] = sender
    msg['To'] = recipient
    
    with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
        server.login(sender, password)
        server.send_message(msg)

while True:
    if not check_bot_status():
        send_alert("Trading Bot is DOWN!")
    time.sleep(300)  # Check every 5 minutes
```

## 📊 Monitoraggio e Manutenzione

### **Dashboard Monitoring**

Accedi al VPS quotidianamente per verificare:
- ✅ MT5 connesso e trading abilitato
- ✅ Python server in esecuzione
- ✅ Nessun errore nei log
- ✅ Connessione internet stabile

### **Log Files da Monitorare**

1. **MT5 Logs**: `C:\Users\Administrator\AppData\Roaming\MetaQuotes\Terminal\[ID]\Logs\`
2. **Python Logs**: `C:\TradingBot\logs\`
3. **Windows Event Logs**: Event Viewer

### **Manutenzione Settimanale**

1. **Backup** configurazioni
2. **Pulizia** log vecchi
3. **Aggiornamento** Windows
4. **Verifica** performance VPS
5. **Test** connessioni API

### **Manutenzione Mensile**

1. **Analisi** performance trading
2. **Ottimizzazione** parametri
3. **Backup** completo su cloud
4. **Verifica** costi VPS
5. **Aggiornamento** software

## 💰 Ottimizzazione Costi

### **Ridurre i Costi:**

1. **Spegni** il server quando non trading (weekend)
2. **Usa** snapshot invece di backup continui
3. **Monitora** l'utilizzo risorse
4. **Considera** piani annuali per sconti

### **Calcolo ROI:**

```
Costo VPS: €25/mese
Costo API: €10/mese
Totale: €35/mese = €420/anno

Break-even: Se il bot genera >€35/mese di profitto
Target: €100-500/mese di profitto netto
ROI atteso: 200-1400% annuo
```

## 🚨 Troubleshooting Comune

### **Problema: MT5 non si connette**
**Soluzione:**
1. Verifica credenziali account
2. Controlla firewall Windows
3. Testa connessione internet
4. Riavvia MT5

### **Problema: Python server crash**
**Soluzione:**
1. Controlla log errori
2. Verifica dipendenze installate
3. Riavvia con privilegi admin
4. Controlla porta 8080 libera

### **Problema: Bot non risponde su Telegram**
**Soluzione:**
1. Verifica token Telegram
2. Controlla webhook configurato
3. Testa API Gemini
4. Verifica connessione internet

### **Problema: Ordini non eseguiti**
**Soluzione:**
1. Verifica saldo account MT5
2. Controlla trading abilitato
3. Verifica simbolo disponibile
4. Controlla orari di mercato

## 🎯 Best Practices

### **Sicurezza:**
1. **Cambia** password default VPS
2. **Abilita** 2FA dove possibile
3. **Usa** VPN per accesso RDP
4. **Backup** regolari offsite

### **Performance:**
1. **Monitora** utilizzo CPU/RAM
2. **Ottimizza** startup programs
3. **Pulisci** file temporanei
4. **Aggiorna** driver regolarmente

### **Trading:**
1. **Inizia** con account demo
2. **Usa** lot size conservativi
3. **Monitora** performance attivamente
4. **Diversifica** simboli trading

Con questa configurazione VPS, il tuo trading bot funzionerà 24/7 in modo affidabile e professionale! 🚀
