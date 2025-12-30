-- Migration: Update Bot Monitoring System v1.1
-- Description: Add client field to bots and push_subscription to subscriptions

-- 1. Update bots table
ALTER TABLE public.bots 
ADD COLUMN IF NOT EXISTS client TEXT;

-- Create index for client filtering
CREATE INDEX IF NOT EXISTS idx_bots_client ON public.bots(client);

-- 2. Update subscriptions table
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS push_subscription JSONB;

-- 3. Comments
COMMENT ON COLUMN public.bots.client IS 'Cliente al que pertenece el bot o proceso automatizado';
COMMENT ON COLUMN public.subscriptions.push_subscription IS 'Datos de suscripción para Browser Push Notifications (endpoint, keys)';

-- 4. Update sample data (optional)
UPDATE public.bots SET client = 'Vortex Interno' WHERE client IS NULL;
