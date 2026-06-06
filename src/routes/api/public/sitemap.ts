// Dynamic sitemap.xml — marketing pages + every public library item +
// every domain landing page. Pulled live from Postgres so Google always
// sees the freshest URLs.
import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { DOMAINS } from "@/config/domains";

const BASE = "https://launchvault.ca";

const STATIC_URLS: Array<{ loc: string; changefreq: string; priority: string }> = [
  { loc: "/",                 changefreq: "daily",   priority: "1.0" },
  { loc: "/learn-ai",         changefreq: "weekly",  priority: "0.95" },
  { loc: "/how-to-learn-ai",  changefreq: "weekly",  priority: "0.95" },
  { loc: "/features",         changefreq: "weekly",  priority: "0.9" },
  { loc: "/how-it-works",     changefreq: "weekly",  priority: "0.9" },
  { loc: "/pricing",          changefreq: "weekly",  priority: "0.9" },
  { loc: "/library",          changefreq: "hourly",  priority: "0.95" },
  { loc: "/glossary",         changefreq: "daily",   priority: "0.9" },
  { loc: "/blog",             changefreq: "daily",   priority: "0.9" },
  { loc: "/about",            changefreq: "weekly",  priority: "0.7" },
  { loc: "/contact",          changefreq: "monthly", priority: "0.6" },
  { loc: "/signup",           changefreq: "monthly", priority: "0.5" },
  { loc: "/login",            changefreq: "monthly", priority: "0.3" },
  { loc: "/privacy",          changefreq: "monthly", priority: "0.3" },
  { loc: "/terms",            changefreq: "monthly", priority: "0.3" },
  { loc: "/cookies",          changefreq: "monthly", priority: "0.3" },
  { loc: "/refund-policy",    changefreq: "monthly", priority: "0.3" },
  { loc: "/acceptable-use",   changefreq: "monthly", priority: "0.3" },
  { loc: "/dpa",              changefreq: "monthly", priority: "0.3" },
];

export const Route = createFileRoute("/api/public/sitemap")({
  server: {
    handlers: {
      GET: async () => {
        const { data: items } = await supabaseAdmin
          .from("content_items")
          .select("slug, type, updated_at, created_at")
          .eq("is_published", true)
          .not("slug", "is", null)
          .order("updated_at", { ascending: false })
          .limit(50000);

        const now = new Date().toISOString();
        const xml: string[] = [];

        for (const u of STATIC_URLS) {
          xml.push(`  <url>
    <loc>${BASE}${u.loc}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`);
        }

        // 50 domain landing pages
        for (const d of DOMAINS) {
          xml.push(`  <url>
    <loc>${BASE}/domains/${d.slug}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`);
        }

        // Every published item — route differs by type
        // glossary → /glossary/$slug · essay → /blog/$slug · everything else → /library/$slug
        for (const it of items ?? []) {
          const itAny = it as any;
          const last = itAny.updated_at ?? itAny.created_at ?? now;
          const path =
            itAny.type === "glossary" ? `/glossary/${itAny.slug}` :
            itAny.type === "essay"    ? `/blog/${itAny.slug}` :
            `/library/${itAny.slug}`;
          xml.push(`  <url>
    <loc>${BASE}${path}</loc>
    <lastmod>${last}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
        }

        const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xml.join("\n")}
</urlset>
`;
        return new Response(body, {
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=900",
          },
        });
      },
    },
  },
});
