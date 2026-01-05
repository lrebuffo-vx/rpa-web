-- ==============================================================================
-- SECURITY HARDENING: RLS POLICIES TIGHTENING
-- ==============================================================================

-- 1. Tighten time_entries: Only authenticated users can see metrics
DROP POLICY IF EXISTS "Time entries viewable by everyone" ON public.time_entries;
CREATE POLICY "Time entries viewable by authenticated" 
ON public.time_entries FOR SELECT 
USING (auth.role() = 'authenticated');

-- 2. Tighten planning_entries: Only authenticated users
DROP POLICY IF EXISTS "Planning viewable by everyone" ON public.planning_entries;
CREATE POLICY "Planning viewable by authenticated" 
ON public.planning_entries FOR SELECT 
USING (auth.role() = 'authenticated');

-- 3. Tighten bots: Only authenticated users
DROP POLICY IF EXISTS "Bots are viewable by everyone" ON public.bots;
CREATE POLICY "Bots viewable by authenticated" 
ON public.bots FOR SELECT 
USING (auth.role() = 'authenticated');

-- 4. Tighten incidents: Only authenticated users
DROP POLICY IF EXISTS "Incidents are viewable by everyone" ON public.incidents;
CREATE POLICY "Incidents viewable by authenticated" 
ON public.incidents FOR SELECT 
USING (auth.role() = 'authenticated');

-- 5. Tighten news: Only authenticated users
DROP POLICY IF EXISTS "News are viewable by everyone" ON public.news;
CREATE POLICY "News viewable by authenticated" 
ON public.news FOR SELECT 
USING (auth.role() = 'authenticated');

-- 6. Tighten users profile visibility
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;
CREATE POLICY "Profiles viewable by authenticated" 
ON public.users FOR SELECT 
USING (auth.role() = 'authenticated');

-- ==============================================================================
-- NOTES:
-- - This script changes 'viewable by everyone' to 'viewable by authenticated'.
-- - This ensures data is not public if someone knows your Supabase URL.
-- ==============================================================================
