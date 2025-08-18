import { api, APIError } from "encore.dev/api";
import { closeMT5Position } from "./mt5-bridge";
import { analysisDB } from "./db";

interface ClosePositionRequest {
  ticket: number;
}

interface ClosePositionResponse {
  success: boolean;
  closedPrice?: number;
  profit?: number;
  error?: string;
}

// Closes an open position on MetaTrader 5.
export const closePosition = api<ClosePositionRequest, ClosePositionResponse>(
  { 
    expose: true, 
    method: "POST", 
    path: "/analysis/close-position"
  },
  async (req) => {
    const { ticket } = req;

    if (!ticket || ticket <= 0) {
      throw APIError.invalidArgument("Valid ticket number is required");
    }

    try {
      console.log(`Attempting to close position ${ticket}`);

      // Use your actual VPS MT5 config
      const mt5Config = {
        host: "154.61.187.189", // Your actual VPS IP
        port: 8080,
        login: "6001637", // Your actual MT5 account
        server: "PureMGlobal-MT5", // Your actual server
        password: "demo"
      };

      // Close the position on MT5
      const result = await closeMT5Position(ticket, mt5Config);

      if (result.success) {
        console.log(`✅ Successfully closed position ${ticket}`);
        
        // Try to update the corresponding trading signal in database
        try {
          await analysisDB.exec`
            UPDATE trading_signals 
            SET status = 'closed', closed_at = NOW()
            WHERE mt5_order_id = ${ticket} AND status = 'executed'
          `;
          console.log(`Updated trading signal for MT5 order ${ticket}`);
        } catch (dbError) {
          console.error(`Failed to update trading signal for ${ticket}:`, dbError);
          // Don't fail the entire operation if DB update fails
        }

        return {
          success: true,
          closedPrice: result.executionPrice,
          profit: 0, // MT5 will calculate the actual profit
        };
      } else {
        console.error(`❌ Failed to close position ${ticket}: ${result.error}`);
        return {
          success: false,
          error: result.error || "Failed to close position on MT5",
        };
      }
    } catch (error) {
      console.error(`Error closing position ${ticket}:`, error);
      
      if (error && typeof error === 'object' && 'code' in error) {
        throw error;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw APIError.internal(`Failed to close position: ${errorMessage}`);
    }
  }
);
