-- Add a column to store the signal's expiry time
ALTER TABLE trading_signals
ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;

-- Add an index for efficient querying of expired trades
CREATE INDEX IF NOT EXISTS idx_trading_signals_expires_at ON trading_signals(expires_at);

-- Add a column to track the status of the signal/trade
ALTER TABLE trading_signals
ADD COLUMN status VARCHAR(20) DEFAULT 'pending'; -- pending, executed, closed, expired

CREATE INDEX IF NOT EXISTS idx_trading_signals_status ON trading_signals(status);
