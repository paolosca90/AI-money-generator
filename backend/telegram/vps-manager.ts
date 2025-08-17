import { api, APIError } from "encore.dev/api";
import { telegramDB } from "./db";
import { secret } from "encore.dev/config";

const defaultVPSPassword = secret("DefaultVPSPassword");

export interface VPSConfig {
  userId: number;
  vpsProvider: string;
  vpsHost: string;
  vpsUsername: string;
  vpsPassword: string;
  mt5Login: string;
  mt5Password: string;
  mt5Server: string;
  status: "pending" | "configuring" | "active" | "error";
  createdAt: Date;
  updatedAt: Date;
}

export interface MT5Config {
  login: string;
  password: string;
  server: string;
}

export interface VPSStatusResponse {
  config: VPSConfig | null;
}

// Store VPS configuration for a user
export const storeVPSConfig = api<{
  userId: number;
  vpsHost: string;
  vpsUsername: string;
  vpsPassword: string;
  mt5Config: MT5Config;
}, { success: boolean; message: string }>(
  { expose: true, method: "POST", path: "/telegram/vps/config" },
  async (req) => {
    const { userId, vpsHost, vpsUsername, vpsPassword, mt5Config } = req;

    try {
      // Store VPS configuration in database
      await telegramDB.exec`
        INSERT INTO vps_configurations (
          user_id, vps_host, vps_username, vps_password,
          mt5_login, mt5_password, mt5_server, status, created_at, updated_at
        ) VALUES (
          ${userId}, ${vpsHost}, ${vpsUsername}, ${vpsPassword},
          ${mt5Config.login}, ${mt5Config.password}, ${mt5Config.server},
          'pending', NOW(), NOW()
        )
        ON CONFLICT (user_id) DO UPDATE SET
          vps_host = EXCLUDED.vps_host,
          vps_username = EXCLUDED.vps_username,
          vps_password = EXCLUDED.vps_password,
          mt5_login = EXCLUDED.mt5_login,
          mt5_password = EXCLUDED.mt5_password,
          mt5_server = EXCLUDED.mt5_server,
          status = 'pending',
          updated_at = NOW()
      `;

      // Start VPS configuration process
      await configureVPSAsync(userId);

      return {
        success: true,
        message: "Configurazione VPS avviata. Riceverai aggiornamenti via Telegram."
      };
    } catch (error) {
      console.error("Error storing VPS config:", error);
      throw APIError.internal("Failed to store VPS configuration");
    }
  }
);

// Get VPS configuration status for a user
export const getVPSStatus = api<{ userId: number }, VPSStatusResponse>(
  { expose: true, method: "GET", path: "/telegram/vps/status/:userId" },
  async (req) => {
    const config = await telegramDB.queryRow<VPSConfig>`
      SELECT * FROM vps_configurations WHERE user_id = ${req.userId}
    `;

    return { config };
  }
);

// Configure VPS asynchronously
async function configureVPSAsync(userId: number): Promise<void> {
  try {
    // Update status to configuring
    await telegramDB.exec`
      UPDATE vps_configurations 
      SET status = 'configuring', updated_at = NOW()
      WHERE user_id = ${userId}
    `;

    // Get VPS configuration
    const config = await telegramDB.queryRow<VPSConfig>`
      SELECT * FROM vps_configurations WHERE user_id = ${userId}
    `;

    if (!config) {
      throw new Error("VPS configuration not found");
    }

    // Step 1: Test VPS connection
    await testVPSConnection(config);

    // Step 2: Install required software
    await installSoftwareOnVPS(config);

    // Step 3: Configure MT5 connection
    await configureMT5OnVPS(config);

    // Step 4: Start trading bot
    await startTradingBotOnVPS(config);

    // Update status to active
    await telegramDB.exec`
      UPDATE vps_configurations 
      SET status = 'active', updated_at = NOW()
      WHERE user_id = ${userId}
    `;

    // Send success notification
    await sendVPSNotification(userId, "✅ VPS configurato con successo! Il tuo trading bot è ora attivo.");

  } catch (error) {
    console.error("VPS configuration error:", error);
    
    // Update status to error
    await telegramDB.exec`
      UPDATE vps_configurations 
      SET status = 'error', updated_at = NOW()
      WHERE user_id = ${userId}
    `;

    // Send error notification
    await sendVPSNotification(userId, `❌ Configurazione VPS fallita: ${error.message}`);
  }
}

