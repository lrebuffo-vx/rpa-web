-- Migration: Remove Email and Teams Notification Channels
-- Description: Aligning DB with Push-only notification strategy

-- 1. Update subscriptions table
ALTER TABLE public.subscriptions 
DROP COLUMN IF EXISTS notify_email,
DROP COLUMN IF EXISTS notify_teams,
DROP COLUMN IF EXISTS teams_webhook_url;

-- 2. Update notification_log comment
COMMENT ON COLUMN public.notification_log.channel IS 'Canal de notificación: push (anteriormente email, teams)';
