import { secret } from "encore.dev/config";
import { TimeframeData } from "./market-data";

const openAIKey = secret("OpenAIKey");

export interface AIAnalysis {
  direction: "LONG" | "SHORT";
  confidence: number;
  support: number;
  resistance: number;
  sentiment: {
    score: number;
    sources: string[];
  };
  volatility: {
    hourly: number;
    daily: number;
  };
}

export async function analyzeWithAI(marketData: TimeframeData): Promise<AIAnalysis> {
  // Extract key indicators from different timeframes
  const data5m = marketData["5m"];
  const data15m = marketData["15m"];
  const data30m = marketData["30m"];

  // Multi-timeframe analysis
  const rsiSignal = analyzeRSI(data5m.indicators.rsi, data15m.indicators.rsi, data30m.indicators.rsi);
  const macdSignal = analyzeMacd(data5m.indicators.macd, data15m.indicators.macd, data30m.indicators.macd);
  const priceAction = analyzePriceAction(data5m, data15m, data30m);

  // Calculate support and resistance levels
  const support = Math.min(data5m.low, data15m.low, data30m.low);
  const resistance = Math.max(data5m.high, data15m.high, data30m.high);

  // Determine overall direction and confidence
  const signals = [rsiSignal, macdSignal, priceAction];
  const bullishSignals = signals.filter(s => s > 0).length;
  const bearishSignals = signals.filter(s => s < 0).length;

  let direction: "LONG" | "SHORT";
  let confidence: number;

  if (bullishSignals > bearishSignals) {
    direction = "LONG";
    confidence = Math.min(95, 60 + (bullishSignals * 15));
  } else {
    direction = "SHORT";
    confidence = Math.min(95, 60 + (bearishSignals * 15));
  }

  // Simulate sentiment analysis (in real implementation, this would use news APIs)
  const sentiment = await simulateSentimentAnalysis();

  // Calculate volatility
  const volatility = {
    hourly: data5m.indicators.atr / data5m.close,
    daily: data30m.indicators.atr / data30m.close,
  };

  return {
    direction,
    confidence,
    support: Math.round(support * 100000) / 100000,
    resistance: Math.round(resistance * 100000) / 100000,
    sentiment,
    volatility,
  };
}

function analyzeRSI(rsi5m: number, rsi15m: number, rsi30m: number): number {
  const avgRsi = (rsi5m + rsi15m + rsi30m) / 3;
  
  if (avgRsi < 30) return 1; // Oversold - bullish
  if (avgRsi > 70) return -1; // Overbought - bearish
  if (avgRsi < 45) return 0.5; // Slightly bullish
  if (avgRsi > 55) return -0.5; // Slightly bearish
  return 0; // Neutral
}

function analyzeMacd(macd5m: number, macd15m: number, macd30m: number): number {
  const bullishCount = [macd5m, macd15m, macd30m].filter(m => m > 0).length;
  
  if (bullishCount === 3) return 1; // All timeframes bullish
  if (bullishCount === 0) return -1; // All timeframes bearish
  if (bullishCount === 2) return 0.5; // Mostly bullish
  return -0.5; // Mostly bearish
}

function analyzePriceAction(data5m: any, data15m: any, data30m: any): number {
  const closes = [data5m.close, data15m.close, data30m.close];
  const opens = [data5m.open, data15m.open, data30m.open];
  
  const bullishCandles = closes.filter((close, i) => close > opens[i]).length;
  
  if (bullishCandles === 3) return 1;
  if (bullishCandles === 0) return -1;
  if (bullishCandles === 2) return 0.5;
  return -0.5;
}

async function simulateSentimentAnalysis(): Promise<{ score: number; sources: string[] }> {
  // In a real implementation, this would analyze news, social media, etc.
  const score = -0.5 + Math.random(); // Random sentiment between -0.5 and 0.5
  const sources = ["Economic Calendar", "Social Media", "News Analysis"];
  
  return { score, sources };
}
