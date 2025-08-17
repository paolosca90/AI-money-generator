import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { telegramDB } from "./db";
import { sendMessage } from "./telegram-client";
import { createClientSubscription } from "./client-manager";

const adminUserId = secret("AdminUserId");

export interface AdminStats {
  totalClients: number;
  activeClients: number;
  totalRevenue: number;
  monthlyRevenue: number;
  planBreakdown: {
    basic: number;
    premium: number;
    enterprise: number;
  };
  recentSignups: number;
  churnRate: number;
}

export interface ClientInfo {
  userId: number;
  username?: string;
  subscriptionType: string;
  isActive: boolean;
  expiryDate: Date;
  totalSpent: number;
  signupDate: Date;
  lastActive: Date;
}

// Admin dashboard stats
export const getAdminStats = api<{}, AdminStats>(
  { expose: true, method: "GET", path: "/admin/stats" },
  async () => {
    try {
      // Total and active clients
      const clientStats = await telegramDB.queryRow<{total: number, active: number}>`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active
        FROM client_configurations
      `;

      // Plan breakdown
      const planStats = await telegramDB.query<{subscription_type: string, count: number}>`
        SELECT subscription_type, COUNT(*) as count
        FROM client_configurations 
        WHERE is_active = true
        GROUP BY subscription_type
      `;

      const planBreakdown = {
        basic: 0,
        premium: 0,
        enterprise: 0
      };

      planStats.forEach(stat => {
        if (stat.subscription_type in planBreakdown) {
          (planBreakdown as any)[stat.subscription_type] = stat.count;
        }
      });

      // Revenue calculation (simplified)
      const monthlyRevenue = (planBreakdown.basic * 29) + 
                           (planBreakdown.premium * 79) + 
                           (planBreakdown.enterprise * 199);

      // Recent signups (last 7 days)
      const recentSignups = await telegramDB.queryRow<{count: number}>`
        SELECT COUNT(*) as count
        FROM client_configurations
        WHERE created_at >= NOW() - INTERVAL '7 days'
      `;

      // Churn rate calculation (simplified - expired in last 30 days)
      const churnedClients = await telegramDB.queryRow<{count: number}>`
        SELECT COUNT(*) as count
        FROM client_configurations
        WHERE expiry_date < NOW() AND expiry_date >= NOW() - INTERVAL '30 days'
      `;

      const churnRate = clientStats!.total > 0 ? 
        (churnedClients!.count / clientStats!.total) * 100 : 0;

      return {
        totalClients: clientStats!.total,
        activeClients: clientStats!.active,
        totalRevenue: monthlyRevenue * 12, // Annualized
        monthlyRevenue,
        planBreakdown,
        recentSignups: recentSignups!.count,
        churnRate: Math.round(churnRate * 100) / 100
      };
    } catch (error) {
      console.error("Error getting admin stats:", error);
      throw APIError.internal("Failed to get admin statistics");
    }
  }
);

