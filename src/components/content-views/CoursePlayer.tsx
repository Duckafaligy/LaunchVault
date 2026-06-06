// Duolingo / Codecademy-inspired course player.
// Each lesson is broken into 4 micro-steps the user clicks through:
//   1. Read   — the concept
//   2. Example — see it in action
//   3. Practice — editable try-it textarea
//   4. Check   — checkpoint quiz with hearts/lives
//
// Wrong quiz answer = lose a heart. 0 hearts = restart the lesson.
// Correct = sparkle celebration + XP toast + auto-advance to next lesson.
import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  BookOpen, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Heart,
  Sparkles, Trophy, Eye, Code2, ListChecks, Lightbulb, Rocket,
  RotateCcw, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { recordSectionProgress } from "@/utils/learning.functions";

type Section = {
  id?: string;
  title: string;
  objective?: string;
  // Article-grade body (new). Falls back to legacy `lesson` field.
  article?: string;
  intro_hook?: string;
  key_takeaways?: string[];
  // Branching support — at this lesson, learner picks the next route.
  next_choices?: {
    prompt: string;
    choices: Array<{ label: string; leads_to_lesson_id: string }>;
  };
  lesson?: string; // legacy
  example?: string;
  walkthrough_steps?: string[];
  practice_task?: {
    title?: string;
    instructions?: string;
    starter_prompt_or_code?: string;
    success_criteria?: string[];
  };
  checkpoint_quiz?: {
    question: string;
    options: string[];
    correct_answer: string;
    explanation?: string;
  };
  common_mistakes?: string[];
  recap?: string;
  next_step?: string;
};

const MAX_HEARTS = 3;

const STEP_LABELS: Array<{ id: string; label: string; icon: typeof BookOpen }> = [
  { id: "read",     label: "Read",     icon: BookOpen },
  { id: "example",  label: "Example",  icon: Eye },
  { id: "practice", label: "Practice", icon: Rocket },
  { id: "check",    label: "Check",    icon: ListChecks },
];

