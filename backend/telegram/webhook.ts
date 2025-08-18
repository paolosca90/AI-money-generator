import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { telegramDB } from "./db";
import { processMessage, processCallbackQuery } from "./message-processor";

const telegramBotToken = secret("TelegramBotToken");

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    date: number;
    text?: string;
  };
  callback_query?: {
    id: string;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username?: string;
    };
    message?: {
      message_id: number;
      chat: {
        id: number;
        type: string;
      };
      date: number;
    };
    data?: string;
  };
}

interface WebhookResponse {
  ok: boolean;
}

// Handles incoming Telegram webhook updates.
export const webhook = api<TelegramUpdate, WebhookResponse>(
  { expose: true, method: "POST", path: "/telegram/webhook" },
  async (update) => {
    try {
      console.log("Received Telegram update:", JSON.stringify(update, null, 2));
      
      if (update.message && update.message.text) {
        const message = update.message;
        const chatId = message.chat.id;
        const userId = message.from.id;
        const text = message.text;

        console.log(`Processing message from user ${userId} in chat ${chatId}: ${text}`);

        // Store user interaction
        await telegramDB.exec`
          INSERT INTO user_interactions (user_id, chat_id, message_text, created_at)
          VALUES (${userId}, ${chatId}, ${text}, NOW())
        `;

        // Process the message
        if (text) {
          await processMessage(chatId, userId, text);
        }
      } else if (update.callback_query) {
        const callbackQuery = update.callback_query;
        const chatId = callbackQuery.message?.chat.id;
        const userId = callbackQuery.from.id;
        const callbackData = callbackQuery.data;

        console.log(`Processing callback query from user ${userId}: ${callbackData}`);

        if (chatId && callbackData) {
          // Process the callback query
          await processCallbackQuery(chatId, userId, callbackData);
        }
      }

      return { ok: true };
    } catch (error) {
      console.error("Webhook processing error:", error);
      return { ok: true }; // Always return ok to prevent Telegram retries
    }
  }
);
