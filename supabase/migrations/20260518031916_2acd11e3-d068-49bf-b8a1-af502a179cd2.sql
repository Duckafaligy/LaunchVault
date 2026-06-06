
REVOKE EXECUTE ON FUNCTION public.tier_rank(public.subscription_tier) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_tier_access(uuid, public.subscription_tier) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.consume_credits(uuid, text, integer, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.unlock_content(uuid, text) FROM PUBLIC, anon, authenticated;
