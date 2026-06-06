// Serves /robots.txt at the root via TanStack Start's API route system.
// Allow crawling of all public routes; block dashboard, account, auth flows.
import { createFileRoute } from "@tanstack/react-router";

const BODY = `User-agent: *
Allow: /
Allow: /features
Allow: /pricing
Allow: /about
Allow: /privacy
Allow: /terms
Allow: /cookies
Allow: /refund-policy
Allow: /acceptable-use
Allow: /dpa

Disallow: /dashboard
Disallow: /onboarding
Disallow: /login
Disallow: /signup
Disallow: /checkout
Disallow: /api/

Sitemap: https://launchvault.ca/sitemap.xml
`;

export const Route = createFileRoute("/api/public/robots")({
  server: {
    handlers: {
      GET: () =>
        new Response(BODY, {
          headers: {
            "content-type": "text/plain; charset=utf-8",
            "cache-control": "public, max-age=3600",
          },
        }),
    },
  },
});