// List all clients with details
export const listClients = api<{ 
  page?: number; 
  limit?: number; 
  status?: "active" | "expired" | "all" 
}, { clients: ClientInfo[]; total: number }>(
  { expose: true, method: "GET", path: "/admin/clients" },
  async (req) => {
    const page = req.page || 1;
    const limit = req.limit || 50;
    const offset = (page - 1) * limit;

    try {
      let whereClause = "";
      if (req.status === "active") {
        whereClause = "WHERE cc.is_active = true AND cc.expiry_date > NOW()";
      } else if (req.status === "expired") {
        whereClause = "WHERE cc.is_active = false OR cc.expiry_date <= NOW()";
      }

      const clients = await telegramDB.query<ClientInfo>`
        SELECT 
          cc.user_id,
          cc.subscription_type,
          cc.is_active,
          cc.expiry_date,
          cc.created_at as signup_date,
          ui.created_at as last_active,
          COALESCE(cp.total_spent, 0) as total_spent
        FROM client_configurations cc
        LEFT JOIN (
          SELECT user_id, MAX(created_at) as created_at
          FROM user_interactions 
          GROUP BY user_id
        ) ui ON cc.user_id = ui.user_id
        LEFT JOIN (
          SELECT user_id, SUM(amount) as total_spent
          FROM client_payments 
          WHERE status = 'completed'
          GROUP BY user_id
        ) cp ON cc.user_id = cp.user_id
        ${whereClause}
        ORDER BY cc.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const totalResult = await telegramDB.queryRow<{count: number}>`
        SELECT COUNT(*) as count FROM client_configurations cc ${whereClause}
      `;

      return {
        clients,
        total: totalResult!.count
      };
    } catch (error) {
      console.error("Error listing clients:", error);
      throw APIError.internal("Failed to list clients");
    }
  }
);

// Admin commands for managing clients via Telegram
export async function handleAdminCommands(chatId: number, userId: number, command: string): Promise<void> {
  // Verify admin access
  const adminId = parseInt(adminUserId());
  if (userId !== adminId) {
    await sendMessage(chatId, "❌ Unauthorized access.");
    return;
  }

  const parts = command.split(" ");
  const cmd = parts[0];

  switch (cmd) {
    case "/admin_stats":
      await handleAdminStats(chatId);
      break;
    case "/admin_clients":
      await handleAdminClients(chatId, parts[1]);
      break;
    case "/admin_add_client":
      await handleAddClient(chatId, parts);
      break;
    case "/admin_extend":
      await handleExtendSubscription(chatId, parts);
      break;
    case "/admin_broadcast":
      await handleBroadcast(chatId, parts.slice(1).join(" "));
      break;
    case "/admin_help":
      await handleAdminHelp(chatId);
      break;
    default:
      await sendMessage(chatId, "❓ Unknown admin command. Use `/admin_help` for available commands.");
  }
}

async function handleAdminStats(chatId: number): Promise<void> {
  try {
    const stats = await getAdminStats();
    
    const message = `
📊 **Admin Dashboard - Business Overview**

**👥 Client Statistics:**
• Total Clients: ${stats.totalClients}
• Active Clients: ${stats.activeClients}
• Recent Signups (7 days): ${stats.recentSignups}
• Churn Rate: ${stats.churnRate}%

**💰 Revenue:**
• Monthly Recurring Revenue: €${stats.monthlyRevenue.toLocaleString()}
• Annualized Revenue: €${stats.totalRevenue.toLocaleString()}

**📋 Plan Distribution:**
• Basic (€29): ${stats.planBreakdown.basic} clients
• Premium (€79): ${stats.planBreakdown.premium} clients  
• Enterprise (€199): ${stats.planBreakdown.enterprise} clients

**📈 Key Metrics:**
• ARPU: €${stats.activeClients > 0 ? Math.round(stats.monthlyRevenue / stats.activeClients) : 0}/month
• Growth Rate: ${stats.recentSignups > 0 ? '+' : ''}${stats.recentSignups} new clients this week

Use \`/admin_clients\` to view client list.
    `;

    await sendMessage(chatId, message);
  } catch (error) {
    await sendMessage(chatId, "❌ Error retrieving admin statistics.");
  }
}

async function handleAdminClients(chatId: number, status?: string): Promise<void> {
  try {
    const validStatus = status === "active" || status === "expired" ? status : "active";
    const result = await listClients({ status: validStatus, limit: 10 });
    
    if (result.clients.length === 0) {
      await sendMessage(chatId, `No ${validStatus} clients found.`);
      return;
    }

    const clientList = result.clients.map((client, index) => {
      const statusEmoji = client.isActive && new Date(client.expiryDate) > new Date() ? "✅" : "❌";
      const plan = client.subscriptionType.toUpperCase();
      const expiry = new Date(client.expiryDate).toLocaleDateString();
      
      return `${index + 1}. ${statusEmoji} User: \`${client.userId}\`
   Plan: ${plan} | Expires: ${expiry}
   Total Spent: €${client.totalSpent || 0}`;
    }).join('\n\n');

    const message = `
👥 **Client List (${validStatus.toUpperCase()})**

${clientList}

**Total:** ${result.total} ${validStatus} clients
**Showing:** First 10 clients

**Commands:**
• \`/admin_clients active\` - Show active clients
• \`/admin_clients expired\` - Show expired clients
• \`/admin_add_client USER_ID PLAN DAYS\` - Add new client
• \`/admin_extend USER_ID DAYS\` - Extend subscription
    `;

    await sendMessage(chatId, message);
  } catch (error) {
    await sendMessage(chatId, "❌ Error retrieving client list.");
  }
}

async function handleAddClient(chatId: number, parts: string[]): Promise<void> {
  if (parts.length < 4) {
    await sendMessage(chatId, "❌ Usage: `/admin_add_client USER_ID PLAN DAYS`\n\nExample: `/admin_add_client 123456789 premium 30`");
    return;
  }

  const userId = parseInt(parts[1]);
  const plan = parts[2].toLowerCase();
  const days = parseInt(parts[3]);

  if (!userId || !["basic", "premium", "enterprise"].includes(plan) || !days) {
    await sendMessage(chatId, "❌ Invalid parameters. USER_ID must be a number, PLAN must be basic/premium/enterprise, DAYS must be a number.");
    return;
  }

  try {
    const features = getSubscriptionFeatures(plan);
    
    await createClientSubscription({
      userId,
      subscriptionType: plan as "basic" | "premium" | "enterprise",
      features,
      durationDays: days
    });

    await sendMessage(chatId, `✅ Client added successfully!\n\n👤 **User ID:** \`${userId}\`\n📋 **Plan:** ${plan.toUpperCase()}\n⏱️ **Duration:** ${days} days\n\nThe client can now use the bot with their assigned features.`);
  } catch (error) {
    await sendMessage(chatId, `❌ Error adding client: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function handleExtendSubscription(chatId: number, parts: string[]): Promise<void> {
  if (parts.length < 3) {
    await sendMessage(chatId, "❌ Usage: `/admin_extend USER_ID DAYS`\n\nExample: `/admin_extend 123456789 30`");
    return;
  }

  const userId = parseInt(parts[1]);
  const days = parseInt(parts[2]);

  if (!userId || !days) {
    await sendMessage(chatId, "❌ Invalid parameters. USER_ID and DAYS must be numbers.");
    return;
  }

  try {
    await telegramDB.exec`
      UPDATE client_configurations 
      SET 
        expiry_date = GREATEST(expiry_date, NOW()) + INTERVAL '${days} days',
        is_active = true,
        updated_at = NOW()
      WHERE user_id = ${userId}
    `;

    await sendMessage(chatId, `✅ Subscription extended!\n\n👤 **User ID:** \`${userId}\`\n⏱️ **Extended by:** ${days} days\n\nThe client's subscription has been updated.`);
  } catch (error) {
    await sendMessage(chatId, `❌ Error extending subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function handleBroadcast(chatId: number, message: string): Promise<void> {
  if (!message.trim()) {
    await sendMessage(chatId, "❌ Usage: `/admin_broadcast YOUR_MESSAGE`\n\nExample: `/admin_broadcast New features added! Check /help for updates.`");
    return;
  }

  try {
    // Get all active clients
    const clients = await telegramDB.query<{user_id: number, chat_id: number}>`
      SELECT DISTINCT cc.user_id, ui.chat_id
      FROM client_configurations cc
      JOIN (
        SELECT user_id, chat_id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
        FROM user_interactions 
      ) ui ON cc.user_id = ui.user_id AND ui.rn = 1
      WHERE cc.is_active = true AND cc.expiry_date > NOW()
    `;

    let successCount = 0;
    let errorCount = 0;

    const broadcastMessage = `
📢 **Announcement from AI Trading Bot**

${message}

---
*This message was sent to all active subscribers*
    `;

    for (const client of clients) {
      try {
        await sendMessage(client.chat_id, broadcastMessage);
        successCount++;
      } catch (error) {
        errorCount++;
        console.error(`Failed to send broadcast to user ${client.user_id}:`, error);
      }
    }

    await sendMessage(chatId, `📢 **Broadcast Complete**\n\n✅ **Sent:** ${successCount} messages\n❌ **Failed:** ${errorCount} messages\n\n**Message:** ${message}`);
  } catch (error) {
    await sendMessage(chatId, `❌ Error sending broadcast: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function handleAdminHelp(chatId: number): Promise<void> {
  const message = `
🔧 **Admin Commands**

**📊 Analytics:**
• \`/admin_stats\` - Business overview and KPIs
• \`/admin_clients [active|expired]\` - List clients

**👥 Client Management:**
• \`/admin_add_client USER_ID PLAN DAYS\` - Add new client
  Example: \`/admin_add_client 123456789 premium 30\`

• \`/admin_extend USER_ID DAYS\` - Extend subscription
  Example: \`/admin_extend 123456789 30\`

**📢 Communications:**
• \`/admin_broadcast MESSAGE\` - Send message to all active clients
  Example: \`/admin_broadcast New features available!\`

**ℹ️ Information:**
• \`/admin_help\` - Show this help message

**💡 Pro Tips:**
• Use \`/admin_stats\` daily to monitor business health
• Regular broadcasts help with customer engagement
• Monitor churn rate and extend subscriptions for at-risk clients
• User IDs can be found in client interactions or \`/admin_clients\`
  `;

  await sendMessage(chatId, message);
}

function getSubscriptionFeatures(type: string): string[] {
  switch (type) {
    case "basic":
      return [
        "basic_signals",
        "vps_management", 
        "mt5_integration",
        "analytics"
      ];
    case "premium":
      return [
        "advanced_signals",
        "vps_management",
        "mt5_integration", 
        "analytics",
        "risk_management",
        "priority_support",
        "backtesting"
      ];
    case "enterprise":
      return [
        "premium_signals",
        "vps_management",
        "mt5_integration",
        "analytics", 
        "risk_management",
        "portfolio_management",
        "custom_strategies",
        "dedicated_support",
        "multi_account",
        "api_access",
        "white_label"
      ];
    default:
      return ["basic_signals"];
  }
}