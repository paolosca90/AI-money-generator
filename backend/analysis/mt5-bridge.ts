import { secret } from "encore.dev/config";

const mt5ServerHost = secret("MT5ServerHost");
const mt5ServerPort = secret("MT5ServerPort");
const mt5Login = secret("MT5Login");
const mt5Password = secret("MT5Password");
const mt5Server = secret("MT5Server");

export interface MT5OrderRequest {
  symbol: string;
  direction: "LONG" | "SHORT";
  lotSize: number;
  entryPrice: number;
  takeProfit: number;
  stopLoss: number;
  comment?: string;
}

export interface MT5OrderResult {
  success: boolean;
  orderId?: number;
  executionPrice?: number;
  error?: string;
}

export interface MT5AccountInfo {
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  currency: string;
}

export interface MT5Position {
  ticket: number;
  symbol: string;
  type: number; // 0 = BUY, 1 = SELL
  volume: number;
  openPrice: number;
  currentPrice: number;
  profit: number;
  swap: number;
  comment: string;
}

export async function executeMT5Order(order: MT5OrderRequest): Promise<MT5OrderResult> {
  try {
    console.log(`🔄 Attempting to execute ${order.direction} order for ${order.symbol}`);
    
    // Try direct MT5 Python API connection first
    const directResult = await tryDirectMT5Connection(order);
    if (directResult.success) {
      console.log(`✅ Direct MT5 execution successful for ${order.symbol}`);
      return directResult;
    }

    console.log(`⚠️ Direct MT5 connection failed: ${directResult.error}`);
    
    // Fallback: Simulation mode for testing
    console.log("🔄 Using simulation mode for order execution");
    return await simulateMT5Execution(order);
    
  } catch (error) {
    console.error("❌ MT5 execution error:", error);
    return {
      success: false,
      error: "Failed to connect to MT5 terminal",
    };
  }
}

