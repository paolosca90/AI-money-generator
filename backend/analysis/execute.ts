import { api, APIError } from "encore.dev/api";
import { analysisDB } from "./db";
import { TradingStrategy } from "./trading-strategies";
import { recordSignalPerformance } from "./analytics-tracker";

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

// Executes a trading signal in SIMULATION mode for data collection.
export const execute = api<ExecuteRequest, ExecuteResponse>(
  { 
    expose: true, 
    method: "POST", 
    path: "/analysis/execute"
  },
  async (req) => {
    const { tradeId, lotSize: requestedLotSize, strategy: requestedStrategy } = req;

    if (!tradeId || tradeId.trim() === "") {
      throw APIError.invalidArgument("Trade ID is required");
    }

    try {
      // Fetch the trading signal from database
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

      console.log(`SIMULATING ${strategy} trade ${tradeId}: ${signal.direction} ${signal.symbol} ${lotSize} lots`);

      // Simulate execution
      const executionPrice = signal.entry_price * (1 + (Math.random() - 0.5) * 0.0002); // Simulate small slippage
      const simulatedOrderId = Math.floor(Math.random() * 900000) + 100000;

      // Update the signal as executed
      await analysisDB.exec`
        UPDATE trading_signals 
        SET executed_at = NOW(), 
            mt5_order_id = ${simulatedOrderId},
            execution_price = ${executionPrice},
            lot_size = ${lotSize},
            strategy = ${strategy},
            status = 'executed'
        WHERE trade_id = ${tradeId} AND executed_at IS NULL
      `;
      console.log(`✅ Successfully updated signal ${tradeId} as SIMULATED_EXECUTED with Order ID: ${simulatedOrderId}`);

      // Record performance tracking for ML improvement
      await recordSignalPerformance({
        tradeId,
        symbol: signal.symbol,
        predictedDirection: signal.direction,
        predictedConfidence: signal.confidence,
        executionTime: new Date(),
        marketConditionsAtEntry: signal.analysis_data?.enhancedTechnical?.marketContext || {},
        technicalIndicatorsAtEntry: signal.analysis_data?.technical || {}
      });

      // Schedule the simulated close of the trade for data collection
      const holdingTimeMs = calculateHoldingTime(strategy, signal.max_holding_hours);
      setTimeout(async () => {
        await simulateTradeCloseForManualExecution(signal, executionPrice, simulatedOrderId);
      }, holdingTimeMs);

      const estimatedHoldingTime = getEstimatedHoldingTime(strategy, signal.max_holding_hours);

      return {
        success: true,
        orderId: simulatedOrderId,
        executionPrice: executionPrice,
        strategy,
        estimatedHoldingTime,
      };

    } catch (error) {
      console.error(`Error executing trade ${tradeId}:`, error);
      
      if (error && typeof error === 'object' && 'code' in error) {
        throw error;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw APIError.internal(`Failed to execute trade: ${errorMessage}`);
    }
  }
);

function getEstimatedHoldingTime(strategy: TradingStrategy, maxHours: number): string {
  switch (strategy) {
    case TradingStrategy.SCALPING:
      return "1-15 minutes";
    case TradingStrategy.INTRADAY:
      return "1-6 hours";
    default:
      return `Up to ${maxHours} hours`;
  }
}

function calculateHoldingTime(strategy: string, maxHours: number): number {
  const baseTime = {
    'SCALPING': { min: 1, max: 15 }, // 1-15 minuti
    'INTRADAY': { min: 60, max: 360 }, // 1-6 ore
  };

  const times = baseTime[strategy as keyof typeof baseTime] || { min: 30, max: 180 };
  const randomMinutes = Math.random() * (times.max - times.min) + times.min;
  return Math.floor(randomMinutes * 60 * 1000);
}

function calculateRealisticOutcome(signal: any) {
  const confidence = signal.confidence;
  const riskReward = signal.risk_reward_ratio;
  const strategy = signal.strategy;
  const symbol = signal.symbol;

  let successProbability = 0.5;
  if (confidence >= 90) successProbability = 0.85;
  else if (confidence >= 85) successProbability = 0.80;
  else if (confidence >= 80) successProbability = 0.75;
  else if (confidence >= 75) successProbability = 0.70;
  else if (confidence >= 70) successProbability = 0.65;
  else successProbability = 0.55;

  if (strategy === 'SCALPING') successProbability *= 0.95;
  const volatileSymbols = ['BTCUSD', 'ETHUSD', 'GBPJPY', 'XAUUSD'];
  if (volatileSymbols.includes(symbol)) successProbability *= 0.92;

  const isWinning = Math.random() < successProbability;
  let profitLoss: number;
  let actualDirection: string;

  if (isWinning) {
    const baseProfit = 100;
    profitLoss = baseProfit * riskReward * (signal.lot_size || signal.recommended_lot_size);
    profitLoss *= (0.8 + Math.random() * 0.4);
    actualDirection = signal.direction;
  } else {
    const baseLoss = 100;
    profitLoss = -baseLoss * (signal.lot_size || signal.recommended_lot_size);
    profitLoss *= (0.7 + Math.random() * 0.6);
    actualDirection = signal.direction === 'LONG' ? 'SHORT' : 'LONG';
  }

  return {
    profitLoss: Math.round(profitLoss * 100) / 100,
    actualDirection,
    isWinning
  };
}

async function simulateTradeCloseForManualExecution(signal: any, executionPrice: number, orderId: number) {
  try {
    console.log(`🔄 Simulating close for manually executed trade ${signal.trade_id}`);
    const outcome = calculateRealisticOutcome(signal);

    await analysisDB.exec`
      UPDATE trading_signals 
      SET closed_at = NOW(), 
          profit_loss = ${outcome.profitLoss},
          status = 'closed'
      WHERE trade_id = ${signal.trade_id}
    `;

    const executedSignal = await analysisDB.queryRow`
      SELECT executed_at, analysis_data FROM trading_signals WHERE trade_id = ${signal.trade_id}
    `;

    await recordSignalPerformance({
      tradeId: signal.trade_id,
      symbol: signal.symbol,
      predictedDirection: signal.direction,
      actualDirection: outcome.actualDirection,
      predictedConfidence: signal.confidence,
      actualProfitLoss: outcome.profitLoss,
      executionTime: executedSignal?.executed_at ? new Date(executedSignal.executed_at) : new Date(),
      closeTime: new Date(),
      marketConditionsAtEntry: executedSignal?.analysis_data?.enhancedTechnical?.marketContext || {},
      marketConditionsAtExit: { sessionType: executedSignal?.analysis_data?.enhancedTechnical?.marketContext?.sessionType || 'UNKNOWN', volatilityState: 'NORMAL' },
      technicalIndicatorsAtEntry: executedSignal?.analysis_data?.technical || {},
      technicalIndicatorsAtExit: { rsi: 50 + (Math.random() - 0.5) * 20, macd: (Math.random() - 0.5) * 0.001 }
    });

    console.log(`✅ Trade ${signal.trade_id} (Order: ${orderId}) closed with outcome: ${outcome.actualDirection}, P/L: $${outcome.profitLoss.toFixed(2)}`);
  } catch (error) {
    console.error(`❌ Error simulating close for trade ${signal.trade_id}:`, error);
  }
}
