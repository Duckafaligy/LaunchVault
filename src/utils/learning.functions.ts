// =====================================================================
// Learning loop — server functions for onboarding, personalized feed,
// course progress, streaks, and XP.
// =====================================================================
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// ---------- Schemas ----------
const SKILL_LEVELS = ["beginner", "intermediate", "advanced"] as const;
const TONES = ["practical", "deep", "playful", "concise"] as const;
const GOALS = [
  "individual",
  "business_owner",
  "student",
  "creator",
  "developer",
] as const;
const FOCUS_AREAS = [
  "prompting",
  "ai_fundamentals",
  "agents",
  "workflows",
  "business",
  "marketing",
  "coding",
  "writing",
  "design",
  "research",
] as const;

const PreferencesSchema = z.object({
  skill_level: z.enum(SKILL_LEVELS),
  primary_goal: z.enum(GOALS),
  focus_areas: z.array(z.enum(FOCUS_AREAS)).min(1).max(6),
  tone_preference: z.enum(TONES),
  daily_time_minutes: z.number().int().min(5).max(120),
});

export type PreferencesInput = z.infer<typeof PreferencesSchema>;

// ---------- Get onboarding state ----------
export const getOnboardingState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data, error } = await supabaseAdmin
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return {
      prefs: data,
      completed: !!data?.completed_onboarding,
    };
  });

// ---------- Save preferences (completes onboarding) ----------
export const savePreferences = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => PreferencesSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const row = {
      user_id: userId,
      skill_level: data.skill_level,
      primary_goal: data.primary_goal,
      focus_areas: data.focus_areas,
      tone_preference: data.tone_preference,
      daily_time_minutes: data.daily_time_minutes,
      completed_onboarding: true,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabaseAdmin
      .from("user_preferences")
      .upsert(row, { onConflict: "user_id" });
    if (error) throw error;
    return { ok: true };
  });

// ---------- Personalized daily feed ----------
type FeedItem = {
  id: string;
  type: string;
  title: string;
  description: string;
  category: string;
  tier_required: string;
  estimated_minutes: number | null;
  difficulty: string | null;
  is_featured: boolean;
  score: number;
  reason: string;
};

