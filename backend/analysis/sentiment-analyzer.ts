import { secret } from "encore.dev/config";

const geminiApiKey = secret("GeminiApiKey");
const newsApiKey = secret("NewsApiKey");

export interface SentimentAnalysis {
  score: number; // -1 to 1 (bearish to bullish)
  sources: string[];
  summary: string;
}

export async function analyzeSentiment(symbol: string): Promise<SentimentAnalysis> {
  try {
    // Fetch recent news for the symbol
    const news = await fetchRecentNews(symbol);
    
    if (news.length === 0) {
      return {
        score: 0,
        sources: ["No recent news"],
        summary: "No significant news found for sentiment analysis"
      };
    }

    // Use Gemini to analyze sentiment
    const sentimentScore = await analyzeNewsWithGemini(news, symbol);
    
    return {
      score: sentimentScore,
      sources: news.map(n => n.source),
      summary: `Analyzed ${news.length} recent news articles`
    };
  } catch (error) {
    console.error("Error in sentiment analysis:", error);
    return {
      score: 0,
      sources: ["Error"],
      summary: "Unable to perform sentiment analysis"
    };
  }
}

async function fetchRecentNews(symbol: string): Promise<Array<{ title: string; description: string; source: string }>> {
  try {
    // Map trading symbols to search terms
    const searchTerms = getSearchTermsForSymbol(symbol);
    
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(searchTerms)}&sortBy=publishedAt&pageSize=10&apiKey=${newsApiKey()}`
    );

    if (!response.ok) {
      console.error("News API error:", response.statusText);
      return [];
    }

    const data = await response.json();
    
    return data.articles?.slice(0, 5).map((article: any) => ({
      title: article.title || "",
      description: article.description || "",
      source: article.source?.name || "Unknown"
    })) || [];
  } catch (error) {
    console.error("Error fetching news:", error);
    return [];
  }
}

function getSearchTermsForSymbol(symbol: string): string {
  const symbolMap: { [key: string]: string } = {
    "BTCUSD": "Bitcoin BTC cryptocurrency",
    "ETHUSD": "Ethereum ETH cryptocurrency",
    "EURUSD": "Euro Dollar EUR USD forex",
    "GBPUSD": "British Pound Dollar GBP USD forex",
    "USDJPY": "Dollar Yen USD JPY forex",
    "XAUUSD": "Gold XAU precious metals",
    "CRUDE": "Oil crude petroleum WTI",
    "BRENT": "Brent oil petroleum",
  };

  return symbolMap[symbol] || symbol;
}

async function analyzeNewsWithGemini(news: Array<{ title: string; description: string; source: string }>, symbol: string): Promise<number> {
  try {
    const newsText = news.map(n => `${n.title} - ${n.description}`).join("\n\n");
    
    const prompt = `
You are a financial sentiment analyst. Analyze the following news articles related to ${symbol} and determine the overall market sentiment.

News Articles:
${newsText}

Based on these articles, provide a sentiment score for ${symbol} trading.

Respond with only a number between -1 and 1, where:
-1 = Very Bearish (strong negative sentiment)
-0.5 = Bearish (negative sentiment)
0 = Neutral (no clear sentiment)
0.5 = Bullish (positive sentiment)
1 = Very Bullish (strong positive sentiment)

Consider factors like:
- Economic indicators
- Market trends
- Regulatory news
- Adoption/usage news
- Technical developments
- Market volatility mentions

Sentiment Score:`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey()}`, {
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
          maxOutputTokens: 50,
        }
      })
    });

    if (!response.ok) {
      console.error("Gemini sentiment API error:", response.statusText);
      return 0;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      return 0;
    }

    // Extract the sentiment score
    const scoreMatch = text.match(/-?[0-1](?:\.[0-9]+)?/);
    const score = scoreMatch ? parseFloat(scoreMatch[0]) : 0;
    
    // Ensure score is within bounds
    return Math.max(-1, Math.min(1, score));
  } catch (error) {
    console.error("Error analyzing sentiment with Gemini:", error);
    return 0;
  }
}
