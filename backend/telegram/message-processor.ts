import { sendMessage } from "./telegram-client";
import { analysis } from "~encore/clients";

export async function processMessage(chatId: number, userId: number, text: string): Promise<void> {
  const command = text.toLowerCase().trim();

  if (command.startsWith("/predict")) {
    await handlePredictCommand(chatId, command);
  } else if (command.startsWith("/execute")) {
    await handleExecuteCommand(chatId, command);
  } else if (command === "/start") {
    await handleStartCommand(chatId);
  } else if (command === "/help") {
    await handleHelpCommand(chatId);
  }
}

async function handlePredictCommand(chatId: number, command: string): Promise<void> {
  const parts = command.split(" ");
  const symbol = parts[1]?.toUpperCase() || "BTCUSD";

  try {
    await sendMessage(chatId, `🔍 Analyzing ${symbol}... Please wait.`);
    
    const prediction = await analysis.predict({ symbol });
    
    const message = `
📊 **Trading Signal - ${prediction.symbol}**

🆔 Trade ID: \`${prediction.tradeId}\`
📈 Direction: **${prediction.direction}**
💰 Entry Price: ${prediction.entryPrice}
🎯 Take Profit: ${prediction.takeProfit}
🛡️ Stop Loss: ${prediction.stopLoss}
📊 Confidence: ${prediction.confidence}%

⚡ To execute: \`/execute ${prediction.tradeId} 0.1\`
    `;

    await sendMessage(chatId, message);

    // Send chart image if available
    if (prediction.chartUrl) {
      await sendPhoto(chatId, prediction.chartUrl, `Chart for ${symbol}`);
    }
  } catch (error) {
    console.error("Prediction error:", error);
    await sendMessage(chatId, "❌ Error generating prediction. Please try again.");
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

  try {
    await sendMessage(chatId, `⚡ Executing trade ${tradeId}...`);
    
    const result = await analysis.execute({ tradeId, lotSize });
    
    if (result.success) {
      const message = `
✅ **Trade Executed Successfully**

🆔 Trade ID: \`${tradeId}\`
📋 MT5 Order: #${result.orderId}
💰 Lot Size: ${lotSize}
💵 Entry Price: ${result.executionPrice}
      `;
      await sendMessage(chatId, message);
    } else {
      await sendMessage(chatId, `❌ Trade execution failed: ${result.error}`);
    }
  } catch (error) {
    console.error("Execution error:", error);
    await sendMessage(chatId, "❌ Error executing trade. Please try again.");
  }
}

async function handleStartCommand(chatId: number): Promise<void> {
  const message = `
🤖 **Welcome to AI Trading Bot**

I'm your intelligent trading assistant! Here's what I can do:

📊 **Analysis Commands:**
• \`/predict SYMBOL\` - Get AI trading signal
• \`/predict\` - Analyze BTCUSD (default)

⚡ **Execution Commands:**
• \`/execute TRADE_ID LOT_SIZE\` - Execute trade on MT5

📚 **Help:**
• \`/help\` - Show this help message

Let's start trading! 🚀
  `;
  
  await sendMessage(chatId, message);
}

async function handleHelpCommand(chatId: number): Promise<void> {
  const message = `
📚 **AI Trading Bot Help**

**Available Commands:**

🔍 **Analysis:**
• \`/predict BTCUSD\` - Analyze Bitcoin
• \`/predict EURUSD\` - Analyze Euro/Dollar
• \`/predict XAUUSD\` - Analyze Gold

⚡ **Execution:**
• \`/execute BTC-001 0.1\` - Execute with 0.1 lots
• \`/execute EUR-002 0.05\` - Execute with 0.05 lots

📊 **Features:**
• Multi-timeframe analysis (5m, 15m, 30m)
• AI-powered predictions
• Real-time chart generation
• Direct MT5 execution
• Risk management with SL/TP

Need help? Contact support! 💬
  `;
  
  await sendMessage(chatId, message);
}

async function sendPhoto(chatId: number, photoUrl: string, caption: string): Promise<void> {
  // This would be implemented in telegram-client.ts
  // For now, we'll just send a message with the chart URL
  await sendMessage(chatId, `📊 Chart: ${photoUrl}`);
}