export const getPersonalizedFeed = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ items: FeedItem[]; hasPrefs: boolean }> => {
    const { userId } = context;

    const [{ data: prefs }, { data: profile }, { data: items }] = await Promise.all([
      supabaseAdmin
        .from("user_preferences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(),
      supabaseAdmin
        .from("profiles")
        .select("subscription_tier")
        .eq("id", userId)
        .maybeSingle(),
      supabaseAdmin
        .from("content_items")
        .select(
          "id, type, title, description, category, tier_required, estimated_minutes, difficulty, is_featured, tags",
        )
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(80),
    ]);

    const tierRank: Record<string, number> = {
      free: 0, tier1: 1, tier2: 2, tier3: 3, tier4: 4,
    };
    const userTier = tierRank[profile?.subscription_tier ?? "free"] ?? 0;

    // Items the user has already interacted with — deprioritize repeats
    const { data: seen } = await supabaseAdmin
      .from("content_interactions")
      .select("content_id")
      .eq("user_id", userId)
      .in("interaction_type", ["view", "complete"]);
    const seenIds = new Set((seen ?? []).map((s) => s.content_id));

    const focus = (prefs?.focus_areas ?? []) as string[];
    const goal = prefs?.primary_goal ?? null;
    const skill = prefs?.skill_level ?? "beginner";
    const time = prefs?.daily_time_minutes ?? 15;

    const scored: FeedItem[] = (items ?? []).map((it) => {
      let score = 0;
      const reasons: string[] = [];

      // Tier fit — slight boost when item is within reach
      const itemTier = tierRank[it.tier_required ?? "free"] ?? 0;
      if (itemTier <= userTier) score += 4;
      else score -= (itemTier - userTier) * 1.5;

      // Focus area match (tags overlap)
      const tags: string[] = (it.tags as string[]) ?? [];
      const matches = tags.filter((t) =>
        focus.some((f) => t.toLowerCase().includes(f.toLowerCase())),
      ).length;
      if (matches > 0) {
        score += matches * 3;
        reasons.push("matches your focus");
      }

      // Goal-driven type weighting
      if (goal === "business_owner" && ["business_lesson", "playbook", "workflow"].includes(it.type)) {
        score += 4; reasons.push("for business owners");
      }
      if (goal === "student" && ["course", "cheatsheet", "challenge"].includes(it.type)) {
        score += 4; reasons.push("for students");
      }
      if (goal === "developer" && ["template", "agent", "tool_guide"].includes(it.type)) {
        score += 4; reasons.push("for developers");
      }
      if (goal === "creator" && ["prompt", "template", "insight"].includes(it.type)) {
        score += 3; reasons.push("for creators");
      }
      if (goal === "individual" && ["insight", "cheatsheet", "tool_guide"].includes(it.type)) {
        score += 2; reasons.push("easy wins");
      }

      // Skill match via difficulty
      if (it.difficulty === skill) {
        score += 2; reasons.push(`${skill} level`);
      } else if (skill === "beginner" && it.difficulty === "intermediate") {
        score -= 1;
      } else if (skill === "advanced" && it.difficulty === "beginner") {
        score -= 1;
      }

      // Time budget
      if (it.estimated_minutes && it.estimated_minutes <= time + 5) {
        score += 1;
      }

      // Freshness + featured
      if (it.is_featured) score += 2;

      // Deprioritize already-seen
      if (seenIds.has(it.id)) score -= 6;

      return {
        id: it.id,
        type: it.type,
        title: it.title,
        description: it.description,
        category: it.category,
        tier_required: it.tier_required,
        estimated_minutes: it.estimated_minutes ?? null,
        difficulty: it.difficulty ?? null,
        is_featured: it.is_featured,
        score,
        reason: reasons[0] ?? (it.is_featured ? "featured" : "fresh drop"),
      };
    });

    scored.sort((a, b) => b.score - a.score);

    return {
      items: scored.slice(0, 12),
      hasPrefs: !!prefs?.completed_onboarding,
    };
  });

// ---------- Record course section progress ----------
const ProgressSchema = z.object({
  contentId: z.string().min(1),
  sectionIndex: z.number().int().min(0),
  totalSections: z.number().int().min(1).max(200),
  completedAll: z.boolean().optional(),
});

export const recordSectionProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => ProgressSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const now = new Date().toISOString();

    // Fetch existing row (if any) to merge completed_sections
    const { data: existing } = await supabaseAdmin
      .from("course_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("content_id", data.contentId)
      .maybeSingle();

    const completedSet = new Set<number>(
      Array.isArray(existing?.completed_sections)
        ? (existing!.completed_sections as number[])
        : [],
    );
    completedSet.add(data.sectionIndex);
    const completed = Array.from(completedSet).sort((a, b) => a - b);
    const isCompleted = data.completedAll || completed.length >= data.totalSections;
    const wasAlreadyCompleted = !!existing?.is_completed;

    const row = {
      user_id: userId,
      content_id: data.contentId,
      current_section: Math.min(data.sectionIndex + 1, data.totalSections - 1),
      total_sections: data.totalSections,
      completed_sections: completed,
      is_completed: isCompleted,
      completed_at: isCompleted && !wasAlreadyCompleted ? now : existing?.completed_at ?? null,
      last_opened_at: now,
      updated_at: now,
    };

    const { error } = await supabaseAdmin
      .from("course_progress")
      .upsert(row, { onConflict: "user_id,content_id" });
    if (error) throw error;

    // Streak + XP rewards
    const xpForSection = 10;
    const xpForCompletion = 50;
    let awardedXp = 0;

    // Tick streak on any progress event
    await supabaseAdmin.rpc("tick_streak", { _user_id: userId });

    // Award XP for the section (only once per section)
    const wasNewSection = !(
      Array.isArray(existing?.completed_sections) &&
      (existing!.completed_sections as number[]).includes(data.sectionIndex)
    );
    if (wasNewSection) {
      const { data: newXp } = await supabaseAdmin.rpc("award_xp", {
        _user_id: userId,
        _amount: xpForSection,
      });
      awardedXp += xpForSection;
      void newXp;
    }
    if (isCompleted && !wasAlreadyCompleted) {
      await supabaseAdmin.rpc("award_xp", {
        _user_id: userId,
        _amount: xpForCompletion,
      });
      awardedXp += xpForCompletion;

      // Log a "complete" interaction so the feed deprioritizes it
      await supabaseAdmin.from("content_interactions").insert({
        user_id: userId,
        content_id: data.contentId,
        interaction_type: "complete",
      });
    }

    return { ok: true, awardedXp, isCompleted };
  });

