-- User preferences for trading mode selection and risk management
CREATE TABLE IF NOT EXISTS user_preferences (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE NOT NULL,
  chat_id BIGINT NOT NULL,
  trading_mode VARCHAR(20) DEFAULT NULL, -- 'SCALPING', 'INTRADAY', 'SWING'
  risk_percentage DOUBLE PRECISION DEFAULT 2.0,
  account_balance DOUBLE PRECISION DEFAULT NULL,
  account_currency VARCHAR(10) DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_chat_id ON user_preferences(chat_id);

-- Add user state management for interactive workflows
CREATE TABLE IF NOT EXISTS user_states (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE NOT NULL,
  chat_id BIGINT NOT NULL,
  current_state VARCHAR(50) NOT NULL, -- 'SELECTING_TRADING_MODE', 'SETTING_RISK_AMOUNT', etc.
  state_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_states_user_id ON user_states(user_id);
CREATE INDEX IF NOT EXISTS idx_user_states_current_state ON user_states(current_state);
