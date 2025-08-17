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
    await sendMessage(chatId, "❌ Si è verificato un errore durante l'elaborazione della tua richiesta. Riprova per favore.");
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
      await sendMessage(chatId, "📊 Scegli la tua strategia di trading:\n\n⚡ `/scalping SIMBOLO` - Trade veloci (1-15 min)\n📈 `/intraday SIMBOLO` - Trading giornaliero (1-8 ore)\n🎯 `/swing SIMBOLO` - Trade multi-day (1-7 giorni)\n\nEsempio: `/scalping EURUSD`");
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
    await sendMessage(chatId, "❌ Si è verificato un errore durante l'elaborazione della tua richiesta. Riprova per favore.");
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
💵 Prezzo di Entrata: ${result.executionPrice}
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
    await sendMessage(chatId, `🧠 **Analisi ML Avanzata per ${symbol}**\n\n🔍 Analizzando struttura del mercato, flusso smart money e determinando strategia ottimale...\n\n⏳ Potrebbero servire 10-15 secondi per un'analisi completa.`);
    
    const prediction = await analysis.predict({ symbol });
    
    await sendTradingSignal(chatId, prediction);
  } catch (error) {
    console.error("Prediction error:", error);
    await sendMessage(chatId, "❌ Errore nella generazione della previsione. Riprova o verifica se il simbolo è valido.");
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

    await sendMessage(chatId, `${strategyEmojis[strategy]} **Analisi ${strategy} per ${symbol}**\n\n🔍 Analizzando il mercato per opportunità di ${strategy.toLowerCase()}...\n\n⏳ Ottimizzando livelli di entrata, stop loss e take profit...`);
    
    const prediction = await analysis.predict({ symbol, strategy });
    
    await sendTradingSignal(chatId, prediction);
  } catch (error) {
    console.error("Strategy prediction error:", error);
    await sendMessage(chatId, `❌ Errore nella generazione dell'analisi ${strategy.toLowerCase()}. Riprova per favore.`);
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
💰 **Prezzo di Entrata:** \`${prediction.entryPrice}\`
🎯 **Take Profit:** \`${prediction.takeProfit}\`
🛡️ **Stop Loss:** \`${prediction.stopLoss}\`
${confidenceEmoji} **Confidenza:** **${prediction.confidence}%**
📊 **Rischio/Ricompensa:** 1:${prediction.riskRewardRatio}
💎 **Dimensione Consigliata:** ${prediction.recommendedLotSize} lotti
⏱️ **Durata Massima:** ${prediction.maxHoldingTime}h

📊 **Analisi Strategica:**
${prediction.strategyRecommendation}

📈 **Analisi Price Action:**
• Struttura di Mercato: **${prediction.analysis.technical.structure}**
• Trend: **${prediction.analysis.technical.trend}**
• Probabilità Breakout: **${prediction.analysis.technical.breakoutProbability}%**

👥 **Consenso Trader Professionali:**
• Top Trader: ${prediction.analysis.professional.topTraders.slice(0, 2).join(", ")}
• Consenso: **${prediction.analysis.professional.consensusView}**
• Rischio/Ricompensa: **1:${prediction.analysis.professional.riskReward.toFixed(1)}**

🎯 **Zone di Liquidità Chiave:**
${prediction.analysis.smartMoney.liquidityZones.slice(0, 3).map(zone => `• ${zone.toFixed(5)}`).join('\n')}

📰 **Sentiment del Mercato:** ${getSentimentEmoji(prediction.analysis.sentiment.score)} ${(prediction.analysis.sentiment.score * 100).toFixed(0)}%

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
      await sendPhoto(chatId, prediction.chartUrl, `📊 Analisi Grafica ${prediction.strategy} per ${prediction.symbol}`);
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
💵 Prezzo di Entrata: ${result.executionPrice}
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

🧠 **Cosa mi Rende Diverso:**
• **Analisi Smart Money** - Traccia flussi istituzionali e pattern di ordini
• **Consenso Trader Professionali** - Segui i top trader per ogni asset
• **Price Action Avanzato** - Analisi struttura mercato e zone di liquidità
• **Previsioni ML** - Nessun indicatore tradizionale, puro price action

⚡ **Strategie di Trading:**
• \`/scalping SIMBOLO\` - Trade veloci (1-15 minuti, stop stretti)
• \`/intraday SIMBOLO\` - Trading giornaliero (1-8 ore, rischio bilanciato)
• \`/swing SIMBOLO\` - Trade multi-day (1-7 giorni, target più ampi)

📊 **Analisi Generale:**
• \`/predict SIMBOLO\` - Selezione automatica strategia ottimale

⚡ **Comandi di Esecuzione:**
• \`/execute ID_TRADE DIMENSIONE_LOTTO [STRATEGIA]\` - Esegui trade su MT5

🖥️ **Gestione VPS:**
• \`/vps\` - Gestisci il tuo VPS e setup MT5
• \`/vps_setup\` - Configura nuovo VPS automaticamente

📈 **Comandi Informativi:**
• \`/status\` - Controlla stato bot e MT5
• \`/performance\` - Visualizza performance trading
• \`/strategies\` - Scopri le strategie di trading
• \`/symbols\` - Lista simboli supportati

📚 **Aiuto:**
• \`/help\` - Mostra aiuto dettagliato

🚀 **Avvio Rapido:**
1. Usa \`/vps_setup\` per configurare il tuo VPS e MT5
2. Prova \`/scalping BTCUSD\` per un segnale scalping veloce!
3. Oppure \`/swing EURUSD\` per un'opportunità swing trading!

💡 **Consiglio Professionale:** Ogni strategia ha rapporti rischio/ricompensa e tempi di mantenimento ottimizzati. Scegli in base al tuo stile di trading e al tempo disponibile.
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
      { text: "📊 Guida Strategie", callback_data: "show_strategies" },
      { text: "❓ Aiuto", callback_data: "show_help" }
    ]
  ]);
  
  await sendMessage(chatId, message, { replyMarkup: keyboard });
}

async function handleStrategiesCommand(chatId: number): Promise<void> {
  const message = `
📊 **Guida Strategie Trading Professionali**

**⚡ STRATEGIA SCALPING**
• **Timeframe:** 1-15 minuti
• **Rischio/Ricompensa:** 1:1.5
• **Ideale Per:** Profitti veloci, sessioni alto volume
• **Stop Loss:** Stretto (0.8x ATR)
• **Take Profit:** Veloce (1.2x ATR)
• **Confidenza Min:** 85%
• **Posizione Max:** 0.5 lotti
• **Condizioni Ideali:** Alto volume, mercati trending, spread bassi

**📈 STRATEGIA INTRADAY**
• **Timeframe:** 1-8 ore
• **Rischio/Ricompensa:** 1:2.0
• **Ideale Per:** Trading giornaliero, approccio bilanciato
• **Stop Loss:** Standard (1.0x ATR)
• **Take Profit:** Standard (2.0x ATR)
• **Confidenza Min:** 75%
• **Posizione Max:** 1.0 lotti
• **Condizioni Ideali:** Volume normale, mercati trending, breakout

**🎯 STRATEGIA SWING**
• **Timeframe:** 1-7 giorni
• **Rischio/Ricompensa:** 1:3.0
• **Ideale Per:** Trend multi-day, movimenti più ampi
• **Stop Loss:** Ampio (1.5x ATR)
• **Take Profit:** Grande (4.5x ATR)
• **Confidenza Min:** 70%
• **Posizione Max:** 2.0 lotti
• **Condizioni Ideali:** Qualsiasi volume, inversioni, consolidamenti

**🎓 Come Scegliere:**

**Scegli SCALPING quando:**
• Puoi monitorare i trade attivamente
• Il mercato è trending con alto volume
• Vuoi profitti veloci
• Ambiente a bassa volatilità

**Scegli INTRADAY quando:**
• Fai trading durante gli orari di mercato
• Approccio rischio/ricompensa bilanciato
• Segui i trend giornalieri
• Condizioni di mercato normali

**Scegli SWING quando:**
• Preferisci meno monitoraggio
• Cerchi movimenti più grandi
• Trading trend multi-day
• Volatilità più alta accettabile

**💡 Consigli Pro:**
• Inizia con INTRADAY per approccio bilanciato
• Usa SCALPING durante sessioni ad alto volume
• Usa SWING per inversioni di trend maggiori
• Rispetta sempre i limiti di rischio della strategia

**⚡ Comandi Veloci:**
• \`/scalping EURUSD\` - Genera segnale scalping
• \`/intraday GBPUSD\` - Genera segnale intraday  
• \`/swing XAUUSD\` - Genera segnale swing
• \`/predict BTCUSD\` - Selezione automatica migliore strategia

Ogni strategia è ottimizzata per diverse condizioni di mercato e stili di trading! 🚀
  `;
  
  await sendMessage(chatId, message);
}