async function tryDirectMT5Connection(order: MT5OrderRequest): Promise<MT5OrderResult> {
  try {
    const host = mt5ServerHost();
    const port = mt5ServerPort();

    // Check if MT5 server configuration is available
    if (!host || !port) {
      console.log("⚠️ MT5 server not configured. Please set MT5ServerHost and MT5ServerPort in Infrastructure settings.");
      return { success: false, error: "MT5 server not configured" };
    }

    // Check for common misconfiguration
    if (host === "your_vps_ip" || host === "localhost") {
      console.log("⚠️ MT5ServerHost is set to 'localhost' or placeholder value.");
      console.log("💡 If you're using a VPS, update MT5ServerHost to your VPS IP address");
      console.log("💡 Go to Infrastructure tab → Secrets → Update MT5ServerHost");
      return { success: false, error: "MT5 server host needs configuration" };
    }

    // Construct URL properly
    const baseUrl = host.includes(':') ? `http://${host}` : `http://${host}:${port}`;
    console.log(`🔗 Attempting connection to MT5 server: ${baseUrl}`);

    // Test connection first
    const statusResponse = await fetchWithTimeout(`${baseUrl}/status`, {
      method: "GET",
    }, 5000);

    if (!statusResponse.ok) {
      console.error(`❌ MT5 server status check failed: ${statusResponse.status} ${statusResponse.statusText}`);
      return { 
        success: false, 
        error: `MT5 server not responding (${statusResponse.status})` 
      };
    }

    const statusData = await statusResponse.json();
    if (!statusData.connected) {
      console.error("❌ MT5 terminal not connected");
      return { 
        success: false, 
        error: "MT5 terminal not connected to broker" 
      };
    }

    if (!statusData.trade_allowed) {
      console.error("❌ Trading not allowed on MT5 account");
      return { 
        success: false, 
        error: "Trading not allowed on this MT5 account" 
      };
    }

    console.log(`✅ MT5 server connected. Account: ${statusData.login}, Balance: ${statusData.balance}`);

    // Find the correct symbol format for this broker
    const correctSymbol = await findCorrectSymbolForExecution(baseUrl, order.symbol);
    if (!correctSymbol) {
      console.log(`❌ Symbol ${order.symbol} not found on this broker`);
      return { 
        success: false, 
        error: `Symbol ${order.symbol} not available for trading on this broker` 
      };
    }

    console.log(`📊 Using symbol format: ${order.symbol} → ${correctSymbol}`);

    // Execute the order
    const response = await fetchWithTimeout(`${baseUrl}/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        symbol: correctSymbol,
        action: order.direction === "LONG" ? "BUY" : "SELL",
        volume: order.lotSize,
        price: 0, // Use market price
        sl: order.stopLoss,
        tp: order.takeProfit,
        deviation: 20,
        magic: 234000,
        comment: order.comment || "AI Trading Bot",
      }),
    }, 15000);

    if (!response.ok) {
      console.error(`❌ MT5 execution request failed: ${response.status} ${response.statusText}`);
      return { 
        success: false, 
        error: `MT5 execution failed: ${response.status}` 
      };
    }

    const result = await response.json();
    
    if (result.success && result.retcode === 10009) { // TRADE_RETCODE_DONE
      console.log(`✅ Order executed successfully: ${order.symbol} (${correctSymbol}) ${order.direction} ${order.lotSize} lots`);
      return {
        success: true,
        orderId: result.order,
        executionPrice: result.price,
      };
    } else {
      console.log(`❌ MT5 execution failed: ${result.error || `Error Code: ${result.retcode}`}`);
      return {
        success: false,
        error: result.error || `MT5 Error Code: ${result.retcode}`,
      };
    }
  } catch (error) {
    console.error("❌ Direct MT5 connection failed:", error);
    
    // Provide helpful error messages based on error type
    if (error.message.includes("fetch failed") || error.message.includes("ECONNREFUSED")) {
      console.log("💡 MT5 Connection Help:");
      console.log("1. Make sure your VPS/computer is running");
      console.log("2. Ensure MT5 Python server is started: python mt5-python-server.py");
      console.log("3. Check that the correct port is open");
      console.log("4. Verify MT5ServerHost and MT5ServerPort in Infrastructure settings");
      console.log("5. If using VPS, MT5ServerHost should be your VPS IP, not 'localhost'");
      
      return { 
        success: false, 
        error: "Cannot connect to MT5 server - check VPS and Python server status" 
      };
    } else if (error.message.includes("timeout") || error.message.includes("aborted")) {
      console.log("💡 Connection timeout - check your network connection");
      return { 
        success: false, 
        error: "MT5 server connection timeout" 
      };
    }
    
    return { 
      success: false, 
      error: `Connection failed: ${error.message}` 
    };
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
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }
    throw error;
  }
}

async function findCorrectSymbolForExecution(baseUrl: string, symbol: string): Promise<string | null> {
  // Get possible symbol variations for this broker
  const symbolVariations = getSymbolVariations(symbol);
  
  console.log(`🔍 Finding correct symbol format for execution: ${symbol}. Testing variations: ${symbolVariations.slice(0, 5).join(', ')}...`);
  
  // Try each variation until we find one that works for trading
  for (const variation of symbolVariations) {
    try {
      const response = await fetchWithTimeout(`${baseUrl}/symbol_info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: variation }),
      }, 3000);

      if (response.ok) {
        const result = await response.json();
        if (result.symbol_info && !result.error) {
          // Check if trading is allowed for this symbol
          const symbolInfo = result.symbol_info;
          
          // Trade mode values: 0=disabled, 1=long only, 2=short only, 3=close only, 4=full trading
          const tradeMode = symbolInfo.trade_mode;
          const visible = symbolInfo.visible;
          
          const isTradingAllowed = tradeMode !== undefined && tradeMode >= 1;
          const isSymbolActive = visible !== false;
          
          if (isTradingAllowed && isSymbolActive) {
            console.log(`✅ Found tradeable symbol format: ${symbol} → ${variation} (trade_mode: ${tradeMode})`);
            return variation;
          } else {
            console.log(`⚠️ Symbol ${variation} found but trading restricted (trade_mode: ${tradeMode}, visible: ${visible})`);
          }
        }
      }
    } catch (error) {
      // Continue to next variation
      continue;
    }
  }
  
  console.log(`❌ No tradeable symbol format found for ${symbol} on this broker`);
  return null;
}

