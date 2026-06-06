# LaunchVault

A content-engine SaaS for AI mastery. An autonomous generation pipeline produces
quality-validated content across many content types and AI domains; LaunchVault
is the **product surface** around that firehose — public, SEO-indexable previews
up front, with the full payloads gated behind subscription tiers and unlock
credits.

- **Free → Tier 1–4** subscriptions, plus one-off **credit packs** for unlocking
  individual templates, prompts, and mini-courses.
- **Tier-chained access** enforced server-side (a higher tier unlocks everything
  below it).
- **Public content previews** (lede + structured metadata) so search engines can
  crawl the library while the deep payload stays paywalled.

> The content-generation engine itself is a separate backend. This repo is the
> **web app**: marketing site, auth, dashboard, paywall, billing, and the public
> SEO surface.

---

## Tech stack

| Concern        | Choice                                                        |
| -------------- | ------------------------------------------------------------- |
| Framework      | TanStack Start (full-stack React 19) + Vite 7                 |
| Routing        | TanStack Router (file-based, `src/routes/`)                   |
| Deploy target  | Cloudflare Workers (`@cloudflare/vite-plugin`, `wrangler.jsonc`) |
| Data / auth    | Supabase (Postgres + RLS + Auth)                              |
| Payments       | Stripe (subscriptions + credit packs + webhooks), direct integration |
| UI             | Radix UI primitives + Tailwind CSS v4 + `tw-animate-css` + lucide-react |
| Forms / validation | React Hook Form + Zod                                     |
| Analytics      | PostHog                                                       |
| Language       | TypeScript 5                                                  |
| Package manager| Bun (`bun.lock`) — npm also supported (`package-lock.json`)   |

## Getting started

```bash
bun install            # or: npm install
bun run dev            # vite dev — local app
bun run build          # production build (Cloudflare Workers output)
bun run preview        # preview the built worker
bun run lint
bun run format
```

### Environment

Secrets are provided via env files locally (**all `.env*` are git-ignored — never
commit them**) and via `wrangler secret put` / Cloudflare dashboard in
production. The app expects, by name:

- **Supabase:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (public, client-safe),
  and a server-only `SUPABASE_SERVICE_ROLE_KEY` (never exposed to the client).
- **Stripe:** `STRIPE_LIVE_SECRET_KEY`, `STRIPE_LIVE_WEBHOOK_SECRET`, and the
  `STRIPE_TEST_*` equivalents for sandbox. These are read server-side only via
  `src/lib/stripe.server.ts`.
- **PostHog:** project key + host (client analytics).

> All Stripe/Supabase secret keys are read from `process.env` on the server
> (`*.server.ts`) — there are **no hardcoded keys** in source.

## Project structure

```
src/
  routes/         File-based routes (marketing, auth, dashboard, admin, public library)
  components/     UI components (Radix + Tailwind, shadcn-style)
  integrations/   Supabase client(s)
  lib/            stripe.server.ts, payment-products.ts, seo.ts, helpers
  utils/          Server functions (content gating, unlocks, credit estimates)
  hooks/          React hooks
  config/         App config
  router.tsx      Router setup
  server.ts       Worker server entry
  start.ts        TanStack Start entry
  styles.css      Tailwind v4 entry + tokens
supabase/
  migrations/     Postgres schema, RLS policies, SECURITY DEFINER functions
scripts/
  setup-stripe-webhook.mjs   One-shot: create the Stripe webhook endpoint
  combined-migration.sql     Consolidated migration helper
docs/
  SEO_STRATEGY.md            The 6-pillar SEO roadmap (domains, library previews, glossary…)
wrangler.jsonc    Cloudflare Worker config
```

## Security model

- **Tier access is enforced in the database, not the client.** SQL
  `SECURITY DEFINER` functions (`has_tier_access`, `consume_credits`,
  `unlock_content`) decide what a user can read. The client never grants itself
  access; `getContentPayload` returns the preview-only shape unless the server
  authorizes the full payload.
- **Profile hardening.** RLS + an UPDATE trigger block users from editing their
  own `subscription_tier`, credit balances, or `stripe_*` columns. Those are
  written only by the webhook / admin paths.
- **Stripe webhooks are signature-verified** with a manual WebCrypto HMAC-SHA256
  check (`verifyWebhook` in `stripe.server.ts`) so it runs natively on Cloudflare
  Workers, and the payment-success client route never grants access on its own.
- **Admin** is role-based (`has_role('admin')`), checked server-side in the
  `_admin` route's `beforeLoad`.

## Deployment

Built for **Cloudflare Workers**. Set production secrets with
`wrangler secret put <NAME>`, deploy with your Cloudflare/wrangler workflow, then
register the Stripe webhook against the deployed Worker URL:

```bash
# set STRIPE_SECRET_KEY in the environment first (live or test key)
node scripts/setup-stripe-webhook.mjs https://<your-worker-url>.workers.dev
# then store the printed signing secret:
npx wrangler secret put STRIPE_LIVE_WEBHOOK_SECRET
```

## SEO

The growth strategy is documented in `docs/SEO_STRATEGY.md`: the library is the
content moat, so the play is to make it crawlable — public domain landing pages,
~200-word public content previews behind an `isAccessibleForFree: false`
annotation, a glossary, comparison pages, structured data (`Article`,
`BreadcrumbList`, `FAQPage`, `Product`/`Offer`), and programmatic OG images.

---

> Bootstrapped on Lovable.dev; builder metadata (`.lovable/`) is git-ignored.
