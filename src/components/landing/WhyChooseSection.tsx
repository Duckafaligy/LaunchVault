import { Link } from "@tanstack/react-router";
import { Check, X, Bot, FileSearch, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

// Honest, defensible comparison. Every LaunchVault claim below maps to real
// product behavior (tier-scaled quality gate ~74–90, schema validation, 50
// leveled domains, Q/A-gated courses, 2-hour cron). We do NOT claim human
// curation — the engine is autonomous and that's disclosed everywhere.
type Val = boolean | string;
type Row = { label: string; chatbot: Val; blogs: Val; lv: string };

const ROWS: Row[] = [
  { label: "Where you start",     chatbot: "A blank box, cold every time", blogs: "Scattered across 100 tabs",  lv: "One ranked feed for your goals" },
  { label: "Quality control",     chatbot: "You judge every answer",       blogs: "SEO-bait, rarely tested",    lv: "Scored 0–100 · below the bar never ships" },
  { label: "Structure",           chatbot: false,                          blogs: false,                        lv: "50 domains, leveled beginner → pro" },
  { label: "Learning path",       chatbot: "You design it yourself",       blogs: "You stitch it together",     lv: "Q/A-gated courses — no skipping ahead" },
  { label: "Freshness",           chatbot: "Frozen at a knowledge cutoff", blogs: "Whenever someone posts",     lv: "New drops every 2 hours" },
  { label: "What it costs you",   chatbot: "$20/mo + all your time",       blogs: "“Free” + hours of sorting",  lv: "Free to start · from $5/mo for the full vault" },
];

export function WhyChooseSection() {
  return (
    <section className="relative border-y border-border bg-gradient-surface">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">Why not just use ChatGPT?</p>
          <h2 className="font-display mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            Because the model is the easy part.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Anyone can generate a prompt. The hard part is knowing which ones are any good, keeping them
            organized, and actually showing up every day. That gap is the product.
          </p>
        </div>

        {/* Comparison table */}
        <div className="mt-12 overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    The job to be done
                  </th>
                  <AltHead icon={Bot} label="Raw AI chatbot" />
                  <AltHead icon={FileSearch} label="Free blogs & threads" />
                  <th className="relative px-5 py-4 text-center">
                    <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />
                    <span className="flex flex-col items-center gap-0.5">
                      <span className="font-display text-[15px] font-bold tracking-tight text-foreground">LaunchVault</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-gradient-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary-foreground">
                        The point
                      </span>
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.label} className="border-t border-border/60 transition-colors hover:bg-muted/20">
                    <td className="px-5 py-4 text-[13.5px] font-semibold text-foreground">{row.label}</td>
                    <AltCell v={row.chatbot} />
                    <AltCell v={row.blogs} />
                    <td className="bg-primary/[0.04] px-5 py-4 text-center">
                      <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-foreground">
                        <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                        {row.lv}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* The honest footnote — this is what disarms the "it's just AI" critique */}
        <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-start gap-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-600 text-white shadow-soft">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight">The honest version</p>
              <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">
                Could you prompt every one of these yourself? Yes. LaunchVault is for people who&apos;d rather open one
                tab than re-engineer 50 prompts a week — and who want a quality gate standing between them and the slop.
                If that&apos;s not you, the Free tier is genuinely substantial and never expires. We mean that.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button asChild size="sm" className="rounded-lg bg-gradient-primary font-bold">
                  <Link to="/signup">Start free — no card</Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="rounded-lg font-bold">
                  <Link to="/library">Browse the free library</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AltHead({ icon: Icon, label }: { icon: typeof Bot; label: string }) {
  return (
    <th className="px-5 py-4 text-center">
      <span className="flex flex-col items-center gap-1 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-[13px] font-bold tracking-tight text-foreground/80">{label}</span>
      </span>
    </th>
  );
}

function AltCell({ v }: { v: Val }) {
  if (v === false) {
    return (
      <td className="px-5 py-4 text-center">
        <X className="mx-auto h-4 w-4 text-muted-foreground/35" aria-label="No" />
      </td>
    );
  }
  return (
    <td className="px-5 py-4 text-center text-[13px] leading-snug text-muted-foreground">{v}</td>
  );
}
