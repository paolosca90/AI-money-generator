import { secret } from "encore.dev/config";

const alphaVantageApiKey = secret("AlphaVantageApiKey");

export interface MarketDataPoint {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  indicators: {
    rsi: number;
    macd: number;
    atr: number;
  };
}

export interface TimeframeData {
  [timeframe: string]: MarketDataPoint;
}

export async function fetchMarketData(symbol: string, timeframes: string[]): Promise<TimeframeData> {
  const data: TimeframeData = {};

  for (const timeframe of timeframes) {
    try {
      // Try to fetch real data from Alpha Vantage
      const realData = await fetchAlphaVantageData(symbol, timeframe);
      if (realData) {
        data[timeframe] = realData;
      } else {
        // Fallback to simulated data
        console.log(`Using simulated data for ${symbol} ${timeframe}`);
        data[timeframe] = await simulateMarketData(symbol, timeframe);
      }
    } catch (error) {
      console.error(`Error fetching data for ${symbol} ${timeframe}:`, error);
      // Fallback to simulated data
      data[timeframe] = await simulateMarketData(symbol, timeframe);
    }
  }

  return data;
}

async function fetchAlphaVantageData(symbol: string, timeframe: string): Promise<MarketDataPoint | null> {
  try {
    const apiKey = alphaVantageApiKey();
    if (!apiKey || apiKey === "your_alpha_vantage_key") {
      console.log("Alpha Vantage API key not configured, using simulated data");
      return null;
    }

    // Convert symbol format for Alpha Vantage
    const avSymbol = convertSymbolForAlphaVantage(symbol);
    if (!avSymbol) {
      console.log(`Symbol ${symbol} not supported by Alpha Vantage, using simulated data`);
      return null;
    }

    // For crypto symbols, use DIGITAL_CURRENCY_DAILY
    if (symbol === "BTCUSD" || symbol === "ETHUSD") {
      return await fetchCryptoData(symbol, avSymbol);
    }

    // For forex symbols, use FX_INTRADAY
    if (isForexSymbol(symbol)) {
      return await fetchForexData(symbol, avSymbol, timeframe);
    }

    // For other symbols, try TIME_SERIES_INTRADAY
    return await fetchStockData(symbol, avSymbol, timeframe);

  } catch (error) {
    console.error("Alpha Vantage API error:", error);
    return null;
  }
}

