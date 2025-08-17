/**
 * Client Management Service
 * Handles subscription management, billing, and client operations
 */

import { api } from "encore.dev/api";
import { sqldb } from "encore.dev/storage/sqldb";

// Database connection
const db = sqldb("trading_db", {
  migrations: "./migrations",
});

export interface SubscriptionPlan {
  id: number;
  name: string;
  priceMonthly: number;
  maxVps: number;
  maxMt5Accounts: number;
  features: Record<string, any>;
  active: boolean;
}

export interface Client {
  id: number;
  telegramUserId: number;
  telegramUsername?: string;
  email?: string;
  subscriptionPlanId?: number;
  subscriptionStatus: 'trial' | 'active' | 'suspended' | 'cancelled';
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
  trialEndDate: Date;
  totalRevenue: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface VPSConfig {
  id: number;
  clientId: number;
  vpsName: string;
  host: string;
  port: number;
  username?: string;
  passwordEncrypted?: string;
  mt5Path?: string;
  status: 'configured' | 'active' | 'error' | 'disabled';
  lastCheck?: Date;
  errorMessage?: string;
}

export interface MT5Account {
  id: number;
  clientId: number;
  vpsConfigId: number;
  accountName: string;
  accountNumber: number;
  broker: string;
  server: string;
  loginEncrypted?: string;
  passwordEncrypted?: string;
  balance?: number;
  equity?: number;
  margin?: number;
  freeMargin?: number;
  currency: string;
  status: 'configured' | 'connected' | 'disconnected' | 'error';
  lastSync?: Date;
}

export interface BusinessMetrics {
  metricDate: Date;
  activeClients: number;
  newClients: number;
  churnedClients: number;
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
  totalTrades: number;
  successfulTrades: number;
  totalVolume: number;
  totalProfit: number;
  averageProfitPerTrade: number;
  clientSatisfactionScore?: number;
  supportTickets: number;
  systemUptimePercent: number;
}

/**
 * Create a new client account
 */
export const createClient = api(
  { expose: true, method: "POST", path: "/client/create" },
  async (data: {
    telegramUserId: number;
    telegramUsername?: string;
    email?: string;
  }): Promise<Client> => {
    const { telegramUserId, telegramUsername, email } = data;

    const result = await db.query(`
      INSERT INTO clients (telegram_user_id, telegram_username, email)
      VALUES ($1, $2, $3)
      ON CONFLICT (telegram_user_id) 
      DO UPDATE SET 
        telegram_username = EXCLUDED.telegram_username,
        email = EXCLUDED.email,
        updated_at = NOW()
      RETURNING *
    `, [telegramUserId, telegramUsername, email]);

    return mapClientRow(result.rows[0]);
  }
);

/**
 * Get client by Telegram user ID
 */
export const getClientByTelegramId = api(
  { expose: true, method: "GET", path: "/client/:telegramUserId" },
  async ({ telegramUserId }: { telegramUserId: string }): Promise<Client | null> => {
    const result = await db.query(`
      SELECT * FROM clients WHERE telegram_user_id = $1
    `, [parseInt(telegramUserId)]);

    if (result.rows.length === 0) return null;
    return mapClientRow(result.rows[0]);
  }
);

/**
 * Upgrade client subscription
 */
export const upgradeSubscription = api(
  { expose: true, method: "POST", path: "/client/upgrade" },
  async (data: {
    telegramUserId: number;
    planId: number;
    paymentMethod: string;
    paymentData: Record<string, any>;
  }): Promise<{ success: boolean; message: string }> => {
    const { telegramUserId, planId, paymentMethod, paymentData } = data;

    try {
      // Start transaction
      await db.query('BEGIN');

      // Get client
      const clientResult = await db.query(`
        SELECT * FROM clients WHERE telegram_user_id = $1
      `, [telegramUserId]);

      if (clientResult.rows.length === 0) {
        throw new Error('Client not found');
      }

      const client = mapClientRow(clientResult.rows[0]);

      // Get subscription plan
      const planResult = await db.query(`
        SELECT * FROM subscription_plans WHERE id = $1 AND active = true
      `, [planId]);

      if (planResult.rows.length === 0) {
        throw new Error('Invalid subscription plan');
      }

      const plan = planResult.rows[0];

      // Process payment (simplified - in production use Stripe/PayPal)
      const transactionId = generateTransactionId();
      const periodStart = new Date();
      const periodEnd = new Date(periodStart.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

      // Create payment transaction
      await db.query(`
        INSERT INTO payment_transactions 
        (client_id, transaction_id, amount, currency, payment_method, payment_status, 
         subscription_plan_id, period_start, period_end, gateway_data)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        client.id, transactionId, plan.price_monthly, 'EUR', paymentMethod, 'completed',
        planId, periodStart, periodEnd, JSON.stringify(paymentData)
      ]);

      // Update client subscription
      await db.query(`
        UPDATE clients 
        SET subscription_plan_id = $1, 
            subscription_status = 'active',
            subscription_start_date = $2,
            subscription_end_date = $3,
            total_revenue = total_revenue + $4,
            updated_at = NOW()
        WHERE id = $5
      `, [planId, periodStart, periodEnd, plan.price_monthly, client.id]);

      await db.query('COMMIT');

      return {
        success: true,
        message: `Successfully upgraded to ${plan.name} plan`
      };

    } catch (error) {
      await db.query('ROLLBACK');
      return {
        success: false,
        message: `Upgrade failed: ${error.message}`
      };
    }
  }
);

/**
 * Add VPS configuration for client
 */
export const addVPSConfig = api(
  { expose: true, method: "POST", path: "/client/vps/add" },
  async (data: {
    telegramUserId: number;
    vpsName: string;
    host: string;
    port?: number;
    username?: string;
    password?: string;
    mt5Path?: string;
  }): Promise<{ success: boolean; message: string; vpsId?: number }> => {
    const { telegramUserId, vpsName, host, port = 8080, username, password, mt5Path } = data;

    try {
      // Get client
      const clientResult = await db.query(`
        SELECT c.*, sp.max_vps FROM clients c
        LEFT JOIN subscription_plans sp ON c.subscription_plan_id = sp.id
        WHERE c.telegram_user_id = $1
      `, [telegramUserId]);

      if (clientResult.rows.length === 0) {
        return { success: false, message: 'Client not found' };
      }

      const client = clientResult.rows[0];

      // Check VPS limits
      if (client.max_vps > 0) {
        const vpsCountResult = await db.query(`
          SELECT COUNT(*) as count FROM client_vps_configs WHERE client_id = $1
        `, [client.id]);

        const currentVpsCount = parseInt(vpsCountResult.rows[0].count);
        if (currentVpsCount >= client.max_vps) {
          return {
            success: false,
            message: `VPS limit reached. Your plan allows ${client.max_vps} VPS configurations.`
          };
        }
      }

      // Encrypt password if provided
      const passwordEncrypted = password ? encryptPassword(password) : null;

      // Add VPS configuration
      const result = await db.query(`
        INSERT INTO client_vps_configs 
        (client_id, vps_name, host, port, username, password_encrypted, mt5_path)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [client.id, vpsName, host, port, username, passwordEncrypted, mt5Path]);

      return {
        success: true,
        message: 'VPS configuration added successfully',
        vpsId: result.rows[0].id
      };

    } catch (error) {
      return {
        success: false,
        message: `Failed to add VPS configuration: ${error.message}`
      };
    }
  }
);

/**
 * Add MT5 account for client
 */
export const addMT5Account = api(
  { expose: true, method: "POST", path: "/client/mt5/add" },
  async (data: {
    telegramUserId: number;
    vpsConfigId: number;
    accountName: string;
    accountNumber: number;
    broker: string;
    server: string;
    login: string;
    password: string;
    currency?: string;
  }): Promise<{ success: boolean; message: string; accountId?: number }> => {
    const { 
      telegramUserId, vpsConfigId, accountName, accountNumber, 
      broker, server, login, password, currency = 'USD' 
    } = data;

    try {
      // Get client and check limits
      const clientResult = await db.query(`
        SELECT c.*, sp.max_mt5_accounts FROM clients c
        LEFT JOIN subscription_plans sp ON c.subscription_plan_id = sp.id
        WHERE c.telegram_user_id = $1
      `, [telegramUserId]);

      if (clientResult.rows.length === 0) {
        return { success: false, message: 'Client not found' };
      }

      const client = clientResult.rows[0];

      // Check MT5 account limits
      if (client.max_mt5_accounts > 0) {
        const accountCountResult = await db.query(`
          SELECT COUNT(*) as count FROM client_mt5_accounts WHERE client_id = $1
        `, [client.id]);

        const currentAccountCount = parseInt(accountCountResult.rows[0].count);
        if (currentAccountCount >= client.max_mt5_accounts) {
          return {
            success: false,
            message: `MT5 account limit reached. Your plan allows ${client.max_mt5_accounts} accounts.`
          };
        }
      }

      // Verify VPS config belongs to client
      const vpsResult = await db.query(`
        SELECT id FROM client_vps_configs WHERE id = $1 AND client_id = $2
      `, [vpsConfigId, client.id]);

      if (vpsResult.rows.length === 0) {
        return { success: false, message: 'VPS configuration not found or not accessible' };
      }

      // Encrypt credentials
      const loginEncrypted = encryptPassword(login);
      const passwordEncrypted = encryptPassword(password);

      // Add MT5 account
      const result = await db.query(`
        INSERT INTO client_mt5_accounts 
        (client_id, vps_config_id, account_name, account_number, broker, server, 
         login_encrypted, password_encrypted, currency)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `, [
        client.id, vpsConfigId, accountName, accountNumber, broker, server,
        loginEncrypted, passwordEncrypted, currency
      ]);

      return {
        success: true,
        message: 'MT5 account added successfully',
        accountId: result.rows[0].id
      };

    } catch (error) {
      return {
        success: false,
        message: `Failed to add MT5 account: ${error.message}`
      };
    }
  }
);

/**
 * Get business metrics for admin dashboard
 */
export const getBusinessMetrics = api(
  { expose: true, method: "GET", path: "/admin/metrics" },
  async ({ startDate, endDate }: { startDate?: string; endDate?: string }): Promise<BusinessMetrics[]> => {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
    const end = endDate ? new Date(endDate) : new Date();

    const result = await db.query(`
      SELECT * FROM business_metrics 
      WHERE metric_date BETWEEN $1 AND $2
      ORDER BY metric_date DESC
    `, [start, end]);

    return result.rows.map(mapBusinessMetricsRow);
  }
);

/**
 * Get subscription plans
 */
export const getSubscriptionPlans = api(
  { expose: true, method: "GET", path: "/subscription-plans" },
  async (): Promise<SubscriptionPlan[]> => {
    const result = await db.query(`
      SELECT * FROM subscription_plans WHERE active = true ORDER BY price_monthly ASC
    `);

    return result.rows.map(mapSubscriptionPlanRow);
  }
);

/**
 * Record client trading performance
 */
export const recordTradingPerformance = api(
  { expose: true, method: "POST", path: "/client/trading/record" },
  async (data: {
    telegramUserId: number;
    tradeId: string;
    symbol: string;
    direction: 'LONG' | 'SHORT';
    entryPrice: number;
    exitPrice?: number;
    lotSize: number;
    profitLoss?: number;
    profitLossPips?: number;
    openedAt: Date;
    closedAt?: Date;
    strategy?: string;
    confidence?: number;
  }): Promise<{ success: boolean; message: string }> => {
    try {
      // Get client and MT5 account
      const clientResult = await db.query(`
        SELECT c.id, m.id as mt5_account_id FROM clients c
        LEFT JOIN client_mt5_accounts m ON c.id = m.client_id
        WHERE c.telegram_user_id = $1
        LIMIT 1
      `, [data.telegramUserId]);

      if (clientResult.rows.length === 0) {
        return { success: false, message: 'Client not found' };
      }

      const { id: clientId, mt5_account_id: mt5AccountId } = clientResult.rows[0];

      await db.query(`
        INSERT INTO client_trading_performance 
        (client_id, mt5_account_id, trade_id, symbol, direction, entry_price, exit_price,
         lot_size, profit_loss, profit_loss_pips, opened_at, closed_at, strategy, confidence)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `, [
        clientId, mt5AccountId, data.tradeId, data.symbol, data.direction,
        data.entryPrice, data.exitPrice, data.lotSize, data.profitLoss,
        data.profitLossPips, data.openedAt, data.closedAt, data.strategy, data.confidence
      ]);

      return { success: true, message: 'Trading performance recorded' };

    } catch (error) {
      return { success: false, message: `Failed to record performance: ${error.message}` };
    }
  }
);

// Helper functions
function mapClientRow(row: any): Client {
  return {
    id: row.id,
    telegramUserId: row.telegram_user_id,
    telegramUsername: row.telegram_username,
    email: row.email,
    subscriptionPlanId: row.subscription_plan_id,
    subscriptionStatus: row.subscription_status,
    subscriptionStartDate: row.subscription_start_date,
    subscriptionEndDate: row.subscription_end_date,
    trialEndDate: row.trial_end_date,
    totalRevenue: parseFloat(row.total_revenue),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapSubscriptionPlanRow(row: any): SubscriptionPlan {
  return {
    id: row.id,
    name: row.name,
    priceMonthly: parseFloat(row.price_monthly),
    maxVps: row.max_vps,
    maxMt5Accounts: row.max_mt5_accounts,
    features: row.features,
    active: row.active
  };
}

function mapBusinessMetricsRow(row: any): BusinessMetrics {
  return {
    metricDate: row.metric_date,
    activeClients: row.active_clients,
    newClients: row.new_clients,
    churnedClients: row.churned_clients,
    mrr: parseFloat(row.mrr),
    arr: parseFloat(row.arr),
    totalTrades: row.total_trades,
    successfulTrades: row.successful_trades,
    totalVolume: parseFloat(row.total_volume),
    totalProfit: parseFloat(row.total_profit),
    averageProfitPerTrade: parseFloat(row.average_profit_per_trade),
    clientSatisfactionScore: row.client_satisfaction_score ? parseFloat(row.client_satisfaction_score) : undefined,
    supportTickets: row.support_tickets,
    systemUptimePercent: parseFloat(row.system_uptime_percent)
  };
}

function generateTransactionId(): string {
  return 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function encryptPassword(password: string): string {
  // In production, use proper encryption (e.g., crypto.createCipher)
  // For demo purposes, using base64 encoding
  return Buffer.from(password).toString('base64');
}

function decryptPassword(encryptedPassword: string): string {
  // In production, use proper decryption
  return Buffer.from(encryptedPassword, 'base64').toString('utf-8');
}