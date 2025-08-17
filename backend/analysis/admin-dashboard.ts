/**
 * Admin Dashboard Service
 * Business KPIs, client management, and system administration
 */

import { api } from "encore.dev/api";
import { sqldb } from "encore.dev/storage/sqldb";

const db = sqldb("trading_db", {
  migrations: "./migrations",
});

export interface AdminDashboard {
  overview: {
    totalClients: number;
    activeSubscriptions: number;
    monthlyRevenue: number;
    totalTrades: number;
    systemUptime: number;
  };
  revenueMetrics: {
    mrr: number;
    arr: number;
    churnRate: number;
    avgRevenuePerUser: number;
    revenueGrowth: number;
  };
  clientMetrics: {
    newClientsToday: number;
    newClientsThisMonth: number;
    trialUsers: number;
    conversionRate: number;
    clientSatisfaction: number;
  };
  tradingMetrics: {
    totalTradesThisMonth: number;
    successfulTrades: number;
    successRate: number;
    totalVolume: number;
    averageProfit: number;
  };
  systemHealth: {
    apiUptime: number;
    mt5Connections: number;
    errorRate: number;
    responseTime: number;
    activeVpsConfigs: number;
  };
}

export interface ClientDetails {
  id: number;
  telegramUserId: number;
  telegramUsername?: string;
  email?: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  totalRevenue: number;
  totalTrades: number;
  lastActivity: Date;
  vpsConfigs: number;
  mt5Accounts: number;
  profitLoss: number;
}

/**
 * Get admin dashboard overview
 */
