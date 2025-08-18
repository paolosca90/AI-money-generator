import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { telegramDB } from "./db";
import { processMessage, processCallbackQuery } from "./message-processor";
import { setWebhook, getWebhookInfo, deleteWebhook } from "./telegram-client";

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
  error?: string;
  timestamp?: string;
}

interface HealthCheckResponse {
  status: string;
  timestamp: string;
  service: string;
  version: string;
}

interface WebhookConfigRequest {
  webhookUrl: string;
  secretToken?: string;
}

interface WebhookConfigResponse {
  success: boolean;
  message: string;
  webhookInfo?: any;
}

// Handles incoming Telegram webhook updates.
export const webhook = api<TelegramUpdate, WebhookResponse>(
  { expose: true, method: "POST", path: "/telegram/webhook" },
  async (update) => {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    
    try {
      console.log(`[${timestamp}] Received Telegram webhook update:`, JSON.stringify(update, null, 2));
      
      // Validate the update structure
      if (!update || !update.update_id) {
        console.error(`[${timestamp}] Invalid update structure:`, update);
        return { 
          ok: false, 
          error: "Invalid update structure",
          timestamp
        };
      }
      
      if (update.message && update.message.text) {
        const message = update.message;
        const chatId = message.chat.id;
        const userId = message.from.id;
        const text = message.text;

        console.log(`[${timestamp}] Processing message from user ${userId} in chat ${chatId}: ${text}`);

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

        console.log(`[${timestamp}] Processing callback query from user ${userId}: ${callbackData}`);

        if (chatId && callbackData) {
          // Process the callback query
          await processCallbackQuery(chatId, userId, callbackData);
        }
      } else {
        console.log(`[${timestamp}] Received update with no processable content:`, update);
      }

      const processingTime = Date.now() - startTime;
      console.log(`[${timestamp}] Webhook processing completed successfully in ${processingTime}ms`);
      
      return { 
        ok: true,
        timestamp
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(`[${timestamp}] Webhook processing error after ${processingTime}ms:`, error);
      
      // Log detailed error information
      console.error(`[${timestamp}] Error details:`, {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        updateId: update?.update_id,
        processingTime
      });
      
      // Return ok: true to prevent Telegram retries, but log the error
      return { 
        ok: true, 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp
      };
    }
  }
);

// Health check endpoint for webhook testing
export const webhookHealth = api<{}, HealthCheckResponse>(
  { expose: true, method: "GET", path: "/telegram/webhook/health" },
  async () => {
    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "telegram-webhook",
      version: "1.0.0"
    };
  }
);

// Configure webhook endpoint
export const configureWebhook = api<WebhookConfigRequest, WebhookConfigResponse>(
  { expose: true, method: "POST", path: "/telegram/webhook/configure" },
  async (request) => {
    try {
      console.log(`Configuring webhook with URL: ${request.webhookUrl}`);
      
      // Set the webhook
      await setWebhook(request.webhookUrl, {
        secretToken: request.secretToken,
        allowedUpdates: ["message", "callback_query"]
      });
      
      // Get webhook info to confirm
      const webhookInfo = await getWebhookInfo();
      
      console.log("Webhook configured successfully:", webhookInfo);
      
      return {
        success: true,
        message: "Webhook configured successfully",
        webhookInfo
      };
    } catch (error) {
      console.error("Failed to configure webhook:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to configure webhook"
      };
    }
  }
);

// Get webhook info endpoint
export const getWebhookStatus = api<{}, any>(
  { expose: true, method: "GET", path: "/telegram/webhook/info" },
  async () => {
    try {
      const webhookInfo = await getWebhookInfo();
      return {
        success: true,
        webhookInfo
      };
    } catch (error) {
      console.error("Failed to get webhook info:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get webhook info"
      };
    }
  }
);

// Delete webhook endpoint
export const removeWebhook = api<{}, WebhookConfigResponse>(
  { expose: true, method: "POST", path: "/telegram/webhook/remove" },
  async () => {
    try {
      console.log("Removing webhook configuration");
      
      await deleteWebhook();
      
      console.log("Webhook removed successfully");
      
      return {
        success: true,
        message: "Webhook removed successfully"
      };
    } catch (error) {
      console.error("Failed to remove webhook:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to remove webhook"
      };
    }
  }
);

// Simple test endpoint for debugging routing issues
export const testEndpoint = api<{}, { status: string; timestamp: string; path: string }>(
  { expose: true, method: "GET", path: "/telegram/test" },
  async () => {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      path: "/telegram/test"
    };
  }
);

// Root endpoint for the telegram service
export const telegramRoot = api<{}, { service: string; endpoints: string[] }>(
  { expose: true, method: "GET", path: "/telegram" },
  async () => {
    return {
      service: "telegram",
      endpoints: [
        "POST /telegram/webhook - Main webhook endpoint",
        "GET /telegram/webhook/health - Health check",
        "POST /telegram/webhook/configure - Configure webhook",
        "GET /telegram/webhook/info - Get webhook status",
        "POST /telegram/webhook/remove - Remove webhook",
        "GET /telegram/test - Simple test endpoint",
        "GET /telegram - This endpoint"
      ]
    };
  }
);