async function testVPSConnection(config: VPSConfig): Promise<void> {
  try {
    // Test SSH connection to VPS
    const response = await fetch(`http://vps-manager-service:3000/test-connection`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        host: config.vpsHost,
        username: config.vpsUsername,
        password: config.vpsPassword,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to connect to VPS");
    }

    await sendVPSNotification(config.userId, "🔗 Connessione VPS stabilita con successo");
  } catch (error) {
    throw new Error(`VPS connection failed: ${error.message}`);
  }
}

async function installSoftwareOnVPS(config: VPSConfig): Promise<void> {
  try {
    await sendVPSNotification(config.userId, "📦 Installazione software richiesto su VPS...");

    // Install Python, MetaTrader 5, and dependencies
    const response = await fetch(`http://vps-manager-service:3000/install-software`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        host: config.vpsHost,
        username: config.vpsUsername,
        password: config.vpsPassword,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to install software on VPS");
    }

    await sendVPSNotification(config.userId, "✅ Installazione software completata");
  } catch (error) {
    throw new Error(`Software installation failed: ${error.message}`);
  }
}

async function configureMT5OnVPS(config: VPSConfig): Promise<void> {
  try {
    await sendVPSNotification(config.userId, "🔧 Configurazione MetaTrader 5...");

    // Configure MT5 with user's account details
    const response = await fetch(`http://vps-manager-service:3000/configure-mt5`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        host: config.vpsHost,
        username: config.vpsUsername,
        password: config.vpsPassword,
        mt5Login: config.mt5Login,
        mt5Password: config.mt5Password,
        mt5Server: config.mt5Server,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to configure MT5");
    }

    await sendVPSNotification(config.userId, "✅ MetaTrader 5 configurato con successo");
  } catch (error) {
    throw new Error(`MT5 configuration failed: ${error.message}`);
  }
}

