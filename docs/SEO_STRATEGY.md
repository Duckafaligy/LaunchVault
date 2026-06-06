# LaunchVault — SEO Strategy

> Last updated: 2026-05-25
> Owner: @brendan
> Status: brainstorm → execution roadmap

## TL;DR

LaunchVault is a content-engine SaaS. Every six hours it produces ~14 quality-validated items across 10 content types and 50 AI domains. That's roughly **56 new pieces of evergreen content per day** — about **20,000 / year**. For a normal SaaS, content is the cost. For us, content is the product.

That changes the SEO play entirely. We're not trying to write 100 blog posts a quarter; we're trying to make the firehose we're already producing **crawlable, indexable, and structured well enough that Google ranks it.**

The unlock: open up structured, partial public previews of the library so search engines can crawl the content, while keeping the deep payload behind the paywall.

---

## The 6 pillars

### 1. Domain landing pages — `/domains/[slug]`

We have **50 AI mastery domains** (`ai-prompting`, `ai-agents`, `ai-sales`, `prompt-engineering-fundamentals`, etc.). Each one should have a dedicated public landing page that:

- Ranks for `"<domain> prompts"`, `"<domain> AI"`, `"<domain> tutorial"` long-tail queries
- Lists the 6-12 most recent items in that domain (title + 1-sentence teaser, paywall-locked CTA)
- Links to related domains, sibling content types, and the global library
- Includes a domain-specific intro (auto-generated, ~250 words) explaining who the domain is for and what mastery looks like

**Estimated impact:** 50 indexable pages × organic long-tail = significant top-of-funnel pull. Each domain that wins one ranking = compound traffic over time.

**Effort:** ~1 day. Single dynamic route, hits same `library` API filtered by domain.

### 2. Public content previews — first 200 words

Right now the entire content payload is behind the paywall. From an SEO standpoint that's invisible — Google can't index it. The fix isn't to make everything free; it's to make the **first 200 words public** and indexable, then gate the full article.

Substack does this. Medium does this. Stratechery does this. It works because:

- Search engines see real, substantial content (not just titles)
- Users get hooked by the lede and convert at the paywall
- We can mark the public part as `isAccessibleForFree: false` in Article schema, which Google explicitly supports

**Implementation:** On `/library/[id]` (a new public route), render the title, eyebrow, description, and `article.intro` (4-6 sentences). Then a paywall component showing what's behind it, with a Get-Started CTA.

**Estimated impact:** ~20,000 indexable article-style pages per year. This is the single largest lever on the list.

### 3. Glossary — `/glossary/[term]`

There's a massive long-tail SEO pool for things like:
- "what is RAG"
- "what is prompt engineering"
- "what is an AI agent"
- "what is a system prompt"
- "what is fine-tuning vs prompting"

These are HIGH intent searches. Whoever ranks for these owns the new-AI-user funnel. Build a glossary of ~150 AI terms, each:
- ~400-word public definition
- "Used in these LaunchVault items" cross-links to actual library content
- FAQPage schema

Generation: run a one-time GPT batch over a fixed term list. Re-generate every 90 days.

**Effort:** ~1 day of code + a one-time GPT seeding script.

### 4. Comparison + "vs" pages — high commercial intent

People searching `notion vs launchvault`, `chatgpt prompt library vs claude prompt library`, `best AI prompt subscription` are at the bottom of the funnel. They have intent. Build a small set of comparison pages:

- `/compare/notion-ai`
- `/compare/promptbase`
- `/compare/prompthero`
- `/best/ai-prompt-library`
- `/best/ai-courses-2026`

Honest, opinionated, fact-based — not gross marketing. Lists what they do better, what we do better, who each is for.

**Effort:** Half a day; mostly content writing.

### 5. Structured data — every page

Already in place:
- `Organization`
- `WebSite`
- `SoftwareApplication`

Still missing:
- `Article` on every public content preview (with `isAccessibleForFree: false` annotation for paywalled portions)
- `BreadcrumbList` on nested pages
- `FAQPage` on `/pricing`, `/glossary/*`, and FAQ sections
- `Course` schema on the public course previews
- `Product` + `Offer` schema on `/pricing` for rich snippets in search results

**Effort:** ~2 hours; mostly extending `src/lib/seo.ts`.

### 6. Programmatic OG image generation

Currently we have a single fallback OG image. To win social shares (which feed back into organic traffic), every public content page needs a unique OG image — title, type label, gradient. This is essentially free SEO once built.

**Implementation:** A Cloudflare Worker route `/api/og/[id]` that uses `@vercel/og` or `satori` to render an OG card based on item title + type + gradient. Cache for 24h on Cloudflare edge.

