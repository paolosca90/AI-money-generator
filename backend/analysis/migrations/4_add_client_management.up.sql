-- Client management and monetization system
-- This migration adds the complete business infrastructure

-- Subscription tiers
CREATE TABLE subscription_plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  price_monthly DECIMAL(10,2) NOT NULL,
  max_vps INTEGER NOT NULL,
  max_mt5_accounts INTEGER NOT NULL,
  features JSONB NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Insert default subscription plans
INSERT INTO subscription_plans (name, price_monthly, max_vps, max_mt5_accounts, features) VALUES 
('Basic', 29.00, 1, 1, '{"basic_signals": true, "email_support": true, "signal_history": "30_days"}'),
('Premium', 79.00, 3, 3, '{"advanced_signals": true, "priority_support": true, "signal_history": "90_days", "custom_alerts": true, "performance_analytics": true}'),
('Enterprise', 199.00, -1, -1, '{"unlimited_accounts": true, "white_label": true, "api_access": true, "dedicated_support": true, "custom_strategies": true}');

-- Client accounts
CREATE TABLE clients (
  id BIGSERIAL PRIMARY KEY,
  telegram_user_id BIGINT UNIQUE NOT NULL,
  telegram_username VARCHAR(100),
  email VARCHAR(255),
  subscription_plan_id INTEGER REFERENCES subscription_plans(id),
  subscription_status VARCHAR(20) NOT NULL DEFAULT 'trial', -- trial, active, suspended, cancelled
  subscription_start_date TIMESTAMP WITH TIME ZONE,
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  trial_end_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  total_revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Client VPS configurations
CREATE TABLE client_vps_configs (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT REFERENCES clients(id) ON DELETE CASCADE,
  vps_name VARCHAR(100) NOT NULL,
  host VARCHAR(255) NOT NULL,
  port INTEGER NOT NULL DEFAULT 8080,
  username VARCHAR(100),
  password_encrypted TEXT, -- Encrypted password
  mt5_path VARCHAR(500),
  status VARCHAR(20) NOT NULL DEFAULT 'configured', -- configured, active, error, disabled
  last_check TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(client_id, vps_name)
);

-- Client MT5 accounts
CREATE TABLE client_mt5_accounts (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT REFERENCES clients(id) ON DELETE CASCADE,
  vps_config_id BIGINT REFERENCES client_vps_configs(id) ON DELETE CASCADE,
  account_name VARCHAR(100) NOT NULL,
  account_number BIGINT NOT NULL,
  broker VARCHAR(100) NOT NULL,
  server VARCHAR(100) NOT NULL,
  login_encrypted TEXT, -- Encrypted login
  password_encrypted TEXT, -- Encrypted password
  balance DECIMAL(15,2),
  equity DECIMAL(15,2),
  margin DECIMAL(15,2),
  free_margin DECIMAL(15,2),
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  status VARCHAR(20) NOT NULL DEFAULT 'configured', -- configured, connected, disconnected, error
  last_sync TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(client_id, account_number)
);

-- Payment transactions
CREATE TABLE payment_transactions (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT REFERENCES clients(id) ON DELETE CASCADE,
  transaction_id VARCHAR(100) UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'EUR',
  payment_method VARCHAR(50) NOT NULL, -- stripe, paypal, crypto
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, completed, failed, refunded
  subscription_plan_id INTEGER REFERENCES subscription_plans(id),
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  gateway_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Client settings and preferences
CREATE TABLE client_settings (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT REFERENCES clients(id) ON DELETE CASCADE,
  setting_key VARCHAR(100) NOT NULL,
  setting_value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(client_id, setting_key)
);

-- Client trading performance
CREATE TABLE client_trading_performance (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT REFERENCES clients(id) ON DELETE CASCADE,
  mt5_account_id BIGINT REFERENCES client_mt5_accounts(id) ON DELETE CASCADE,
  trade_id VARCHAR(50) NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  direction VARCHAR(10) NOT NULL,
  entry_price DECIMAL(15,5) NOT NULL,
  exit_price DECIMAL(15,5),
  lot_size DECIMAL(10,2) NOT NULL,
  profit_loss DECIMAL(15,2),
  profit_loss_pips DECIMAL(10,1),
  commission DECIMAL(15,2) NOT NULL DEFAULT 0,
  swap DECIMAL(15,2) NOT NULL DEFAULT 0,
  opened_at TIMESTAMP WITH TIME ZONE NOT NULL,
  closed_at TIMESTAMP WITH TIME ZONE,
  strategy VARCHAR(50),
  confidence INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Business analytics and KPIs
CREATE TABLE business_metrics (
  id BIGSERIAL PRIMARY KEY,
  metric_date DATE NOT NULL,
  active_clients INTEGER NOT NULL DEFAULT 0,
  new_clients INTEGER NOT NULL DEFAULT 0,
  churned_clients INTEGER NOT NULL DEFAULT 0,
  mrr DECIMAL(15,2) NOT NULL DEFAULT 0, -- Monthly Recurring Revenue
  arr DECIMAL(15,2) NOT NULL DEFAULT 0, -- Annual Recurring Revenue
  total_trades INTEGER NOT NULL DEFAULT 0,
  successful_trades INTEGER NOT NULL DEFAULT 0,
  total_volume DECIMAL(20,2) NOT NULL DEFAULT 0,
  total_profit DECIMAL(20,2) NOT NULL DEFAULT 0,
  average_profit_per_trade DECIMAL(15,2) NOT NULL DEFAULT 0,
  client_satisfaction_score DECIMAL(3,2), -- 1.00 to 5.00
  support_tickets INTEGER NOT NULL DEFAULT 0,
  system_uptime_percent DECIMAL(5,2) NOT NULL DEFAULT 100.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(metric_date)
);

-- Support tickets
CREATE TABLE support_tickets (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT REFERENCES clients(id) ON DELETE CASCADE,
  ticket_number VARCHAR(20) UNIQUE NOT NULL,
  subject VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'medium', -- low, medium, high, urgent
  status VARCHAR(20) NOT NULL DEFAULT 'open', -- open, in_progress, resolved, closed
  category VARCHAR(50) NOT NULL, -- technical, billing, general, feature_request
  assigned_to VARCHAR(100),
  resolution TEXT,
  satisfaction_rating INTEGER, -- 1-5 stars
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Admin users and permissions
CREATE TABLE admin_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'support', -- support, admin, super_admin
  permissions JSONB NOT NULL DEFAULT '{}',
  last_login TIMESTAMP WITH TIME ZONE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- System notifications and alerts
CREATE TABLE system_notifications (
  id BIGSERIAL PRIMARY KEY,
  notification_type VARCHAR(50) NOT NULL, -- system_alert, maintenance, feature_update
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'info', -- info, warning, error, critical
  target_audience VARCHAR(20) NOT NULL DEFAULT 'all', -- all, admins, specific_clients
  target_client_ids BIGINT[],
  active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_clients_telegram_user_id ON clients(telegram_user_id);
CREATE INDEX idx_clients_subscription_status ON clients(subscription_status);
CREATE INDEX idx_clients_subscription_end_date ON clients(subscription_end_date);
CREATE INDEX idx_client_vps_configs_client_id ON client_vps_configs(client_id);
CREATE INDEX idx_client_mt5_accounts_client_id ON client_mt5_accounts(client_id);
CREATE INDEX idx_payment_transactions_client_id ON payment_transactions(client_id);
CREATE INDEX idx_payment_transactions_payment_status ON payment_transactions(payment_status);
CREATE INDEX idx_client_trading_performance_client_id ON client_trading_performance(client_id);
CREATE INDEX idx_client_trading_performance_opened_at ON client_trading_performance(opened_at);
CREATE INDEX idx_business_metrics_metric_date ON business_metrics(metric_date);
CREATE INDEX idx_support_tickets_client_id ON support_tickets(client_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_system_notifications_active ON system_notifications(active);