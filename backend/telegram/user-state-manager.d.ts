import { TradingStrategy } from "../analysis/trading-strategies";
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
export declare const USER_STATES: {
    readonly SELECTING_TRADING_MODE: "SELECTING_TRADING_MODE";
    readonly SETTING_RISK_AMOUNT: "SETTING_RISK_AMOUNT";
    readonly SETTING_ACCOUNT_BALANCE: "SETTING_ACCOUNT_BALANCE";
    readonly READY_TO_TRADE: "READY_TO_TRADE";
};
export declare function getUserPreferences(userId: number): Promise<UserPreferences | null>;
export declare function setUserPreferences(preferences: UserPreferences): Promise<void>;
export declare function getUserState(userId: number): Promise<UserState | null>;
export declare function setUserState(userId: number, chatId: number, state: string, stateData?: any): Promise<void>;
export declare function clearUserState(userId: number): Promise<void>;
export declare function getTradingModeInfo(mode: TradingStrategy): string;
export declare function getAllTradingModesInfo(): string;
