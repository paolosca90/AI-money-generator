CREATE TABLE vps_configurations (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE NOT NULL,
  vps_provider VARCHAR(50),
  vps_host VARCHAR(255) NOT NULL,
  vps_username VARCHAR(100) NOT NULL,
  vps_password TEXT NOT NULL,
  mt5_login VARCHAR(50) NOT NULL,
  mt5_password TEXT NOT NULL,
  mt5_server VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE vps_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  log_type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vps_configurations_user_id ON vps_configurations(user_id);
CREATE INDEX idx_vps_configurations_status ON vps_configurations(status);
CREATE INDEX idx_vps_logs_user_id ON vps_logs(user_id);
CREATE INDEX idx_vps_logs_created_at ON vps_logs(created_at);
