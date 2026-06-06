// LaunchVault — Autonomous content generator
// =====================================================================
// Generates AI Mastery content via OpenAI on a schedule (every 2 hours via the
// Cloudflare Cron Trigger → src/server.ts scheduled() → generateContentInProcess)
// and writes typed payloads into content_payloads.
//
// Cron-friendly + admin manual mode.
//
// Auth:
//   - x-internal-cron-secret: process.env.INTERNAL_CRON_SECRET  (preferred)
//   - apikey header == SUPABASE_PUBLISHABLE_KEY/ANON              (legacy)
//
// Query params:
//   ?type=prompt|course|workflow|agent|business_lesson|insight|tool_guide|playbook|challenge|cheatsheet|template
//     → restrict generation to one content type
//   ?tier=free|tier1|tier2|tier3
//     → restrict the run to a single tier (smaller AI call, fits inside
//       a Worker wall-time budget)
//   ?count=N → override count per type
//   ?trigger=cron|manual|admin
// =====================================================================

import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { ALL_DOMAIN_SLUGS, DOMAINS } from "@/config/domains";
import { brand } from "@/config/brand";
import { getRequestExecCtx } from "@/lib/exec-ctx";

function brandFounderName() {
  return brand.founder?.name ?? "LaunchVault Editorial";
}

type Tier = "free" | "tier1" | "tier2" | "tier3";
type ContentType =
  | "template"
  | "prompt"
  | "course"
  | "workflow"
  | "agent"
  | "business_lesson"
  | "insight"
  | "tool_guide"
  | "playbook"
  | "challenge"
  | "cheatsheet"
  | "glossary" // AI term definitions — DefinedTerm schema, AEO play
  | "essay";   // Long-form founder-voice posts — Article schema, blog content

// Distribution for a full run (only used when no ?type= is given — a direct
// manual call). The 2-hour Cloudflare cron does NOT use this; it drives a
// SEO-first per-type plan defined in src/server.ts runScheduledGeneration().
const RUN_DISTRIBUTION: Partial<Record<ContentType, number>> = {
  prompt: 6,
  course: 1,
  workflow: 3,
  agent: 2,
  business_lesson: 3,
  insight: 4,
  tool_guide: 1,
  cheatsheet: 1,
  challenge: 1,
};

// Tier mix per run (master prompt sec 21). Free is deliberately thin — a single
// free slot per mixed run; everything else is paid so the paywall converts.
const TIER_MIX: Tier[] = [
  "free",
  "tier1", "tier1", "tier1", "tier1", "tier1", "tier1",
  "tier2", "tier2", "tier2", "tier2", "tier2",
  "tier3", "tier3",
];

// For single-type runs (?type=X)
const TYPE_COUNT_DEFAULT: Record<ContentType, number> = {
  template: 6, prompt: 6, course: 2, workflow: 4, agent: 3,
  business_lesson: 4, insight: 6, tool_guide: 3, playbook: 2,
  challenge: 4, cheatsheet: 4,
  glossary: 5, essay: 1,
};

const PAYLOAD_COL: Record<ContentType, string | null> = {
  template: null,
  prompt: null,
  course: null,
  workflow: "workflow_payload",
  agent: "agent_payload",
  business_lesson: "business_payload",
  insight: "insight_payload",
  tool_guide: "tool_payload",
  playbook: "playbook_payload",
  challenge: "challenge_payload",
  cheatsheet: "cheatsheet_payload",
  glossary: null, // glossary stores in extra
  essay: null,    // essay stores in extra
};

// Free-content gating (deliberate funnel). Only these types may carry a FREE
// item: the daily INSIGHT is the single gated-free product hook; glossary +
// essays are always-free for SEO/AEO reach. EVERY other type — prompts,
// courses, agents, workflows, business lessons, tool guides, playbooks,
// challenges, cheatsheets, templates — is paid. (Prompts are now paid-only:
// they are core product value, so we stopped giving them away.) If the model
// marks a non-eligible type "free", we floor it to tier1 so the free tier
// stays thin and the paywall does the converting.
const FREE_ELIGIBLE_TYPES: ReadonlySet<ContentType> = new Set<ContentType>([
  "insight",
  "glossary",
  "essay",
]);

const VALID_DOMAINS = new Set<string>(ALL_DOMAIN_SLUGS as readonly string[]);

const DOMAIN_LIST_FOR_PROMPT = DOMAINS.map((d) => `${d.slug} — ${d.label}`).join("\n");

const slugify = (s: string) =>
  String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

/* ===================================================================== */
/* AI prompts per content type                                            */
/* ===================================================================== */

const SHARED_HEADER = `You are the senior content strategist for LaunchVault, a premium AI mastery platform with paying subscribers ($5-$50/mo). Your output is published verbatim — humans review nothing before users see it. Treat every item like a New York Times feature article: opinionated, specific, original, useful, and LONG enough to feel substantial.

CRITICAL — SELF-REVIEW LOOP:
Before returning each item, mentally do a 3-pass review:
1) Specificity — would a sceptical practitioner roll their eyes at any sentence? If yes, replace it with a specific tool, framework, number, or named example.
2) Position — does the piece take a clear stand? Or could it be re-titled "Things to consider about X"? If yes, sharpen the opening line into a verdict.
3) Factuality — every factual claim you make ("OpenAI raised context to 128k", "Claude is better at long-form code") MUST be something you would still bet $1000 was true. If unsure, REPHRASE to opinion ("our reading is that Claude tends to…") rather than presenting as fact.
If you can't pass all three for an item, regenerate it. Do not return slop.

Return ONLY valid JSON. No markdown fences, no commentary, no trailing commas.

PREMIUM CONTENT BAR — read this before generating:

✓ DO:
- Be specific. Use real tool names (ChatGPT, Claude, n8n, Make, Cursor, v0, Linear, Notion), real frameworks (RACE, STAR, AIDA, OKR), real concrete numbers ("3-step", "<200 tokens", "0.3 temperature").
- Take a position. "Most prompt engineers waste time on Y when X works 10x better" beats "There are many ways to prompt."
- Use sharp, opinionated language. Short sentences. Active voice.
- Cite specifics. "When OpenAI raised gpt-4o context to 128k…" beats "AI is getting better".
- Vary structure. Don't make every output a 3-bullet list.
- Surprise the reader. Lead with a counterintuitive claim or a sharp observation.
- Use lowercase domain slugs from the list below for "domain".

✗ NEVER:
- "Leverage", "synergy", "harness the power of", "unlock potential", "in today's fast-paced world", "the digital age", "game-changer", "ever-evolving", "exciting new", "cutting-edge", "revolutionize", "elevate your".
- Generic intros like "AI is transforming…" or "In this lesson you will learn…".
- Fake statistics ("studies show 73%…"). Only cite numbers you'd stand behind.
- Vague encouragement ("explore the possibilities!", "the future is bright!").
- Padding. If a sentence doesn't earn its place, kill it.
- Output that could be from any random AI library. We are LaunchVault.

DOMAIN SLUGS (use exact value for "domain"):
${DOMAIN_LIST_FOR_PROMPT}

Constraints:
- "tier_required" ∈ {free, tier1, tier2, tier3}.
- "difficulty" ∈ {beginner, intermediate, advanced}.
- "tags" 3–6 short kebab-or-lowercase tags.
- IDs globally unique, kebab-case, start with the type prefix shown.
- slugs lowercase, kebab-case, unique.
- No medical/legal/financial advice without an explicit disclaimer.
- No deceptive marketing, unsafe automation, or harmful agent instructions.
- Tier + difficulty define a deliberate QUALITY GRADIENT. Keep difficulty, tier, and depth ALIGNED (beginner ⇒ free ⇒ focused; intermediate ⇒ tier1; advanced ⇒ tier2/tier3 ⇒ deep). Free must feel great; paid must feel greater. Never invert it.
  · free (beginner): the hook — a deliberately PARTIAL taste whose only job is to sell the paid tier. Pick the ONE most useful angle and deliver the WHAT and the WHY sharply enough that a sceptic thinks "damn, if the free take is this good, the paid stuff must be unreal." Then STOP and withhold the actionable HOW. Give the verdict and the reasoning; do NOT hand over the full step-by-step recipe, the multi-step system, the specific configs/numbers, the edge-cases, or the "but what about when X?" follow-ups — a free item names the door, the paid tier walks you through it. Keep it SHORT: noticeably thinner than any paid item on the same topic, with the practical execution clearly gated. Genuinely useful and never slop — but unmistakably the tip of the iceberg, engineered to leave a serious reader wanting the full treatment they have to pay for. (EXCEPTION — this withholding applies to free PRODUCT items only. Free SEO reference content — glossary definitions and founder essays — stays COMPLETE and substantial: those exist to rank and be cited, so never thin them.)
  · tier1 (intermediate): everything the free version covers PLUS real depth — intermediate techniques, more complete frameworks, and the "but what about when X?" follow-ups a free reader is left wanting. Visibly longer and more thorough than a free item on the same topic.
  · tier2 (advanced): 1-2 genuinely non-obvious insights most practitioners don't have, plus edge-cases, failure modes, and trade-offs. Worth a Creator subscription on its own. Richer deep-dives, with stats and a weak-vs-strong comparison where they sharpen the point.
  · tier3 (advanced): mastery-grade. The complete treatment — multi-step systems, specific case studies, ops/scaling considerations, the work a consultant would bill for.`;

/**
 * Required article-style enrichment that EVERY item must include in its
 * <type>_payload (or prompt_payload / course_payload).
 *
 * This is what turns a list-of-bullets into a magazine article — long intro,
 * key takeaways, multiple deep-dive sections, optional stats and comparison,
 * a pull-quote, and related-reading suggestions.
 *
 * Designed to render via shared visual primitives in NewTypeViews.tsx:
 * KeyTakeaways, StatsRow, ComparisonBlock, PullQuote, DeepDive, RelatedReading.
 */
