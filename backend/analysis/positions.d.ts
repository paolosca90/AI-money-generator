import { MT5Position } from "./mt5-bridge";
interface ListPositionsResponse {
    positions: MT5Position[];
}
export declare const listPositions: () => Promise<ListPositionsResponse>;
export {};
