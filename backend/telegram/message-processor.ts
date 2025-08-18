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
import { getMT5Positions, closeMT5Position } from "../analysis/mt5-bridge";

export async function processMessage(chatId: number, userId: number, text: string): Promise<void> {
  const command = text.toLowerCase().trim();

  try {
    // Check if user is in a state that requires specific handling
    const userState = await getUserState(userId);
    if (userState && userState.currentState !== USER_STATES.READY_TO_TRADE) {
      await handleUserStateFlow(chatId, userId, text, userState);
      return;
    }

    if (command.startsWith("/segnale") || command.startsWith("/predict")) {
      // Check if user has signal access
      const hasAccess = await checkClientFeature(userId, "basic_signals") ||
                       await checkClientFeature(userId, "advanced_signals") ||
                       await checkClientFeature(userId, "premium_signals");
      
      if (!hasAccess) {
        await sendMessage(chatId, "❌ Hai bisogno di un abbonamento attivo per accedere ai segnali AI. Usa `/subscription` per saperne di più.");
        return;
      }
      
      await handlePredictCommand(chatId, command, userId);
    } else if (command.startsWith("/scalping")) {
      await handleStrategyCommand(chatId, command, TradingStrategy.SCALPING, userId);
    } else if (command.startsWith("/intraday")) {
      await handleStrategyCommand(chatId, command, TradingStrategy.INTRADAY, userId);
    } else if (command.startsWith("/swing")) {
      await handleStrategyCommand(chatId, command, TradingStrategy.SWING, userId);
    } else if (command.startsWith("/execute") || command.startsWith("/ordina")) {
      await handleExecuteCommand(chatId, command);
    } else if (command.startsWith("/stato")) {
      await handleStatusCommand(chatId, userId);
    } else if (command.startsWith("/chiudi")) {
      await handleCloseCommand(chatId, command);
    } else if (command.startsWith("/affidabilita")) {
      await handleReliabilityCommand(chatId, command, userId);
    } else if (command.startsWith("/lista_asset")) {
      await handleSymbolsCommand(chatId);
    } else if (command.startsWith("/config_rischio")) {
      await handleRiskConfigCommand(chatId, userId);
    } else if (command.startsWith("/imposta")) {
      await handleSettingsCommand(chatId, userId);
    } else if (command.startsWith("/backtest")) {
      await handleBacktestCommand(chatId, command);
    } else if (command === "/start") {
      await handleStartCommand(chatId, userId);
    } else if (command === "/help" || command === "/aiuto") {
      await handleHelpCommand(chatId);
    } else if (command === "/performance" || command === "/prestazioni") {
      await handlePerformanceCommand(chatId);
    } else if (command.startsWith("/symbols") || command.startsWith("/simboli")) {
      await handleSymbolsCommand(chatId);
    } else if (command.startsWith("/strategies") || command.startsWith("/strategie")) {
      await handleStrategiesCommand(chatId);
    } else if (command.startsWith("/vps")) {
      // Check if user has VPS management access
      const hasAccess = await checkClientFeature(userId, "vps_management");
      
      if (!hasAccess) {
        await sendMessage(chatId, "❌ Hai bisogno di un abbonamento attivo per accedere alla gestione VPS. Usa `/subscription` per saperne di più.");
        return;
      }
      
      await handleVPSCommand(chatId, userId, command);
    } else if (command === "/vps_setup") {
      // Check if user has VPS management access
      const hasAccess = await checkClientFeature(userId, "vps_management");
      
      if (!hasAccess) {
        await sendMessage(chatId, "❌ Hai bisogno di un abbonamento attivo per accedere alla configurazione VPS. Usa `/subscription` per saperne di più.");
        return;
      }
      
      await handleVPSSetup(chatId, userId);
    } else if (command === "/subscription" || command === "/features" || command === "/upgrade" || command === "/support") {
      await handleClientCommands(chatId, userId, command);
    } else if (command === "/settings" || command === "/impostazioni") {
      await handleSettingsCommand(chatId, userId);
    } else {
      // Check if user is in VPS setup mode by checking if they have an active state
      const userState = await getUserState(userId);
      if (userState && userState.currentState !== USER_STATES.READY_TO_TRADE) {
        await handleUserStateFlow(chatId, userId, text, userState);
      } else {
        // Default help message for unrecognized commands
        await sendMessage(chatId, "❓ Comando non riconosciuto. Usa `/help` per vedere tutti i comandi disponibili.");
      }
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
    }
    else if (callbackData.startsWith("mode_")) {
      const mode = callbackData.replace("mode_", "") as TradingStrategy;
      await handleTradingModeSelection(chatId, userId, mode);
    }
    else if (callbackData.startsWith("execute_")) {
      const parts = callbackData.split("_");
      const tradeId = parts[1];
      const lotSize = parseFloat(parts[2]);
      const strategy = parts[3] || TradingStrategy.INTRADAY;
      await executeTradeFromCallback(chatId, tradeId, lotSize, strategy);
    }
    else if (callbackData.startsWith("strategy_")) {
      const parts = callbackData.split("_");
      const strategy = parts[1] as TradingStrategy;
      const symbol = parts[2] || "BTCUSD";
      await handleStrategyCommand(chatId, `/segnale ${symbol}`, strategy, userId);
    }
    else if (callbackData === "new_analysis") {
      await sendMessage(chatId, "📊 Scegli la tua strategia di trading:\n\n⚡ `/scalping SIMBOLO` - Trade veloci (1-15 min)\n📈 `/intraday SIMBOLO` - Day trading (1-8 ore)\n🎯 `/swing SIMBOLO` - Trade multi-giorno (1-7 giorni)\n\nEsempio: `/scalping EURUSD`");
    }
    else if (callbackData === "show_performance") {
      await handlePerformanceCommand(chatId);
    }
    else if (callbackData.startsWith("predict_")) {
      const symbol = callbackData.replace("predict_", "");
      await handlePredictCommand(chatId, `/segnale ${symbol}`, userId);
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
    await sendMessage(chatId, "❌ Errore nell'elaborazione della tua richiesta. Riprova.");
  }
}

async function executeTradeFromCallback(chatId: number, tradeId: string, lotSize: number, strategy: string): Promise<void> {
  try {
    const result = await execute({ tradeId, lotSize, strategy: strategy as TradingStrategy });
    const message = `
✅ **Trade Eseguito con Successo!**

🆔 **Trade ID:** \`${tradeId}\`
📊 **Strategia:** ${strategy}
💎 **Dimensione Lotto:** ${lotSize}
💰 **Prezzo Esecuzione:** ${result.executionPrice || 'N/A'}
🆔 **Order ID:** ${result.orderId || 'N/A'}

⏰ **Ora Esecuzione:** ${new Date().toLocaleTimeString()}

**La tua posizione è ora attiva su MT5!**
    `;
    await sendMessage(chatId, message);
  }
  catch (error) {
    console.error("Error executing trade:", error);
    await sendMessage(chatId, "❌ Errore nell'esecuzione del trade. Controlla la connessione MT5 e riprova.");
  }
}

async function handleUserStateFlow(chatId: number, userId: number, text: string, userState: any): Promise<void> {
  switch (userState.currentState) {
    case USER_STATES.SETTING_RISK_AMOUNT:
      await handleRiskAmountInput(chatId, userId, text, userState);
      break;
    case USER_STATES.SETTING_ACCOUNT_BALANCE:
      await handleAccountBalanceInput(chatId, userId, text, userState);
      break;
    default:
      await sendMessage(chatId, "❌ Stato sconosciuto. Ricomincia con /start");
      await clearUserState(userId);
      break;
  }
}

async function handleStartCommand(chatId: number, userId: number): Promise<void> {
  const userPrefs = await getUserPreferences(userId);
  if (userPrefs && userPrefs.tradingMode) {
    const modeInfo = getTradingModeInfo(userPrefs.tradingMode);
    const message = `
🤖 **Bentornato su AI Trading Bot Professionale**

Sei già configurato con la modalità **${userPrefs.tradingMode}**!

${modeInfo}

💰 **Impostazioni Attuali:**
• Rischio per trade: ${userPrefs.riskPercentage}%
• Saldo account: ${userPrefs.accountBalance ? `$${userPrefs.accountBalance.toLocaleString()}` : 'Non impostato'}
• Valuta account: ${userPrefs.accountCurrency}

🚀 **Pronto per Tradare:**
• Usa \`/segnale SIMBOLO\` per analisi con la tua modalità preferita
• Usa \`/scalping SIMBOLO\`, \`/intraday SIMBOLO\`, o \`/swing SIMBOLO\` per strategie specifiche
• Usa \`/impostazioni\` per cambiare le tue preferenze

💡 **Avvio Rapido:** Prova \`/${userPrefs.tradingMode.toLowerCase()} BTCUSD\` per un segnale!
    `;
    const keyboard = createInlineKeyboard([
      [
        { text: `${userPrefs.tradingMode === TradingStrategy.SCALPING ? '⚡' : userPrefs.tradingMode === TradingStrategy.INTRADAY ? '📈' : '🎯'} ${userPrefs.tradingMode} BTCUSD`, callback_data: `strategy_${userPrefs.tradingMode}_BTCUSD` }
      ],
      [
        { text: "⚙️ Impostazioni", callback_data: "show_settings" },
        { text: "📊 Performance", callback_data: "show_performance" }
      ],
      [
        { text: "❓ Aiuto", callback_data: "show_help" },
        { text: "🖥️ Setup VPS", callback_data: "vps_setup" }
      ]
    ]);
    await sendMessage(chatId, message, { replyMarkup: keyboard });
  }
  else {
    await startTradingModeSetup(chatId, userId);
  }
}

async function startTradingModeSetup(chatId: number, userId: number): Promise<void> {
  await setUserState(userId, chatId, USER_STATES.SELECTING_TRADING_MODE);
  const message = `
🎯 **Benvenuto su AI Trading Bot Professionale!**

Configuriamo le tue preferenze di trading per iniziare.

**Passo 1: Scegli la Tua Modalità di Trading**

${getAllTradingModesInfo()}

🤔 **Quale stile di trading ti si addice meglio?**

Seleziona una modalità qui sotto per vedere informazioni dettagliate e continuare la configurazione:
  `;
  const keyboard = createInlineKeyboard([
    [
      { text: "⚡ Scalping", callback_data: "mode_SCALPING" },
      { text: "📈 Intraday", callback_data: "mode_INTRADAY" },
      { text: "🎯 Swing", callback_data: "mode_SWING" }
    ],
    [
      { text: "❓ Aiutami a Scegliere", callback_data: "show_strategies" }
    ]
  ]);
  await sendMessage(chatId, message, { replyMarkup: keyboard });
}

async function handleTradingModeSelection(chatId: number, userId: number, mode: TradingStrategy): Promise<void> {
  const userState = await getUserState(userId);
  if (!userState || userState.currentState !== USER_STATES.SELECTING_TRADING_MODE) {
    await sendMessage(chatId, "❌ Avvia il processo di configurazione con /start");
    return;
  }
  
  const modeInfo = getTradingModeInfo(mode);
  const message = `
✅ **Modalità ${mode} Selezionata!**

${modeInfo}

**Passo 2: Configurazione Gestione Rischio**

Ora configuriamo le tue impostazioni di gestione del rischio.

💰 **Quanto vuoi rischiare per trade?**

Inserisci la percentuale di rischio (consigliato: 1-3%):
• Conservativo: 1%
• Bilanciato: 2% 
• Aggressivo: 3%

Scrivi un numero come: \`2\` (per 2%)
  `;
  await setUserState(userId, chatId, USER_STATES.SETTING_RISK_AMOUNT, { selectedMode: mode });
  await sendMessage(chatId, message);
}

async function handleRiskAmountInput(chatId: number, userId: number, text: string, userState: any): Promise<void> {
  const riskInput = text.trim().replace('%', '');
  const riskPercentage = parseFloat(riskInput);
  if (isNaN(riskPercentage) || riskPercentage < 0.1 || riskPercentage > 10) {
    await sendMessage(chatId, "❌ Inserisci una percentuale di rischio valida tra 0.1% e 10%.\n\nEsempio: `2` (per 2%)");
    return;
  }
  const message = `
✅ **Gestione Rischio Impostata: ${riskPercentage}%**

**Passo 3: Saldo Account (Opzionale)**

Per fornire raccomandazioni accurate sul dimensionamento delle posizioni, inserisci il saldo del tuo account.

💰 **Qual è il saldo del tuo account?**

Esempi:
• \`1000\` (per $1.000)
• \`5000\` (per $5.000)
• \`skip\` (per impostarlo dopo)

Questo aiuta a calcolare le dimensioni ottimali dei lotti per i tuoi trade.
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
      await sendMessage(chatId, "❌ Inserisci un saldo account valido (minimo $100) o scrivi `skip`.\n\nEsempio: `1000` (per $1.000)");
      return;
    }
    accountBalance = balanceInput;
  }
  
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
🎉 **Configurazione Completata!**

Le tue preferenze di trading sono state salvate:

${modeInfo}

💰 **Le Tue Impostazioni:**
• Rischio per trade: ${preferences.riskPercentage}%
• Saldo account: ${accountBalance ? `$${accountBalance.toLocaleString()}` : 'Non impostato (può essere impostato dopo)'}
• Valuta account: ${preferences.accountCurrency}

🚀 **Sei pronto per tradare!**

Prova questi comandi:
• \`/segnale BTCUSD\` - Ottieni un segnale usando la tua modalità preferita
• \`/${preferences.tradingMode!.toLowerCase()} EURUSD\` - Ottieni un segnale di strategia specifica
• \`/impostazioni\` - Cambia le tue preferenze in qualsiasi momento

**Iniziamo con il tuo primo segnale!** 🎯
  `;
  const keyboard = createInlineKeyboard([
    [
      { text: `${preferences.tradingMode === TradingStrategy.SCALPING ? '⚡' : preferences.tradingMode === TradingStrategy.INTRADAY ? '📈' : '🎯'} Ottieni Segnale ${preferences.tradingMode}`, callback_data: `strategy_${preferences.tradingMode}_BTCUSD` }
    ],
    [
      { text: "📊 Vedi Tutte le Strategie", callback_data: "show_strategies" },
      { text: "⚙️ Impostazioni", callback_data: "show_settings" }
    ],
    [
      { text: "🖥️ Setup VPS", callback_data: "vps_setup" },
      { text: "❓ Aiuto", callback_data: "show_help" }
    ]
  ]);
  await sendMessage(chatId, message, { replyMarkup: keyboard });
}

async function handleSettingsCommand(chatId: number, userId: number): Promise<void> {
  const userPrefs = await getUserPreferences(userId);
  if (!userPrefs) {
    await sendMessage(chatId, "❌ Nessuna preferenza trovata. Usa /start per configurare la tua modalità di trading.");
    return;
  }
  const modeInfo = getTradingModeInfo(userPrefs.tradingMode!);
  const message = `
⚙️ **Le Tue Impostazioni di Trading**

${modeInfo}

💰 **Impostazioni Attuali:**
• Rischio per trade: ${userPrefs.riskPercentage}%
• Saldo account: ${userPrefs.accountBalance ? `$${userPrefs.accountBalance.toLocaleString()}` : 'Non impostato'}
• Valuta account: ${userPrefs.accountCurrency}

🔧 **Cambia Impostazioni:**
Usa \`/start\` per riconfigurare la tua modalità di trading e impostazioni di rischio.

📊 **Comandi Disponibili:**
• \`/segnale SIMBOLO\` - Usa la tua modalità preferita (${userPrefs.tradingMode})
• \`/scalping SIMBOLO\` - Forza modalità scalping
• \`/intraday SIMBOLO\` - Forza modalità intraday  
• \`/swing SIMBOLO\` - Forza modalità swing
• \`/performance\` - Vedi le tue statistiche di trading
  `;
  const keyboard = createInlineKeyboard([
    [
      { text: "🔄 Riconfigura", callback_data: "setup_trading_mode" },
      { text: "📊 Performance", callback_data: "show_performance" }
    ],
    [
      { text: "❓ Aiuto", callback_data: "show_help" },
      { text: "🖥️ Setup VPS", callback_data: "vps_setup" }
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
    const strategyText = strategy ? ` usando la tua modalità preferita ${strategy}` : "";
    await sendMessage(chatId, `🧠 **Analisi ML Avanzata per ${symbol}**${strategyText}\n\n🔍 Analizzando struttura di mercato, flusso smart money e determinando strategia ottimale...\n\n⏳ Questo può richiedere 10-15 secondi per un'analisi completa.`);
    const prediction = await predict({
      symbol,
      strategy
    });
    await sendTradingSignal(chatId, prediction, userPrefs);
  }
  catch (error) {
    console.error("Prediction error:", error);
    await sendMessage(chatId, "❌ Errore nella generazione della previsione. Riprova o controlla se il simbolo è valido.");
  }
}

async function handleStrategyCommand(chatId: number, command: string, strategy: TradingStrategy, userId?: number): Promise<void> {
  const parts = command.split(" ");
  const symbol = parts[1]?.toUpperCase() || "BTCUSD";
  try {
    const userPrefs = userId ? await getUserPreferences(userId) : null;
    const strategyEmojis = {
      [TradingStrategy.SCALPING]: "⚡",
      [TradingStrategy.INTRADAY]: "📈",
      [TradingStrategy.SWING]: "🎯"
    };
    await sendMessage(chatId, `${strategyEmojis[strategy]} **Analisi ${strategy} per ${symbol}**\n\n🔍 Analizzando il mercato per opportunità ${strategy.toLowerCase()}...\n\n⏳ Ottimizzando livelli di entrata, stop loss e take profit...`);
    const prediction = await predict({
      symbol,
      strategy: strategy
    });
    await sendTradingSignal(chatId, prediction, userPrefs);
  }
  catch (error) {
    console.error("Strategy prediction error:", error);
    await sendMessage(chatId, `❌ Errore nella generazione dell'analisi ${strategy.toLowerCase()}. Riprova.`);
  }
}

async function sendTradingSignal(chatId: number, prediction: any, userPrefs?: UserPreferences | null): Promise<void> {
  const strategyEmojis: Record<string, string> = {
    [TradingStrategy.SCALPING]: "⚡",
    [TradingStrategy.INTRADAY]: "📈",
    [TradingStrategy.SWING]: "🎯"
  };

  const confidenceEmoji = prediction.confidence >= 85 ? "🔥" : prediction.confidence >= 75 ? "⚡" : "⚠️";
  const strategyEmoji = strategyEmojis[prediction.strategy] || "📊";
  
  let positionSizeInfo = "";
  if (userPrefs && userPrefs.accountBalance && userPrefs.riskPercentage) {
    const riskAmount = userPrefs.accountBalance * (userPrefs.riskPercentage / 100);
    const stopLossDistance = Math.abs(prediction.entryPrice - prediction.stopLoss);
    const suggestedLotSize = Math.min(riskAmount / stopLossDistance, 2.0);
    
    positionSizeInfo = `

🎯 **Il Tuo Dimensionamento Posizione:**
• Saldo Account: $${userPrefs.accountBalance.toLocaleString()}
• Importo Rischio: $${riskAmount.toFixed(2)} (${userPrefs.riskPercentage}%)
• Dimensione Lotto Suggerita: ${Math.round(suggestedLotSize * 100) / 100} lotti`;
  }
  
  const message = `
${strategyEmoji} **Segnale ${prediction.strategy} - ${prediction.symbol}**

🆔 **Trade ID:** \`${prediction.tradeId}\`
📈 **Direzione:** **${prediction.direction}**
💰 **Prezzo Entrata:** ${prediction.entryPrice}
🎯 **Take Profit:** ${prediction.takeProfit}
🛡️ **Stop Loss:** ${prediction.stopLoss}
${confidenceEmoji} **Confidenza:** **${prediction.confidence}%**
📊 **Rischio/Rendimento:** 1:${prediction.riskRewardRatio}
💎 **Dimensione Consigliata:** ${prediction.recommendedLotSize} lotti
⏱️ **Tempo Max Mantenimento:** ${prediction.maxHoldingTime}h${positionSizeInfo}

📊 **Analisi Strategia:**
${prediction.strategyRecommendation}

🧠 **Analisi Tecnica AI:**
• **Trend:** ${prediction.analysis?.technical?.trend || 'N/A'}
• **Supporto:** ${prediction.analysis?.technical?.support || 'N/A'}
• **Resistenza:** ${prediction.analysis?.technical?.resistance || 'N/A'}
• **Smart Money:** ${prediction.analysis?.smartMoney?.institutionalFlow || 'N/A'}

💡 **Gestione Rischio:**
Usa sempre lo stop loss e non rischiare mai più del 2% del tuo account per trade.
  `;
  
  const suggestedSize = userPrefs && userPrefs.accountBalance ?
    Math.min(userPrefs.accountBalance * (userPrefs.riskPercentage || 2) / 100 / Math.abs(prediction.entryPrice - prediction.stopLoss), 2.0) :
    prediction.recommendedLotSize;
  const keyboard = createInlineKeyboard([
    [
      { text: `${strategyEmoji} Esegui ${Math.round(suggestedSize * 100) / 100}`, callback_data: `execute_${prediction.tradeId}_${Math.round(suggestedSize * 100) / 100}_${prediction.strategy}` },
      { text: `${strategyEmoji} Esegui 0.01`, callback_data: `execute_${prediction.tradeId}_0.01_${prediction.strategy}` }
    ],
    [
      { text: "📊 Nuova Analisi", callback_data: "new_analysis" },
      { text: "📈 Performance", callback_data: "show_performance" }
    ]
  ]);
  await sendMessage(chatId, message, { replyMarkup: keyboard });
}

async function handleExecuteCommand(chatId: number, command: string): Promise<void> {
  const parts = command.split(" ");
  if (parts.length < 3) {
    await sendMessage(chatId, "❌ Uso: `/ordina TRADE_ID DIMENSIONE_LOTTO`\n\nEsempio: `/ordina BTC-001 0.1`");
    return;
  }
  const tradeId = parts[1];
  const lotSize = parseFloat(parts[2]);
  const strategy = parts[3] || TradingStrategy.INTRADAY;
  if (isNaN(lotSize) || lotSize <= 0) {
    await sendMessage(chatId, "❌ Dimensione lotto non valida. Usa un numero positivo.\n\nEsempio: `/ordina BTC-001 0.1`");
    return;
  }
  await executeTradeFromCallback(chatId, tradeId, lotSize, strategy);
}

async function handleStatusCommand(chatId: number, userId: number): Promise<void> {
  try {
    const positions = await getMT5Positions();
    
    if (positions.length === 0) {
      const message = `
📊 **Stato Posizioni MT5**

✅ **Nessuna posizione aperta**

💰 **Info Account:**
• Saldo: $10.000,00
• Margine Libero: $9.500,00
• Posizioni Aperte: 0
• Livello Rischio: Conservativo

🎯 **Pronto per nuovi trade!**
Usa \`/segnale SIMBOLO\` per ottenere un nuovo segnale.
      `;
      await sendMessage(chatId, message);
      return;
    }

    let positionsText = "📊 **Posizioni Aperte su MT5:**\n\n";
    let totalProfit = 0;

    positions.forEach((pos, index) => {
      const direction = pos.type === 0 ? "LONG" : "SHORT";
      const directionEmoji = pos.type === 0 ? "📈" : "📉";
      const profitEmoji = pos.profit >= 0 ? "💚" : "❌";
      
      positionsText += `${directionEmoji} **${pos.symbol}** (${direction})\n`;
      positionsText += `• Ticket: \`${pos.ticket}\`\n`;
      positionsText += `• Volume: ${pos.volume} lotti\n`;
      positionsText += `• Prezzo Apertura: ${pos.openPrice}\n`;
      positionsText += `• Prezzo Attuale: ${pos.currentPrice}\n`;
      positionsText += `• ${profitEmoji} P&L: $${pos.profit.toFixed(2)}\n`;
      if (pos.comment) positionsText += `• Commento: ${pos.comment}\n`;
      positionsText += "\n";
      
      totalProfit += pos.profit;
    });

    const totalEmoji = totalProfit >= 0 ? "💚" : "❌";
    positionsText += `${totalEmoji} **P&L Totale: $${totalProfit.toFixed(2)}**\n\n`;
    positionsText += "💡 Usa `/chiudi TICKET_ID` per chiudere una posizione specifica.";

    await sendMessage(chatId, positionsText);
  } catch (error) {
    console.error("Error getting positions:", error);
    await sendMessage(chatId, "❌ Errore nel recupero delle posizioni. Controlla la connessione MT5.");
  }
}

async function handleCloseCommand(chatId: number, command: string): Promise<void> {
  const parts = command.split(" ");
  if (parts.length < 2) {
    await sendMessage(chatId, "❌ Uso: `/chiudi TICKET_ID`\n\nEsempio: `/chiudi 123456789`");
    return;
  }
  
  const ticketId = parseInt(parts[1]);
  if (isNaN(ticketId)) {
    await sendMessage(chatId, "❌ ID ticket non valido. Deve essere un numero.\n\nEsempio: `/chiudi 123456789`");
    return;
  }

  try {
    await sendMessage(chatId, `🔄 Chiudendo posizione ${ticketId}...`);
    
    const result = await closeMT5Position(ticketId);
    
    if (result.success) {
      const message = `
✅ **Posizione Chiusa con Successo!**

🆔 **Ticket:** ${ticketId}
💰 **Prezzo Chiusura:** ${result.executionPrice || 'N/A'}
🆔 **Deal ID:** ${result.orderId || 'N/A'}
⏰ **Ora Chiusura:** ${new Date().toLocaleTimeString()}

**La posizione è stata chiusa su MT5!**
      `;
      await sendMessage(chatId, message);
    } else {
      await sendMessage(chatId, `❌ Errore nella chiusura della posizione: ${result.error}`);
    }
  } catch (error) {
    console.error("Error closing position:", error);
    await sendMessage(chatId, "❌ Errore nella chiusura della posizione. Controlla la connessione MT5 e riprova.");
  }
}

async function handleReliabilityCommand(chatId: number, command: string, userId?: number): Promise<void> {
  const parts = command.split(" ");
  const symbol = parts[1]?.toUpperCase() || "BTCUSD";
  
  try {
    await sendMessage(chatId, `🔍 **Analizzando affidabilità per ${symbol}**...\n\n⏳ Calcolo in corso...`);
    
    const prediction = await predict({ symbol });
    
    const confidenceEmoji = prediction.confidence >= 85 ? "🔥" : prediction.confidence >= 75 ? "⚡" : "⚠️";
    const gradeEmoji = prediction.confidence >= 90 ? "🏆" : prediction.confidence >= 80 ? "🥇" : prediction.confidence >= 70 ? "🥈" : "🥉";
    
    const message = `
${confidenceEmoji} **Affidabilità ${symbol}**

${gradeEmoji} **Punteggio:** ${prediction.confidence}%
📊 **Strategia Ottimale:** ${prediction.strategy}
📈 **Direzione:** ${prediction.direction}

**Fattori Determinanti:**
• Confluenza Multi-Timeframe: ${prediction.analysis?.technical?.trend || 'N/A'}
• Analisi Smart Money: ${prediction.analysis?.smartMoney?.institutionalFlow || 'N/A'}
• Sentiment di Mercato: ${prediction.analysis?.sentiment?.score || 'N/A'}
• Volatilità: ${prediction.analysis?.volatility?.daily || 'N/A'}

${prediction.confidence >= 70 ? 
  "✅ **Raccomandazione:** Segnale affidabile per il trading" : 
  "⚠️ **Raccomandazione:** Affidabilità bassa, considera asset alternativi"}

💡 Usa \`/segnale ${symbol}\` per l'analisi completa.
    `;
    
    await sendMessage(chatId, message);
  } catch (error) {
    console.error("Reliability analysis error:", error);
    await sendMessage(chatId, "❌ Errore nell'analisi di affidabilità. Riprova.");
  }
}

async function handleRiskConfigCommand(chatId: number, userId: number): Promise<void> {
  const message = `
⚙️ **Configurazione Gestione Rischio**

Questa funzionalità ti permetterà di configurare:

• Percentuale massima di rischio per trade
• Limite di rischio giornaliero
• Numero massimo di trade simultanei
• Modalità stop loss di default (ATR/PIPS)
• Modalità take profit di default (RR/PIPS)

🚧 **In Sviluppo**
Questa funzionalità sarà disponibile presto!

Per ora, usa \`/start\` per configurare le impostazioni di base.
  `;
  
  await sendMessage(chatId, message);
}

async function handleBacktestCommand(chatId: number, command: string): Promise<void> {
  const parts = command.split(" ");
  const symbol = parts[1]?.toUpperCase() || "BTCUSD";
  const timeframe = parts[2] || "1h";
  const period = parts[3] || "30d";
  
  const message = `
📊 **Backtest Rapido**

🚧 **Funzionalità in Sviluppo**

Parametri richiesti:
• Simbolo: ${symbol}
• Timeframe: ${timeframe}
• Periodo: ${period}

Questa funzionalità eseguirà un backtest rapido della strategia AI e mostrerà:
• Win Rate
• Expectancy
• Maximum Drawdown
• Sample Size
• Profit Factor

Sarà disponibile presto!
  `;
  
  await sendMessage(chatId, message);
}

async function handleHelpCommand(chatId: number): Promise<void> {
  const message = `
🤖 **AI Trading Bot Professionale - Aiuto**

**🎯 Comandi di Trading:**
• \`/segnale SIMBOLO\` - Analisi AI con strategia ottimale
• \`/scalping SIMBOLO\` - Trade veloci (1-15 min)
• \`/intraday SIMBOLO\` - Day trading (1-8 ore)
• \`/swing SIMBOLO\` - Trade multi-giorno (1-7 giorni)
• \`/ordina TRADE_ID DIMENSIONE_LOTTO\` - Esegui trade su MT5

**📊 Gestione Posizioni:**
• \`/stato\` - Mostra posizioni aperte su MT5
• \`/chiudi TICKET_ID\` - Chiudi posizione specifica
• \`/affidabilita SIMBOLO\` - Solo punteggio affidabilità

**🖥️ Gestione VPS:**
• \`/vps\` - Dashboard e stato VPS
• \`/vps_setup\` - Configura VPS automaticamente

**💰 Account e Abbonamento:**
• \`/subscription\` - Dettagli del tuo abbonamento
• \`/features\` - Vedi le tue funzionalità disponibili
• \`/upgrade\` - Aggiorna il tuo piano
• \`/support\` - Ottieni aiuto e supporto

**📊 Comandi Informativi:**
• \`/performance\` - Statistiche di trading
• \`/impostazioni\` - Le tue preferenze di trading
• \`/strategie\` - Impara le strategie
• \`/lista_asset\` - Simboli supportati per il trading

**⚙️ Configurazione:**
• \`/config_rischio\` - Configura gestione rischio
• \`/imposta\` - Parametri di default
• \`/backtest SIMBOLO\` - Backtest rapido (presto)

**💡 Suggerimenti Pro:**
• Inizia con \`/vps_setup\` per configurazione automatica
• Usa la tua modalità di trading preferita da \`/impostazioni\`
• Segui sempre le linee guida di gestione del rischio

**⚠️ Avviso di Rischio:**
Questo bot usa analisi AI avanzata. Usa sempre una gestione del rischio appropriata e non tradare mai denaro che non puoi permetterti di perdere.

Hai bisogno di più aiuto? Controlla \`/subscription\` per i dettagli del tuo piano! 💬
  `;
  await sendMessage(chatId, message);
}

async function handlePerformanceCommand(chatId: number): Promise<void> {
  try {
    const performance = await getPerformance();
    const message = `
📊 **Dashboard Performance Trading**

**🎯 Statistiche Generali:**
• Trade Totali: ${performance.totalTrades}
• Tasso Vittoria: ${performance.winRate.toFixed(1)}%
• Profitto Medio: $${performance.avgProfit.toFixed(2)}
• Perdita Media: $${performance.avgLoss.toFixed(2)}

**📈 Migliore Performance:**
• Miglior Trade: $${performance.bestTrade.toFixed(2)}
• Fattore Profitto: ${performance.profitFactor.toFixed(2)}
• Confidenza Media: ${performance.avgConfidence.toFixed(1)}%

**⚠️ Metriche Rischio:**
• Peggior Trade: $${performance.worstTrade.toFixed(2)}

**💡 Continua così!**
Le performance di trading sembrano solide. Ricorda di seguire sempre i principi di gestione del rischio appropriati.

📈 **Prossimi Passi:**
• Continua a seguire il tuo piano di trading
• Usa \`/segnale SIMBOLO\` per nuovi segnali
• Controlla \`/stato\` per la salute del sistema
    `;
    await sendMessage(chatId, message);
  }
  catch (error) {
    console.error("Error getting performance:", error);
    await sendMessage(chatId, "❌ Errore nel recupero dei dati di performance. Riprova.");
  }
}

async function handleSymbolsCommand(chatId: number): Promise<void> {
  const message = `
📊 **Simboli di Trading Supportati**

**💰 Coppie Forex Principali:**
• **EURUSD** - Euro/Dollaro USA ⚡📈🎯
• **GBPUSD** - Sterlina/Dollaro USA ⚡📈🎯
• **USDJPY** - Dollaro USA/Yen Giapponese ⚡📈🎯
• **AUDUSD** - Dollaro Australiano/Dollaro USA 📈🎯
• **USDCAD** - Dollaro USA/Dollaro Canadese 📈🎯
• **USDCHF** - Dollaro USA/Franco Svizzero 📈🎯
• **NZDUSD** - Dollaro Neozelandese/Dollaro USA 📈🎯

**💎 Criptovalute:**
• **BTCUSD** - Bitcoin ⚡📈🎯
• **ETHUSD** - Ethereum ⚡📈🎯

**🏆 Metalli Preziosi:**
• **XAUUSD** - Oro 📈🎯

**🛢️ Materie Prime:**
• **CRUDE** - Petrolio WTI 📈🎯
• **BRENT** - Petrolio Brent 📈🎯

**🎯 Simboli per Strategia:**
⚡ = Eccellente per SCALPING (1-15 min)
📈 = Eccellente per INTRADAY (1-8 ore)  
🎯 = Eccellente per SWING (1-7 giorni)

**Esempi di Uso:**
• \`/scalping BTCUSD\` - Scalping Bitcoin
• \`/intraday EURUSD\` - Intraday Euro
• \`/swing XAUUSD\` - Swing trading Oro
  `;
  await sendMessage(chatId, message);
}

async function handleStrategiesCommand(chatId: number): Promise<void> {
  const message = `
📊 **Guida alle Strategie di Trading**

${getAllTradingModesInfo()}

**🎯 Come Scegliere:**

**Scegli SCALPING se:**
• Puoi monitorare i trade attivamente
• Preferisci profitti veloci
• Hai una connessione internet stabile
• Ti piace il trading ad alta frequenza

**Scegli INTRADAY se:**
• Fai trading part-time
• Vuoi rischio/rendimento bilanciato
• Puoi controllare i trade 2-3 volte al giorno
• Preferisci opportunità a medio termine

**Scegli SWING se:**
• Sei un professionista impegnato
• Preferisci trading hands-off
• Vuoi target di profitto più grandi
• Puoi mantenere posizioni per giorni

**💡 Suggerimenti Pro:**
• Usa \`/impostazioni\` per impostare la tua modalità preferita
• Inizia con INTRADAY per un approccio bilanciato
• Combina strategie per diversificazione
• Segui sempre le regole di gestione del rischio

Pronto per iniziare? Usa \`/segnale SIMBOLO\` per l'analisi!
  `;
  await sendMessage(chatId, message);
}
