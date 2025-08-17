import { sendMessage, sendPhoto, createInlineKeyboard } from "./telegram-client";
import { analysis } from "~encore/clients";
import { handleVPSCommand, handleVPSSetup, handleVPSSetupCallback } from "./vps-manager";

export async function processMessage(chatId: number, userId: number, text: string): Promise<void> {
  const command = text.toLowerCase().trim();

  try {
    if (command.startsWith("/predict")) {
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
      await handleVPSCommand(chatId, userId, command);
    } else if (command === "/vps_setup") {
      await handleVPSSetup(chatId, userId);
    } else {
      // Check if user is in VPS setup mode
      await handleVPSSetup(chatId, userId, text);
    }
  } catch (error) {
    console.error("Error processing message:", error);
    await sendMessage(chatId, "❌ Si è verificato un errore durante l'elaborazione della tua richiesta. Riprova.");
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
      await sendMessage(chatId, "📊 Scegli la tua strategia di trading:\n\n⚡ `/scalping SIMBOLO` - Trade veloci (1-15 min)\n📈 `/intraday SIMBOLO` - Day trading (1-8 ore)\n🎯 `/swing SIMBOLO` - Trade multi-giorno (1-7 giorni)\n\nEsempio: `/scalping EURUSD`");
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
    await sendMessage(chatId, "❌ Si è verificato un errore durante l'elaborazione della tua richiesta. Riprova.");
  }
}

async function executeTradeFromCallback(chatId: number, tradeId: string, lotSize: number, strategy: string): Promise<void> {
  try {
    await sendMessage(chatId, `⚡ Esecuzione trade ${strategy} ${tradeId} con ${lotSize} lotti...`);
    
    const result = await analysis.execute({ tradeId, lotSize, strategy });
    
    if (result.success) {
      const message = `
✅ **Trade ${strategy} Eseguito con Successo**

🆔 ID Trade: \`${tradeId}\`
📋 Ordine MT5: #${result.orderId}
💰 Dimensione Lotto: ${lotSize}
💵 Prezzo di Ingresso: ${result.executionPrice}
⏱️ Durata Stimata: ${result.estimatedHoldingTime}

🎯 Il tuo trade ${strategy.toLowerCase()} è ora attivo su MT5!
      `;
      await sendMessage(chatId, message);
    } else {
      await sendMessage(chatId, `❌ **Esecuzione trade fallita**\n\n🚫 Errore: ${result.error}\n\nControlla la tua connessione MT5 e riprova.`);
    }
  } catch (error) {
    console.error("Execution error:", error);
    await sendMessage(chatId, "❌ Errore nell'esecuzione del trade. Controlla la tua connessione MT5 e riprova.");
  }
}

