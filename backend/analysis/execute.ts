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

    if (!tradeId || tradeId.trim() === "") {
      throw APIError.invalidArgument("Trade ID is required");
    }

    try {
      // Fetch the trading signal from database with better error handling
      const signal = await analysisDB.queryRow`
        SELECT * FROM trading_signals 
        WHERE trade_id = ${tradeId}
      `;

      if (!signal) {
        console.error(`Trading signal not found: ${tradeId}`);
        throw APIError.notFound(`Trading signal ${tradeId} not found. The signal may have expired or been removed.`);
      }

      // Check if signal has already been executed
      if (signal.executed_at) {
        console.error(`Trading signal already executed: ${tradeId} at ${signal.executed_at}`);
        throw APIError.alreadyExists(`Trading signal ${tradeId} has already been executed at ${new Date(signal.executed_at).toLocaleString()}`);
      }

      // Validate signal data
      if (!signal.symbol || !signal.direction || !signal.entry_price) {
        console.error(`Invalid signal data for ${tradeId}:`, signal);
        throw APIError.invalidArgument("Trading signal contains invalid data");
      }

      // Use requested lot size or recommended lot size from signal
      const lotSize = requestedLotSize || signal.recommended_lot_size || 0.1;
      
      // Use requested strategy or strategy from signal
      const strategy = (requestedStrategy || signal.strategy || TradingStrategy.INTRADAY);

      // Validate lot size
      if (isNaN(lotSize) || lotSize <= 0 || lotSize > 100) {
        throw APIError.invalidArgument(`Invalid lot size: ${lotSize}. Must be between 0.01 and 100.`);
      }

      console.log(`Executing ${strategy} trade ${tradeId}: ${signal.direction} ${signal.symbol} ${lotSize} lots`);

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
        // Convert max_holding_hours to number for database update
        const maxHoldingHours = Number(signal.max_holding_hours || 8);
        
        try {
          // Update the signal as executed with strategy information
          await analysisDB.exec`
            UPDATE trading_signals 
            SET executed_at = NOW(), 
                mt5_order_id = ${result.orderId || null},
                execution_price = ${result.executionPrice || signal.entry_price},
                lot_size = ${lotSize},
                strategy = ${strategy}
            WHERE trade_id = ${tradeId} AND executed_at IS NULL
          `;

          console.log(`Successfully updated signal ${tradeId} as executed`);
        } catch (dbError) {
          console.error(`Database update failed for ${tradeId}:`, dbError);
          // Don't throw here as the trade was executed successfully
        }

        // Calculate estimated holding time based on strategy
        const estimatedHoldingTime = getEstimatedHoldingTime(strategy, maxHoldingHours);

        return {
          success: true,
          orderId: result.orderId,
          executionPrice: result.executionPrice,
          strategy,
          estimatedHoldingTime,
        };
      } else {
        console.error(`MT5 execution failed for ${tradeId}:`, result.error);
        return {
          success: false,
          error: result.error || "MT5 execution failed for unknown reason",
        };
      }
    } catch (error) {
      console.error(`Error executing trade ${tradeId}:`, error);
      
      // If it's already an APIError, re-throw it
      if (error && typeof error === 'object' && 'code' in error) {
        throw error;
      }
      
      // For database errors or other unexpected errors
      const errorMessage = error && typeof error === 'object' && 'message' in error ? (error as Error).message : '';
      if (errorMessage?.includes("relation") || errorMessage?.includes("column")) {
        throw APIError.internal("Database error occurred while executing trade");
      }
      
      // Generic error
      throw APIError.internal(`Failed to execute trade: ${errorMessage || "Unknown error"}`);
    }
  }
);

function getEstimatedHoldingTime(strategy: TradingStrategy, maxHours: number): string {
  switch (strategy) {
    case TradingStrategy.SCALPING:
      return "1-15 minutes";
    case TradingStrategy.INTRADAY:
      return "1-8 hours";
    default:
      return `Up to ${maxHours} hours`;
  }
}
