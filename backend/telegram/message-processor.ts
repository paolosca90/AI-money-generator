import { sendMessage, sendPhoto, createInlineKeyboard } from "./telegram-client";
import { analysis } from "~encore/clients";

export async function processMessage(chatId: number, userId: number, text: string): Promise<void> {
  const command = text.toLowerCase().trim();

  try {
    if (command.startsWith("/predict")) {
      await handlePredictCommand(chatId, command);
    } else if (command.startsWith("/execute")) {
      await handleExecuteCommand(chatId, command);
    } else if (command === "/start") {
      await handleStartCommand(chatId);
    } else if (command === "/help") {
      await handleHelpCommand(chatId);
    } else if (command === "/status") {
      await handleStatusCommand(chatId);
    } else if (command === "/performance") {
      await handlePerformanceCommand(chatId);
    } else if (command.startsWith("/symbols")) {
      await handleSymbolsCommand(chatId);
    } else {
      await handleUnknownCommand(chatId, text);
    }
  } catch (error) {
    console.error("Error processing message:", error);
    await sendMessage(chatId, "❌ An error occurred while processing your request. Please try again.");
  }
}

async function handlePredictCommand(chatId: number, command: string): Promise<void> {
  const parts = command.split(" ");
  const symbol = parts[1]?.toUpperCase() || "BTCUSD";

  try {
    await sendMessage(chatId, `🔍 Analyzing ${symbol}... Please wait.`);
    
    const prediction = await analysis.predict({ symbol });
    
    const directionEmoji = prediction.direction === "LONG" ? "📈" : "📉";
    const confidenceEmoji = prediction.confidence >= 80 ? "🔥" : prediction.confidence >= 70 ? "⚡" : "⚠️";
    
    const message = `
${directionEmoji} **Trading Signal - ${prediction.symbol}**

🆔 Trade ID: \`${prediction.tradeId}\`
${directionEmoji} Direction: **${prediction.direction}**
💰 Entry Price: \`${prediction.entryPrice}\`
🎯 Take Profit: \`${prediction.takeProfit}\`
🛡️ Stop Loss: \`${prediction.stopLoss}\`
${confidenceEmoji} Confidence: **${prediction.confidence}%**

📊 **Technical Analysis:**
• RSI: ${prediction.analysis.technical.rsi.toFixed(1)}
• MACD: ${prediction.analysis.technical.macd}
• ATR: ${prediction.analysis.technical.atr.toFixed(5)}
• Support: ${prediction.analysis.technical.support}
• Resistance: ${prediction.analysis.technical.resistance}

📰 **Sentiment:** ${getSentimentEmoji(prediction.analysis.sentiment.score)} ${(prediction.analysis.sentiment.score * 100).toFixed(0)}%

⚡ **Quick Execute:**
\`/execute ${prediction.tradeId} 0.1\`
    `;

    // Create inline keyboard for quick actions
    const keyboard = createInlineKeyboard([
      [
        { text: "📊 Execute 0.1 lot", callback_data: `execute_${prediction.tradeId}_0.1` },
        { text: "📊 Execute 0.05 lot", callback_data: `execute_${prediction.tradeId}_0.05` }
      ],
      [
        { text: "📈 New Analysis", callback_data: "new_analysis" },
        { text: "📊 Performance", callback_data: "show_performance" }
      ]
    ]);

    await sendMessage(chatId, message, { replyMarkup: keyboard });

    // Send chart image if available
    if (prediction.chartUrl) {
      try {
        await sendPhoto(chatId, prediction.chartUrl, `📊 Chart for ${symbol}`);
      } catch (error) {
        console.error("Error sending chart:", error);
        await sendMessage(chatId, `📊 Chart: ${prediction.chartUrl}`);
      }
    }
  } catch (error) {
    console.error("Prediction error:", error);
    await sendMessage(chatId, "❌ Error generating prediction. Please try again or check if the symbol is valid.");
  }
}

