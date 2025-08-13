import { api, APIError } from "encore.dev/api";
import { analysisDB } from "./db";
import { executeMT5Order } from "./mt5-bridge";
import { TradingStrategy } from "./trading-strategies";

interface ExecuteRequest {
  tradeId: string;
  lotSize?: number;
  strategy?: TradingStrategy;
}

interface ExecuteResponse {
  success: boolean;
  orderId?: number;
  executionPrice?: number;
  strategy?: TradingStrategy;
  estimatedHoldingTime?: string;
  error?: string;
}

// Executes a trading signal on MetaTrader 5 with strategy-specific parameters.
export const execute = api<ExecuteRequest, ExecuteResponse>(
  { expose: true, method: "POST", path: "/analysis/execute" },
  async (req) => {
    const { tradeId, lotSize: requestedLotSize, strategy: requestedStrategy } = req;

    // Fetch the trading signal from database
    const signal = await analysisDB.queryRow`
      SELECT * FROM trading_signals 
      WHERE trade_id = ${tradeId} AND executed_at IS NULL
    `;

    if (!signal) {
      throw APIError.notFound("Trading signal not found or already executed");
    }

    // Use requested lot size or recommended lot size from signal
    const lotSize = requestedLotSize || signal.recommended_lot_size || 0.1;
    
    // Use requested strategy or strategy from signal
    const strategy = requestedStrategy || signal.strategy || "INTRADAY";

    try {
      // Validate lot size
      if (isNaN(lotSize) || lotSize <= 0) {
        throw APIError.invalidArgument("Invalid lot size provided");
      }

      // Execute the order on MT5 with strategy-specific comment
      const result = await executeMT5Order({
        symbol: signal.symbol,
        direction: signal.direction,
        lotSize,
        entryPrice: signal.entry_price,
        takeProfit: signal.take_profit,
        stopLoss: signal.stop_loss,
        comment: `${strategy}_${tradeId}`, // Include strategy in comment for MT5
      });

      if (result.success) {
        // Update the signal as executed with strategy information
        await analysisDB.exec`
          UPDATE trading_signals 
          SET executed_at = NOW(), 
              mt5_order_id = ${result.orderId},
              execution_price = ${result.executionPrice},
              lot_size = ${lotSize},
              strategy = ${strategy}
          WHERE trade_id = ${tradeId}
        `;

        // Calculate estimated holding time based on strategy
        const estimatedHoldingTime = getEstimatedHoldingTime(strategy, signal.max_holding_hours);

        return {
          success: true,
          orderId: result.orderId,
          executionPrice: result.executionPrice,
          strategy,
          estimatedHoldingTime,
        };
      } else {
        return {
          success: false,
          error: result.error,
        };
      }
    } catch (error) {
      console.error("MT5 execution error:", error);
      return {
        success: false,
        error: "Failed to execute order on MT5",
      };
    }
  }
);

function getEstimatedHoldingTime(strategy: TradingStrategy, maxHours: number): string {
  switch (strategy) {
    case "SCALPING":
      return "1-15 minutes";
    case "INTRADAY":
      return "1-8 hours";
    case "SWING":
      return "1-7 days";
    default:
      return `Up to ${maxHours} hours`;
  }
}
