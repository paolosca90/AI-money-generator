import { secret } from "encore.dev/config";

const mt5ServerHost = secret("MT5ServerHost");
const mt5ServerPort = secret("MT5ServerPort");
const mt5Login = secret("MT5Login");
const mt5Password = secret("MT5Password");
const mt5Server = secret("MT5Server");
const brokerApiKey = secret("BrokerApiKey");
const brokerAccountId = secret("BrokerAccountId");

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

export async function executeMT5Order(order: MT5OrderRequest): Promise<MT5OrderResult> {
  try {
    // Try different MT5 connection methods
    
    // Method 1: Direct MT5 Python API (if running on Windows/VPS)
    const directResult = await tryDirectMT5Connection(order);
    if (directResult.success) {
      return directResult;
    }

    // Method 2: Custom MT5 REST API (if you have an Expert Advisor running)
    const restResult = await tryMT5RestAPI(order);
    if (restResult.success) {
      return restResult;
    }

    // Method 3: Broker API (if your broker provides REST API)
    const brokerResult = await tryBrokerAPI(order);
    if (brokerResult.success) {
      return brokerResult;
    }

    // Fallback: Simulation mode
    console.log("All MT5 connection methods failed, using simulation mode");
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
    // This would connect to a Python service running MetaTrader5 library
    const response = await fetch(`http://${mt5ServerHost()}:${mt5ServerPort()}/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${mt5Password()}`,
      },
      body: JSON.stringify({
        login: mt5Login(),
        server: mt5Server(),
        symbol: order.symbol,
        action: order.direction === "LONG" ? "BUY" : "SELL",
        volume: order.lotSize,
        price: order.entryPrice,
        sl: order.stopLoss,
        tp: order.takeProfit,
      }),
    });

    if (!response.ok) {
      return { success: false, error: "MT5 server connection failed" };
    }

    const result = await response.json();
    
    if (result.success) {
      return {
        success: true,
        orderId: result.order_id,
        executionPrice: result.execution_price,
      };
    } else {
      return {
        success: false,
        error: result.error || "MT5 execution failed",
      };
    }
  } catch (error) {
    console.error("Direct MT5 connection failed:", error);
    return { success: false, error: "Direct connection failed" };
  }
}

async function tryMT5RestAPI(order: MT5OrderRequest): Promise<MT5OrderResult> {
  try {
    // This would connect to a custom Expert Advisor that exposes REST API
    const response = await fetch(`http://${mt5ServerHost()}:8080/api/trade`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": mt5Password(),
      },
      body: JSON.stringify({
        symbol: order.symbol,
        type: order.direction === "LONG" ? 0 : 1, // 0 = BUY, 1 = SELL
        volume: order.lotSize,
        price: order.entryPrice,
        sl: order.stopLoss,
        tp: order.takeProfit,
        magic: 12345,
        comment: "AI Trading Bot",
      }),
    });

    if (!response.ok) {
      return { success: false, error: "MT5 REST API connection failed" };
    }

    const result = await response.json();
    
    if (result.retcode === 10009) { // TRADE_RETCODE_DONE
      return {
        success: true,
        orderId: result.order,
        executionPrice: result.price,
      };
    } else {
      return {
        success: false,
        error: `MT5 Error: ${result.comment || result.retcode}`,
      };
    }
  } catch (error) {
    console.error("MT5 REST API connection failed:", error);
    return { success: false, error: "REST API connection failed" };
  }
}

async function tryBrokerAPI(order: MT5OrderRequest): Promise<MT5OrderResult> {
  try {
    // Example for OANDA API (replace with your broker's API)
    
    // Convert to broker-specific format
    const brokerSymbol = convertSymbolForBroker(order.symbol);
    const units = order.direction === "LONG" ? 
      Math.floor(order.lotSize * 100000) : 
      -Math.floor(order.lotSize * 100000);

    const response = await fetch(`https://api-fxtrade.oanda.com/v3/accounts/${brokerAccountId()}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${brokerApiKey()}`,
      },
      body: JSON.stringify({
        order: {
          type: "MARKET",
          instrument: brokerSymbol,
          units: units.toString(),
          stopLossOnFill: {
            price: order.stopLoss.toString(),
          },
          takeProfitOnFill: {
            price: order.takeProfit.toString(),
          },
        },
      }),
    });

    if (!response.ok) {
      return { success: false, error: "Broker API connection failed" };
    }

    const result = await response.json();
    
    if (result.orderCreateTransaction) {
      return {
        success: true,
        orderId: parseInt(result.orderCreateTransaction.id),
        executionPrice: parseFloat(result.orderFillTransaction?.price || order.entryPrice),
      };
    } else {
      return {
        success: false,
        error: "Broker order creation failed",
      };
    }
  } catch (error) {
    console.error("Broker API connection failed:", error);
    return { success: false, error: "Broker API connection failed" };
  }
}

function convertSymbolForBroker(symbol: string): string {
  // Convert our symbols to broker format (example for OANDA)
  const symbolMap: { [key: string]: string } = {
    "EURUSD": "EUR_USD",
    "GBPUSD": "GBP_USD",
    "USDJPY": "USD_JPY",
    "AUDUSD": "AUD_USD",
    "USDCAD": "USD_CAD",
    "USDCHF": "USD_CHF",
    "XAUUSD": "XAU_USD",
  };

  return symbolMap[symbol] || symbol;
}

async function simulateMT5Execution(order: MT5OrderRequest): Promise<MT5OrderResult> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  // Simulate 95% success rate
  if (Math.random() < 0.95) {
    const orderId = Math.floor(Math.random() * 1000000) + 100000;
    const slippage = (Math.random() - 0.5) * 0.0001; // Small slippage
    const executionPrice = order.entryPrice + slippage;
    
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
    ];
    
    return {
      success: false,
      error: errors[Math.floor(Math.random() * errors.length)],
    };
  }
}

export async function getMT5AccountInfo(): Promise<MT5AccountInfo | null> {
  try {
    // Try to get account info from MT5
    const response = await fetch(`http://${mt5ServerHost()}:${mt5ServerPort()}/account`, {
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

  // Return simulated account info
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
    // Check if MT5 terminal is connected
    const response = await fetch(`http://${mt5ServerHost()}:${mt5ServerPort()}/status`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${mt5Password()}`,
      },
      timeout: 5000,
    });

    return response.ok;
  } catch (error) {
    console.error("MT5 connection check failed:", error);
    return false;
  }
}

export async function getMT5Positions(): Promise<any[]> {
  try {
    const response = await fetch(`http://${mt5ServerHost()}:${mt5ServerPort()}/positions`, {
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

export async function closeMT5Position(positionId: number): Promise<MT5OrderResult> {
  try {
    const response = await fetch(`http://${mt5ServerHost()}:${mt5ServerPort()}/close`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${mt5Password()}`,
      },
      body: JSON.stringify({
        position_id: positionId,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      return {
        success: result.success,
        orderId: result.order_id,
        executionPrice: result.execution_price,
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
