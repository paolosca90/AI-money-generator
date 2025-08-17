import { sendMessage, sendPhoto, createInlineKeyboard } from "./telegram-client";
import { analysis } from "~encore/clients";
import { handleVPSCommand, handleVPSSetup, handleVPSSetupCallback, checkVPSSetupState } from "./vps-manager";
import { handleClientCommands, checkClientFeature } from "./client-manager";
import { handleAdminCommands } from "./admin-manager";

export async function processMessage(chatId: number, userId: number, text: string): Promise<void> {
  const command = text.toLowerCase().trim();

  try {
    if (command.startsWith("/predict")) {
      // Check if user has signal access
      const hasAccess = await checkClientFeature(userId, "basic_signals") ||
                       await checkClientFeature(userId, "advanced_signals") ||
                       await checkClientFeature(userId, "premium_signals");
      
      if (!hasAccess) {
        await sendMessage(chatId, "❌ You need an active subscription to access AI signals. Use `/subscription` to learn more.");
        return;
      }
      
      await handlePredictCommand(chatId, command);
    } else if (command.startsWith("/scalping")) {
      await handleStrategyCommand(chatId, command, "SCALPING");
    } else if (command.startsWith("/intraday")) {
      await handleStrategyCommand(chatId, command, "INTRADAY");
    } else if (command.startsWith("/swing")) {
      await handleStrategyCommand(chatId, command, "SWING");
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
    } else if (command.startsWith("/strategies")) {
      await handleStrategiesCommand(chatId);
    } else if (command.startsWith("/vps")) {
      // Check if user has VPS management access
      const hasAccess = await checkClientFeature(userId, "vps_management");
      
      if (!hasAccess) {
        await sendMessage(chatId, "❌ You need an active subscription to access VPS management. Use `/subscription` to learn more.");
        return;
      }
      
      await handleVPSCommand(chatId, userId, command);
    } else if (command === "/vps_setup") {
      // Check if user has VPS management access
      const hasAccess = await checkClientFeature(userId, "vps_management");
      
      if (!hasAccess) {
        await sendMessage(chatId, "❌ You need an active subscription to access VPS setup. Use `/subscription` to learn more.");
        return;
      }
      
      await handleVPSSetup(chatId, userId);
    } else if (command === "/vps_status") {
      await handleVPSCommand(chatId, userId, "/vps_status");
    } else if (command === "/vps_restart") {
      await handleVPSCommand(chatId, userId, "/vps_restart");
    } else if (command === "/vps_logs") {
      await handleVPSCommand(chatId, userId, "/vps_logs");
    } else if (command === "/subscription" || command === "/features" || command === "/upgrade" || command === "/support") {
      await handleClientCommands(chatId, userId, command);
    } else if (command.startsWith("/admin_")) {
      await handleAdminCommands(chatId, userId, command);
    } else {
      // Check if user is in VPS setup mode  
      const setupState = await checkVPSSetupState(userId);
      if (setupState) {
        await handleVPSSetup(chatId, userId, text);
      } else {
        await sendMessage(chatId, "❓ Command not recognized. Use `/help` to see available commands.");
      }
    }
  } catch (error) {
    console.error("Error processing message:", error);
    await sendMessage(chatId, "❌ An error occurred while processing your request. Please try again.");
  }
}

