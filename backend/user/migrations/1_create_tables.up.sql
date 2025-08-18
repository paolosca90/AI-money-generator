-- Users table stores basic user information linked to Clerk auth.
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_users_clerk_id ON users(clerk_id);

-- User preferences for trading.
CREATE TABLE user_preferences (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  risk_percentage DOUBLE PRECISION NOT NULL DEFAULT 2.0,
  account_balance DOUBLE PRECISION NOT NULL DEFAULT 10000.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- MT5 configurations for each user.
CREATE TABLE mt5_configurations (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  host TEXT NOT NULL,
  port INTEGER NOT NULL,
  login TEXT NOT NULL,
  password TEXT NOT NULL, -- WARNING: Stored in plaintext. Encrypt in a real application.
  server TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_mt5_configurations_user_id ON mt5_configurations(user_id);

-- User subscriptions.
CREATE TABLE subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free', -- e.g., 'free', 'pro', 'enterprise'
  status TEXT NOT NULL DEFAULT 'active', -- e.g., 'active', 'inactive', 'past_due'
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