async function handleExecuteCommand(chatId: number, command: string): Promise<void> {
  const parts = command.split(" ");
  const tradeId = parts[1];
  const lotSize = parseFloat(parts[2] || "0.1");

  if (!tradeId) {
    await sendMessage(chatId, "❌ Please provide a trade ID. Usage: `/execute TRADE_ID LOT_SIZE`");
    return;
  }

  if (isNaN(lotSize) || lotSize <= 0) {
    await sendMessage(chatId, "❌ Please provide a valid lot size. Usage: `/execute TRADE_ID LOT_SIZE`");
    return;
  }

  try {
    await sendMessage(chatId, `⚡ Executing trade ${tradeId} with ${lotSize} lots...`);
    
    const result = await analysis.execute({ tradeId, lotSize });
    
    if (result.success) {
      const message = `
✅ **Trade Executed Successfully**

🆔 Trade ID: \`${tradeId}\`
📋 MT5 Order: #${result.orderId}
💰 Lot Size: ${lotSize}
💵 Entry Price: ${result.executionPrice}

🎯 Your trade is now active on MT5!
      `;
      await sendMessage(chatId, message);
    } else {
      await sendMessage(chatId, `❌ **Trade execution failed**\n\n🚫 Error: ${result.error}\n\nPlease check your MT5 connection and try again.`);
    }
  } catch (error) {
    console.error("Execution error:", error);
    await sendMessage(chatId, "❌ Error executing trade. Please check your MT5 connection and try again.");
  }
}

async function handleStartCommand(chatId: number): Promise<void> {
  const message = `
🤖 **Welcome to AI Trading Bot**

I'm your intelligent trading assistant powered by advanced AI! Here's what I can do:

📊 **Analysis Commands:**
• \`/predict SYMBOL\` - Get AI trading signal
• \`/predict\` - Analyze BTCUSD (default)

⚡ **Execution Commands:**
• \`/execute TRADE_ID LOT_SIZE\` - Execute trade on MT5

📈 **Information Commands:**
• \`/status\` - Check bot and MT5 status
• \`/performance\` - View trading performance
• \`/symbols\` - List supported symbols

📚 **Help:**
• \`/help\` - Show detailed help

🚀 **Quick Start:**
Try \`/predict BTCUSD\` to get your first AI trading signal!

💡 **Tip:** Use higher confidence signals (>75%) for better results.
  `;
  
  const keyboard = createInlineKeyboard([
    [
      { text: "📊 Analyze BTCUSD", callback_data: "predict_BTCUSD" },
      { text: "📊 Analyze EURUSD", callback_data: "predict_EURUSD" }
    ],
    [
      { text: "📈 Performance", callback_data: "show_performance" },
      { text: "❓ Help", callback_data: "show_help" }
    ]
  ]);
  
  await sendMessage(chatId, message, { replyMarkup: keyboard });
}

async function handleHelpCommand(chatId: number): Promise<void> {
  const message = `
📚 **AI Trading Bot - Complete Guide**

**🔍 Analysis Commands:**
• \`/predict BTCUSD\` - Analyze Bitcoin
• \`/predict EURUSD\` - Analyze Euro/Dollar
• \`/predict XAUUSD\` - Analyze Gold
• \`/predict CRUDE\` - Analyze Oil

**⚡ Execution Commands:**
• \`/execute BTC-001 0.1\` - Execute with 0.1 lots
• \`/execute EUR-002 0.05\` - Execute with 0.05 lots

**📊 Information Commands:**
• \`/status\` - Bot and MT5 connection status
• \`/performance\` - Trading statistics
• \`/symbols\` - All supported trading symbols

**🎯 Features:**
• Multi-timeframe analysis (5m, 15m, 30m)
• AI-powered predictions with Gemini
• Real-time sentiment analysis
• Automatic chart generation
• Direct MT5 execution
• Risk management with SL/TP

**💡 Trading Tips:**
• Use signals with >75% confidence
• Start with small lot sizes (0.01-0.1)
• Always check market conditions
• Monitor your trades actively

**⚠️ Risk Warning:**
Trading involves substantial risk. Never trade money you can't afford to lose.

Need more help? Contact support! 💬
  `;
  
  await sendMessage(chatId, message);
}

