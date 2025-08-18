import { cron } from "encore.dev/cron";
import { analysisDB } from "../analysis/db";
import { telegramDB } from "../telegram/db";
import { closeMT5Position } from "../analysis/mt5-bridge";
import { sendMessage } from "../telegram/telegram-client";
import { getMessage } from "../telegram/i18n";

// Runs every minute to check for trades that should be closed before the NY session ends.
export const checkExpiredTrades = cron("check-expired-trades", {
  every: "1m",
  handler: async () => {
    console.log("Scheduler: Checking for expired trades...");

    try {
      const now = new Date();
      const tradesToClose = await analysisDB.queryAll`
        SELECT trade_id, mt5_order_id, user_id
        FROM trading_signals
        WHERE status = 'executed' AND expires_at IS NOT NULL AND expires_at <= ${now}
      `;

      if (tradesToClose.length === 0) {
        console.log("Scheduler: No expired trades to close.");
        return;
      }

      console.log(`Scheduler: Found ${tradesToClose.length} trades to close.`);

      for (const trade of tradesToClose) {
        if (!trade.mt5_order_id) {
          console.log(`Scheduler: Skipping trade ${trade.trade_id}, no MT5 order ID.`);
          continue;
        }

        console.log(`Scheduler: Closing trade ${trade.trade_id} (Order ID: ${trade.mt5_order_id})...`);
        const result = await closeMT5Position(trade.mt5_order_id);

        if (result.success) {
          await analysisDB.exec`
            UPDATE trading_signals
            SET status = 'closed', closed_at = NOW()
            WHERE trade_id = ${trade.trade_id}
          `;
          console.log(`Scheduler: Successfully closed trade ${trade.trade_id}.`);
          
          // Notify user
          const user = await telegramDB.queryRow`SELECT chat_id FROM user_preferences WHERE user_id = ${trade.user_id}`;
          if (user && user.chat_id) {
            const message = getMessage('trade.auto_closed', 'it', { tradeId: trade.trade_id });
            await sendMessage(user.chat_id, message);
          }
        } else {
          console.error(`Scheduler: Failed to close trade ${trade.trade_id}. Error: ${result.error}`);
          // Optionally, notify user of failure to close
        }
      }
    } catch (error) {
      console.error("Scheduler: Error checking for expired trades:", error);
    }
  },
});
