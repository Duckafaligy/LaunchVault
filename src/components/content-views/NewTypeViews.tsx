// Content detail views for the new (Mastery-Engine) content types.
// All views share one editorial design language — serif headings (Fraunces
// via .font-display), sans body, blockquote examples, no stacked colored cards.
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  CheckCircle2, Check, Copy, ArrowRight, Wrench, Workflow as WorkflowIcon,
  Bot, Briefcase, Lightbulb, ScrollText, Target, FileText,
  ShieldAlert, AlertTriangle, BookOpen, Layers, Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type AnyObj = Record<string, any>;

/* ===================================================================== */
/* Shared editorial primitives                                              */
/* ===================================================================== */

/**
 * Magazine section header. Tiny eyebrow + Fraunces serif title + body.
 * Used everywhere across the editorial views for consistency.
 */
export function EditorialSection({
  eyebrow, title, children,
}: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section>
      <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-muted-foreground">{eyebrow}</p>
      <h2 className="font-display mt-2 text-[1.6rem] font-bold leading-[1.2] tracking-[-0.01em] text-foreground md:text-[1.95rem]">
        {title}
      </h2>
      <div className="mt-5 space-y-4 text-[1.05rem] leading-[1.75] text-foreground/85">
        {children}
      </div>
    </section>
  );
}

/**
 * Magazine-quality blockquote with serif italics and a tasteful curly quote
 * mark glyph. The default emphasis color is amber; pass a hex/tw class
 * to retheme per content type.
 */
