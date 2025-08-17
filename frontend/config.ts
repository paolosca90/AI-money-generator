// File di configurazione per le variabili d'ambiente del frontend

// Configurazione Bot Telegram
// TODO: Imposta questo al nome utente del tuo bot Telegram (senza @)
// Puoi trovarlo in BotFather dopo aver creato il tuo bot
export const telegramBotUsername = "";

// URL Base API
// Questo è configurato automaticamente da Leap, ma puoi sovrascriverlo se necessario
export const apiBaseUrl = process.env.NODE_ENV === 'production' 
  ? 'https://your-app.leap.dev' 
  : 'http://localhost:4000';

// Configurazione Grafici
export const chartConfig = {
  // Dimensioni predefinite dei grafici
  width: 800,
  height: 400,
  
  // Tema grafico
  theme: 'light',
  
  // Timeframe predefinito per i grafici
  defaultTimeframe: '5m',
};

// Configurazione Trading
export const tradingConfig = {
  // Simboli predefiniti da mostrare nei dropdown
  defaultSymbols: [
    'BTCUSD',
    'EURUSD', 
    'GBPUSD',
    'USDJPY',
    'XAUUSD',
    'CRUDE'
  ],
  
  // Dimensioni lotto predefinite
  defaultLotSizes: [0.01, 0.05, 0.1, 0.2, 0.5, 1.0],
  
  // Soglia minima di confidenza per i segnali (enhanced system)
  minConfidenceThreshold: 75, // Increased from 60 to filter higher quality signals
  
  // Soglia massima di confidenza per i segnali  
  maxConfidenceThreshold: 95,

  // Enhanced confidence grading thresholds
  confidenceGrades: {
    "A+": 90,  // Excellent signals
    "A": 85,   // Very good signals
    "B+": 80,  // Good signals
    "B": 75,   // Acceptable signals
    "C": 60,   // Marginal signals
    "D": 45,   // Poor signals
    "F": 0     // Failed signals
  },
};

// Configurazione UI
export const uiConfig = {
  // Intervalli di aggiornamento (in millisecondi)
  performanceRefreshInterval: 30000, // 30 secondi
  signalsRefreshInterval: 10000,     // 10 secondi
  
  // Durata animazioni
  animationDuration: 300,
  
  // Durata notifiche toast
  toastDuration: 5000,
};

// Flag Funzionalità
export const features = {
  // Abilita/disabilita generazione grafici
  enableCharts: true,
  
  // Abilita/disabilita aggiornamenti in tempo reale
  enableRealTimeUpdates: true,
  
  // Abilita/disabilita analisi avanzate
  enableAdvancedAnalytics: true,
  
  // Abilita/disabilita modalità demo
  enableDemoMode: false,
};

// Messaggi di Errore
export const errorMessages = {
  networkError: "Errore di rete. Controlla la tua connessione e riprova.",
  apiError: "Errore API. Riprova più tardi.",
  invalidSymbol: "Simbolo di trading non valido. Controlla e riprova.",
  invalidLotSize: "Dimensione lotto non valida. Inserisci un numero valido.",
  executionFailed: "Esecuzione trade fallita. Controlla la tua connessione MT5.",
  predictionFailed: "Impossibile generare previsione. Riprova.",
  mt5NotConnected: "MT5 non connesso. Controlla il tuo terminale MetaTrader 5.",
  insufficientMargin: "Margine insufficiente per questa dimensione di trade.",
};

// Messaggi di Successo
export const successMessages = {
  tradeExecuted: "Trade eseguito con successo su MT5!",
  signalGenerated: "Segnale di trading generato con successo!",
  settingsSaved: "Impostazioni salvate con successo!",
  mt5Connected: "Connessione MT5 stabilita con successo!",
};

// Regole di Validazione
export const validation = {
  // Pattern di validazione simbolo
  symbolPattern: /^[A-Z]{3,8}$/,
  
  // Limiti dimensione lotto
  minLotSize: 0.01,
  maxLotSize: 100,
  
  // Limiti confidenza
  minConfidence: 0,
  maxConfidence: 100,
};

// Configurazione MT5
export const mt5Config = {
  // Impostazioni di connessione predefinite
  defaultHost: 'localhost',
  defaultPort: 8080,
  
  // Timeout connessione (millisecondi)
  connectionTimeout: 10000,
  
  // Tentativi di riconnessione per connessioni fallite
  maxRetries: 3,
  
  // Impostazioni esecuzione ordini
  defaultDeviation: 20, // Deviazione prezzo in punti
  defaultMagic: 234000, // ID Expert Advisor
  
  // Gestione del rischio
  maxLotSizePerTrade: 10.0,
  maxDailyTrades: 50,
  
  // Tipi di ordine supportati
  supportedOrderTypes: ['MARKET', 'PENDING', 'STOP', 'LIMIT'],
  
  // Mappature simboli comuni per diversi broker
  symbolMappings: {
    'BTCUSD': ['BTCUSD', 'BTCUSDm', 'BITCOIN'],
    'EURUSD': ['EURUSD', 'EURUSDm', 'EUR/USD'],
    'GBPUSD': ['GBPUSD', 'GBPUSDm', 'GBP/USD'],
    'USDJPY': ['USDJPY', 'USDJPYm', 'USD/JPY'],
    'XAUUSD': ['XAUUSD', 'GOLD', 'XAU/USD'],
    'CRUDE': ['CRUDE', 'WTI', 'OIL'],
  },
};