const ARTICLE_BODY_DIRECTIVE = `

EVERY item must ALSO include an "article" sub-object inside its main payload (prompt_payload.article, course_payload.article, workflow_payload.article, etc.). This is what turns the item from a checklist into a real article a paid subscriber would forward. Required shape:

"article": {
  "intro": "OPENING HOOK. 4-6 sentences. >=450 chars. Lead with a sharp opinion or counter-intuitive observation. Do NOT define what the topic is. Do NOT say 'In this article'. Set the stakes — who is this for, what changes when they internalise it.",
  "key_takeaways": ["EXACTLY 4-5 bold one-liners. Each 8-18 words. Each captures one specific shift the reader walks away with. No fluff, no encouragement, no 'understand the importance of'."],
  "deep_dive": [
    { "heading": "specific declarative heading (not a question)", "body": ">=350 chars of dense useful prose. New angle each section. Cite specifics — tools, numbers, real workflows. Sound like a real practitioner with opinions, not a textbook." }
  ],
  "stats": [
    { "value": "specific number or short figure ('8x', '<200ms', '~$0.02', '~40%')", "label": "what it measures (3-6 words)", "context": "ONE plain-language sentence interpreting the number" }
  ],
  "comparison": {
    "title": "short comparison title",
    "left_label": "the weak/common approach",
    "right_label": "the strong/recommended approach",
    "rows": [{ "left": "specific weak version", "right": "specific strong version" }]
  },
  "pull_quote": "ONE quotable line, 8-22 words, captures the essence of the piece. Quotable on Twitter.",
  "related_reading": [
    { "title": "related topic, capitalised like a headline", "why_relevant": "ONE sentence on why a reader of this item would care about that next" }
  ]
}

Rules for the article sub-object:
- "deep_dive": scale depth to the item's level — free/beginner: EXACTLY 1 tight section that frames the WHAT and WHY, with the actionable how-to deliberately held back for the paid tier (free is a taste, not the recipe); tier1/intermediate: 3-4 sections; tier2-tier3/advanced: 4-5 sections that get into edge-cases and trade-offs. Each body >=350 chars. A paid item must be visibly DEEPER and LONGER than a free item on the same topic — a paid reader gets multiple sections and the full execution; a free reader gets one framing section and a clear sense there is much more behind the paywall.
- "stats": free/beginner MAY skip. Paid items (tier1+) SHOULD include 2-4 sharp, real figures — depth like this is part of what the subscription buys. Never fabricate; skip rather than invent.
- "comparison": free/beginner MAY skip. tier2/tier3 SHOULD include a 3-5 row weak-vs-strong table where it sharpens the point. Skip if it would feel forced.
- "pull_quote": REQUIRED. One line, opinionated, quotable.
- "related_reading": REQUIRED. 3-4 items.

This is what separates a paid article from a free blog post. Treat it as the body of the piece, not an appendix.

═══════════════════════════════════════════════════════════════════════
FINAL CHECKLIST — VERIFY ALL OF THESE ARE PRESENT BEFORE RETURNING:
═══════════════════════════════════════════════════════════════════════

For EVERY item:
[ ] title set, no surrounding quote marks, no [PLACEHOLDERS]
[ ] description >= 60 chars
[ ] short_description set
[ ] tags array with 3+ entries
[ ] tier_required, difficulty set
[ ] article.intro present and >= 450 chars
[ ] article.key_takeaways array with 4+ entries
[ ] article.deep_dive array present, each body >= 350 chars (free: exactly 1 section; paid tier1+: 3+ sections)
[ ] article.pull_quote string present (one quotable line)
[ ] article.related_reading array with 3+ entries

If ANY checklist item is missing, the entire JSON is rejected by automated
validators. There is no partial credit. The reader sees nothing. Re-generate
internally before returning if you missed any.
`;

function tierDistText(items: number): string {
  // Mixed runs only generate paid-eligible types (free is reserved for the
  // insight/glossary/essay type-runs), so the suggested mix carries no free.
  const t1 = Math.max(0, Math.round(items * (7 / 14)));
  const t2 = Math.max(0, Math.round(items * (4 / 14)));
  const t3 = Math.max(1, items - t1 - t2);
  return `Suggested mix (approximate): ${t1} tier1, ${t2} tier2, ${t3} tier3.`;
}

function buildPromptPrompt(stamp: string, count: number, tier?: Tier): string {
  const total = count;
  const tierLine = tier
    ? `All items MUST have "tier_required":"${tier}".`
    : tierDistText(total);
  return `${SHARED_HEADER}${ARTICLE_BODY_DIRECTIVE}

Generate exactly ${total} AI PROMPTS.

A prompt is a battle-tested, copy-ready instruction that beats whatever the user would have written. Each prompt has 7 labeled sections inline: Role, Context, Inputs, Task, Constraints, Output format, Quality bar.

QUALITY BAR for prompts:
- Title: outcome-driven. Tells the reader what they get. ✓ "Investor-ready monthly update generator" ✗ "Business writing prompt".
- The prompt itself: literally usable. Production-grade. tier1 ≥ 400 chars, tier2 ≥ 700, tier3 ≥ 900. Uses [PLACEHOLDER] inputs the user fills.
- Real placeholders the user MUST fill: [COMPANY], [TARGET_AUDIENCE], [PAIN_POINT], [TONE], [WORD_COUNT] — not vague ones like [TOPIC].
- "best_for": specific scenarios. ✓ "B2B SaaS founders running their first cold-outbound campaign" ✗ "Marketing".
- "usage_steps": 3-6 imperative, specific actions.
- "quality_checklist": real shipping criteria, not encouragement.
- "common_mistakes": traps the prompt itself protects against.
- "example_use_case": a realistic paragraph showing the prompt in action.

${tierLine}

JSON shape:
{"prompts":[{
  "id":"prompt-<slug>-${stamp}-<i>",
  "type":"prompt",
  "title":"benefit-driven title (string)",
  "slug":"kebab-case-unique",
  "description":"1-2 sentences",
  "short_description":"<= 110 chars hook for cards",
  "domain":"<one of the domain slugs above>",
  "category":"string short",
  "tags":["3-6 tags"],
  "tier_required":"free|tier1|tier2|tier3",
  "difficulty":"beginner|intermediate|advanced",
  "estimated_minutes":3,
  "prompt_payload":{
    "prompt":"FULL copy-ready prompt with Role/Context/Inputs/Task/Constraints/Output/Quality sections. >=400 chars (tier1) or >=900 chars (tier2/tier3).",
    "prompt_summary":"2-3 sentences on why this prompt works",
    "best_for":["3-5 concrete scenarios"],
    "inputs":[{"name":"[PLACEHOLDER]","description":"what to fill in","example":"realistic example value"}],
    "output_format":"plain description of the output shape",
    "usage_steps":["3-6 steps"],
    "quality_checklist":["3-5 checks"],
    "example_use_case":"one realistic scenario paragraph",
    "variations":["2-3 short variation ideas"],
    "common_mistakes":["3-5 mistakes to avoid"],
    "article": "REQUIRED — full article sub-object per ARTICLE BODY DIRECTIVE above (intro, key_takeaways, deep_dive, stats, comparison, pull_quote, related_reading)"
  }
}]}`;
}

function buildCoursePrompt(stamp: string, count: number, tier?: Tier): string {
  const total = count;
  const tierLine = tier
    ? `All courses MUST have "tier_required":"${tier}".`
    : tierDistText(total);
  // === SIMPLIFIED PROMPT for model reliability ===
  // The complex multi-route schema kept failing validation. Stripped down
  // to the bare essentials: 3 lessons, 4 quiz options each, no optional
  // branching/article-block fields. The view handles missing optional
  // fields gracefully so we keep optionality on the consumption side.
  return `${SHARED_HEADER}

Generate exactly ${total} MICRO-COURSES.

A micro-course is exactly 3 lessons. Each lesson teaches ONE concept with a quiz to gate progression.

QUALITY BAR for courses:
- Title: specific, outcome-driven. ✓ "Ship a daily AI newsletter in 5 lessons" ✗ "Introduction to AI Writing"
- Each lesson reads like a MINI-ARTICLE. Not "Here's a concept, here's an example" — a flowing 500-900 word piece that teaches one big idea with specifics, named tools, real numbers.
- Each lesson has 2-3 sub-section headings (h3) inside its article body so readers can scan.
- Walkthrough steps are concrete: name tools, give exact prompts, show what to click.
- Quiz: ONE correct answer testing real understanding. Wrong options are plausible. The explanation teaches.
- Practice task: a real deliverable in 5-10 min.
- BRANCHING (optional, recommended): at lesson 2 or 3, offer the learner a CHOICE — e.g. "Are you a marketer or a developer?" → two next-lesson paths. Define this via the lesson.next_choices field.
- Final outcome: real before→after. ✓ "Go from a blank doc to a publishable newsletter draft in 25 minutes."

${tierLine}

═══════════════════════════════════════════════════════════════════════
HARD CONSTRAINTS — if any of these fail, the entire item is rejected:
═══════════════════════════════════════════════════════════════════════
1. course_payload.lessons array has EXACTLY 3 items
2. learning_objectives has EXACTLY 3 items
3. Each lesson.checkpoint_quiz.options has EXACTLY 4 strings
4. Each lesson.checkpoint_quiz.correct_answer is one of the 4 options character-for-character
5. Each lesson.lesson text is 250+ characters
6. title field is present and non-empty
═══════════════════════════════════════════════════════════════════════

JSON shape (return EXACTLY this — no extra/missing fields):
{"courses":[{
  "id":"course-<slug>-${stamp}-<i>",
  "type":"course",
  "title":"benefit-driven course title",
  "slug":"kebab-case-unique",
  "description":"1-2 sentences",
  "short_description":"<=110 chars",
  "domain":"<domain slug>",
  "category":"string",
  "tags":["tag1","tag2","tag3"],
  "tier_required":"free|tier1|tier2|tier3",
  "difficulty":"beginner|intermediate|advanced",
  "estimated_minutes":15,
  "course_payload":{
    "learning_objectives":["outcome 1","outcome 2","outcome 3"],
    "prerequisites":["prereq 1"],
    "final_outcome":"1-2 sentences before→after",
    "lessons":[
      {
        "id":"lesson-1",
        "title":"lesson 1 title",
        "objective":"1 sentence — what this lesson teaches",
        "lesson":"explanation, 600+ chars of dense magazine prose (aim 600-900 chars) with 2-3 ## sub-headings. NO bullet lists in this string.",
        "example":"a concrete worked example",
        "walkthrough_steps":["step 1","step 2","step 3"],
        "practice_task":{
          "title":"short hands-on task title",
          "instructions":"a real deliverable the learner produces in 5-10 min — be specific",
          "starter_prompt_or_code":"a starter prompt or snippet they edit in the workspace",
          "success_criteria":["criterion 1","criterion 2"]
        },
        "checkpoint_quiz":{
          "question":"question testing real understanding",
          "options":["option A","option B","option C","option D"],
          "correct_answer":"option A",
          "explanation":"2-3 sentences on why correct"
        },
        "common_mistakes":["mistake 1","mistake 2"],
        "recap":"1 sentence recap"
      },
      {
        "id":"lesson-2",
        "title":"lesson 2 title",
        "objective":"...",
        "lesson":"...",
        "example":"...",
        "walkthrough_steps":["...","...","..."],
        "checkpoint_quiz":{"question":"...","options":["a","b","c","d"],"correct_answer":"a","explanation":"..."},
        "common_mistakes":["..."],
        "recap":"..."
      },
      {
        "id":"lesson-3",
        "title":"lesson 3 title",
        "objective":"...",
        "lesson":"...",
        "example":"...",
        "walkthrough_steps":["...","...","..."],
        "checkpoint_quiz":{"question":"...","options":["a","b","c","d"],"correct_answer":"a","explanation":"..."},
        "common_mistakes":["..."],
        "recap":"..."
      }
    ]
  }
}]}

Quizzes are MANDATORY on every lesson. correct_answer MUST be present in options array.`;
}