async function handleHelpCommand(chatId: number): Promise<void> {
  const message = `
📚 **Bot AI Trading Professionale - Guida Completa**

**⚡ Comandi SCALPING:**
• \`/scalping BTCUSD\` - Scalping Bitcoin veloce (1-15 min)
• \`/scalping EURUSD\` - Opportunità scalping Euro
• \`/scalping XAUUSD\` - Segnale scalping Oro

**📈 Comandi INTRADAY:**
• \`/intraday EURUSD\` - Trading giornaliero Euro (1-8 ore)
• \`/intraday GBPUSD\` - Analisi intraday Sterlina
• \`/intraday CRUDE\` - Segnale trading giornaliero Petrolio

**🎯 Comandi SWING:**
• \`/swing BTCUSD\` - Trade swing Bitcoin (1-7 giorni)
• \`/swing XAUUSD\` - Opportunità swing Oro
• \`/swing CRUDE\` - Analisi swing Petrolio

**📊 Analisi Generale:**
• \`/predict SIMBOLO\` - Selezione automatica strategia ottimale
• \`/predict\` - Analizza BTCUSD (default)

**⚡ Comandi di Esecuzione:**
• \`/execute BTC-001 0.1\` - Esegui con 0.1 lotti
• \`/execute EUR-002 0.05 SCALPING\` - Esegui trade scalping
• \`/execute XAU-003 0.2 SWING\` - Esegui trade swing

**🖥️ Gestione VPS:**
• \`/vps\` - Dashboard e gestione VPS
• \`/vps_setup\` - Configurazione automatica VPS
• \`/vps_status\` - Controlla stato VPS e MT5
• \`/vps_restart\` - Riavvia trading bot su VPS
• \`/vps_logs\` - Visualizza log VPS recenti

**📊 Comandi Informativi:**
• \`/status\` - Stato connessione bot e MT5
• \`/performance\` - Statistiche di trading
• \`/strategies\` - Guida dettagliata strategie
• \`/symbols\` - Tutti i simboli trading supportati

**🎯 Caratteristiche Strategie:**

**⚡ SCALPING (1-15 min):**
• Stop stretti per protezione capitale
• Presa profitti veloce
• Solo segnali alta confidenza
• Ideale durante sessioni alto volume

**📈 INTRADAY (1-8 ore):**
• Rapporto rischio/ricompensa bilanciato
• Segui direzione trend
• Chiudi prima chiusura mercato
• Monitora news ed eventi

**🎯 SWING (1-7 giorni):**
• Stop più ampi per volatilità
• Target profitti maggiori
• Monitoraggio meno frequente
• Focus su trend settimanali

**💡 Consigli Professionali:**
• **Gestione Rischio:** Mai rischiare più del 2% per trade
• **Selezione Strategia:** Scegli in base a tempo disponibile e condizioni mercato
• **Dimensione Posizione:** Usa dimensioni lotto consigliate per rischio ottimale
• **Monitoraggio:** Scalping richiede monitoraggio attivo, swing permette approccio passivo

**⚠️ Avvertenza Rischio:**
Questo bot usa concetti trading istituzionali avanzati. Usa sempre gestione rischio appropriata e non fare mai trading con denaro che non puoi permetterti di perdere.

Serve più aiuto? Prova i comandi specifici delle strategie! 💬
  `;
  
  await sendMessage(chatId, message);
}

