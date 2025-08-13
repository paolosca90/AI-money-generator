# Guida Facile: Collega il Tuo VPS e MT5 al Bot! 🚀

Ciao! Sono qui per aiutarti a collegare il tuo nuovo computer virtuale (VPS) e il tuo account MetaTrader 5 al nostro bot. Pensa a me come al tuo amico esperto di computer. Segui questi passaggi, è più facile di quanto pensi!

---

### **Passo 1: Trova i "Documenti" del Tuo Nuovo Computer 📄**

Quando hai comprato il VPS, il tuo fornitore (come Contabo o Vultr) ti ha inviato un'email o ti ha dato una pagina con delle informazioni importanti. Cerca questi tre dati, sono come le chiavi di casa:

1.  **Indirizzo IP (IP Address)**: Un numero come `123.45.67.89`. È l'indirizzo del tuo computer nel mondo di Internet.
2.  **Nome Utente (Username)**: Di solito è `Administrator`.
3.  **Password**: Una password lunga e complicata.

Tieni questi dati a portata di mano!

---

### **Passo 2: Entra nel Tuo Nuovo Computer Virtuale 🖥️**

Ora usiamo il tuo computer di casa per entrare in quello virtuale.

1.  Sul tuo computer Windows, premi il tasto `Windows` + `R` sulla tastiera.
2.  Si aprirà una piccola finestra. Scrivi `mstsc` e premi Invio.
3.  Apparirà il programma "Connessione Desktop Remoto".
4.  Nel campo "Computer", inserisci l'**Indirizzo IP** del tuo VPS e clicca "Connetti".
5.  Ti chiederà il nome utente e la password. Inserisci `Administrator` e la **Password** che hai trovato prima.
6.  Se appare un avviso di sicurezza, clicca "Sì".

**Fatto!** Ora dovresti vedere il desktop di un computer Windows nuovo di zecca. Questo è il tuo VPS!

---

### **Passo 3: Prepara il Tuo Nuovo Computer 🛠️**

Dobbiamo installare due programmi sul tuo VPS.

**A) Installa MetaTrader 5:**
1.  Sul VPS, apri il browser (di solito c'è Edge) e vai sul sito del tuo broker di trading.
2.  Scarica e installa MetaTrader 5, proprio come faresti sul tuo computer normale.
3.  Apri MT5 e accedi con il tuo numero di conto, password e server del broker.

**B) Installa Python (il "linguaggio" del nostro ponte):**
1.  Sempre sul VPS, vai su [python.org/downloads](https://www.python.org/downloads/).
2.  Scarica l'ultima versione di Python (es. Python 3.11).
3.  Avvia l'installazione. **IMPORTANTE:** Metti la spunta su "**Add Python to PATH**" prima di cliccare "Install Now".

---

### **Passo 4: Dai i Permessi a MetaTrader 5 ✅**

Dobbiamo dire a MT5 che può "parlare" con il nostro bot.

1.  In MetaTrader 5, vai su **Strumenti (Tools) → Opzioni (Options)**.
2.  Vai nella scheda **Consiglieri Esperti (Expert Advisors)**.
3.  Metti la spunta su queste caselle:
    *   ✅ `Allow automated trading` (Consenti trading automatico)
    *   ✅ `Allow DLL imports` (Consenti importazione di DLL)
4.  Clicca OK. Lascia MetaTrader 5 aperto e connesso.

---

### **Passo 5: Costruisci il "Ponte" tra il Bot e MT5 🌉**

Ora creiamo il programma che fa da ponte.

1.  Sul VPS, crea una cartella facile da trovare, per esempio su `C:\TradingBot`.
2.  Scarica il file `mt5-python-server.py` dal nostro sistema e salvalo in quella cartella.
3.  Apri il "Prompt dei comandi" (Command Prompt):
    *   Premi il tasto `Windows`.
    *   Scrivi `cmd` e premi Invio.
4.  Nel prompt dei comandi nero, scrivi questi comandi uno alla volta e premi Invio dopo ognuno:
    ```bash
    pip install MetaTrader5 flask flask-cors
    ```
    (Aspetta che finisca di installare)
    ```bash
    cd C:\TradingBot
    ```
    ```bash
    python mt5-python-server.py
    ```
5.  Se tutto va bene, vedrai un messaggio che dice `Starting MT5 Python Server...`. **Lascia questa finestra nera aperta!** Se la chiudi, il ponte crolla.

---

### **Passo 6: Collega il Bot al Tuo VPS 🔗**

Ora torniamo alla pagina del nostro sistema (Leap) per dire al bot dove trovare il tuo VPS.

1.  Vai nel tab **Infrastructure**.
2.  Trova i "Secrets" e inserisci i dati del tuo VPS e di MT5:
    *   `MT5ServerHost`: Inserisci l'**Indirizzo IP** del tuo VPS.
    *   `MT5ServerPort`: Scrivi `8080`.
    *   `MT5Login`: Il tuo **numero di conto** MetaTrader 5.
    *   `MT5Password`: La **password** del tuo conto MetaTrader 5.
    *   `MT5Server`: Il **nome del server** del tuo broker (es. `XMGlobal-Demo`).

Salva le modifiche.

---

### **Passo 7: Prova Finale! 🎉**

È il momento della verità!

1.  Apri Telegram e vai al tuo bot.
2.  Invia il comando `/status`.
3.  Il bot dovrebbe risponderti che è connesso a MT5.
4.  Ora prova a chiedere un'analisi: `/predict EURUSD`.

Se tutto funziona, il bot userà i prezzi in tempo reale direttamente dal tuo MetaTrader 5 sul tuo VPS!

**Complimenti!** Hai appena configurato un sistema di trading professionale. Se hai problemi, rileggi i passaggi con calma. Ce la puoi fare! 💪