function buildWorkflowPrompt(stamp: string, count: number, tier?: Tier): string {
  const tierLine = tier ? `All items MUST have "tier_required":"${tier}".` : tierDistText(count);
  return `${SHARED_HEADER}${ARTICLE_BODY_DIRECTIVE}

Generate exactly ${count} WORKFLOWS — step-by-step AI execution guides.

${tierLine}

JSON shape:
{"workflows":[{
  "id":"workflow-<slug>-${stamp}-<i>",
  "type":"workflow",
  "title":"action-oriented title",
  "slug":"kebab-case-unique",
  "description":"1-2 sentences",
  "short_description":"<= 110 chars",
  "domain":"<domain slug>",
  "category":"string",
  "tags":["3-6 tags"],
  "tier_required":"free|tier1|tier2|tier3",
  "difficulty":"beginner|intermediate|advanced",
  "estimated_minutes":10,
  "workflow_payload":{
    "outcome":"what the user will end up with",
    "tools_needed":["3-6 tools or services"],
    "inputs_needed":["2-5 inputs the user must bring"],
    "steps":[{
      "step_number":1,
      "title":"step title",
      "instruction":"clear, concrete instruction",
      "example":"a concrete example (1-3 sentences)",
      "expected_output":"what success looks like",
      "common_mistake":"a common mistake at this step"
    }],
    "automation_notes":["2-4 notes on automating or scaling this"],
    "success_criteria":["3-5 criteria"],
    "article": "REQUIRED — full article sub-object per ARTICLE BODY DIRECTIVE above"
  }
}]}

Each workflow MUST have 4–8 steps.`;
}

function buildAgentPrompt(stamp: string, count: number, tier?: Tier): string {
  const tierLine = tier ? `All items MUST have "tier_required":"${tier}".` : tierDistText(count);
  return `${SHARED_HEADER}${ARTICLE_BODY_DIRECTIVE}

Generate exactly ${count} AGENT BLUEPRINTS — production-ready single-purpose agent plans.

${tierLine}

JSON shape:
{"agents":[{
  "id":"agent-<slug>-${stamp}-<i>",
  "type":"agent",
  "title":"agent name / purpose",
  "slug":"kebab-case-unique",
  "description":"1-2 sentences",
  "short_description":"<= 110 chars",
  "domain":"<domain slug>",
  "category":"string",
  "tags":["3-6 tags"],
  "tier_required":"free|tier1|tier2|tier3",
  "difficulty":"beginner|intermediate|advanced",
  "estimated_minutes":12,
  "agent_payload":{
    "agent_goal":"1-2 sentences",
    "ideal_user":"who benefits most",
    "capabilities":["3-6 capabilities"],
    "tools_required":["3-6 tools the agent needs (web search, code interpreter, vector DB, etc.)"],
    "memory_requirements":["2-4 memory types or scopes"],
    "system_instructions":"FULL system prompt for the agent. 400+ chars. Include role, scope, constraints, response format.",
    "user_prompt_template":"the recommended user-message template with placeholders like [GOAL], [CONTEXT].",
    "workflow_steps":["3-7 steps the agent runs through"],
    "input_schema":{"example":"plain-text or JSON-shaped description of input"},
    "output_schema":{"example":"plain-text or JSON-shaped description of output"},
    "evaluation_criteria":["3-5 ways to know the agent worked"],
    "risks_and_safety":["3-5 safety risks + mitigations"],
    "implementation_steps":["4-7 concrete build steps"],
    "article": "REQUIRED — full article sub-object per ARTICLE BODY DIRECTIVE above"
  }
}]}`;
}

function buildBusinessPrompt(stamp: string, count: number, tier?: Tier): string {
  const tierLine = tier ? `All items MUST have "tier_required":"${tier}".` : tierDistText(count);
  return `${SHARED_HEADER}${ARTICLE_BODY_DIRECTIVE}

Generate exactly ${count} BUSINESS LESSONS — practical, monetizable AI plays for founders, agencies, freelancers, and operators.

QUALITY BAR for business lessons:
- Title: specific monetization angle. ✓ "Turn one AI prompt into a $2k/mo productized service" ✗ "AI for Business".
- "main_idea": 2-3 sentences. Should make the reader stop scrolling. Lead with the verdict.
- "business_use_case": a real, named scenario. Talk about real businesses (or realistic personas — "a 12-person digital marketing agency in Toronto"), real numbers, real workflows.
- "step_by_step_strategy": 4-7 imperative steps. Real tools. Real time estimates.
- "example": specific worked numbers — "Charge $1,200/setup + $400/mo retainer. 8 retainers = $3,200/mo recurring."
- "monetization_angle": THE money line. How specifically does this make money or save it? What's the pricing model?
- "mistakes_to_avoid": real traps — pricing too low, scope creep, dependency on a single model.
- "action_steps": 3-5 actions takeable this week.

${tierLine}

JSON shape:
{"business_lessons":[{
  "id":"business-<slug>-${stamp}-<i>",
  "type":"business_lesson",
  "title":"benefit-driven title",
  "slug":"kebab-case-unique",
  "description":"1-2 sentences",
  "short_description":"<= 110 chars",
  "domain":"<domain slug>",
  "category":"string",
  "tags":["3-6 tags"],
  "tier_required":"free|tier1|tier2|tier3",
  "difficulty":"beginner|intermediate|advanced",
  "estimated_minutes":8,
  "business_payload":{
    "main_idea":"the core insight, 2-3 sentences",
    "why_it_matters":"why this matters now",
    "business_use_case":"a specific concrete scenario",
    "step_by_step_strategy":["4-7 steps to execute"],
    "example":"a worked example with numbers if relevant",
    "tools_or_skills_needed":["3-5 items"],
    "monetization_angle":"how this earns or saves money — specific",
    "mistakes_to_avoid":["3-5 mistakes"],
    "action_steps":["3-5 next actions the reader can take this week"],
    "article": "REQUIRED — full article sub-object per ARTICLE BODY DIRECTIVE above"
  }
}]}`;
}

function buildInsightPrompt(stamp: string, count: number, tier?: Tier): string {
  const tierLine = tier ? `All items MUST have "tier_required":"${tier}".` : tierDistText(count);
  return `${SHARED_HEADER}${ARTICLE_BODY_DIRECTIVE}

Generate exactly ${count} DAILY AI INSIGHTS.

An insight is a 30-second read that gives a paying subscriber a specific, opinionated take on an AI development. Think a great Stratechery or Lenny's Newsletter mini-post, not a corporate blog.

${tierLine}

QUALITY BAR for insights:
- The "insight" field is THE moment. Open with a sharp, opinionated, sometimes counterintuitive observation. Lead with a verdict, not a description.
  ✓ "Long-context models killed half the RAG industry overnight. Most teams haven't noticed."
  ✓ "If you're paying for Claude's API and ChatGPT Plus, you're paying twice for the same workflow."
  ✗ "AI is becoming more powerful and there are many use cases."
- Title: 6-10 words, opinionated, makes the reader curious. Headline-style.
  ✓ "Stop fine-tuning. Start writing 12 examples."
  ✓ "The prompt-engineer job title is dying. Good."
  ✗ "Tips for Improving AI Performance"
- "why_it_matters": who specifically benefits, what they're missing if they don't act.
- "how_to_use_it": a concrete, specific tactic. Name a tool or step.
- "example": a real-feeling worked example with specifics, numbers, names.
- "action_step": one thing they do TODAY, takes <10 minutes.

JSON shape:
{"insights":[{
  "id":"insight-<slug>-${stamp}-<i>",
  "type":"insight",
  "title":"opinionated headline (6-10 words)",
  "slug":"kebab-case-unique",
  "description":"1-2 sentence promise of what they'll learn",
  "short_description":"<= 110 chars hook with a hook",
  "domain":"<domain slug>",
  "category":"string",
  "tags":["3-6 tags"],
  "tier_required":"free|tier1|tier2|tier3",
  "difficulty":"beginner|intermediate|advanced",
  "estimated_minutes":2,
  "insight_payload":{
    "insight":"sharp opinionated observation, 3-5 sentences, leads with the verdict",
    "why_it_matters":"who specifically benefits or loses, 2-3 sentences",
    "how_to_use_it":"a concrete tactic with a named tool or specific step, 2-3 sentences",
    "example":"a worked example with specifics — numbers, names, real outputs",
    "related_concepts":["3-5 connected ideas a curious reader would google next"],
    "action_step":"one specific action takeable in <10 minutes today",
    "article": "REQUIRED — full article sub-object per ARTICLE BODY DIRECTIVE above"
  }
}]}`;
}

function buildToolPrompt(stamp: string, count: number, tier?: Tier): string {
  const tierLine = tier ? `All items MUST have "tier_required":"${tier}".` : tierDistText(count);
  return `${SHARED_HEADER}${ARTICLE_BODY_DIRECTIVE}

Generate exactly ${count} AI TOOL GUIDES — honest, structured breakdowns of useful AI tools.

${tierLine}
Cover real tools that exist. Be specific. Note limitations.

JSON shape:
{"tool_guides":[{
  "id":"tool-<slug>-${stamp}-<i>",
  "type":"tool_guide",
  "title":"<Tool> for <task>",
  "slug":"kebab-case-unique",
  "description":"1-2 sentences",
  "short_description":"<= 110 chars",
  "domain":"<domain slug>",
  "category":"string",
  "tags":["3-6 tags"],
  "tier_required":"free|tier1|tier2|tier3",
  "difficulty":"beginner|intermediate|advanced",
  "estimated_minutes":6,
  "tool_payload":{
    "tool_name":"the tool",
    "what_it_does":"plain description",
    "best_for":["3-5 use cases"],
    "how_to_use":["4-7 steps to get value fast"],
    "example_workflow":"1-paragraph worked example",
    "pros":["3-5 strengths"],
    "limitations":["3-5 limitations"],
    "alternatives":["3-5 similar tools"],
    "article": "REQUIRED — full article sub-object per ARTICLE BODY DIRECTIVE above"
  }
}]}`;
}

