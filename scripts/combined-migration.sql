-- =====================================================================
-- LaunchVault — COMBINED MIGRATIONS
-- Generated 2026-05-24T00:27:07Z
-- Paste this entire file into a NEW Supabase project's SQL Editor.
-- Run as a single query. Should report success with no errors.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 20260518022334_aa09fa64-fec2-4906-9c39-a8f10b9a8ba2.sql
-- ---------------------------------------------------------------------
-- ============== ENUMS ==============
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.subscription_tier AS ENUM ('free', 'tier1', 'tier2');
CREATE TYPE public.subscription_status AS ENUM ('inactive', 'active', 'trialing', 'past_due', 'canceled');
CREATE TYPE public.content_type AS ENUM ('template', 'prompt', 'course');
CREATE TYPE public.credit_bucket AS ENUM ('template_prompt', 'mini_course', 'main_course');
CREATE TYPE public.unlock_type AS ENUM ('credit', 'admin', 'purchase');
CREATE TYPE public.credit_txn_type AS ENUM ('purchase', 'unlock', 'refund', 'admin_adjustment');

-- ============== UPDATED_AT HELPER ==============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============== PROFILES ==============
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  subscription_tier public.subscription_tier NOT NULL DEFAULT 'free',
  subscription_status public.subscription_status NOT NULL DEFAULT 'inactive',
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  template_prompt_credits int NOT NULL DEFAULT 0,
  mini_course_credits int NOT NULL DEFAULT 0,
  main_course_credits int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============== USER ROLES (separate, anti-recursion) ==============
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- ============== AUTO-CREATE PROFILE ON SIGNUP ==============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============== CONTENT ITEMS (metadata, public) ==============
CREATE TABLE public.content_items (
  id text PRIMARY KEY,
  type public.content_type NOT NULL,
  category text NOT NULL,
  tier_required public.subscription_tier NOT NULL DEFAULT 'free',
  title text NOT NULL,
  description text NOT NULL,
  preview_text text NOT NULL DEFAULT '',
  thumbnail_url text,
  tags text[] NOT NULL DEFAULT '{}',
  difficulty text,
  estimated_minutes int,
  course_size text CHECK (course_size IN ('mini', 'main') OR course_size IS NULL),
  credit_type public.credit_bucket,
  credit_cost int NOT NULL DEFAULT 1,
  is_published boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_content_items_updated_at
BEFORE UPDATE ON public.content_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============== CONTENT PAYLOADS (protected) ==============
CREATE TABLE public.content_payloads (
  content_id text PRIMARY KEY REFERENCES public.content_items(id) ON DELETE CASCADE,
  code text,
  prompt text,
  course_sections jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.content_payloads ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_content_payloads_updated_at
BEFORE UPDATE ON public.content_payloads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============== PACKS ==============
CREATE TABLE public.packs (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  tier_required public.subscription_tier NOT NULL DEFAULT 'free',
  preview_text text NOT NULL DEFAULT '',
  thumbnail_url text,
  tags text[] NOT NULL DEFAULT '{}',
  credit_cost_template_prompt int NOT NULL DEFAULT 0,
  credit_cost_mini_course int NOT NULL DEFAULT 0,
  credit_cost_main_course int NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.packs ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_packs_updated_at
BEFORE UPDATE ON public.packs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.pack_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id text NOT NULL REFERENCES public.packs(id) ON DELETE CASCADE,
  content_id text NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
  sort_order int NOT NULL DEFAULT 0,
  UNIQUE (pack_id, content_id)
);
ALTER TABLE public.pack_items ENABLE ROW LEVEL SECURITY;

-- ============== UNLOCKS ==============
CREATE TABLE public.user_content_unlocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id text NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
  unlock_type public.unlock_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, content_id)
);
ALTER TABLE public.user_content_unlocks ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_pack_unlocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pack_id text NOT NULL REFERENCES public.packs(id) ON DELETE CASCADE,
  unlock_type public.unlock_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, pack_id)
);
ALTER TABLE public.user_pack_unlocks ENABLE ROW LEVEL SECURITY;

