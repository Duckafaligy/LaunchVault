import { useEffect, useState } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Check,
  Briefcase,
  GraduationCap,
  User as UserIcon,
  Palette,
  Code2,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getOnboardingState, savePreferences } from "@/utils/learning.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  component: OnboardingPage,
});

type SkillLevel = "beginner" | "intermediate" | "advanced";
type Goal = "individual" | "business_owner" | "student" | "creator" | "developer";
type Tone = "practical" | "deep" | "playful" | "concise";
type Focus =
  | "prompting"
  | "ai_fundamentals"
  | "agents"
  | "workflows"
  | "business"
  | "marketing"
  | "coding"
  | "writing"
  | "design"
  | "research";

type Answers = {
  skill_level: SkillLevel | null;
  primary_goal: Goal | null;
  focus_areas: Focus[];
  tone_preference: Tone;
  daily_time_minutes: number;
};

const GOALS: Array<{ id: Goal; label: string; desc: string; icon: LucideIcon }> = [
  { id: "individual", label: "Individual learner", desc: "Curious about AI in everyday life", icon: UserIcon },
  { id: "business_owner", label: "Business owner", desc: "Apply AI to grow my business", icon: Briefcase },
  { id: "student", label: "Student", desc: "Learn the fundamentals deeply", icon: GraduationCap },
  { id: "creator", label: "Creator", desc: "Use AI for content & marketing", icon: Palette },
  { id: "developer", label: "Developer / builder", desc: "Ship apps with AI", icon: Code2 },
];

const SKILLS: Array<{ id: SkillLevel; label: string; desc: string }> = [
  { id: "beginner", label: "Brand new", desc: "I've barely used ChatGPT or Claude" },
  { id: "intermediate", label: "Getting comfortable", desc: "I use AI weekly but want to go deeper" },
  { id: "advanced", label: "Power user", desc: "I'm building with prompts, agents, and APIs" },
];

const FOCUS_AREAS: Array<{ id: Focus; label: string }> = [
  { id: "prompting", label: "Prompting" },
  { id: "ai_fundamentals", label: "AI fundamentals" },
  { id: "agents", label: "Agents" },
  { id: "workflows", label: "Workflows" },
  { id: "business", label: "Business" },
  { id: "marketing", label: "Marketing" },
  { id: "coding", label: "Coding" },
  { id: "writing", label: "Writing" },
  { id: "design", label: "Design" },
  { id: "research", label: "Research" },
];

const TONES: Array<{ id: Tone; label: string; desc: string }> = [
  { id: "practical", label: "Practical", desc: "Just tell me what works" },
  { id: "deep", label: "Deep dive", desc: "Explain the why too" },
  { id: "playful", label: "Playful", desc: "Keep it light & fun" },
  { id: "concise", label: "Concise", desc: "TL;DR everything" },
];

const TIME_OPTIONS = [5, 10, 15, 30, 60];

