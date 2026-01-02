-- =====================================================
-- Supabase pg_cron Scheduler for Auto-starting Surveys
-- =====================================================
-- Run this in Supabase SQL Editor (one-time setup)

-- 1. Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Grant usage to postgres user
GRANT USAGE ON SCHEMA cron TO postgres;

-- 3. Create function to start scheduled surveys
CREATE OR REPLACE FUNCTION start_scheduled_surveys()
RETURNS void AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Update all scheduled surveys where scheduled_start has passed
  UPDATE surveys
  SET status = 'live',
      updated_at = now()
  WHERE status = 'scheduled'
    AND scheduled_start <= now();

  -- Get the count of updated rows
  GET DIAGNOSTICS updated_count = ROW_COUNT;

  -- Log the result (optional, for debugging)
  IF updated_count > 0 THEN
    RAISE NOTICE 'Started % scheduled surveys', updated_count;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Schedule the cron job to run every minute
-- First, remove existing job if it exists
SELECT cron.unschedule('start-scheduled-surveys')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'start-scheduled-surveys'
);

-- Schedule new job (runs every minute)
SELECT cron.schedule(
  'start-scheduled-surveys',  -- job name
  '* * * * *',                -- every minute
  'SELECT start_scheduled_surveys()'
);

-- =====================================================
-- Verification & Management Commands
-- =====================================================

-- View all scheduled cron jobs:
-- SELECT * FROM cron.job;

-- View cron job run history:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;

-- Manually run the function (for testing):
-- SELECT start_scheduled_surveys();

-- Unschedule the job:
-- SELECT cron.unschedule('start-scheduled-surveys');
