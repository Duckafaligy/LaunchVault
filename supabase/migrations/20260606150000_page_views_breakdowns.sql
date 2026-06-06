-- =====================================================================
-- LaunchVault — page_views breakdown views
-- Powers the richer admin analytics widget on the account page with:
--   • referrer-source rollup (for SEO vs AEO vs social vs direct splits)
--   • top-pages rollup
--   • country rollup (filled going forward from the CF-IPCountry header)
-- All are read server-side via the service role; getVisitorStats() still
-- enforces the admin role check before returning anything. Each view is
-- pre-aggregated to a small, bounded result set so the PostgREST default
-- row cap is never a factor.
-- =====================================================================

-- Cleaned referrer host (scheme, path, port and a leading "www." stripped),
-- grouped, last 30 days. NULL/empty referrer is bucketed as 'direct'.
-- Channel categorisation (search / ai / social / internal / referral) is
-- done in application code so the host lists are trivial to extend without
-- another migration.
CREATE OR REPLACE VIEW public.v_page_views_sources_30d AS
SELECT
  CASE
    WHEN referrer IS NULL OR referrer = '' THEN 'direct'
    ELSE regexp_replace(
           split_part(
             split_part(regexp_replace(referrer, '^https?://', ''), '/', 1),
             ':', 1),
           '^www\.', '')
  END AS host,
  count(*)::int AS views,
  count(DISTINCT COALESCE(user_id::text, anon_id))::int AS uniques
FROM public.page_views
WHERE occurred_at > now() - interval '30 days'
GROUP BY 1
ORDER BY views DESC;

-- Most-viewed paths, last 30 days (top 50).
CREATE OR REPLACE VIEW public.v_page_views_top_pages_30d AS
SELECT
  path,
  count(*)::int AS views,
  count(DISTINCT COALESCE(user_id::text, anon_id))::int AS uniques
FROM public.page_views
WHERE occurred_at > now() - interval '30 days'
GROUP BY path
ORDER BY views DESC
LIMIT 50;

-- Country rollup, last 30 days. Empty for historical rows; fills in once
-- recordPageView starts storing the Cloudflare CF-IPCountry header.
CREATE OR REPLACE VIEW public.v_page_views_countries_30d AS
SELECT
  country,
  count(*)::int AS views,
  count(DISTINCT COALESCE(user_id::text, anon_id))::int AS uniques
FROM public.page_views
WHERE occurred_at > now() - interval '30 days'
  AND country IS NOT NULL AND country <> ''
GROUP BY country
ORDER BY views DESC;

GRANT SELECT ON public.v_page_views_sources_30d TO authenticated;
GRANT SELECT ON public.v_page_views_top_pages_30d TO authenticated;
GRANT SELECT ON public.v_page_views_countries_30d TO authenticated;

-- Ask PostgREST to refresh its schema cache so the new views are queryable.
NOTIFY pgrst, 'reload schema';
