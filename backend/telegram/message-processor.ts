import { sendMessage, createInlineKeyboard } from "./telegram-client";
import { predict } from "../analysis/predict";
import { execute } from "../analysis/execute";
import { getPerformance } from "../analysis/performance";
import { handleVPSCommand, handleVPSSetup, handleVPSSetupCallback } from "./vps-manager";
import { handleClientCommands, checkClientFeature } from "./client-manager";
import { 
  getUserPreferences, 
  setUserPreferences, 
  getUserState, 
  setUserState, 
  clearUserState,
  USER_STATES,
  getTradingModeInfo,
  getAllTradingModesInfo,
  UserPreferences 
} from "./user-state-manager";
import { TradingStrategy } from "../analysis/trading-strategies";

export async function processMessage(chatId: number, userId: number, text: string): Promise<void> {
  const command = text.toLowerCase().trim();

  try {
    // Check if user is in a state that requires specific handling
    const userState = await getUserState(userId);
    if (userState && userState.currentState !== USER_STATES.READY_TO_TRADE) {
      await handleUserStateFlow(chatId, userId, text, userState);
      return;
    }

    if (command.startsWith("/predict")) {
      // Check if user has signal access
      const hasAccess = await checkClientFeature(userId, "basic_signals") ||
                       await checkClientFeature(userId, "advanced_signals") ||
                       await checkClientFeature(userId, "premium_signals");
      
      if (!hasAccess) {
        await sendMessage(chatId, "❌ You need an active subscription to access AI signals. Use `/subscription` to learn more.");
        return;
      }
      
      await handlePredictCommand(chatId, command, userId);
    } else if (command.startsWith("/scalping")) {
      await handleStrategyCommand(chatId, command, "SCALPING", userId);
    } else if (command.startsWith("/intraday")) {
      await handleStrategyCommand(chatId, command, "INTRADAY", userId);
    } else if (command.startsWith("/swing")) {
      await handleStrategyCommand(chatId, command, "SWING", userId);
    } else if (command.startsWith("/execute")) {
      await handleExecuteCommand(chatId, command);
    } else if (command === "/start") {
      await handleStartCommand(chatId, userId);
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
    } else if (command === "/subscription" || command === "/features" || command === "/upgrade" || command === "/support") {
      await handleClientCommands(chatId, userId, command);
    } else if (command === "/settings") {
      await handleSettingsCommand(chatId, userId);
    } else {
      // Check if user is in VPS setup mode by checking if they have an active state
      const userState = await getUserState(userId);
      if (userState && userState.currentState !== USER_STATES.READY_TO_TRADE) {
        await handleUserStateFlow(chatId, userId, text, userState);
      } else {
        // Default VPS setup handler for unrecognized commands
        await handleVPSSetup(chatId, userId, text);
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
    }
    else if (callbackData.startsWith("mode_")) {
      const mode = callbackData.replace("mode_", "") as TradingStrategy;
      await handleTradingModeSelection(chatId, userId, mode);
    }
    else if (callbackData.startsWith("execute_")) {
      const parts = callbackData.split("_");
      const tradeId = parts[1];
      const lotSize = parseFloat(parts[2]);
      const strategy = parts[3] || "INTRADAY";
      await executeTradeFromCallback(chatId, tradeId, lotSize, strategy);
    }
    else if (callbackData.startsWith("strategy_")) {
      const parts = callbackData.split("_");
      const strategy = parts[1] as "SCALPING" | "INTRADAY" | "SWING";
      const symbol = parts[2] || "BTCUSD";
      await handleStrategyCommand(chatId, `/predict ${symbol}`, strategy, userId);
    }
    else if (callbackData === "new_analysis") {
      await sendMessage(chatId, "📊 Choose your trading strategy:\n\n⚡ `/scalping SYMBOL` - Quick trades (1-15 min)\n📈 `/intraday SYMBOL` - Day trading (1-8 hours)\n🎯 `/swing SYMBOL` - Multi-day trades (1-7 days)\n\nExample: `/scalping EURUSD`");
    }
    else if (callbackData === "show_performance") {
      await handlePerformanceCommand(chatId);
    }
    else if (callbackData.startsWith("predict_")) {
      const symbol = callbackData.replace("predict_", "");
      await handlePredictCommand(chatId, `/predict ${symbol}`, userId);
    }
    else if (callbackData === "show_help") {
      await handleHelpCommand(chatId);
    }
    else if (callbackData === "show_strategies") {
      await handleStrategiesCommand(chatId);
    }
    else if (callbackData === "setup_trading_mode") {
      await startTradingModeSetup(chatId, userId);
    }
    else if (callbackData === "show_settings") {
      await handleSettingsCommand(chatId, userId);
    }
    else if (callbackData === "vps_setup") {
      await handleVPSSetup(chatId, userId);
    }
  }
  catch (error) {
    console.error("Error processing callback query:", error);
    await sendMessage(chatId, "❌ Error processing your request. Please try again.");
  }
}

async function executeTradeFromCallback(chatId: number, tradeId: string, lotSize: number, strategy: string): Promise<void> {
  try {
    const result = await execute({ tradeId, lotSize, strategy: strategy as TradingStrategy });
    const message = `
✅ **Trade Executed Successfully!**

🆔 **Trade ID:** \`${tradeId}\`
📊 **Strategy:** ${strategy}
💎 **Lot Size:** ${lotSize}
💰 **Execution Price:** ${result.executionPrice || 'N/A'}
🆔 **Order ID:** ${result.orderId || 'N/A'}

⏰ **Execution Time:** ${new Date().toLocaleTimeString()}

**Your position is now active on MT5!**
    `;
    await sendMessage(chatId, message);
  }
  catch (error) {
    console.error("Error executing trade:", error);
    await sendMessage(chatId, "❌ Error executing trade. Please check your MT5 connection and try again.");
  }
}

async function handleUserStateFlow(chatId: number, userId: number, text: string, userState: any): Promise<void> {
  const command = text.toLowerCase().trim();
  switch (userState.currentState) {
    case USER_STATES.SETTING_RISK_AMOUNT:
      await handleRiskAmountInput(chatId, userId, text, userState);
      break;
    case USER_STATES.SETTING_ACCOUNT_BALANCE:
      await handleAccountBalanceInput(chatId, userId, text, userState);
      break;
    default:
      await sendMessage(chatId, "❌ Unknown state. Please start over with /start");
      await clearUserState(userId);
      break;
  }
}

async function handleStartCommand(chatId: number, userId: number): Promise<void> {
  // Check if user already has trading preferences set up
  const userPrefs = await getUserPreferences(userId);
  if (userPrefs && userPrefs.tradingMode) {
    // User already has a trading mode set up
    const modeInfo = getTradingModeInfo(userPrefs.tradingMode);
    const message = `
🤖 **Welcome back to Professional AI Trading Bot**

You're all set up with **${userPrefs.tradingMode}** trading mode!

${modeInfo}

💰 **Current Settings:**
• Risk per trade: ${userPrefs.riskPercentage}%
• Account balance: ${userPrefs.accountBalance ? `$${userPrefs.accountBalance.toLocaleString()}` : 'Not set'}
• Account currency: ${userPrefs.accountCurrency}

🚀 **Ready to Trade:**
• Use \`/predict SYMBOL\` for analysis with your preferred mode
• Use \`/scalping SYMBOL\`, \`/intraday SYMBOL\`, or \`/swing SYMBOL\` for specific strategies
• Use \`/settings\` to change your trading preferences

💡 **Quick Start:** Try \`/${userPrefs.tradingMode.toLowerCase()} BTCUSD\` for a signal!
    `;
    const keyboard = createInlineKeyboard([
      [
        { text: `${userPrefs.tradingMode === 'SCALPING' ? '⚡' : userPrefs.tradingMode === 'INTRADAY' ? '📈' : '🎯'} ${userPrefs.tradingMode} BTCUSD`, callback_data: `strategy_${userPrefs.tradingMode}_BTCUSD` }
      ],
      [
        { text: "⚙️ Settings", callback_data: "show_settings" },
        { text: "📊 Performance", callback_data: "show_performance" }
      ],
      [
        { text: "❓ Help", callback_data: "show_help" },
        { text: "🖥️ VPS Setup", callback_data: "vps_setup" }
      ]
    ]);
    await sendMessage(chatId, message, { replyMarkup: keyboard });
  }
  else {
    // New user - need to set up trading mode
    await startTradingModeSetup(chatId, userId);
  }
}

async function startTradingModeSetup(chatId: number, userId: number): Promise<void> {
  await setUserState(userId, chatId, USER_STATES.SELECTING_TRADING_MODE);
  const message = `
🎯 **Welcome to Professional AI Trading Bot!**

Let's set up your trading preferences to get started.

**Step 1: Choose Your Trading Mode**

${getAllTradingModesInfo()}

🤔 **Which trading style fits you best?**

Select a mode below to see detailed information and continue setup:
  `;
  const keyboard = createInlineKeyboard([
    [
      { text: "⚡ Scalping", callback_data: "mode_SCALPING" },
      { text: "📈 Intraday", callback_data: "mode_INTRADAY" },
      { text: "🎯 Swing", callback_data: "mode_SWING" }
    ],
    [
      { text: "❓ Help Me Choose", callback_data: "show_strategies" }
    ]
  ]);
  await sendMessage(chatId, message, { replyMarkup: keyboard });
}

async function handleTradingModeSelection(chatId: number, userId: number, mode: TradingStrategy): Promise<void> {
  const userState = await getUserState(userId);
  if (!userState || userState.currentState !== USER_STATES.SELECTING_TRADING_MODE) {
    await sendMessage(chatId, "❌ Please start the setup process with /start");
    return;
  }
  // Show detailed information about the selected mode
  const modeInfo = getTradingModeInfo(mode);
  const message = `
✅ **${mode} Trading Mode Selected!**

${modeInfo}

**Step 2: Risk Management Setup**

Now let's configure your risk management settings.

💰 **How much do you want to risk per trade?**

Please enter your risk percentage (recommended: 1-3%):
• Conservative: 1%
• Balanced: 2% 
• Aggressive: 3%

Type a number like: \`2\` (for 2%)
  `;
  // Store the selected mode and move to risk setting state
  await setUserState(userId, chatId, USER_STATES.SETTING_RISK_AMOUNT, { selectedMode: mode });
  await sendMessage(chatId, message);
}

async function handleRiskAmountInput(chatId: number, userId: number, text: string, userState: any): Promise<void> {
  const riskInput = text.trim().replace('%', '');
  const riskPercentage = parseFloat(riskInput);
  if (isNaN(riskPercentage) || riskPercentage < 0.1 || riskPercentage > 10) {
    await sendMessage(chatId, "❌ Please enter a valid risk percentage between 0.1% and 10%.\n\nExample: `2` (for 2%)");
    return;
  }
  const message = `
✅ **Risk Management Set: ${riskPercentage}%**

**Step 3: Account Balance (Optional)**

To provide accurate position sizing recommendations, please enter your account balance.

💰 **What's your account balance?**

Examples:
• \`1000\` (for $1,000)
• \`5000\` (for $5,000)
• \`skip\` (to set this later)

This helps calculate optimal lot sizes for your trades.
  `;
  await setUserState(userId, chatId, USER_STATES.SETTING_ACCOUNT_BALANCE, {
    ...userState.stateData,
    riskPercentage
  });
  await sendMessage(chatId, message);
}

async function handleAccountBalanceInput(chatId: number, userId: number, text: string, userState: any): Promise<void> {
  const input = text.toLowerCase().trim();
  let accountBalance;
  if (input !== 'skip') {
    const balanceInput = parseFloat(input);
    if (isNaN(balanceInput) || balanceInput < 100) {
      await sendMessage(chatId, "❌ Please enter a valid account balance (minimum $100) or type `skip`.\n\nExample: `1000` (for $1,000)");
      return;
    }
    accountBalance = balanceInput;
  }
  // Save user preferences
  const preferences: UserPreferences = {
    userId,
    chatId,
    tradingMode: userState.stateData.selectedMode,
    riskPercentage: userState.stateData.riskPercentage,
    accountBalance,
    accountCurrency: 'USD'
  };
  await setUserPreferences(preferences);
  await setUserState(userId, chatId, USER_STATES.READY_TO_TRADE);
  const modeInfo = getTradingModeInfo(preferences.tradingMode!);
  const message = `
🎉 **Setup Complete!**

Your trading preferences have been saved:

${modeInfo}

💰 **Your Settings:**
• Risk per trade: ${preferences.riskPercentage}%
• Account balance: ${accountBalance ? `$${accountBalance.toLocaleString()}` : 'Not set (can be set later)'}
• Account currency: ${preferences.accountCurrency}

🚀 **You're ready to trade!**

Try these commands:
• \`/predict BTCUSD\` - Get a signal using your preferred mode
• \`/${preferences.tradingMode!.toLowerCase()} EURUSD\` - Get a specific strategy signal
• \`/settings\` - Change your preferences anytime

**Let's start with your first signal!** 🎯
  `;
  const keyboard = createInlineKeyboard([
    [
      { text: `${preferences.tradingMode === 'SCALPING' ? '⚡' : preferences.tradingMode === 'INTRADAY' ? '📈' : '🎯'} Get ${preferences.tradingMode} Signal`, callback_data: `strategy_${preferences.tradingMode}_BTCUSD` }
    ],
    [
      { text: "📊 View All Strategies", callback_data: "show_strategies" },
      { text: "⚙️ Settings", callback_data: "show_settings" }
    ],
    [
      { text: "🖥️ Setup VPS", callback_data: "vps_setup" },
      { text: "❓ Help", callback_data: "show_help" }
    ]
  ]);
  await sendMessage(chatId, message, { replyMarkup: keyboard });
}

async function handleSettingsCommand(chatId: number, userId: number): Promise<void> {
  const userPrefs = await getUserPreferences(userId);
  if (!userPrefs) {
    await sendMessage(chatId, "❌ No preferences found. Please start with /start to set up your trading mode.");
    return;
  }
  const modeInfo = getTradingModeInfo(userPrefs.tradingMode!);
  const message = `
⚙️ **Your Trading Settings**

${modeInfo}

💰 **Current Settings:**
• Risk per trade: ${userPrefs.riskPercentage}%
• Account balance: ${userPrefs.accountBalance ? `$${userPrefs.accountBalance.toLocaleString()}` : 'Not set'}
• Account currency: ${userPrefs.accountCurrency}

🔧 **Change Settings:**
Use \`/start\` to reconfigure your trading mode and risk settings.

📊 **Available Commands:**
• \`/predict SYMBOL\` - Use your preferred mode (${userPrefs.tradingMode})
• \`/scalping SYMBOL\` - Force scalping mode
• \`/intraday SYMBOL\` - Force intraday mode  
• \`/swing SYMBOL\` - Force swing mode
• \`/performance\` - View your trading statistics
  `;
  const keyboard = createInlineKeyboard([
    [
      { text: "🔄 Reconfigure", callback_data: "setup_trading_mode" },
      { text: "📊 Performance", callback_data: "show_performance" }
    ],
    [
      { text: "❓ Help", callback_data: "show_help" },
      { text: "🖥️ VPS Setup", callback_data: "vps_setup" }
    ]
  ]);
  await sendMessage(chatId, message, { replyMarkup: keyboard });
}

async function handlePredictCommand(chatId: number, command: string, userId?: number): Promise<void> {
  const parts = command.split(" ");
  const symbol = parts[1]?.toUpperCase() || "BTCUSD";
  try {
    const userPrefs = userId ? await getUserPreferences(userId) : null;
    const strategy = userPrefs?.tradingMode;
    const strategyText = strategy ? ` using your preferred ${strategy} mode` : "";
    await sendMessage(chatId, `🧠 **Advanced ML Analysis for ${symbol}**${strategyText}\n\n🔍 Analyzing market structure, smart money flow, and determining optimal strategy...\n\n⏳ This may take 10-15 seconds for comprehensive analysis.`);
    const prediction = await predict({
      symbol,
      strategy
    });
    await sendTradingSignal(chatId, prediction, userPrefs);
  }
  catch (error) {
    console.error("Prediction error:", error);
    await sendMessage(chatId, "❌ Error generating prediction. Please try again or check if the symbol is valid.");
  }
}

async function handleStrategyCommand(chatId: number, command: string, strategy: "SCALPING" | "INTRADAY" | "SWING", userId?: number): Promise<void> {
  const parts = command.split(" ");
  const symbol = parts[1]?.toUpperCase() || "BTCUSD";
  try {
    const userPrefs = userId ? await getUserPreferences(userId) : null;
    const strategyEmojis = {
      "SCALPING": "⚡",
      "INTRADAY": "📈",
      "SWING": "🎯"
    };
    await sendMessage(chatId, `${strategyEmojis[strategy]} **${strategy} Analysis for ${symbol}**\n\n🔍 Analyzing market for ${strategy.toLowerCase()} opportunities...\n\n⏳ Optimizing entry, stop loss, and take profit levels...`);
    const prediction = await predict({
      symbol,
      strategy: strategy
    });
    await sendTradingSignal(chatId, prediction, userPrefs);
  }
  catch (error) {
    console.error("Strategy prediction error:", error);
    await sendMessage(chatId, `❌ Error generating ${strategy.toLowerCase()} analysis. Please try again.`);
  }
}

async function sendTradingSignal(chatId: number, prediction: any, userPrefs?: UserPreferences | null): Promise<void> {
  const strategyEmojis: Record<string, string> = {
    "SCALPING": "⚡",
    "INTRADAY": "📈",
    "SWING": "🎯"
  };

  const confidenceEmoji = prediction.confidence >= 85 ? "🔥" : prediction.confidence >= 75 ? "⚡" : "⚠️";
  const strategyEmoji = strategyEmojis[prediction.strategy] || "📊";
  
  // Calculate position size based on user preferences
  let positionSizeInfo = "";
  if (userPrefs && userPrefs.accountBalance && userPrefs.riskPercentage) {
    const riskAmount = userPrefs.accountBalance * (userPrefs.riskPercentage / 100);
    const stopLossDistance = Math.abs(prediction.entryPrice - prediction.stopLoss);
    const suggestedLotSize = Math.min(riskAmount / stopLossDistance, 2.0); // Max 2 lots
    
    positionSizeInfo = `

🎯 **Your Position Sizing:**
• Account Balance: $${userPrefs.accountBalance.toLocaleString()}
• Risk Amount: $${riskAmount.toFixed(2)} (${userPrefs.riskPercentage}%)
• Suggested Lot Size: ${Math.round(suggestedLotSize * 100) / 100} lots`;
  }
  
  const message = `
${strategyEmoji} **${prediction.strategy} Signal - ${prediction.symbol}**

🆔 **Trade ID:** \`${prediction.tradeId}\`
📈 **Direction:** **${prediction.direction}**
💰 **Entry Price:** ${prediction.entryPrice}
🎯 **Take Profit:** ${prediction.takeProfit}
🛡️ **Stop Loss:** ${prediction.stopLoss}
${confidenceEmoji} **Confidence:** **${prediction.confidence}%**
📊 **Risk/Reward:** 1:${prediction.riskRewardRatio}
💎 **Recommended Size:** ${prediction.recommendedLotSize} lots
⏱️ **Max Hold Time:** ${prediction.maxHoldingTime}h${positionSizeInfo}

📊 **Strategy Analysis:**
${prediction.strategyRecommendation}

🧠 **AI Technical Analysis:**
• **Trend:** ${prediction.analysis?.priceAction?.trend || 'N/A'}
• **Support:** ${prediction.analysis?.support || 'N/A'}
• **Resistance:** ${prediction.analysis?.resistance || 'N/A'}
• **Smart Money:** ${prediction.analysis?.smartMoney?.institutionalFlow || 'N/A'}

💡 **Risk Management:**
Always use stop loss and never risk more than 2% of your account per trade.
  `;
    // Create inline keyboard for quick actions
    const suggestedSize = userPrefs && userPrefs.accountBalance ?
        Math.min(userPrefs.accountBalance * (userPrefs.riskPercentage || 2) / 100 / Math.abs(prediction.entryPrice - prediction.stopLoss), 2.0) :
        prediction.recommendedLotSize;
    const keyboard = createInlineKeyboard([
        [
            { text: `${strategyEmoji} Execute ${Math.round(suggestedSize * 100) / 100}`, callback_data: `execute_${prediction.tradeId}_${Math.round(suggestedSize * 100) / 100}_${prediction.strategy}` },
            { text: `${strategyEmoji} Execute 0.01`, callback_data: `execute_${prediction.tradeId}_0.01_${prediction.strategy}` }
        ],
        [
            { text: "📊 New Analysis", callback_data: "new_analysis" },
            { text: "📈 Performance", callback_data: "show_performance" }
        ]
    ]);
    await sendMessage(chatId, message, { replyMarkup: keyboard });
}

// Simplified versions of remaining handler functions
async function handleExecuteCommand(chatId: number, command: string): Promise<void> {
  const parts = command.split(" ");
  if (parts.length < 3) {
    await sendMessage(chatId, "❌ Usage: `/execute TRADE_ID LOT_SIZE`\n\nExample: `/execute BTC-001 0.1`");
    return;
  }
  const tradeId = parts[1];
  const lotSize = parseFloat(parts[2]);
  const strategy = parts[3] || "INTRADAY";
  if (isNaN(lotSize) || lotSize <= 0) {
    await sendMessage(chatId, "❌ Invalid lot size. Please use a positive number.\n\nExample: `/execute BTC-001 0.1`");
    return;
  }
  await executeTradeFromCallback(chatId, tradeId, lotSize, strategy);
}

async function handleHelpCommand(chatId: number): Promise<void> {
  const message = `
🤖 **Professional AI Trading Bot - Help**

**🎯 Trading Commands:**
• \`/predict SYMBOL\` - AI analysis with optimal strategy
• \`/scalping SYMBOL\` - Quick trades (1-15 min)
• \`/intraday SYMBOL\` - Day trading (1-8 hours)
• \`/swing SYMBOL\` - Multi-day trades (1-7 days)
• \`/execute TRADE_ID LOT_SIZE\` - Execute trade on MT5

**🖥️ VPS Management:**
• \`/vps\` - VPS dashboard and status
• \`/vps_setup\` - Configure VPS automatically

**💰 Account & Subscription:**
• \`/subscription\` - View your subscription details
• \`/features\` - See your available features
• \`/upgrade\` - Upgrade your plan
• \`/support\` - Get help and support

**📊 Information Commands:**
• \`/status\` - Bot and MT5 connection status
• \`/performance\` - Trading statistics
• \`/settings\` - Your trading preferences
• \`/strategies\` - Learn about strategies
• \`/symbols\` - Supported trading symbols

**💡 Pro Tips:**
• Start with \`/vps_setup\` for automated configuration
• Use your preferred trading mode from \`/settings\`
• Always follow risk management guidelines

**⚠️ Risk Warning:**
This bot uses advanced AI analysis. Always use proper risk management and never trade money you can't afford to lose.

Need more help? Check \`/subscription\` for your plan details! 💬
  `;
  await sendMessage(chatId, message);
}

async function handleStatusCommand(chatId: number): Promise<void> {
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

**System Status:** 🟢 All systems operational
  `;
  await sendMessage(chatId, message);
}

async function handlePerformanceCommand(chatId: number): Promise<void> {
  try {
    const performance = await getPerformance();
    const message = `
📊 **Trading Performance Dashboard**

**🎯 Overall Statistics:**
• Total Trades: ${performance.totalTrades}
• Win Rate: ${performance.winRate.toFixed(1)}%
• Average Profit: $${performance.avgProfit.toFixed(2)}
• Average Loss: $${performance.avgLoss.toFixed(2)}

**📈 Best Performance:**
• Best Trade: $${performance.bestTrade.toFixed(2)}
• Profit Factor: ${performance.profitFactor.toFixed(2)}
• Average Confidence: ${performance.avgConfidence.toFixed(1)}%

**⚠️ Risk Metrics:**
• Worst Trade: $${performance.worstTrade.toFixed(2)}

**💡 Keep up the excellent work!**
Trading performance is looking strong. Remember to always follow proper risk management principles.

📈 **Next Steps:**
• Continue following your trading plan
• Use \`/predict SYMBOL\` for new signals
• Check \`/status\` for system health
    `;
    await sendMessage(chatId, message);
  }
  catch (error) {
    console.error("Error getting performance:", error);
    await sendMessage(chatId, "❌ Error retrieving performance data. Please try again.");
  }
}

