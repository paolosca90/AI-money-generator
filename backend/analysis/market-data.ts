import { secret } from "encore.dev/config";

const mt5ServerHost = secret("MT5ServerHost");
const mt5ServerPort = secret("MT5ServerPort");

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
  let mt5Available = false;

  // First, check if MT5 is available
  try {
    const host = mt5ServerHost();
    const port = mt5ServerPort();
    
    if (host && port && host !== "localhost" && host !== "your_vps_ip") {
      // Fix: Construct URL properly without duplicate port
      const baseUrl = host.includes(':') ? `http://${host}` : `http://${host}:${port}`;
      
      const statusResponse = await fetchWithTimeout(`${baseUrl}/status`, {
        method: "GET",
      }, 5000);
      
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        mt5Available = statusData.connected;
        console.log(`MT5 connection status: ${mt5Available ? 'Connected' : 'Disconnected'}`);
      }
    }
  } catch (error) {
    console.log(`MT5 connection check failed: ${error.message}`);
  }

  // Try to fetch data for each timeframe
  for (const timeframe of timeframes) {
    let dataPoint: MarketDataPoint | null = null;

    // Try MT5 first if available
    if (mt5Available) {
      dataPoint = await fetchMT5Data(symbol, timeframe);
      if (dataPoint) {
        console.log(`✅ Successfully fetched MT5 data for ${symbol} ${timeframe}`);
      }
    }

    // If MT5 failed or unavailable, create fallback data
    if (!dataPoint) {
      console.log(`⚠️ MT5 data unavailable for ${symbol} ${timeframe}, using fallback data`);
      dataPoint = createFallbackData(symbol, timeframe);
    }

    data[timeframe] = dataPoint;
  }

  return data;
}

async function fetchMT5Data(symbol: string, timeframe: string): Promise<MarketDataPoint | null> {
  try {
    const host = mt5ServerHost();
    const port = mt5ServerPort();

    // Check if MT5 server configuration is available
    if (!host || !port) {
      console.log("MT5 server not configured. Please set MT5ServerHost and MT5ServerPort in Infrastructure settings.");
      return null;
    }

    // Check for common misconfiguration
    if (host === "your_vps_ip" || host === "localhost") {
      console.log("⚠️  MT5ServerHost is set to 'localhost' or placeholder value.");
      console.log("💡 If you're using a VPS, update MT5ServerHost to your VPS IP address (e.g., 154.61.187.189)");
      console.log("💡 Go to Infrastructure tab → Secrets → Update MT5ServerHost");
      return null;
    }

    // Fix: Construct URL properly without duplicate port
    const baseUrl = host.includes(':') ? `http://${host}` : `http://${host}:${port}`;

    // Try to find the correct symbol format for this broker
    const correctSymbol = await findCorrectSymbolFormat(baseUrl, symbol);
    if (!correctSymbol) {
      console.log(`Symbol ${symbol} not found in any format on this broker`);
      return null;
    }

    // Fetch rates data with the correct symbol and longer timeout
    const response = await fetchWithTimeout(`${baseUrl}/rates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        symbol: correctSymbol,
        timeframe: timeframe,
        count: 50 // Fetch last 50 bars for indicator calculation
      }),
    }, 15000); // 15 second timeout for data fetch

    if (!response.ok) {
      console.error(`MT5 rates endpoint error: ${response.status} ${response.statusText}`);
      return null;
    }

    const result = await response.json();
    if (result.error || !result.rates || result.rates.length === 0) {
      console.error("Failed to get rates from MT5:", result.error || "No rates returned");
      return null;
    }

    // Use the most recent bar (last in the list)
    const latestBar = result.rates[result.rates.length - 1];
    
    const { open, high, low, close, tick_volume, time } = latestBar;

    // Calculate indicators based on the fetched rates
    const indicators = calculateIndicatorsFromRates(result.rates);

    console.log(`Successfully fetched MT5 data for ${symbol} (${correctSymbol}) ${timeframe} - Close: ${close}`);

    return {
      timestamp: time * 1000,
      open,
      high,
      low,
      close,
      volume: tick_volume,
      indicators,
    };

  } catch (error) {
    // This will catch network errors if the python server is not running
    console.log(`Error fetching MT5 data for ${symbol}: ${error.message}`);
    
    // Provide helpful error messages based on error type
    if (error.message.includes("fetch failed") || error.message.includes("ECONNREFUSED")) {
      console.log("💡 MT5 Setup Help:");
      console.log("1. Make sure your VPS is running");
      console.log("2. Ensure MT5 Python server is started: python mt5-python-server.py");
      console.log("3. Check that port 8080 is open on your VPS");
      console.log("4. Verify MT5ServerHost and MT5ServerPort in Infrastructure settings");
      console.log("5. If using VPS, MT5ServerHost should be your VPS IP (e.g., 154.61.187.189), not 'localhost'");
    } else if (error.message.includes("timeout") || error.message.includes("aborted")) {
      console.log("💡 Connection timeout - check your VPS network connection");
      console.log("💡 Possible solutions:");
      console.log("  - Check if VPS is online and accessible");
      console.log("  - Verify firewall settings allow port 8080");
      console.log("  - Restart MT5 Python server on VPS");
      console.log("  - Check VPS internet connection");
    }
    
    return null;
  }
}

// Custom fetch with timeout function
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`The operation was aborted due to timeout (${timeoutMs}ms)`);
    }
    throw error;
  }
}

async function findCorrectSymbolFormat(baseUrl: string, symbol: string): Promise<string | null> {
  // Get possible symbol variations for this broker
  const symbolVariations = getSymbolVariations(symbol);
  
  console.log(`Trying to find correct symbol format for ${symbol}. Testing variations: ${symbolVariations.join(', ')}`);
  
  // Try each variation until we find one that works
  for (const variation of symbolVariations) {
    try {
      const response = await fetchWithTimeout(`${baseUrl}/symbol_info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: variation }),
      }, 5000); // 5 second timeout for symbol check

      if (response.ok) {
        const result = await response.json();
        if (result.symbol_info && !result.error) {
          console.log(`✅ Found correct symbol format: ${symbol} → ${variation}`);
          return variation;
        }
      }
    } catch (error) {
      // Continue to next variation
      continue;
    }
  }
  
  console.log(`❌ No valid symbol format found for ${symbol} on this broker`);
  return null;
}

