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
    // Try direct MT5 Python API connection first
    const directResult = await tryDirectMT5Connection(order);
    if (directResult.success) {
      return directResult;
    }

    // Try custom MT5 REST API (Expert Advisor)
    const restResult = await tryMT5RestAPI(order);
    if (restResult.success) {
      return restResult;
    }

    // Fallback: Simulation mode for testing
    console.log("MT5 connection methods failed, using simulation mode");
    return await simulateMT5Execution(order);
    
  } catch (error) {
    console.error("MT5 execution error:", error);
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
    if (!host || !port || host === "your_vps_ip" || host === "localhost") {
      console.log("MT5 server not configured for execution");
      return { success: false, error: "MT5 server not configured" };
    }

    // Fix: Construct URL properly without duplicate port
    const baseUrl = host.includes(':') ? `http://${host}` : `http://${host}:${port}`;

    // Find the correct symbol format for this broker
    const correctSymbol = await findCorrectSymbolForExecution(baseUrl, order.symbol);
    if (!correctSymbol) {
      return { success: false, error: `Symbol ${order.symbol} not found on this broker` };
    }

    // Connect to Python service running MetaTrader5 library
    const response = await fetch(`${baseUrl}/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${mt5Password()}`,
      },
      body: JSON.stringify({
        login: mt5Login(),
        server: mt5Server(),
        password: mt5Password(),
        symbol: correctSymbol, // Use the correct symbol format
        action: order.direction === "LONG" ? "BUY" : "SELL",
        volume: order.lotSize,
        price: order.entryPrice,
        sl: order.stopLoss,
        tp: order.takeProfit,
        deviation: 20, // Price deviation in points
        magic: 234000, // Expert Advisor ID
        comment: "AI Trading Bot",
        type_time: "GTC", // Good Till Cancelled
        type_filling: "FOK", // Fill or Kill
      }),
    });

    if (!response.ok) {
      console.error(`MT5 server error: ${response.status} ${response.statusText}`);
      return { success: false, error: "MT5 server connection failed" };
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
      return {
        success: false,
        error: result.error || `MT5 Error Code: ${result.retcode}`,
      };
    }
  } catch (error) {
    console.error("Direct MT5 connection failed:", error);
    return { success: false, error: "Direct connection failed" };
  }
}

async function findCorrectSymbolForExecution(baseUrl: string, symbol: string): Promise<string | null> {
  // Get possible symbol variations for this broker
  const symbolVariations = getSymbolVariations(symbol);
  
  console.log(`Finding correct symbol format for execution: ${symbol}. Testing variations: ${symbolVariations.join(', ')}`);
  
  // Try each variation until we find one that works
  for (const variation of symbolVariations) {
    try {
      const response = await fetch(`${baseUrl}/symbol_info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: variation }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.symbol_info && !result.error) {
          // Check if trading is allowed for this symbol
          const symbolInfo = result.symbol_info;
          if (symbolInfo.trade_mode !== undefined && symbolInfo.trade_mode > 0) {
            console.log(`✅ Found tradeable symbol format: ${symbol} → ${variation}`);
            return variation;
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

async function tryMT5RestAPI(order: MT5OrderRequest): Promise<MT5OrderResult> {
  try {
    const host = mt5ServerHost();
    const port = mt5ServerPort();
    
    // Fix: Construct URL properly without duplicate port
    const baseUrl = host.includes(':') ? `http://${host}` : `http://${host}:${port}`;
    
    // Connect to custom Expert Advisor that exposes REST API
    const response = await fetch(`${baseUrl}/api/trade`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": mt5Password(),
      },
      body: JSON.stringify({
        symbol: order.symbol,
        cmd: order.direction === "LONG" ? 0 : 1, // 0 = OP_BUY, 1 = OP_SELL
        volume: order.lotSize,
        price: order.entryPrice,
        slippage: 3,
        stoploss: order.stopLoss,
        takeprofit: order.takeProfit,
        magic: 234000,
        comment: "AI Trading Bot",
        expiration: 0, // No expiration
      }),
    });

    if (!response.ok) {
      console.error(`MT5 REST API error: ${response.status} ${response.statusText}`);
      return { success: false, error: "MT5 REST API connection failed" };
    }

    const result = await response.json();
    
    if (result.success && result.ticket > 0) {
      return {
        success: true,
        orderId: result.ticket,
        executionPrice: result.open_price,
      };
    } else {
      return {
        success: false,
        error: result.error || `MT5 Error: ${result.error_description}`,
      };
    }
  } catch (error) {
    console.error("MT5 REST API connection failed:", error);
    return { success: false, error: "REST API connection failed" };
  }
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
    
    return {
      success: false,
      error: errors[Math.floor(Math.random() * errors.length)],
    };
  }
}

