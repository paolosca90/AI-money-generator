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
      throw APIError.internal("Impossibile salvare la configurazione VPS");
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
      throw new Error("Configurazione VPS non trovata");
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
    await sendVPSNotification(userId, "✅ VPS configurato con successo! Il tuo bot di trading è ora attivo.");

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
      throw new Error("Impossibile connettersi al VPS");
    }

    await sendVPSNotification(config.userId, "🔗 Connessione VPS stabilita con successo");
  } catch (error) {
    throw new Error(`Connessione VPS fallita: ${error.message}`);
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
      throw new Error("Impossibile installare software su VPS");
    }

    await sendVPSNotification(config.userId, "✅ Installazione software completata");
  } catch (error) {
    throw new Error(`Installazione software fallita: ${error.message}`);
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
      throw new Error("Impossibile configurare MT5");
    }

    await sendVPSNotification(config.userId, "✅ MetaTrader 5 configurato con successo");
  } catch (error) {
    throw new Error(`Configurazione MT5 fallita: ${error.message}`);
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
      throw new Error("Impossibile avviare il trading bot");
    }

    await sendVPSNotification(config.userId, "🎉 Il trading bot è ora in esecuzione sul tuo VPS!");
  } catch (error) {
    throw new Error(`Avvio bot fallito: ${error.message}`);
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
• Contabo (€12/mese)
• Vultr ($24/mese)
• DigitalOcean ($48/mese)

**Requisiti:**
• Windows Server 2019/2022
• 4GB RAM minimo
• 50GB storage
• Accesso RDP abilitato
    `;

    const keyboard = createInlineKeyboard([
      [{ text: "🔧 Configura VPS", callback_data: "vps_setup" }],
      [{ text: "📚 Guida VPS", callback_data: "vps_guide" }],
    ]);

    await sendMessage(chatId, message, { replyMarkup: keyboard });
  } else {
    const statusEmoji = getStatusEmoji(config.status);
    const message = `
🖥️ **Gestione VPS**

**Stato:** ${statusEmoji} ${config.status.toUpperCase()}
**Host:** ${config.vpsHost}
**Server MT5:** ${config.mt5Server}
**Ultimo Aggiornamento:** ${new Date(config.updatedAt).toLocaleString()}

**Comandi Disponibili:**
• \`/vps_status\` - Controlla stato dettagliato
• \`/vps_restart\` - Riavvia trading bot
• \`/vps_logs\` - Visualizza log recenti
• \`/vps_update\` - Aggiorna configurazione
    `;

    const keyboard = createInlineKeyboard([
      [
        { text: "📊 Stato", callback_data: "vps_status" },
        { text: "🔄 Riavvia", callback_data: "vps_restart" }
      ],
      [
        { text: "📋 Log", callback_data: "vps_logs" },
        { text: "⚙️ Aggiorna", callback_data: "vps_update" }
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
    await sendMessage(chatId, "❌ Nessuna configurazione VPS trovata. Usa `/vps` per iniziare.");
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

    let statusInfo = "Impossibile recuperare stato tempo reale";
    if (response.ok) {
      const data = await response.json();
      statusInfo = `
**Stato Sistema:**
• Utilizzo CPU: ${data.cpu}%
• Utilizzo Memoria: ${data.memory}%
• Utilizzo Disco: ${data.disk}%
• Uptime: ${data.uptime}

**Trading Bot:**
• Stato: ${data.botStatus}
• MT5 Connesso: ${data.mt5Connected ? "✅" : "❌"}
• Ultimo Segnale: ${data.lastSignal || "Nessuno"}
• Trade Attivi: ${data.activeTrades || 0}
      `;
    }

    const message = `
🖥️ **Report Stato VPS**

**Configurazione:**
• Host: ${config.vpsHost}
• Stato: ${getStatusEmoji(config.status)} ${config.status.toUpperCase()}
• Account MT5: ${config.mt5Login}
• Server MT5: ${config.mt5Server}

${statusInfo}

**Ultimo Aggiornamento:** ${new Date().toLocaleString()}
    `;

    await sendMessage(chatId, message);
  } catch (error) {
    console.error("VPS status error:", error);
    await sendMessage(chatId, "❌ Impossibile ottenere lo stato VPS. Riprova più tardi.");
  }
}

async function handleVPSRestart(chatId: number, userId: number): Promise<void> {
  const { sendMessage } = await import("./telegram-client");

  const config = await telegramDB.queryRow<VPSConfig>`
    SELECT * FROM vps_configurations WHERE user_id = ${userId}
  `;

  if (!config) {
    await sendMessage(chatId, "❌ Nessuna configurazione VPS trovata.");
    return;
  }

  try {
    await sendMessage(chatId, "🔄 Riavvio trading bot su VPS...");

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
      await sendMessage(chatId, "✅ Trading bot riavviato con successo!");
    } else {
      await sendMessage(chatId, "❌ Impossibile riavviare il trading bot. Controlla la connessione VPS.");
    }
  } catch (error) {
    console.error("VPS restart error:", error);
    await sendMessage(chatId, "❌ Errore nel riavvio del bot. Riprova più tardi.");
  }
}

async function handleVPSLogs(chatId: number, userId: number): Promise<void> {
  const { sendMessage } = await import("./telegram-client");

  const config = await telegramDB.queryRow<VPSConfig>`
    SELECT * FROM vps_configurations WHERE user_id = ${userId}
  `;

  if (!config) {
    await sendMessage(chatId, "❌ Nessuna configurazione VPS trovata.");
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
📋 **Log VPS Recenti**

\`\`\`
${data.logs || "Nessun log recente disponibile"}
\`\`\`

**Ora Log:** ${new Date().toLocaleString()}
      `;
      await sendMessage(chatId, message);
    } else {
      await sendMessage(chatId, "❌ Impossibile recuperare i log dal VPS.");
    }
  } catch (error) {
    console.error("VPS logs error:", error);
    await sendMessage(chatId, "❌ Errore nel recupero dei log. Riprova più tardi.");
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
🖥️ **Wizard Configurazione VPS - Passo 1/6**

Quale provider VPS stai utilizzando?

**Opzioni Popolari:**
• Contabo - Ottimo valore (€12/mese)
• Vultr - Affidabile (€24/mese)  
• DigitalOcean - Premium (€48/mese)
• Altro - Provider personalizzato

Seleziona il tuo provider:
      `;

      const providerKeyboard = createInlineKeyboard([
        [
          { text: "Contabo", callback_data: "vps_provider_contabo" },
          { text: "Vultr", callback_data: "vps_provider_vultr" }
        ],
        [
          { text: "DigitalOcean", callback_data: "vps_provider_digitalocean" },
          { text: "Altro", callback_data: "vps_provider_other" }
        ],
      ]);

      await sendMessage(chatId, providerMessage, { replyMarkup: providerKeyboard });
      break;

    case "host":
      await sendMessage(chatId, `
🖥️ **Wizard Configurazione VPS - Passo 2/6**

Inserisci l'indirizzo IP o hostname del tuo VPS:

**Esempio:** \`192.168.1.100\` o \`my-vps.example.com\`

Puoi trovarlo nella dashboard di ${state.data.provider}.
      `);
      break;

    case "credentials":
      if (message) {
        state.data.host = message.trim();
        state.step = "mt5_login";
        await sendMessage(chatId, `
🖥️ **Wizard Configurazione VPS - Passo 3/6**

Inserisci username e password del tuo VPS in questo formato:

\`username:password\`

**Esempio:** \`Administrator:MiaPasswordSicura123\`

⚠️ **Nota Sicurezza:** Queste informazioni sono criptate e archiviate in sicurezza.
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
🖥️ **Wizard Configurazione VPS - Passo 4/6**

Inserisci il numero di login del tuo account MetaTrader 5:

**Esempio:** \`12345678\`

Puoi trovarlo nel tuo terminale MT5 o account broker.
        `);
      } else {
        await sendMessage(chatId, "❌ Inserisci le credenziali nel formato: `username:password`");
      }
      break;

    case "mt5_password":
      if (message) {
        state.data.mt5Login = message.trim();
        state.step = "mt5_server";
        
        await sendMessage(chatId, `
🖥️ **Wizard Configurazione VPS - Passo 5/6**

Inserisci la password del tuo account MetaTrader 5:

⚠️ **Nota Sicurezza:** Sarà criptata e archiviata in sicurezza.
        `);
      }
      break;

    case "mt5_server":
      if (message) {
        state.data.mt5Password = message.trim();
        state.step = "confirm";
        
        await sendMessage(chatId, `
🖥️ **Wizard Configurazione VPS - Passo 6/6**

Inserisci il nome del server MetaTrader 5:

**Esempi:**
• \`XMGlobal-Demo\`
• \`ICMarkets-Live01\`
• \`FXCM-Server\`

Puoi trovarlo nelle impostazioni di connessione del tuo terminale MT5.
        `);
      }
      break;

    case "confirm":
      if (message) {
        state.data.mt5Server = message.trim();
        
        const confirmMessage = `
🖥️ **Wizard Configurazione VPS - Conferma**

Conferma la tua configurazione:

**Dettagli VPS:**
• Provider: ${state.data.provider}
• Host: ${state.data.host}
• Username: ${state.data.username}

**Dettagli MT5:**
• Login: ${state.data.mt5Login}
• Server: ${state.data.mt5Server}

**Prossimi Passi:**
1. Mi connetterò al tuo VPS
2. Installerò il software richiesto (Python, MT5, ecc.)
3. Configurerò il tuo account MT5
4. Avvierò il trading bot
5. Ti invierò aggiornamenti di stato

⚠️ **Importante:** Assicurati che il tuo VPS sia in esecuzione e RDP sia abilitato.

Pronto per procedere?
        `;

        const confirmKeyboard = createInlineKeyboard([
          [
            { text: "✅ Conferma e Avvia", callback_data: "vps_confirm_yes" },
            { text: "❌ Annulla", callback_data: "vps_confirm_no" }
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
🚀 **Configurazione VPS Avviata!**

Sto configurando il tuo VPS automaticamente. Questo processo richiede 5-10 minuti.

**Cosa sto facendo:**
1. ⏳ Connessione al tuo VPS...
2. ⏳ Installazione Python e dipendenze...
3. ⏳ Configurazione MetaTrader 5...
4. ⏳ Avvio del trading bot...

Riceverai aggiornamenti al completamento di ogni passaggio. Attendi...
      `);
      
    } catch (error) {
      await sendMessage(chatId, `❌ Configurazione fallita: ${error.message}`);
    }
  } else if (callbackData === "vps_confirm_no") {
    setupStates.delete(userId);
    await sendMessage(chatId, "❌ Configurazione VPS annullata. Usa `/vps` per iniziare di nuovo.");
  }
}
