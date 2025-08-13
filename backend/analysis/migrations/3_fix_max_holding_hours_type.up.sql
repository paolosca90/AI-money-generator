-- Fix the data type for max_holding_hours to match the code expectations
ALTER TABLE trading_signals 
ALTER COLUMN max_holding_hours TYPE DOUBLE PRECISION;

-- Update any existing NULL values to a default
UPDATE trading_signals 
SET max_holding_hours = 8.0 
WHERE max_holding_hours IS NULL;