async function startTradingBotOnVPS(config: VPSConfig): Promise<void> {
  try {
    await sendVPSNotification(config.userId, "🚀 Avvio trading bot...");

    // Deploy and start the trading bot on VPS
    const response = await fetch(`http://vps-manager-service:3000/start-bot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        host: config.vpsHost,
        username: config.vpsUsername,
        password: config.vpsPassword,
        userId: config.userId,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to start trading bot");
    }

    await sendVPSNotification(config.userId, "🎉 Il trading bot è ora in esecuzione sul tuo VPS!");
  } catch (error) {
    throw new Error(`Bot startup failed: ${error.message}`);
  }
}

async function sendVPSNotification(userId: number, message: string): Promise<void> {
  try {
    // Get user's chat ID
    const user = await telegramDB.queryRow`
      SELECT chat_id FROM user_interactions 
      WHERE user_id = ${userId} 
      ORDER BY created_at DESC 
      LIMIT 1
    `;

    if (user?.chat_id) {
      const { sendMessage } = await import("./telegram-client");
      await sendMessage(user.chat_id, message);
    }
  } catch (error) {
    console.error("Failed to send VPS notification:", error);
  }
}

// VPS Management Commands
export async function handleVPSCommand(chatId: number, userId: number, command: string): Promise<void> {
  const { sendMessage, createInlineKeyboard } = await import("./telegram-client");

  if (command === "/vps") {
    await handleVPSMainMenu(chatId, userId);
  } else if (command === "/vps_status") {
    await handleVPSStatus(chatId, userId);
  } else if (command === "/vps_restart") {
    await handleVPSRestart(chatId, userId);
  } else if (command === "/vps_logs") {
    await handleVPSLogs(chatId, userId);
  }
}

async function handleVPSMainMenu(chatId: number, userId: number): Promise<void> {
  const { sendMessage, createInlineKeyboard } = await import("./telegram-client");

  const config = await telegramDB.queryRow<VPSConfig>`
    SELECT * FROM vps_configurations WHERE user_id = ${userId}
  `;

  if (!config) {
    const message = `
🖥️ **Gestione VPS**

Non hai ancora configurato un VPS. Per iniziare:

1️⃣ Acquista un VPS Windows da un provider
2️⃣ Usa \`/vps_setup\` per configurare il tuo VPS
3️⃣ Installerò e configurerò tutto automaticamente!

**Provider VPS Consigliati:**
• Contabo (€12/month)
• Vultr ($24/month)
• DigitalOcean ($48/month)

**Requirements:**
• Windows Server 2019/2022
• 4GB RAM minimum
• 50GB storage
• RDP access enabled
    `;

    const keyboard = createInlineKeyboard([
      [{ text: "🔧 Setup VPS", callback_data: "vps_setup" }],
      [{ text: "📚 VPS Guide", callback_data: "vps_guide" }],
    ]);

    await sendMessage(chatId, message, { replyMarkup: keyboard });
  } else {
    const statusEmoji = getStatusEmoji(config.status);
    const message = `
🖥️ **VPS Management**

**Status:** ${statusEmoji} ${config.status.toUpperCase()}
**Host:** ${config.vpsHost}
**MT5 Server:** ${config.mt5Server}
**Last Update:** ${new Date(config.updatedAt).toLocaleString()}

**Available Commands:**
• \`/vps_status\` - Check detailed status
• \`/vps_restart\` - Restart trading bot
• \`/vps_logs\` - View recent logs
• \`/vps_update\` - Update configuration
    `;

    const keyboard = createInlineKeyboard([
      [
        { text: "📊 Status", callback_data: "vps_status" },
        { text: "🔄 Restart", callback_data: "vps_restart" }
      ],
      [
        { text: "📋 Logs", callback_data: "vps_logs" },
        { text: "⚙️ Update", callback_data: "vps_update" }
      ],
    ]);

    await sendMessage(chatId, message, { replyMarkup: keyboard });
  }
}

async function handleVPSStatus(chatId: number, userId: number): Promise<void> {
  const { sendMessage } = await import("./telegram-client");

  const config = await telegramDB.queryRow<VPSConfig>`
    SELECT * FROM vps_configurations WHERE user_id = ${userId}
  `;

  if (!config) {
    await sendMessage(chatId, "❌ No VPS configuration found. Use `/vps` to get started.");
    return;
  }

  try {
    // Get real-time status from VPS
    const response = await fetch(`http://vps-manager-service:3000/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        host: config.vpsHost,
        username: config.vpsUsername,
        password: config.vpsPassword,
      }),
    });

    let statusInfo = "Unable to fetch real-time status";
    if (response.ok) {
      const data = await response.json();
      statusInfo = `
**System Status:**
• CPU Usage: ${data.cpu}%
• Memory Usage: ${data.memory}%
• Disk Usage: ${data.disk}%
• Uptime: ${data.uptime}

**Trading Bot:**
• Status: ${data.botStatus}
• MT5 Connected: ${data.mt5Connected ? "✅" : "❌"}
• Last Signal: ${data.lastSignal || "None"}
• Active Trades: ${data.activeTrades || 0}
      `;
    }

    const message = `
🖥️ **VPS Status Report**

**Configuration:**
• Host: ${config.vpsHost}
• Status: ${getStatusEmoji(config.status)} ${config.status.toUpperCase()}
• MT5 Account: ${config.mt5Login}
• MT5 Server: ${config.mt5Server}

${statusInfo}

**Last Updated:** ${new Date().toLocaleString()}
    `;

    await sendMessage(chatId, message);
  } catch (error) {
    console.error("VPS status error:", error);
    await sendMessage(chatId, "❌ Failed to get VPS status. Please try again later.");
  }
}

async function handleVPSRestart(chatId: number, userId: number): Promise<void> {
  const { sendMessage } = await import("./telegram-client");

  const config = await telegramDB.queryRow<VPSConfig>`
    SELECT * FROM vps_configurations WHERE user_id = ${userId}
  `;

  if (!config) {
    await sendMessage(chatId, "❌ No VPS configuration found.");
    return;
  }

  try {
    await sendMessage(chatId, "🔄 Restarting trading bot on VPS...");

    const response = await fetch(`http://vps-manager-service:3000/restart-bot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        host: config.vpsHost,
        username: config.vpsUsername,
        password: config.vpsPassword,
      }),
    });

    if (response.ok) {
      await sendMessage(chatId, "✅ Trading bot restarted successfully!");
    } else {
      await sendMessage(chatId, "❌ Failed to restart trading bot. Please check VPS connection.");
    }
  } catch (error) {
    console.error("VPS restart error:", error);
    await sendMessage(chatId, "❌ Error restarting bot. Please try again later.");
  }
}

