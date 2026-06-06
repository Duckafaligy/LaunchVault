import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect } from "react";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/hooks/use-auth";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { brand } from "@/config/brand";
import { organizationJsonLd, websiteJsonLd, softwareAppJsonLd } from "@/lib/seo";

function NotFoundComponent() {
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-slate-950 px-4 text-white">
      {/* Aurora background */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-indigo-600/30 blur-[120px]" />
        <div className="absolute -bottom-32 right-1/4 h-96 w-96 rounded-full bg-fuchsia-600/25 blur-[120px]" />
      </div>

      <div className="relative max-w-lg text-center">
        <p className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-200">
          Page not found
        </p>
        <h1 className="mt-6 bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300 bg-clip-text text-[120px] font-extrabold leading-none tracking-tighter text-transparent md:text-[160px]">
          404
        </h1>
        <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">This page is off the map</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-300">
          The URL didn't match any of our routes. Maybe the content moved, the link is old, or it never existed.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 px-6 py-3 text-sm font-bold text-white shadow-[0_0_30px_-5px_rgba(99,102,241,0.7)] transition-all hover:scale-[1.02]"
          >
            Back to landing
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-bold text-white backdrop-blur hover:bg-white/10"
          >
            Open dashboard
          </Link>
        </div>

        <p className="mt-8 text-xs text-slate-400">
          Looking for content? Try{" "}
          <Link to="/dashboard/insights" className="text-indigo-300 hover:underline">Daily Insights</Link>
          {" · "}
          <Link to="/dashboard/prompts"  className="text-indigo-300 hover:underline">Prompts</Link>
          {" · "}
          <Link to="/dashboard/courses"  className="text-indigo-300 hover:underline">Courses</Link>
          {" · "}
          <Link to="/features"           className="text-indigo-300 hover:underline">Features</Link>
        </p>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  // Log full error server-side; show only a generic message to users.
  console.error("[root error boundary]", error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We hit an unexpected error. Please try again — if it keeps happening, contact support.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </button>
          <a href="/" className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport",        content: "width=device-width, initial-scale=1" },
      { name: "robots",          content: "index, follow, max-image-preview:large" },
      { name: "theme-color",     content: "#0b0f1a" },
      // Google Search Console domain verification (URL-prefix property).
      { name: "google-site-verification", content: "E8FzcqmCdsw4v7eU59gOzKxTQIQo6p-Ruvu8Ti_Sofc" },
      { title: `${brand.brandName} — ${brand.tagline}` },
      { name: "description",     content: brand.homepageSubheadline },

      // Open Graph defaults — overridden per-page
      { property: "og:site_name", content: brand.brandName },
      { property: "og:title",     content: `${brand.brandName} — ${brand.tagline}` },
      { property: "og:description", content: brand.homepageSubheadline },
      { property: "og:type",      content: "website" },
      { property: "og:locale",    content: "en_US" },
      { property: "og:image",     content: "https://launchvault.ca/og-default.png" },
      { property: "og:image:width",  content: "1200" },
      { property: "og:image:height", content: "630" },

      // Twitter
      { name: "twitter:card",        content: "summary_large_image" },
      { name: "twitter:site",        content: "@launchvault" },
      { name: "twitter:title",       content: `${brand.brandName} — ${brand.tagline}` },
      { name: "twitter:description", content: brand.homepageSubheadline },
      { name: "twitter:image",       content: "https://launchvault.ca/og-default.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      // Premium editorial serif for content headlines.
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" } as any,
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700;9..144,800&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(organizationJsonLd()),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(websiteJsonLd()),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(softwareAppJsonLd()),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthInvalidator />
        <Outlet />
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function AuthInvalidator() {
  const router = useRouter();
  const queryClient = useQueryClient();
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      router.invalidate();
      queryClient.invalidateQueries();
    });
    return () => subscription.unsubscribe();
  }, [router, queryClient]);
  return null;
}
