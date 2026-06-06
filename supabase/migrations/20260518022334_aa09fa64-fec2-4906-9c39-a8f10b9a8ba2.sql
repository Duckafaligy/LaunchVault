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