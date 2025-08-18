import { api } from "encore.dev/api";
import { analysisDB } from "./db";
import { getAuthData } from "~encore/auth";
import { TradingSignal } from "./predict";

interface ListHistoryResponse {
  signals: TradingSignal[];
}

// Retrieves the trading history for the authenticated user.
export const listHistory = api<void, ListHistoryResponse>({
  auth: true,
  method: "GET",
  path: "/analysis/history",
  expose: true,
}, async () => {
  const auth = getAuthData()!;

  const signals = await analysisDB.queryAll<TradingSignal>`
    SELECT * FROM trading_signals
    WHERE user_id = ${auth.userID}
    ORDER BY created_at DESC
    LIMIT 50
  `;

  return { signals };
});
