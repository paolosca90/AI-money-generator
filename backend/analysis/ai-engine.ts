import { secret } from "encore.dev/config";
import { TimeframeData } from "./market-data";

const geminiApiKey = secret("GeminiApiKey");

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

  // Use Gemini AI for enhanced analysis with better error handling
  const geminiAnalysis = await analyzeWithGemini(marketData);

  // Combine traditional analysis with AI insights
  const signals = [rsiSignal, macdSignal, priceAction];
  const bullishSignals = signals.filter(s => s > 0).length;
  const bearishSignals = signals.filter(s => s < 0).length;

  let direction: "LONG" | "SHORT";
  let confidence: number;

  // Apply Gemini AI bias to traditional analysis if available
  if (geminiAnalysis.direction === "LONG") {
    direction = "LONG";
    confidence = Math.min(95, Math.max(geminiAnalysis.confidence, 60 + (bullishSignals * 10)));
  } else {
    direction = "SHORT";
    confidence = Math.min(95, Math.max(geminiAnalysis.confidence, 60 + (bearishSignals * 10)));
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

async function analyzeWithGemini(marketData: TimeframeData): Promise<{ direction: "LONG" | "SHORT"; confidence: number }> {
  try {
    const apiKey = geminiApiKey();
    if (!apiKey || apiKey === "your_gemini_key") {
      console.log("Gemini API key not configured, using fallback analysis");
      return fallbackAnalysis(marketData);
    }

    const prompt = createTradingAnalysisPrompt(marketData);
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 1,
          maxOutputTokens: 200,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
      
      // Check for specific error types
      if (response.status === 503) {
        console.log("Gemini service temporarily unavailable, using fallback");
      } else if (response.status === 429) {
        console.log("Gemini rate limit exceeded, using fallback");
      } else if (response.status === 401) {
        console.log("Gemini API key invalid, using fallback");
      }
      
      return fallbackAnalysis(marketData);
    }

    const data = await response.json();
    
    // Check for API errors in response
    if (data.error) {
      console.error("Gemini API response error:", data.error);
      return fallbackAnalysis(marketData);
    }
    
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      console.log("No text response from Gemini, using fallback");
      return fallbackAnalysis(marketData);
    }

    console.log("Gemini analysis successful");
    return parseGeminiResponse(text);
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return fallbackAnalysis(marketData);
  }
}

function createTradingAnalysisPrompt(marketData: TimeframeData): string {
  const data5m = marketData["5m"];
  const data15m = marketData["15m"];
  const data30m = marketData["30m"];

  return `
You are an expert trading analyst. Analyze the following multi-timeframe market data and provide a trading recommendation.

5-minute timeframe:
- Price: Open ${data5m.open}, High ${data5m.high}, Low ${data5m.low}, Close ${data5m.close}
- RSI: ${data5m.indicators.rsi}
- MACD: ${data5m.indicators.macd}
- ATR: ${data5m.indicators.atr}

15-minute timeframe:
- Price: Open ${data15m.open}, High ${data15m.high}, Low ${data15m.low}, Close ${data15m.close}
- RSI: ${data15m.indicators.rsi}
- MACD: ${data15m.indicators.macd}
- ATR: ${data15m.indicators.atr}

30-minute timeframe:
- Price: Open ${data30m.open}, High ${data30m.high}, Low ${data30m.low}, Close ${data30m.close}
- RSI: ${data30m.indicators.rsi}
- MACD: ${data30m.indicators.macd}
- ATR: ${data30m.indicators.atr}

Based on this technical analysis, provide your recommendation in this exact format:
DIRECTION: [LONG or SHORT]
CONFIDENCE: [number between 60-95]

Consider:
- Multi-timeframe alignment
- RSI levels (oversold <30, overbought >70)
- MACD signals
- Price action patterns
- Overall market momentum
`;
}

function parseGeminiResponse(text: string): { direction: "LONG" | "SHORT"; confidence: number } {
  try {
    const directionMatch = text.match(/DIRECTION:\s*(LONG|SHORT)/i);
    const confidenceMatch = text.match(/CONFIDENCE:\s*(\d+)/i);

    const direction = directionMatch?.[1]?.toUpperCase() as "LONG" | "SHORT" || "LONG";
    const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 70;

    return {
      direction,
      confidence: Math.max(60, Math.min(95, confidence))
    };
  } catch (error) {
    console.error("Error parsing Gemini response:", error);
    return { direction: "LONG", confidence: 70 };
  }
}

function fallbackAnalysis(marketData: TimeframeData): { direction: "LONG" | "SHORT"; confidence: number } {
  // Fallback to traditional analysis if Gemini fails
  const data5m = marketData["5m"];
  const data15m = marketData["15m"];
  const data30m = marketData["30m"];

  const rsiSignal = analyzeRSI(data5m.indicators.rsi, data15m.indicators.rsi, data30m.indicators.rsi);
  const macdSignal = analyzeMacd(data5m.indicators.macd, data15m.indicators.macd, data30m.indicators.macd);
  const priceAction = analyzePriceAction(data5m, data15m, data30m);

  const signals = [rsiSignal, macdSignal, priceAction];
  const bullishSignals = signals.filter(s => s > 0).length;
  const bearishSignals = signals.filter(s => s < 0).length;

  if (bullishSignals > bearishSignals) {
    return { direction: "LONG", confidence: Math.min(85, 60 + (bullishSignals * 10)) };
  } else {
    return { direction: "SHORT", confidence: Math.min(85, 60 + (bearishSignals * 10)) };
  }
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
