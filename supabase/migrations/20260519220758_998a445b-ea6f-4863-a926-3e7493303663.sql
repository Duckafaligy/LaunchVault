-- Block anonymous callers entirely; the protect-trigger function is internal only
REVOKE ALL ON FUNCTION public.protect_profile_fields() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.tick_streak(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tick_streak(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.award_xp(uuid, integer) FROM PUBLIC, anon;
-- award_xp should only be called by server functions running with service_role
-- (not authenticated users directly), so keep it locked.