function OnboardingPage() {
  const navigate = useNavigate();
  const fetchState = useServerFn(getOnboardingState);
  const savePrefs = useServerFn(savePreferences);

  const { data: state, isLoading } = useQuery({
    queryKey: ["onboarding-state"],
    queryFn: () => fetchState(),
  });

  // If already onboarded, send to dashboard
  useEffect(() => {
    if (state?.completed) navigate({ to: "/dashboard" });
  }, [state, navigate]);

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({
    skill_level: null,
    primary_goal: null,
    focus_areas: [],
    tone_preference: "practical",
    daily_time_minutes: 15,
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      savePrefs({
        data: {
          skill_level: answers.skill_level!,
          primary_goal: answers.primary_goal!,
          focus_areas: answers.focus_areas,
          tone_preference: answers.tone_preference,
          daily_time_minutes: answers.daily_time_minutes,
        },
      }),
    onSuccess: () => {
      toast.success("You're all set! Building your feed…");
      navigate({ to: "/dashboard" });
    },
    onError: () => toast.error("Couldn't save your preferences. Try again."),
  });

  const steps = ["Goal", "Skill", "Focus", "Style"];
  const total = steps.length;
  const progress = ((step + 1) / total) * 100;

  const canAdvance =
    (step === 0 && answers.primary_goal !== null) ||
    (step === 1 && answers.skill_level !== null) ||
    (step === 2 && answers.focus_areas.length > 0) ||
    (step === 3 && answers.tone_preference !== null);

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-gradient-surface">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-violet-900 to-fuchsia-900 px-4 py-10 text-white">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider ring-1 ring-white/20">
            <Sparkles className="h-3.5 w-3.5" /> Personalize your vault
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
            Let&apos;s tune the engine to you
          </h1>
          <p className="mt-2 text-sm text-white/70">
            Four quick questions. Powers your daily feed, courses, and recommendations.
          </p>
        </div>

        {/* Progress */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-xs font-medium text-white/70">
            <span>Step {step + 1} of {total} — {steps[step]}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-fuchsia-400 to-indigo-300 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="mt-8 rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur md:p-8">
          {step === 0 && (
            <Step title="What brings you to LaunchVault?" subtitle="Pick the one that fits best.">
              <div className="grid gap-3 sm:grid-cols-2">
                {GOALS.map((g) => {
                  const Icon = g.icon;
                  const selected = answers.primary_goal === g.id;
                  return (
                    <button
                      key={g.id}
                      onClick={() => setAnswers((a) => ({ ...a, primary_goal: g.id }))}
                      className={`group rounded-xl border p-4 text-left transition-all ${
                        selected
                          ? "border-fuchsia-400 bg-fuchsia-400/15 ring-2 ring-fuchsia-400/40"
                          : "border-white/15 hover:border-white/30 hover:bg-white/5"
                      }`}
                    >
                      <Icon className="h-5 w-5 text-fuchsia-300" />
                      <p className="mt-2 font-semibold">{g.label}</p>
                      <p className="mt-0.5 text-xs text-white/60">{g.desc}</p>
                    </button>
                  );
                })}
              </div>
            </Step>
          )}

          {step === 1 && (
            <Step title="How much AI experience do you have?" subtitle="We'll match the right difficulty.">
              <div className="space-y-3">
                {SKILLS.map((s) => {
                  const selected = answers.skill_level === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setAnswers((a) => ({ ...a, skill_level: s.id }))}
                      className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition-all ${
                        selected
                          ? "border-fuchsia-400 bg-fuchsia-400/15 ring-2 ring-fuchsia-400/40"
                          : "border-white/15 hover:border-white/30 hover:bg-white/5"
                      }`}
                    >
                      <div>
                        <p className="font-semibold">{s.label}</p>
                        <p className="mt-0.5 text-xs text-white/60">{s.desc}</p>
                      </div>
                      {selected && <Check className="h-5 w-5 text-fuchsia-300" />}
                    </button>
                  );
                })}
              </div>
            </Step>
          )}

          {step === 2 && (
            <Step
              title="What do you want to master first?"
              subtitle={`Pick up to 6 areas. (${answers.focus_areas.length} selected)`}
            >
              <div className="flex flex-wrap gap-2">
                {FOCUS_AREAS.map((f) => {
                  const selected = answers.focus_areas.includes(f.id);
                  return (
                    <button
                      key={f.id}
                      onClick={() =>
                        setAnswers((a) => ({
                          ...a,
                          focus_areas: selected
                            ? a.focus_areas.filter((x) => x !== f.id)
                            : a.focus_areas.length < 6
                              ? [...a.focus_areas, f.id]
                              : a.focus_areas,
                        }))
                      }
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                        selected
                          ? "border-fuchsia-400 bg-fuchsia-400/20 text-white"
                          : "border-white/20 text-white/80 hover:border-white/40 hover:bg-white/5"
                      }`}
                    >
                      {selected && <Check className="mr-1.5 inline h-3.5 w-3.5" />}
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </Step>
          )}

          {step === 3 && (
            <Step
              title="Last thing — how do you like to learn?"
              subtitle="Tone + daily time budget."
            >
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/60">Tone</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {TONES.map((t) => {
                      const selected = answers.tone_preference === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => setAnswers((a) => ({ ...a, tone_preference: t.id }))}
                          className={`rounded-xl border p-3 text-left transition-all ${
                            selected
                              ? "border-fuchsia-400 bg-fuchsia-400/15 ring-2 ring-fuchsia-400/40"
                              : "border-white/15 hover:border-white/30 hover:bg-white/5"
                          }`}
                        >
                          <p className="text-sm font-semibold">{t.label}</p>
                          <p className="mt-0.5 text-xs text-white/60">{t.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
                    Daily time budget
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {TIME_OPTIONS.map((m) => {
                      const selected = answers.daily_time_minutes === m;
                      return (
                        <button
                          key={m}
                          onClick={() => setAnswers((a) => ({ ...a, daily_time_minutes: m }))}
                          className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                            selected
                              ? "border-fuchsia-400 bg-fuchsia-400/20 text-white"
                              : "border-white/20 text-white/80 hover:border-white/40 hover:bg-white/5"
                          }`}
                        >
                          {m} min / day
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Step>
          )}
        </div>

        {/* Nav */}
        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="text-white hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
          </Button>
          {step < total - 1 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canAdvance}
              className="bg-white text-indigo-900 hover:bg-white/90"
            >
              Continue <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!canAdvance || saveMutation.isPending}
              className="bg-white text-indigo-900 hover:bg-white/90"
            >
              {saveMutation.isPending ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-1.5 h-4 w-4" />
              )}
              Build my vault
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Step({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-xl font-bold md:text-2xl">{title}</h2>
      <p className="mt-1 text-sm text-white/70">{subtitle}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}
