import { secret } from "encore.dev/config";

const telegramBotToken = secret("TelegramBotToken");

interface SendMessageResponse {
  ok: boolean;
  result?: any;
  description?: string;
}

export async function sendMessage(chatId: number, text: string): Promise<void> {
  const url = `https://api.telegram.org/bot${telegramBotToken()}/sendMessage`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: "Markdown",
    }),
  });

  const result: SendMessageResponse = await response.json();
  
  if (!result.ok) {
    console.error("Failed to send Telegram message:", result.description);
    throw new Error(`Telegram API error: ${result.description}`);
  }
}

export async function sendPhoto(chatId: number, photoUrl: string, caption?: string): Promise<void> {
  const url = `https://api.telegram.org/bot${telegramBotToken()}/sendPhoto`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      photo: photoUrl,
      caption: caption,
      parse_mode: "Markdown",
    }),
  });

  const result: SendMessageResponse = await response.json();
  
  if (!result.ok) {
    console.error("Failed to send Telegram photo:", result.description);
    throw new Error(`Telegram API error: ${result.description}`);
  }
}

export async function setWebhook(webhookUrl: string): Promise<void> {
  const url = `https://api.telegram.org/bot${telegramBotToken()}/setWebhook`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: webhookUrl,
    }),
  });

  const result: SendMessageResponse = await response.json();
  
  if (!result.ok) {
    console.error("Failed to set Telegram webhook:", result.description);
    throw new Error(`Telegram API error: ${result.description}`);
  }
}
