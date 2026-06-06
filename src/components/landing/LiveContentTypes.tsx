import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  MessageSquareCode, GraduationCap, Workflow as WorkflowIcon, Bot, Briefcase,
  Lightbulb, Wrench, ScrollText, Target, FileText, ArrowRight, Sparkles, Activity,
  type LucideIcon,
} from "lucide-react";

type ContentTypeRow = {
  key: string; label: string; icon: LucideIcon; gradient: string;
  blurb: string; ctaTo: string;
};

const ROWS: ContentTypeRow[] = [
  { key: "prompt",          label: "Prompts",         icon: MessageSquareCode, gradient: "from-violet-600 to-fuchsia-500", blurb: "Battle-tested, copy-ready.", ctaTo: "/dashboard/prompts" },
  { key: "course",          label: "Micro-Courses",   icon: GraduationCap,     gradient: "from-indigo-600 to-cyan-500",    blurb: "Q/A-gated learning.",        ctaTo: "/dashboard/courses" },
  { key: "workflow",        label: "Workflows",       icon: WorkflowIcon,      gradient: "from-sky-500 to-indigo-600",     blurb: "Step-by-step execution.",     ctaTo: "/dashboard/workflows" },
  { key: "agent",           label: "Agent Blueprints",icon: Bot,               gradient: "from-fuchsia-600 to-pink-500",   blurb: "Goal, tools, safety, ship.",  ctaTo: "/dashboard/agents" },
  { key: "business_lesson", label: "Business Plays",  icon: Briefcase,         gradient: "from-emerald-600 to-teal-500",   blurb: "Monetization-focused.",       ctaTo: "/dashboard/business" },
  { key: "insight",         label: "Daily Insights",  icon: Lightbulb,         gradient: "from-amber-500 to-orange-500",   blurb: "Today's signal, not noise.",  ctaTo: "/dashboard/insights" },
  { key: "tool_guide",      label: "Tool Guides",     icon: Wrench,            gradient: "from-zinc-700 to-zinc-900",      blurb: "Honest tool breakdowns.",     ctaTo: "/dashboard/tools" },
  { key: "playbook",        label: "Playbooks",       icon: ScrollText,        gradient: "from-rose-600 to-fuchsia-600",   blurb: "Multi-phase execution plans.",ctaTo: "/dashboard/playbooks" },
  { key: "challenge",       label: "Challenges",      icon: Target,            gradient: "from-red-600 to-orange-500",     blurb: "Practice over passive reading.",ctaTo: "/dashboard/challenges" },
  { key: "cheatsheet",      label: "Cheatsheets",     icon: FileText,          gradient: "from-indigo-500 to-cyan-500",    blurb: "One-page references.",         ctaTo: "/dashboard/cheatsheets" },
];

type Stats = {
  content_total: number;
  members_total: number;
  new_in_24h: number;
  by_type: Record<string, number>;
};

export function LiveContentTypes() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/public/stats", { headers: { accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: any) => j && setStats(j))
      .catch(() => {/* ignore */});
  }, []);

  return (
    <section className="relative mx-auto max-w-6xl px-4 py-20">
      <div className="text-center">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
          <Activity className="h-3 w-3" /> Live · refreshing every 2h
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
          Ten content types.{" "}
          <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
            One growing vault.
          </span>
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          {stats
            ? <>Currently <strong className="font-bold text-foreground">{stats.content_total.toLocaleString()}</strong> items live, <strong className="font-bold text-foreground">{stats.new_in_24h.toLocaleString()}</strong> added in the last 24 hours. All quality-scored before publishing.</>
            : "Every format you need — prompts, courses, workflows, agents, business plays, insights, tool guides, playbooks, challenges, cheatsheets. Quality-scored and auto-refreshed every 2 hours."}
        </p>
      </div>

      <div className="mt-12 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {ROWS.map((r) => {
          const Icon = r.icon;
          const count = stats?.by_type?.[r.key];
          return (
            <Link
              key={r.key}
              to={r.ctaTo}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated"
            >
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${r.gradient}`} />
              <div className="flex items-center justify-between">
                <div className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${r.gradient} text-white shadow-soft`}>
                  <Icon className="h-4 w-4" />
                </div>
                {typeof count === "number" && (
                  <span className="text-[11px] font-bold tabular-nums text-muted-foreground">
                    {count}+
                  </span>
                )}
              </div>
              <h3 className="mt-3 text-sm font-bold leading-tight">{r.label}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{r.blurb}</p>
              <span className="mt-3 inline-flex items-center gap-0.5 text-[11px] font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                Explore <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          );
        })}
      </div>

      {/* Subtle live pulse banner */}
      {stats && (
        <div className="mt-10 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs text-muted-foreground shadow-soft">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span>Vault grew by <strong className="text-foreground">{stats.new_in_24h}</strong> items in the last 24 hours.</span>
            <Sparkles className="h-3 w-3 text-amber-500" />
          </div>
        </div>
      )}
    </section>
  );
}
