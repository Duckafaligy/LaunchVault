import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  Lightbulb, MessageSquareCode, GraduationCap, Workflow as WorkflowIcon, Bot,
  Briefcase, ArrowRight, Sparkles, Clock, Lock, Flame,
  type LucideIcon,
} from "lucide-react";
import { listLibrary, type LibraryItem } from "@/utils/library.functions";
import { domainLabel } from "@/config/domains";
import { TIER_LABEL } from "@/config/brand";

type Row = {
  type: string;
  label: string;
  blurb: string;
  icon: LucideIcon;
  gradient: string;
  cta: string;
  to: string;
};

const ROWS: Row[] = [
  { type: "insight", label: "Today's insight", blurb: "Fresh AI intelligence, refreshed every few hours.", icon: Lightbulb, gradient: "from-amber-500 to-orange-500", cta: "Read insight", to: "/dashboard/insights" },
  { type: "prompt", label: "Today's prompt", blurb: "Battle-tested, copy-ready.", icon: MessageSquareCode, gradient: "from-violet-600 to-fuchsia-500", cta: "Open prompt", to: "/dashboard/prompts" },
  { type: "workflow", label: "Today's workflow", blurb: "A step-by-step play to run today.", icon: WorkflowIcon, gradient: "from-sky-500 to-indigo-600", cta: "Open workflow", to: "/dashboard/workflows" },
  { type: "agent", label: "Today's agent blueprint", blurb: "One agent design, ready to ship.", icon: Bot, gradient: "from-fuchsia-600 to-pink-500", cta: "Open blueprint", to: "/dashboard/agents" },
  { type: "course", label: "Today's mini-course", blurb: "Bite-sized lesson, hands-on practice.", icon: GraduationCap, gradient: "from-indigo-600 to-cyan-500", cta: "Start course", to: "/dashboard/courses" },
  { type: "business_lesson", label: "Today's business play", blurb: "Revenue-moving AI strategy.", icon: Briefcase, gradient: "from-emerald-600 to-teal-500", cta: "Read lesson", to: "/dashboard/business" },
];

export function DailyAIFeed() {
  const fetchList = useServerFn(listLibrary);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["daily-feed"],
    queryFn: async () => {
      const types = ROWS.map((r) => r.type);
      const all = await fetchList({ data: { types: types as any, limit: 60 } });
      const byType: Record<string, LibraryItem | null> = {};
      for (const t of types) {
        byType[t] = (all.find((x) => x.type === t && !x.locked) ?? all.find((x) => x.type === t)) ?? null;
      }
      return byType;
    },
  });

  // Realtime: any new content_items row triggers refetch
  useEffect(() => {
    const channel = supabase
      .channel("daily-feed-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "content_items" },
        () => qc.invalidateQueries({ queryKey: ["daily-feed"] }),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Your daily AI feed</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight md:text-2xl">Fresh today</h2>
        </div>
        <span className="text-xs text-muted-foreground">Auto-refreshed every 2 hours</span>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ROWS.map((r) => (
            <div key={r.type} className="h-44 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ROWS.map((r) => (
            <FeedCard key={r.type} row={r} item={data?.[r.type] ?? null} />
          ))}
        </div>
      )}
    </section>
  );
}

function FeedCard({ row, item }: { row: Row; item: LibraryItem | null }) {
  const Icon = row.icon;
  if (!item) {
    return (
      <article className="relative overflow-hidden rounded-2xl border border-dashed border-border bg-card/60 p-5 shadow-soft">
        <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${row.gradient}`} />
        <div className="flex items-center gap-2">
          <div className={`grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br ${row.gradient} text-white shadow-soft`}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{row.label}</p>
            <p className="text-xs text-muted-foreground">{row.blurb}</p>
          </div>
        </div>
        <p className="mt-4 text-sm italic text-muted-foreground">No item yet — the next generation run will drop one here.</p>
        <Link
          to={row.to}
          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary"
        >
          Browse {row.label.replace("Today's ", "").toLowerCase()}s <ArrowRight className="h-3 w-3" />
        </Link>
      </article>
    );
  }
  return (
    <Link
      to="/dashboard/content/$id"
      params={{ id: item.id }}
      className="group relative block overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated"
    >
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${row.gradient}`} />
      <div className="flex items-center gap-2">
        <div className={`grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br ${row.gradient} text-white shadow-soft`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{row.label}</p>
          {item.domain && (
            <p className="truncate text-xs text-muted-foreground">{domainLabel(item.domain)}</p>
          )}
        </div>
      </div>

      <h3 className="mt-4 line-clamp-2 text-base font-bold leading-tight group-hover:text-primary">
        {item.title}
      </h3>
      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
        {item.short_description ?? item.description}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {item.is_new && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-700"><Flame className="h-3 w-3" /> New</span>
        )}
        {item.locked && (
          <span className="inline-flex items-center gap-1 rounded-full bg-foreground/10 px-2 py-0.5 text-foreground/70"><Lock className="h-3 w-3" /> {TIER_LABEL[item.tier_required as keyof typeof TIER_LABEL] ?? item.tier_required}</span>
        )}
        {item.estimated_minutes != null && (
          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {item.estimated_minutes}m</span>
        )}
        <span className="ml-auto inline-flex items-center gap-1 font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
          {row.cta} <ArrowRight className="h-3 w-3" />
        </span>
      </div>
      {item.locked && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white/10 to-transparent" />
      )}
      <Sparkles className="pointer-events-none absolute right-3 top-3 h-3 w-3 text-muted-foreground/30" />
    </Link>
  );
}