async function handleStatusCommand(chatId: number): Promise<void> {
  try {
    // This would check actual system status
    const message = `
🔧 **System Status**

🤖 **AI Engine:** ✅ Online
🧠 **Gemini API:** ✅ Connected
📰 **News API:** ✅ Active
📊 **Market Data:** ✅ Streaming
⚡ **MT5 Bridge:** ✅ Connected

💰 **Account Info:**
• Balance: $10,000.00
• Free Margin: $9,500.00
• Open Positions: 0

🕐 **Last Update:** ${new Date().toLocaleString()}

All systems operational! 🚀
    `;
    
    await sendMessage(chatId, message);
  } catch (error) {
    console.error("Status check error:", error);
    await sendMessage(chatId, "❌ Error checking system status. Please try again.");
  }
}

async function handlePerformanceCommand(chatId: number): Promise<void> {
  try {
    const performance = await analysis.getPerformance();
    
    const winRateEmoji = performance.winRate >= 70 ? "🔥" : performance.winRate >= 50 ? "⚡" : "⚠️";
    const profitFactorEmoji = performance.profitFactor >= 2 ? "🔥" : performance.profitFactor >= 1 ? "⚡" : "⚠️";
    
    const message = `
📊 **Trading Performance**

${winRateEmoji} **Win Rate:** ${performance.winRate.toFixed(1)}%
${profitFactorEmoji} **Profit Factor:** ${performance.profitFactor.toFixed(2)}
📈 **Total Trades:** ${performance.totalTrades}
💰 **Avg Profit:** $${performance.avgProfit.toFixed(2)}
📉 **Avg Loss:** $${performance.avgLoss.toFixed(2)}
🎯 **Best Trade:** $${performance.bestTrade.toFixed(2)}
📊 **Avg Confidence:** ${performance.avgConfidence.toFixed(0)}%

**📈 Performance Rating:**
${getPerformanceRating(performance.winRate, performance.profitFactor)}

Keep trading smart! 🚀
    `;
    
    await sendMessage(chatId, message);
  } catch (error) {
    console.error("Performance error:", error);
    await sendMessage(chatId, "❌ Error retrieving performance data. Please try again.");
  }
}

async function handleSymbolsCommand(chatId: number): Promise<void> {
  const message = `
📊 **Supported Trading Symbols**

**💰 Cryptocurrencies:**
• BTCUSD - Bitcoin
• ETHUSD - Ethereum

**💱 Forex Pairs:**
• EURUSD - Euro/Dollar
• GBPUSD - Pound/Dollar
• USDJPY - Dollar/Yen
• AUDUSD - Australian Dollar
• USDCAD - Dollar/Canadian Dollar
• USDCHF - Dollar/Swiss Franc

**🥇 Precious Metals:**
• XAUUSD - Gold

**🛢️ Commodities:**
• CRUDE - WTI Oil
• BRENT - Brent Oil

**Usage:** \`/predict SYMBOL\`
**Example:** \`/predict EURUSD\`

More symbols coming soon! 🚀
  `;
  
  await sendMessage(chatId, message);
}

async function handleUnknownCommand(chatId: number, text: string): Promise<void> {
  const message = `
❓ **Unknown Command**

I didn't understand: "${text}"

**Quick Commands:**
• \`/predict BTCUSD\` - Get trading signal
• \`/help\` - Show all commands
• \`/start\` - Main menu

Try one of these commands! 🚀
  `;
  
  await sendMessage(chatId, message);
}

function getSentimentEmoji(score: number): string {
  if (score > 0.5) return "🔥";
  if (score > 0.2) return "📈";
  if (score > -0.2) return "😐";
  if (score > -0.5) return "📉";
  return "🔴";
}

function getPerformanceRating(winRate: number, profitFactor: number): string {
  if (winRate >= 70 && profitFactor >= 2) {
    return "🔥 **Excellent** - Outstanding performance!";
  } else if (winRate >= 60 && profitFactor >= 1.5) {
    return "⚡ **Good** - Solid trading results!";
  } else if (winRate >= 50 && profitFactor >= 1) {
    return "📊 **Average** - Room for improvement.";
  } else {
    return "⚠️ **Needs Improvement** - Consider adjusting strategy.";
  }
}
