import { secret } from "encore.dev/config";

const telegramBotToken = secret("TelegramBotToken");

interface SendMessageResponse {
  ok: boolean;
  result?: any;
  description?: string;
}

interface TelegramFile {
  file_id: string;
  file_unique_id: string;
  file_size?: number;
  file_path?: string;
}

export async function sendMessage(chatId: number, text: string, options?: {
  parseMode?: "Markdown" | "HTML";
  disableWebPagePreview?: boolean;
  replyMarkup?: any;
}): Promise<void> {
  const url = `https://api.telegram.org/bot${telegramBotToken()}/sendMessage`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: options?.parseMode || "Markdown",
      disable_web_page_preview: options?.disableWebPagePreview || false,
      reply_markup: options?.replyMarkup,
    }),
  });

  const result: SendMessageResponse = await response.json();
  
  if (!result.ok) {
    console.error("Failed to send Telegram message:", result.description);
    throw new Error(`Telegram API error: ${result.description}`);
  }
}

export async function sendPhoto(chatId: number, photoUrl: string, caption?: string, options?: {
  parseMode?: "Markdown" | "HTML";
  replyMarkup?: any;
}): Promise<void> {
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
      parse_mode: options?.parseMode || "Markdown",
      reply_markup: options?.replyMarkup,
    }),
  });

  const result: SendMessageResponse = await response.json();
  
  if (!result.ok) {
    console.error("Failed to send Telegram photo:", result.description);
    throw new Error(`Telegram API error: ${result.description}`);
  }
}

export async function sendDocument(chatId: number, documentUrl: string, caption?: string): Promise<void> {
  const url = `https://api.telegram.org/bot${telegramBotToken()}/sendDocument`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      document: documentUrl,
      caption: caption,
      parse_mode: "Markdown",
    }),
  });

  const result: SendMessageResponse = await response.json();
  
  if (!result.ok) {
    console.error("Failed to send Telegram document:", result.description);
    throw new Error(`Telegram API error: ${result.description}`);
  }
}

export async function editMessage(chatId: number, messageId: number, text: string, options?: {
  parseMode?: "Markdown" | "HTML";
  replyMarkup?: any;
}): Promise<void> {
  const url = `https://api.telegram.org/bot${telegramBotToken()}/editMessageText`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text: text,
      parse_mode: options?.parseMode || "Markdown",
      reply_markup: options?.replyMarkup,
    }),
  });

  const result: SendMessageResponse = await response.json();
  
  if (!result.ok) {
    console.error("Failed to edit Telegram message:", result.description);
    throw new Error(`Telegram API error: ${result.description}`);
  }
}

export async function setWebhook(webhookUrl: string, options?: {
  maxConnections?: number;
  allowedUpdates?: string[];
  secretToken?: string;
}): Promise<void> {
  const url = `https://api.telegram.org/bot${telegramBotToken()}/setWebhook`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: webhookUrl,
      max_connections: options?.maxConnections || 40,
      allowed_updates: options?.allowedUpdates || ["message", "callback_query"],
      secret_token: options?.secretToken,
    }),
  });

  const result: SendMessageResponse = await response.json();
  
  if (!result.ok) {
    console.error("Failed to set Telegram webhook:", result.description);
    throw new Error(`Telegram API error: ${result.description}`);
  }
}

export async function deleteWebhook(): Promise<void> {
  const url = `https://api.telegram.org/bot${telegramBotToken()}/deleteWebhook`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const result: SendMessageResponse = await response.json();
  
  if (!result.ok) {
    console.error("Failed to delete Telegram webhook:", result.description);
    throw new Error(`Telegram API error: ${result.description}`);
  }
}

export async function getWebhookInfo(): Promise<any> {
  const url = `https://api.telegram.org/bot${telegramBotToken()}/getWebhookInfo`;
  
  const response = await fetch(url, {
    method: "GET",
  });

  const result: SendMessageResponse = await response.json();
  
  if (!result.ok) {
    console.error("Failed to get webhook info:", result.description);
    throw new Error(`Telegram API error: ${result.description}`);
  }

  return result.result;
}

export async function getFile(fileId: string): Promise<TelegramFile | null> {
  const url = `https://api.telegram.org/bot${telegramBotToken()}/getFile`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      file_id: fileId,
    }),
  });

  const result: SendMessageResponse = await response.json();
  
  if (!result.ok) {
    console.error("Failed to get file info:", result.description);
    return null;
  }

  return result.result;
}

export async function downloadFile(filePath: string): Promise<Buffer | null> {
  try {
    const url = `https://api.telegram.org/file/bot${telegramBotToken()}/${filePath}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error("Failed to download file:", response.statusText);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error("Error downloading file:", error);
    return null;
  }
}

// Utility function to create inline keyboard
export function createInlineKeyboard(buttons: Array<Array<{text: string, callback_data?: string, url?: string}>>): any {
  return {
    inline_keyboard: buttons
  };
}

// Utility function to create reply keyboard
export function createReplyKeyboard(buttons: Array<Array<string>>, options?: {
  resize_keyboard?: boolean;
  one_time_keyboard?: boolean;
  selective?: boolean;
}): any {
  return {
    keyboard: buttons.map(row => row.map(text => ({ text }))),
    resize_keyboard: options?.resize_keyboard ?? true,
    one_time_keyboard: options?.one_time_keyboard ?? false,
    selective: options?.selective ?? false,
  };
}

// Utility function to remove keyboard
export function removeKeyboard(): any {
  return {
    remove_keyboard: true
  };
}
