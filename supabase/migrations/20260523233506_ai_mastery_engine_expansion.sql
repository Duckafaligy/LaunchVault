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
