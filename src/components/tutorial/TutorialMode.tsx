// =====================================================================
// Tutorial Mode — a guided walkthrough for newcomers.
//
// Triggered by the "Tutorial" button in the dashboard sidebar.
// Renders a full-screen overlay with step-by-step explanations of:
//   - How the autonomous engine works
//   - Where to find content (library / glossary / blog / saved)
//   - How to use prompts / courses / agents
//   - Account features (save to vault, profile settings)
//   - Pricing tiers
//
// State persists to localStorage so "skip" or "completed" sticks.
// =====================================================================

import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  X, ChevronLeft, ChevronRight, CheckCircle2, Sparkles, RefreshCw,
  Library as LibraryIcon, BookOpen, Bookmark, MessageSquareCode,
  GraduationCap, Crown, type LucideIcon,
} from "lucide-react";

const STORAGE_KEY = "lv_tutorial_v1_state";

type Step = {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  body: string;
  visual?: React.ReactNode;
  cta?: { label: string; to: string };
};

const STEPS: Step[] = [
  {
    icon: Sparkles,
    eyebrow: "Welcome",
    title: "This is your AI mastery engine",
    body: "LaunchVault publishes new AI prompts, courses, agent blueprints, business plays, and editorial essays every 2 hours — automatically. You don't wait for content; the engine fills the library while you sleep.",
    visual: (
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        {["Prompts", "Courses", "Workflows", "Agents", "Business plays", "Insights", "Tool guides", "Playbooks", "Challenges", "Cheatsheets", "Glossary", "Essays"].map((t) => (
          <div key={t} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 font-semibold text-white/85">
            {t}
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: RefreshCw,
    eyebrow: "How the engine works",
    title: "Every 2 hours, ~12 new items publish",
    body: "Cloudflare's built-in cron fires the engine 12 times a day. Each cycle: OpenAI generates content → validators reject anything off-brand or low quality → quality scoring → only items scoring 70+ ship. You'll see new content appear in the dashboard rail in real time.",
    cta: { label: "See the live engine rail", to: "/dashboard" },
  },
  {
    icon: LibraryIcon,
    eyebrow: "The library",
    title: "Browse everything in one place",
    body: "The All Content tab in your sidebar shows every published item across all 12 types. Filter by type, search by keyword, and toggle locked/unlocked. Free items work for everyone. Paid items require your tier.",
    cta: { label: "Open All Content", to: "/dashboard/library" },
  },
  {
    icon: BookOpen,
    eyebrow: "Glossary + Blog",
    title: "AI Glossary + editorial essays",
    body: "The Glossary defines AI terms in a way LLMs can cite — meaning when someone asks ChatGPT 'what is RAG?', your definition can show up. The Blog has founder-voice essays on autonomous content, indie SaaS, and AI economics. Both are free.",
    cta: { label: "Browse the Glossary", to: "/glossary" },
  },
  {
    icon: GraduationCap,
    eyebrow: "Interactive courses",
    title: "Q/A-gated micro-courses",
    body: "Open any course to enter the Duolingo-style player. Each lesson: read → example → practice → quiz. Wrong answers cost hearts. Correct answers unlock the next lesson. Real practice, not passive reading.",
    cta: { label: "See courses", to: "/dashboard/courses" },
  },
  {
    icon: Bookmark,
    eyebrow: "Saved Vault",
    title: "Save anything for later",
    body: "Tap the bookmark icon on any article, prompt, or glossary entry to add it to your personal vault. Access it anytime from the sidebar. Search + filter by type.",
    cta: { label: "Open Saved Vault", to: "/dashboard/saved" },
  },
  {
    icon: MessageSquareCode,
    eyebrow: "Prompts",
    title: "Copy-ready prompts you can paste anywhere",
    body: "Each prompt has a copy-ready text block, fillable inputs, usage steps, and a quality checklist. Drop it into ChatGPT, Claude, or any AI tool — works as-is.",
    cta: { label: "Browse prompts", to: "/dashboard/prompts" },
  },
  {
    icon: Crown,
    eyebrow: "Upgrade when ready",
    title: "Free forever — or unlock the full vault",
    body: "Free tier never expires. Starter ($5/mo) unlocks the full prompt library. Creator ($12/mo) is most popular — full courses + agent blueprints. Pro ($30/mo) unlocks everything, including premium categories and the full archive. Cancel any time, one click.",
    cta: { label: "See pricing", to: "/pricing" },
  },
];

type Props = {
  open: boolean;
  onClose: () => void;
};

export function TutorialMode({ open, onClose }: Props) {
  const [step, setStep] = useState(0);
  const total = STEPS.length;

  useEffect(() => {
    if (!open) return;
    // Lock body scroll while tutorial is open
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Reset to step 0 every time it opens fresh
  useEffect(() => { if (open) setStep(0); }, [open]);

  const markCompleted = () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ completed: true, at: Date.now() })); } catch {}
  };

  const handleClose = (completed = false) => {
    if (completed) markCompleted();
    onClose();
  };

  if (!open) return null;
  const s = STEPS[step];
  const Icon = s.icon;
  const isFirst = step === 0;
  const isLast = step === total - 1;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 backdrop-blur-sm" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80"
        onClick={() => handleClose(false)}
        aria-hidden
      />

      {/* Card */}
      <div className="relative flex max-h-[100dvh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-950 text-white shadow-elevated max-sm:!h-[100dvh] max-sm:!rounded-none">
        {/* Aurora */}
        <div aria-hidden className="pointer-events-none absolute -top-32 -left-20 h-[420px] w-[420px] rounded-full bg-indigo-600/30 blur-[120px]" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 -right-20 h-[420px] w-[420px] rounded-full bg-fuchsia-600/25 blur-[120px]" />

        {/* Header */}
        <div className="relative flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-3.5 pt-[max(env(safe-area-inset-top),0.875rem)] sm:px-7">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-slate-300">
            Tutorial · Step {step + 1} of {total}
          </p>
          <button
            onClick={() => handleClose(false)}
            className="rounded-lg p-2 text-slate-300 hover:bg-white/10"
            aria-label="Close tutorial"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="relative h-1 shrink-0 bg-white/5">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 transition-all duration-300"
            style={{ width: `${((step + 1) / total) * 100}%` }}
          />
        </div>

        {/* Body — scrolls if too tall */}
        <div className="relative flex-1 overflow-y-auto px-5 py-6 sm:px-10 sm:py-10">
          <div className="mx-auto max-w-xl">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-glow">
              <Icon className="h-6 w-6" />
            </div>
            <p className="mt-6 text-[10.5px] font-bold uppercase tracking-[0.22em] text-indigo-300">
              {s.eyebrow}
            </p>
            <h2 className="font-display mt-2 text-balance text-3xl font-bold leading-tight tracking-tight md:text-[2.25rem]">
              {s.title}
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-slate-300 md:text-base">
              {s.body}
            </p>

            {s.visual && <div className="mt-6">{s.visual}</div>}

            {s.cta && (
              <Link
                to={s.cta.to as any}
                onClick={() => handleClose(false)}
                className="mt-7 inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-[13px] font-bold text-white backdrop-blur transition-colors hover:bg-white/10"
              >
                {s.cta.label} <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>

        {/* Footer nav */}
        <div className="relative flex shrink-0 items-center justify-between gap-2 border-t border-white/10 bg-slate-950/80 px-5 py-3.5 pb-[max(env(safe-area-inset-bottom),0.875rem)] backdrop-blur sm:px-7">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={isFirst}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3.5 py-2 text-[13px] font-semibold text-slate-200 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Back
          </button>

          {/* Step dots */}
          <div className="hidden items-center gap-1.5 sm:flex">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                aria-label={`Go to step ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? "w-6 bg-white" : i < step ? "w-1.5 bg-indigo-400" : "w-1.5 bg-white/20"
                }`}
              />
            ))}
          </div>

          {isLast ? (
            <button
              onClick={() => handleClose(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-indigo-600 to-fuchsia-600 px-4 py-2 text-[13px] font-bold text-white shadow-glow hover:opacity-95"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Got it
            </button>
          ) : (
            <button
              onClick={() => setStep(Math.min(total - 1, step + 1))}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-700 px-4 py-2 text-[13px] font-bold text-white shadow-glow hover:opacity-95"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Returns true if the user already completed the tutorial. */
export function hasCompletedTutorial(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return !!parsed?.completed;
  } catch {
    return false;
  }
}