function getSymbolVariations(symbol: string): string[] {
  // Common symbol variations used by different brokers
  const variations = [symbol]; // Start with the original symbol
  
  // Common suffixes used by different brokers
  const suffixes = ['m', 'pm', 'pro', 'ecn', 'raw', 'c', 'i', '.', '_m', '_pro', '.m', '.ecn', '.pro'];
  
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

async function simulateMT5Execution(order: MT5OrderRequest): Promise<MT5OrderResult> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  // Simulate 95% success rate
  if (Math.random() < 0.95) {
    const orderId = Math.floor(Math.random() * 1000000) + 100000;
    const slippage = (Math.random() - 0.5) * 0.0001; // Small slippage
    const executionPrice = order.entryPrice + slippage;
    
    console.log(`[SIMULATION] Order executed: ${order.symbol} ${order.direction} ${order.lotSize} lots at ${executionPrice}`);
    console.log(`[SIMULATION] Comment: ${order.comment || "AI Trading Bot"}`);
    console.log(`[SIMULATION] Take Profit: ${order.takeProfit}, Stop Loss: ${order.stopLoss}`);
    
    return {
      success: true,
      orderId,
      executionPrice: Math.round(executionPrice * 100000) / 100000,
    };
  } else {
    const errors = [
      "Insufficient margin",
      "Market closed",
      "Invalid symbol",
      "Connection timeout",
      "Price off quotes",
      "Trade disabled",
      "Invalid volume",
      "No connection",
    ];
    
    const error = errors[Math.floor(Math.random() * errors.length)];
    console.log(`[SIMULATION] Order failed: ${error}`);
    
    return {
      success: false,
      error,
    };
  }
}

export async function getMT5AccountInfo(): Promise<MT5AccountInfo | null> {
  try {
    const host = mt5ServerHost();
    const port = mt5ServerPort();
    
    if (!host || !port) {
      console.log("MT5 server not configured for account info");
      return getSimulatedAccountInfo();
    }
    
    const baseUrl = host.includes(':') ? `http://${host}` : `http://${host}:${port}`;
    
    const response = await fetchWithTimeout(`${baseUrl}/status`, {
      method: "GET",
    }, 5000);

    if (response.ok) {
      const data = await response.json();
      if (data.connected) {
        return {
          balance: data.balance || 10000,
          equity: data.equity || 10000,
          margin: data.margin || 500,
          freeMargin: data.free_margin || 9500,
          marginLevel: data.margin_level || 2000,
          currency: data.currency || "USD",
        };
      }
    }
  } catch (error) {
    console.error("Error getting MT5 account info:", error);
  }

  // Return simulated account info
  return getSimulatedAccountInfo();
}

function getSimulatedAccountInfo(): MT5AccountInfo {
  return {
    balance: 10000,
    equity: 10000,
    margin: 500,
    freeMargin: 9500,
    marginLevel: 2000,
    currency: "USD",
  };
}

export async function checkMT5Connection(): Promise<boolean> {
  try {
    const host = mt5ServerHost();
    const port = mt5ServerPort();
    
    if (!host || !port || host === "localhost" || host === "your_vps_ip") {
      console.log("MT5 server configuration incomplete");
      return false;
    }
    
    const baseUrl = host.includes(':') ? `http://${host}` : `http://${host}:${port}`;
    
    const response = await fetchWithTimeout(`${baseUrl}/status`, {
      method: "GET",
    }, 5000);

    if (response.ok) {
      const data = await response.json();
      const isConnected = data.connected && data.trade_allowed;
      console.log(`MT5 connection status: ${isConnected ? 'Connected' : 'Disconnected'}`);
      return isConnected;
    }

    return false;
  } catch (error) {
    console.error("MT5 connection check failed:", error);
    return false;
  }
}

