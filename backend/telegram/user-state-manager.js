import { telegramDB } from "./db";
import { TRADING_STRATEGIES } from "../analysis/trading-strategies";
export const USER_STATES = {
    SELECTING_TRADING_MODE: 'SELECTING_TRADING_MODE',
    SETTING_RISK_AMOUNT: 'SETTING_RISK_AMOUNT',
    SETTING_ACCOUNT_BALANCE: 'SETTING_ACCOUNT_BALANCE',
    READY_TO_TRADE: 'READY_TO_TRADE'
};
export async function getUserPreferences(userId) {
    const result = await telegramDB.queryRow `
    SELECT user_id, chat_id, trading_mode, risk_percentage, account_balance, account_currency
    FROM user_preferences
    WHERE user_id = ${userId}
  `;
    if (!result)
        return null;
    return {
        userId: Number(result.user_id),
        chatId: Number(result.chat_id),
        tradingMode: result.trading_mode,
        riskPercentage: Number(result.risk_percentage) || 2.0,
        accountBalance: result.account_balance ? Number(result.account_balance) : undefined,
        accountCurrency: result.account_currency || 'USD'
    };
}
export async function setUserPreferences(preferences) {
    await telegramDB.exec `
    INSERT INTO user_preferences (user_id, chat_id, trading_mode, risk_percentage, account_balance, account_currency, updated_at)
    VALUES (${preferences.userId}, ${preferences.chatId}, ${preferences.tradingMode}, ${preferences.riskPercentage}, ${preferences.accountBalance}, ${preferences.accountCurrency}, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      chat_id = EXCLUDED.chat_id,
      trading_mode = EXCLUDED.trading_mode,
      risk_percentage = EXCLUDED.risk_percentage,
      account_balance = EXCLUDED.account_balance,
      account_currency = EXCLUDED.account_currency,
      updated_at = EXCLUDED.updated_at
  `;
}
export async function getUserState(userId) {
    const result = await telegramDB.queryRow `
    SELECT user_id, chat_id, current_state, state_data
    FROM user_states
    WHERE user_id = ${userId}
  `;
    if (!result)
        return null;
    return {
        userId: Number(result.user_id),
        chatId: Number(result.chat_id),
        currentState: result.current_state,
        stateData: result.state_data || {}
    };
}
export async function setUserState(userId, chatId, state, stateData = {}) {
    await telegramDB.exec `
    INSERT INTO user_states (user_id, chat_id, current_state, state_data, updated_at)
    VALUES (${userId}, ${chatId}, ${state}, ${JSON.stringify(stateData)}, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      chat_id = EXCLUDED.chat_id,
      current_state = EXCLUDED.current_state,
      state_data = EXCLUDED.state_data,
      updated_at = EXCLUDED.updated_at
  `;
}
export async function clearUserState(userId) {
    await telegramDB.exec `
    DELETE FROM user_states WHERE user_id = ${userId}
  `;
}
export function getTradingModeInfo(mode) {
    const config = TRADING_STRATEGIES[mode];
    return `
**${config.name}** (${mode})
📊 **Descrizione:** ${config.description}
⏱️ **Timeframe:** ${config.timeframes.join(', ')}
🎯 **Rischio/Rendimento:** 1:${config.riskRewardRatio}
🛡️ **Stop Loss:** ${config.stopLossMultiplier}x ATR
💰 **Take Profit:** ${config.takeProfitMultiplier}x ATR
⏰ **Durata Max:** ${config.maxHoldingTime}h
✅ **Confidenza Min:** ${config.minConfidence}%
📈 **Posizione Max:** ${config.maxLotSize} lotti
`;
}
export function getAllTradingModesInfo() {
    let info = "🎯 **Modalità di Trading Disponibili:**\n\n";
    const modes = ['SCALPING', 'INTRADAY', 'SWING'];
    modes.forEach((mode, index) => {
        const config = TRADING_STRATEGIES[mode];
        const emoji = mode === 'SCALPING' ? '⚡' : mode === 'INTRADAY' ? '📈' : '🎯';
        info += `${emoji} **${index + 1}. ${config.name}**\n`;
        info += `• Timeframe: ${config.timeframes.join(', ')}\n`;
        info += `• Rischio/Rendimento: 1:${config.riskRewardRatio}\n`;
        info += `• Durata Max: ${config.maxHoldingTime}h\n`;
        info += `• Confidenza Min: ${config.minConfidence}%\n\n`;
    });
    return info;
}
//# sourceMappingURL=user-state-manager.js.map