import fetch from "node-fetch";

// --- Types ---

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

export interface SymbolValidationResult {
  symbol: string;
  tradable: boolean;
  reason?: string;
}

// --- Helper: find server host/port ---
function mt5ServerHost(): string | undefined {
  return process.env.MT5_SERVER_HOST || "154.61.187.189";
}

function mt5ServerPort(): string | undefined {
  return process.env.MT5_SERVER_PORT || "8080";
}

// --- Helper: fetch with timeout ---
export async function fetchWithTimeout(resource: string, options: any = {}, timeout = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(resource, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

// --- MAIN: esecuzione ordine SOLO reale, NO simulazione ---

export async function executeMT5Order(order: MT5OrderRequest): Promise<MT5OrderResult> {
  try {
    console.log(`🔄 Attempting to execute ${order.direction} order for ${order.symbol}`);
    const directResult = await tryDirectMT5Connection(order);
    if (directResult.success) {
      console.log(`✅ Direct MT5 execution successful for ${order.symbol}`);
      return directResult;
    }
    console.log(`❌ Direct MT5 connection failed: ${directResult.error}`);
    
    // Prova con un endpoint alternativo se il primo fallisce
    console.log("🔄 Trying alternative endpoint...");
    const alternativeResult = await tryAlternativeEndpoint(order);
    if (alternativeResult.success) {
      console.log(`✅ Alternative endpoint successful for ${order.symbol}`);
      return alternativeResult;
    }
    console.log(`❌ Alternative endpoint failed: ${alternativeResult.error}`);
    
    return {
      success: false,
      error: `MT5 connection failed: ${directResult.error || "Unknown error"}`
    };
  } catch (error: any) {
    console.error("❌ MT5 execution error:", error);
    return {
      success: false,
      error: "Failed to connect to MT5 terminal"
    };
  }
}

// --- Direct connection to MT5 Python server ---

export async function tryDirectMT5Connection(order: MT5OrderRequest): Promise<MT5OrderResult> {
  try {
    const host = mt5ServerHost();
    const port = mt5ServerPort();
    if (!host || !port) {
      return { success: false, error: "MT5 server host/port not configured" };
    }
    const baseUrl = host.includes(":") ? `http://${host}` : `http://${host}:${port}`;
    const url = `${baseUrl}/execute`;

    console.log(`🔗 Connecting to MT5 execution endpoint: ${url}`);

    // Modifica del formato del payload per compatibilità
    // Nota: aggiunti campi aggiuntivi che potrebbero essere richiesti dall'API MT5
    const symbol = order.symbol.endsWith("pm") ? order.symbol : `${order.symbol}pm`;
    const action = order.direction === "LONG" ? "BUY" : "SELL";

    const payload = {
      symbol: symbol,                  // Uso BTCUSDpm invece di BTCUSD
      action: action,                  // BUY o SELL
      type: "ORDER_TYPE_MARKET",       // Tipo ordine esplicito
      volume: order.lotSize,           // Mantiene il volume
      price: 0,                        // Price 0 per ordini market
      sl: order.stopLoss,              // Stop loss
      tp: order.takeProfit,            // Take profit
      deviation: 10,                   // Deviazione di prezzo accettabile
      magic: 12345,                    // Magic number per identificare ordini
      comment: order.comment || "AI Trading Bot",  // Commento
      type_time: "ORDER_TIME_GTC",     // Good till cancelled
      type_filling: "ORDER_FILLING_FOK" // Fill or kill
    };

    const response = await fetchWithTimeout(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }, 8000);

    if (!response.ok) {
      const resText = await response.text();
      return { success: false, error: `MT5 Python server error: ${response.status} - ${resText}` };
    }

    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        orderId: result.order || result.deal || result.ticket || undefined,
        executionPrice: result.price || undefined,
      };
    } else {
      return {
        success: false,
        error: result.error || `MT5 error code ${result.retcode}`,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: `Connection to MT5 server failed: ${error.message || error}`,
    };
  }
}