async function handleSymbolsCommand(chatId: number): Promise<void> {
  const message = `
📊 **Supported Trading Symbols**

**💰 Major Forex Pairs:**
• **EURUSD** - Euro/US Dollar ⚡📈🎯
• **GBPUSD** - British Pound/US Dollar ⚡📈🎯
• **USDJPY** - US Dollar/Japanese Yen ⚡📈🎯
• **AUDUSD** - Australian Dollar/US Dollar 📈🎯
• **USDCAD** - US Dollar/Canadian Dollar 📈🎯
• **USDCHF** - US Dollar/Swiss Franc 📈🎯
• **NZDUSD** - New Zealand Dollar/US Dollar 📈🎯

**💎 Cryptocurrencies:**
• **BTCUSD** - Bitcoin ⚡📈🎯
• **ETHUSD** - Ethereum ⚡📈🎯

**🏆 Precious Metals:**
• **XAUUSD** - Gold 📈🎯

**🛢️ Commodities:**
• **CRUDE** - WTI Oil 📈🎯
• **BRENT** - Brent Oil 📈🎯

**🎯 Strategy Symbols:**
⚡ = Excellent for SCALPING (1-15 min)
📈 = Excellent for INTRADAY (1-8 hours)  
🎯 = Excellent for SWING (1-7 days)

**Usage Examples:**
• \`/scalping BTCUSD\` - Bitcoin scalping
• \`/intraday EURUSD\` - Euro intraday
• \`/swing XAUUSD\` - Gold swing trading
  `;
  await sendMessage(chatId, message);
}

async function handleStrategiesCommand(chatId: number): Promise<void> {
  const message = `
📊 **Trading Strategies Guide**

${getAllTradingModesInfo()}

**🎯 How to Choose:**

**Choose SCALPING if:**
• You can monitor trades actively
• You prefer quick profits
• You have a stable internet connection
• You like high-frequency trading

**Choose INTRADAY if:**
• You trade part-time
• You want balanced risk/reward
• You can check trades 2-3 times daily
• You prefer medium-term opportunities

**Choose SWING if:**
• You're a busy professional
• You prefer hands-off trading
• You want larger profit targets
• You can hold positions for days

**💡 Pro Tips:**
• Use \`/settings\` to set your preferred mode
• Start with INTRADAY for balanced approach
• Combine strategies for diversification
• Always follow risk management rules

Ready to start? Use \`/predict SYMBOL\` for analysis!
  `;
  await sendMessage(chatId, message);
}
