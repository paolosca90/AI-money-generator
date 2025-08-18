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
  processing_time?: number;
}

interface HealthCheckResponse {
  status: string;
  timestamp: string;
  service: string;
  version: string;
  uptime: number;
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

interface WebhookStatusResponse {
  success: boolean;
  webhookInfo?: any;
  error?: string;
}

interface ServiceInfoResponse {
  service: string;
  endpoints: string[];
  timestamp: string;
}

interface TestEndpointResponse {
  status: string;
  timestamp: string;
  path: string;
  method: string;
}

// Enhanced main webhook endpoint with comprehensive error handling and logging
export const webhook = api<TelegramUpdate, WebhookResponse>(
  { expose: true, method: "POST", path: "/telegram/webhook" },
  async (update) => {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    
    try {
      console.log(`[${timestamp}] 🔄 Received Telegram webhook update:`, JSON.stringify(update, null, 2));
      
      // Enhanced validation with detailed error reporting
      if (!update) {
        const error = "Update object is null or undefined";
        console.error(`[${timestamp}] ❌ Validation error: ${error}`);
        return { 
          ok: false, 
          error,
          timestamp,
          processing_time: Date.now() - startTime
        };
      }

      if (typeof update.update_id === 'undefined' || update.update_id === null) {
        const error = "Missing or invalid update_id";
        console.error(`[${timestamp}] ❌ Validation error: ${error}`, update);
        return { 
          ok: false, 
          error,
          timestamp,
          processing_time: Date.now() - startTime
        };
      }
      
      console.log(`[${timestamp}] ✅ Update validation passed for update_id: ${update.update_id}`);
      
      // Process message updates
      if (update.message && update.message.text) {
        const message = update.message;
        const chatId = message.chat.id;
        const userId = message.from.id;
        const text = message.text;

        console.log(`[${timestamp}] 📨 Processing message from user ${userId} in chat ${chatId}: "${text}"`);

        try {
          // Store user interaction with error handling
          await telegramDB.exec`
            INSERT INTO user_interactions (user_id, chat_id, message_text, created_at)
            VALUES (${userId}, ${chatId}, ${text}, NOW())
          `;
          console.log(`[${timestamp}] 💾 User interaction stored successfully`);
        } catch (dbError) {
          console.error(`[${timestamp}] ⚠️ Database storage failed:`, dbError);
          // Continue processing even if DB storage fails
        }

        // Process the message with error handling
        try {
          await processMessage(chatId, userId, text);
          console.log(`[${timestamp}] ✅ Message processed successfully`);
        } catch (processError) {
          console.error(`[${timestamp}] ❌ Message processing failed:`, processError);
          // Return success to prevent Telegram retries, but log the error
        }
      } 
      // Process callback query updates
      else if (update.callback_query) {
        const callbackQuery = update.callback_query;
        const chatId = callbackQuery.message?.chat.id;
        const userId = callbackQuery.from.id;
        const callbackData = callbackQuery.data;

        console.log(`[${timestamp}] 🔘 Processing callback query from user ${userId}: "${callbackData}"`);

        if (chatId && callbackData) {
          try {
            await processCallbackQuery(chatId, userId, callbackData);
            console.log(`[${timestamp}] ✅ Callback query processed successfully`);
          } catch (processError) {
            console.error(`[${timestamp}] ❌ Callback query processing failed:`, processError);
            // Return success to prevent Telegram retries, but log the error
          }
        } else {
          console.log(`[${timestamp}] ⚠️ Callback query missing required data - chatId: ${chatId}, data: ${callbackData}`);
        }
      } 
      // Handle updates with no processable content
      else {
        console.log(`[${timestamp}] ℹ️ Received update with no processable content (no message text or callback query):`, {
          update_id: update.update_id,
          has_message: !!update.message,
          has_callback_query: !!update.callback_query,
          message_text: update.message?.text
        });
      }

      const processingTime = Date.now() - startTime;
      console.log(`[${timestamp}] 🎉 Webhook processing completed successfully in ${processingTime}ms`);
      
      return { 
        ok: true,
        timestamp,
        processing_time: processingTime
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(`[${timestamp}] 💥 Webhook processing error after ${processingTime}ms:`, error);
      
      // Log comprehensive error information
      const errorInfo = {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        updateId: update?.update_id,
        processingTime,
        timestamp
      };
      console.error(`[${timestamp}] 📋 Error details:`, errorInfo);
      
      // Always return ok: true to prevent Telegram retries for application errors
      return { 
        ok: true, 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp,
        processing_time: processingTime
      };
    }
  }
);

// Enhanced health check endpoint
export const webhookHealth = api<{}, HealthCheckResponse>(
  { expose: true, method: "GET", path: "/telegram/webhook/health" },
  async () => {
    const timestamp = new Date().toISOString();
    const uptime = process.uptime();
    
    console.log(`[${timestamp}] 🏥 Health check requested - uptime: ${uptime}s`);
    
    return {
      status: "healthy",
      timestamp,
      service: "telegram-webhook",
      version: "2.0.0",
      uptime
    };
  }
);

// Configure webhook endpoint with enhanced error handling
export const configureWebhook = api<WebhookConfigRequest, WebhookConfigResponse>(
  { expose: true, method: "POST", path: "/telegram/webhook/configure" },
  async (request) => {
    const timestamp = new Date().toISOString();
    
    try {
      console.log(`[${timestamp}] 🔧 Configuring webhook with URL: ${request.webhookUrl}`);
      
      // Validate webhook URL
      if (!request.webhookUrl || !request.webhookUrl.startsWith('https://')) {
        throw new Error('Webhook URL must be a valid HTTPS URL');
      }
      
      // Set the webhook with enhanced options
      await setWebhook(request.webhookUrl, {
        secretToken: request.secretToken,
        allowedUpdates: ["message", "callback_query"],
        maxConnections: 40
      });
      
      // Get webhook info to confirm configuration
      const webhookInfo = await getWebhookInfo();
      
      console.log(`[${timestamp}] ✅ Webhook configured successfully:`, webhookInfo);
      
      return {
        success: true,
        message: "Webhook configured successfully",
        webhookInfo
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to configure webhook";
      console.error(`[${timestamp}] ❌ Webhook configuration failed:`, error);
      
      return {
        success: false,
        message: errorMessage
      };
    }
  }
);

// Get webhook status endpoint
export const getWebhookStatus = api<{}, WebhookStatusResponse>(
  { expose: true, method: "GET", path: "/telegram/webhook/info" },
  async () => {
    const timestamp = new Date().toISOString();
    
    try {
      console.log(`[${timestamp}] 📊 Getting webhook status...`);
      
      const webhookInfo = await getWebhookInfo();
      
      console.log(`[${timestamp}] ✅ Webhook status retrieved:`, webhookInfo);
      
      return {
        success: true,
        webhookInfo
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to get webhook info";
      console.error(`[${timestamp}] ❌ Failed to get webhook info:`, error);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }
);

// Remove webhook endpoint
export const removeWebhook = api<{}, WebhookConfigResponse>(
  { expose: true, method: "POST", path: "/telegram/webhook/remove" },
  async () => {
    const timestamp = new Date().toISOString();
    
    try {
      console.log(`[${timestamp}] 🗑️ Removing webhook configuration...`);
      
      await deleteWebhook();
      
      console.log(`[${timestamp}] ✅ Webhook removed successfully`);
      
      return {
        success: true,
        message: "Webhook removed successfully"
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to remove webhook";
      console.error(`[${timestamp}] ❌ Failed to remove webhook:`, error);
      
      return {
        success: false,
        message: errorMessage
      };
    }
  }
);

// Simple test endpoint for debugging routing issues
export const testEndpoint = api<{}, TestEndpointResponse>(
  { expose: true, method: "GET", path: "/telegram/test" },
  async () => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 🧪 Test endpoint accessed`);
    
    return {
      status: "ok",
      timestamp,
      path: "/telegram/test",
      method: "GET"
    };
  }
);

// Root endpoint for the telegram service with comprehensive endpoint listing
export const telegramRoot = api<{}, ServiceInfoResponse>(
  { expose: true, method: "GET", path: "/telegram" },
  async () => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 📋 Service info requested`);
    
    return {
      service: "telegram",
      timestamp,
      endpoints: [
        "POST /telegram/webhook - Main webhook endpoint for Telegram updates",
        "GET /telegram/webhook/health - Health check endpoint",
        "POST /telegram/webhook/configure - Configure webhook URL",
        "GET /telegram/webhook/info - Get current webhook status",
        "POST /telegram/webhook/remove - Remove webhook configuration",
        "GET /telegram/test - Simple test endpoint for connectivity",
        "GET /telegram - This service info endpoint"
      ]
    };
  }
);

// Additional debugging endpoint for webhook testing
export const webhookTest = api<TelegramUpdate, WebhookResponse>(
  { expose: true, method: "POST", path: "/telegram/webhook/test" },
  async (update) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 🧪 Test webhook called with update:`, update);
    
    return {
      ok: true,
      timestamp,
      processing_time: 0
    };
  }
);