function buildPlaybookPrompt(stamp: string, count: number, tier?: Tier): string {
  const tierLine = tier ? `All items MUST have "tier_required":"${tier}".` : tierDistText(count);
  return `${SHARED_HEADER}${ARTICLE_BODY_DIRECTIVE}

Generate exactly ${count} PLAYBOOKS — multi-phase end-to-end execution plans.

${tierLine}

JSON shape:
{"playbooks":[{
  "id":"playbook-<slug>-${stamp}-<i>",
  "type":"playbook",
  "title":"goal-driven title",
  "slug":"kebab-case-unique",
  "description":"1-2 sentences",
  "short_description":"<= 110 chars",
  "domain":"<domain slug>",
  "category":"string",
  "tags":["3-6 tags"],
  "tier_required":"free|tier1|tier2|tier3",
  "difficulty":"beginner|intermediate|advanced",
  "estimated_minutes":20,
  "playbook_payload":{
    "goal":"the outcome",
    "who_it_is_for":"specific audience",
    "required_tools":["3-7 tools"],
    "phases":[{
      "phase":"phase name",
      "objective":"phase objective",
      "steps":["3-6 concrete steps"],
      "deliverable":"what comes out of this phase"
    }],
    "checklist":["6-10 checklist items spanning the whole playbook"],
    "success_metrics":["3-5 metrics"],
    "article": "REQUIRED — full article sub-object per ARTICLE BODY DIRECTIVE above"
  }
}]}

Each playbook MUST have 3–5 phases.`;
}

function buildChallengePrompt(stamp: string, count: number, tier?: Tier): string {
  const tierLine = tier ? `All items MUST have "tier_required":"${tier}".` : tierDistText(count);
  return `${SHARED_HEADER}${ARTICLE_BODY_DIRECTIVE}

Generate exactly ${count} CHALLENGES — small, focused practice tasks to build AI skill.

${tierLine}

JSON shape:
{"challenges":[{
  "id":"challenge-<slug>-${stamp}-<i>",
  "type":"challenge",
  "title":"specific challenge title",
  "slug":"kebab-case-unique",
  "description":"1-2 sentences",
  "short_description":"<= 110 chars",
  "domain":"<domain slug>",
  "category":"string",
  "tags":["3-6 tags"],
  "tier_required":"free|tier1|tier2|tier3",
  "difficulty":"beginner|intermediate|advanced",
  "estimated_minutes":10,
  "challenge_payload":{
    "challenge_goal":"what the learner must accomplish",
    "instructions":"step-by-step what to do, 3-6 sentences",
    "starter_material":"a starter prompt, code snippet, or input the learner builds from",
    "success_criteria":["3-5 criteria"],
    "hint":"one nudge if stuck",
    "example_solution":"a worked solution (full prompt or code or output)",
    "reflection_question":"a question to deepen the takeaway",
    "article": "REQUIRED — full article sub-object per ARTICLE BODY DIRECTIVE above"
  }
}]}`;
}

function buildCheatsheetPrompt(stamp: string, count: number, tier?: Tier): string {
  const tierLine = tier ? `All items MUST have "tier_required":"${tier}".` : tierDistText(count);
  return `${SHARED_HEADER}${ARTICLE_BODY_DIRECTIVE}

Generate exactly ${count} CHEATSHEETS — compact one-page references.

${tierLine}

JSON shape:
{"cheatsheets":[{
  "id":"cheatsheet-<slug>-${stamp}-<i>",
  "type":"cheatsheet",
  "title":"specific topic",
  "slug":"kebab-case-unique",
  "description":"1-2 sentences",
  "short_description":"<= 110 chars",
  "domain":"<domain slug>",
  "category":"string",
  "tags":["3-6 tags"],
  "tier_required":"free|tier1|tier2|tier3",
  "difficulty":"beginner|intermediate|advanced",
  "estimated_minutes":5,
  "cheatsheet_payload":{
    "summary":"1-paragraph overview",
    "framework":["5-8 bullet points that form a memorable framework"],
    "quick_commands":["5-10 commands, prompts, or shortcuts"],
    "prompt_patterns":["3-6 short reusable prompt patterns"],
    "dos":["5-8 things to do"],
    "donts":["5-8 things to avoid"],
    "example":"a 1-paragraph worked example",
    "article": "REQUIRED — full article sub-object per ARTICLE BODY DIRECTIVE above"
  }
}]}`;
}

function buildGlossaryPrompt(stamp: string, count: number): string {
  return `${SHARED_HEADER}

Generate exactly ${count} AI GLOSSARY entries — definitive, citable definitions of AI terminology.

These entries are optimized for ANSWER ENGINES (Claude, ChatGPT, Perplexity, Gemini). When a user asks "what is RAG?" or "what is prompt engineering?", these are the entries that should get cited.

QUALITY BAR for glossary entries:
- Term: a real AI/ML/prompting/agent term (RAG, prompt engineering, agentic AI, fine-tuning, context window, tokens, embeddings, vector database, system prompt, etc.). NOT made-up terms.
- "short_definition": ONE sentence. Plain English. The exact sentence an LLM would quote.
- "long_definition": 2-4 paragraphs (300-600 chars total). Explains the concept clearly. NO hedging.
- "examples": 2-4 concrete examples of the term in use.
- "common_misconceptions": 2-3 things people get wrong about this term.
- "related_terms": 3-6 related/adjacent terms.
- "first_use_year": when did the term enter common usage (rough estimate).

All entries are tier_required="free" — glossary is always public for AEO.

JSON shape:
{"glossary":[{
  "id":"glossary-<slug>-${stamp}-<i>",
  "type":"glossary",
  "title":"the term (capitalized as commonly written)",
  "slug":"kebab-case-unique",
  "description":"the short_definition — 1 sentence",
  "short_description":"<= 110 chars hook",
  "domain":"<one domain slug, or omit>",
  "category":"taxonomy slug like 'prompting' or 'agents' or 'ml'",
  "tags":["3-6 tags"],
  "tier_required":"free",
  "difficulty":"beginner|intermediate|advanced",
  "estimated_minutes":2,
  "glossary_payload":{
    "term":"<same as title>",
    "short_definition":"ONE clean sentence",
    "long_definition":"2-4 paragraphs of clear explanation",
    "examples":["concrete examples"],
    "common_misconceptions":["misconceptions"],
    "related_terms":["related kebab-case slugs"],
    "first_use_year":"YYYY",
    "synonyms":["alt names if any"]
  }
}]}`;
}

function buildEssayPrompt(stamp: string, count: number): string {
  const editorialVoice = `
EDITORIAL VOICE — REQUIRED:
You are writing for LaunchVault Editorial — an anonymous, opinionated, fluff-free editorial team. Use editorial "we" voice (e.g. "we ran an experiment", "in our view", "we tested this"). NEVER use first-person singular ("I", "my", "me") — there is no individual founder identity, only the editorial team.

Voice traits (USE these):
- Direct, opinionated, fluff-free
- Editorial "we" — never "I"
- Sceptical of AI hype, obsessed with what actually ships
- Specifics over abstractions — name real tools, cite numbers, call out trade-offs
- Honest about mistakes ("the expensive way to learn this is…")

Voice anti-patterns (AVOID):
- "We're excited to announce", "thrilled to share", "humbled by"
- First-person "I" / "my" — ALWAYS use "we" / "our" instead
- References to a specific named person, founder, age, location, or personal story
- Corporate cheerleading
- Hedging ("it might be worth considering")
- AI clichés ("leverage", "revolutionize", "game-changer", "harness")
- Generic AI assistant tone

Signature line patterns you can use:
- "Here's what actually works:"
- "The honest truth is"
- "Nobody talks about this but"
- "The expensive way to learn this is"
- "Counter-intuitive take:"

Open the essay with something specific and pointed — a verdict, an experiment, a hot take. NEVER open with "In this post" or "Today we want to talk about" or anything self-referential.`;

  return `${SHARED_HEADER}${editorialVoice}

Generate exactly ${count} LONG-FORM ESSAYS for the LaunchVault blog.

An essay is a 900-1500 word opinionated piece on AI, prompting, building autonomous engines, agency, business models, or the meta of being an indie SaaS founder building in public.

QUALITY BAR for essays:
- Title: punchy, specific, makes you want to click. ✓ "I deleted my entire prompt library. Then I built one that updates itself." ✗ "How To Use AI Prompts"
- Hook: open with a moment or hot take. Drag the reader in.
- Body: 4-7 distinct sections with subheadings, each making one point. ~150-200 words each.
- Specifics throughout — tool names, exact numbers, real workflows.
- Take a position. The essay should make at least one reader uncomfortable and at least one nod hard.
- Close with a clear takeaway or call-to-think.

These are tier_required="free" — essays are always public for SEO/AEO/sharing.

REQUIRED ESSAY CHECKLIST — verify before returning:
[ ] hook >= 200 chars
[ ] closing >= 100 chars
[ ] sections array with 4+ items, each body >= 250 chars
[ ] key_quotes array with 2+ tweetable lines
[ ] next_to_read array with 3+ items

JSON shape:
{"essays":[{
  "id":"essay-<slug>-${stamp}-<i>",
  "type":"essay",
  "title":"punchy specific title — sounds like a Twitter post",
  "slug":"kebab-case-unique",
  "description":"the 1-sentence hook from the opening paragraph",
  "short_description":"<= 110 chars — same hook, tightened",
  "domain":"<domain slug or omit>",
  "category":"essay topic — 'autonomous-engines' / 'indie-saas' / 'prompting-philosophy' / 'ai-economics' / etc",
  "tags":["3-6 tags"],
  "tier_required":"free",
  "difficulty":"intermediate",
  "estimated_minutes":6,
  "essay_payload":{
    "hook":"the opening 2-3 sentences. Sharp, specific, irresistible.",
    "tldr":"one-sentence summary of the take",
    "sections":[{
      "heading":"specific declarative subheading (not a question)",
      "body":">=200 chars of dense founder-voice prose"
    }],
    "key_quotes":["2-3 tweetable lines extracted from the body"],
    "closing":"the last 2-3 sentences. A clean landing, not a wrap-up paragraph.",
    "next_to_read":["3-4 related essay/library titles to suggest at the bottom"]
  }
}]}

Each essay MUST have 4-7 sections.`;
}

const PROMPT_BUILDERS: Record<ContentType, (stamp: string, count: number, tier?: Tier) => string | null> = {
  template: () => null,
  prompt: buildPromptPrompt,
  course: buildCoursePrompt,
  workflow: buildWorkflowPrompt,
  agent: buildAgentPrompt,
  business_lesson: buildBusinessPrompt,
  insight: buildInsightPrompt,
  tool_guide: buildToolPrompt,
  playbook: buildPlaybookPrompt,
  challenge: buildChallengePrompt,
  cheatsheet: buildCheatsheetPrompt,
  glossary: (stamp, count) => buildGlossaryPrompt(stamp, count),
  essay: (stamp, count) => buildEssayPrompt(stamp, count),
};

const RESULT_KEY: Record<ContentType, string> = {
  template: "templates",
  prompt: "prompts",
  course: "courses",
  workflow: "workflows",
  agent: "agents",
  business_lesson: "business_lessons",
  insight: "insights",
  tool_guide: "tool_guides",
  playbook: "playbooks",
  challenge: "challenges",
  cheatsheet: "cheatsheets",
  glossary: "glossary",
  essay: "essays",
};

/* ===================================================================== */
/* Validators                                                              */
/* ===================================================================== */

