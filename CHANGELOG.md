# Changelog

## [v3.0.0] - 2025-01-15 - Evoluzione AI e Integrazione Funzionalità Avanzate

This release marks a significant evolution of the AI Trading Bot, incorporating advanced analysis techniques, a more robust command structure, full Italian localization, and a clear path to commercialization.

### 🎯 Funzionalità Principali

#### 🧠 Sistema di Analisi Potenziato
- **Suggerimenti Alternativi**: Se un segnale per un asset richiesto ha un'affidabilità inferiore al 70%, il bot ora suggerisce proattivamente fino a 3 asset alternativi con segnali più forti.
- **Scadenza Segnale Dinamica**: Ogni segnale ora ha una data di scadenza calcolata per chiudere la posizione prima della chiusura della sessione di New York, gestita da uno scheduler dedicato.
- **Miglioramento Tipi**: `TradingStrategy` è stato refattorizzato da `type` a `enum` per maggiore robustezza e type safety in tutto il codice.

#### 🇮🇹 Localizzazione Completa in Italiano
- **Interfaccia Utente**: Tutti i comandi, i messaggi, i menu e le risposte del bot sono ora interamente in italiano.
- **Sistema i18n**: Centralizzato il sistema di traduzione in `i18n.ts`, rendendo l'aggiunta di nuove lingue più semplice.

#### 🤖 Nuovi Comandi Telegram
- **/stato**: Fornisce uno stato in tempo reale delle posizioni aperte su MT5, inclusi PnL, volume e prezzo di apertura.
- **/chiudi**: Permette di chiudere una posizione aperta direttamente da Telegram, specificando l'ID del ticket.
- **/affidabilita**: Fornisce un rapido punteggio di affidabilità per un asset, senza generare un segnale completo.
- **/lista_asset**: Mostra un elenco completo degli asset supportati per l'analisi.
- **/imposta**: (Foundation) Aggiunto handler per un futuro wizard di configurazione parametri di default.
- **/ordina**: (Foundation) Aggiunto handler per un futuro comando di inserimento ordini diretti.
- **/backtest**: (Foundation) Aggiunto handler per future funzionalità di backtesting rapido.

#### 🌉 Integrazione MT5 Migliorata
- **Gestione Posizioni**: Il bridge MT5 (`mt5-bridge.ts`) e il server Python (`mt5-python-server.py`) sono stati estesi per supportare il recupero delle posizioni aperte e la chiusura degli ordini.
- **Endpoint Aggiuntivi**: Aggiunti endpoint `/positions` e `/close_position` al server Flask per una gestione completa del ciclo di vita del trade.

#### 🏗️ Architettura e Scheduler
- **Servizio Scheduler**: Introdotto un nuovo microservizio Encore (`scheduler`) con un cron job che viene eseguito ogni minuto per gestire la logica di scadenza dei trade.
- **Database Schema**: Aggiunta la colonna `expires_at` alla tabella `trading_signals` per supportare la chiusura automatica delle posizioni.

### 🔧 Miglioramenti Tecnici

- **Refactoring**: Il codice è stato refattorizzato per utilizzare il nuovo `enum TradingStrategy` e il sistema i18n centralizzato.
- **Pulizia Codice**: Rimossi file generati (`.js`, `.map`, `.d.ts`) e di backup dall'albero dei sorgenti per una codebase più pulita.
- **Documentazione**: Aggiornato il `user-manual.md` per riflettere i nuovi comandi e le funzionalità in italiano.

### 📋 Prossimi Passi

- Implementazione completa dei wizard di configurazione (`/imposta`, `/config_rischio`).
- Sviluppo del modulo di backtesting.
- Migrazione del bridge Python da HTTP a gRPC per performance e scalabilità migliorate.
