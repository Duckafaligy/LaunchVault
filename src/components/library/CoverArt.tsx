import {
  Layers,
  MessageSquareCode,
  GraduationCap,
  Sparkles,
  Code2,
  PenLine,
  BookOpen,
  Workflow,
  Bot,
  Briefcase,
  Lightbulb,
  Wrench,
  ScrollText,
  Target,
  FileText,
  type LucideIcon,
} from "lucide-react";

// =====================================================================
// CoverArt — aesthetic, real-world-inspired covers for every CMS item.
//
// Each of the 10 LaunchVault content types gets its own visual identity:
// a curated gradient family, a primary glyph, a background motif, and an
// accent shape. Inspiration: Linear (mesh gradients), Stripe (depth +
// glow), Vercel (precise geometry), Apple Intelligence (iridescent),
// Notion (clean tags), Raycast (rounded chips).
// =====================================================================

type TypeStyle = {
  label: string;
  icon: LucideIcon;
  motif: LucideIcon;
  gradients: string[]; // tailwind gradient suffixes
  /** decorative pattern: 'dots' | 'grid' | 'rings' | 'mesh' | 'lines' */
  pattern: "dots" | "grid" | "rings" | "mesh" | "lines";
};

const STYLES: Record<string, TypeStyle> = {
  template: {
    label: "Template",
    icon: Layers,
    motif: Code2,
    gradients: [
      "from-violet-600 via-indigo-500 to-blue-500",
      "from-fuchsia-500 via-purple-500 to-indigo-600",
      "from-blue-600 via-violet-500 to-fuchsia-500",
    ],
    pattern: "grid",
  },
  prompt: {
    label: "Prompt",
    icon: MessageSquareCode,
    motif: PenLine,
    gradients: [
      "from-emerald-500 via-teal-500 to-cyan-500",
      "from-teal-500 via-emerald-500 to-lime-400",
      "from-cyan-500 via-sky-500 to-indigo-500",
    ],
    pattern: "dots",
  },
  course: {
    label: "Course",
    icon: GraduationCap,
    motif: BookOpen,
    gradients: [
      "from-orange-500 via-amber-500 to-yellow-400",
      "from-rose-500 via-orange-500 to-amber-400",
      "from-amber-500 via-orange-500 to-red-500",
    ],
    pattern: "rings",
  },
  workflow: {
    label: "Workflow",
    icon: Workflow,
    motif: Workflow,
    gradients: [
      "from-sky-500 via-blue-600 to-indigo-700",
      "from-blue-500 via-indigo-600 to-violet-700",
      "from-cyan-500 via-blue-600 to-violet-600",
    ],
    pattern: "lines",
  },
  agent: {
    label: "Agent",
    icon: Bot,
    motif: Bot,
    gradients: [
      "from-slate-800 via-purple-700 to-fuchsia-600",
      "from-zinc-900 via-indigo-700 to-violet-500",
      "from-neutral-900 via-violet-700 to-pink-500",
    ],
    pattern: "mesh",
  },
  business_lesson: {
    label: "Business",
    icon: Briefcase,
    motif: Briefcase,
    gradients: [
      "from-emerald-700 via-emerald-500 to-teal-400",
      "from-green-700 via-emerald-600 to-cyan-500",
      "from-teal-700 via-emerald-500 to-lime-400",
    ],
    pattern: "grid",
  },
  insight: {
    label: "Insight",
    icon: Lightbulb,
    motif: Sparkles,
    gradients: [
      "from-yellow-400 via-amber-500 to-orange-500",
      "from-amber-300 via-yellow-500 to-orange-600",
      "from-lime-400 via-yellow-400 to-amber-500",
    ],
    pattern: "rings",
  },
  tool_guide: {
    label: "Tool Guide",
    icon: Wrench,
    motif: Wrench,
    gradients: [
      "from-slate-600 via-slate-700 to-zinc-900",
      "from-zinc-600 via-slate-700 to-neutral-900",
      "from-stone-600 via-zinc-700 to-slate-900",
    ],
    pattern: "lines",
  },
  playbook: {
    label: "Playbook",
    icon: ScrollText,
    motif: FileText,
    gradients: [
      "from-rose-600 via-pink-600 to-fuchsia-600",
      "from-pink-600 via-rose-500 to-orange-500",
      "from-fuchsia-600 via-pink-500 to-rose-400",
    ],
    pattern: "mesh",
  },
  challenge: {
    label: "Challenge",
    icon: Target,
    motif: Target,
    gradients: [
      "from-red-600 via-rose-600 to-pink-600",
      "from-orange-600 via-red-600 to-rose-700",
      "from-rose-600 via-red-500 to-amber-500",
    ],
    pattern: "rings",
  },
  cheatsheet: {
    label: "Cheatsheet",
    icon: FileText,
    motif: ScrollText,
    gradients: [
      "from-indigo-500 via-blue-500 to-cyan-400",
      "from-violet-500 via-indigo-500 to-sky-400",
      "from-blue-500 via-cyan-500 to-teal-400",
    ],
    pattern: "grid",
  },
};

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function Pattern({ kind }: { kind: TypeStyle["pattern"] }) {
  if (kind === "dots") {
    return (
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)",
          backgroundSize: "14px 14px",
        }}
      />
    );
  }
  if (kind === "grid") {
    return (
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
    );
  }
  if (kind === "rings") {
    return (
      <>
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full border border-white/25" />
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full border border-white/30" />
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full border border-white/40" />
      </>
    );
  }
  if (kind === "mesh") {
    return (
      <>
        <div className="absolute -left-10 top-1/3 h-40 w-40 rounded-full bg-white/30 blur-3xl" />
        <div className="absolute -bottom-10 right-1/4 h-44 w-44 rounded-full bg-black/25 blur-3xl" />
        <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-white/20 blur-2xl" />
      </>
    );
  }
  // lines
  return (
    <div
      className="absolute inset-0 opacity-20"
      style={{
        backgroundImage:
          "repeating-linear-gradient(45deg, rgba(255,255,255,0.5) 0 1px, transparent 1px 12px)",
      }}
    />
  );
}