function PullQuote({
  children, accentClass = "text-amber-500/30", caption,
}: { children: ReactNode; accentClass?: string; caption?: string }) {
  return (
    <figure className="relative">
      <span
        className={`font-display absolute -left-1 -top-6 select-none text-[6.5rem] leading-none ${accentClass}`}
        aria-hidden
      >
        &ldquo;
      </span>
      <blockquote className="font-display relative pl-7 text-[1.2rem] italic leading-[1.55] text-foreground/85 md:text-[1.3rem]">
        {children}
      </blockquote>
      {caption && (
        <figcaption className="mt-3 pl-7 text-[10.5px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

/**
 * Inline list — editorial, no borders or colored cards. Uses uppercase
 * eyebrow as the label and serif numbers or bullet dots.
 */
function EditorialList({
  label, items, numbered, icon, accent,
}: { label: string; items?: any[]; numbered?: boolean; icon?: "check" | "warn" | "dot"; accent?: string; }) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <div>
      <p className={`text-[10.5px] font-bold uppercase tracking-[0.28em] ${accent ?? "text-muted-foreground"}`}>{label}</p>
      <ul className="mt-3 space-y-2.5">
        {items.map((it, i) => (
          <li key={i} className="flex gap-3 text-[15.5px] leading-[1.65] text-foreground/85">
            {numbered ? (
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-foreground/8 text-[11px] font-bold text-foreground/80">
                {i + 1}
              </span>
            ) : icon === "check" ? (
              <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-500" />
            ) : icon === "warn" ? (
              <AlertTriangle className="mt-1 h-4 w-4 shrink-0 text-amber-500" />
            ) : (
              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/40" />
            )}
            <span>{typeof it === "string" ? it : JSON.stringify(it)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Tasteful tag chip strip.
 */
function ChipStrip({ items, accentClass = "hover:border-foreground/30" }: { items?: string[]; accentClass?: string }) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((t, i) => (
        <span
          key={i}
          className={`rounded-full border border-border bg-card px-3 py-1 text-[12.5px] font-medium text-foreground/80 transition-colors ${accentClass}`}
        >
          {t}
        </span>
      ))}
    </div>
  );
}

/**
 * A dark "terminal" block used for things users will copy verbatim
 * (system prompts, starter code, etc.). Has a copy button.
 */
function CopyBlock({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 1400);
  };
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950 shadow-elevated">
      <div className="flex items-center justify-between border-b border-white/10 bg-slate-900/60 px-4 py-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">{label}</p>
        <Button size="sm" onClick={onCopy} className="h-7 bg-gradient-to-r from-violet-600 to-fuchsia-500 px-2.5 text-[11px] text-white shadow-glow hover:opacity-90">
          {copied ? <Check className="mr-1 h-3 w-3" /> : <Copy className="mr-1 h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre className="max-h-[60vh] overflow-auto p-4 text-[12.5px] leading-[1.65] text-slate-100">
        <code className="whitespace-pre-wrap break-words font-mono">{text}</code>
      </pre>
    </div>
  );
}

/**
 * Final CTA card. One single colored card at the end of every article that
 * gives the reader a clear single action.
 */
function FinalCta({
  eyebrow, body, icon: Icon = Target, accent = "from-emerald-500 to-teal-600", accentRing = "border-emerald-500/25 bg-gradient-to-br from-emerald-500/8 via-teal-500/5", accentEyebrow = "text-emerald-700",
}: { eyebrow: string; body: string; icon?: LucideIcon; accent?: string; accentRing?: string; accentEyebrow?: string; }) {
  return (
    <section className={`relative overflow-hidden rounded-2xl border to-card p-7 shadow-soft ${accentRing}`}>
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-500/15 blur-3xl" />
      <div className="relative flex flex-col gap-4 md:flex-row md:items-center">
        <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${accent} text-white shadow-[0_12px_24px_-8px_rgba(16,185,129,0.5)]`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className={`text-[10.5px] font-bold uppercase tracking-[0.28em] ${accentEyebrow}`}>{eyebrow}</p>
          <p className="font-display mt-2 text-[1.1rem] font-semibold leading-snug text-foreground">{body}</p>
        </div>
      </div>
    </section>
  );
}

/**
 * Editorial signature footer — same on every article.
 */
function SignatureFooter({ filed }: { filed: string }) {
  return (
    <footer className="border-t border-border pt-6 text-center">
      <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
        Filed under <span className="text-foreground/80">{filed}</span>
      </p>
      <p className="font-display mt-1.5 text-sm italic text-muted-foreground">
        Quality-scored and auto-published by the LaunchVault intelligence engine.
      </p>
    </footer>
  );
}

const ornament = <div className="mx-auto h-px w-16 bg-foreground/15" />;

/* ===================================================================== */
/* ARTICLE-GRADE VISUAL PRIMITIVES                                          */
/* Render the optional `article` sub-object that every payload now carries: */
/*   intro · key_takeaways · deep_dive · stats · comparison · pull_quote ·  */
/*   related_reading.                                                       */
/* Backwards compatible — older items without these fields render as-is.    */
/* ===================================================================== */

type ArticleBlock = {
  intro?: string;
  key_takeaways?: string[];
  deep_dive?: Array<{ heading?: string; body?: string }>;
  stats?: Array<{ value?: string; label?: string; context?: string }>;
  comparison?: {
    title?: string;
    left_label?: string;
    right_label?: string;
    rows?: Array<{ left?: string; right?: string }>;
  };
  pull_quote?: string;
  related_reading?: Array<{ title?: string; why_relevant?: string }>;
};

/**
 * Client-side coherence guard, mirroring the engine's check. Protects against
 * legacy/broken items already in the DB so we never render run-on word-salad
 * or leaked-JSON table cells. Returns true for empty, degenerate, or junk text.
 */
function isIncoherent(text?: string): boolean {
  if (typeof text !== "string") return true;
  const s = text.trim();
  if (!s) return true;
  if (s.length >= 60) {
    let longest = 0;
    for (const w of s.split(/\s+/)) if (w.length > longest) longest = w.length;
    if (longest > 55) return true;                        // no-space run-on blob (one giant token)
    // Whitespace ratio only for LONG text — short hyphen/paren-heavy titles
    // (e.g. "Understanding Retrieval-Augmented Generation (RAG) Frameworks")
    // legitimately dip under 7%, so gate on length to avoid false positives.
    if (s.length >= 200) {
      const spaces = (s.match(/\s/g) ?? []).length;
      if (spaces / s.length < 0.07) return true;
    }
  }
  if (/[{}]{2,}/.test(s)) return true;                    // leaked JSON braces
  if (/['"]\s*[,:]\s*['"]?(left|right)['"]?\s*:/i.test(s)) return true; // ','right':
  return false;
}

/**
 * The first dramatic paragraph of the article. Larger type, drop-cap
 * style — the lede the reader sees right after the title.
 */
function ArticleIntro({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <p className="text-[1.18rem] leading-[1.85] text-foreground/90 first-letter:font-display first-letter:text-[3.5rem] first-letter:font-bold first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:leading-[0.85] first-letter:text-indigo-600 dark:first-letter:text-indigo-400">
      {text}
    </p>
  );
}

/**
 * Editorial "key takeaways" block — 4-5 bold one-liners at the top of
 * the article. Borrowed straight from how The Verge / NYT lead longform.
 */
function KeyTakeaways({ items }: { items?: string[] }) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <aside className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/[0.04] via-card to-violet-500/[0.04] p-6 shadow-soft md:p-7">
      <div aria-hidden className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl" />
      <p className="relative text-[10.5px] font-bold uppercase tracking-[0.28em] text-indigo-700 dark:text-indigo-300">
        Key takeaways
      </p>
      <ul className="relative mt-4 space-y-3.5">
        {items.map((t, i) => (
          <li key={i} className="flex gap-3.5">
            <span className="font-display grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-700 text-[12px] font-bold text-white shadow-md">
              {i + 1}
            </span>
            <span className="pt-0.5 text-[15.5px] font-semibold leading-[1.5] text-foreground">{t}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

/**
 * Stats row — 2 to 4 visual stat cards. Used when GPT produces specific,
 * defensible numbers.
 */
function StatsRow({ items }: { items?: Array<{ value?: string; label?: string; context?: string }> }) {
  if (!Array.isArray(items) || items.length === 0) return null;
  // Tasteful gradient rotation across the cards
  const gradients = [
    "from-indigo-500 to-violet-600",
    "from-fuchsia-500 to-pink-600",
    "from-emerald-500 to-teal-600",
    "from-amber-500 to-orange-500",
  ];
  return (
    <section>
      <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-muted-foreground">By the numbers</p>
      <div className={`mt-4 grid gap-3 ${items.length >= 4 ? "sm:grid-cols-2 md:grid-cols-4" : items.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        {items.map((s, i) => {
          const g = gradients[i % gradients.length];
          return (
            <div key={i} className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated">
              <div aria-hidden className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${g}`} />
              <p className={`font-display text-3xl font-bold tracking-tight md:text-4xl bg-gradient-to-br ${g} bg-clip-text text-transparent`}>
                {s.value ?? "—"}
              </p>
              <p className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                {s.label ?? ""}
              </p>
              {s.context && (
                <p className="mt-2 text-[13px] leading-relaxed text-foreground/75">{s.context}</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/**
 * The "weak way vs. strong way" comparison block — high-contrast two-column.
 */
function ComparisonBlock({ data }: { data?: ArticleBlock["comparison"] }) {
  if (!data || !Array.isArray(data.rows)) return null;
  // Keep only rows with two clean, present cells — drop malformed/leaked-JSON rows.
  const rows = data.rows.filter(
    (r) => !isIncoherent(r?.left) && !isIncoherent(r?.right),
  );
  if (rows.length === 0) return null;
  return (
    <section>
      {data.title && (
        <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
          {data.title}
        </p>
      )}
      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <div className="grid grid-cols-2 border-b border-border bg-muted/30 text-[11px] font-bold uppercase tracking-[0.18em]">
          <div className="border-r border-border px-5 py-3 text-rose-700 dark:text-rose-300">
            ✗ {data.left_label ?? "Common"}
          </div>
          <div className="px-5 py-3 text-emerald-700 dark:text-emerald-300">
            ✓ {data.right_label ?? "Better"}
          </div>
        </div>
        <ul>
          {rows.map((r, i) => (
            <li key={i} className="grid grid-cols-2 border-t border-border/60 first:border-t-0">
              <div className="border-r border-border px-5 py-4 text-[14px] leading-relaxed text-foreground/75 line-through decoration-rose-500/40 decoration-2">
                {r.left ?? ""}
              </div>
              <div className="px-5 py-4 text-[14px] font-medium leading-relaxed text-foreground">
                {r.right ?? ""}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/**
 * Deep-dive sections — 2 to 3 sub-articles after the lede. Each gets the
 * editorial-section treatment but with a bigger heading and looser rhythm.
 */
function DeepDive({ sections }: { sections?: Array<{ heading?: string; body?: string }> }) {
  if (!Array.isArray(sections)) return null;
  // Only render sections with a real, coherent body — never a bare placeholder
  // heading ("Section 4") sitting over nothing.
  const clean = sections.filter((s) => typeof s?.body === "string" && !isIncoherent(s.body));
  if (clean.length === 0) return null;
  return (
    <div className="space-y-12">
      {clean.map((s, i) => (
        <section key={i}>
          <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
            Part {String(i + 1).padStart(2, "0")}
          </p>
          {s.heading && !isIncoherent(s.heading) && (
            <h3 className="font-display mt-2 text-balance text-[1.7rem] font-bold leading-[1.15] tracking-[-0.01em] text-foreground md:text-[2.1rem]">
              {s.heading}
            </h3>
          )}
          <p className="mt-5 whitespace-pre-wrap text-[1.05rem] leading-[1.8] text-foreground/85">
            {s.body}
          </p>
        </section>
      ))}
    </div>
  );
}

/**
 * "Keep reading" footer — 3-4 related-topic cards. Internal cross-link feel.
 */
function RelatedReading({ items }: { items?: Array<{ title?: string; why_relevant?: string }> }) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <section>
      <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
        Keep reading
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((r, i) => (
          <div key={i} className="group rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-indigo-500/40 hover:shadow-elevated">
            <p className="font-display text-[1.1rem] font-bold leading-snug tracking-tight text-foreground">
              {r.title ?? "—"}
            </p>
            {r.why_relevant && (
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{r.why_relevant}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Single composer. Pass the article sub-object from any payload — renders
 * the lede, key takeaways, stats, deep-dive, comparison, pull-quote, and
 * related reading IN that order. Each piece is independently optional.
 *
 * Place it at the top of any per-type view, AFTER the title/standfirst
 * (which live in the article header) and BEFORE the structured fields
 * (steps, lessons, etc).
 */
export function ArticleBody({ article }: { article?: ArticleBlock | null }) {
  if (!article || typeof article !== "object") return null;
  const hasAny =
    article.intro || article.key_takeaways?.length || article.deep_dive?.length ||
    article.stats?.length || article.comparison?.rows?.length || article.pull_quote ||
    article.related_reading?.length;
  if (!hasAny) return null;

  return (
    <div className="space-y-14">
      <ArticleIntro text={article.intro} />
      <KeyTakeaways items={article.key_takeaways} />
      {article.deep_dive && article.deep_dive.length > 0 && (
        <>
          {ornament}
          <DeepDive sections={article.deep_dive} />
        </>
      )}
      {article.stats && article.stats.length > 0 && <StatsRow items={article.stats} />}
      {article.comparison && article.comparison.rows && article.comparison.rows.length > 0 && (
        <ComparisonBlock data={article.comparison} />
      )}
      {article.pull_quote && (
        <PullQuote accentClass="text-indigo-500/30" caption="— Worth quoting">
          {article.pull_quote}
        </PullQuote>
      )}
      {article.related_reading && article.related_reading.length > 0 && (
        <>
          {ornament}
          <RelatedReading items={article.related_reading} />
        </>
      )}
    </div>
  );
}

/* ===================================================================== */
/* INSIGHT view                                                             */
/* ===================================================================== */

export function InsightView({ payload }: { payload: AnyObj }) {
  const ip: AnyObj = payload?.insight_payload ?? {};
  return (
    <div className="space-y-14 pb-20">
      {ip.insight && (
        <p className="font-display text-balance text-[1.65rem] font-semibold italic leading-[1.45] tracking-[-0.01em] text-foreground md:text-[1.95rem]">
          &ldquo;{ip.insight}&rdquo;
        </p>
      )}

      <ArticleBody article={ip.article} />

      {ornament}

      {ip.why_it_matters && (
        <EditorialSection eyebrow="The signal" title="Why this matters now">
          <p>{ip.why_it_matters}</p>
        </EditorialSection>
      )}

      {ip.how_to_use_it && (
        <EditorialSection eyebrow="In practice" title="How to apply it today">
          <p>{ip.how_to_use_it}</p>
        </EditorialSection>
      )}

      {ip.example && (
        <PullQuote accentClass="text-amber-500/25" caption="— A worked example">
          {ip.example}
        </PullQuote>
      )}

      {Array.isArray(ip.related_concepts) && ip.related_concepts.length > 0 && (
        <div>
          <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-muted-foreground">Connected ideas</p>
          <div className="mt-3"><ChipStrip items={ip.related_concepts} accentClass="hover:border-amber-500/40 hover:text-foreground" /></div>
        </div>
      )}

      {ornament}

      {ip.action_step && (
        <FinalCta eyebrow="Take this action today" body={ip.action_step} />
      )}

      <SignatureFooter filed="Daily Insights" />
    </div>
  );
}

/* ===================================================================== */
/* WORKFLOW view — interactive step-by-step, editorial typography          */
/* ===================================================================== */

export function WorkflowView({ payload }: { payload: AnyObj }) {
  const wp: AnyObj = payload?.workflow_payload ?? {};
  const steps = Array.isArray(wp.steps) ? wp.steps : [];
  const [done, setDone] = useState<Set<number>>(new Set());
  const pct = steps.length ? Math.round((done.size / steps.length) * 100) : 0;

  return (
    <div className="space-y-14 pb-20">
      {/* Outcome lede */}
      {wp.outcome && (
        <p className="font-display text-balance text-[1.5rem] font-semibold italic leading-[1.45] tracking-[-0.01em] text-foreground md:text-[1.7rem]">
          You'll end up with: <span className="not-italic font-bold text-foreground">{wp.outcome}</span>
        </p>
      )}

      <ArticleBody article={wp.article} />

      {ornament}

      {/* What you need */}
      <div className="grid gap-10 md:grid-cols-2">
        {Array.isArray(wp.tools_needed) && wp.tools_needed.length > 0 && (
          <EditorialList label="Tools" items={wp.tools_needed} icon="dot" />
        )}
        {Array.isArray(wp.inputs_needed) && wp.inputs_needed.length > 0 && (
          <EditorialList label="Bring with you" items={wp.inputs_needed} icon="dot" />
        )}
      </div>

      {steps.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
              The Workflow · {steps.length} steps
            </p>
            <span className="inline-flex items-center gap-2 text-[11px] font-bold tabular-nums text-muted-foreground">
              <span className="inline-block h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                <span className="block h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all" style={{ width: `${pct}%` }} />
              </span>
              {pct}%
            </span>
          </div>

          <ol className="space-y-8">
            {steps.map((s: AnyObj, i: number) => {
              const checked = done.has(i);
              return (
                <li key={i} className="relative">
                  <div className="flex items-start gap-4">
                    {/* Check circle - clickable */}
                    <button
                      onClick={() => {
                        const next = new Set(done);
                        if (checked) next.delete(i); else next.add(i);
                        setDone(next);
                      }}
                      className={`mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold transition-all ${
                        checked
                          ? "bg-emerald-500 text-white shadow-glow"
                          : "border border-foreground/15 bg-card text-foreground/70 hover:border-foreground/40 hover:bg-muted/50"
                      }`}
                      aria-label={checked ? "Mark step incomplete" : "Mark step complete"}
                    >
                      {checked ? <CheckCircle2 className="h-4.5 w-4.5" /> : (s.step_number ?? i + 1)}
                    </button>

                    {/* Step body — editorial flow */}
                    <div className="flex-1 space-y-3">
                      <h3 className="font-display text-[1.3rem] font-bold leading-snug tracking-tight md:text-[1.45rem]">
                        {s.title ?? `Step ${i + 1}`}
                      </h3>
                      {s.instruction && (
                        <p className="text-[15.5px] leading-[1.7] text-foreground/85">{s.instruction}</p>
                      )}
                      {s.example && (
                        <p className="font-display border-l-2 border-indigo-500/60 pl-4 text-[14.5px] italic leading-[1.6] text-foreground/75">
                          {s.example}
                        </p>
                      )}
                      {s.expected_output && (
                        <p className="text-[13.5px] leading-relaxed text-foreground/70">
                          <span className="font-bold text-emerald-700">Expected: </span>{s.expected_output}
                        </p>
                      )}
                      {s.common_mistake && (
                        <p className="text-[13.5px] leading-relaxed text-foreground/70">
                          <span className="font-bold text-amber-700">Watch out: </span>{s.common_mistake}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {ornament}

      {Array.isArray(wp.automation_notes) && wp.automation_notes.length > 0 && (
        <EditorialSection eyebrow="Going further" title="Automation notes">
          <EditorialList label="" items={wp.automation_notes} icon="dot" />
        </EditorialSection>
      )}

      {Array.isArray(wp.success_criteria) && wp.success_criteria.length > 0 && (
        <EditorialSection eyebrow="Ship it" title="You're done when">
          <EditorialList label="" items={wp.success_criteria} icon="check" />
        </EditorialSection>
      )}

      <SignatureFooter filed="Workflows" />
    </div>
  );
}

/* ===================================================================== */
/* AGENT BLUEPRINT view — production-spec document                          */
/* ===================================================================== */

export function AgentView({ payload }: { payload: AnyObj }) {
  const ap: AnyObj = payload?.agent_payload ?? {};
  return (
    <div className="space-y-14 pb-20">
      {ap.agent_goal && (
        <p className="font-display text-balance text-[1.5rem] font-semibold italic leading-[1.45] tracking-[-0.01em] text-foreground md:text-[1.7rem]">
          {ap.agent_goal}
        </p>
      )}

      <ArticleBody article={ap.article} />

      {ornament}

      <div className="grid gap-10 md:grid-cols-2">
        {ap.ideal_user && (
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-muted-foreground">Ideal user</p>
            <p className="mt-2 text-[15.5px] leading-[1.65] text-foreground/85">{ap.ideal_user}</p>
          </div>
        )}
        <EditorialList label="Capabilities" items={ap.capabilities} icon="dot" />
      </div>

      <div className="grid gap-10 md:grid-cols-2">
        <EditorialList label="Tools required" items={ap.tools_required} icon="dot" />
        <EditorialList label="Memory" items={ap.memory_requirements} icon="dot" />
      </div>

      {ap.system_instructions && (
        <EditorialSection eyebrow="The system prompt" title="Drop this into your agent">
          <CopyBlock label="System instructions · ready to ship" text={String(ap.system_instructions)} />
        </EditorialSection>
      )}

      {ap.user_prompt_template && (
        <EditorialSection eyebrow="User-side" title="The prompt your user sends">
          <CopyBlock label="User prompt template" text={String(ap.user_prompt_template)} />
        </EditorialSection>
      )}

      {Array.isArray(ap.workflow_steps) && ap.workflow_steps.length > 0 && (
        <EditorialSection eyebrow="How it runs" title="Workflow steps">
          <EditorialList label="" items={ap.workflow_steps} numbered />
        </EditorialSection>
      )}

      {(ap.input_schema || ap.output_schema) && (
        <EditorialSection eyebrow="Contracts" title="Input + output shape">
          <div className="grid gap-4 md:grid-cols-2">
            {ap.input_schema && <SchemaBlock label="Input schema" data={ap.input_schema} />}
            {ap.output_schema && <SchemaBlock label="Output schema" data={ap.output_schema} />}
          </div>
        </EditorialSection>
      )}

      {Array.isArray(ap.evaluation_criteria) && ap.evaluation_criteria.length > 0 && (
        <EditorialSection eyebrow="Did it work" title="Evaluation criteria">
          <EditorialList label="" items={ap.evaluation_criteria} icon="check" />
        </EditorialSection>
      )}

      {Array.isArray(ap.risks_and_safety) && ap.risks_and_safety.length > 0 && (
        <EditorialSection eyebrow="Read this twice" title="Risks &amp; safety">
          <EditorialList label="" items={ap.risks_and_safety} icon="warn" />
        </EditorialSection>
      )}

      {Array.isArray(ap.implementation_steps) && ap.implementation_steps.length > 0 && (
        <EditorialSection eyebrow="Build it" title="Implementation steps">
          <EditorialList label="" items={ap.implementation_steps} numbered />
        </EditorialSection>
      )}

      <SignatureFooter filed="Agent Blueprints" />
    </div>
  );
}

function SchemaBlock({ label, data }: { label: string; data: any }) {
  const txt = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border bg-muted/40 px-4 py-2 text-[10.5px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
      <pre className="max-h-72 overflow-auto p-4 text-xs leading-[1.65]">
        <code className="whitespace-pre-wrap break-words font-mono">{txt}</code>
      </pre>
    </div>
  );
}

/* ===================================================================== */
/* BUSINESS LESSON view                                                     */
/* ===================================================================== */

export function BusinessView({ payload }: { payload: AnyObj }) {
  const bp: AnyObj = payload?.business_payload ?? {};
  return (
    <div className="space-y-14 pb-20">
      {bp.main_idea && (
        <p className="font-display text-balance text-[1.65rem] font-semibold italic leading-[1.45] tracking-[-0.01em] text-foreground md:text-[1.95rem]">
          {bp.main_idea}
        </p>
      )}

      <ArticleBody article={bp.article} />

      {ornament}

      {bp.why_it_matters && (
        <EditorialSection eyebrow="The opportunity" title="Why this matters">
          <p>{bp.why_it_matters}</p>
        </EditorialSection>
      )}

      {bp.business_use_case && (
        <EditorialSection eyebrow="In practice" title="A real business use case">
          <p>{bp.business_use_case}</p>
        </EditorialSection>
      )}

      {bp.monetization_angle && (
        <FinalCta
          eyebrow="The monetization angle"
          body={bp.monetization_angle}
          icon={Briefcase}
          accent="from-emerald-500 to-teal-600"
          accentRing="border-emerald-500/25 bg-gradient-to-br from-emerald-500/8 via-teal-500/5"
          accentEyebrow="text-emerald-700"
        />
      )}

      {Array.isArray(bp.step_by_step_strategy) && bp.step_by_step_strategy.length > 0 && (
        <EditorialSection eyebrow="The play" title="Step-by-step strategy">
          <EditorialList label="" items={bp.step_by_step_strategy} numbered />
        </EditorialSection>
      )}

      {bp.example && (
        <PullQuote accentClass="text-emerald-500/30" caption="— A worked example">
          {bp.example}
        </PullQuote>
      )}

      {Array.isArray(bp.tools_or_skills_needed) && bp.tools_or_skills_needed.length > 0 && (
        <EditorialList label="Tools &amp; skills you'll need" items={bp.tools_or_skills_needed} icon="dot" />
      )}

      {Array.isArray(bp.mistakes_to_avoid) && bp.mistakes_to_avoid.length > 0 && (
        <EditorialSection eyebrow="Don't" title="Mistakes to avoid">
          <EditorialList label="" items={bp.mistakes_to_avoid} icon="warn" />
        </EditorialSection>
      )}

      {Array.isArray(bp.action_steps) && bp.action_steps.length > 0 && (
        <EditorialSection eyebrow="This week" title="Your action steps">
          <EditorialList label="" items={bp.action_steps} icon="check" />
        </EditorialSection>
      )}

      <SignatureFooter filed="Business Lessons" />
    </div>
  );
}

/* ===================================================================== */
/* TOOL GUIDE view                                                          */
/* ===================================================================== */

export function ToolView({ payload }: { payload: AnyObj }) {
  const tp: AnyObj = payload?.tool_payload ?? {};
  return (
    <div className="space-y-14 pb-20">
      {tp.tool_name && (
        <p className="font-display text-balance text-[1.65rem] font-semibold italic leading-[1.45] tracking-[-0.01em] text-foreground md:text-[1.95rem]">
          {tp.tool_name}
        </p>
      )}
      {tp.what_it_does && (
        <p className="text-[1.05rem] leading-[1.75] text-foreground/85">{tp.what_it_does}</p>
      )}

      <ArticleBody article={tp.article} />

      {ornament}

      {Array.isArray(tp.best_for) && tp.best_for.length > 0 && (
        <EditorialSection eyebrow="Use it when" title="Best for">
          <EditorialList label="" items={tp.best_for} icon="dot" />
        </EditorialSection>
      )}

      {Array.isArray(tp.how_to_use) && tp.how_to_use.length > 0 && (
        <EditorialSection eyebrow="Get value fast" title="How to use it">
          <EditorialList label="" items={tp.how_to_use} numbered />
        </EditorialSection>
      )}

      {tp.example_workflow && (
        <PullQuote accentClass="text-zinc-500/30" caption="— Example workflow">
          {tp.example_workflow}
        </PullQuote>
      )}

      <div className="grid gap-10 md:grid-cols-2">
        <EditorialList label="Pros" items={tp.pros} icon="check" accent="text-emerald-700" />
        <EditorialList label="Limitations" items={tp.limitations} icon="warn" accent="text-amber-700" />
      </div>

      {Array.isArray(tp.alternatives) && tp.alternatives.length > 0 && (
        <div>
          <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-muted-foreground">If this isn't the right fit</p>
          <div className="mt-3"><ChipStrip items={tp.alternatives} /></div>
        </div>
      )}

      <SignatureFooter filed="Tool Guides" />
    </div>
  );
}

/* ===================================================================== */
/* PLAYBOOK view                                                            */
/* ===================================================================== */

export function PlaybookView({ payload }: { payload: AnyObj }) {
  const pb: AnyObj = payload?.playbook_payload ?? {};
  const phases = Array.isArray(pb.phases) ? pb.phases : [];
  return (
    <div className="space-y-14 pb-20">
      {pb.goal && (
        <p className="font-display text-balance text-[1.65rem] font-semibold italic leading-[1.45] tracking-[-0.01em] text-foreground md:text-[1.95rem]">
          {pb.goal}
        </p>
      )}

      <ArticleBody article={pb.article} />

      {ornament}

      <div className="grid gap-10 md:grid-cols-2">
        {pb.who_it_is_for && (
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-muted-foreground">Who it's for</p>
            <p className="mt-2 text-[15.5px] leading-[1.65] text-foreground/85">{pb.who_it_is_for}</p>
          </div>
        )}
        <EditorialList label="Required tools" items={pb.required_tools} icon="dot" />
      </div>

      {phases.length > 0 && (
        <section>
          <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-muted-foreground">The play · {phases.length} phases</p>
          <ol className="mt-6 space-y-12">
            {phases.map((ph: AnyObj, i: number) => (
              <li key={i} className="relative">
                <div className="flex items-baseline gap-4">
                  <span className="font-display text-[3rem] font-bold leading-none tracking-tight text-rose-500/40">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display text-[1.5rem] font-bold leading-tight tracking-tight md:text-[1.75rem]">
                      {ph.phase ?? `Phase ${i + 1}`}
                    </h3>
                    {ph.objective && (
                      <p className="mt-2 text-[15.5px] leading-[1.65] text-foreground/75">{ph.objective}</p>
                    )}
                  </div>
                </div>
                {Array.isArray(ph.steps) && ph.steps.length > 0 && (
                  <div className="mt-5 pl-2">
                    <EditorialList label="Steps" items={ph.steps} numbered />
                  </div>
                )}
                {ph.deliverable && (
                  <p className="mt-5 pl-2 text-[14px] leading-relaxed">
                    <span className="font-bold text-emerald-700">Deliverable: </span>
                    <span className="text-foreground/85">{ph.deliverable}</span>
                  </p>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      {ornament}

      {Array.isArray(pb.checklist) && pb.checklist.length > 0 && (
        <EditorialSection eyebrow="Master checklist" title="Don't ship without">
          <EditorialList label="" items={pb.checklist} icon="check" />
        </EditorialSection>
      )}

      {Array.isArray(pb.success_metrics) && pb.success_metrics.length > 0 && (
        <EditorialSection eyebrow="Track these" title="Success metrics">
          <EditorialList label="" items={pb.success_metrics} icon="dot" />
        </EditorialSection>
      )}

      <SignatureFooter filed="Playbooks" />
    </div>
  );
}

/* ===================================================================== */
/* CHALLENGE view — interactive practice                                    */
/* ===================================================================== */

export function ChallengeView({ payload }: { payload: AnyObj }) {
  const cp: AnyObj = payload?.challenge_payload ?? {};
  const [showSolution, setShowSolution] = useState(false);
  return (
    <div className="space-y-14 pb-20">
      {cp.challenge_goal && (
        <p className="font-display text-balance text-[1.65rem] font-semibold italic leading-[1.45] tracking-[-0.01em] text-foreground md:text-[1.95rem]">
          {cp.challenge_goal}
        </p>
      )}

      <ArticleBody article={cp.article} />

      {ornament}

      {cp.instructions && (
        <EditorialSection eyebrow="Your task" title="What to do">
          <p className="whitespace-pre-wrap">{cp.instructions}</p>
        </EditorialSection>
      )}

      {cp.starter_material && (
        <EditorialSection eyebrow="Start from this" title="Your starter material">
          <CopyBlock label="Starter" text={String(cp.starter_material)} />
        </EditorialSection>
      )}

      {Array.isArray(cp.success_criteria) && cp.success_criteria.length > 0 && (
        <EditorialSection eyebrow="Done when" title="Success criteria">
          <EditorialList label="" items={cp.success_criteria} icon="check" />
        </EditorialSection>
      )}

      {cp.hint && (
        <details className="group rounded-2xl border border-border bg-card p-5 shadow-soft">
          <summary className="cursor-pointer text-[13px] font-bold uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground">
            Stuck? peek at the hint
          </summary>
          <p className="mt-3 text-[15px] leading-relaxed text-foreground/85">{cp.hint}</p>
        </details>
      )}

      {cp.example_solution && (
        <div>
          <Button
            variant="outline"
            onClick={() => setShowSolution((v) => !v)}
            className="border-foreground/15"
          >
            {showSolution ? "Hide" : "Reveal"} the example solution
          </Button>
          {showSolution && (
            <div className="mt-4">
              <CopyBlock label="Example solution" text={String(cp.example_solution)} />
            </div>
          )}
        </div>
      )}

      {cp.reflection_question && (
        <PullQuote accentClass="text-indigo-500/30" caption="— Reflect on this">
          {cp.reflection_question}
        </PullQuote>
      )}

      <SignatureFooter filed="Challenges" />
    </div>
  );
}

/* ===================================================================== */
/* CHEATSHEET view — reference card. Allowed to be denser than articles.    */
/* ===================================================================== */

export function CheatsheetView({ payload }: { payload: AnyObj }) {
  const cs: AnyObj = payload?.cheatsheet_payload ?? {};
  return (
    <div className="space-y-14 pb-20">
      {cs.summary && (
        <p className="font-display text-balance text-[1.5rem] font-semibold italic leading-[1.45] tracking-[-0.01em] text-foreground md:text-[1.7rem]">
          {cs.summary}
        </p>
      )}

      <ArticleBody article={cs.article} />

      {ornament}

      {Array.isArray(cs.framework) && cs.framework.length > 0 && (
        <EditorialSection eyebrow="Remember this" title="The framework">
          <EditorialList label="" items={cs.framework} numbered />
        </EditorialSection>
      )}

      <div className="grid gap-10 md:grid-cols-2">
        {Array.isArray(cs.quick_commands) && cs.quick_commands.length > 0 && (
          <EditorialList label="Quick commands" items={cs.quick_commands} icon="dot" />
        )}
        {Array.isArray(cs.prompt_patterns) && cs.prompt_patterns.length > 0 && (
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-muted-foreground">Prompt patterns</p>
            <div className="mt-3 space-y-2">
              {cs.prompt_patterns.map((p: string, i: number) => (
                <code key={i} className="block whitespace-pre-wrap rounded-lg border border-border bg-card px-3 py-2 font-mono text-[12.5px] leading-relaxed text-foreground/85">
                  {p}
                </code>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-10 md:grid-cols-2">
        <EditorialList label="Do" items={cs.dos} icon="check" accent="text-emerald-700" />
        <EditorialList label="Don't" items={cs.donts} icon="warn" accent="text-amber-700" />
      </div>

      {cs.example && (
        <PullQuote accentClass="text-indigo-500/30" caption="— Worked example">
          {cs.example}
        </PullQuote>
      )}

      <SignatureFooter filed="Cheatsheets" />
    </div>
  );
}
