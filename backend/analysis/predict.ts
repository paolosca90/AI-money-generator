import { api } from "encore.dev/api";
import { analysisDB } from "./db";
import { generateTradeId } from "./utils";
import { fetchMarketData } from "./market-data";
import { analyzeWithAI } from "./ai-engine";
import { generateChart } from "./chart-generator";
import { analyzeSentiment } from "./sentiment-analyzer";

interface PredictRequest {
  symbol: string;
}

export interface TradingSignal {
  tradeId: string;
  symbol: string;
  direction: "LONG" | "SHORT";
  entryPrice: number;
  takeProfit: number;
  stopLoss: number;
  confidence: number;
  chartUrl?: string;
  analysis: {
    technical: {
      rsi: number;
      macd: string;
      atr: number;
      support: number;
      resistance: number;
    };
    sentiment: {
      score: number;
      sources: string[];
      summary?: string;
    };
    volatility: {
      hourly: number;
      daily: number;
    };
  };
}

// Generates AI-powered trading predictions for a given symbol.
export const predict = api<PredictRequest, TradingSignal>(
  { expose: true, method: "POST", path: "/analysis/predict" },
  async (req) => {
    const { symbol } = req;
    const tradeId = generateTradeId(symbol);

    // Fetch multi-timeframe market data
    const marketData = await fetchMarketData(symbol, ["5m", "15m", "30m"]);
    
    // Perform AI analysis with Gemini
    const aiAnalysis = await analyzeWithAI(marketData);
    
    // Perform sentiment analysis
    const sentimentAnalysis = await analyzeSentiment(symbol);
    
    // Generate chart
    const chartUrl = await generateChart(symbol, marketData, aiAnalysis);
    
    // Calculate entry, TP, and SL based on AI analysis and ATR
    const currentPrice = marketData["5m"].close;
    const atr = marketData["5m"].indicators.atr;
    
    let entryPrice: number;
    let takeProfit: number;
    let stopLoss: number;
    
    if (aiAnalysis.direction === "LONG") {
      entryPrice = currentPrice;
      takeProfit = currentPrice + (atr * 2);
      stopLoss = currentPrice - (atr * 1.5);
    } else {
      entryPrice = currentPrice;
      takeProfit = currentPrice - (atr * 2);
      stopLoss = currentPrice + (atr * 1.5);
    }

    const signal: TradingSignal = {
      tradeId,
      symbol,
      direction: aiAnalysis.direction,
      entryPrice: Math.round(entryPrice * 100000) / 100000,
      takeProfit: Math.round(takeProfit * 100000) / 100000,
      stopLoss: Math.round(stopLoss * 100000) / 100000,
      confidence: aiAnalysis.confidence,
      chartUrl,
      analysis: {
        technical: {
          rsi: marketData["5m"].indicators.rsi,
          macd: marketData["5m"].indicators.macd > 0 ? "BULLISH" : "BEARISH",
          atr: atr,
          support: aiAnalysis.support,
          resistance: aiAnalysis.resistance,
        },
        sentiment: {
          score: sentimentAnalysis.score,
          sources: sentimentAnalysis.sources,
          summary: sentimentAnalysis.summary,
        },
        volatility: aiAnalysis.volatility,
      },
    };

    // Store the signal in database
    await analysisDB.exec`
      INSERT INTO trading_signals (
        trade_id, symbol, direction, entry_price, take_profit, stop_loss, 
        confidence, analysis_data, created_at
      ) VALUES (
        ${tradeId}, ${symbol}, ${aiAnalysis.direction}, ${entryPrice}, 
        ${takeProfit}, ${stopLoss}, ${aiAnalysis.confidence}, 
        ${JSON.stringify(signal.analysis)}, NOW()
      )
    `;

    return signal;
  }
);
