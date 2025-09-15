-- Migration: Add processor tracking and health monitoring
-- Date: 2024-12-15
-- Description: Adds processor-specific columns to transactions/payouts and creates processor health tracking

BEGIN;

-- Add processor tracking columns to transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS processor_name VARCHAR(50);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS processor_fees JSONB DEFAULT '{}';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS processor_metadata JSONB DEFAULT '{}';

-- Add processor tracking columns to payouts table  
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS processor_name VARCHAR(50);
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS processor_fees JSONB DEFAULT '{}';
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS processor_metadata JSONB DEFAULT '{}';

-- Create processor health tracking table
CREATE TABLE IF NOT EXISTS processor_health_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  processor_name VARCHAR(50) NOT NULL,
  is_healthy BOOLEAN NOT NULL,
  response_time_ms INTEGER,
  error_message TEXT,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Create processor performance metrics table
CREATE TABLE IF NOT EXISTS processor_performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  processor_name VARCHAR(50) NOT NULL,
  metric_name VARCHAR(100) NOT NULL,
  metric_value DECIMAL(15,6) NOT NULL,
  metric_unit VARCHAR(20),
  tags JSONB DEFAULT '{}',
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create processor configuration table for dynamic settings
CREATE TABLE IF NOT EXISTS processor_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  processor_name VARCHAR(50) UNIQUE NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 100,
  routing_rules JSONB DEFAULT '{}',
  fee_structure JSONB DEFAULT '{}',
  limits JSONB DEFAULT '{}',
  environment VARCHAR(20) DEFAULT 'production',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_processor_name ON transactions(processor_name);
