-- Database Webhook to send waitlist confirmation email
-- This webhook is triggered when a new entry is inserted into beta_waitlist
-- It calls the Supabase Edge Function to send the confirmation email

-- Create a function that will be called by the webhook
CREATE OR REPLACE FUNCTION send_waitlist_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the Supabase Edge Function via HTTP
  -- Note: You'll need to configure this webhook in Supabase Dashboard
  -- Go to Database > Webhooks > Create Webhook
  -- URL: https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-waitlist-email
  -- Events: INSERT on beta_waitlist table
  
  PERFORM
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-waitlist-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'record', jsonb_build_object(
          'id', NEW.id,
          'role', NEW.role,
          'full_name', NEW.full_name,
          'email', NEW.email,
          'phone', NEW.phone,
          'specialty', NEW.specialty,
          'institution_name', NEW.institution_name
        )
      )
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function on INSERT
CREATE TRIGGER trigger_send_waitlist_email
  AFTER INSERT ON beta_waitlist
  FOR EACH ROW
  EXECUTE FUNCTION send_waitlist_email();

-- Note: For this to work, you need to:
-- 1. Enable the http extension: CREATE EXTENSION IF NOT EXISTS http;
-- 2. Set the service_role_key in app settings
-- 3. Or use Supabase Dashboard Webhooks instead (recommended)
