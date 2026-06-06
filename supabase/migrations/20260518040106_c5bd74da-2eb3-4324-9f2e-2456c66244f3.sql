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