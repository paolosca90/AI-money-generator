import { api, APIError } from "encore.dev/api";
import { analysisDB } from "./db";
import { executeMT5Order } from "./mt5-bridge";

interface ExecuteRequest {
  tradeId: string;
  lotSize: number;
}

interface ExecuteResponse {
  success: boolean;
  orderId?: number;
  executionPrice?: number;
  error?: string;
}

// Executes a trading signal on MetaTrader 5.
export const execute = api<ExecuteRequest, ExecuteResponse>(
  { expose: true, method: "POST", path: "/analysis/execute" },
  async (req) => {
    const { tradeId, lotSize } = req;

    // Fetch the trading signal from database
    const signal = await analysisDB.queryRow`
      SELECT * FROM trading_signals 
      WHERE trade_id = ${tradeId} AND executed_at IS NULL
    `;

    if (!signal) {
      throw APIError.notFound("Trading signal not found or already executed");
    }

    try {
      // Execute the order on MT5
      const result = await executeMT5Order({
        symbol: signal.symbol,
        direction: signal.direction,
        lotSize,
        entryPrice: signal.entry_price,
        takeProfit: signal.take_profit,
        stopLoss: signal.stop_loss,
      });

      if (result.success) {
        // Update the signal as executed
        await analysisDB.exec`
          UPDATE trading_signals 
          SET executed_at = NOW(), 
              mt5_order_id = ${result.orderId},
              execution_price = ${result.executionPrice},
              lot_size = ${lotSize}
          WHERE trade_id = ${tradeId}
        `;

        return {
          success: true,
          orderId: result.orderId,
          executionPrice: result.executionPrice,
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
