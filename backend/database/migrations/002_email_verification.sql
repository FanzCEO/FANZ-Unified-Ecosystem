-- Email Verification System Migration
-- Creates tables and indexes for email verification functionality

-- Create verification_tokens table
CREATE TABLE IF NOT EXISTS verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('email_verification', 'password_reset', '2fa_setup')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Ensure only one active token per user per type
  CONSTRAINT unique_active_user_token UNIQUE (user_id, type, used_at) INITIALLY DEFERRED
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_user_id ON verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_type ON verification_tokens(type);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_expires_at ON verification_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_used_at ON verification_tokens(used_at);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_verification_tokens_user_type_active
  ON verification_tokens(user_id, type)
  WHERE used_at IS NULL AND expires_at > NOW();

-- Add comment
COMMENT ON TABLE verification_tokens IS 'Stores verification tokens for email verification, password reset, and 2FA setup';
COMMENT ON COLUMN verification_tokens.type IS 'Type of verification: email_verification, password_reset, or 2fa_setup';
COMMENT ON COLUMN verification_tokens.used_at IS 'NULL if unused, timestamp when token was used';
COMMENT ON COLUMN verification_tokens.expires_at IS 'Token expiration timestamp (typically 24 hours for email, 1 hour for password reset)';

-- Function to clean up expired tokens (run periodically via cron job or trigger)
CREATE OR REPLACE FUNCTION cleanup_expired_verification_tokens()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM verification_tokens
  WHERE expires_at < NOW() - INTERVAL '7 days'; -- Keep for 7 days after expiration for audit

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_verification_tokens IS 'Removes verification tokens that expired more than 7 days ago';
