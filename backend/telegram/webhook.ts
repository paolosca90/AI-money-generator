import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { telegramDB } from "./db";
import { processMessage } from "./message-processor";

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
}

interface WebhookResponse {
  ok: boolean;
}

// Handles incoming Telegram webhook updates.
export const webhook = api<TelegramUpdate, WebhookResponse>(
  { expose: true, method: "POST", path: "/telegram/webhook" },
  async (update) => {
    if (!update.message || !update.message.text) {
      return { ok: true };
    }

    const message = update.message;
    const chatId = message.chat.id;
    const userId = message.from.id;
    const text = message.text;

    // Store user interaction
    await telegramDB.exec`
      INSERT INTO user_interactions (user_id, chat_id, message_text, created_at)
      VALUES (${userId}, ${chatId}, ${text}, NOW())
    `;

    // Process the message
    await processMessage(chatId, userId, text);

    return { ok: true };
  }
);