export const getAdminDashboard = api(
  { expose: true, method: "GET", path: "/admin/dashboard" },
  async (): Promise<AdminDashboard> => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    // Overview metrics
    const overviewResult = await db.query(`
      SELECT 
        COUNT(*) as total_clients,
        COUNT(CASE WHEN subscription_status = 'active' THEN 1 END) as active_subscriptions,
        SUM(CASE WHEN subscription_status = 'active' THEN sp.price_monthly ELSE 0 END) as monthly_revenue
      FROM clients c
      LEFT JOIN subscription_plans sp ON c.subscription_plan_id = sp.id
    `);

    const tradesResult = await db.query(`
      SELECT COUNT(*) as total_trades
      FROM client_trading_performance
      WHERE opened_at >= $1
    `, [startOfMonth]);

    const systemHealthResult = await db.query(`
      SELECT 
        AVG(system_uptime_percent) as avg_uptime
      FROM business_metrics
      WHERE metric_date >= $1
    `, [startOfLastMonth]);

    // Revenue metrics
    const revenueResult = await db.query(`
      SELECT 
        SUM(CASE WHEN pt.created_at >= $1 THEN pt.amount ELSE 0 END) as current_month_revenue,
        SUM(CASE WHEN pt.created_at >= $2 AND pt.created_at <= $3 THEN pt.amount ELSE 0 END) as last_month_revenue,
        COUNT(DISTINCT CASE WHEN c.subscription_status = 'active' THEN c.id END) as active_clients,
        COUNT(DISTINCT CASE WHEN c.created_at >= $1 THEN c.id END) as new_clients_this_month,
        COUNT(DISTINCT CASE WHEN c.subscription_status = 'cancelled' AND c.updated_at >= $1 THEN c.id END) as churned_clients
      FROM clients c
      LEFT JOIN payment_transactions pt ON c.id = pt.client_id AND pt.payment_status = 'completed'
    `, [startOfMonth, startOfLastMonth, endOfLastMonth]);

    // Client metrics
    const clientResult = await db.query(`
      SELECT 
        COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as new_clients_today,
        COUNT(CASE WHEN subscription_status = 'trial' THEN 1 END) as trial_users,
        COUNT(CASE WHEN subscription_status = 'active' AND subscription_start_date >= $1 THEN 1 END) as converted_this_month
      FROM clients
    `, [startOfMonth]);

    // Trading metrics
    const tradingResult = await db.query(`
      SELECT 
        COUNT(*) as total_trades_month,
        COUNT(CASE WHEN profit_loss > 0 THEN 1 END) as successful_trades,
        SUM(lot_size) as total_volume,
        AVG(profit_loss) as average_profit
      FROM client_trading_performance
      WHERE opened_at >= $1
    `, [startOfMonth]);

    // System health
    const healthResult = await db.query(`
      SELECT 
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_vps,
        COUNT(CASE WHEN status = 'connected' THEN 1 END) as connected_mt5
      FROM client_vps_configs cvc
      FULL OUTER JOIN client_mt5_accounts cma ON cvc.client_id = cma.client_id
    `);

    const overview = overviewResult.rows[0];
    const revenue = revenueResult.rows[0];
    const client = clientResult.rows[0];
    const trading = tradingResult.rows[0];
    const health = healthResult.rows[0];
    const systemHealth = systemHealthResult.rows[0];
    const trades = tradesResult.rows[0];

    // Calculate derived metrics
    const currentMrr = parseFloat(revenue.current_month_revenue || 0);
    const lastMrr = parseFloat(revenue.last_month_revenue || 0);
    const revenueGrowth = lastMrr > 0 ? ((currentMrr - lastMrr) / lastMrr) * 100 : 0;
    const activeClients = parseInt(revenue.active_clients || 0);
    const churnRate = activeClients > 0 ? (parseInt(revenue.churned_clients || 0) / activeClients) * 100 : 0;
    const avgRevenuePerUser = activeClients > 0 ? currentMrr / activeClients : 0;
    const totalTradesMonth = parseInt(trading.total_trades_month || 0);
    const successfulTrades = parseInt(trading.successful_trades || 0);
    const successRate = totalTradesMonth > 0 ? (successfulTrades / totalTradesMonth) * 100 : 0;
    const trialUsers = parseInt(client.trial_users || 0);
    const convertedThisMonth = parseInt(client.converted_this_month || 0);
    const conversionRate = trialUsers > 0 ? (convertedThisMonth / trialUsers) * 100 : 0;

    return {
      overview: {
        totalClients: parseInt(overview.total_clients || 0),
        activeSubscriptions: parseInt(overview.active_subscriptions || 0),
        monthlyRevenue: parseFloat(overview.monthly_revenue || 0),
        totalTrades: parseInt(trades.total_trades || 0),
        systemUptime: parseFloat(systemHealth.avg_uptime || 100)
      },
      revenueMetrics: {
        mrr: currentMrr,
        arr: currentMrr * 12,
        churnRate,
        avgRevenuePerUser,
        revenueGrowth
      },
      clientMetrics: {
        newClientsToday: parseInt(client.new_clients_today || 0),
        newClientsThisMonth: parseInt(revenue.new_clients_this_month || 0),
        trialUsers,
        conversionRate,
        clientSatisfaction: 4.2 // Simulated for demo
      },
      tradingMetrics: {
        totalTradesThisMonth: totalTradesMonth,
        successfulTrades,
        successRate,
        totalVolume: parseFloat(trading.total_volume || 0),
        averageProfit: parseFloat(trading.average_profit || 0)
      },
      systemHealth: {
        apiUptime: parseFloat(systemHealth.avg_uptime || 100),
        mt5Connections: parseInt(health.connected_mt5 || 0),
        errorRate: 0.5, // Simulated
        responseTime: 150, // Simulated ms
        activeVpsConfigs: parseInt(health.active_vps || 0)
      }
    };
  }
);

/**
 * Get all clients with details
 */