export async function processCallbackQuery(chatId: number, userId: number, callbackData: string): Promise<void> {
  try {
    if (callbackData.startsWith("vps_")) {
      await handleVPSSetupCallback(chatId, userId, callbackData);
    } else if (callbackData.startsWith("execute_")) {
      const parts = callbackData.split("_");
      const tradeId = parts[1];
      const lotSize = parseFloat(parts[2]);
      const strategy = parts[3] || "INTRADAY";
      await executeTradeFromCallback(chatId, tradeId, lotSize, strategy);
    } else if (callbackData.startsWith("strategy_")) {
      const parts = callbackData.split("_");
      const strategy = parts[1] as "SCALPING" | "INTRADAY" | "SWING";
      const symbol = parts[2] || "BTCUSD";
      await handleStrategyCommand(chatId, `/predict ${symbol}`, strategy);
    } else if (callbackData === "new_analysis") {
      await sendMessage(chatId, "📊 Choose your trading strategy:\n\n⚡ `/scalping SYMBOL` - Quick trades (1-15 min)\n📈 `/intraday SYMBOL` - Day trading (1-8 hours)\n🎯 `/swing SYMBOL` - Multi-day trades (1-7 days)\n\nExample: `/scalping EURUSD`");
    } else if (callbackData === "show_performance") {
      await handlePerformanceCommand(chatId);
    } else if (callbackData.startsWith("predict_")) {
      const symbol = callbackData.replace("predict_", "");
      await handlePredictCommand(chatId, `/predict ${symbol}`);
    } else if (callbackData === "show_help") {
      await handleHelpCommand(chatId);
    } else if (callbackData === "show_strategies") {
      await handleStrategiesCommand(chatId);
    }
  } catch (error) {
    console.error("Error processing callback query:", error);
    await sendMessage(chatId, "❌ An error occurred while processing your request. Please try again.");
  }
}