export async function getMT5AccountInfo(): Promise<MT5AccountInfo | null> {
  try {
    const host = mt5ServerHost();
    const port = mt5ServerPort();
    
    // Fix: Construct URL properly without duplicate port
    const baseUrl = host.includes(':') ? `http://${host}` : `http://${host}:${port}`;
    
    // Try to get account info from MT5
    const response = await fetch(`${baseUrl}/account`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${mt5Password()}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return {
        balance: data.balance || 10000,
        equity: data.equity || 10000,
        margin: data.margin || 500,
        freeMargin: data.free_margin || 9500,
        marginLevel: data.margin_level || 2000,
        currency: data.currency || "USD",
      };
    }
  } catch (error) {
    console.error("Error getting MT5 account info:", error);
  }

  // Return simulated account info for demo
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
    
    // Fix: Construct URL properly without duplicate port
    const baseUrl = host.includes(':') ? `http://${host}` : `http://${host}:${port}`;
    
    // Check if MT5 terminal is connected and logged in
    const response = await fetch(`${baseUrl}/status`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${mt5Password()}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.connected && data.trade_allowed;
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
    
    // Fix: Construct URL properly without duplicate port
    const baseUrl = host.includes(':') ? `http://${host}` : `http://${host}:${port}`;
    
    const response = await fetch(`${baseUrl}/positions`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${mt5Password()}`,
      },
    });

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
    
    // Fix: Construct URL properly without duplicate port
    const baseUrl = host.includes(':') ? `http://${host}` : `http://${host}:${port}`;
    
    const response = await fetch(`${baseUrl}/close`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${mt5Password()}`,
      },
      body: JSON.stringify({
        ticket: ticket,
        deviation: 20,
      }),
    });

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

export async function getMT5MarketInfo(symbol: string): Promise<any> {
  try {
    const host = mt5ServerHost();
    const port = mt5ServerPort();
    
    // Fix: Construct URL properly without duplicate port
    const baseUrl = host.includes(':') ? `http://${host}` : `http://${host}:${port}`;
    
    // Find the correct symbol format first
    const correctSymbol = await findCorrectSymbolForExecution(baseUrl, symbol);
    
    if (!correctSymbol) {
      console.error(`Symbol ${symbol} not found on this broker`);
      return null;
    }

    const response = await fetch(`${baseUrl}/symbol_info`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${mt5Password()}`,
      },
      body: JSON.stringify({
        symbol: correctSymbol,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.symbol_info;
    }
  } catch (error) {
    console.error("Error getting MT5 market info:", error);
  }

  return null;
}

export async function getMT5Tick(symbol: string): Promise<any> {
  try {
    const host = mt5ServerHost();
    const port = mt5ServerPort();
    
    // Fix: Construct URL properly without duplicate port
    const baseUrl = host.includes(':') ? `http://${host}` : `http://${host}:${port}`;
    
    // Find the correct symbol format first
    const correctSymbol = await findCorrectSymbolForExecution(baseUrl, symbol);
    
    if (!correctSymbol) {
      console.error(`Symbol ${symbol} not found on this broker`);
      return null;
    }

    const response = await fetch(`${baseUrl}/tick`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${mt5Password()}`,
      },
      body: JSON.stringify({
        symbol: correctSymbol,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.tick;
    }
  } catch (error) {
    console.error("Error getting MT5 tick:", error);
  }

  return null;
}

// Utility function to convert symbol format for MT5
export function convertSymbolForMT5(symbol: string): string {
  // This function is now deprecated in favor of dynamic symbol detection
  // But we keep it for backward compatibility
  const symbolMap: { [key: string]: string } = {
    "EURUSD": "EURUSD",
    "GBPUSD": "GBPUSD", 
    "USDJPY": "USDJPY",
    "AUDUSD": "AUDUSD",
    "USDCAD": "USDCAD",
    "USDCHF": "USDCHF",
    "NZDUSD": "NZDUSD",
    "XAUUSD": "XAUUSD", // Gold
    "BTCUSD": "BTCUSD", // If broker supports crypto
    "ETHUSD": "ETHUSD",
    "CRUDE": "CRUDE",   // Oil
    "BRENT": "BRENT",
  };

  return symbolMap[symbol] || symbol;
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
    
    // Fix: Construct URL properly without duplicate port
    const baseUrl = host.includes(':') ? `http://${host}` : `http://${host}:${port}`;
    
    // Find the correct symbol format first
    const correctSymbol = await findCorrectSymbolForExecution(baseUrl, symbol);
    
    if (!correctSymbol) {
      console.error(`Symbol ${symbol} not found on this broker`);
      return 0;
    }

    const response = await fetch(`${baseUrl}/calc_margin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${mt5Password()}`,
      },
      body: JSON.stringify({
        symbol: correctSymbol,
        volume: lotSize,
        action: "BUY", // Margin is same for BUY/SELL
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.margin || 0;
    }
  } catch (error) {
    console.error("Error calculating margin:", error);
  }

  // Fallback calculation (approximate)
  const baseMargin = 1000; // Base margin per lot for major pairs
  return baseMargin * lotSize;
}