// --- Try alternative endpoint format ---
async function tryAlternativeEndpoint(order: MT5OrderRequest): Promise<MT5OrderResult> {
  try {
    const host = mt5ServerHost();
    const port = mt5ServerPort();
    if (!host || !port) {
      return { success: false, error: "MT5 server host/port not configured" };
    }
    const baseUrl = host.includes(":") ? `http://${host}` : `http://${host}:${port}`;
    
    // Prova con endpoint alternativo
    const url = `${baseUrl}/order`;
    console.log(`🔗 Trying alternative endpoint: ${url}`);

    // Formato alternativo del payload
    const symbol = order.symbol.endsWith("pm") ? order.symbol : `${order.symbol}pm`;
    const action = order.direction === "LONG" ? "BUY" : "SELL";

    const payload = {
      command: "ORDER_SEND",
      symbol: symbol,
      cmd: action === "BUY" ? 0 : 1,   // 0=BUY, 1=SELL - formato numerico
      volume: order.lotSize,
      price: order.entryPrice,
      sl: order.stopLoss,
      tp: order.takeProfit,
      comment: order.comment || "AI Trading Bot"
    };

    const response = await fetchWithTimeout(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }, 8000);

    if (!response.ok) {
      const resText = await response.text();
      return { success: false, error: `Alternative endpoint error: ${response.status} - ${resText}` };
    }

    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        orderId: result.order || result.deal || result.ticket || undefined,
        executionPrice: result.price || undefined,
      };
    } else {
      return {
        success: false,
        error: result.error || `Alternative endpoint error code ${result.retcode}`,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: `Alternative endpoint failed: ${error.message || error}`,
    };
  }
}

// --- Simulazione (NON usata in produzione, lasciata per sviluppo) ---
export async function simulateMT5Execution(order: MT5OrderRequest): Promise<MT5OrderResult> {
  try {
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    if (Math.random() < 0.95) {
      const orderId = Math.floor(Math.random() * 1000000) + 100000;
      const slippage = (Math.random() - 0.5) * 0.0001;
      const executionPrice = order.entryPrice + slippage;
      return {
        success: true,
        orderId,
        executionPrice: Math.round(executionPrice * 100000) / 100000,
      };
    } else {
      return {
        success: false,
        error: "Simulated trade failure",
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: `Simulation failed: ${error.message || 'Unknown error'}`,
    };
  }
}

// --- Symbol helpers ---

export function getSymbolVariations(symbol: string): string[] {
  // Esempio: aggiungi qui logica per generare varianti dei simboli
  // EURUSD -> EURUSD, EURUSDm, EURUSD.r, EURUSDpro, EURUSD.
  return [
    symbol,
    symbol + "m",
    symbol + "pm",  // Aggiungo "pm" dalla conversione vista nei log per BTCUSD -> BTCUSDpm
    symbol + ".",
    symbol + "r",
    symbol + "pro",
    symbol.replace("/", ""),
    symbol.replace(".", ""),
    symbol.toUpperCase(),
    symbol.toLowerCase(),
  ];
}

export function validateSymbolForTrading(symbolInfo: any, symbol: string): { tradable: boolean; reason?: string } {
  if (!symbolInfo) {
    return { tradable: false, reason: "Symbol info not provided" };
  }
  if (symbolInfo.tradable === false || symbolInfo.trading === false) {
    return { tradable: false, reason: "Symbol is not tradable" };
  }
  if (symbolInfo.visible === false) {
    return { tradable: false, reason: "Symbol is not visible" };
  }
  if (typeof symbolInfo.volume_min !== "undefined" && symbolInfo.volume_min > 0.1) {
    return { tradable: false, reason: "Minimum volume too high" };
  }
  return { tradable: true };
}

// --- Trova simbolo tradabile per esecuzione ---

export async function findTradableSymbolForExecution(baseUrl: string, symbol: string): Promise<SymbolValidationResult> {
  try {
    const symbolVariations = getSymbolVariations(symbol);
    console.log(`🔍 Finding tradable symbol format for execution: ${symbol}. Testing variations: ${symbolVariations.slice(0, 5).join(', ')}...`);
    const foundSymbols: Array<{symbol: string, tradable: boolean, reason?: string}> = [];
    for (const variation of symbolVariations) {
      try {
        const response = await fetchWithTimeout(`${baseUrl}/symbol_info`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symbol: variation }),
        }, 3000);

        if (response.ok) {
          const result = await response.json();
          if (result && result.symbol_info && !result.error) {
            const symbolInfo = result.symbol_info;
            const validation = validateSymbolForTrading(symbolInfo, variation);
            foundSymbols.push({
              symbol: variation,
              tradable: validation.tradable,
              reason: validation.reason
            });
            if (validation.tradable) {
              return { symbol: variation, tradable: true };
            }
          }
        }
      } catch (err: any) {
        foundSymbols.push({ symbol: variation, tradable: false, reason: err.message });
      }
    }
    if (foundSymbols.length > 0) {
      const first = foundSymbols.find(s => s.tradable);
      if (first) return { symbol: first.symbol, tradable: true };
      return { symbol: foundSymbols[0].symbol, tradable: false, reason: foundSymbols[0].reason };
    }
    return { symbol, tradable: false, reason: "No tradable variation found" };
  } catch (error: any) {
    return { symbol, tradable: false, reason: error.message || 'Unknown error' };
  }
}