export function CoverArt({
  id,
  type,
  category,
  title,
}: {
  id: string;
  type: string;
  category?: string;
  title: string;
}) {
  const style = STYLES[type] ?? STYLES.template;
  const Icon = style.icon;
  const Motif = style.motif;
  const gradient = style.gradients[hash(id) % style.gradients.length];
  const initials =
    title
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "LV";

  return (
    <div
      className={`relative h-full w-full overflow-hidden bg-gradient-to-br ${gradient}`}
    >
      {/* ambient glow */}
      <div className="absolute -left-8 -top-8 h-32 w-32 rounded-full bg-white/25 blur-2xl" />
      <div className="absolute -bottom-12 -right-8 h-40 w-40 rounded-full bg-black/25 blur-2xl" />

      <Pattern kind={style.pattern} />

      {/* oversized motif */}
      <Motif
        className="absolute -bottom-8 -right-6 h-48 w-48 text-white/10"
        strokeWidth={1.25}
      />

      {/* foreground */}
      <div className="absolute inset-0 flex flex-col items-start justify-between p-4">
        <div className="flex w-full items-start justify-between">
          <div className="flex items-center gap-2 rounded-full bg-white/20 px-2.5 py-1 backdrop-blur-md ring-1 ring-white/30">
            <Icon className="h-3.5 w-3.5 text-white" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white">
              {style.label}
            </span>
          </div>
          {category && (
            <span className="rounded-md bg-black/35 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white backdrop-blur-md">
              {category}
            </span>
          )}
        </div>

        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/25 backdrop-blur-md ring-1 ring-white/30 shadow-lg">
          <span className="text-xl font-black tracking-tight text-white drop-shadow">
            {initials}
          </span>
        </div>
      </div>

      {/* subtle top sheen */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent" />
    </div>
  );
}