export const getAllClients = api(
  { expose: true, method: "GET", path: "/admin/clients" },
  async ({ page = 1, limit = 50, status }: { 
    page?: number; 
    limit?: number; 
    status?: string; 
  }): Promise<{ clients: ClientDetails[]; total: number; page: number; totalPages: number }> => {
    const offset = (page - 1) * limit;
    
    let whereClause = '';
    let params: any[] = [limit, offset];
    
    if (status) {
      whereClause = 'WHERE c.subscription_status = $3';
      params.push(status);
    }

    const result = await db.query(`
      SELECT 
        c.id,
        c.telegram_user_id,
        c.telegram_username,
        c.email,
        sp.name as subscription_plan,
        c.subscription_status,
        c.total_revenue,
        c.updated_at as last_activity,
        COUNT(DISTINCT cvc.id) as vps_configs,
        COUNT(DISTINCT cma.id) as mt5_accounts,
        COUNT(DISTINCT ctp.id) as total_trades,
        SUM(ctp.profit_loss) as total_profit_loss
      FROM clients c
      LEFT JOIN subscription_plans sp ON c.subscription_plan_id = sp.id
      LEFT JOIN client_vps_configs cvc ON c.id = cvc.client_id
      LEFT JOIN client_mt5_accounts cma ON c.id = cma.client_id
      LEFT JOIN client_trading_performance ctp ON c.id = ctp.client_id
      ${whereClause}
      GROUP BY c.id, sp.name
      ORDER BY c.created_at DESC
      LIMIT $1 OFFSET $2
    `, params);

    const countResult = await db.query(`
      SELECT COUNT(*) as total FROM clients c ${whereClause}
    `, status ? [status] : []);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    const clients = result.rows.map(row => ({
      id: row.id,
      telegramUserId: row.telegram_user_id,
      telegramUsername: row.telegram_username,
      email: row.email,
      subscriptionPlan: row.subscription_plan || 'None',
      subscriptionStatus: row.subscription_status,
      totalRevenue: parseFloat(row.total_revenue || 0),
      totalTrades: parseInt(row.total_trades || 0),
      lastActivity: row.last_activity,
      vpsConfigs: parseInt(row.vps_configs || 0),
      mt5Accounts: parseInt(row.mt5_accounts || 0),
      profitLoss: parseFloat(row.total_profit_loss || 0)
    }));

    return { clients, total, page, totalPages };
  }
);

/**
 * Extend client subscription
 */
export const extendClientSubscription = api(
  { expose: true, method: "POST", path: "/admin/client/extend" },
  async (data: {
    clientId: number;
    days: number;
    reason: string;
  }): Promise<{ success: boolean; message: string }> => {
    const { clientId, days, reason } = data;

    try {
      const result = await db.query(`
        UPDATE clients 
        SET subscription_end_date = COALESCE(subscription_end_date, NOW()) + INTERVAL '${days} days',
            updated_at = NOW()
        WHERE id = $1
        RETURNING telegram_user_id, subscription_end_date
      `, [clientId]);

      if (result.rows.length === 0) {
        return { success: false, message: 'Client not found' };
      }

      // Log the action
      console.log(`Admin extended subscription for client ${clientId} by ${days} days. Reason: ${reason}`);

      return {
        success: true,
        message: `Subscription extended by ${days} days until ${result.rows[0].subscription_end_date}`
      };

    } catch (error) {
      return {
        success: false,
        message: `Failed to extend subscription: ${error.message}`
      };
    }
  }
);

/**
 * Broadcast message to clients
 */