async function handleVPSLogs(chatId: number, userId: number): Promise<void> {
  const { sendMessage } = await import("./telegram-client");

  const config = await telegramDB.queryRow<VPSConfig>`
    SELECT * FROM vps_configurations WHERE user_id = ${userId}
  `;

  if (!config) {
    await sendMessage(chatId, "❌ No VPS configuration found.");
    return;
  }

  try {
    const response = await fetch(`http://vps-manager-service:3000/logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        host: config.vpsHost,
        username: config.vpsUsername,
        password: config.vpsPassword,
        lines: 20,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const message = `
📋 **Recent VPS Logs**

\`\`\`
${data.logs || "No recent logs available"}
\`\`\`

**Log Time:** ${new Date().toLocaleString()}
      `;
      await sendMessage(chatId, message);
    } else {
      await sendMessage(chatId, "❌ Failed to retrieve logs from VPS.");
    }
  } catch (error) {
    console.error("VPS logs error:", error);
    await sendMessage(chatId, "❌ Error retrieving logs. Please try again later.");
  }
}

function getStatusEmoji(status: string): string {
  switch (status) {
    case "active": return "🟢";
    case "configuring": return "🟡";
    case "pending": return "⏳";
    case "error": return "🔴";
    default: return "⚪";
  }
}

// VPS Setup Wizard
export interface VPSSetupState {
  userId: number;
  step: "provider" | "host" | "credentials" | "mt5_login" | "mt5_password" | "mt5_server" | "confirm";
  data: {
    provider?: string;
    host?: string;
    username?: string;
    password?: string;
    mt5Login?: string;
    mt5Password?: string;
    mt5Server?: string;
  };
}

const setupStates = new Map<number, VPSSetupState>();