**Effort:** ~3-4 hours including styling.

---

## The expanded sitemap

Current sitemap has 16 URLs (marketing pages). After full execution:

```
/                           (existing)
/features                   (existing)
/how-it-works               (existing)
/pricing                    (existing)
/about                      (existing)
/contact                    (existing)
/login, /signup             (noindex)
/legal/*                    (existing)

/domains                    NEW — index of all 50 domains
/domains/[slug]             NEW — 50 pages
/library                    NEW — public content index
/library/[id]               NEW — public previews (~20k/year)
/glossary                   NEW — index
/glossary/[term]            NEW — ~150 pages
/compare/[competitor]       NEW — ~5-10 pages
/best/[category]            NEW — ~5-10 pages
```

Final indexable surface: **20,000+ pages.** That's a substantial moat for a 1-year-old SaaS.

---

## Technical SEO baseline

These are mostly already in place from the existing SEO pass — confirming for the record:

| Item | Status | Notes |
|---|---|---|
| `robots.txt` | ✅ | Disallows /dashboard, allows /api/public/og |
| `sitemap.xml` | ✅ | Static — needs to become dynamic to include domain/library/glossary URLs |
| Canonical URLs | ✅ | `buildSeoLinks()` emits per-page canonical |
| Meta description | ✅ | Per-page via `buildSeoMeta` |
| OpenGraph + Twitter cards | ✅ | Existing fallback image |
| JSON-LD Organization, WebSite, SoftwareApp | ✅ | In `__root.tsx` |
| Mobile responsive | ✅ | Tailwind, well tested |
| Page speed | ⚠️ | Cloudflare edge cached, server-rendered. Run Lighthouse audit. |
| HTTPS + HSTS | ✅ | Cloudflare auto-provisioned |
| Internal linking | ⚠️ | Could be richer — adding domain pages will solve most of this |

---

## Editorial / content SEO (the autonomous-engine angle)

Because the generation prompt now produces:

- `article.intro` (450+ char hook — gets crawled, becomes meta description fallback)
- `article.key_takeaways` (parseable structured points)
- `article.deep_dive` (multiple H3 sections — natural keyword density)
- `article.related_reading` (internal linking opportunity)
- `article.pull_quote` (social-share fodder)

…every published item is *already* an SEO-ready longform article. We just need to expose it.

We could go even further: make the GPT include a `seo` block in each item:

```ts
seo: {
  primary_keyword: "AI prompt engineering for beginners",
  secondary_keywords: ["prompt design", "AI prompting fundamentals"],
  meta_description: "...",
  faq: [{ q: "...", a: "..." }]
}
```

This is a Phase-2 nice-to-have once the basic public previews are live.

---

## Phased rollout (recommended order)

### Phase 1 — quick wins (1-2 days)
1. Dynamic sitemap that includes library/domain URLs as soon as those routes exist
2. Add `Article` + `BreadcrumbList` + `FAQPage` schema helpers in `lib/seo.ts`
3. Internal linking pass — link domain mentions in content cards to `/domains/[slug]` (route can return 404 for now; we'll fill in)

### Phase 2 — high-leverage (3-5 days)
4. Build `/domains/[slug]` public listing page
5. Build `/library/[id]` public preview page (200-word lede + paywall CTA)
6. Programmatic OG image worker

### Phase 3 — long-tail (1 week)
7. Glossary route + one-time seeding script for ~150 AI terms
8. Comparison pages (honest, opinionated, manual)

### Phase 4 — depth (ongoing)
9. Schema markup on every public item
10. Quarterly content audits — re-index high performers, prune low performers
11. Internal linking automation — auto-link mentioned tools/concepts to glossary

---

## What we are NOT doing

- **No AI-slop blog**. We don't need a generic "10 ChatGPT tips" content farm. We have something better — the autonomous engine that produces real, opinionated, multi-type content. The library IS the blog.
- **No keyword stuffing**. The content is good. We just need it discoverable. No "ultimate guide to AI prompts 2026 best free" titles.
- **No backlink spam**. Building real domains/glossary/comparison pages will attract organic links over time.
- **No AMP**. Dead format.

---

## Success metrics

Track quarterly:

- Indexable pages in Google Search Console (target: 5,000 within 90 days, 15,000 within 1 year)
- Organic clicks / month (target: 1,000 within 90 days, 10,000 within 6 months)
- Average position for tracked queries (track ~50 priority queries)
- Library item conversion: % of organic visitors to a content preview who sign up

The autonomous engine handles content velocity. The SEO infrastructure listed above handles discoverability. Together they're the moat.
