// Configuration file for frontend environment variables

// Telegram Bot Configuration
// TODO: Set this to your Telegram bot username (without @)
// You can find this in BotFather after creating your bot
export const telegramBotUsername = "";

// API Base URL
// This is automatically configured by Leap, but you can override if needed
export const apiBaseUrl = process.env.NODE_ENV === 'production' 
  ? 'https://your-app.leap.dev' 
  : 'http://localhost:4000';

// Chart Configuration
export const chartConfig = {
  // Default chart dimensions
  width: 800,
  height: 400,
  
  // Chart theme
  theme: 'light',
  
  // Default timeframe for charts
  defaultTimeframe: '5m',
};

// Trading Configuration
export const tradingConfig = {
  // Default symbols to show in dropdowns
  defaultSymbols: [
    'BTCUSD',
    'EURUSD', 
    'GBPUSD',
    'USDJPY',
    'XAUUSD',
    'CRUDE'
  ],
  
  // Default lot sizes
  defaultLotSizes: [0.01, 0.05, 0.1, 0.2, 0.5, 1.0],
  
  // Minimum confidence threshold for signals
  minConfidenceThreshold: 60,
  
  // Maximum confidence threshold for signals  
  maxConfidenceThreshold: 95,
};

// UI Configuration
export const uiConfig = {
  // Refresh intervals (in milliseconds)
  performanceRefreshInterval: 30000, // 30 seconds
  signalsRefreshInterval: 10000,     // 10 seconds
  
  // Animation durations
  animationDuration: 300,
  
  // Toast notification duration
  toastDuration: 5000,
};

// Feature Flags
export const features = {
  // Enable/disable chart generation
  enableCharts: true,
  
  // Enable/disable real-time updates
  enableRealTimeUpdates: true,
  
  // Enable/disable advanced analytics
  enableAdvancedAnalytics: true,
  
  // Enable/disable demo mode
  enableDemoMode: false,
};

// Error Messages
export const errorMessages = {
  networkError: "Network error. Please check your connection and try again.",
  apiError: "API error. Please try again later.",
  invalidSymbol: "Invalid trading symbol. Please check and try again.",
  invalidLotSize: "Invalid lot size. Please enter a valid number.",
  executionFailed: "Trade execution failed. Please check your MT5 connection.",
  predictionFailed: "Failed to generate prediction. Please try again.",
  mt5NotConnected: "MT5 not connected. Please check your MetaTrader 5 terminal.",
  insufficientMargin: "Insufficient margin for this trade size.",
};

// Success Messages
export const successMessages = {
  tradeExecuted: "Trade executed successfully on MT5!",
  signalGenerated: "Trading signal generated successfully!",
  settingsSaved: "Settings saved successfully!",
  mt5Connected: "MT5 connection established successfully!",
};

// Validation Rules
export const validation = {
  // Symbol validation pattern
  symbolPattern: /^[A-Z]{3,8}$/,
  
  // Lot size limits
  minLotSize: 0.01,
  maxLotSize: 100,
  
  // Confidence limits
  minConfidence: 0,
  maxConfidence: 100,
};

// MT5 Configuration
export const mt5Config = {
  // Default connection settings
  defaultHost: 'localhost',
  defaultPort: 8080,
  
  // Connection timeout (milliseconds)
  connectionTimeout: 10000,
  
  // Retry attempts for failed connections
  maxRetries: 3,
  
  // Order execution settings
  defaultDeviation: 20, // Price deviation in points
  defaultMagic: 234000, // Expert Advisor ID
  
  // Risk management
  maxLotSizePerTrade: 10.0,
  maxDailyTrades: 50,
  
  // Supported order types
  supportedOrderTypes: ['MARKET', 'PENDING', 'STOP', 'LIMIT'],
  
  // Common symbol mappings for different brokers
  symbolMappings: {
    'BTCUSD': ['BTCUSD', 'BTCUSDm', 'BITCOIN'],
    'EURUSD': ['EURUSD', 'EURUSDm', 'EUR/USD'],
    'GBPUSD': ['GBPUSD', 'GBPUSDm', 'GBP/USD'],
    'USDJPY': ['USDJPY', 'USDJPYm', 'USD/JPY'],
    'XAUUSD': ['XAUUSD', 'GOLD', 'XAU/USD'],
    'CRUDE': ['CRUDE', 'WTI', 'OIL'],
  },
};