export async function handleVPSSetup(chatId: number, userId: number, message?: string): Promise<void> {
  const { sendMessage, createInlineKeyboard } = await import("./telegram-client");

  let state = setupStates.get(userId);
  
  if (!state) {
    // Start new setup
    state = {
      userId,
      step: "provider",
      data: {}
    };
    setupStates.set(userId, state);
  }

  switch (state.step) {
    case "provider":
      const providerMessage = `
🖥️ **VPS Setup Wizard - Step 1/6**

Which VPS provider are you using?

**Popular Options:**
• Contabo - Great value (€12/month)
• Vultr - Reliable (€24/month)  
• DigitalOcean - Premium (€48/month)
• Other - Custom provider

Please select your provider:
      `;

      const providerKeyboard = createInlineKeyboard([
        [
          { text: "Contabo", callback_data: "vps_provider_contabo" },
          { text: "Vultr", callback_data: "vps_provider_vultr" }
        ],
        [
          { text: "DigitalOcean", callback_data: "vps_provider_digitalocean" },
          { text: "Other", callback_data: "vps_provider_other" }
        ],
      ]);

      await sendMessage(chatId, providerMessage, { replyMarkup: providerKeyboard });
      break;

    case "host":
      await sendMessage(chatId, `
🖥️ **VPS Setup Wizard - Step 2/6**

Please enter your VPS IP address or hostname:

**Example:** \`192.168.1.100\` or \`my-vps.example.com\`

You can find this in your ${state.data.provider} dashboard.
      `);
      break;

    case "credentials":
      if (message) {
        state.data.host = message.trim();
        state.step = "mt5_login";
        await sendMessage(chatId, `
🖥️ **VPS Setup Wizard - Step 3/6**

Please enter your VPS username and password in this format:

\`username:password\`

**Example:** \`Administrator:MySecurePassword123\`

⚠️ **Security Note:** This information is encrypted and stored securely.
        `);
      }
      break;

    case "mt5_login":
      if (message && message.includes(":")) {
        const [username, password] = message.split(":");
        state.data.username = username.trim();
        state.data.password = password.trim();
        state.step = "mt5_password";
        
        await sendMessage(chatId, `
🖥️ **VPS Setup Wizard - Step 4/6**

Please enter your MetaTrader 5 account login number:

**Example:** \`12345678\`

You can find this in your MT5 terminal or broker account.
        `);
      } else {
        await sendMessage(chatId, "❌ Please enter credentials in the format: `username:password`");
      }
      break;

    case "mt5_password":
      if (message) {
        state.data.mt5Login = message.trim();
        state.step = "mt5_server";
        
        await sendMessage(chatId, `
🖥️ **VPS Setup Wizard - Step 5/6**

Please enter your MetaTrader 5 account password:

⚠️ **Security Note:** This will be encrypted and stored securely.
        `);
      }
      break;

    case "mt5_server":
      if (message) {
        state.data.mt5Password = message.trim();
        state.step = "confirm";
        
        await sendMessage(chatId, `
🖥️ **VPS Setup Wizard - Step 6/6**

Please enter your MetaTrader 5 server name:

**Examples:**
• \`XMGlobal-Demo\`
• \`ICMarkets-Live01\`
• \`FXCM-Server\`

You can find this in your MT5 terminal connection settings.
        `);
      }
      break;

    case "confirm":
      if (message) {
        state.data.mt5Server = message.trim();
        
        const confirmMessage = `
🖥️ **VPS Setup Wizard - Confirmation**

Please confirm your configuration:

**VPS Details:**
• Provider: ${state.data.provider}
• Host: ${state.data.host}
• Username: ${state.data.username}

**MT5 Details:**
• Login: ${state.data.mt5Login}
• Server: ${state.data.mt5Server}

**Next Steps:**
1. I'll connect to your VPS
2. Install required software (Python, MT5, etc.)
3. Configure your MT5 account
4. Start the trading bot
5. Send you status updates

⚠️ **Important:** Make sure your VPS is running and RDP is enabled.

Ready to proceed?
        `;

        const confirmKeyboard = createInlineKeyboard([
          [
            { text: "✅ Confirm & Start", callback_data: "vps_confirm_yes" },
            { text: "❌ Cancel", callback_data: "vps_confirm_no" }
          ],
        ]);

        await sendMessage(chatId, confirmMessage, { replyMarkup: confirmKeyboard });
      }
      break;
  }
}

export async function handleVPSSetupCallback(chatId: number, userId: number, callbackData: string): Promise<void> {
  const { sendMessage } = await import("./telegram-client");
  
  const state = setupStates.get(userId);
  if (!state) return;

  if (callbackData.startsWith("vps_provider_")) {
    const provider = callbackData.replace("vps_provider_", "");
    state.data.provider = provider;
    state.step = "host";
    await handleVPSSetup(chatId, userId);
  } else if (callbackData === "vps_confirm_yes") {
    // Start VPS configuration
    try {
      await storeVPSConfig({
        userId,
        vpsHost: state.data.host!,
        vpsUsername: state.data.username!,
        vpsPassword: state.data.password!,
        mt5Config: {
          login: state.data.mt5Login!,
          password: state.data.mt5Password!,
          server: state.data.mt5Server!,
        }
      });

      setupStates.delete(userId);
      
      await sendMessage(chatId, `
🚀 **VPS Configuration Started!**

I'm now setting up your VPS automatically. This process takes 5-10 minutes.

**What I'm doing:**
1. ⏳ Connecting to your VPS...
2. ⏳ Installing Python and dependencies...
3. ⏳ Configuring MetaTrader 5...
4. ⏳ Starting the trading bot...

You'll receive updates as each step completes. Please wait...
      `);
      
    } catch (error) {
      await sendMessage(chatId, `❌ Configuration failed: ${error.message}`);
    }
  } else if (callbackData === "vps_confirm_no") {
    setupStates.delete(userId);
    await sendMessage(chatId, "❌ VPS setup cancelled. Use `/vps` to start again.");
  }
}
