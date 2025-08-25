import { TradingSignal } from "./signal-generator";
interface ListHistoryResponse {
    signals: TradingSignal[];
}
export declare const listHistory: () => Promise<ListHistoryResponse>;
export {};