export const broadcastMessage = api(
  { expose: true, method: "POST", path: "/admin/broadcast" },
  async (data: {
    title: string;
    message: string;
    targetAudience: 'all' | 'active' | 'trial' | 'premium';
    severity: 'info' | 'warning' | 'error';
  }): Promise<{ success: boolean; message: string; targetCount: number }> => {
    const { title, message, targetAudience, severity } = data;

    try {
      // Determine target client IDs
      let targetClientIds: number[] = [];
      
      if (targetAudience === 'all') {
        const result = await db.query(`SELECT id FROM clients`);
        targetClientIds = result.rows.map(row => row.id);
      } else if (targetAudience === 'active') {
        const result = await db.query(`SELECT id FROM clients WHERE subscription_status = 'active'`);
        targetClientIds = result.rows.map(row => row.id);
      } else if (targetAudience === 'trial') {
        const result = await db.query(`SELECT id FROM clients WHERE subscription_status = 'trial'`);
        targetClientIds = result.rows.map(row => row.id);
      } else if (targetAudience === 'premium') {
        const result = await db.query(`
          SELECT c.id FROM clients c
          JOIN subscription_plans sp ON c.subscription_plan_id = sp.id
          WHERE c.subscription_status = 'active' AND sp.price_monthly >= 79
        `);
        targetClientIds = result.rows.map(row => row.id);
      }

      // Create system notification
      await db.query(`
        INSERT INTO system_notifications 
        (notification_type, title, message, severity, target_audience, target_client_ids)
        VALUES ('broadcast', $1, $2, $3, $4, $5)
      `, [title, message, severity, targetAudience, targetClientIds]);

      return {
        success: true,
        message: 'Broadcast message created successfully',
        targetCount: targetClientIds.length
      };

    } catch (error) {
      return {
        success: false,
        message: `Failed to create broadcast: ${error.message}`,
        targetCount: 0
      };
    }
  }
);

/**
 * Get system health status
 */
export const getSystemHealth = api(
  { expose: true, method: "GET", path: "/admin/health" },
  async (): Promise<{
    status: 'healthy' | 'degraded' | 'critical';
    services: Array<{
      name: string;
      status: 'up' | 'down' | 'degraded';
      responseTime?: number;
      lastCheck: Date;
      errorMessage?: string;
    }>;
    metrics: {
      totalRequests: number;
      errorRate: number;
      avgResponseTime: number;
      uptime: number;
    };
  }> => {
    const now = new Date();
    
    // Simulate health checks for various services
    const services = [
      {
        name: 'Database',
        status: 'up' as const,
        responseTime: 45,
        lastCheck: now
      },
      {
        name: 'Gemini AI API',
        status: 'up' as const,
        responseTime: 350,
        lastCheck: now
      },
      {
        name: 'MT5 Bridge',
        status: 'up' as const,
        responseTime: 120,
        lastCheck: now
      },
      {
        name: 'Telegram Bot',
        status: 'up' as const,
        responseTime: 80,
        lastCheck: now
      },
      {
        name: 'Payment Gateway',
        status: 'up' as const,
        responseTime: 200,
        lastCheck: now
      }
    ];

    const downServices = services.filter(s => s.status === 'down').length;
    const degradedServices = services.filter(s => s.status === 'degraded').length;
    
    let overallStatus: 'healthy' | 'degraded' | 'critical';
    if (downServices > 0) {
      overallStatus = 'critical';
    } else if (degradedServices > 0) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }

    return {
      status: overallStatus,
      services,
      metrics: {
        totalRequests: 1250000, // Simulated
        errorRate: 0.5, // Simulated
        avgResponseTime: 150, // Simulated
        uptime: 99.9 // Simulated
      }
    };
  }
);

/**
 * Update business metrics (called by scheduled job)
 */
