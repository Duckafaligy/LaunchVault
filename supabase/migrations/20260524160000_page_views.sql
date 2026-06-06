-- =====================================================================
-- LaunchVault — page_views
-- Lightweight analytics for the admin-only stats widget on the account
-- page. Logs every navigation; aggregated on read.
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.page_views (
  id bigserial PRIMARY KEY,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  path text NOT NULL,
  user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  anon_id text NULL,                -- random ID stored in localStorage for unauthed visitors
  user_agent text NULL,
  referrer text NULL,
  country text NULL
);

CREATE INDEX IF NOT EXISTS idx_page_views_occurred_at
  ON public.page_views (occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_page_views_user_id
  ON public.page_views (user_id, occurred_at DESC)
  WHERE user_id IS NOT NULL;

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Only admins can read raw page view data
DROP POLICY IF EXISTS "page_views_admin_read" ON public.page_views;
CREATE POLICY "page_views_admin_read" ON public.page_views FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- All inserts happen server-side with the service role, which bypasses RLS.
-- We don't enable any insert policy for users.

-- Daily rollup view, last 30 days
CREATE OR REPLACE VIEW public.v_page_views_daily AS
SELECT
  date_trunc('day', occurred_at AT TIME ZONE 'UTC')::date AS day,
  count(*)::int AS views,
  count(DISTINCT COALESCE(user_id::text, anon_id))::int AS unique_visitors,
  count(*) FILTER (WHERE user_id IS NOT NULL)::int AS auth_views
FROM public.page_views
WHERE occurred_at > now() - interval '30 days'
GROUP BY 1
ORDER BY 1 DESC;

GRANT SELECT ON public.v_page_views_daily TO authenticated;
