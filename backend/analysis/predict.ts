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
      trend: string;
      structure: string;
      keyLevels: number[];
      breakoutProbability: number;
      support: number;
      resistance: number;
      rsi: number;
      macd: number;
      atr: number;
    };
    smartMoney: {
      institutionalFlow: string;
      volumeProfile: string;
      orderFlow: string;
      liquidityZones: number[];
    };
    professional: {
      topTraders: string[];
      consensusView: string;
      riskReward: number;
      timeframe: string;
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

// Generates AI-powered trading predictions for a given symbol using advanced ML and professional trading concepts.
export const predict = api<PredictRequest, TradingSignal>(
  { expose: true, method: "POST", path: "/analysis/predict" },
  async (req) => {
    const { symbol } = req;
    const tradeId = generateTradeId(symbol);

    // Fetch multi-timeframe market data
    const marketData = await fetchMarketData(symbol, ["5m", "15m", "30m"]);
    
    // Perform advanced AI analysis with professional trading concepts
    const aiAnalysis = await analyzeWithAI(marketData, symbol);
    
    // Perform sentiment analysis
    const sentimentAnalysis = await analyzeSentiment(symbol);
    
    // Generate chart
    const chartUrl = await generateChart(symbol, marketData, aiAnalysis);
    
    // Calculate entry, TP, and SL based on professional risk management
    const currentPrice = marketData["5m"].close;
    const atr = marketData["5m"].indicators.atr;
    
    let entryPrice: number;
    let takeProfit: number;
    let stopLoss: number;
    
    // Professional risk management: Use ATR and key levels
    if (aiAnalysis.direction === "LONG") {
      entryPrice = currentPrice;
      
      // Take profit at next resistance or 2-3 ATR
      const nextResistance = aiAnalysis.smartMoney.liquidityZones
        .filter(zone => zone > currentPrice)
        .sort((a, b) => a - b)[0];
      
      takeProfit = nextResistance && (nextResistance - currentPrice) < (atr * 4) 
        ? nextResistance * 0.999  // Just before resistance
        : currentPrice + (atr * aiAnalysis.professionalAnalysis.riskReward);
      
      // Stop loss below support or 1.5 ATR
      const nearestSupport = aiAnalysis.smartMoney.liquidityZones
        .filter(zone => zone < currentPrice)
        .sort((a, b) => b - a)[0];
      
      stopLoss = nearestSupport && (currentPrice - nearestSupport) < (atr * 2)
        ? nearestSupport * 0.999  // Just below support
        : currentPrice - (atr * 1.5);
        
    } else {
      entryPrice = currentPrice;
      
      // Take profit at next support or 2-3 ATR
      const nextSupport = aiAnalysis.smartMoney.liquidityZones
        .filter(zone => zone < currentPrice)
        .sort((a, b) => b - a)[0];
      
      takeProfit = nextSupport && (currentPrice - nextSupport) < (atr * 4)
        ? nextSupport * 1.001  // Just above support
        : currentPrice - (atr * aiAnalysis.professionalAnalysis.riskReward);
      
      // Stop loss above resistance or 1.5 ATR
      const nearestResistance = aiAnalysis.smartMoney.liquidityZones
        .filter(zone => zone > currentPrice)
        .sort((a, b) => a - b)[0];
      
      stopLoss = nearestResistance && (nearestResistance - currentPrice) < (atr * 2)
        ? nearestResistance * 1.001  // Just above resistance
        : currentPrice + (atr * 1.5);
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
          trend: aiAnalysis.priceAction.trend,
          structure: aiAnalysis.priceAction.structure,
          keyLevels: aiAnalysis.priceAction.keyLevels,
          breakoutProbability: aiAnalysis.priceAction.breakoutProbability,
          support: aiAnalysis.support,
          resistance: aiAnalysis.resistance,
          rsi: aiAnalysis.technical.rsi,
          macd: aiAnalysis.technical.macd,
          atr: aiAnalysis.technical.atr,
        },
        smartMoney: {
          institutionalFlow: aiAnalysis.smartMoney.institutionalFlow,
          volumeProfile: aiAnalysis.smartMoney.volumeProfile,
          orderFlow: aiAnalysis.smartMoney.orderFlow,
          liquidityZones: aiAnalysis.smartMoney.liquidityZones,
        },
        professional: {
          topTraders: aiAnalysis.professionalAnalysis.topTraders,
          consensusView: aiAnalysis.professionalAnalysis.consensusView,
          riskReward: aiAnalysis.professionalAnalysis.riskReward,
          timeframe: aiAnalysis.professionalAnalysis.timeframe,
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