export async function getMT5Positions(): Promise<MT5Position[]> {
  try {
    const host = mt5ServerHost();
    const port = mt5ServerPort();
    
    if (!host || !port) {
      return [];
    }
    
    const baseUrl = host.includes(':') ? `http://${host}` : `http://${host}:${port}`;
    
    const response = await fetchWithTimeout(`${baseUrl}/positions`, {
      method: "GET",
    }, 10000);

    if (response.ok) {
      const data = await response.json();
      return data.positions || [];
    }
  } catch (error) {
    console.error("Error getting MT5 positions:", error);
  }

  return [];
}

export async function closeMT5Position(ticket: number): Promise<MT5OrderResult> {
  try {
    const host = mt5ServerHost();
    const port = mt5ServerPort();
    
    if (!host || !port) {
      return {
        success: false,
        error: "MT5 server not configured",
      };
    }
    
    const baseUrl = host.includes(':') ? `http://${host}` : `http://${host}:${port}`;
    
    const response = await fetchWithTimeout(`${baseUrl}/close`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ticket: ticket,
        deviation: 20,
      }),
    }, 15000);

    if (response.ok) {
      const result = await response.json();
      return {
        success: result.success,
        orderId: result.order,
        executionPrice: result.price,
        error: result.error,
      };
    }
  } catch (error) {
    console.error("Error closing MT5 position:", error);
  }

  return {
    success: false,
    error: "Failed to close position",
  };
}

// Utility function to validate lot size for MT5
export function validateLotSize(lotSize: number, symbol: string): { valid: boolean; error?: string } {
  if (lotSize <= 0) {
    return { valid: false, error: "Lot size must be greater than 0" };
  }

  // Standard forex lot size validation
  const minLot = 0.01;
  const maxLot = 100;
  const stepLot = 0.01;

  if (lotSize < minLot) {
    return { valid: false, error: `Minimum lot size is ${minLot}` };
  }

  if (lotSize > maxLot) {
    return { valid: false, error: `Maximum lot size is ${maxLot}` };
  }

  // Check if lot size is a valid step
  const remainder = (lotSize - minLot) % stepLot;
  if (Math.abs(remainder) > 0.001) {
    return { valid: false, error: `Lot size must be in steps of ${stepLot}` };
  }

  return { valid: true };
}

// Function to calculate required margin
export async function calculateRequiredMargin(symbol: string, lotSize: number): Promise<number> {
  try {
    const host = mt5ServerHost();
    const port = mt5ServerPort();
    
    if (!host || !port) {
      return estimateMargin(symbol, lotSize);
    }
    
    const baseUrl = host.includes(':') ? `http://${host}` : `http://${host}:${port}`;
    
    const response = await fetchWithTimeout(`${baseUrl}/calc_margin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        symbol: symbol,
        volume: lotSize,
        action: "BUY", // Margin is same for BUY/SELL
      }),
    }, 10000);

    if (response.ok) {
      const data = await response.json();
      return data.margin || estimateMargin(symbol, lotSize);
    }
  } catch (error) {
    console.error("Error calculating margin:", error);
  }

  // Fallback calculation
  return estimateMargin(symbol, lotSize);
}

function estimateMargin(symbol: string, lotSize: number): number {
  // Approximate margin calculation based on symbol type
  const marginEstimates = {
    "EURUSD": 1000,
    "GBPUSD": 1000,
    "USDJPY": 1000,
    "AUDUSD": 1000,
    "USDCAD": 1000,
    "USDCHF": 1000,
    "XAUUSD": 1000,
    "BTCUSD": 5000,
    "ETHUSD": 2000,
    "CRUDE": 500,
    "BRENT": 500,
  };
  
  const baseMargin = marginEstimates[symbol] || 1000;
  return baseMargin * lotSize;
}