CREATE INDEX IF NOT EXISTS idx_transactions_processor_created ON transactions(processor_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payouts_processor_name ON payouts(processor_name);
CREATE INDEX IF NOT EXISTS idx_payouts_processor_created ON payouts(processor_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_processor_health_logs_processor_time ON processor_health_logs(processor_name, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_processor_health_logs_healthy ON processor_health_logs(processor_name, is_healthy, checked_at DESC);

CREATE INDEX IF NOT EXISTS idx_processor_performance_processor_metric ON processor_performance_metrics(processor_name, metric_name, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_processor_performance_recorded ON processor_performance_metrics(recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_processor_configurations_enabled ON processor_configurations(is_enabled, priority);

-- Insert default processor configurations for adult-friendly processors
INSERT INTO processor_configurations (processor_name, is_enabled, priority, routing_rules, fee_structure, limits, environment) 
VALUES 
  (
    'ccbill', 
    true, 
    10, 
    '{"regions": ["US", "CA", "EU"], "transaction_types": ["subscription", "one_time"], "min_amount": 1.00, "max_amount": 1000.00}',
    '{"base_rate": 0.109, "fixed_fee": 0.15, "chargeback_fee": 25.00}',
    '{"daily_limit": 50000.00, "monthly_limit": 1000000.00, "max_transaction": 1000.00}',
    'production'
  ),
  (
    'paxum', 
    true, 
    20, 
    '{"regions": ["GLOBAL"], "transaction_types": ["payout"], "min_amount": 10.00, "max_amount": 10000.00}',
    '{"wire_fee": 45.00, "ewallet_fee": 0.50, "bank_transfer_fee": 25.00}',
    '{"daily_limit": 25000.00, "monthly_limit": 500000.00, "max_payout": 10000.00}',
    'production'
  ),
  (
    'segpay', 
    true, 
    30, 
    '{"regions": ["EU", "US"], "transaction_types": ["subscription", "one_time"], "min_amount": 1.00, "max_amount": 500.00}',
    '{"base_rate": 0.12, "fixed_fee": 0.20, "chargeback_fee": 30.00}',
    '{"daily_limit": 25000.00, "monthly_limit": 500000.00, "max_transaction": 500.00}',
    'production'
  ),
  (
    'mock', 
    true, 
    1000, 
    '{"regions": ["ALL"], "transaction_types": ["all"], "min_amount": 0.01, "max_amount": 99999.99}',
    '{"base_rate": 0.00, "fixed_fee": 0.00}',
    '{"daily_limit": 999999.99, "monthly_limit": 999999.99}',
    'development'
  )
ON CONFLICT (processor_name) DO NOTHING;

-- Create function to automatically update processor configuration timestamps
CREATE OR REPLACE FUNCTION update_processor_configuration_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for processor configuration updates
DROP TRIGGER IF EXISTS trigger_processor_configurations_updated_at ON processor_configurations;
CREATE TRIGGER trigger_processor_configurations_updated_at
  BEFORE UPDATE ON processor_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_processor_configuration_updated_at();

-- Create function to clean up old health logs (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_processor_health_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM processor_health_logs 
  WHERE checked_at < NOW() - INTERVAL '30 days';
  
  DELETE FROM processor_performance_metrics 
  WHERE recorded_at < NOW() - INTERVAL '90 days';
END;
$$ language 'plpgsql';

-- Create view for processor health summary
CREATE OR REPLACE VIEW processor_health_summary AS
SELECT 
  processor_name,
  COUNT(*) as total_checks,
  COUNT(*) FILTER (WHERE is_healthy = true) as healthy_checks,
  ROUND(
    (COUNT(*) FILTER (WHERE is_healthy = true) * 100.0 / COUNT(*))::numeric, 2
  ) as health_percentage,
  AVG(response_time_ms) as avg_response_time_ms,
  MAX(checked_at) as last_check_at,
  bool_and(is_healthy) FILTER (
    WHERE checked_at >= NOW() - INTERVAL '1 hour'
  ) as currently_healthy
FROM processor_health_logs
WHERE checked_at >= NOW() - INTERVAL '24 hours'
GROUP BY processor_name
ORDER BY health_percentage DESC, processor_name;

-- Create view for transaction volume by processor
CREATE OR REPLACE VIEW processor_transaction_summary AS
SELECT 
  t.processor_name,
  DATE_TRUNC('day', t.created_at) as transaction_date,
  COUNT(*) as transaction_count,
  SUM(t.amount) as total_volume,
  AVG(t.amount) as avg_transaction_amount,
  SUM(CASE WHEN t.status = 'completed' THEN t.amount ELSE 0 END) as completed_volume,
  COUNT(*) FILTER (WHERE t.status = 'completed') as completed_count,
  COUNT(*) FILTER (WHERE t.status = 'failed') as failed_count,
  COUNT(*) FILTER (WHERE t.status = 'disputed') as disputed_count,
  COALESCE(
    SUM((t.processor_fees->>'total_fees')::decimal), 0
  ) as total_processor_fees
FROM transactions t
WHERE t.created_at >= NOW() - INTERVAL '90 days'
  AND t.processor_name IS NOT NULL
GROUP BY t.processor_name, DATE_TRUNC('day', t.created_at)
ORDER BY transaction_date DESC, processor_name;

-- Create view for payout summary by processor
CREATE OR REPLACE VIEW processor_payout_summary AS
SELECT 
  p.processor_name,
  DATE_TRUNC('day', p.created_at) as payout_date,
  COUNT(*) as payout_count,
  SUM(p.amount) as total_payout_volume,
  AVG(p.amount) as avg_payout_amount,
  COUNT(*) FILTER (WHERE p.status = 'completed') as completed_payouts,
  COUNT(*) FILTER (WHERE p.status = 'failed') as failed_payouts,
  COALESCE(
    SUM((p.processor_fees->>'total_fees')::decimal), 0
  ) as total_payout_fees
FROM payouts p
WHERE p.created_at >= NOW() - INTERVAL '90 days'
  AND p.processor_name IS NOT NULL
GROUP BY p.processor_name, DATE_TRUNC('day', p.created_at)
ORDER BY payout_date DESC, processor_name;

-- Grant permissions
GRANT SELECT ON processor_health_logs TO finance_readonly;
GRANT SELECT ON processor_performance_metrics TO finance_readonly;
GRANT SELECT ON processor_configurations TO finance_readonly;
GRANT SELECT ON processor_health_summary TO finance_readonly;
GRANT SELECT ON processor_transaction_summary TO finance_readonly;
GRANT SELECT ON processor_payout_summary TO finance_readonly;

GRANT INSERT, UPDATE, DELETE ON processor_health_logs TO finance_app;
GRANT INSERT, UPDATE, DELETE ON processor_performance_metrics TO finance_app;
GRANT SELECT, UPDATE ON processor_configurations TO finance_app;

COMMIT;

-- Post-migration data updates (run separately to avoid long transaction)
-- Update existing transactions with processor names based on metadata
-- This should be run as a separate maintenance script after migration
/*
UPDATE transactions 
SET processor_name = 'ccbill'
WHERE metadata->>'processor' = 'ccbill' 
  AND processor_name IS NULL;

UPDATE transactions 
SET processor_name = 'paxum'
WHERE metadata->>'processor' = 'paxum' 
  AND processor_name IS NULL;

UPDATE transactions 
SET processor_name = 'segpay'
WHERE metadata->>'processor' = 'segpay' 
  AND processor_name IS NULL;

UPDATE transactions 
SET processor_name = 'mock'
WHERE metadata->>'processor' = 'mock' 
  AND processor_name IS NULL;
*/