// ---------- Daily activity ping (called from dashboard load) ----------
export const pingActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data } = await supabaseAdmin.rpc("tick_streak", { _user_id: userId });
    return data as { ok: boolean; current_streak: number; longest_streak: number; changed: boolean } | null;
  });

// ---------- Dashboard overview: skill map + daily quest + badges ----------
export type SkillNode = {
  key: string;
  label: string;
  tagline: string;
  color: string;
  iconKey: string;
  total: number;
  completed: number;
  inProgress: number;
  pct: number;
  locked: boolean;
  nextItem: {
    id: string;
    title: string;
    type: string;
    estimated_minutes: number | null;
    tier_required: string;
  } | null;
};

export type BadgeAward = {
  key: string;
  label: string;
  description: string;
  iconKey: string;
  earned: boolean;
  progress: number; // 0-100
};

export type DashboardOverview = {
  dailyQuest: {
    id: string;
    title: string;
    description: string;
    type: string;
    estimated_minutes: number | null;
    tier_required: string;
    xp_reward: number;
    reason: string;
  } | null;
  skills: SkillNode[];
  badges: BadgeAward[];
  inProgress: Array<{
    id: string;
    title: string;
    type: string;
    pct: number;
    doneCount: number;
    total: number;
  }>;
};

const SKILL_DEFINITIONS: Array<{
  key: string;
  label: string;
  tagline: string;
  iconKey: string;
  color: string;
  match: string[];
  requires?: string; // requires another skill key at >= 30% to unlock
}> = [
  { key: "prompting",       label: "Prompt Craft",     tagline: "The core skill",         iconKey: "MessageSquareCode", color: "from-emerald-500 to-teal-600",   match: ["prompt", "prompting"] },
  { key: "ai_fundamentals", label: "AI Foundations",   tagline: "Know the machine",       iconKey: "Brain",             color: "from-violet-500 to-indigo-600",  match: ["ai", "fundamentals", "model", "llm"] },
  { key: "writing",         label: "Writing with AI",  tagline: "Voice & clarity",        iconKey: "PenLine",           color: "from-blue-500 to-cyan-500",      match: ["writing", "content", "copy"] },
  { key: "marketing",       label: "Marketing",        tagline: "Reach & convert",        iconKey: "Megaphone",         color: "from-pink-500 to-rose-600",      match: ["marketing", "growth", "ads", "seo"], requires: "prompting" },
  { key: "business",        label: "Business",         tagline: "Run the company",        iconKey: "Briefcase",         color: "from-amber-500 to-orange-600",   match: ["business", "ops", "strategy"], requires: "prompting" },
  { key: "workflows",       label: "Workflows",        tagline: "Automate the boring",    iconKey: "Workflow",          color: "from-sky-500 to-indigo-500",     match: ["workflow", "automation", "n8n", "zapier"], requires: "ai_fundamentals" },
  { key: "agents",          label: "Agents",           tagline: "AI that takes action",   iconKey: "Bot",               color: "from-fuchsia-600 to-pink-600",   match: ["agent", "tool-use"], requires: "workflows" },
  { key: "coding",          label: "Coding with AI",   tagline: "Ship faster",            iconKey: "Code2",             color: "from-slate-700 to-zinc-900",     match: ["code", "coding", "dev", "developer"], requires: "ai_fundamentals" },
];

