import { createFileRoute, Outlet, Link, redirect, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { recordPageView } from "@/utils/analytics.functions";
import {
  LayoutDashboard, MessageSquareCode, GraduationCap, User, LogOut, Menu, X,
  Bookmark, Search, Flame, Zap, Crown, Sparkles,
  Workflow, Bot, Briefcase, Lightbulb, Wrench, ScrollText, Target, FileText,
  Library as LibraryIcon, HelpCircle,
} from "lucide-react";
import { TutorialMode, hasCompletedTutorial } from "@/components/tutorial/TutorialMode";
import { UpgradeProvider } from "@/components/dashboard/UpgradeDialog";

import { useQuery } from "@tanstack/react-query";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { TIER_LABEL } from "@/config/brand";
import type { SubscriptionTier } from "@/lib/payment-products";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  component: DashboardLayout,
});

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };

// Sidebar grouping: Today (live stuff), Library (the 9 list types), You (personal).
// "live" makes the item show a tiny pulsing dot — used for the Daily Insights
// link since it gets fresh content multiple times per day.
type NavItemEx = NavItem & { live?: boolean };

const TODAY_NAV: NavItemEx[] = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/library", label: "All content", icon: LibraryIcon, live: true },
  { to: "/dashboard/insights", label: "Daily Insights", icon: Lightbulb },
];

const LIBRARY_NAV: NavItemEx[] = [
  { to: "/dashboard/prompts",     label: "Prompts",     icon: MessageSquareCode },
  { to: "/dashboard/courses",     label: "Courses",     icon: GraduationCap     },
  { to: "/dashboard/workflows",   label: "Workflows",   icon: Workflow          },
  { to: "/dashboard/agents",      label: "Agents",      icon: Bot               },
  { to: "/dashboard/business",    label: "Business",    icon: Briefcase         },
  { to: "/dashboard/tools",       label: "Tool Guides", icon: Wrench            },
  { to: "/dashboard/playbooks",   label: "Playbooks",   icon: ScrollText        },
  { to: "/dashboard/challenges",  label: "Challenges",  icon: Target            },
  { to: "/dashboard/cheatsheets", label: "Cheatsheets", icon: FileText          },
];

const YOU_NAV: NavItemEx[] = [
  { to: "/dashboard/saved",   label: "Saved Vault",  icon: Bookmark },
  { to: "/dashboard/account", label: "Account",      icon: User     },
];

// Admin nav removed — admins see the stats widget on /dashboard/account
// instead of a dedicated admin page. Auto-gen runs on cron with no UI needed.
// const ADMIN_NAV: NavItem[] = [
//   { to: "/dashboard/admin", label: "CMS Automation", icon: ShieldCheck },
// ];

const MOBILE_NAV: NavItem[] = [
  { to: "/dashboard",          label: "Home",     icon: LayoutDashboard, exact: true },
  { to: "/dashboard/insights", label: "Today",    icon: Lightbulb },
  { to: "/dashboard/prompts",  label: "Prompts",  icon: MessageSquareCode },
  { to: "/dashboard/courses",  label: "Learn",    icon: GraduationCap },
  { to: "/dashboard/account",  label: "Account",  icon: User },
];