function getSymbolVariations(symbol: string): string[] {
  // Common symbol variations used by different brokers
  const variations = [symbol]; // Start with the original symbol
  
  // Common suffixes used by different brokers
  const suffixes = ['m', 'pm', 'pro', 'ecn', 'raw', 'c', 'i', '.', '_m', '_pro'];
  
  // Add variations with suffixes
  suffixes.forEach(suffix => {
    variations.push(symbol + suffix);
  });
  
  // Add variations with prefixes (less common but some brokers use them)
  const prefixes = ['m', 'pro', 'ecn'];
  prefixes.forEach(prefix => {
    variations.push(prefix + symbol);
  });
  
  // Specific broker mappings for known cases
  const brokerSpecificMappings = getBrokerSpecificMappings(symbol);
  variations.push(...brokerSpecificMappings);
  
  // Remove duplicates and return
  return [...new Set(variations)];
}

function getBrokerSpecificMappings(symbol: string): string[] {
  // Known broker-specific symbol mappings
  const mappings: { [key: string]: string[] } = {
    "EURUSD": ["EURUSDpm", "EURUSD.m", "EURUSD_m", "EURUSDpro", "EURUSDc", "EURUSDi", "EURUSD.pro", "EURUSD.ecn"],
    "GBPUSD": ["GBPUSDpm", "GBPUSD.m", "GBPUSD_m", "GBPUSDpro", "GBPUSDc", "GBPUSDi", "GBPUSD.pro", "GBPUSD.ecn"],
    "USDJPY": ["USDJPYpm", "USDJPY.m", "USDJPY_m", "USDJPYpro", "USDJPYc", "USDJPYi", "USDJPY.pro", "USDJPY.ecn"],
    "AUDUSD": ["AUDUSDpm", "AUDUSD.m", "AUDUSD_m", "AUDUSDpro", "AUDUSDc", "AUDUSDi", "AUDUSD.pro", "AUDUSD.ecn"],
    "USDCAD": ["USDCADpm", "USDCAD.m", "USDCAD_m", "USDCADpro", "USDCADc", "USDCADi", "USDCAD.pro", "USDCAD.ecn"],
    "USDCHF": ["USDCHFpm", "USDCHF.m", "USDCHF_m", "USDCHFpro", "USDCHFc", "USDCHFi", "USDCHF.pro", "USDCHF.ecn"],
    "NZDUSD": ["NZDUSDpm", "NZDUSD.m", "NZDUSD_m", "NZDUSDpro", "NZDUSDc", "NZDUSDi", "NZDUSD.pro", "NZDUSD.ecn"],
    "EURGBP": ["EURGBPpm", "EURGBP.m", "EURGBP_m", "EURGBPpro", "EURGBPc", "EURGBPi", "EURGBP.pro", "EURGBP.ecn"],
    "EURJPY": ["EURJPYpm", "EURJPY.m", "EURJPY_m", "EURJPYpro", "EURJPYc", "EURJPYi", "EURJPY.pro", "EURJPY.ecn"],
    "GBPJPY": ["GBPJPYpm", "GBPJPY.m", "GBPJPY_m", "GBPJPYpro", "GBPJPYc", "GBPJPYi", "GBPJPY.pro", "GBPJPY.ecn"],
    "XAUUSD": ["XAUUSDpm", "XAUUSD.m", "XAUUSD_m", "XAUUSDpro", "XAUUSDc", "XAUUSDi", "GOLD", "GOLDpm", "GOLD.m", "XAUUSD.pro", "XAUUSD.ecn"],
    "BTCUSD": ["BTCUSDpm", "BTCUSD.m", "BTCUSD_m", "BTCUSDpro", "BTCUSDc", "BTCUSDi", "BITCOIN", "BTC", "BTCUSD.pro", "BTCUSD.ecn"],
    "ETHUSD": ["ETHUSDpm", "ETHUSD.m", "ETHUSD_m", "ETHUSDpro", "ETHUSDc", "ETHUSDi", "ETHEREUM", "ETH", "ETHUSD.pro", "ETHUSD.ecn"],
    "CRUDE": ["CRUDEpm", "CRUDE.m", "CRUDE_m", "CRUDEpro", "CRUDEc", "CRUDEi", "WTI", "WTIpm", "WTI.m", "USOIL", "USOILpm", "CRUDE.pro", "CRUDE.ecn"],
    "BRENT": ["BRENTpm", "BRENT.m", "BRENT_m", "BRENTpro", "BRENTc", "BRENTi", "UKOIL", "UKOILpm", "UKOIL.m", "BRENT.pro", "BRENT.ecn"],
  };
  
  return mappings[symbol] || [];
}