export function CoursePlayer({
  contentId, sections, extra, initialProgress, guest = false,
}: {
  contentId: string;
  sections: Section[];
  extra: any;
  initialProgress?: { current_section?: number; completed_sections?: number[]; is_completed?: boolean } | null;
  // Guest mode (logged-out, public page): full interactive lessons, but skip
  // the auth-only XP/progress save. A signup nudge is shown on completion.
  guest?: boolean;
}) {
  const total = sections.length;
  const initialActive = Math.min(initialProgress?.current_section ?? 0, Math.max(0, total - 1));

  const [activeLesson, setActiveLesson] = useState(initialActive);
  const [done, setDone] = useState<Set<number>>(
    new Set(Array.isArray(initialProgress?.completed_sections) ? initialProgress!.completed_sections! : []),
  );

  // Within-lesson step (read / example / practice / check). Reset on lesson change.
  const [stepIdx, setStepIdx] = useState(0);
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [quizSolved, setQuizSolved] = useState(false);
  const [practiceText, setPracticeText] = useState("");
  const [celebrate, setCelebrate] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const section = sections[activeLesson];

  // When the lesson changes, reset within-lesson state.
  useEffect(() => {
    setStepIdx(0);
    setHearts(MAX_HEARTS);
    setQuizSolved(false);
    setPracticeText(section?.practice_task?.starter_prompt_or_code ?? "");
    setCelebrate(false);
  }, [activeLesson, section?.id, section?.practice_task?.starter_prompt_or_code]);

  // Server-side XP save
  const saveFn = useServerFn(recordSectionProgress);
  const save = useMutation({
    mutationFn: (input: { sectionIndex: number; completedAll?: boolean }) =>
      saveFn({
        data: {
          contentId,
          sectionIndex: input.sectionIndex,
          totalSections: total,
          completedAll: input.completedAll,
        },
      }),
    onSuccess: (res) => {
      if (res?.awardedXp) toast.success(`+${res.awardedXp} XP earned`, { icon: "⚡" });
    },
  });

  if (!section) {
    return <p className="text-sm text-muted-foreground">This course has no lessons yet.</p>;
  }

  // Filter step list — skip steps the lesson doesn't have
  // Body resolution — new courses have `article`, older ones have `lesson`
  const lessonBody = section.article ?? section.lesson ?? "";

  const availableSteps = useMemo(() => {
    const list: typeof STEP_LABELS = [];
    if (lessonBody) list.push(STEP_LABELS[0]);
    if (section.example || (section.walkthrough_steps && section.walkthrough_steps.length)) list.push(STEP_LABELS[1]);
    if (section.practice_task) list.push(STEP_LABELS[2]);
    if (section.checkpoint_quiz) list.push(STEP_LABELS[3]);
    // Ensure at least one step
    return list.length ? list : [STEP_LABELS[0]];
  }, [section, lessonBody]);

  const currentStep = availableSteps[Math.min(stepIdx, availableSteps.length - 1)];
  const isLastStepInLesson = stepIdx >= availableSteps.length - 1;
  const isLastLesson = activeLesson >= total - 1;

  const completedPct = total ? Math.round((done.size / total) * 100) : 0;

  // Quiz must be solved before advancing PAST the check step.
  const canAdvance =
    currentStep.id !== "check" || quizSolved;

  // Resolve next lesson index — respects branching `next_choices.leads_to_lesson_id`
  // if the learner has picked a path; otherwise just increments.
  const [pickedBranchIdx, setPickedBranchIdx] = useState<number | null>(null);
  const resolveNextLessonIdx = (): number => {
    if (pickedBranchIdx !== null) {
      const idx = pickedBranchIdx;
      setPickedBranchIdx(null);
      return idx;
    }
    return activeLesson + 1;
  };

  const advanceStep = () => {
    if (!canAdvance) return;
    if (isLastStepInLesson) {
      // If this lesson has branching choices and the learner hasn't picked one yet,
      // gate the advance — they need to choose a path first.
      if (section.next_choices?.choices?.length && pickedBranchIdx === null && !isLastLesson) {
        // Show choices in the UI; advanceStep is a no-op until they pick.
        return;
      }
      // Lesson done
      const next = new Set(done);
      next.add(activeLesson);
      setDone(next);
      if (!guest) save.mutate({ sectionIndex: activeLesson, completedAll: isLastLesson });
      setCelebrate(true);
      window.setTimeout(() => {
        setCelebrate(false);
        if (isLastLesson) {
          setShowSummary(true);
        } else {
          setActiveLesson(resolveNextLessonIdx());
        }
      }, 1100);
    } else {
      setStepIdx(stepIdx + 1);
    }
  };

  // Find an index by lesson id (used by branching)
  const findLessonIdxById = (id: string): number => {
    const i = sections.findIndex((s) => s.id === id);
    return i >= 0 ? i : activeLesson + 1;
  };

  const goPrev = () => {
    if (stepIdx > 0) setStepIdx(stepIdx - 1);
    else if (activeLesson > 0) setActiveLesson(activeLesson - 1);
  };

  const onQuizAnswered = (correct: boolean) => {
    if (correct) {
      setQuizSolved(true);
    } else {
      setHearts((h) => Math.max(0, h - 1));
    }
  };

  const onHeartsZero = () => {
    // Reset the lesson
    setStepIdx(0);
    setHearts(MAX_HEARTS);
    setQuizSolved(false);
    setPracticeText(section?.practice_task?.starter_prompt_or_code ?? "");
    toast.error("Out of hearts. Restarting the lesson.", { icon: "💔" });
  };

  // Trigger reset when hearts hit zero
  useEffect(() => {
    if (hearts === 0) onHeartsZero();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hearts]);

  // Course complete screen
  if (showSummary) {
    return (
      <CompletionScreen
        title={extra?.final_outcome ?? "You finished the course"}
        objectives={extra?.learning_objectives}
        lessonCount={total}
        guest={guest}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Status band — progress + hearts. Frames the whole player at any width
          and gives mobile users their bearings without the desktop sidebar. */}
      <div className="rounded-2xl border border-border bg-card/70 px-5 py-4 shadow-soft backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white shadow-glow">
            <BookOpen className="h-3.5 w-3.5" /> Lesson {activeLesson + 1} of {total}
          </span>
          <div className="flex items-center gap-4">
            <span className="text-[12.5px] font-semibold text-muted-foreground">
              <span className="text-foreground">{completedPct}%</span> complete
            </span>
            <HeartsRow hearts={hearts} />
          </div>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400 transition-all duration-500"
            style={{ width: `${completedPct}%` }}
          />
        </div>
      </div>

      {/* Lesson rail (desktop) + active lesson */}
      <div className="grid gap-8 lg:grid-cols-[290px_minmax(0,1fr)]">
        <CourseSidebar
          className="hidden lg:block"
          sections={sections}
          active={activeLesson}
          done={done}
          finalOutcome={extra?.final_outcome}
          objectives={extra?.learning_objectives}
          prereqs={extra?.prerequisites}
          onPick={setActiveLesson}
        />

        {/* Main lesson area */}
        <section className="relative min-w-0">
          {/* Within-lesson step bar */}
          <StepBar steps={availableSteps} active={stepIdx} />

        {/* Lesson title — only on first step so it doesn't repeat */}
        {stepIdx === 0 && (
          <>
            <h2 className="font-display mt-8 text-balance text-[2rem] font-bold leading-[1.05] tracking-[-0.02em] md:text-[2.5rem]">
              {section.title}
            </h2>
            {section.objective && (
              <p className="font-display mt-5 border-l-2 border-cyan-500/60 pl-5 text-[1.15rem] italic leading-[1.55] text-foreground/80">
                {section.objective}
              </p>
            )}
          </>
        )}

        {/* Step body */}
        <div className="mt-10 min-h-[260px]">
          {currentStep.id === "read" && (
            <ReadStep
              lesson={lessonBody}
              introHook={section.intro_hook}
              keyTakeaways={section.key_takeaways}
            />
          )}
          {currentStep.id === "example" && (
            <ExampleStep
              example={section.example}
              walkthrough={section.walkthrough_steps}
            />
          )}
          {currentStep.id === "practice" && section.practice_task && (
            <PracticeStep
              task={section.practice_task}
              value={practiceText}
              onChange={setPracticeText}
            />
          )}
          {currentStep.id === "check" && section.checkpoint_quiz && (
            <CheckStep
              quiz={section.checkpoint_quiz}
              solved={quizSolved}
              hearts={hearts}
              onAnswered={onQuizAnswered}
            />
          )}
        </div>

        {/* Common mistakes / recap / next step — only visible on last step */}
        {stepIdx === availableSteps.length - 1 && (
          <div className="mt-10 grid gap-6 border-t border-border pt-6 sm:grid-cols-2">
            {Array.isArray(section.common_mistakes) && section.common_mistakes.length > 0 && (
              <div>
                <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-amber-700">Common mistakes</p>
                <ul className="mt-2 space-y-1.5">
                  {section.common_mistakes.map((m, i) => (
                    <li key={i} className="flex gap-2 text-[14px] leading-relaxed text-foreground/85">
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {section.recap && (
              <div>
                <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-muted-foreground">Recap</p>
                <p className="mt-2 text-[14px] leading-relaxed text-foreground/85">{section.recap}</p>
              </div>
            )}
          </div>
        )}

        {/* Branching picker — only appears at the last step when this lesson
            has next_choices and learner hasn't picked yet */}
        {section.next_choices?.choices?.length && isLastStepInLesson && quizSolved && !isLastLesson && pickedBranchIdx === null && (
          <div className="mt-10 rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/[0.06] via-card to-fuchsia-500/[0.04] p-6 shadow-soft">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-indigo-700 dark:text-indigo-300">
              Choose your path
            </p>
            <h3 className="font-display mt-2 text-[1.25rem] font-bold leading-snug tracking-tight">
              {section.next_choices.prompt}
            </h3>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {section.next_choices.choices.map((c, i) => (
                <button
                  key={i}
                  onClick={() => setPickedBranchIdx(findLessonIdxById(c.leads_to_lesson_id))}
                  className="group rounded-xl border-2 border-border bg-card px-5 py-4 text-left transition-all hover:-translate-y-0.5 hover:border-indigo-500/60 hover:shadow-elevated"
                >
                  <p className="font-display text-[1rem] font-bold leading-snug">{c.label}</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-600 opacity-0 transition-opacity group-hover:opacity-100 dark:text-indigo-300">
                    Take this path <ChevronRight className="h-3 w-3" />
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-12 flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={goPrev} disabled={stepIdx === 0 && activeLesson === 0}>
            <ChevronLeft className="mr-1.5 h-4 w-4" /> Previous
          </Button>

          {currentStep.id === "check" && !quizSolved ? (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 px-4 py-2 text-[13px] text-amber-800">
              <span className="font-bold">Answer the check correctly</span> to continue.
            </div>
          ) : section.next_choices?.choices?.length && isLastStepInLesson && pickedBranchIdx === null && !isLastLesson ? (
            <div className="rounded-xl border border-indigo-500/40 bg-indigo-500/5 px-4 py-2 text-[13px] text-indigo-700 dark:text-indigo-300">
              <span className="font-bold">Pick a path above</span> to continue.
            </div>
          ) : (
            <Button
              onClick={advanceStep}
              disabled={!canAdvance || celebrate}
              className="bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-glow hover:opacity-95"
            >
              {isLastStepInLesson && isLastLesson ? (
                <>Finish course <Trophy className="ml-1.5 h-4 w-4" /></>
              ) : isLastStepInLesson ? (
                <>Next lesson <ChevronRight className="ml-1.5 h-4 w-4" /></>
              ) : (
                <>Continue <ChevronRight className="ml-1.5 h-4 w-4" /></>
              )}
            </Button>
          )}
        </div>

        {/* Celebration overlay */}
        {celebrate && <CelebrationOverlay />}
        </section>
      </div>
    </div>
  );
}

/* ===================================================================== */
/* SIDEBAR                                                                 */
/* ===================================================================== */

function CourseSidebar({
  className = "", sections, active, done, finalOutcome, objectives, prereqs, onPick,
}: {
  className?: string;
  sections: Section[];
  active: number;
  done: Set<number>;
  finalOutcome?: string;
  objectives?: string[];
  prereqs?: string[];
  onPick: (i: number) => void;
}) {
  return (
    <aside className={`relative ${className}`}>
      <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-soft">
        {/* Lesson path — the primary navigation, leads the sidebar */}
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Lessons</p>
        <ol className="mt-3 space-y-0.5">
          {sections.map((s, i) => {
            const isDone = done.has(i);
            const isActive = i === active;
            return (
              <li key={i}>
                <button
                  onClick={() => onPick(i)}
                  className={`group flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-500/12 to-cyan-500/8 font-semibold text-foreground ring-1 ring-indigo-500/20"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  ) : (
                    <span className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full text-[9px] font-bold ${
                      isActive
                        ? "bg-gradient-to-br from-indigo-500 to-cyan-400 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {i + 1}
                    </span>
                  )}
                  <span className="line-clamp-2 leading-snug">{s.title}</span>
                </button>
              </li>
            );
          })}
        </ol>

        {finalOutcome && (
          <div className="mt-6 border-t border-border/70 pt-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">By the end</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-foreground/85">{finalOutcome}</p>
          </div>
        )}

        {Array.isArray(objectives) && objectives.length > 0 && (
          <div className="mt-5 border-t border-border/70 pt-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">You'll learn</p>
            <ul className="mt-2 space-y-1.5">
              {objectives.map((it, i) => (
                <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-foreground/85">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {Array.isArray(prereqs) && prereqs.length > 0 && (
          <div className="mt-5 border-t border-border/70 pt-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Prereqs</p>
            <ul className="mt-2 space-y-1 text-[12.5px] text-muted-foreground">
              {prereqs.map((p, i) => <li key={i}>· {p}</li>)}
            </ul>
          </div>
        )}
      </div>
    </aside>
  );
}

/* ===================================================================== */
/* STEP UI                                                                 */
/* ===================================================================== */

function StepBar({
  steps, active,
}: { steps: typeof STEP_LABELS; active: number }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {steps.map((s, i) => {
        const isActive = i === active;
        const isPast = i < active;
        const Icon = s.icon;
        return (
          <div
            key={s.id}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] transition-all ${
              isActive
                ? "bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-glow"
                : isPast
                  ? "bg-emerald-500/15 text-emerald-700"
                  : "border border-border bg-card text-muted-foreground"
            }`}
          >
            {isPast ? <CheckCircle2 className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
            {s.label}
          </div>
        );
      })}
    </div>
  );
}

function HeartsRow({ hearts }: { hearts: number }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1 shadow-soft">
      {Array.from({ length: MAX_HEARTS }).map((_, i) => (
        <Heart
          key={i}
          className={`h-4 w-4 transition-all ${
            i < hearts ? "fill-rose-500 text-rose-500" : "text-muted-foreground/40"
          }`}
        />
      ))}
    </div>
  );
}

function ReadStep({
  lesson, introHook, keyTakeaways,
}: { lesson: string; introHook?: string; keyTakeaways?: string[] }) {
  // Split the lesson body on `## ` sub-headings (new article-grade format).
  // First slice is the intro paragraph(s) before any sub-heading.
  const chunks = lesson.split(/\n##\s+/g);
  const intro = chunks[0];
  const subSections = chunks.slice(1).map((chunk) => {
    const newlineIdx = chunk.indexOf("\n");
    if (newlineIdx === -1) return { heading: chunk.trim(), body: "" };
    return {
      heading: chunk.slice(0, newlineIdx).trim(),
      body: chunk.slice(newlineIdx + 1).trim(),
    };
  });

  return (
    <article className="space-y-8">
      <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
        <Lightbulb className="mr-1.5 inline h-3 w-3" /> Concept
      </p>

      {/* Intro hook — drop cap on first letter, magazine-style */}
      {introHook && (
        <p className="text-[1.18rem] leading-[1.85] text-foreground/90 first-letter:font-display first-letter:text-[3.5rem] first-letter:font-bold first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:leading-[0.85] first-letter:text-indigo-600 dark:first-letter:text-indigo-400">
          {introHook}
        </p>
      )}

      {/* Body intro (text before any ## subheading) */}
      {intro && (
        <p className="whitespace-pre-wrap text-[1.05rem] leading-[1.75] text-foreground/90">
          {intro}
        </p>
      )}

      {/* Sub-sections (parsed from ## markers in the article string) */}
      {subSections.length > 0 && (
        <div className="space-y-7">
          {subSections.map((s, i) => (
            <section key={i}>
              <h3 className="font-display text-[1.35rem] font-bold leading-snug tracking-tight md:text-[1.5rem]">
                {s.heading}
              </h3>
              {s.body && (
                <p className="mt-3 whitespace-pre-wrap text-[1.05rem] leading-[1.75] text-foreground/85">
                  {s.body}
                </p>
              )}
            </section>
          ))}
        </div>
      )}

      {/* Key takeaways block — the standout summary */}
      {Array.isArray(keyTakeaways) && keyTakeaways.length > 0 && (
        <aside className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/[0.04] via-card to-violet-500/[0.04] p-6 shadow-soft">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-indigo-700 dark:text-indigo-300">
            Key takeaways
          </p>
          <ul className="mt-4 space-y-3">
            {keyTakeaways.map((t, i) => (
              <li key={i} className="flex gap-3">
                <span className="font-display grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-700 text-[12px] font-bold text-white shadow-md">
                  {i + 1}
                </span>
                <span className="pt-0.5 text-[15.5px] font-semibold leading-[1.5] text-foreground">{t}</span>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </article>
  );
}

function ExampleStep({
  example, walkthrough,
}: { example?: string; walkthrough?: string[] }) {
  return (
    <article className="space-y-7">
      <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
        <Eye className="mr-1.5 inline h-3 w-3" /> Example
      </p>
      {example && (
        <figure className="relative">
          <span
            className="font-display absolute -left-1 -top-5 select-none text-[6rem] leading-none text-fuchsia-500/25"
            aria-hidden
          >
            &ldquo;
          </span>
          <blockquote className="font-display relative pl-7 text-[1.15rem] italic leading-[1.55] text-foreground/85">
            {example}
          </blockquote>
        </figure>
      )}
      {Array.isArray(walkthrough) && walkthrough.length > 0 && (
        <div>
          <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-muted-foreground">Walkthrough</p>
          <ol className="mt-3 space-y-2.5">
            {walkthrough.map((s, i) => (
              <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-foreground/85">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 text-[11px] font-bold text-white">
                  {i + 1}
                </span>
                <span className="pt-0.5">{s}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </article>
  );
}

function PracticeStep({
  task, value, onChange,
}: {
  task: NonNullable<Section["practice_task"]>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <article className="space-y-5">
      <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
        <Rocket className="mr-1.5 inline h-3 w-3" /> Practice
      </p>
      <h3 className="font-display text-[1.4rem] font-bold leading-tight tracking-tight">{task.title}</h3>
      {task.instructions && (
        <p className="text-[15px] leading-[1.7] text-foreground/85">{task.instructions}</p>
      )}

      {/* Editable workspace */}
      <div className="rounded-2xl border border-border bg-card shadow-soft">
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2.5">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            <Code2 className="mr-1.5 inline h-3 w-3" /> Your workspace
          </p>
          <span className="text-[11px] text-muted-foreground">{value.length} chars</span>
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          className="w-full resize-none bg-transparent p-4 font-mono text-[13.5px] leading-relaxed text-foreground/90 outline-none placeholder:text-muted-foreground"
          rows={Math.min(14, Math.max(6, Math.ceil(value.length / 70)))}
          placeholder="Type your attempt here…"
        />
      </div>

      {Array.isArray(task.success_criteria) && task.success_criteria.length > 0 && (
        <div className="rounded-xl border-l-2 border-emerald-500/60 bg-emerald-500/5 px-4 py-3">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-emerald-700">You succeed when</p>
          <ul className="mt-2 space-y-1">
            {task.success_criteria.map((c, i) => (
              <li key={i} className="flex gap-2 text-[13.5px] text-foreground/80">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-[12px] italic text-muted-foreground">
        This is your workspace — try it locally, then continue when you've practiced.
      </p>
    </article>
  );
}

function CheckStep({
  quiz, solved, hearts, onAnswered,
}: {
  quiz: NonNullable<Section["checkpoint_quiz"]>;
  solved: boolean;
  hearts: number;
  onAnswered: (correct: boolean) => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  const choose = (opt: string) => {
    if (locked || solved) return;
    setPicked(opt);
    setLocked(true);
    const correct = opt === quiz.correct_answer;
    onAnswered(correct);
    if (!correct) {
      // Allow another pick after a beat
      window.setTimeout(() => {
        setPicked(null);
        setLocked(false);
      }, 1500);
    }
  };

  return (
    <article className="space-y-5">
      <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
        <ListChecks className="mr-1.5 inline h-3 w-3" /> Check what you learned
      </p>
      <h3 className="font-display text-[1.45rem] font-bold leading-snug tracking-tight">{quiz.question}</h3>

      <div className="space-y-2.5">
        {quiz.options.map((opt, i) => {
          const isPicked = picked === opt;
          const isAnswer = opt === quiz.correct_answer;
          const showFeedback = solved || (picked !== null && isPicked);
          const stateCls = !showFeedback
            ? "border-border bg-background hover:border-foreground/30 hover:bg-muted/30 cursor-pointer"
            : isAnswer
              ? "border-emerald-500/60 bg-emerald-500/8"
              : isPicked
                ? "border-rose-500/60 bg-rose-500/8 animate-shake"
                : "border-border bg-background opacity-50";
          return (
            <button
              key={i}
              onClick={() => choose(opt)}
              disabled={solved || locked}
              className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-[15px] font-medium transition-all duration-200 ${stateCls}`}
            >
              <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-extrabold transition-colors ${
                !showFeedback ? "bg-muted text-foreground/70" :
                isAnswer ? "bg-emerald-500 text-white" :
                isPicked ? "bg-rose-500 text-white" : "bg-muted text-muted-foreground"
              }`}>
                {String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1">{opt}</span>
              {solved && isAnswer && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
              {!solved && isPicked && !isAnswer && <XCircle className="h-5 w-5 text-rose-600" />}
            </button>
          );
        })}
      </div>

      {solved && quiz.explanation && (
        <div className="rounded-xl border-l-2 border-emerald-500 bg-emerald-500/5 px-4 py-3 text-[14px] leading-relaxed">
          <span className="font-bold text-emerald-700">Correct. </span>
          {quiz.explanation}
        </div>
      )}
      {!solved && picked != null && hearts > 0 && (
        <div className="rounded-xl border-l-2 border-rose-500 bg-rose-500/5 px-4 py-3 text-[14px] leading-relaxed">
          <span className="font-bold text-rose-700">Not quite. </span>
          Lost a <Heart className="inline h-3.5 w-3.5 fill-rose-500 text-rose-500" />. Try again.
        </div>
      )}
    </article>
  );
}

/* ===================================================================== */
/* CELEBRATION + COMPLETION                                                 */
/* ===================================================================== */

function CelebrationOverlay() {
  // CSS-only sparkle ring, fades in/out. No external lib.
  return (
    <div className="pointer-events-none fixed inset-0 z-30 grid place-items-center">
      <div className="relative">
        <div className="absolute inset-0 -m-12 animate-ping rounded-full bg-emerald-400/30 blur-2xl" />
        <div className="relative grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-[0_30px_60px_-15px_rgba(16,185,129,0.6)]">
          <Sparkles className="h-10 w-10 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function CompletionScreen({
  title, objectives, lessonCount, guest = false,
}: { title: string; objectives?: string[]; lessonCount: number; guest?: boolean }) {
  return (
    <div className="mx-auto max-w-2xl pb-20">
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/8 via-teal-500/5 to-card p-10 text-center shadow-soft md:p-14">
        <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-emerald-500/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-44 w-44 rounded-full bg-cyan-500/20 blur-3xl" />

        <div className="relative">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-glow">
            <Trophy className="h-10 w-10" />
          </div>
          <p className="mt-6 text-[10.5px] font-bold uppercase tracking-[0.28em] text-emerald-700">Course complete</p>
          <h2 className="font-display mt-3 text-balance text-3xl font-bold leading-tight tracking-tight md:text-4xl">{title}</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            You completed all <strong className="text-foreground">{lessonCount}</strong> lessons. Skill unlocked.
          </p>

          {Array.isArray(objectives) && objectives.length > 0 && (
            <div className="mt-8 text-left">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-muted-foreground">What you can now do</p>
              <ul className="mt-3 space-y-2">
                {objectives.map((it, i) => (
                  <li key={i} className="flex gap-2 text-[14.5px] leading-relaxed text-foreground/85">
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {guest ? (
            <>
              <p className="mt-8 text-[14px] leading-relaxed text-muted-foreground">
                Nice work! Create a free account to <strong className="text-foreground">save your progress</strong>, earn XP, and unlock the full library — no card needed.
              </p>
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-glow">
                  <Link to="/signup">Create free account <Sparkles className="ml-1.5 h-4 w-4" /></Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/library">Browse the library</Link>
                </Button>
              </div>
            </>
          ) : (
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-glow">
                <Link to="/dashboard/courses">
                  Browse more courses <RotateCcw className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/dashboard">Back to dashboard</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
