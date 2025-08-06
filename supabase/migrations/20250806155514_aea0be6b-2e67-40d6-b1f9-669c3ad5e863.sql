-- Fix OTP expiry settings to meet security recommendations
-- Set OTP expiry to 10 minutes (600 seconds) instead of the default longer period
UPDATE auth.config SET value = '600' WHERE key = 'otp_expiry';