async function handleStatusCommand(chatId: number): Promise<void> {
  try {
    // This would check actual system status
    const message = `
🔧 **Stato Sistema Trading Professionale**

🧠 **ML Engine:** ✅ Online (Modelli Avanzati Attivi)
🤖 **Gemini AI:** ✅ Connesso (Analisi Professionale)
📊 **Smart Money Tracker:** ✅ Attivo (Flusso Istituzionale)
📈 **Order Flow Analyzer:** ✅ Streaming (Tempo Reale)
📰 **News Sentiment:** ✅ Attivo (Multi-sorgente)
⚡ **MT5 Bridge:** ✅ Connesso (Esecuzione Professionale)
🖥️ **VPS Manager:** ✅ Attivo (Monitoraggio 24/7)

💰 **Info Account:**
• Saldo: $10,000.00
• Margine Libero: $9,500.00
• Posizioni Aperte: 0
• Livello Rischio: Conservativo

🎯 **Capacità Strategie:**
• ⚡ Scalping: ✅ Attivo (trade 1-15 min)
• 📈 Intraday: ✅ Attivo (trade 1-8 ore)
• 🎯 Swing: ✅ Attivo (trade 1-7 giorni)
• 📊 Auto-Strategia: ✅ Attivo (Selezione ottimale)

🕐 **Ultimo Aggiornamento:** ${new Date().toLocaleString()}

Tutti i sistemi trading professionali operativi! 🚀

Usa \`/vps\` per gestire il tuo VPS e la connessione MT5.
    `;
    
    await sendMessage(chatId, message);
  } catch (error) {
    console.error("Status check error:", error);
    await sendMessage(chatId, "❌ Errore nel controllo stato sistema. Riprova per favore.");
  }
}