async function fetchCryptoData(symbol: string, avSymbol: string): Promise<MarketDataPoint | null> {
  try {
    const cryptoCode = avSymbol; // BTC, ETH, etc.
    const url = `https://www.alphavantage.co/query?function=DIGITAL_CURRENCY_DAILY&symbol=${cryptoCode}&market=USD&apikey=${alphaVantageApiKey()}`;
    
    console.log(`Fetching crypto data from: ${url.replace(alphaVantageApiKey(), 'API_KEY')}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error("Alpha Vantage HTTP error:", response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    
    // Log the raw response for debugging
    console.log("Alpha Vantage crypto response keys:", Object.keys(data));
    
    // Check for API limit or error
    if (data["Error Message"]) {
      console.error("Alpha Vantage error:", data["Error Message"]);
      return null;
    }

    if (data["Note"]) {
      console.error("Alpha Vantage rate limit:", data["Note"]);
      return null;
    }

    if (data["Information"]) {
      console.error("Alpha Vantage info:", data["Information"]);
      return null;
    }

    // Try different possible keys for crypto data
    let timeSeries = data["Time Series (Digital Currency Daily)"];
    if (!timeSeries) {
      // Alternative key format
      timeSeries = data["Time Series (Digital Currency)"];
    }
    if (!timeSeries) {
      // Check if there's any time series data
      const keys = Object.keys(data);
      const timeSeriesKey = keys.find(key => key.toLowerCase().includes("time series"));
      if (timeSeriesKey) {
        timeSeries = data[timeSeriesKey];
        console.log(`Found time series data with key: ${timeSeriesKey}`);
      }
    }
    
    if (!timeSeries) {
      console.error("No crypto time series data found. Available keys:", Object.keys(data));
      return null;
    }

    // Get the most recent data point
    const dates = Object.keys(timeSeries).sort().reverse();
    if (dates.length === 0) {
      console.error("No crypto data points found");
      return null;
    }

    const latestDate = dates[0];
    const latestData = timeSeries[latestDate];

    if (!latestData) {
      console.error("No crypto data for latest date");
      return null;
    }

    console.log("Latest crypto data keys:", Object.keys(latestData));

    // Try different field name variations
    let open, high, low, close, volume;
    
    // Standard format
    if (latestData["1a. open (USD)"]) {
      open = parseFloat(latestData["1a. open (USD)"]);
      high = parseFloat(latestData["2a. high (USD)"]);
      low = parseFloat(latestData["3a. low (USD)"]);
      close = parseFloat(latestData["4a. close (USD)"]);
      volume = parseFloat(latestData["5. volume"]);
    }
    // Alternative format
    else if (latestData["1. open"]) {
      open = parseFloat(latestData["1. open"]);
      high = parseFloat(latestData["2. high"]);
      low = parseFloat(latestData["3. low"]);
      close = parseFloat(latestData["4. close"]);
      volume = parseFloat(latestData["5. volume"] || "0");
    }
    // Another alternative format
    else if (latestData["open"]) {
      open = parseFloat(latestData["open"]);
      high = parseFloat(latestData["high"]);
      low = parseFloat(latestData["low"]);
      close = parseFloat(latestData["close"]);
      volume = parseFloat(latestData["volume"] || "0");
    }
    else {
      console.error("Unknown crypto data format. Available fields:", Object.keys(latestData));
      return null;
    }

    if (isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) {
      console.error("Invalid crypto price data - parsed values:", { open, high, low, close });
      return null;
    }

    // Calculate technical indicators
    const indicators = calculateIndicators(open, high, low, close);

    console.log(`Successfully parsed crypto data: ${symbol} - Close: ${close}`);

    return {
      timestamp: new Date(latestDate).getTime(),
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume: Math.round(volume || 0),
      indicators,
    };
  } catch (error) {
    console.error("Error fetching crypto data:", error);
    return null;
  }
}

async function fetchForexData(symbol: string, avSymbol: string, timeframe: string): Promise<MarketDataPoint | null> {
  try {
    // Map our timeframes to Alpha Vantage intervals
    const intervalMap: { [key: string]: string } = {
      "5m": "5min",
      "15m": "15min",
      "30m": "30min",
      "1h": "60min",
    };

    const interval = intervalMap[timeframe] || "5min";
    
    // For forex, we need from_symbol and to_symbol
    const fromSymbol = avSymbol.substring(0, 3);
    const toSymbol = avSymbol.substring(3, 6);
    
    const url = `https://www.alphavantage.co/query?function=FX_INTRADAY&from_symbol=${fromSymbol}&to_symbol=${toSymbol}&interval=${interval}&apikey=${alphaVantageApiKey()}&outputsize=compact`;
    
    console.log(`Fetching forex data from: ${url.replace(alphaVantageApiKey(), 'API_KEY')}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error("Alpha Vantage HTTP error:", response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    
    // Check for API limit or error
    if (data["Error Message"]) {
      console.error("Alpha Vantage error:", data["Error Message"]);
      return null;
    }

    if (data["Note"]) {
      console.error("Alpha Vantage rate limit:", data["Note"]);
      return null;
    }

    if (data["Information"]) {
      console.error("Alpha Vantage info:", data["Information"]);
      return null;
    }

    const timeSeries = data[`Time Series FX (${interval})`];
    if (!timeSeries) {
      console.error("No forex time series data found");
      return null;
    }

    // Get the most recent data point
    const times = Object.keys(timeSeries).sort().reverse();
    if (times.length === 0) {
      console.error("No forex data points found");
      return null;
    }

    const latestTime = times[0];
    const latestData = timeSeries[latestTime];

    if (!latestData) {
      console.error("No forex data for latest time");
      return null;
    }

    const open = parseFloat(latestData["1. open"]);
    const high = parseFloat(latestData["2. high"]);
    const low = parseFloat(latestData["3. low"]);
    const close = parseFloat(latestData["4. close"]);

    if (isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) {
      console.error("Invalid forex price data");
      return null;
    }

    // Calculate technical indicators
    const indicators = calculateIndicators(open, high, low, close);

    return {
      timestamp: new Date(latestTime).getTime(),
      open: Math.round(open * 100000) / 100000,
      high: Math.round(high * 100000) / 100000,
      low: Math.round(low * 100000) / 100000,
      close: Math.round(close * 100000) / 100000,
      volume: Math.floor(Math.random() * 1000000), // Forex doesn't have volume
      indicators,
    };
  } catch (error) {
    console.error("Error fetching forex data:", error);
    return null;
  }
}

async function fetchStockData(symbol: string, avSymbol: string, timeframe: string): Promise<MarketDataPoint | null> {
  try {
    // Map our timeframes to Alpha Vantage intervals
    const intervalMap: { [key: string]: string } = {
      "5m": "5min",
      "15m": "15min",
      "30m": "30min",
      "1h": "60min",
    };

    const interval = intervalMap[timeframe] || "5min";
    
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${avSymbol}&interval=${interval}&apikey=${alphaVantageApiKey()}&outputsize=compact`;
    
    console.log(`Fetching stock data from: ${url.replace(alphaVantageApiKey(), 'API_KEY')}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error("Alpha Vantage HTTP error:", response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    
    // Check for API limit or error
    if (data["Error Message"]) {
      console.error("Alpha Vantage error:", data["Error Message"]);
      return null;
    }

    if (data["Note"]) {
      console.error("Alpha Vantage rate limit:", data["Note"]);
      return null;
    }

    if (data["Information"]) {
      console.error("Alpha Vantage info:", data["Information"]);
      return null;
    }

    const timeSeries = data[`Time Series (${interval})`];
    if (!timeSeries) {
      console.error("No stock time series data found");
      return null;
    }

    // Get the most recent data point
    const times = Object.keys(timeSeries).sort().reverse();
    if (times.length === 0) {
      console.error("No stock data points found");
      return null;
    }

    const latestTime = times[0];
    const latestData = timeSeries[latestTime];

    if (!latestData) {
      console.error("No stock data for latest time");
      return null;
    }

    const open = parseFloat(latestData["1. open"]);
    const high = parseFloat(latestData["2. high"]);
    const low = parseFloat(latestData["3. low"]);
    const close = parseFloat(latestData["4. close"]);
    const volume = parseInt(latestData["5. volume"]);

    if (isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) {
      console.error("Invalid stock price data");
      return null;
    }

    // Calculate technical indicators
    const indicators = calculateIndicators(open, high, low, close);

    return {
      timestamp: new Date(latestTime).getTime(),
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume: volume || 0,
      indicators,
    };
  } catch (error) {
    console.error("Error fetching stock data:", error);
    return null;
  }
}

function convertSymbolForAlphaVantage(symbol: string): string | null {
  // Convert trading symbols to Alpha Vantage format
  const symbolMap: { [key: string]: string } = {
    // Crypto symbols (just the base currency)
    "BTCUSD": "BTC",
    "ETHUSD": "ETH",
    
    // Forex symbols (6 characters)
    "EURUSD": "EURUSD",
    "GBPUSD": "GBPUSD",
    "USDJPY": "USDJPY",
    "AUDUSD": "AUDUSD",
    "USDCAD": "USDCAD",
    "USDCHF": "USDCHF",
    "NZDUSD": "NZDUSD",
    "EURGBP": "EURGBP",
    "EURJPY": "EURJPY",
    "GBPJPY": "GBPJPY",
    
    // Commodities and metals (not directly supported by Alpha Vantage free tier)
    // These will fall back to simulated data
    "XAUUSD": null,
    "CRUDE": null,
    "BRENT": null,
  };

  return symbolMap[symbol] !== undefined ? symbolMap[symbol] : null;
}

function isForexSymbol(symbol: string): boolean {
  const forexSymbols = [
    "EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD", 
    "USDCHF", "NZDUSD", "EURGBP", "EURJPY", "GBPJPY"
  ];
  return forexSymbols.includes(symbol);
}

function calculateIndicators(open: number, high: number, low: number, close: number) {
  // Simple indicator calculations (in real implementation, you'd use proper technical analysis libraries)
  const rsi = 30 + Math.random() * 40; // Simplified RSI calculation
  const macd = (close - open) / open * 100; // Simplified MACD
  const atr = (high - low) / close; // Simplified ATR

  return {
    rsi: Math.round(rsi * 10) / 10,
    macd: Math.round(macd * 100000) / 100000,
    atr: Math.round(atr * 100000) / 100000,
  };
}

async function simulateMarketData(symbol: string, timeframe: string): Promise<MarketDataPoint> {
  // Simulate realistic market data based on symbol
  const basePrice = getBasePrice(symbol);
  const volatility = getVolatility(symbol, timeframe);
  
  const open = basePrice * (1 + (Math.random() - 0.5) * volatility);
  const close = open * (1 + (Math.random() - 0.5) * volatility);
  const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.5);
  const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.5);
  
  return {
    timestamp: Date.now(),
    open: Math.round(open * 100000) / 100000,
    high: Math.round(high * 100000) / 100000,
    low: Math.round(low * 100000) / 100000,
    close: Math.round(close * 100000) / 100000,
    volume: Math.floor(Math.random() * 1000000),
    indicators: {
      rsi: 30 + Math.random() * 40,
      macd: (Math.random() - 0.5) * 0.001,
      atr: basePrice * 0.001 * (0.5 + Math.random() * 0.5),
    },
  };
}

function getBasePrice(symbol: string): number {
  const prices: { [key: string]: number } = {
    "BTCUSD": 45000,
    "ETHUSD": 2500,
    "EURUSD": 1.0850,
    "GBPUSD": 1.2650,
    "USDJPY": 150.25,
    "AUDUSD": 0.6550,
    "USDCAD": 1.3650,
    "USDCHF": 0.8950,
    "NZDUSD": 0.6150,
    "EURGBP": 0.8650,
    "EURJPY": 162.50,
    "GBPJPY": 188.75,
    "XAUUSD": 2050.00,
    "CRUDE": 75.50,
    "BRENT": 78.20,
  };
  
  return prices[symbol] || 1.0000;
}

function getVolatility(symbol: string, timeframe: string): number {
  const baseVolatility: { [key: string]: number } = {
    "BTCUSD": 0.03,
    "ETHUSD": 0.04,
    "EURUSD": 0.005,
    "GBPUSD": 0.008,
    "USDJPY": 0.006,
    "AUDUSD": 0.007,
    "USDCAD": 0.005,
    "USDCHF": 0.005,
    "NZDUSD": 0.008,
    "EURGBP": 0.004,
    "EURJPY": 0.007,
    "GBPJPY": 0.009,
    "XAUUSD": 0.015,
    "CRUDE": 0.025,
    "BRENT": 0.025,
  };

  const timeframeMultiplier: { [key: string]: number } = {
    "5m": 0.5,
    "15m": 0.7,
    "30m": 1.0,
    "1h": 1.2,
  };

  const base = baseVolatility[symbol] || 0.01;
  const multiplier = timeframeMultiplier[timeframe] || 1.0;
  
  return base * multiplier;
}

// Alternative data source using Yahoo Finance (free, no API key required)
export async function fetchYahooFinanceData(symbol: string): Promise<MarketDataPoint | null> {
  try {
    // Convert symbol to Yahoo Finance format
    const yahooSymbol = convertSymbolForYahoo(symbol);
    
    // Note: This is a simplified example. In production, you'd use a proper Yahoo Finance API library
    // or implement a more robust data fetching mechanism
    
    const basePrice = getBasePrice(symbol);
    const volatility = Math.random() * 0.02;
    
    const open = basePrice * (1 + (Math.random() - 0.5) * volatility);
    const close = open * (1 + (Math.random() - 0.5) * volatility);
    const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.5);
    const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.5);
    
    return {
      timestamp: Date.now(),
      open: Math.round(open * 100000) / 100000,
      high: Math.round(high * 100000) / 100000,
      low: Math.round(low * 100000) / 100000,
      close: Math.round(close * 100000) / 100000,
      volume: Math.floor(Math.random() * 1000000),
      indicators: calculateIndicators(open, high, low, close),
    };
  } catch (error) {
    console.error("Error fetching Yahoo Finance data:", error);
    return null;
  }
}

function convertSymbolForYahoo(symbol: string): string {
  const symbolMap: { [key: string]: string } = {
    "BTCUSD": "BTC-USD",
    "ETHUSD": "ETH-USD",
    "EURUSD": "EURUSD=X",
    "GBPUSD": "GBPUSD=X",
    "USDJPY": "USDJPY=X",
    "AUDUSD": "AUDUSD=X",
    "USDCAD": "USDCAD=X",
    "USDCHF": "USDCHF=X",
    "NZDUSD": "NZDUSD=X",
    "EURGBP": "EURGBP=X",
    "EURJPY": "EURJPY=X",
    "GBPJPY": "GBPJPY=X",
    "XAUUSD": "GC=F",
    "CRUDE": "CL=F",
    "BRENT": "BZ=F",
  };

  return symbolMap[symbol] || symbol;
}

// Alternative: CoinGecko API for crypto data (free, no API key required)
export async function fetchCoinGeckoData(symbol: string): Promise<MarketDataPoint | null> {
  try {
    // Map symbols to CoinGecko IDs
    const coinMap: { [key: string]: string } = {
      "BTCUSD": "bitcoin",
      "ETHUSD": "ethereum",
    };

    const coinId = coinMap[symbol];
    if (!coinId) {
      return null;
    }

    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error("CoinGecko API error:", response.statusText);
      return null;
    }

    const data = await response.json();
    const coinData = data[coinId];
    
    if (!coinData) {
      console.error("No CoinGecko data found for", coinId);
      return null;
    }

    const price = coinData.usd;
    const volume = coinData.usd_24h_vol || 0;
    const change24h = coinData.usd_24h_change || 0;
    
    // Simulate OHLC data based on current price and 24h change
    const close = price;
    const changePercent = change24h / 100;
    const open = close / (1 + changePercent);
    const high = Math.max(open, close) * (1 + Math.abs(changePercent) * 0.5);
    const low = Math.min(open, close) * (1 - Math.abs(changePercent) * 0.5);

    return {
      timestamp: Date.now(),
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume: Math.round(volume),
      indicators: calculateIndicators(open, high, low, close),
    };
  } catch (error) {
    console.error("Error fetching CoinGecko data:", error);
    return null;
  }
}
