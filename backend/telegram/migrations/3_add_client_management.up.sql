CREATE TABLE client_configurations (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE NOT NULL,
  subscription_type VARCHAR(20) NOT NULL DEFAULT 'basic',
  features JSONB NOT NULL DEFAULT '[]',
  expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
  max_vps_configurations INT NOT NULL DEFAULT 1,
  max_mt5_accounts INT NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE client_usage_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  feature_used VARCHAR(100) NOT NULL,
  usage_count INT NOT NULL DEFAULT 1,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE client_payments (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  subscription_type VARCHAR(20) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
  payment_method VARCHAR(50),
  transaction_id VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_client_configurations_user_id ON client_configurations(user_id);
CREATE INDEX idx_client_configurations_subscription_type ON client_configurations(subscription_type);
CREATE INDEX idx_client_configurations_expiry_date ON client_configurations(expiry_date);
CREATE INDEX idx_client_configurations_is_active ON client_configurations(is_active);

CREATE INDEX idx_client_usage_logs_user_id ON client_usage_logs(user_id);
CREATE INDEX idx_client_usage_logs_feature_used ON client_usage_logs(feature_used);
CREATE INDEX idx_client_usage_logs_usage_date ON client_usage_logs(usage_date);

CREATE INDEX idx_client_payments_user_id ON client_payments(user_id);
CREATE INDEX idx_client_payments_status ON client_payments(status);
CREATE INDEX idx_client_payments_created_at ON client_payments(created_at);