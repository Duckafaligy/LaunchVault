
-- ============================================================
-- 1. user_preferences (onboarding / personalization profile)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_level text NOT NULL DEFAULT 'beginner',           -- beginner | intermediate | advanced
  primary_goal text,                                       -- launch_saas | grow_audience | learn_ai | freelance | other
  focus_areas text[] NOT NULL DEFAULT '{}',                -- ['prompts','workflows','agents',...]
  tone_preference text NOT NULL DEFAULT 'practical',       -- practical | playful | expert
  daily_time_minutes integer NOT NULL DEFAULT 15,
  completed_onboarding boolean NOT NULL DEFAULT false,
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_preferences_select_own ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'));
CREATE POLICY user_preferences_insert_own ON public.user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_preferences_update_own ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER trg_user_preferences_updated
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 2. course_progress
-- ============================================================
CREATE TABLE IF NOT EXISTS public.course_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id text NOT NULL,
  current_section integer NOT NULL DEFAULT 0,
  total_sections integer NOT NULL DEFAULT 0,
  completed_sections integer[] NOT NULL DEFAULT '{}',
  is_completed boolean NOT NULL DEFAULT false,
  last_opened_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, content_id)
);
ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY course_progress_select_own ON public.course_progress
  FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'));
CREATE POLICY course_progress_upsert_own ON public.course_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY course_progress_update_own ON public.course_progress
  FOR UPDATE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_course_progress_user ON public.course_progress(user_id, last_opened_at DESC);
CREATE TRIGGER trg_course_progress_updated
  BEFORE UPDATE ON public.course_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 3. content_interactions (analytics signal)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.content_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id text NOT NULL,
  interaction_type text NOT NULL,   -- view | open | copy | complete | rate | dismiss
  rating integer,                   -- 1..5 when interaction_type='rate'
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.content_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY content_interactions_select_own ON public.content_interactions
  FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'));
CREATE POLICY content_interactions_insert_own ON public.content_interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_user ON public.content_interactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_content ON public.content_interactions(content_id, interaction_type);

-- ============================================================
-- 4. saved_items
-- ============================================================
CREATE TABLE IF NOT EXISTS public.saved_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, content_id)
);
ALTER TABLE public.saved_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY saved_items_select_own ON public.saved_items
  FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'));
CREATE POLICY saved_items_insert_own ON public.saved_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY saved_items_delete_own ON public.saved_items
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 5. content_generation_runs (cron log)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.content_generation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger text NOT NULL DEFAULT 'cron',          -- cron | manual | test
  status text NOT NULL DEFAULT 'running',        -- running | success | partial | failed
  model text,
  requested_types text[] NOT NULL DEFAULT '{}',
  inserted_count integer NOT NULL DEFAULT 0,
  rejected_count integer NOT NULL DEFAULT 0,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  error text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
ALTER TABLE public.content_generation_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY gen_runs_admin_only ON public.content_generation_runs
  FOR ALL USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- ============================================================
-- 6. test_runs (admin Test Mode)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.test_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  simulated_tier text NOT NULL,
  simulated_persona jsonb NOT NULL DEFAULT '{}'::jsonb,
  content_types text[] NOT NULL DEFAULT '{}',
  results jsonb NOT NULL DEFAULT '{}'::jsonb,
  quality_score numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.test_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY test_runs_admin_only ON public.test_runs
  FOR ALL USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- ============================================================
-- 7. audit_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text,
  target_id text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_logs_admin_only ON public.audit_logs
  FOR ALL USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE INDEX IF NOT EXISTS idx_audit_actor ON public.audit_logs(actor_id, created_at DESC);
