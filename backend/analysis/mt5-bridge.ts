import fetch from "node-fetch";
import type { Mt5Config } from "~backend/user/api";

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

export async function fetchWithTimeout(resource: string, options: any = {}, timeout = 8000) {
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

export async function executeMT5Order(order: MT5OrderRequest, mt5Config: Mt5Config): Promise<MT5OrderResult> {
  try {
    console.log(`🔄 Attempting to execute ${order.direction} order for ${order.symbol}`);
    const realResult = await tryRealExecution(order, mt5Config);
    if (realResult.success) {
      console.log(`✅ Real MT5 execution successful for ${order.symbol}`);
      return realResult;
    }
    console.log(`❌ Real MT5 execution failed: ${realResult.error}`);
    return realResult;
  } catch (error: any) {
    console.error("❌ MT5 execution error:", error);
    return { success: false, error: error.message || "Unknown execution error" };
  }
}

async function tryRealExecution(order: MT5OrderRequest, mt5Config: Mt5Config): Promise<MT5OrderResult> {
  try {
    const { host, port } = mt5Config;
    if (!host || !port) {
      return { success: false, error: "MT5 server host/port not configured" };
    }
    const url = `http://${host}:${port}/execute`;
    console.log(`🔗 Connecting to MT5 execution endpoint: ${url}`);

    const symbol = order.symbol.endsWith("pm") ? order.symbol : `${order.symbol}pm`;
    const action = order.direction === "LONG" ? "BUY" : "SELL";

    const payload = {
      symbol: symbol,
      action: action,
      volume: order.lotSize,
      sl: order.stopLoss,
      tp: order.takeProfit,
      comment: order.comment || "AI Trading Bot",
    };

    console.log(`📊 Sending payload to MT5: ${JSON.stringify(payload)}`);

    const response = await fetchWithTimeout(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }, 15000);

    if (!response.ok) {
      const resText = await response.text();
      return { success: false, error: `MT5 server error: ${response.status} - ${resText}` };
    }

    const result = await response.json() as any;

    if (result.success) {
      console.log(`✅ Order executed successfully: Order ID ${result.order}, Deal ID ${result.deal}`);
      return {
        success: true,
        orderId: result.order || result.deal || undefined,
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

export async function getMT5Positions(mt5Config: Mt5Config): Promise<MT5Position[]> {
  try {
    const { host, port } = mt5Config;
    if (!host || !port) {
      console.log("MT5 server not configured for positions");
      return [];
    }
    
    console.log(`🔗 Fetching positions from MT5: http://${host}:${port}/positions`);
    
    const response = await fetchWithTimeout(`http://${host}:${port}/positions`, {
      method: "GET",
    }, 8000);

    if (response.ok) {
      const data = await response.json() as any;
      console.log(`📊 MT5 positions response:`, data);
      
      if (data && data.positions && Array.isArray(data.positions)) {
        const positions = data.positions.map((pos: any) => ({
          ticket: pos.ticket,
          symbol: pos.symbol,
          type: pos.type,
          volume: pos.volume,
          openPrice: pos.price_open,
          currentPrice: pos.price_current,
          profit: pos.profit,
          swap: pos.swap,
          comment: pos.comment || "",
        }));
        
        console.log(`✅ Successfully mapped ${positions.length} MT5 positions`);
        return positions;
      } else {
        console.log("⚠️ No positions array in MT5 response");
        return [];
      }
    } else {
      const errorText = await response.text();
      console.error(`❌ MT5 positions endpoint error: ${response.status} ${response.statusText} - ${errorText}`);
      return [];
    }
  } catch (error) {
    console.error("❌ Error getting MT5 positions:", error);
    return [];
  }
}

export async function closeMT5Position(ticket: number, mt5Config: Mt5Config): Promise<MT5OrderResult> {
  try {
    const { host, port } = mt5Config;
    if (!host || !port) {
      return { success: false, error: "MT5 server not configured" };
    }
    
    const response = await fetchWithTimeout(`http://${host}:${port}/close_position`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticket }),
    }, 10000);

    if (response.ok) {
      const result = await response.json() as any;
      if (result.success) {
        return {
          success: true,
          orderId: result.deal,
          executionPrice: result.price,
        };
      } else {
        return {
          success: false,
          error: result.error,
        };
      }
    } else {
      const resText = await response.text();
      return { success: false, error: `Close position error: ${response.status} - ${resText}` };
    }
  } catch (error: any) {
    return {
      success: false,
      error: `Close position failed: ${error.message || error}`,
    };
  }
}
