
-- Disable email confirmation requirement
UPDATE auth.config 
SET email_confirm_required = false 
WHERE true;

-- Also disable email change confirmation
UPDATE auth.config 
SET email_change_confirm_required = false 
WHERE true;

-- Update the signup settings to not require confirmation
INSERT INTO auth.config (parameter, value) 
VALUES ('SIGNUP_AUTOCONFIRM', 'true') 
ON CONFLICT (parameter) 
DO UPDATE SET value = 'true';

-- Fix any potential issues with existing unconfirmed users
UPDATE auth.users 
SET email_confirmed_at = now(), 
    confirmed_at = now() 
WHERE email_confirmed_at IS NULL;