function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);

  // Auto-open tutorial on first visit (admins skipped — they know what's going on)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const shouldShow = !hasCompletedTutorial();
    if (shouldShow) {
      // Defer slightly so the dashboard has a chance to render first
      const t = setTimeout(() => setTutorialOpen(true), 800);
      return () => clearTimeout(t);
    }
  }, []);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  // Fire-and-forget page-view tracking on every route change inside /dashboard.
  // Server-side handler also extracts user_id from the request, so authed views
  // are properly attributed. Anonymous views from public pages would need the
  // same hook in PublicLayout — added separately.
  const recordViewFn = useServerFn(recordPageView);
  useEffect(() => {
    let anonId = "";
    try {
      anonId = localStorage.getItem("lv_anon_id") ?? "";
      if (!anonId) {
        anonId = crypto.randomUUID().replace(/-/g, "").slice(0, 24);
        localStorage.setItem("lv_anon_id", anonId);
      }
    } catch {/* ignore */}
    void recordViewFn({
      data: {
        path: pathname,
        anonId: anonId || undefined,
        referrer: typeof document !== "undefined" ? document.referrer.slice(0, 1000) : undefined,
      },
    }).catch(() => {/* best-effort */});
  }, [pathname, recordViewFn]);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      return data;
    },
  });

  // Admin role is checked inside the VisitorStats component on /dashboard/account.
  // No need for a separate nav-level check now that the admin sidebar group is gone.


  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  const tier = (profile?.subscription_tier ?? "free") as SubscriptionTier;
  const tierLabel = TIER_LABEL[tier];
  const isPaid = tier !== "free";
  const initials = (profile?.full_name?.[0] ?? user?.email?.[0] ?? "U").toUpperCase();

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-[radial-gradient(ellipse_at_top,oklch(0.97_0.02_280),oklch(0.985_0.005_270)_60%)]">
      {/* Desktop sidebar — fixed full-height column, does NOT scroll with main */}
      <aside className="hidden h-[100dvh] w-64 shrink-0 flex-col border-r border-border/60 bg-sidebar/80 px-3 py-5 backdrop-blur-xl md:flex">
        <div className="px-2 shrink-0"><Logo /></div>

        {/* Internal nav can scroll if too tall, but the sidebar itself stays put */}
        <nav className="mt-7 flex-1 space-y-6 overflow-y-auto pr-1">
          <NavGroup label="Today"   items={TODAY_NAV}   pathname={pathname} />
          <NavGroup label="Library" items={LIBRARY_NAV} pathname={pathname} />
          <NavGroup label="You"     items={YOU_NAV}     pathname={pathname} />
        </nav>

        {/* Tier upsell pill */}
        {!isPaid && (
          <Link
            to="/dashboard/account"
            className="group relative mb-3 block overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-4 text-white shadow-glow transition-transform hover:scale-[1.02]"
          >
            <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/20 blur-2xl" />
            <div className="relative">
              <div className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ring-1 ring-white/20">
                <Sparkles className="h-2.5 w-2.5" /> Upgrade
              </div>
              <p className="mt-2 text-sm font-bold leading-tight">Unlock the full vault</p>
              <p className="mt-1 text-[11px] text-white/80">Premium prompts, courses & guides.</p>
              <p className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold">
                See plans <Sparkles className="h-3 w-3" />
              </p>
            </div>
          </Link>
        )}

        <button
          onClick={() => setTutorialOpen(true)}
          className="mb-1 flex items-center gap-3 rounded-xl border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-fuchsia-500/10 px-3 py-2 text-sm font-bold text-foreground transition-colors hover:from-indigo-500/15 hover:via-violet-500/15 hover:to-fuchsia-500/15"
        >
          <HelpCircle className="h-4 w-4 text-primary" />
          Tutorial
          <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-primary">8 steps</span>
        </button>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
        >
          <LogOut className="h-4 w-4" /> Log out
        </button>
      </aside>

      {/* Main — full-height column, vertical scroll lives HERE not on the sidebar */}
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto pb-16 md:pb-0">
        {/* Topbar — stays at top of the scrolling pane */}
        <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 md:px-6">
            <button
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="md:hidden"><Logo /></div>

            {/* Search */}
            <div className="relative hidden max-w-md flex-1 md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search prompts, courses, guides…"
                className="h-10 w-full rounded-xl border border-border/60 bg-card/60 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/70 shadow-soft outline-none transition-all focus:border-primary/50 focus:bg-card focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="ml-auto flex items-center gap-2">
              {/* Compact stat badges */}
              <StatBadge
                icon={Flame}
                value={profile?.current_streak ?? 0}
                tone="orange"
                title={`${profile?.current_streak ?? 0}-day streak`}
              />
              <StatBadge
                icon={Zap}
                value={profile?.xp_points ?? 0}
                tone="violet"
                title={`${profile?.xp_points ?? 0} XP earned`}
              />
              {/* Tier */}
              <Link
                to="/dashboard/account"
                className={`hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all sm:inline-flex ${
                  isPaid
                    ? "bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white shadow-glow"
                    : "border border-border bg-card text-foreground hover:border-primary/40"
                }`}
                title={`Current plan: ${tierLabel}`}
              >
                <Crown className="h-3 w-3" /> {tierLabel}
              </Link>

              {/* Avatar */}
              <div
                className="grid h-9 w-9 place-items-center rounded-full bg-gradient-primary text-xs font-bold text-primary-foreground shadow-soft ring-2 ring-background"
                title={user?.email ?? ""}
              >
                {initials}
              </div>
            </div>
          </div>
        </header>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden" onClick={() => setMobileOpen(false)}>
            <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" />
            <aside
              className="absolute left-0 top-0 flex h-full w-72 flex-col bg-sidebar p-5 shadow-elevated"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <Logo />
                <button onClick={() => setMobileOpen(false)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <nav className="mt-6 flex-1 space-y-6">
                <NavGroup label="Today"   items={TODAY_NAV}   pathname={pathname} onClick={() => setMobileOpen(false)} />
                <NavGroup label="Library" items={LIBRARY_NAV} pathname={pathname} onClick={() => setMobileOpen(false)} />
                <NavGroup label="You"     items={YOU_NAV}     pathname={pathname} onClick={() => setMobileOpen(false)} />
              </nav>
              <Button
                onClick={() => { setTutorialOpen(true); setMobileOpen(false); }}
                variant="outline"
                className="mt-4 w-full border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 to-fuchsia-500/10"
              >
                <HelpCircle className="mr-2 h-4 w-4" /> Tutorial
              </Button>
              <Button onClick={handleLogout} variant="outline" className="mt-2 w-full">
                <LogOut className="mr-2 h-4 w-4" /> Log out
              </Button>
            </aside>
          </div>
        )}

        {/* Tutorial overlay — fired by sidebar button OR first-visit auto */}
        <TutorialMode open={tutorialOpen} onClose={() => setTutorialOpen(false)} />

        <main className="flex-1 px-4 py-6 md:px-8 md:py-10">
          <UpgradeProvider>
            <Outlet />
          </UpgradeProvider>
        </main>

        {/* Safe-area spacer for iPhone home indicator on the main pane */}
        <div className="h-[env(safe-area-inset-bottom)] md:hidden" aria-hidden />
      </div>

      {/* Mobile bottom nav — fixed, respects iPhone safe area */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/90 px-2 pb-[max(env(safe-area-inset-bottom),0.25rem)] pt-1.5 backdrop-blur-xl md:hidden">
        <ul className="flex items-center justify-around">
          {MOBILE_NAV.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <li key={item.to} className="flex-1">
                <Link
                  to={item.to as string}
                  className={`flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] font-semibold transition-colors ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <item.icon className={`h-5 w-5 ${active ? "drop-shadow-[0_0_6px_oklch(0.52_0.26_280/0.6)]" : ""}`} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

function NavGroup({
  label, items, pathname, onClick,
}: {
  label: string;
  items: NavItemEx[];
  pathname: string;
  onClick?: () => void;
}) {
  return (
    <div>
      <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">{label}</p>
      <ul className="space-y-0.5">
        {items.map((item) => {
          const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
          return (
            <li key={item.to}>
              <Link
                to={item.to as string}
                onClick={onClick}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-gradient-to-r from-primary/15 via-primary/8 to-transparent text-foreground shadow-soft"
                    : "text-sidebar-foreground/70 hover:translate-x-0.5 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-indigo-500 to-fuchsia-500 shadow-glow" />
                )}
                <item.icon
                  className={`h-4 w-4 transition-colors ${
                    active ? "text-primary" : "group-hover:text-foreground"
                  }`}
                />
                <span className="flex-1">{item.label}</span>
                {item.live && !active && (
                  <span className="relative flex h-2 w-2" aria-hidden>
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                )}
                {item.live && active && (
                  <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700">
                    Live
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function StatBadge({
  icon: Icon, value, tone, title,
}: {
  icon: typeof Flame;
  value: number;
  tone: "orange" | "violet";
  title: string;
}) {
  const palette =
    tone === "orange"
      ? "from-orange-500/15 to-amber-500/10 text-orange-600 ring-orange-500/20"
      : "from-violet-500/15 to-fuchsia-500/10 text-violet-600 ring-violet-500/20";
  return (
    <div
      title={title}
      className={`hidden items-center gap-1 rounded-full bg-gradient-to-br px-2.5 py-1 text-xs font-bold ring-1 sm:inline-flex ${palette}`}
    >
      <Icon className="h-3.5 w-3.5" /> {value.toLocaleString()}
    </div>
  );
}

