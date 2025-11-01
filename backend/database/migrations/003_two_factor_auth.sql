-- Two-Factor Authentication Migration
-- Adds 2FA fields to users table

-- Add 2FA columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS two_factor_secret TEXT,
ADD COLUMN IF NOT EXISTS two_factor_backup_codes JSONB;

-- Create index for 2FA enabled users (for faster lookups during login)
CREATE INDEX IF NOT EXISTS idx_users_two_factor_enabled
  ON users(two_factor_enabled)
  WHERE two_factor_enabled = true;

-- Add comments
COMMENT ON COLUMN users.two_factor_enabled IS 'Whether 2FA is enabled for this user';
COMMENT ON COLUMN users.two_factor_secret IS 'Encrypted TOTP secret for 2FA (base32 encoded)';
COMMENT ON COLUMN users.two_factor_backup_codes IS 'JSON array of encrypted backup codes for 2FA recovery';

-- Add constraint to ensure secret exists when 2FA is enabled
ALTER TABLE users
ADD CONSTRAINT check_2fa_secret
CHECK (
  (two_factor_enabled = false) OR
  (two_factor_enabled = true AND two_factor_secret IS NOT NULL)
);
