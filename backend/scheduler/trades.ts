// import { cron } from "encore.dev/crons";
import { analysisDB } from "../analysis/db";
import { telegramDB } from "../telegram/db";
import { closeMT5Position } from "../analysis/mt5-bridge";
import { sendMessage } from "../telegram/telegram-client";
import { getMessage } from "../telegram/i18n";

// Temporarily disabled cron scheduler due to import issues
// TODO: Re-enable when encore.dev/crons is available

export async function checkExpiredTradesFunction() {
  console.log("Scheduler: Checking for expired trades...");

  try {
    const now = new Date();
    
    // Find trades to close based on expiration time or INTRADAY strategy limits
    const tradesToClose = await analysisDB.queryAll`
      SELECT ts.trade_id, ts.mt5_order_id, ts.strategy, ts.executed_at, ts.expires_at,
             ui.user_id, ui.chat_id
      FROM trading_signals ts
      LEFT JOIN user_interactions ui ON ui.user_id::text = ts.trade_id
      WHERE ts.status = 'executed' 
      AND (
        (ts.expires_at IS NOT NULL AND ts.expires_at <= ${now})
        OR 
        (ts.strategy = 'INTRADAY' AND ts.executed_at <= ${new Date(now.getTime() - 6 * 60 * 60 * 1000)})
      )
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

      const reason = trade.expires_at && trade.expires_at <= now 
        ? "expiration time reached" 
        : "INTRADAY 6-hour limit reached";

      console.log(`Scheduler: Closing trade ${trade.trade_id} (Order ID: ${trade.mt5_order_id}) - ${reason}...`);
      const result = await closeMT5Position(trade.mt5_order_id);

      if (result.success) {
        await analysisDB.exec`
          UPDATE trading_signals
          SET status = 'closed', closed_at = NOW()
          WHERE trade_id = ${trade.trade_id}
        `;
        console.log(`Scheduler: Successfully closed trade ${trade.trade_id}.`);
        
        // Notify user with reason
        if (trade.chat_id) {
          const message = trade.strategy === 'INTRADAY' 
            ? `🔄 **Trade Auto-Chiuso (INTRADAY)**\n\nIl trade ${trade.trade_id} è stato chiuso automaticamente dopo 6 ore per rispettare la strategia INTRADAY e evitare il rischio overnight.`
            : getMessage('trade.auto_closed', 'it', { tradeId: trade.trade_id });
          await sendMessage(trade.chat_id, message);
        }
      } else {
        console.error(`Scheduler: Failed to close trade ${trade.trade_id}. Error: ${result.error}`);
        // Optionally, notify user of failure to close
      }
    }
  } catch (error) {
    console.error("Scheduler: Error checking for expired trades:", error);
  }
}

/*
// Original cron function - commented out
export const checkExpiredTrades = cron("check-expired-trades", {
  every: "1m",
  handler: checkExpiredTradesFunction
});
*/
