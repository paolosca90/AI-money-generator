ALTER TABLE trading_signals 
ADD COLUMN strategy VARCHAR(20) DEFAULT 'INTRADAY',
ADD COLUMN risk_reward_ratio DOUBLE PRECISION,
ADD COLUMN recommended_lot_size DOUBLE PRECISION,
ADD COLUMN max_holding_hours INTEGER DEFAULT 8;

CREATE INDEX idx_trading_signals_strategy ON trading_signals(strategy);
CREATE INDEX idx_trading_signals_risk_reward ON trading_signals(risk_reward_ratio);