-- ============== CREDIT TRANSACTIONS ==============
CREATE TABLE public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type public.credit_txn_type NOT NULL,
  credit_bucket public.credit_bucket NOT NULL,
  amount int NOT NULL,
  related_content_id text REFERENCES public.content_items(id) ON DELETE SET NULL,
  related_pack_id text REFERENCES public.packs(id) ON DELETE SET NULL,
  stripe_payment_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- ============== PAYMENT EVENTS ==============
CREATE TABLE public.payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  provider text NOT NULL DEFAULT 'stripe',
  event_type text NOT NULL,
  product_key text,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_payment_intent_id text,
  raw_event jsonb NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

-- ============== RLS POLICIES ==============

-- profiles: user owns their own row; admins can read all
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE
  USING (auth.uid() = id);
-- inserts are done by trigger; allow admin manual inserts
CREATE POLICY "profiles_insert_admin" ON public.profiles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- user_roles: users see their own; only admins can write
CREATE POLICY "user_roles_select_self_or_admin" ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_roles_admin_write" ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- content_items: public read for published; admins manage
CREATE POLICY "content_items_public_read" ON public.content_items FOR SELECT
  USING (is_published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "content_items_admin_write" ON public.content_items FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- content_payloads: NO direct read by users. Admin only via RLS; server-side service role bypasses.
CREATE POLICY "content_payloads_admin_only" ON public.content_payloads FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- packs: public read published; admin manage
CREATE POLICY "packs_public_read" ON public.packs FOR SELECT
  USING (is_published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "packs_admin_write" ON public.packs FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- pack_items: public read; admin write
CREATE POLICY "pack_items_public_read" ON public.pack_items FOR SELECT USING (true);
CREATE POLICY "pack_items_admin_write" ON public.pack_items FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- user_content_unlocks: user reads own; writes happen server-side (service role)
CREATE POLICY "user_content_unlocks_select_own" ON public.user_content_unlocks FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_content_unlocks_admin_write" ON public.user_content_unlocks FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- user_pack_unlocks: same shape
CREATE POLICY "user_pack_unlocks_select_own" ON public.user_pack_unlocks FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_pack_unlocks_admin_write" ON public.user_pack_unlocks FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- credit_transactions: user reads own; server-side writes
CREATE POLICY "credit_txn_select_own" ON public.credit_transactions FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "credit_txn_admin_write" ON public.credit_transactions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- payment_events: admin only
CREATE POLICY "payment_events_admin_only" ON public.payment_events FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============== INDEXES ==============
CREATE INDEX idx_content_items_type ON public.content_items(type);
CREATE INDEX idx_content_items_tier ON public.content_items(tier_required);
CREATE INDEX idx_content_items_category ON public.content_items(category);
CREATE INDEX idx_content_items_featured ON public.content_items(is_featured) WHERE is_featured = true;
CREATE INDEX idx_pack_items_pack ON public.pack_items(pack_id);
CREATE INDEX idx_user_content_unlocks_user ON public.user_content_unlocks(user_id);
CREATE INDEX idx_user_pack_unlocks_user ON public.user_pack_unlocks(user_id);
CREATE INDEX idx_credit_txn_user ON public.credit_transactions(user_id);
CREATE INDEX idx_payment_events_user ON public.payment_events(user_id);

-- ---------------------------------------------------------------------
-- 20260518022350_045a7a01-2f8b-493c-8c78-ea2d4dcc4d9b.sql
-- ---------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------
-- 20260518030510_f3acc559-60b6-4b2e-aa60-4904963c60dc.sql
-- ---------------------------------------------------------------------
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- ---------------------------------------------------------------------
-- 20260518031827_fc5ebbbf-f0f3-4137-9182-cbf03263ef5f.sql
-- ---------------------------------------------------------------------
ALTER TYPE public.subscription_tier ADD VALUE IF NOT EXISTS 'tier3';
ALTER TYPE public.subscription_tier ADD VALUE IF NOT EXISTS 'tier4';

-- ---------------------------------------------------------------------
-- 20260518031857_eb9d857a-dec0-46a0-821e-a6d64cd60d19.sql
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.tier_rank(_tier public.subscription_tier)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE _tier::text
    WHEN 'free'  THEN 0
    WHEN 'tier1' THEN 1
    WHEN 'tier2' THEN 2
    WHEN 'tier3' THEN 3
    WHEN 'tier4' THEN 4
    ELSE 0
  END
$$;

CREATE OR REPLACE FUNCTION public.has_tier_access(_user_id uuid, _required public.subscription_tier)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id
      AND public.tier_rank(subscription_tier) >= public.tier_rank(_required)
      AND (subscription_status = 'active' OR _required::text = 'free')
  )
$$;

CREATE OR REPLACE FUNCTION public.consume_credits(
  _user_id uuid,
  _bucket text,
  _amount integer,
  _content_id text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _updated integer;
BEGIN
  IF _amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;

  IF _bucket = 'template_prompt' THEN
    UPDATE public.profiles
       SET template_prompt_credits = template_prompt_credits - _amount,
           updated_at = now()
     WHERE id = _user_id AND template_prompt_credits >= _amount;
  ELSIF _bucket = 'mini_course' THEN
    UPDATE public.profiles
       SET mini_course_credits = mini_course_credits - _amount,
           updated_at = now()
     WHERE id = _user_id AND mini_course_credits >= _amount;
  ELSIF _bucket = 'main_course' THEN
    UPDATE public.profiles
       SET main_course_credits = main_course_credits - _amount,
           updated_at = now()
     WHERE id = _user_id AND main_course_credits >= _amount;
  ELSE
    RAISE EXCEPTION 'Unknown credit bucket: %', _bucket;
  END IF;

  GET DIAGNOSTICS _updated = ROW_COUNT;
  IF _updated = 0 THEN RETURN false; END IF;

  INSERT INTO public.credit_transactions (
    user_id, transaction_type, credit_bucket, amount, related_content_id
  ) VALUES (
    _user_id, 'spend', _bucket::credit_bucket, -_amount, _content_id
  );

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.unlock_content(_user_id uuid, _content_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _item public.content_items%ROWTYPE;
  _already_unlocked boolean;
  _consumed boolean;
BEGIN
  SELECT * INTO _item FROM public.content_items WHERE id = _content_id AND is_published = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.user_content_unlocks
    WHERE user_id = _user_id AND content_id = _content_id
  ) INTO _already_unlocked;

  IF _already_unlocked THEN
    RETURN jsonb_build_object('ok', true, 'reason', 'already_unlocked');
  END IF;

  IF public.has_tier_access(_user_id, _item.tier_required) THEN
    INSERT INTO public.user_content_unlocks (user_id, content_id, unlock_type)
    VALUES (_user_id, _content_id, 'subscription')
    ON CONFLICT DO NOTHING;
    RETURN jsonb_build_object('ok', true, 'reason', 'tier_access');
  END IF;

  IF _item.credit_type IS NULL OR _item.credit_cost <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'requires_tier');
  END IF;

  _consumed := public.consume_credits(
    _user_id, _item.credit_type::text, _item.credit_cost, _content_id
  );

  IF NOT _consumed THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'insufficient_credits');
  END IF;

  INSERT INTO public.user_content_unlocks (user_id, content_id, unlock_type)
  VALUES (_user_id, _content_id, 'credit')
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object('ok', true, 'reason', 'credit_spent');
END;
$$;

CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  NEW.subscription_tier        := OLD.subscription_tier;
  NEW.subscription_status      := OLD.subscription_status;
  NEW.template_prompt_credits  := OLD.template_prompt_credits;
  NEW.mini_course_credits      := OLD.mini_course_credits;
  NEW.main_course_credits      := OLD.main_course_credits;
  NEW.stripe_customer_id       := OLD.stripe_customer_id;
  NEW.stripe_subscription_id   := OLD.stripe_subscription_id;
  NEW.current_period_end       := OLD.current_period_end;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_fields_trg ON public.profiles;
CREATE TRIGGER protect_profile_fields_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_fields();

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'brendanhllau@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;


-- ---------------------------------------------------------------------
-- 20260518031916_2acd11e3-d068-49bf-b8a1-af502a179cd2.sql
-- ---------------------------------------------------------------------

REVOKE EXECUTE ON FUNCTION public.tier_rank(public.subscription_tier) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_tier_access(uuid, public.subscription_tier) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.consume_credits(uuid, text, integer, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.unlock_content(uuid, text) FROM PUBLIC, anon, authenticated;


-- ---------------------------------------------------------------------
-- 20260518033325_c3f6df1b-5e12-4747-9974-00d58a55ee8a.sql
-- ---------------------------------------------------------------------
ALTER PUBLICATION supabase_realtime DROP TABLE public.profiles;

-- ---------------------------------------------------------------------
-- 20260518040106_c5bd74da-2eb3-4324-9f2e-2456c66244f3.sql
-- ---------------------------------------------------------------------
-- Seed: 1 template, 1 prompt, 1 mini-course (idempotent)
INSERT INTO public.content_items
  (id, type, category, tier_required, title, description, preview_text, is_published, credit_cost, credit_type, course_size, estimated_minutes, difficulty, is_featured, tags)
VALUES
  ('template-hero-gradient-001', 'template', 'Hero', 'free', 'Gradient Hero Section',
   'A modern hero with gradient background, headline, subhead, and dual CTA buttons.',
   'Production-ready Tailwind hero section with gradient background and dual CTA.',
   true, 1, 'template_prompt', NULL, NULL, 'beginner', true, ARRAY['hero','tailwind','landing']),
  ('prompt-landing-copy-001', 'prompt', 'Copywriting', 'free', 'High-Converting Landing Page Copy',
   'A structured prompt that generates conversion-focused landing page copy in seconds.',
   'Get punchy hero copy, three benefit pillars, and a closing CTA in one prompt.',
   true, 1, 'template_prompt', NULL, NULL, 'beginner', true, ARRAY['copy','marketing','ai']),
  ('course-ship-saas-001', 'course', 'SaaS Foundations', 'tier2', 'Ship Your First SaaS in a Weekend',
   'A practical mini-course covering setup, auth, payments, and your first paying customer.',
   '4 short lessons. No fluff. By the end you have a deployable SaaS skeleton.',
   true, 1, 'mini_course', 'mini', 35, 'intermediate', true, ARRAY['saas','course'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.content_payloads (content_id, code, prompt, course_sections)
VALUES
  ('template-hero-gradient-001',
   '<section class="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 px-6 py-24 text-white">
  <div class="mx-auto max-w-4xl text-center">
    <span class="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur">New · v2.0 is live</span>
    <h1 class="mt-6 text-5xl font-bold tracking-tight md:text-6xl">Build something people love</h1>
    <p class="mx-auto mt-4 max-w-2xl text-lg text-white/80">The fastest way to launch your next product. Beautiful out of the box, customizable to the core.</p>
    <div class="mt-8 flex justify-center gap-3">
      <a href="#" class="rounded-lg bg-white px-6 py-3 font-semibold text-indigo-700 shadow-lg hover:bg-white/90">Start free</a>
      <a href="#" class="rounded-lg border border-white/30 px-6 py-3 font-semibold text-white hover:bg-white/10">See demo</a>
    </div>
  </div>
</section>',
   NULL, NULL),
  ('prompt-landing-copy-001',
   NULL,
   'You are a senior conversion copywriter. Write landing page copy for: {{PRODUCT}}.

Audience: {{AUDIENCE}}
Primary goal: {{GOAL}}

Output exactly this structure in markdown:
1. **Hero headline** (max 9 words, benefit-focused, no jargon)
2. **Sub-headline** (1 sentence, who it''s for + outcome)
3. **Three benefit pillars** (each: 3-word title + 1 sentence)
4. **Social proof line** (1 punchy line)
5. **Primary CTA** (2-4 words, action verb)
6. **Closing reassurance** (1 sentence handling the biggest objection)

Rules: no buzzwords, no "revolutionary/game-changing", use concrete numbers when possible, write at a 7th-grade reading level.',
   NULL),
  ('course-ship-saas-001',
   NULL, NULL,
   '[
     {"title":"Lesson 1 — The 80/20 SaaS Stack","content":"Pick boring tech that ships. We use TanStack Start + Supabase + Stripe. Why: auth, db, payments, and SSR in one weekend. Skip: microservices, custom auth, hand-rolled queues."},
     {"title":"Lesson 2 — Auth in 20 minutes","content":"Email/password + Google OAuth covers 95% of users. Wire onAuthStateChange first, then getSession. Protect routes with a layout that redirects to /login. Never store roles on the profile — use a separate user_roles table."},
     {"title":"Lesson 3 — Payments without tears","content":"Use Stripe checkout in embedded mode. Webhooks update the database; never trust the client. Subscriptions table mirrors Stripe state. Test with the official test cards before going live."},
     {"title":"Lesson 4 — Your first paying customer","content":"Launch to 10 people you know. Charge from day 1, even if it''s $5. Watch them use it on a call. Fix the top 3 friction points. Then post on the channel where your audience already hangs out."}
   ]'::jsonb)
ON CONFLICT (content_id) DO NOTHING;

-- ---------------------------------------------------------------------
-- 20260518051447_e9018108-db3b-47cc-a0eb-5f67874db7bf.sql
-- ---------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ---------------------------------------------------------------------
-- 20260518145223_4ef142a3-0008-4fe0-bd7e-62c53a356152.sql
-- ---------------------------------------------------------------------
ALTER TABLE public.content_payloads
  ADD COLUMN IF NOT EXISTS preview_html text,
  ADD COLUMN IF NOT EXISTS extra jsonb;

ALTER TABLE public.content_items
  ADD COLUMN IF NOT EXISTS slug text;

CREATE INDEX IF NOT EXISTS idx_content_items_slug ON public.content_items(slug);

-- ---------------------------------------------------------------------
-- 20260518152407_e43fd0fa-0113-4cf7-ac9e-97753eb5d781.sql
-- ---------------------------------------------------------------------
DELETE FROM content_payloads;
DELETE FROM pack_items;
DELETE FROM content_items;
DELETE FROM packs;

-- ---------------------------------------------------------------------
-- 20260518154645_7dfb1b09-32c7-4876-94fe-db037e4f4015.sql
-- ---------------------------------------------------------------------
DELETE FROM public.content_payloads; DELETE FROM public.content_items; DELETE FROM public.packs;

-- ---------------------------------------------------------------------
-- 20260519215516_a1634897-dcaa-4903-b641-04f4ada7bcab.sql
-- ---------------------------------------------------------------------

-- Expand content type enum to 10 types
ALTER TYPE content_type ADD VALUE IF NOT EXISTS 'workflow';
ALTER TYPE content_type ADD VALUE IF NOT EXISTS 'agent';
ALTER TYPE content_type ADD VALUE IF NOT EXISTS 'business_lesson';
ALTER TYPE content_type ADD VALUE IF NOT EXISTS 'insight';
ALTER TYPE content_type ADD VALUE IF NOT EXISTS 'tool_guide';
ALTER TYPE content_type ADD VALUE IF NOT EXISTS 'playbook';
ALTER TYPE content_type ADD VALUE IF NOT EXISTS 'challenge';
ALTER TYPE content_type ADD VALUE IF NOT EXISTS 'cheatsheet';


-- ---------------------------------------------------------------------
-- 20260519215559_83e26e9a-5768-4763-b3f4-cfdb48b39abb.sql
-- ---------------------------------------------------------------------

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


-- ---------------------------------------------------------------------
-- 20260519220739_6214abe5-5eab-4bfd-a9b8-6060cba33867.sql
-- ---------------------------------------------------------------------
-- 1) Add streak + xp columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS current_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_active_date date,
  ADD COLUMN IF NOT EXISTS xp_points integer NOT NULL DEFAULT 0;

-- 2) Extend the protect_profile_fields trigger to lock the new fields too
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  NEW.subscription_tier        := OLD.subscription_tier;
  NEW.subscription_status      := OLD.subscription_status;
  NEW.template_prompt_credits  := OLD.template_prompt_credits;
  NEW.mini_course_credits      := OLD.mini_course_credits;
  NEW.main_course_credits      := OLD.main_course_credits;
  NEW.stripe_customer_id       := OLD.stripe_customer_id;
  NEW.stripe_subscription_id   := OLD.stripe_subscription_id;
  NEW.current_period_end       := OLD.current_period_end;
  NEW.current_streak           := OLD.current_streak;
  NEW.longest_streak           := OLD.longest_streak;
  NEW.last_active_date         := OLD.last_active_date;
  NEW.xp_points                := OLD.xp_points;
  RETURN NEW;
END;
$function$;

-- Make sure the trigger is attached (it may not be — knowledge file showed no triggers)
DROP TRIGGER IF EXISTS protect_profile_fields_trg ON public.profiles;
CREATE TRIGGER protect_profile_fields_trg
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_fields();

-- 3) tick_streak: increments / resets a user's streak based on last activity
CREATE OR REPLACE FUNCTION public.tick_streak(_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _today date := (now() AT TIME ZONE 'utc')::date;
  _last  date;
  _cur   integer;
  _long  integer;
  _new_streak integer;
BEGIN
  SELECT last_active_date, current_streak, longest_streak
    INTO _last, _cur, _long
  FROM public.profiles
  WHERE id = _user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no_profile');
  END IF;

  IF _last = _today THEN
    -- already active today; nothing to do
    RETURN jsonb_build_object(
      'ok', true,
      'current_streak', _cur,
      'longest_streak', _long,
      'changed', false
    );
  ELSIF _last = _today - 1 THEN
    _new_streak := COALESCE(_cur, 0) + 1;
  ELSE
    _new_streak := 1;
  END IF;

  UPDATE public.profiles
     SET current_streak   = _new_streak,
         longest_streak   = GREATEST(COALESCE(_long, 0), _new_streak),
         last_active_date = _today,
         updated_at       = now()
   WHERE id = _user_id;

  RETURN jsonb_build_object(
    'ok', true,
    'current_streak', _new_streak,
    'longest_streak', GREATEST(COALESCE(_long, 0), _new_streak),
    'changed', true
  );
END;
$function$;

-- 4) award_xp: safely adds XP to a user
CREATE OR REPLACE FUNCTION public.award_xp(_user_id uuid, _amount integer)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _new integer;
BEGIN
  IF _amount IS NULL OR _amount <= 0 THEN
    RETURN (SELECT xp_points FROM public.profiles WHERE id = _user_id);
  END IF;

  UPDATE public.profiles
     SET xp_points  = COALESCE(xp_points, 0) + _amount,
         updated_at = now()
   WHERE id = _user_id
   RETURNING xp_points INTO _new;

  RETURN COALESCE(_new, 0);
