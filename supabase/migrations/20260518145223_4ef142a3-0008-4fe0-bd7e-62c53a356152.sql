ALTER TABLE public.content_payloads
  ADD COLUMN IF NOT EXISTS preview_html text,
  ADD COLUMN IF NOT EXISTS extra jsonb;

ALTER TABLE public.content_items
  ADD COLUMN IF NOT EXISTS slug text;

CREATE INDEX IF NOT EXISTS idx_content_items_slug ON public.content_items(slug);