const VALID_TIERS = new Set(["free", "tier1", "tier2", "tier3"]);
const VALID_DIFFICULTY = new Set(["beginner", "intermediate", "advanced"]);

/**
 * Sanitize+normalize a raw item from the model. Mutates the object so
 * subsequent validation works on cleaned values. Returns the same object.
 * Mostly self-heals common deviations (tier wrapped in slashes, missing id, etc).
 */
function repairItem(it: any, idPrefix: string, stamp: string, idx: number): any {
  if (!it || typeof it !== "object") return it;

  // Sanitize title — strip any wrapping quote marks the model may have added
  // and normalise whitespace. Also strip ASCII placeholder markers.
  if (typeof it.title === "string") {
    let t = it.title.trim();
    // Remove leading + trailing quote chars (', ", `, curly quotes)
    t = t.replace(/^[\s'"`“”‘’]+/, "");
    t = t.replace(/[\s'"`“”‘’]+$/, "");
    // Collapse internal whitespace
    t = t.replace(/\s+/g, " ");
    it.title = t;
  }
  // Same for description + short_description
  for (const f of ["description", "short_description"]) {
    if (typeof it[f] === "string") {
      it[f] = it[f].trim().replace(/^['"]+|['"]+$/g, "");
    }
  }

  // Normalize tier — strip non-alphanumeric. "tier-1" → "tier1", "/tier3/" → "tier3"
  if (typeof it.tier_required === "string") {
    const t = it.tier_required.toLowerCase().replace(/[^a-z0-9]/g, "");
    it.tier_required = VALID_TIERS.has(t) ? t : "tier1";
  } else {
    it.tier_required = "tier1";
  }

  // Normalize difficulty — pick first valid token from string
  if (typeof it.difficulty === "string") {
    const d = it.difficulty.toLowerCase().replace(/[^a-z]/g, "");
    it.difficulty = VALID_DIFFICULTY.has(d) ? d : "intermediate";
  } else {
    it.difficulty = "intermediate";
  }

  // ID — prepend the expected prefix if it's missing.
  if (typeof it.id === "string" && !it.id.startsWith(idPrefix)) {
    // If it looks like a slug, prepend; otherwise generate.
    if (/^[a-z0-9-]+$/i.test(it.id)) {
      it.id = `${idPrefix}${it.id.replace(/^-+|-+$/g, "")}-${stamp}-${idx}`;
    } else {
      it.id = `${idPrefix}${stamp}-${idx}`;
    }
  } else if (!it.id) {
    it.id = `${idPrefix}${stamp}-${idx}`;
  }

  // Domain — coerce to slug if it almost matches
  if (typeof it.domain === "string" && !VALID_DOMAINS.has(it.domain)) {
    const norm = it.domain.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
    if (VALID_DOMAINS.has(norm)) it.domain = norm;
    // If still invalid, drop it (treat as unset rather than rejecting outright)
    else delete it.domain;
  }

  // Course lessons: drop exact-duplicate lessons the model occasionally emits
  // (the same title + body repeated as the final lesson). Keep first occurrence,
  // preserve order — otherwise the player shows two identical lessons in a row.
  if (it.course_payload && Array.isArray(it.course_payload.lessons)) {
    const seen = new Set<string>();
    it.course_payload.lessons = it.course_payload.lessons.filter((l: any) => {
      const body = String(l?.article ?? l?.lesson ?? "").trim().slice(0, 200).toLowerCase();
      const key = `${String(l?.title ?? "").trim().toLowerCase()}::${body}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Strip degenerate/malformed fragments (run-on blobs, leaked-JSON table rows,
  // empty deep-dive sections) before the validator or renderer ever see them.
  sanitizeArticleBlock(it);

  return it;
}

function validateBase(it: any, _idPrefix: string): string | null {
  if (!it || typeof it !== "object") return "not an object";
  if (!it.title) return "missing title";
  const title = String(it.title).trim();
  if (title.length < 8) return "title too short";
  if (title.length > 120) return "title too long";
  // Reject titles with literal quotation marks (model wrapped the string)
  if (/^['"`]/.test(title) || /['"`]$/.test(title)) return "title has literal quote chars";
  // Reject titles that contain placeholder markers
  if (/\[(TOPIC|SUBJECT|PLACEHOLDER|EXAMPLE|TBD)\]/i.test(title)) return "title has placeholder";
  // Description must be substantial enough for SEO meta + UI
  const desc = String(it.description ?? "").trim();
  if (desc.length < 50) return "description too short";
  // ID + tier + difficulty + domain are all auto-healed by repairItem.
  return null;
}

/**
 * Returns the canonical article-block (if any) for any content type.
 */
function getArticleBlock(it: any): any {
  return it.prompt_payload?.article ??
    it.course_payload?.article ??
    it.workflow_payload?.article ??
    it.agent_payload?.article ??
    it.business_payload?.article ??
    it.insight_payload?.article ??
    it.tool_payload?.article ??
    it.playbook_payload?.article ??
    it.challenge_payload?.article ??
    it.cheatsheet_payload?.article ??
    null;
}

/* --------------------------------------------------------------------- */
/* Coherence guards — catch gpt-4o degeneration (run-on word-salad, leaked */
/* JSON) that sails through length-only checks but renders as broken UI.   */
/* --------------------------------------------------------------------- */

/** True if a string looks like degenerate model output: a no-space run-on
 *  blob, an absurdly long single "token", or near-zero lexical variety. */
function looksDegenerate(text: unknown): boolean {
  if (typeof text !== "string") return false;
  const s = text.trim();
  if (s.length < 60) return false;
  // 1) Longest unbroken token — a no-space run-on blob is one giant "word".
  //    Real words/URLs rarely exceed ~55 chars; catches blobs of ANY length.
  let longest = 0;
  for (const w of s.split(/\s+/)) if (w.length > longest) longest = w.length;
  if (longest > 55) return true;
  // 2) Whitespace ratio — real prose is ~13-18% spaces; a run-on blob ~0%.
  //    Only meaningful for LONG text: short hyphen-/paren-heavy titles like
  //    "Understanding Retrieval-Augmented Generation (RAG) Frameworks" can dip
  //    under 7% legitimately, so we gate this on length >= 200 to avoid
  //    false positives. True no-space blobs are already caught by (1).
  if (s.length >= 200) {
    const spaces = (s.match(/\s/g) ?? []).length;
    if (spaces / s.length < 0.07) return true;
  }
  // 3) Lexical variety — a 40+ word span with <35% unique words is degenerate.
  const words = s.toLowerCase().match(/[a-z]{2,}/g) ?? [];
  if (words.length >= 40 && new Set(words).size / words.length < 0.35) return true;
  return false;
}

/** True if a string carries leaked JSON structure — the signature of a
 *  malformed comparison row (e.g. "...','right':'...'}}}"). */
function looksLikeJsonJunk(text: unknown): boolean {
  if (typeof text !== "string") return true;
  const s = text.trim();
  if (!s) return true;
  if (/[{}]{2,}/.test(s)) return true;                                 // }}} or {{
  if (/['"]\s*[,:]\s*['"]?(left|right)['"]?\s*:/i.test(s)) return true; // ','right':
  if (/^[\[\]{}"',:\s]+$/.test(s)) return true;                        // pure punctuation
  return false;
}

/** Strip empty/degenerate deep-dive sections, malformed comparison rows, and
 *  junk stats/takeaways from an item's article block. Mutates in place so the
 *  validator and the renderer never receive broken fragments. */
function sanitizeArticleBlock(it: any): void {
  const a = getArticleBlock(it);
  if (!a || typeof a !== "object") return;

  if (Array.isArray(a.deep_dive)) {
    a.deep_dive = a.deep_dive.filter((s: any) => {
      const body = typeof s?.body === "string" ? s.body.trim() : "";
      if (body.length < 80) return false;        // empty/stub → no bare heading
      if (looksDegenerate(body)) return false;    // word-salad
      if (looksDegenerate(s?.heading)) s.heading = undefined;
      return true;
    });
  }

  if (a.comparison && Array.isArray(a.comparison.rows)) {
    a.comparison.rows = a.comparison.rows.filter((r: any) => {
      const left = typeof r?.left === "string" ? r.left.trim() : "";
      const right = typeof r?.right === "string" ? r.right.trim() : "";
      if (!left || !right || left.length > 280 || right.length > 280) return false;
      if (looksLikeJsonJunk(left) || looksLikeJsonJunk(right)) return false;
      if (looksDegenerate(left) || looksDegenerate(right)) return false;
      return true;
    });
    if (a.comparison.rows.length < 2) delete a.comparison; // not worth a table
  }

  if (Array.isArray(a.stats)) {
    a.stats = a.stats.filter((s: any) => {
      const v = typeof s?.value === "string" ? s.value.trim() : "";
      // A real stat value ("+15% ARPU boost potential", ">90% satisfaction rate
      // post-deployment") can run to ~40 chars; only sentence-stuffed or
      // word-salad values (100s–1000s of chars) are junk. Cap generously and
      // let the degenerate/JSON-junk checks catch the actual garbage.
      return v.length > 0 && v.length <= 160 && !looksLikeJsonJunk(v) && !looksDegenerate(v);
    });
  }

  if (Array.isArray(a.key_takeaways)) {
    a.key_takeaways = a.key_takeaways.filter(
      (t: any) => typeof t === "string" && t.trim().length >= 8 && !looksDegenerate(t),
    );
  }

  if (Array.isArray(a.related_reading)) {
    a.related_reading = a.related_reading.filter(
      (r: any) => r && typeof r.title === "string" && r.title.trim().length > 0 && !looksDegenerate(r.title),
    );
  }
}

/**
 * Article block requirement — pragmatically loose so real model output passes.
 * We only enforce the MINIMUM core (intro + at least one substantive deep-dive
 * section). Everything else (takeaways, pull-quote, comparison, stats,
 * related-reading) is OPTIONAL — the views handle missing fields gracefully.
 *
 * The strictly-required fields are what shows up "above the fold" on the
 * rendered article. Optional fields just don't render if absent.
 */
function requireArticleBlock(it: any): string | null {
  const a = getArticleBlock(it);
  if (!a || typeof a !== "object") return "missing article block";
  if (!a.intro || String(a.intro).length < 200) return "article.intro too short";
  if (looksDegenerate(a.intro)) return "article.intro reads as run-on / word-salad";
  // Accept ANY of: deep_dive present with one good section, OR substantial intro
  const hasDeepDive = Array.isArray(a.deep_dive) && a.deep_dive.length >= 1
    && String(a.deep_dive[0]?.body ?? "").length >= 150;
  const hasLongIntro = String(a.intro).length >= 600;
  if (!hasDeepDive && !hasLongIntro) {
    return "article needs either a deep_dive section OR a 600+ char intro";
  }
  return null;
}

function validatePrompt(it: any): string | null {
  const b = validateBase(it, "prompt-"); if (b) return b;
  const p = it.prompt_payload;
  if (!p?.prompt || String(p.prompt).length < 300) return "prompt text too short";
  return requireArticleBlock(it);
}
function validateCourse(it: any): string | null {
  const b = validateBase(it, "course-"); if (b) return b;
  const cp = it.course_payload ?? {};
  const lessons = cp.lessons;
  if (!Array.isArray(lessons) || lessons.length < 2 || lessons.length > 10) return "lessons must be 2-10";
  if (!Array.isArray(cp.learning_objectives) || cp.learning_objectives.length < 3) return "needs >=3 learning_objectives";
  if (!cp.final_outcome || String(cp.final_outcome).length < 40) return "final_outcome too short";
  for (const l of lessons) {
    if (!l?.title) return "lesson missing title";
    if (!l?.objective) return "lesson missing objective";
    // Article body is the headline new requirement — 500-900 words target.
    // Accept either the new `article` field or the legacy `lesson` field for backwards compat.
    const body = String(l.article ?? l.lesson ?? "");
    if (body.length < 400) return "lesson article body too short (need ~500-900 words)";
    const opts = l.checkpoint_quiz?.options;
    if (!Array.isArray(opts) || opts.length < 3) return "quiz needs 3+ options";
    if (!opts.includes(l.checkpoint_quiz?.correct_answer)) return "quiz answer not in options";
  }
  return null;
}
function validateWorkflow(it: any): string | null {
  const b = validateBase(it, "workflow-"); if (b) return b;
  const steps = it.workflow_payload?.steps;
  if (!Array.isArray(steps) || steps.length < 3) return "needs >=3 steps";
  return requireArticleBlock(it);
}
function validateAgent(it: any): string | null {
  const b = validateBase(it, "agent-"); if (b) return b;
  const sys = it.agent_payload?.system_instructions;
  if (!sys || String(sys).length < 150) return "system_instructions too short";
  return requireArticleBlock(it);
}
function validateBusiness(it: any): string | null {
  const b = validateBase(it, "business-"); if (b) return b;
  if (!it.business_payload?.main_idea || String(it.business_payload.main_idea).length < 60) return "main_idea too short";
  return requireArticleBlock(it);
}
function validateInsight(it: any): string | null {
  const b = validateBase(it, "insight-"); if (b) return b;
  if (!it.insight_payload?.insight || String(it.insight_payload.insight).length < 100) return "insight too short";
  return requireArticleBlock(it);
}
function validateTool(it: any): string | null {
  const b = validateBase(it, "tool-"); if (b) return b;
  if (!it.tool_payload?.tool_name) return "missing tool_name";
  if (!it.tool_payload?.what_it_does || String(it.tool_payload.what_it_does).length < 50) return "what_it_does too short";
  return requireArticleBlock(it);
}
function validatePlaybook(it: any): string | null {
  const b = validateBase(it, "playbook-"); if (b) return b;
  const phases = it.playbook_payload?.phases;
  if (!Array.isArray(phases) || phases.length < 2) return "needs >=2 phases";
  return requireArticleBlock(it);
}
function validateChallenge(it: any): string | null {
  const b = validateBase(it, "challenge-"); if (b) return b;
  if (!it.challenge_payload?.instructions || String(it.challenge_payload.instructions).length < 100) return "instructions too short";
  return requireArticleBlock(it);
}
function validateCheatsheet(it: any): string | null {
  const b = validateBase(it, "cheatsheet-"); if (b) return b;
  const f = it.cheatsheet_payload?.framework;
  if (!Array.isArray(f) || f.length < 3) return "framework needs >=3 items";
  return requireArticleBlock(it);
}
// Legacy template validator — keep the old, fast, code-based shape
function validateTemplate(it: any): string | null {
  const b = validateBase(it, "template-"); if (b) return b;
  const code = String(it.code ?? "");
  if (code.length < 200) return "code too short";
  return null;
}

function validateGlossary(it: any): string | null {
  const b = validateBase(it, "glossary-"); if (b) return b;
  const gp = it.glossary_payload;
  if (!gp?.short_definition || String(gp.short_definition).length < 40) return "short_definition too short";
  if (!gp?.long_definition || String(gp.long_definition).length < 350) return "long_definition too short";
  // Examples + misconceptions make the entry citable
  if (!Array.isArray(gp.examples) || gp.examples.length < 2) return "needs >=2 examples";
  return null;
}
function validateEssay(it: any): string | null {
  const b = validateBase(it, "essay-"); if (b) return b;
  const ep = it.essay_payload;
  if (!ep?.hook || String(ep.hook).length < 200) return "hook too short";
  if (!ep?.closing || String(ep.closing).length < 100) return "closing too short";
  if (!Array.isArray(ep.sections) || ep.sections.length < 4) return "needs >=4 sections";
  for (const s of ep.sections) {
    if (!s?.heading || String(s.heading).length < 5) return "section heading missing";
    if (!s?.body || String(s.body).length < 250) return "section body too short";
  }
  if (!Array.isArray(ep.key_quotes) || ep.key_quotes.length < 2) return "needs >=2 key_quotes";
  return null;
}

/**
 * Diversity block appended to every prompt. Two big wins:
 *  1. AVOID list — the model sees recent titles + refuses to produce
 *     anything semantically similar. Crushes the dedupe rejection rate.
 *  2. Domain anchor — pins the call to ONE of the 50 domains so the
 *     model can't drift to its default favourites (prompt-engineering,
 *     ai-monetization).
 */
function buildDiversityBlock(avoidTitles: string[], anchorDomain: string, seed?: string): string {
  const avoidLines = avoidTitles.slice(0, 30).map((t) => ` - "${t}"`).join("\n");
  const seedLine = seed ? `\nGeneration seed (use for variety): ${seed}` : "";
  return `═══════════════════════════════════════════════════════════════════════
DIVERSITY DIRECTIVE — read this carefully:
═══════════════════════════════════════════════════════════════════════

[1] ANCHOR DOMAIN — for THIS call, every item you generate MUST set
    "domain": "${anchorDomain}". Pick a fresh, specific angle within that
    domain. Do not drift to a different domain.

[2] FORBIDDEN TITLES — these titles already exist in the library. Do
    NOT generate anything semantically similar to ANY of them. If your
    first idea matches one, discard it and try a different angle.
${avoidLines || "    (no existing titles yet)"}

[3] ORIGINALITY CHECK — before returning, ask yourself: "Could a user
    confuse this with an existing item?" If yes, rewrite.${seedLine}
═══════════════════════════════════════════════════════════════════════`;
}

const VALIDATORS: Record<ContentType, (it: any) => string | null> = {
  template: validateTemplate,
  prompt: validatePrompt,
  course: validateCourse,
  workflow: validateWorkflow,
  agent: validateAgent,
  business_lesson: validateBusiness,
  insight: validateInsight,
  tool_guide: validateTool,
  playbook: validatePlaybook,
  challenge: validateChallenge,
  cheatsheet: validateCheatsheet,
  glossary: validateGlossary,
  essay: validateEssay,
};

/* ===================================================================== */
/* Quality scoring (master prompt sec 25 — simplified)                    */
/* ===================================================================== */

function scoreItem(type: ContentType, it: any): { score: number; status: string } {
  // Completeness + DEPTH score 0-100. Items below QUALITY_PUBLISH_THRESHOLD (78)
  // stay as is_published=false and are never shown to users.
  //
  // Rubric philosophy: metadata (title/desc/tags) is table-stakes and only earns
  // a modest floor (~61 when fully present). The real points come from DEPTH —
  // long intros, multiple deep-dive sections, examples, lessons — so the score
  // genuinely discriminates a substantial item from a thin-but-valid one. A
  // fully-formed item lands 86-100; a skeleton that merely validates lands ~61-72
  // and gets held back. Type-aware because glossary/essay/course have different
  // payload shapes than the article-types.
  let score = 35; // base for passing schema validation

  // --- Metadata (table-stakes, capped contribution ~26) ---
  if (it.title && String(it.title).length > 8) score += 6;
  if (it.description && String(it.description).length > 50) score += 5;
  if (it.short_description) score += 3;
  if (it.tags?.length >= 3) score += 5;
  if (it.domain) score += 4;
  if (it.difficulty) score += 3;

  // === Type-specific DEPTH bonuses (where the real points live) ===

  if (type === "glossary") {
    const gp = it.glossary_payload ?? {};
    if (gp.long_definition?.length >= 350) score += 8;
    if (gp.long_definition?.length >= 600) score += 5;
    if (Array.isArray(gp.examples) && gp.examples.length >= 2) score += 7;
    if (Array.isArray(gp.examples) && gp.examples.length >= 3) score += 3;
    if (Array.isArray(gp.common_misconceptions) && gp.common_misconceptions.length >= 2) score += 5;
    if (Array.isArray(gp.related_terms) && gp.related_terms.length >= 3) score += 4;
    if (gp.first_use_year) score += 2;
  } else if (type === "essay") {
    const ep = it.essay_payload ?? {};
    if (ep.hook?.length >= 200) score += 6;
    if (ep.closing?.length >= 100) score += 4;
    if (Array.isArray(ep.sections) && ep.sections.length >= 4) score += 8;
    if (Array.isArray(ep.sections) && ep.sections.length >= 6) score += 5;
    if (Array.isArray(ep.key_quotes) && ep.key_quotes.length >= 2) score += 5;
    if (Array.isArray(ep.next_to_read) && ep.next_to_read.length >= 3) score += 3;
  } else if (type === "course") {
    // A course's substance lives in its LESSONS, not an `article` block (courses
    // don't carry one). The old rubric topped out at 74 for a complete, spec'd
    // 3-lesson course — below the 78 publish line — so every well-formed course
    // was silently held back. Score the things a good course actually has:
    // multiple lessons, substantial lesson bodies, a quiz gating each lesson,
    // worked examples, and the learning scaffold (objectives / outcome / prereqs).
    const cp = it.course_payload ?? {};
    const lessons = Array.isArray(cp.lessons) ? cp.lessons : [];
    if (lessons.length >= 3) score += 7;          // the spec'd micro-course format
    if (lessons.length >= 5) score += 3;          // bonus for longer paths
    const bodyLens = lessons.map((l: any) => String(l?.article ?? l?.lesson ?? "").length);
    const avgBody = bodyLens.length ? bodyLens.reduce((a: number, b: number) => a + b, 0) / bodyLens.length : 0;
    if (avgBody >= 500) score += 5;               // substantial lesson bodies
    if (avgBody >= 800) score += 3;               // genuinely long-form lessons
    const allQuizzed = lessons.length > 0 && lessons.every((l: any) =>
      Array.isArray(l?.checkpoint_quiz?.options) && l.checkpoint_quiz.options.length >= 3);
    if (allQuizzed) score += 4;                   // every lesson gated by a real quiz
    const withExample = lessons.filter((l: any) =>
      l?.example || (Array.isArray(l?.walkthrough_steps) && l.walkthrough_steps.length > 0)).length;
    if (lessons.length > 0 && withExample >= Math.ceil(lessons.length / 2)) score += 3;
    if (Array.isArray(cp.learning_objectives) && cp.learning_objectives.length >= 3) score += 3;
    if (cp.final_outcome && String(cp.final_outcome).length >= 40) score += 2;
    if (Array.isArray(cp.prerequisites) && cp.prerequisites.length >= 1) score += 2;
    if (cp.article) score += 4;                   // still a bonus if present — no longer required
  } else {
    // Article-type content (prompt/workflow/agent/business/insight/tool/playbook/challenge/cheatsheet)
    // The article block is REQUIRED for these, so depth inside it is weighted heavily.
    const a = getArticleBlock(it);
    if (a) {
      score += 8;
      if (a.intro?.length >= 450) score += 7;
      if (a.intro?.length >= 850) score += 3;
      if (Array.isArray(a.deep_dive) && a.deep_dive.length >= 2) score += 6;
      if (Array.isArray(a.deep_dive) && a.deep_dive.length >= 3) score += 4;
      if (Array.isArray(a.deep_dive) && a.deep_dive.length >= 4) score += 2;
      if (Array.isArray(a.stats) && a.stats.length >= 2) score += 3;
      if (a.comparison?.rows?.length >= 3) score += 3;
    }
    // Type-specific payload depth
    if (type === "prompt" && it.prompt_payload?.prompt?.length > 700) score += 4;
    if (type === "workflow" && it.workflow_payload?.steps?.length >= 5) score += 4;
    if (type === "agent" && it.agent_payload?.system_instructions?.length > 400) score += 4;
    if (type === "playbook" && it.playbook_payload?.phases?.length >= 4) score += 4;
  }

  if (score > 100) score = 100;

  // Labels align with the publish line: >=78 publishes ("good"+), 60-77 is held
  // ("needs_review"), and anything that barely validated ("failed") is dropped.
  let status: string;
  if (score >= 90) status = "excellent";
  else if (score >= 78) status = "good";
  else if (score >= 60) status = "needs_review";
  else status = "failed";
  return { score, status };
}

/* ===================================================================== */
/* OpenAI caller                                                           */
/* ===================================================================== */

async function callAI(apiKey: string, prompt: string): Promise<any> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are LaunchVault's senior content strategist. You write like a top tech-newsletter author — opinionated, specific, fluff-free. You return STRICT JSON only. No markdown fences. No prose outside the JSON. No 'leverage'. No 'unlock potential'. No 'in today's fast-paced world'. Every sentence earns its place.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      // 0.7 keeps openings varied without tipping gpt-4o into run-on
      // degeneration. JSON mode still enforces structure.
      temperature: 0.7,
      // Keep penalties low. High frequency/presence penalties push the model to
      // avoid repeating tokens, which spirals into rare-synonym word-salad
      // ("distinction disparity divergence nuance…") — exactly what we saw.
      frequency_penalty: 0.1,
      presence_penalty: 0.1,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const json: any = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty AI response");
  return JSON.parse(content);
}

/* ===================================================================== */
/* Insert helpers                                                          */
/* ===================================================================== */

/**
 * Canonicalise a title for fuzzy duplicate detection. Strips parens,
 * suffixes, punctuation, lowercases. So "RAG" and "RAG (Retrieval-Augmented
 * Generation)" both reduce to the same key.
 */
function titleKey(title: string): string {
  return String(title ?? "")
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")     // drop parenthetical
    .replace(/[^a-z0-9\s]/g, "")   // drop punctuation
    .replace(/\s+/g, " ")
    .trim();
}

async function insertItem(
  supabase: any,
  type: ContentType,
  raw: any,
  existingIds: Set<string>,
  existingSlugs: Set<string>,
  existingTitleKeys: Set<string>,
  stamp: string,
  idx: number,
  runId: string | undefined,
): Promise<{ ok: boolean; reason?: string }> {
  // Fuzzy duplicate guard
  const tKey = titleKey(raw.title);
  if (tKey && existingTitleKeys.has(`${type}:${tKey}`)) {
    return { ok: false, reason: `duplicate title (already have a ${type} matching "${raw.title}")` };
  }

  // Resolve unique id + slug
  const prefix = type === "business_lesson" ? "business" :
    type === "tool_guide" ? "tool" :
    type === "template" ? "template" :
    type;
  let id = String(raw.id || `${prefix}-${slugify(raw.title)}-${stamp}-${idx}`).slice(0, 120);
  if (existingIds.has(id)) id = `${id}-${idx}-${Math.random().toString(36).slice(2, 6)}`;
  let slug = slugify(raw.slug || raw.title || id);
  if (existingSlugs.has(slug)) slug = `${slug}-${stamp}-${idx}`;
  if (existingSlugs.has(slug)) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

  // Enforce the free-content gate: non-eligible types can never publish as
  // "free" — bump them to the entry paid tier. (Only glossary/essay/insight
  // keep whatever the model chose, including free; prompts are now paid-only.)
  if (raw.tier_required === "free" && !FREE_ELIGIBLE_TYPES.has(type)) {
    raw.tier_required = "tier1";
  }

  const tier = raw.tier_required;
  const { score, status } = scoreItem(type, raw);

  // Tier-scaled publish gate: the higher the tier, the higher the depth bar.
  // The schema validators already enforce the structural floor; this gate
  // sits on top of scoreItem's DEPTH points (extra deep-dive sections, stats,
  // comparison rows, longer intros) — the very things that separate a thin
  // skeleton from a substantial piece. Because those depth points are exactly
  // what a paying tier should buy, raising the bar per tier means a higher
  // tier literally cannot publish unless it is genuinely deeper.
  //
  // Free is INTENTIONALLY thin now (one framing deep-dive section, how-to gated),
  // so its publish bar sits below paid: a tight, complete-but-shallow free item
  // (full metadata + 450+ intro + 1 real section ≈ 74-78) clears, while a true
  // skeleton (no real intro/section ≈ 69) is still held back. Paid bars stay high
  // so a paying tier literally cannot publish unless it is genuinely deeper.
  const TIER_PUBLISH_THRESHOLD: Record<string, number> = {
    free: 74,
    tier1: 82,
    tier2: 86,
    tier3: 90,
  };
  const publishBar = TIER_PUBLISH_THRESHOLD[tier] ?? 78;
  const willPublish = score >= publishBar;

  // Build content_items row
  const itemRow: Record<string, any> = {
    id,
    slug,
    type,
    course_size: type === "course" ? "mini" : null,
    title: String(raw.title).slice(0, 200),
    description: String(raw.description ?? "").slice(0, 2000),
    short_description: raw.short_description ? String(raw.short_description).slice(0, 200) : null,
    preview_text: String(raw.preview_text ?? raw.short_description ?? "").slice(0, 4000),
    category: slugify(String(raw.category ?? "general")) || "general",
    domain: raw.domain ?? null,
    tier_required: tier,
    is_published: willPublish,
    is_featured: false,
    is_daily: type === "insight" && willPublish,
    estimated_minutes:
      typeof raw.estimated_minutes === "number"
        ? Math.max(1, Math.min(60, raw.estimated_minutes))
        : null,
    difficulty:
      VALID_DIFFICULTY.has(raw.difficulty)
        ? raw.difficulty
        : tier === "tier3" ? "advanced" : tier === "tier2" ? "intermediate" : "beginner",
    tags: Array.isArray(raw.tags) ? raw.tags.map((t: any) => String(t).slice(0, 40)).slice(0, 20) : [],
    quality_score: score,
    quality_status: status,
    generated_by: "openai:gpt-4o",
    generated_at: new Date().toISOString(),
  };

  const { error: itemErr } = await supabase.from("content_items").insert(itemRow);
  if (itemErr) return { ok: false, reason: itemErr.message };

  // Build content_payloads row
  const payloadRow: Record<string, any> = { content_id: id };
  const payloadCol = PAYLOAD_COL[type];
  const extra: Record<string, any> = {};

  if (type === "template") {
    payloadRow.code = String(raw.code ?? "");
    payloadRow.preview_html = String(raw.ui_preview?.preview_html ?? "");
    extra.ui_preview = raw.ui_preview ?? null;
    extra.implementation_notes = raw.implementation_notes ?? [];
    extra.design_quality_checklist = raw.design_quality_checklist ?? [];
    extra.code_language = raw.code_language ?? "tsx";
  } else if (type === "prompt") {
    const pp = raw.prompt_payload ?? {};
    payloadRow.prompt = String(pp.prompt ?? "");
    extra.prompt_summary = pp.prompt_summary ?? "";
    extra.best_for = pp.best_for ?? [];
    extra.inputs = pp.inputs ?? [];
    extra.output_format = pp.output_format ?? "";
    extra.usage_steps = pp.usage_steps ?? [];
    extra.quality_checklist = pp.quality_checklist ?? [];
    extra.example_use_case = pp.example_use_case ?? "";
    extra.variations = pp.variations ?? [];
    extra.common_mistakes = pp.common_mistakes ?? [];
    // Article-grade enrichment (intro/takeaways/deep_dive/stats/comparison/pull_quote/related_reading)
    extra.article = pp.article ?? null;
  } else if (type === "course") {
    const cp = raw.course_payload ?? {};
    payloadRow.course_sections = cp.lessons ?? [];
    extra.learning_objectives = cp.learning_objectives ?? [];
    extra.prerequisites = cp.prerequisites ?? [];
    extra.final_outcome = cp.final_outcome ?? "";
    extra.article = cp.article ?? null;
  } else if (type === "glossary") {
    const gp = raw.glossary_payload ?? {};
    extra.term = gp.term ?? raw.title;
    extra.short_definition = gp.short_definition ?? "";
    extra.long_definition = gp.long_definition ?? "";
    extra.examples = gp.examples ?? [];
    extra.common_misconceptions = gp.common_misconceptions ?? [];
    extra.related_terms = gp.related_terms ?? [];
    extra.first_use_year = gp.first_use_year ?? null;
    extra.synonyms = gp.synonyms ?? [];
  } else if (type === "essay") {
    const ep = raw.essay_payload ?? {};
    extra.hook = ep.hook ?? "";
    extra.tldr = ep.tldr ?? "";
    extra.sections = ep.sections ?? [];
    extra.key_quotes = ep.key_quotes ?? [];
    extra.closing = ep.closing ?? "";
    extra.next_to_read = ep.next_to_read ?? [];
    extra.author = brandFounderName();
  } else if (payloadCol) {
    payloadRow[payloadCol] = raw[`${type === "business_lesson" ? "business" : type === "tool_guide" ? "tool" : type}_payload`] ?? {};
  }
  payloadRow.extra = extra;

  const { error: payErr } = await supabase.from("content_payloads").insert(payloadRow);
  if (payErr) {
    // best-effort rollback
    await supabase.from("content_items").delete().eq("id", id);
    return { ok: false, reason: payErr.message };
  }

  existingIds.add(id);
  existingSlugs.add(slug);
  if (tKey) existingTitleKeys.add(`${type}:${tKey}`);
  void runId; // reserved for future per-run linkage
  return { ok: true };
}

/* ===================================================================== */
/* In-process generation core                                             */
/* ===================================================================== */

/**
 * Generate content IN-PROCESS (no HTTP). This is the real engine.
 *
 * WHY THIS EXISTS: a Cloudflare Worker cannot reliably `fetch()` its own
 * public hostname — self-loopback subrequests are dropped before they reach
 * the handler. That is the bug that made the cron "fire but produce nothing":
 * the scheduled handler was POSTing to https://launchvault.ca/.../auto-generate
 * (itself) and every one of those subrequests silently failed.
 *
 * So both the scheduled() cron AND the manual trigger-cron route now call
 * THIS function directly instead of dispatching HTTP back to themselves.
 * The POST handler below is just a thin auth + param-parsing wrapper over it.
 */
/**
 * Enforce the tier distribution regardless of what the model picks.
 *
 * Free is deliberately THIN — only the daily hook + SEO surfaces are free, so
 * the paywall does the converting. Everything actionable is paid, scaled by
 * difficulty. (Matches FREE_ELIGIBLE_TYPES above — prompts, courses, agents,
 * workflows, etc. are never free.)
 *
 *  - insight / glossary / essay  → always FREE (daily hook + SEO/AEO content)
 *  - everything else             → PAID: beginner+intermediate tier1 · advanced tier2/tier3
 */
function enforceTier(type: ContentType, difficulty?: string): Tier {
  if (type === "insight" || type === "glossary" || type === "essay") return "free";
  // All other types — prompts, courses, agents, workflows, business lessons,
  // tool guides, playbooks, challenges, cheatsheets — are paid.
  if (difficulty === "beginner" || difficulty === "intermediate") return "tier1";
  return Math.random() < 0.45 ? "tier2" : "tier3"; // advanced → premium
}

export async function generateContentInProcess(opts: {
  jobs: Array<{ type: ContentType; count: number }>;
  tier?: Tier;
  trigger?: string;
  domain?: string;
  seed?: string;
  /**
   * Secrets source. In the scheduled() cron context, Cloudflare delivers
   * secrets via the handler's `env` argument and `process.env` may be empty —
   * so the cron passes `env` explicitly. In a normal fetch (POST / trigger-cron)
   * `process.env` is populated, so this can be omitted.
   */
  env?: Record<string, string | undefined>;
}): Promise<{
  ok: boolean;
  error?: string;
  run_id?: string;
  inserted: number;
  rejected: number;
  summary: Record<string, { inserted: number; rejected: number }>;
  failures: Array<{ type: string; reason: string }>;
}> {
  const secrets = opts.env ?? (process.env as Record<string, string | undefined>);
  const aiKey = secrets.OPENAI_API_KEY;
  const supabaseUrl = secrets.SUPABASE_URL;
  const serviceKey = secrets.SUPABASE_SERVICE_ROLE_KEY;
  if (!aiKey || !supabaseUrl || !serviceKey) {
    return {
      ok: false,
      error: "missing env (OPENAI_API_KEY / SUPABASE_*)",
      inserted: 0,
      rejected: 0,
      summary: {},
      failures: [],
    };
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: existing } = await supabase
    .from("content_items")
    .select("id, slug, type, title");
  const existingIds = new Set<string>((existing ?? []).map((r: any) => r.id));
  const existingSlugs = new Set<string>(
    (existing ?? []).map((r: any) => r.slug).filter(Boolean),
  );
  // Fuzzy dedupe set, keyed by `${type}:${normalized_title}`
  const existingTitleKeys = new Set<string>(
    (existing ?? [])
      .map((r: any) => (r.title ? `${r.type}:${titleKey(r.title)}` : null))
      .filter((k: string | null): k is string => !!k),
  );

  const jobs = opts.jobs;
  const wantedTier = opts.tier;
  const triggerVal = opts.trigger ?? "manual";
  const wantedDomain = opts.domain;
  const wantedSeed = opts.seed;

  const stamp = Date.now().toString(36);

  // Log run start
  const { data: runRow } = await supabase
    .from("content_generation_runs")
    .insert({
      trigger: triggerVal,
      status: "running",
      model: "gpt-4o",
      requested_types: jobs.map((j) => j.type),
    })
    .select("id")
    .single();
  const runId = runRow?.id as string | undefined;

  const summary: Record<string, { inserted: number; rejected: number }> = {};
  const failures: Array<{ type: string; reason: string }> = [];

  for (const job of jobs) {
    summary[job.type] = { inserted: 0, rejected: 0 };
    const builder = PROMPT_BUILDERS[job.type];
    if (!builder) continue;

    // Fetch recent titles for this type so the model can avoid duplicating them.
    const { data: recentTitles } = await supabase
      .from("content_items")
      .select("title")
      .eq("type", job.type)
      .order("created_at", { ascending: false })
      .limit(40);
    const avoidList = (recentTitles ?? [])
      .map((r: any) => r.title)
      .filter(Boolean) as string[];

    // Pick a random domain to anchor this call IF one wasn't specified.
    const anchorDomain =
      wantedDomain ||
      ALL_DOMAIN_SLUGS[Math.floor(Math.random() * ALL_DOMAIN_SLUGS.length)];

    const basePromptText = builder(stamp, job.count, wantedTier ?? undefined);
    if (!basePromptText) continue;

    const diversityBlock = buildDiversityBlock(avoidList, anchorDomain, wantedSeed);
    const promptText = basePromptText + "\n\n" + diversityBlock;
    try {
      const aiJson = await callAI(aiKey, promptText);
      const key = RESULT_KEY[job.type];
      const items: any[] = aiJson?.[key] ?? [];
      const prefix =
        job.type === "business_lesson"
          ? "business-"
          : job.type === "tool_guide"
            ? "tool-"
            : `${job.type}-`;
      for (let i = 0; i < items.length; i++) {
        const item = repairItem(items[i], prefix, stamp, i);
        // Override the model's tier pick with our free-heavy distribution.
        item.tier_required = enforceTier(job.type, item.difficulty);
        const verr = VALIDATORS[job.type](item);
        if (verr) {
          summary[job.type].rejected++;
          failures.push({ type: job.type, reason: verr });
          continue;
        }
        const r = await insertItem(
          supabase,
          job.type,
          item,
          existingIds,
          existingSlugs,
          existingTitleKeys,
          stamp,
          i,
          runId,
        );
        if (r.ok) summary[job.type].inserted++;
        else {
          summary[job.type].rejected++;
          failures.push({ type: job.type, reason: r.reason ?? "insert failed" });
        }
      }
    } catch (e: any) {
      failures.push({ type: job.type, reason: e?.message ?? "openai failed" });
    }
  }

  const inserted = Object.values(summary).reduce((a, s) => a + s.inserted, 0);
  const rejected = Object.values(summary).reduce((a, s) => a + s.rejected, 0);

  if (runId) {
    await supabase
      .from("content_generation_runs")
      .update({
        status: failures.length === 0 ? "success" : inserted > 0 ? "partial" : "failed",
        inserted_count: inserted,
        rejected_count: rejected,
        summary: summary as any,
        error: failures.length
          ? failures.slice(0, 12).map((f) => `${f.type}: ${f.reason}`).join(" | ")
          : null,
        finished_at: new Date().toISOString(),
      })
      .eq("id", runId);
  }

  return { ok: true, run_id: runId, inserted, rejected, summary, failures };
}

/* ===================================================================== */
/* Route                                                                   */
/* ===================================================================== */

export const Route = createFileRoute("/api/public/hooks/auto-generate-content")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Auth: prefer INTERNAL_CRON_SECRET. Fall back to legacy apikey header.
        const cronHeader = request.headers.get("x-internal-cron-secret");
        const apikey = request.headers.get("apikey");
        const internalSecret = process.env.INTERNAL_CRON_SECRET;
        const expectedApikey =
          process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY;

        const isCronAuthed = !!internalSecret && cronHeader === internalSecret;
        const isLegacyAuthed = !!expectedApikey && apikey === expectedApikey;
        if (!isCronAuthed && !isLegacyAuthed) {
          return json({ error: "Unauthorized" }, 401);
        }

        const url = new URL(request.url);
        const wantedType = url.searchParams.get("type") as ContentType | null;
        const wantedTier = url.searchParams.get("tier") as Tier | null;
        const wantedCount = Number(url.searchParams.get("count")) || undefined;
        const triggerVal = (url.searchParams.get("trigger") ?? (isCronAuthed ? "cron" : "manual")) as string;
        const wantedDomain = url.searchParams.get("domain") || undefined;
        const wantedSeed = url.searchParams.get("seed") || undefined;
        const wantedBg = url.searchParams.get("bg") === "1";

        // Build job list
        const jobs: Array<{ type: ContentType; count: number }> = [];
        if (wantedType) {
          jobs.push({ type: wantedType, count: wantedCount ?? TYPE_COUNT_DEFAULT[wantedType] });
        } else {
          for (const [t, n] of Object.entries(RUN_DISTRIBUTION)) {
            jobs.push({ type: t as ContentType, count: n ?? 1 });
          }
        }

        // Background mode (?bg=1): schedule generation via waitUntil and return
        // immediately. An external cron (cron-job.org) then gets a fast 200
        // instead of holding the connection open ~29s/item and risking a
        // request timeout. The Worker keeps running until generation settles.
        const ctx = getRequestExecCtx();
        if (wantedBg && ctx?.waitUntil) {
          ctx.waitUntil(
            generateContentInProcess({
              jobs,
              tier: wantedTier ?? undefined,
              trigger: triggerVal,
              domain: wantedDomain,
              seed: wantedSeed,
            }).catch((e) => console.error("bg generation failed:", e)),
          );
          return json({
            success: true,
            mode: "background",
            requested: jobs.map((j) => `${j.type}x${j.count}`),
            note: "Generating in background. Check content_items / content_generation_runs.",
          });
        }

        // Delegate to the in-process engine (the POST handler is just a thin
        // auth + param-parsing shell — see generateContentInProcess above).
        const result = await generateContentInProcess({
          jobs,
          tier: wantedTier ?? undefined,
          trigger: triggerVal,
          domain: wantedDomain,
          seed: wantedSeed,
        });
        if (!result.ok) return json({ error: result.error }, 500);

        return json({
          success: true,
          run_id: result.run_id,
          timestamp: new Date().toISOString(),
          inserted: result.inserted,
          rejected: result.rejected,
          summary: result.summary,
          failures: result.failures.slice(0, 30),
        });
      },
    },
  },
});

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Suppress unused-import warning while leaving DOMAINS imported (used in prompt text builder).
void DOMAINS;
