import { ShieldCheck, Sparkles, FileCheck2, Gauge } from "lucide-react";

export function AutoEngineSection() {
  return (
    <section className="relative isolate overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-emerald-500/15 blur-[120px]" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-cyan-500/15 blur-[120px]" />

      <div className="relative mx-auto max-w-6xl px-4 py-24">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">
              <ShieldCheck className="h-3 w-3" /> Quality-gated, not auto-dumped
            </span>
            <h2 className="mt-4 text-balance text-4xl font-extrabold tracking-tight md:text-5xl">
              A firehose
              <span className="block bg-gradient-to-r from-emerald-300 via-cyan-300 to-sky-300 bg-clip-text text-transparent">with a filter on it.</span>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-300">
              Yes — an AI writes the first draft, every two hours, across 50 domains. We&apos;re not hiding that.
              The difference is what happens next: nothing reaches your feed until it clears the gate.
              Every item is validated against a strict schema for its type, then scored 0&ndash;100 on depth and
              completeness. <strong className="text-white">Score below 78 and it never publishes.</strong> You get
              what survived — not everything that was generated.
            </p>

            <ul className="mt-6 space-y-2 text-sm text-slate-300">
              <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400" /> Strict per-type JSON schema — structurally broken drafts get repaired or dropped.</li>
              <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400" /> 0&ndash;100 quality score on every item; the publish line is a hard 78.</li>
              <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400" /> Anti-slop rules: opinionated, specific, no &ldquo;leverage / revolutionize&rdquo; filler.</li>
              <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400" /> Spread across 50 mastery domains and personalized to <em>your</em> goals after onboarding.</li>
            </ul>
          </div>

          {/* The quality-gate ladder — shows the real publish threshold */}
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 p-8 shadow-2xl backdrop-blur">
            <div className="text-center">
              <div className="mx-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                <Gauge className="h-3 w-3" /> Every draft, scored
              </div>
              <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">The publish gate</p>
            </div>

            <ul className="mt-6 space-y-2 text-[12.5px]">
              <ScoreRow band="90–100" label="Excellent" verdict="ships" tone="pass" />
              <ScoreRow band="78–89" label="Good" verdict="ships" tone="pass" />

              {/* The line */}
              <li className="flex items-center gap-2 py-1.5">
                <span className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />
                <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-emerald-200">
                  Publish line · 78
                </span>
                <span className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />
              </li>

              <ScoreRow band="60–77" label="Needs work" verdict="held back" tone="hold" />
              <ScoreRow band="0–59" label="Failed" verdict="dropped" tone="fail" />
            </ul>

            <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-400">
              <FileCheck2 className="h-3.5 w-3.5 text-emerald-300" />
              Anything under 78 stays unpublished — you never see it.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ScoreRow({
  band, label, verdict, tone,
}: { band: string; label: string; verdict: string; tone: "pass" | "hold" | "fail" }) {
  const dot =
    tone === "pass" ? "bg-emerald-400" : tone === "hold" ? "bg-amber-400" : "bg-rose-400";
  const verdictCls =
    tone === "pass"
      ? "text-emerald-300"
      : tone === "hold"
        ? "text-amber-300"
        : "text-rose-300";
  const rowCls =
    tone === "pass"
      ? "border-white/10 bg-slate-900/70"
      : "border-white/5 bg-slate-900/40 opacity-70";
  return (
    <li className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${rowCls}`}>
      <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
      <span className="font-mono text-[11px] tabular-nums text-slate-400">{band}</span>
      <span className="font-semibold text-slate-100">{label}</span>
      <span className={`ml-auto text-[10px] font-bold uppercase tracking-wider ${verdictCls}`}>{verdict}</span>
    </li>
  );
}