export const updateBusinessMetrics = api(
  { expose: true, method: "POST", path: "/admin/metrics/update" },
  async (): Promise<{ success: boolean; message: string }> => {
    try {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

      // Calculate daily metrics
      const metricsResult = await db.query(`
        SELECT 
          COUNT(DISTINCT c.id) as active_clients,
          COUNT(DISTINCT CASE WHEN c.created_at >= $1 THEN c.id END) as new_clients,
          COUNT(DISTINCT CASE WHEN c.subscription_status = 'cancelled' AND c.updated_at >= $1 THEN c.id END) as churned_clients,
          SUM(CASE WHEN c.subscription_status = 'active' THEN sp.price_monthly ELSE 0 END) as mrr,
          COUNT(DISTINCT ctp.id) as total_trades,
          COUNT(DISTINCT CASE WHEN ctp.profit_loss > 0 THEN ctp.id END) as successful_trades,
          SUM(ctp.lot_size) as total_volume,
          SUM(ctp.profit_loss) as total_profit,
          AVG(ctp.profit_loss) as avg_profit_per_trade
        FROM clients c
        LEFT JOIN subscription_plans sp ON c.subscription_plan_id = sp.id
        LEFT JOIN client_trading_performance ctp ON c.id = ctp.client_id AND ctp.opened_at >= $1
        WHERE c.subscription_status IN ('active', 'trial')
      `, [yesterday]);

      const metrics = metricsResult.rows[0];
      const mrr = parseFloat(metrics.mrr || 0);

      await db.query(`
        INSERT INTO business_metrics 
        (metric_date, active_clients, new_clients, churned_clients, mrr, arr, 
         total_trades, successful_trades, total_volume, total_profit, average_profit_per_trade)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (metric_date) 
        DO UPDATE SET 
          active_clients = EXCLUDED.active_clients,
          new_clients = EXCLUDED.new_clients,
          churned_clients = EXCLUDED.churned_clients,
          mrr = EXCLUDED.mrr,
          arr = EXCLUDED.arr,
          total_trades = EXCLUDED.total_trades,
          successful_trades = EXCLUDED.successful_trades,
          total_volume = EXCLUDED.total_volume,
          total_profit = EXCLUDED.total_profit,
          average_profit_per_trade = EXCLUDED.average_profit_per_trade
      `, [
        yesterday.toISOString().split('T')[0], // Date only
        parseInt(metrics.active_clients || 0),
        parseInt(metrics.new_clients || 0),
        parseInt(metrics.churned_clients || 0),
        mrr,
        mrr * 12, // ARR
        parseInt(metrics.total_trades || 0),
        parseInt(metrics.successful_trades || 0),
        parseFloat(metrics.total_volume || 0),
        parseFloat(metrics.total_profit || 0),
        parseFloat(metrics.avg_profit_per_trade || 0)
      ]);

      return {
        success: true,
        message: 'Business metrics updated successfully'
      };

    } catch (error) {
      return {
        success: false,
        message: `Failed to update metrics: ${error.message}`
      };
    }
  }
);

/**
 * Get revenue analytics
 */
export const getRevenueAnalytics = api(
  { expose: true, method: "GET", path: "/admin/revenue" },
  async ({ period = '30' }: { period?: string }): Promise<{
    chartData: Array<{ date: string; revenue: number; clients: number }>;
    summary: {
      totalRevenue: number;
      averageMonthlyRevenue: number;
      revenueGrowthRate: number;
      topPlan: string;
    };
  }> => {
    const days = parseInt(period);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const chartResult = await db.query(`
      SELECT 
        DATE(pt.created_at) as date,
        SUM(pt.amount) as revenue,
        COUNT(DISTINCT pt.client_id) as clients
      FROM payment_transactions pt
      WHERE pt.created_at >= $1 AND pt.payment_status = 'completed'
      GROUP BY DATE(pt.created_at)
      ORDER BY date
    `, [startDate]);

    const summaryResult = await db.query(`
      SELECT 
        SUM(pt.amount) as total_revenue,
        AVG(pt.amount) as avg_revenue,
        sp.name as plan_name,
        COUNT(pt.id) as plan_transactions
      FROM payment_transactions pt
      JOIN subscription_plans sp ON pt.subscription_plan_id = sp.id
      WHERE pt.created_at >= $1 AND pt.payment_status = 'completed'
      GROUP BY sp.name
      ORDER BY plan_transactions DESC
    `, [startDate]);

    const chartData = chartResult.rows.map(row => ({
      date: row.date,
      revenue: parseFloat(row.revenue),
      clients: parseInt(row.clients)
    }));

    const totalRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0);
    const avgMonthlyRevenue = totalRevenue / (days / 30);
    const topPlan = summaryResult.rows[0]?.plan_name || 'Basic';

    return {
      chartData,
      summary: {
        totalRevenue,
        averageMonthlyRevenue: avgMonthlyRevenue,
        revenueGrowthRate: 15.5, // Simulated growth rate
        topPlan
      }
    };
  }
);