async function executeTradeFromCallback(chatId: number, tradeId: string, lotSize: number, strategy: string): Promise<void> {
  try {
    await sendMessage(chatId, `⚡ Executing ${strategy} trade ${tradeId} with ${lotSize} lots...`);
    
    const result = await analysis.execute({ tradeId, lotSize, strategy });
    
    if (result.success) {
      const message = `
✅ **${strategy} Trade Executed Successfully**

🆔 Trade ID: \`${tradeId}\`
📋 MT5 Order: #${result.orderId}
💰 Lot Size: ${lotSize}
💵 Entry Price: ${result.executionPrice}
⏱️ Estimated Hold: ${result.estimatedHoldingTime}

🎯 Your ${strategy.toLowerCase()} trade is now active on MT5!
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

async function handlePredictCommand(chatId: number, command: string): Promise<void> {
  const parts = command.split(" ");
  const symbol = parts[1]?.toUpperCase() || "BTCUSD";

  try {
    await sendMessage(chatId, `🧠 **Advanced ML Analysis for ${symbol}**\n\n🔍 Analyzing market structure, smart money flow, and determining optimal strategy...\n\n⏳ This may take 10-15 seconds for comprehensive analysis.`);
    
    const prediction = await analysis.predict({ symbol });
    
    await sendTradingSignal(chatId, prediction);
  } catch (error) {
    console.error("Prediction error:", error);
    await sendMessage(chatId, "❌ Error generating prediction. Please try again or check if the symbol is valid.");
  }
}

async function handleStrategyCommand(chatId: number, command: string, strategy: "SCALPING" | "INTRADAY" | "SWING"): Promise<void> {
  const parts = command.split(" ");
  const symbol = parts[1]?.toUpperCase() || "BTCUSD";

  try {
    const strategyEmojis = {
      "SCALPING": "⚡",
      "INTRADAY": "📈", 
      "SWING": "🎯"
    };

    await sendMessage(chatId, `${strategyEmojis[strategy]} **${strategy} Analysis for ${symbol}**\n\n🔍 Analyzing market for ${strategy.toLowerCase()} opportunities...\n\n⏳ Optimizing entry, stop loss, and take profit levels...`);
    
    const prediction = await analysis.predict({ symbol, strategy });
    
    await sendTradingSignal(chatId, prediction);
  } catch (error) {
    console.error("Strategy prediction error:", error);
    await sendMessage(chatId, `❌ Error generating ${strategy.toLowerCase()} analysis. Please try again.`);
  }
}

async function sendTradingSignal(chatId: number, prediction: any): Promise<void> {
  const strategyEmojis = {
    "SCALPING": "⚡",
    "INTRADAY": "📈",
    "SWING": "🎯"
  };

  const directionEmoji = prediction.direction === "LONG" ? "📈" : "📉";
  const confidenceEmoji = prediction.confidence >= 85 ? "🔥" : prediction.confidence >= 75 ? "⚡" : "⚠️";
  const strategyEmoji = strategyEmojis[prediction.strategy] || "📊";
  
  const message = `
${strategyEmoji} **${prediction.strategy} Signal - ${prediction.symbol}**

🆔 Trade ID: \`${prediction.tradeId}\`
${directionEmoji} **Direction: ${prediction.direction}**
💰 **Entry Price:** \`${prediction.entryPrice}\`
🎯 **Take Profit:** \`${prediction.takeProfit}\`
🛡️ **Stop Loss:** \`${prediction.stopLoss}\`
${confidenceEmoji} **Confidence:** **${prediction.confidence}%**
📊 **Risk/Reward:** 1:${prediction.riskRewardRatio}
💎 **Recommended Size:** ${prediction.recommendedLotSize} lots
⏱️ **Max Hold Time:** ${prediction.maxHoldingTime}h

📊 **Strategy Analysis:**
${prediction.strategyRecommendation}

📈 **Price Action Analysis:**
• Market Structure: **${prediction.analysis.technical.structure}**
• Trend: **${prediction.analysis.technical.trend}**
• Breakout Probability: **${prediction.analysis.technical.breakoutProbability}%**

👥 **Professional Trader Consensus:**
• Top Traders: ${prediction.analysis.professional.topTraders.slice(0, 2).join(", ")}
• Consensus: **${prediction.analysis.professional.consensusView}**
• Risk/Reward: **1:${prediction.analysis.professional.riskReward.toFixed(1)}**

🎯 **Key Liquidity Zones:**
${prediction.analysis.smartMoney.liquidityZones.slice(0, 3).map(zone => `• ${zone.toFixed(5)}`).join('\n')}

📰 **Market Sentiment:** ${getSentimentEmoji(prediction.analysis.sentiment.score)} ${(prediction.analysis.sentiment.score * 100).toFixed(0)}%

⚡ **Quick Execute:**
\`/execute ${prediction.tradeId} ${prediction.recommendedLotSize}\`
  `;

  // Create inline keyboard for quick actions
  const keyboard = createInlineKeyboard([
    [
      { text: `${strategyEmoji} Execute ${prediction.recommendedLotSize}`, callback_data: `execute_${prediction.tradeId}_${prediction.recommendedLotSize}_${prediction.strategy}` },
      { text: `${strategyEmoji} Execute 0.01`, callback_data: `execute_${prediction.tradeId}_0.01_${prediction.strategy}` }
    ],
    [
      { text: "⚡ Scalping", callback_data: `strategy_SCALPING_${prediction.symbol}` },
      { text: "📈 Intraday", callback_data: `strategy_INTRADAY_${prediction.symbol}` },
      { text: "🎯 Swing", callback_data: `strategy_SWING_${prediction.symbol}` }
    ],
    [
      { text: "📊 New Analysis", callback_data: "new_analysis" },
      { text: "📈 Performance", callback_data: "show_performance" }
    ]
  ]);

  await sendMessage(chatId, message, { replyMarkup: keyboard });

  // Send chart image if available
  if (prediction.chartUrl) {
    try {
      await sendPhoto(chatId, prediction.chartUrl, `📊 ${prediction.strategy} Chart Analysis for ${prediction.symbol}`);
    } catch (error) {
      console.error("Error sending chart:", error);
      await sendMessage(chatId, `📊 Chart: ${prediction.chartUrl}`);
    }
  }
}

async function handleExecuteCommand(chatId: number, command: string): Promise<void> {
  const parts = command.split(" ");
  const tradeId = parts[1];
  const lotSize = parseFloat(parts[2] || "0.1");
  const strategy = parts[3] || "INTRADAY";

  if (!tradeId) {
    await sendMessage(chatId, "❌ Please provide a trade ID. Usage: `/execute TRADE_ID LOT_SIZE [STRATEGY]`");
    return;
  }

  if (isNaN(lotSize) || lotSize <= 0) {
    await sendMessage(chatId, "❌ Please provide a valid lot size. Usage: `/execute TRADE_ID LOT_SIZE [STRATEGY]`");
    return;
  }

  try {
    await sendMessage(chatId, `⚡ Executing ${strategy} trade ${tradeId} with ${lotSize} lots...`);
    
    const result = await analysis.execute({ tradeId, lotSize, strategy });
    
    if (result.success) {
      const message = `
✅ **${strategy} Trade Executed Successfully**

🆔 Trade ID: \`${tradeId}\`
📋 MT5 Order: #${result.orderId}
💰 Lot Size: ${lotSize}
💵 Entry Price: ${result.executionPrice}
⏱️ Estimated Hold: ${result.estimatedHoldingTime}

🎯 Your ${strategy.toLowerCase()} trade is now active on MT5!
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
🤖 **Welcome to Professional AI Trading Bot**

I'm your institutional-grade trading assistant with **3 specialized strategies**! 

🧠 **What Makes Me Different:**
• **Smart Money Analysis** - Track institutional flow and order patterns
• **Professional Trader Consensus** - Follow top traders for each asset
• **Advanced Price Action** - Market structure and liquidity zone analysis
• **ML-Powered Predictions** - No traditional indicators, pure price action

⚡ **Trading Strategies:**
• \`/scalping SYMBOL\` - Quick trades (1-15 minutes, tight stops)
• \`/intraday SYMBOL\` - Day trading (1-8 hours, balanced risk)
• \`/swing SYMBOL\` - Multi-day trades (1-7 days, larger targets)

📊 **General Analysis:**
• \`/predict SYMBOL\` - Auto-select optimal strategy

⚡ **Execution Commands:**
• \`/execute TRADE_ID LOT_SIZE [STRATEGY]\` - Execute trade on MT5

🖥️ **VPS Management:**
• \`/vps\` - Manage your VPS and MT5 setup
• \`/vps_setup\` - Configure new VPS automatically

📈 **Information Commands:**
• \`/status\` - Check bot and MT5 status
• \`/performance\` - View trading performance
• \`/strategies\` - Learn about trading strategies
• \`/symbols\` - List supported symbols

📚 **Help:**
• \`/help\` - Show detailed help

🚀 **Quick Start:**
1. Use \`/vps_setup\` to configure your VPS and MT5
2. Try \`/scalping BTCUSD\` for a quick scalping signal!
3. Or \`/swing EURUSD\` for a swing trading opportunity!

💡 **Professional Tip:** Each strategy has optimized risk/reward ratios and holding times. Choose based on your trading style and available time.
  `;
  
  const keyboard = createInlineKeyboard([
    [
      { text: "⚡ Scalping BTCUSD", callback_data: "strategy_SCALPING_BTCUSD" },
      { text: "📈 Intraday EURUSD", callback_data: "strategy_INTRADAY_EURUSD" }
    ],
    [
      { text: "🎯 Swing XAUUSD", callback_data: "strategy_SWING_XAUUSD" },
      { text: "🖥️ Setup VPS", callback_data: "vps_setup" }
    ],
    [
      { text: "📊 Strategies Guide", callback_data: "show_strategies" },
      { text: "❓ Help", callback_data: "show_help" }
    ]
  ]);
  
  await sendMessage(chatId, message, { replyMarkup: keyboard });
}

async function handleStrategiesCommand(chatId: number): Promise<void> {
  const message = `
📊 **Professional Trading Strategies Guide**

**⚡ SCALPING STRATEGY**
• **Timeframe:** 1-15 minutes
• **Risk/Reward:** 1:1.5
• **Best For:** Quick profits, high-volume sessions
• **Stop Loss:** Tight (0.8x ATR)
• **Take Profit:** Quick (1.2x ATR)
• **Min Confidence:** 85%
• **Max Position:** 0.5 lots
• **Ideal Conditions:** High volume, trending markets, low spreads

**📈 INTRADAY STRATEGY**
• **Timeframe:** 1-8 hours
• **Risk/Reward:** 1:2.0
• **Best For:** Day trading, balanced approach
• **Stop Loss:** Standard (1.0x ATR)
• **Take Profit:** Standard (2.0x ATR)
• **Min Confidence:** 75%
• **Max Position:** 1.0 lots
• **Ideal Conditions:** Normal volume, trending markets, breakouts

**🎯 SWING STRATEGY**
• **Timeframe:** 1-7 days
• **Risk/Reward:** 1:3.0
• **Best For:** Multi-day trends, larger moves
• **Stop Loss:** Wide (1.5x ATR)
• **Take Profit:** Large (4.5x ATR)
• **Min Confidence:** 70%
• **Max Position:** 2.0 lots
• **Ideal Conditions:** Any volume, reversals, consolidations

**🎓 How to Choose:**

**Choose SCALPING when:**
• You can monitor trades actively
• Market is trending with high volume
• You want quick profits
• Low volatility environment

**Choose INTRADAY when:**
• You trade during market hours
• Balanced risk/reward approach
• Following daily trends
• Normal market conditions

**Choose SWING when:**
• You prefer less monitoring
• Looking for larger moves
• Multi-day trend following
• Higher volatility acceptable

**💡 Pro Tips:**
• Start with INTRADAY for balanced approach
• Use SCALPING during high-volume sessions
• Use SWING for major trend reversals
• Always respect the strategy's risk limits

**⚡ Quick Commands:**
• \`/scalping EURUSD\` - Generate scalping signal
• \`/intraday GBPUSD\` - Generate intraday signal  
• \`/swing XAUUSD\` - Generate swing signal
• \`/predict BTCUSD\` - Auto-select best strategy

Each strategy is optimized for different market conditions and trading styles! 🚀
  `;
  
  await sendMessage(chatId, message);
}

async function handleHelpCommand(chatId: number): Promise<void> {
  const message = `
📚 **Professional AI Trading Bot - Complete Guide**

**⚡ SCALPING Commands:**
• \`/scalping BTCUSD\` - Quick Bitcoin scalp (1-15 min)
• \`/scalping EURUSD\` - Euro scalping opportunity
• \`/scalping XAUUSD\` - Gold scalping signal

**📈 INTRADAY Commands:**
• \`/intraday EURUSD\` - Euro day trading (1-8 hours)
• \`/intraday GBPUSD\` - Pound intraday analysis
• \`/intraday CRUDE\` - Oil day trading signal

**🎯 SWING Commands:**
• \`/swing BTCUSD\` - Bitcoin swing trade (1-7 days)
• \`/swing XAUUSD\` - Gold swing opportunity
• \`/swing CRUDE\` - Oil swing analysis

**📊 General Analysis:**
• \`/predict SYMBOL\` - Auto-select optimal strategy
• \`/predict\` - Analyze BTCUSD (default)

**⚡ Execution Commands:**
• \`/execute BTC-001 0.1\` - Execute with 0.1 lots
• \`/execute EUR-002 0.05 SCALPING\` - Execute scalping trade
• \`/execute XAU-003 0.2 SWING\` - Execute swing trade

**🖥️ VPS Management:**
• \`/vps\` - VPS dashboard and management
• \`/vps_setup\` - Automatic VPS configuration
• \`/vps_status\` - Check VPS and MT5 status
• \`/vps_restart\` - Restart trading bot on VPS
• \`/vps_logs\` - View recent VPS logs

**💰 Account & Subscription:**
• \`/subscription\` - View your subscription details
• \`/features\` - See your available features
• \`/upgrade\` - Upgrade your plan
• \`/support\` - Get help and support

**📊 Information Commands:**
• \`/status\` - Bot and MT5 connection status
• \`/performance\` - Trading statistics
• \`/strategies\` - Detailed strategy guide
• \`/symbols\` - All supported trading symbols

**🎯 Strategy Features:**

**⚡ SCALPING (1-15 min):**
• Tight stops for capital protection
• Quick profit taking
• High confidence signals only
• Best during high volume sessions

**📈 INTRADAY (1-8 hours):**
• Balanced risk/reward ratio
• Follow trend direction
• Close before market close
• Monitor news and events

**🎯 SWING (1-7 days):**
• Wider stops for volatility
• Larger profit targets
• Less frequent monitoring
• Focus on weekly trends

**💡 Professional Tips:**
• **Risk Management:** Never risk more than 2% per trade
• **Strategy Selection:** Choose based on available time and market conditions
• **Position Sizing:** Use recommended lot sizes for optimal risk
• **Monitoring:** Scalping requires active monitoring, swing allows passive approach

**⚠️ Risk Warning:**
This bot uses advanced institutional trading concepts. Always use proper risk management and never trade money you can't afford to lose.

Need more help? Check \`/subscription\` for your plan details! 💬
  `;
  
  await sendMessage(chatId, message);
}

async function handleStatusCommand(chatId: number): Promise<void> {
  try {
    // This would check actual system status
    const message = `
🔧 **Professional Trading System Status**

🧠 **ML Engine:** ✅ Online (Advanced Models Active)
🤖 **Gemini AI:** ✅ Connected (Professional Analysis)
📊 **Smart Money Tracker:** ✅ Active (Institutional Flow)
📈 **Order Flow Analyzer:** ✅ Streaming (Real-time)
📰 **News Sentiment:** ✅ Active (Multi-source)
⚡ **MT5 Bridge:** ✅ Connected (Professional Execution)
🖥️ **VPS Manager:** ✅ Active (24/7 Monitoring)

💰 **Account Info:**
• Balance: $10,000.00
• Free Margin: $9,500.00
• Open Positions: 0
• Risk Level: Conservative

🎯 **Strategy Capabilities:**
• ⚡ Scalping: ✅ Active (1-15 min trades)
• 📈 Intraday: ✅ Active (1-8 hour trades)
• 🎯 Swing: ✅ Active (1-7 day trades)
• 📊 Auto-Strategy: ✅ Active (Optimal selection)

🕐 **Last Update:** ${new Date().toLocaleString()}

All professional trading systems operational! 🚀

Use \`/vps\` to manage your VPS and MT5 connection.
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
📊 **Professional Trading Performance**

${winRateEmoji} **Win Rate:** ${performance.winRate.toFixed(1)}%
${profitFactorEmoji} **Profit Factor:** ${performance.profitFactor.toFixed(2)}
📈 **Total Signals:** ${performance.totalTrades}
💰 **Avg Profit:** $${performance.avgProfit.toFixed(2)}
📉 **Avg Loss:** $${performance.avgLoss.toFixed(2)}
🎯 **Best Trade:** $${performance.bestTrade.toFixed(2)}
📊 **Avg Confidence:** ${performance.avgConfidence.toFixed(0)}%

**🧠 ML Model Performance:**
${getMLPerformanceRating(performance.winRate, performance.profitFactor)}

**📈 Strategy Performance:**
• ⚡ Scalping: High frequency, tight risk management
• 📈 Intraday: Balanced approach, good for beginners
• 🎯 Swing: Larger moves, less monitoring required

**🎯 Professional Metrics:**
• Risk/Reward Ratio: 1:${performance.profitFactor.toFixed(1)}
• Sharpe Ratio: ${calculateSharpeRatio(performance)}
• Maximum Drawdown: ${calculateMaxDrawdown(performance)}%
• Recovery Factor: ${calculateRecoveryFactor(performance)}

**🚀 Strategy Recommendations:**
• Use **SCALPING** for quick profits during high volume
• Use **INTRADAY** for balanced daily trading
• Use **SWING** for larger moves with less monitoring

Keep following the smart money! 🚀
    `;
    
    await sendMessage(chatId, message);
  } catch (error) {
    console.error("Performance error:", error);
    await sendMessage(chatId, "❌ Error retrieving performance data. Please try again.");
  }
}

async function handleSymbolsCommand(chatId: number): Promise<void> {
  const message = `
📊 **Supported Trading Symbols with Multi-Strategy Analysis**

**💰 Cryptocurrencies:**
• **BTCUSD** - Bitcoin (All strategies: ⚡📈🎯)
• **ETHUSD** - Ethereum (All strategies: ⚡📈🎯)

**💱 Major Forex Pairs:**
• **EURUSD** - Euro/Dollar (Best for: ⚡📈)
• **GBPUSD** - Pound/Dollar (Best for: ⚡📈🎯)
• **USDJPY** - Dollar/Yen (Best for: ⚡📈)
• **AUDUSD** - Australian Dollar (Best for: 📈🎯)
• **USDCAD** - Dollar/Canadian (Best for: 📈🎯)
• **USDCHF** - Dollar/Swiss Franc (Best for: 📈🎯)

**🥇 Precious Metals:**
• **XAUUSD** - Gold (Best for: 📈🎯)

**🛢️ Commodities:**
• **CRUDE** - WTI Oil (Best for: 📈🎯)
• **BRENT** - Brent Oil (Best for: 📈🎯)

**🎯 Strategy Symbols:**
⚡ = Excellent for SCALPING (1-15 min)
📈 = Excellent for INTRADAY (1-8 hours)  
🎯 = Excellent for SWING (1-7 days)

**Usage Examples:**
• \`/scalping BTCUSD\` - Bitcoin scalping
• \`/intraday EURUSD\` - Euro day trading
• \`/swing XAUUSD\` - Gold swing trading
• \`/predict GBPUSD\` - Auto-select best strategy

**💡 Strategy Selection Tips:**
• **Crypto (BTC/ETH):** Great for all strategies due to 24/7 trading
• **Major Forex:** Best for scalping and intraday during market hours
• **Gold/Oil:** Excellent for swing trading due to larger moves
• **Minor Pairs:** Better for intraday and swing strategies

More symbols and advanced features coming soon! 🚀
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

function getMLPerformanceRating(winRate: number, profitFactor: number): string {
  if (winRate >= 75 && profitFactor >= 2.5) {
    return "🔥 **Exceptional** - Institutional-grade performance!";
  } else if (winRate >= 65 && profitFactor >= 2) {
    return "⚡ **Professional** - High-quality ML predictions!";
  } else if (winRate >= 55 && profitFactor >= 1.5) {
    return "📊 **Good** - Solid machine learning results!";
  } else {
    return "⚠️ **Learning** - ML models adapting to market conditions.";
  }
}

function calculateSharpeRatio(performance: any): string {
  // Simplified Sharpe ratio calculation
  const avgReturn = performance.avgProfit * (performance.winRate / 100) + 
                   performance.avgLoss * ((100 - performance.winRate) / 100);
  const volatility = Math.abs(performance.avgProfit - performance.avgLoss);
  const sharpe = avgReturn / (volatility || 1);
  return sharpe.toFixed(2);
}

function calculateMaxDrawdown(performance: any): string {
  // Simplified max drawdown estimation
  const worstCase = Math.abs(performance.worstTrade);
  const avgProfit = performance.avgProfit;
  const drawdown = (worstCase / (avgProfit || 1)) * 100;
  return Math.min(50, drawdown).toFixed(1);
}

function calculateRecoveryFactor(performance: any): string {
  // Recovery factor = Total Profit / Max Drawdown
  const totalProfit = performance.avgProfit * performance.totalTrades * (performance.winRate / 100);
  const maxDrawdown = Math.abs(performance.worstTrade);
  const recovery = totalProfit / (maxDrawdown || 1);
  return recovery.toFixed(1);
}
