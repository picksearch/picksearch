-- =====================================================
-- Supabase pg_cron Scheduler for Survey Automation
-- =====================================================
-- Run this in Supabase SQL Editor (one-time setup)

-- 1. Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Grant usage to postgres user
GRANT USAGE ON SCHEMA cron TO postgres;

-- =====================================================
-- 3. Function: Auto-start scheduled surveys
-- =====================================================
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

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  IF updated_count > 0 THEN
    RAISE NOTICE 'Started % scheduled surveys', updated_count;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. Function: Auto-close surveys at 23:00 on end date
-- =====================================================
CREATE OR REPLACE FUNCTION close_expired_surveys()
RETURNS void AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Close all live surveys where scheduled_end date + 23:00 has passed
  -- scheduled_end is stored as date, so we add 23 hours to it
  UPDATE surveys
  SET status = 'closed',
      updated_at = now()
  WHERE status = 'live'
    AND scheduled_end IS NOT NULL
    AND (scheduled_end::date + INTERVAL '23 hours') <= now();

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  IF updated_count > 0 THEN
    RAISE NOTICE 'Closed % expired surveys', updated_count;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. Schedule cron jobs
-- =====================================================

-- Remove existing jobs if they exist
SELECT cron.unschedule('start-scheduled-surveys')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'start-scheduled-surveys'
);

SELECT cron.unschedule('close-expired-surveys')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'close-expired-surveys'
);

-- Schedule: Start surveys (every minute)
SELECT cron.schedule(
  'start-scheduled-surveys',
  '* * * * *',
  'SELECT start_scheduled_surveys()'
);

-- Schedule: Close surveys (every hour at minute 0)
SELECT cron.schedule(
  'close-expired-surveys',
  '0 * * * *',
  'SELECT close_expired_surveys()'
);

-- =====================================================
-- Verification & Management Commands
-- =====================================================

-- View all scheduled cron jobs:
-- SELECT * FROM cron.job;

-- View cron job run history:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;

-- Manually run functions (for testing):
-- SELECT start_scheduled_surveys();
-- SELECT close_expired_surveys();

-- Unschedule jobs:
-- SELECT cron.unschedule('start-scheduled-surveys');
-- SELECT cron.unschedule('close-expired-surveys');
