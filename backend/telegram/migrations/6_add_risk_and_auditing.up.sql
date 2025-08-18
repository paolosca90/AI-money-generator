-- User-specific risk configurations
CREATE TABLE IF NOT EXISTS risk_configs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE NOT NULL,
  max_risk_per_trade_pct DOUBLE PRECISION DEFAULT 2.0,
  max_daily_risk_pct DOUBLE PRECISION DEFAULT 5.0,
  max_concurrent_trades INT DEFAULT 5,
  default_sl_mode VARCHAR(20) DEFAULT 'ATR', -- e.g., 'ATR', 'PIPS'
  default_tp_mode VARCHAR(20) DEFAULT 'RR', -- e.g., 'RR', 'PIPS'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES user_preferences(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_risk_configs_user_id ON risk_configs(user_id);

-- Audit logs for important actions
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  action VARCHAR(100) NOT NULL, -- e.g., 'ORDER_PLACED', 'RISK_CONFIG_UPDATED'
  meta_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