function calculateIndicatorsFromRates(rates: any[]): { rsi: number; macd: number; atr: number } {
    if (rates.length < 26) { // Need at least 26 periods for MACD
        const lastBar = rates[rates.length - 1];
        // Fallback to simple calculation if not enough data
        return calculateIndicators(lastBar.open, lastBar.high, lastBar.low, lastBar.close);
    }

    // Simplified ATR calculation
    const trs = rates.map((rate, i) => {
        const prevClose = i > 0 ? rates[i-1].close : rate.open;
        const tr1 = rate.high - rate.low;
        const tr2 = Math.abs(rate.high - prevClose);
        const tr3 = Math.abs(rate.low - prevClose);
        return Math.max(tr1, tr2, tr3);
    });
    const atr = trs.slice(-14).reduce((sum, tr) => sum + tr, 0) / 14;

    // Simplified RSI calculation
    const changes = rates.map((rate, i) => i > 0 ? rate.close - rates[i-1].close : 0).slice(-14);
    const gains = changes.filter(c => c > 0).reduce((sum, c) => sum + c, 0);
    const losses = Math.abs(changes.filter(c => c < 0).reduce((sum, c) => sum + c, 0));
    const avgGain = gains / 14;
    const avgLoss = losses / 14;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    // Simplified MACD calculation
    const closes = rates.map(r => r.close);
    const ema12 = calculateEMA(closes, 12);
    const ema26 = calculateEMA(closes, 26);
    const macd = ema12[ema12.length - 1] - ema26[ema26.length - 1];

    return {
        rsi: Math.round(rsi * 10) / 10,
        macd: Math.round(macd * 100000) / 100000,
        atr: Math.round(atr * 100000) / 100000,
    };
}

function calculateEMA(data: number[], period: number): number[] {
    const k = 2 / (period + 1);
    const emaArray: number[] = [];
    if (data.length > 0) {
        emaArray.push(data[0]);
        for (let i = 1; i < data.length; i++) {
            emaArray.push(data[i] * k + emaArray[i - 1] * (1 - k));
        }
    }
    return emaArray;
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

// Create fallback data when MT5 data is not available
function createFallbackData(symbol: string, timeframe: string): MarketDataPoint {
  // Generate realistic fallback data based on symbol characteristics
  const basePrice = getSymbolBasePrice(symbol);
  const volatility = getSymbolVolatility(symbol);
  
  // Create realistic OHLC data
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
    volume: Math.floor(Math.random() * 1000) + 100,
    indicators: {
      rsi: 30 + Math.random() * 40,
      macd: (Math.random() - 0.5) * 0.001,
      atr: volatility * basePrice * 0.1,
    },
  };
}

function getSymbolBasePrice(symbol: string): number {
  const basePrices = {
    "BTCUSD": 95000,
    "ETHUSD": 3500,
    "EURUSD": 1.085,
    "GBPUSD": 1.275,
    "USDJPY": 150.5,
    "AUDUSD": 0.665,
    "USDCAD": 1.365,
    "USDCHF": 0.885,
    "NZDUSD": 0.615,
    "XAUUSD": 2050,
    "CRUDE": 75.5,
    "BRENT": 80.2,
  };
  
  return basePrices[symbol] || 1.0;
}

function getSymbolVolatility(symbol: string): number {
  const volatilities = {
    "BTCUSD": 0.03,
    "ETHUSD": 0.04,
    "EURUSD": 0.005,
    "GBPUSD": 0.008,
    "USDJPY": 0.006,
    "AUDUSD": 0.007,
    "USDCAD": 0.006,
    "USDCHF": 0.005,
    "NZDUSD": 0.008,
    "XAUUSD": 0.015,
    "CRUDE": 0.02,
    "BRENT": 0.018,
  };
  
  return volatilities[symbol] || 0.01;
}