function matchSkill(item: { category?: string | null; tags?: string[] | null; title?: string | null }) {
  const haystack = [
    item.category ?? "",
    ...(item.tags ?? []),
    item.title ?? "",
  ]
    .join(" ")
    .toLowerCase();
  for (const sk of SKILL_DEFINITIONS) {
    if (sk.match.some((m) => haystack.includes(m))) return sk.key;
  }
  return null;
}

export const getDashboardOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DashboardOverview> => {
    const { userId } = context;

    const [{ data: profile }, { data: prefs }, { data: items }, { data: progress }, { data: interactions }] =
      await Promise.all([
        supabaseAdmin.from("profiles").select("subscription_tier, xp_points, current_streak, longest_streak").eq("id", userId).maybeSingle(),
        supabaseAdmin.from("user_preferences").select("*").eq("user_id", userId).maybeSingle(),
        supabaseAdmin
          .from("content_items")
          .select("id, type, title, description, category, tier_required, estimated_minutes, difficulty, is_featured, tags, xp_reward")
          .eq("is_published", true)
          .order("created_at", { ascending: false })
          .limit(200),
        supabaseAdmin.from("course_progress").select("content_id, completed_sections, total_sections, is_completed").eq("user_id", userId),
        supabaseAdmin.from("content_interactions").select("content_id, interaction_type").eq("user_id", userId).in("interaction_type", ["view", "complete"]),
      ]);

    const tierRank: Record<string, number> = { free: 0, tier1: 1, tier2: 2, tier3: 3, tier4: 4 };
    const userTier = tierRank[profile?.subscription_tier ?? "free"] ?? 0;

    const completedIds = new Set<string>();
    const inProgressMap = new Map<string, { done: number; total: number }>();
    (progress ?? []).forEach((p) => {
      const done = Array.isArray(p.completed_sections) ? (p.completed_sections as number[]).length : 0;
      if (p.is_completed) completedIds.add(p.content_id);
      else if (done > 0 && (p.total_sections ?? 0) > 0)
        inProgressMap.set(p.content_id, { done, total: p.total_sections ?? 0 });
    });
    (interactions ?? []).forEach((i) => {
      if (i.interaction_type === "complete") completedIds.add(i.content_id);
    });

    // Bucket items per skill
    const buckets = new Map<string, typeof items>();
    (items ?? []).forEach((it) => {
      const k = matchSkill(it);
      if (!k) return;
      if (!buckets.has(k)) buckets.set(k, []);
      buckets.get(k)!.push(it);
    });

    const skillPct: Record<string, number> = {};
    const skills: SkillNode[] = SKILL_DEFINITIONS.map((sk) => {
      const list = buckets.get(sk.key) ?? [];
      const total = list.length;
      const completed = list.filter((x) => completedIds.has(x.id)).length;
      const inProgress = list.filter((x) => inProgressMap.has(x.id)).length;
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
      skillPct[sk.key] = pct;

      // Next item: first not-completed, prefer tier-accessible
      const next = list
        .filter((x) => !completedIds.has(x.id))
        .sort((a, b) => {
          const aTier = tierRank[a.tier_required ?? "free"] ?? 0;
          const bTier = tierRank[b.tier_required ?? "free"] ?? 0;
          const aAcc = aTier <= userTier ? 0 : 1;
          const bAcc = bTier <= userTier ? 0 : 1;
          if (aAcc !== bAcc) return aAcc - bAcc;
          return (a.estimated_minutes ?? 99) - (b.estimated_minutes ?? 99);
        })[0];

      return {
        key: sk.key,
        label: sk.label,
        tagline: sk.tagline,
        color: sk.color,
        iconKey: sk.iconKey,
        total,
        completed,
        inProgress,
        pct,
        locked: false, // computed below
        nextItem: next
          ? {
              id: next.id,
              title: next.title,
              type: next.type,
              estimated_minutes: next.estimated_minutes ?? null,
              tier_required: next.tier_required,
            }
          : null,
      };
    });

    // Apply skill dependency locks
    skills.forEach((s) => {
      const def = SKILL_DEFINITIONS.find((d) => d.key === s.key)!;
      if (def.requires && (skillPct[def.requires] ?? 0) < 30) {
        s.locked = true;
      }
    });

    // Daily quest: prefer focus-area match + not completed + tier accessible + shortest
    const focus = (prefs?.focus_areas ?? []) as string[];
    const candidates = (items ?? [])
      .filter((it) => !completedIds.has(it.id))
      .filter((it) => (tierRank[it.tier_required ?? "free"] ?? 0) <= userTier)
      .map((it) => {
        const tags: string[] = (it.tags as string[]) ?? [];
        const focusMatch = tags.some((t) => focus.some((f) => t.toLowerCase().includes(f.toLowerCase())));
        const reason = focusMatch
          ? "Matches your focus"
          : it.is_featured
            ? "Featured today"
            : "Fresh drop";
        return { it, score: (focusMatch ? 5 : 0) + (it.is_featured ? 2 : 0) - (it.estimated_minutes ?? 30) / 30, reason };
      })
      .sort((a, b) => b.score - a.score);

    const top = candidates[0];
    const dailyQuest = top
      ? {
          id: top.it.id,
          title: top.it.title,
          description: top.it.description,
          type: top.it.type,
          estimated_minutes: top.it.estimated_minutes ?? null,
          tier_required: top.it.tier_required,
          xp_reward: top.it.xp_reward ?? 10,
          reason: top.reason,
        }
      : null;

    // Continue learning (in-progress, top 3)
    const inProgressList = Array.from(inProgressMap.entries())
      .map(([content_id, v]) => {
        const it = (items ?? []).find((x) => x.id === content_id);
        return it
          ? {
              id: it.id,
              title: it.title,
              type: it.type,
              pct: Math.round((v.done / v.total) * 100),
              doneCount: v.done,
              total: v.total,
            }
          : null;
      })
      .filter((x): x is NonNullable<typeof x> => !!x)
      .slice(0, 3);

    // Badges (achievement system)
    const xp = profile?.xp_points ?? 0;
    const streak = profile?.current_streak ?? 0;
    const longest = profile?.longest_streak ?? 0;
    const totalCompleted = completedIds.size;
    const skillsStarted = skills.filter((s) => s.completed > 0 || s.inProgress > 0).length;

    const badges: BadgeAward[] = [
      { key: "first_steps",     label: "First Steps",        description: "Complete your first lesson",        iconKey: "Sparkles", earned: totalCompleted >= 1, progress: Math.min(100, totalCompleted * 100) },
      { key: "streak_3",        label: "On a Roll",          description: "3-day streak",                      iconKey: "Flame",    earned: longest >= 3,        progress: Math.min(100, (streak / 3) * 100) },
      { key: "streak_7",        label: "Week Warrior",       description: "7-day streak",                      iconKey: "Flame",    earned: longest >= 7,        progress: Math.min(100, (streak / 7) * 100) },
      { key: "xp_500",          label: "Quick Learner",      description: "Earn 500 XP",                       iconKey: "Zap",      earned: xp >= 500,           progress: Math.min(100, (xp / 500) * 100) },
      { key: "xp_2000",         label: "Power User",         description: "Earn 2,000 XP",                     iconKey: "Trophy",   earned: xp >= 2000,          progress: Math.min(100, (xp / 2000) * 100) },
      { key: "polymath",        label: "Polymath",           description: "Start 4 different skills",          iconKey: "Star",     earned: skillsStarted >= 4,  progress: Math.min(100, (skillsStarted / 4) * 100) },
      { key: "completionist",   label: "Completionist",      description: "Finish 10 lessons",                 iconKey: "Trophy",   earned: totalCompleted >= 10,progress: Math.min(100, (totalCompleted / 10) * 100) },
    ];

    return { dailyQuest, skills, badges, inProgress: inProgressList };
  });