END;
$function$;

-- 5) Index for course-progress lookups by user+content
CREATE UNIQUE INDEX IF NOT EXISTS course_progress_user_content_uniq
  ON public.course_progress(user_id, content_id);

-- And a generic per-user index for "in-progress" listings
CREATE INDEX IF NOT EXISTS course_progress_user_idx
  ON public.course_progress(user_id, last_opened_at DESC);


-- ---------------------------------------------------------------------
-- 20260519220758_998a445b-ea6f-4863-a926-3e7493303663.sql
-- ---------------------------------------------------------------------
-- Block anonymous callers entirely; the protect-trigger function is internal only
REVOKE ALL ON FUNCTION public.protect_profile_fields() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.tick_streak(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tick_streak(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.award_xp(uuid, integer) FROM PUBLIC, anon;
-- award_xp should only be called by server functions running with service_role
-- (not authenticated users directly), so keep it locked.


-- ---------------------------------------------------------------------
-- 20260519220822_f69f8e54-e2a6-4557-a2ca-86a9fbc615a5.sql
-- ---------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.tick_streak(uuid) FROM authenticated;

-- ---------------------------------------------------------------------
-- 20260519225219_4c0862fa-98d4-4de4-a855-3be01d214d6b.sql
-- ---------------------------------------------------------------------

-- 1. Rename enum value
ALTER TYPE credit_bucket RENAME VALUE 'template_prompt' TO 'prompt';

-- 2. Rename profile column
ALTER TABLE public.profiles RENAME COLUMN template_prompt_credits TO prompt_credits;

-- 3. Add xp_reward to content_items
ALTER TABLE public.content_items
  ADD COLUMN IF NOT EXISTS xp_reward integer NOT NULL DEFAULT 10;

-- 4. Add lesson_content to content_payloads
ALTER TABLE public.content_payloads
  ADD COLUMN IF NOT EXISTS lesson_content jsonb;

-- 5. Update consume_credits to use new bucket name
CREATE OR REPLACE FUNCTION public.consume_credits(_user_id uuid, _bucket text, _amount integer, _content_id text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _updated integer;
BEGIN
  IF _amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;

  IF _bucket = 'prompt' THEN
    UPDATE public.profiles
       SET prompt_credits = prompt_credits - _amount,
           updated_at = now()
     WHERE id = _user_id AND prompt_credits >= _amount;
  ELSIF _bucket = 'mini_course' THEN
    UPDATE public.profiles
       SET mini_course_credits = mini_course_credits - _amount,
           updated_at = now()
     WHERE id = _user_id AND mini_course_credits >= _amount;
  ELSIF _bucket = 'main_course' THEN
    UPDATE public.profiles
       SET main_course_credits = main_course_credits - _amount,
           updated_at = now()
     WHERE id = _user_id AND main_course_credits >= _amount;
  ELSE
    RAISE EXCEPTION 'Unknown credit bucket: %', _bucket;
  END IF;

  GET DIAGNOSTICS _updated = ROW_COUNT;
  IF _updated = 0 THEN RETURN false; END IF;

  INSERT INTO public.credit_transactions (
    user_id, transaction_type, credit_bucket, amount, related_content_id
  ) VALUES (
    _user_id, 'spend', _bucket::credit_bucket, -_amount, _content_id
  );

  RETURN true;
END;
$function$;

-- 6. Update protect_profile_fields to reference renamed column
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  NEW.subscription_tier        := OLD.subscription_tier;
  NEW.subscription_status      := OLD.subscription_status;
  NEW.prompt_credits           := OLD.prompt_credits;
  NEW.mini_course_credits      := OLD.mini_course_credits;
  NEW.main_course_credits      := OLD.main_course_credits;
  NEW.stripe_customer_id       := OLD.stripe_customer_id;
  NEW.stripe_subscription_id   := OLD.stripe_subscription_id;
  NEW.current_period_end       := OLD.current_period_end;
  NEW.current_streak           := OLD.current_streak;
  NEW.longest_streak           := OLD.longest_streak;
  NEW.last_active_date         := OLD.last_active_date;
  NEW.xp_points                := OLD.xp_points;
  RETURN NEW;
END;
$function$;


-- ---------------------------------------------------------------------
-- 20260523233506_ai_mastery_engine_expansion.sql
-- ---------------------------------------------------------------------
-- =====================================================================
-- LaunchVault → AI Mastery Engine expansion
-- 1. Extend content_type enum with 7 new types
-- 2. Add `domain`, quality scoring, daily-feed flags to content_items
-- 3. Add typed payload columns for each new content type
-- =====================================================================

-- ---- 1. New content types ----
ALTER TYPE public.content_type ADD VALUE IF NOT EXISTS 'workflow';
ALTER TYPE public.content_type ADD VALUE IF NOT EXISTS 'agent';
ALTER TYPE public.content_type ADD VALUE IF NOT EXISTS 'business_lesson';
ALTER TYPE public.content_type ADD VALUE IF NOT EXISTS 'insight';
ALTER TYPE public.content_type ADD VALUE IF NOT EXISTS 'tool_guide';
ALTER TYPE public.content_type ADD VALUE IF NOT EXISTS 'playbook';
ALTER TYPE public.content_type ADD VALUE IF NOT EXISTS 'challenge';
ALTER TYPE public.content_type ADD VALUE IF NOT EXISTS 'cheatsheet';

-- ---- 2. content_items expansion ----
-- domain stores the AI mastery domain slug (see src/config/domains.ts)
ALTER TABLE public.content_items
  ADD COLUMN IF NOT EXISTS domain         text,
  ADD COLUMN IF NOT EXISTS slug           text,
  ADD COLUMN IF NOT EXISTS short_description text,
  ADD COLUMN IF NOT EXISTS quality_score  int,
  ADD COLUMN IF NOT EXISTS quality_status text
    CHECK (quality_status IS NULL OR quality_status IN ('excellent','good','needs_review','failed')),
  ADD COLUMN IF NOT EXISTS is_daily       boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS generated_by   text,
  ADD COLUMN IF NOT EXISTS generated_at   timestamptz;

-- Backfill slug from id for legacy rows
UPDATE public.content_items
   SET slug = id
 WHERE slug IS NULL;

-- Slugs should be unique
CREATE UNIQUE INDEX IF NOT EXISTS uq_content_items_slug
  ON public.content_items(slug)
  WHERE slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_content_items_domain
  ON public.content_items(domain)
  WHERE domain IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_content_items_daily
  ON public.content_items(is_daily, created_at DESC)
  WHERE is_daily = true;

CREATE INDEX IF NOT EXISTS idx_content_items_created_at
  ON public.content_items(created_at DESC);

-- ---- 3. content_payloads expansion ----
ALTER TABLE public.content_payloads
  ADD COLUMN IF NOT EXISTS workflow_payload   jsonb,
  ADD COLUMN IF NOT EXISTS agent_payload      jsonb,
  ADD COLUMN IF NOT EXISTS insight_payload    jsonb,
  ADD COLUMN IF NOT EXISTS business_payload   jsonb,
  ADD COLUMN IF NOT EXISTS tool_payload       jsonb,
  ADD COLUMN IF NOT EXISTS playbook_payload   jsonb,
  ADD COLUMN IF NOT EXISTS challenge_payload  jsonb,
  ADD COLUMN IF NOT EXISTS cheatsheet_payload jsonb,
  ADD COLUMN IF NOT EXISTS preview_html       text,
  ADD COLUMN IF NOT EXISTS extra              jsonb;

-- Move existing per-type extra blobs (template ui_preview etc.) into `extra`
-- only if `extra` is empty AND a legacy 'extra' jsonb column existed (older
-- migrations may have stored it elsewhere). This is a no-op for fresh installs.

-- ---- 4. Helpful view: featured + recent feed ----
CREATE OR REPLACE VIEW public.v_content_feed AS
SELECT
  ci.id,
  ci.slug,
  ci.type,
  ci.domain,
  ci.category,
  ci.tier_required,
  ci.title,
  ci.description,
  ci.short_description,
  ci.preview_text,
  ci.tags,
  ci.difficulty,
  ci.estimated_minutes,
  ci.is_featured,
  ci.is_daily,
  ci.quality_score,
  ci.created_at,
  (ci.created_at > now() - interval '24 hours') AS is_new
FROM public.content_items ci
WHERE ci.is_published = true;

GRANT SELECT ON public.v_content_feed TO anon, authenticated;