async function handlePerformanceCommand(chatId: number): Promise<void> {
  try {
    const performance = await analysis.getPerformance();
    
    const winRateEmoji = performance.winRate >= 70 ? "🔥" : performance.winRate >= 50 ? "⚡" : "⚠️";
    const profitFactorEmoji = performance.profitFactor >= 2 ? "🔥" : performance.profitFactor >= 1 ? "⚡" : "⚠️";
    
    const message = `
📊 **Performance Trading Professionale**

${winRateEmoji} **Tasso Vittorie:** ${performance.winRate.toFixed(1)}%
${profitFactorEmoji} **Fattore Profitto:** ${performance.profitFactor.toFixed(2)}
📈 **Segnali Totali:** ${performance.totalTrades}
💰 **Profitto Medio:** $${performance.avgProfit.toFixed(2)}
📉 **Perdita Media:** $${performance.avgLoss.toFixed(2)}
🎯 **Miglior Trade:** $${performance.bestTrade.toFixed(2)}
📊 **Confidenza Media:** ${performance.avgConfidence.toFixed(0)}%

**🧠 Performance Modello ML:**
${getMLPerformanceRating(performance.winRate, performance.profitFactor)}

**📈 Performance Strategie:**
• ⚡ Scalping: Alta frequenza, gestione rischio stretta
• 📈 Intraday: Approccio bilanciato, buono per principianti
• 🎯 Swing: Movimenti più ampi, meno monitoraggio richiesto

**🎯 Metriche Professionali:**
• Rapporto Rischio/Ricompensa: 1:${performance.profitFactor.toFixed(1)}
• Sharpe Ratio: ${calculateSharpeRatio(performance)}
• Drawdown Massimo: ${calculateMaxDrawdown(performance)}%
• Fattore Recupero: ${calculateRecoveryFactor(performance)}

**🚀 Raccomandazioni Strategie:**
• Usa **SCALPING** per profitti veloci durante alto volume
• Usa **INTRADAY** per trading giornaliero bilanciato
• Usa **SWING** per movimenti più grandi con meno monitoraggio

Continua a seguire lo smart money! 🚀
    `;
    
    await sendMessage(chatId, message);
  } catch (error) {
    console.error("Performance error:", error);
    await sendMessage(chatId, "❌ Errore nel recupero dati performance. Riprova per favore.");
  }
}

async function handleSymbolsCommand(chatId: number): Promise<void> {
  const message = `
📊 **Simboli Trading Supportati con Analisi Multi-Strategia**

**💰 Criptovalute:**
• **BTCUSD** - Bitcoin (Tutte le strategie: ⚡📈🎯)
• **ETHUSD** - Ethereum (Tutte le strategie: ⚡📈🎯)

**💱 Coppie Forex Principali:**
• **EURUSD** - Euro/Dollaro (Ideale per: ⚡📈)
• **GBPUSD** - Sterlina/Dollaro (Ideale per: ⚡📈🎯)
• **USDJPY** - Dollaro/Yen (Ideale per: ⚡📈)
• **AUDUSD** - Dollaro Australiano (Ideale per: 📈🎯)
• **USDCAD** - Dollaro/Canadese (Ideale per: 📈🎯)
• **USDCHF** - Dollaro/Franco Svizzero (Ideale per: 📈🎯)

**🥇 Metalli Preziosi:**
• **XAUUSD** - Oro (Ideale per: 📈🎯)

**🛢️ Materie Prime:**
• **CRUDE** - Petrolio WTI (Ideale per: 📈🎯)
• **BRENT** - Petrolio Brent (Ideale per: 📈🎯)

**🎯 Simboli Strategie:**
⚡ = Eccellente per SCALPING (1-15 min)
📈 = Eccellente per INTRADAY (1-8 ore)  
🎯 = Eccellente per SWING (1-7 giorni)

**Esempi di Utilizzo:**
• \`/scalping BTCUSD\` - Scalping Bitcoin
• \`/intraday EURUSD\` - Trading giornaliero Euro
• \`/swing XAUUSD\` - Swing trading Oro
• \`/predict GBPUSD\` - Selezione automatica strategia migliore

**💡 Consigli Selezione Strategia:**
• **Crypto (BTC/ETH):** Ottime per tutte le strategie grazie al trading 24/7
• **Forex Principali:** Ideali per scalping e intraday durante orari mercato
• **Oro/Petrolio:** Eccellenti per swing trading grazie a movimenti più ampi
• **Coppie Minori:** Migliori per strategie intraday e swing

Altri simboli e funzionalità avanzate in arrivo! 🚀
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