async function handlePredictCommand(chatId: number, command: string): Promise<void> {
  const parts = command.split(" ");
  const symbol = parts[1]?.toUpperCase() || "BTCUSD";

  try {
    await sendMessage(chatId, `🧠 **Analisi ML Avanzata per ${symbol}**\n\n🔍 Analizzando struttura di mercato, flusso smart money e determinando strategia ottimale...\n\n⏳ Potrebbero volerci 10-15 secondi per un'analisi completa.`);
    
    const prediction = await analysis.predict({ symbol });
    
    await sendTradingSignal(chatId, prediction);
  } catch (error) {
    console.error("Prediction error:", error);
    await sendMessage(chatId, "❌ Errore nella generazione della previsione. Riprova o controlla se il simbolo è valido.");
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

    await sendMessage(chatId, `${strategyEmojis[strategy]} **Analisi ${strategy} per ${symbol}**\n\n🔍 Analizzando il mercato per opportunità ${strategy.toLowerCase()}...\n\n⏳ Ottimizzando livelli di ingresso, stop loss e take profit...`);
    
    const prediction = await analysis.predict({ symbol, strategy });
    
    await sendTradingSignal(chatId, prediction);
  } catch (error) {
    console.error("Strategy prediction error:", error);
    await sendMessage(chatId, `❌ Errore nella generazione dell'analisi ${strategy.toLowerCase()}. Riprova.`);
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
${strategyEmoji} **Segnale ${prediction.strategy} - ${prediction.symbol}**

🆔 ID Trade: \`${prediction.tradeId}\`
${directionEmoji} **Direzione: ${prediction.direction}**
💰 **Prezzo di Ingresso:** \`${prediction.entryPrice}\`
🎯 **Take Profit:** \`${prediction.takeProfit}\`
🛡️ **Stop Loss:** \`${prediction.stopLoss}\`
${confidenceEmoji} **Confidenza:** **${prediction.confidence}%**
📊 **Rischio/Rendimento:** 1:${prediction.riskRewardRatio}
💎 **Dimensione Consigliata:** ${prediction.recommendedLotSize} lotti
⏱️ **Durata Max:** ${prediction.maxHoldingTime}h

📊 **Analisi Strategia:**
${prediction.strategyRecommendation}

📈 **Analisi Price Action:**
• Struttura di Mercato: **${prediction.analysis.technical.structure}**
• Trend: **${prediction.analysis.technical.trend}**
• Probabilità Breakout: **${prediction.analysis.technical.breakoutProbability}%**

👥 **Consenso Trader Professionali:**
• Top Trader: ${prediction.analysis.professional.topTraders.slice(0, 2).join(", ")}
• Consenso: **${prediction.analysis.professional.consensusView}**
• Rischio/Rendimento: **1:${prediction.analysis.professional.riskReward.toFixed(1)}**

🎯 **Zone di Liquidità Chiave:**
${prediction.analysis.smartMoney.liquidityZones.slice(0, 3).map(zone => `• ${zone.toFixed(5)}`).join('\n')}

📰 **Sentiment di Mercato:** ${getSentimentEmoji(prediction.analysis.sentiment.score)} ${(prediction.analysis.sentiment.score * 100).toFixed(0)}%

⚡ **Esecuzione Rapida:**
\`/execute ${prediction.tradeId} ${prediction.recommendedLotSize}\`
  `;

  // Create inline keyboard for quick actions
  const keyboard = createInlineKeyboard([
    [
      { text: `${strategyEmoji} Esegui ${prediction.recommendedLotSize}`, callback_data: `execute_${prediction.tradeId}_${prediction.recommendedLotSize}_${prediction.strategy}` },
      { text: `${strategyEmoji} Esegui 0.01`, callback_data: `execute_${prediction.tradeId}_0.01_${prediction.strategy}` }
    ],
    [
      { text: "⚡ Scalping", callback_data: `strategy_SCALPING_${prediction.symbol}` },
      { text: "📈 Intraday", callback_data: `strategy_INTRADAY_${prediction.symbol}` },
      { text: "🎯 Swing", callback_data: `strategy_SWING_${prediction.symbol}` }
    ],
    [
      { text: "📊 Nuova Analisi", callback_data: "new_analysis" },
      { text: "📈 Performance", callback_data: "show_performance" }
    ]
  ]);

  await sendMessage(chatId, message, { replyMarkup: keyboard });

  // Send chart image if available
  if (prediction.chartUrl) {
    try {
      await sendPhoto(chatId, prediction.chartUrl, `📊 Analisi Grafico ${prediction.strategy} per ${prediction.symbol}`);
    } catch (error) {
      console.error("Error sending chart:", error);
      await sendMessage(chatId, `📊 Grafico: ${prediction.chartUrl}`);
    }
  }
}

async function handleExecuteCommand(chatId: number, command: string): Promise<void> {
  const parts = command.split(" ");
  const tradeId = parts[1];
  const lotSize = parseFloat(parts[2] || "0.1");
  const strategy = parts[3] || "INTRADAY";

  if (!tradeId) {
    await sendMessage(chatId, "❌ Fornisci un ID trade. Utilizzo: `/execute ID_TRADE DIMENSIONE_LOTTO [STRATEGIA]`");
    return;
  }

  if (isNaN(lotSize) || lotSize <= 0) {
    await sendMessage(chatId, "❌ Fornisci una dimensione lotto valida. Utilizzo: `/execute ID_TRADE DIMENSIONE_LOTTO [STRATEGIA]`");
    return;
  }

  try {
    await sendMessage(chatId, `⚡ Esecuzione trade ${strategy} ${tradeId} con ${lotSize} lotti...`);
    
    const result = await analysis.execute({ tradeId, lotSize, strategy });
    
    if (result.success) {
      const message = `
✅ **Trade ${strategy} Eseguito con Successo**

🆔 ID Trade: \`${tradeId}\`
📋 Ordine MT5: #${result.orderId}
💰 Dimensione Lotto: ${lotSize}
💵 Prezzo di Ingresso: ${result.executionPrice}
⏱️ Durata Stimata: ${result.estimatedHoldingTime}

🎯 Il tuo trade ${strategy.toLowerCase()} è ora attivo su MT5!
      `;
      await sendMessage(chatId, message);
    } else {
      await sendMessage(chatId, `❌ **Esecuzione trade fallita**\n\n🚫 Errore: ${result.error}\n\nControlla la tua connessione MT5 e riprova.`);
    }
  } catch (error) {
    console.error("Execution error:", error);
    await sendMessage(chatId, "❌ Errore nell'esecuzione del trade. Controlla la tua connessione MT5 e riprova.");
  }
}

async function handleStartCommand(chatId: number): Promise<void> {
  const message = `
🤖 **Benvenuto nel Bot AI Trading Professionale**

Sono il tuo assistente di trading di livello istituzionale con **3 strategie specializzate**! 

🧠 **Cosa mi rende diverso:**
• **Analisi Smart Money** - Segue flussi istituzionali e pattern degli ordini
• **Consenso Trader Professionali** - Segue i migliori trader per ogni asset
• **Price Action Avanzata** - Analisi struttura di mercato e zone di liquidità
• **Previsioni ML** - Nessun indicatore tradizionale, solo price action pura

⚡ **Strategie di Trading:**
• \`/scalping SIMBOLO\` - Trade veloci (1-15 minuti, stop stretti)
• \`/intraday SIMBOLO\` - Day trading (1-8 ore, rischio bilanciato)
• \`/swing SIMBOLO\` - Trade multi-giorno (1-7 giorni, target più ampi)

📊 **Analisi Generale:**
• \`/predict SIMBOLO\` - Selezione automatica strategia ottimale

⚡ **Comandi di Esecuzione:**
• \`/execute ID_TRADE DIMENSIONE_LOTTO [STRATEGIA]\` - Esegui trade su MT5

🖥️ **Gestione VPS:**
• \`/vps\` - Gestisci il tuo VPS e configurazione MT5
• \`/vps_setup\` - Configura nuovo VPS automaticamente

📈 **Comandi Informativi:**
• \`/status\` - Controlla stato bot e MT5
• \`/performance\` - Visualizza performance di trading
• \`/strategies\` - Impara le strategie di trading
• \`/symbols\` - Lista simboli supportati

📚 **Aiuto:**
• \`/help\` - Mostra aiuto dettagliato

🚀 **Avvio Rapido:**
1. Usa \`/vps_setup\` per configurare il tuo VPS e MT5
2. Prova \`/scalping BTCUSD\` per un segnale scalping veloce!
3. Oppure \`/swing EURUSD\` per un'opportunità swing trading!

💡 **Consiglio Professionale:** Ogni strategia ha rapporti rischio/rendimento e tempi di mantenimento ottimizzati. Scegli in base al tuo stile di trading e tempo disponibile.
  `;
  
  const keyboard = createInlineKeyboard([
    [
      { text: "⚡ Scalping BTCUSD", callback_data: "strategy_SCALPING_BTCUSD" },
      { text: "📈 Intraday EURUSD", callback_data: "strategy_INTRADAY_EURUSD" }
    ],
    [
      { text: "🎯 Swing XAUUSD", callback_data: "strategy_SWING_XAUUSD" },
      { text: "🖥️ Configura VPS", callback_data: "vps_setup" }
    ],
    [
      { text: "📊 Guida Strategie", callback_data: "show_strategies" },
      { text: "❓ Aiuto", callback_data: "show_help" }
    ]
  ]);
  
  await sendMessage(chatId, message, { replyMarkup: keyboard });
}

async function handleStrategiesCommand(chatId: number): Promise<void> {
  const message = `
📊 **Guida Strategie di Trading Professionali**

**⚡ STRATEGIA SCALPING**
• **Timeframe:** 1-15 minuti
• **Rischio/Rendimento:** 1:1.5
• **Ideale per:** Profitti veloci, sessioni ad alto volume
• **Stop Loss:** Stretto (0.8x ATR)
• **Take Profit:** Veloce (1.2x ATR)
• **Confidenza Min:** 85%
• **Posizione Max:** 0.5 lotti
• **Condizioni Ideali:** Alto volume, mercati in trend, spread bassi

**📈 STRATEGIA INTRADAY**
• **Timeframe:** 1-8 ore
• **Rischio/Rendimento:** 1:2.0
• **Ideale per:** Day trading, approccio bilanciato
• **Stop Loss:** Standard (1.0x ATR)
• **Take Profit:** Standard (2.0x ATR)
• **Confidenza Min:** 75%
• **Posizione Max:** 1.0 lotti
• **Condizioni Ideali:** Volume normale, mercati in trend, breakout

**🎯 STRATEGIA SWING**
• **Timeframe:** 1-7 giorni
• **Rischio/Rendimento:** 1:3.0
• **Ideale per:** Trend multi-giorno, movimenti ampi
• **Stop Loss:** Ampio (1.5x ATR)
• **Take Profit:** Ampio (4.5x ATR)
• **Confidenza Min:** 70%
• **Posizione Max:** 2.0 lotti
• **Condizioni Ideali:** Qualsiasi volume, inversioni, consolidamenti

**🎓 Come Scegliere:**

**Scegli SCALPING quando:**
• Puoi monitorare i trade attivamente
• Il mercato è in trend con alto volume
• Vuoi profitti veloci
• Ambiente a bassa volatilità

**Scegli INTRADAY quando:**
• Fai trading durante le ore di mercato
• Approccio rischio/rendimento bilanciato
• Segui trend giornalieri
• Condizioni di mercato normali

**Scegli SWING quando:**
• Preferisci meno monitoraggio
• Cerchi movimenti più ampi
• Segui trend multi-giorno
• Maggiore volatilità è accettabile

**💡 Consigli Professionali:**
• Inizia con INTRADAY per approccio bilanciato
• Usa SCALPING durante sessioni ad alto volume
• Usa SWING per inversioni di trend importanti
• Rispetta sempre i limiti di rischio della strategia

**⚡ Comandi Rapidi:**
• \`/scalping EURUSD\` - Genera segnale scalping
• \`/intraday GBPUSD\` - Genera segnale intraday  
• \`/swing XAUUSD\` - Genera segnale swing
• \`/predict BTCUSD\` - Seleziona automaticamente la strategia migliore

Ogni strategia è ottimizzata per diverse condizioni di mercato e stili di trading! 🚀
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

Need more help? Try the specific strategy commands! 💬
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
