import { telegramDB } from "./db";
import { TradingStrategy, TRADING_STRATEGIES } from "../analysis/trading-strategies";

export interface UserPreferences {
  userId: number;
  chatId: number;
  tradingMode?: TradingStrategy;
  riskPercentage: number;
  accountBalance?: number;
  accountCurrency: string;
}

export interface UserState {
  userId: number;
  chatId: number;
  currentState: string;
  stateData: any;
}

export const USER_STATES = {
  SELECTING_TRADING_MODE: 'SELECTING_TRADING_MODE',
  SETTING_RISK_AMOUNT: 'SETTING_RISK_AMOUNT',
  SETTING_ACCOUNT_BALANCE: 'SETTING_ACCOUNT_BALANCE',
  READY_TO_TRADE: 'READY_TO_TRADE'
} as const;

export async function getUserPreferences(userId: number): Promise<UserPreferences | null> {
  const result = await telegramDB.queryRow`
    SELECT user_id, chat_id, trading_mode, risk_percentage, account_balance, account_currency
    FROM user_preferences
    WHERE user_id = ${userId}
  `;
  
  if (!result) return null;
  
  return {
    userId: Number(result.user_id),
    chatId: Number(result.chat_id),
    tradingMode: result.trading_mode as TradingStrategy,
    riskPercentage: Number(result.risk_percentage) || 2.0,
    accountBalance: result.account_balance ? Number(result.account_balance) : undefined,
    accountCurrency: result.account_currency || 'USD'
  };
}

export async function setUserPreferences(preferences: UserPreferences): Promise<void> {
  await telegramDB.exec`
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

export async function getUserState(userId: number): Promise<UserState | null> {
  const result = await telegramDB.queryRow`
    SELECT user_id, chat_id, current_state, state_data
    FROM user_states
    WHERE user_id = ${userId}
  `;
  
  if (!result) return null;
  
  return {
    userId: Number(result.user_id),
    chatId: Number(result.chat_id),
    currentState: result.current_state,
    stateData: result.state_data || {}
  };
}

export async function setUserState(userId: number, chatId: number, state: string, stateData: any = {}): Promise<void> {
  await telegramDB.exec`
    INSERT INTO user_states (user_id, chat_id, current_state, state_data, updated_at)
    VALUES (${userId}, ${chatId}, ${state}, ${JSON.stringify(stateData)}, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      chat_id = EXCLUDED.chat_id,
      current_state = EXCLUDED.current_state,
      state_data = EXCLUDED.state_data,
      updated_at = EXCLUDED.updated_at
  `;
}

export async function clearUserState(userId: number): Promise<void> {
  await telegramDB.exec`
    DELETE FROM user_states WHERE user_id = ${userId}
  `;
}

export function getTradingModeInfo(mode: TradingStrategy): string {
  const config = TRADING_STRATEGIES[mode];
  
  return `
**${config.name}** (${mode})
📊 **Description:** ${config.description}
⏱️ **Timeframe:** ${config.timeframes.join(', ')}
🎯 **Risk/Reward:** 1:${config.riskRewardRatio}
🛡️ **Stop Loss:** ${config.stopLossMultiplier}x ATR
💰 **Take Profit:** ${config.takeProfitMultiplier}x ATR
⏰ **Max Hold:** ${config.maxHoldingTime}h
✅ **Min Confidence:** ${config.minConfidence}%
📈 **Max Position:** ${config.maxLotSize} lots
`;
}

export function getAllTradingModesInfo(): string {
  let info = "🎯 **Available Trading Modes:**\n\n";
  
  const modes: TradingStrategy[] = ['SCALPING', 'INTRADAY', 'SWING'];
  
  modes.forEach((mode, index) => {
    const config = TRADING_STRATEGIES[mode];
    const emoji = mode === 'SCALPING' ? '⚡' : mode === 'INTRADAY' ? '📈' : '🎯';
    
    info += `${emoji} **${index + 1}. ${config.name}**\n`;
    info += `• Timeframe: ${config.timeframes.join(', ')}\n`;
    info += `• Risk/Reward: 1:${config.riskRewardRatio}\n`;
    info += `• Max Hold: ${config.maxHoldingTime}h\n`;
    info += `• Min Confidence: ${config.minConfidence}%\n\n`;
  });
  
  return info;
}