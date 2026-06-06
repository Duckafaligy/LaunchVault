// =====================================================================
// LAUNCHVAULT — Brand configuration
// Learn better prompts. Build faster. Launch smarter.
// =====================================================================

export const brand = {
  brandName: "LAUNCHVAULT",
  tagline: "Your AI Mastery Engine.",
  homepageHeadline: "Your AI Mastery Engine.",
  homepageSubheadline:
    "LaunchVault is an AI learning platform that teaches you how to learn AI and actually use it. An AI drafts prompts, courses, agents, and insights across 50 AI domains every two hours — then a quality gate scores each one and publishes only what passes. You start from the good stuff, not a blank prompt box.",
  /**
   * SEO keyword targeting. These titles/descriptions lead with category
   * search terms (AI learning platform, learn AI, how to learn AI) instead of
   * brand-only copy, so Google can rank us for what people actually search.
   */
  seo: {
    homeTitle: "LaunchVault — AI Learning Platform to Learn & Master AI",
    homeDescription:
      "LaunchVault is the AI learning platform that teaches you how to learn AI and use it for real work — copy-ready prompts, courses, AI agents, and guides across 50 domains, refreshed every 2 hours. Start free, no credit card.",
    keywords: [
      "AI learning platform",
      "learn AI",
      "how to learn AI",
      "learn to use AI",
      "learn artificial intelligence",
      "AI courses online",
      "prompt engineering",
      "AI prompt library",
      "learn AI agents",
      "AI skills",
    ],
  },
  primaryAccent: "#6366F1",
  secondaryAccent: "#10B981",
  supportEmail: "launchvaultcanada@gmail.com",
  /**
   * Brand voice profile — used by:
   *  - Autonomous blog/essay generator (writes in editorial voice)
   *  - Article schema author bylines
   *  - llms.txt citation guidance
   *  - About-the-team UI elements
   *
   * Intentionally anonymous — public surfaces credit the LaunchVault
   * Editorial Team, not any individual. Keeps the brand professional.
   */
  founder: {
    name: "LaunchVault Editorial",
    role: "Editorial Team",
    bio: "The LaunchVault editorial team. We publish opinionated, specific, fluff-free AI mastery content across 50 domains — prompting, agents, business, automation, ML, and content — refreshed every two hours and held to a strict quality bar before anything goes live.",
    voiceTraits: [
      "Direct, opinionated, fluff-free",
      "We voice (editorial 'we', not first-person 'I')",
      "Reads Stratechery, Lenny's Newsletter, Hacker News",
      "Sceptical of AI hype, obsessed with what actually ships",
      "Specifics over abstractions — names tools, cites numbers",
      "Honest about mistakes and trade-offs",
    ],
    voiceAvoid: [
      "Generic 'we're excited to announce' openers",
      "Corporate cheerleading ('thrilled', 'humbled', 'inspired')",
      "Hedging language ('it might be worth considering')",
      "AI clichés ('leverage', 'revolutionize', 'game-changer')",
      "First-person personal stories ('when I was 23...')",
      "Any reference to a specific named founder, person, or location",
    ],
    signatureLines: [
      "Here's what actually works:",
      "The honest truth is",
      "Nobody talks about this but",
      "The expensive way to learn this is",
      "Counter-intuitive take:",
    ],
  },
  social: {
    // Instagram is the live channel. Account: launchvault.ca (formerly "Forged in Greatness").
    // If the @handle is ever renamed back, just swap the path below — nothing else depends on it.
    instagram: "https://instagram.com/launchvault.ca",
    github: "https://github.com/launchvault",
    youtube: "https://youtube.com/@launchvault",
  },
  hero: {
    eyebrow: "The self-growing AI learning platform",
    headline: "Your AI Mastery Engine.",
    subheadline:
      "The AI learning platform that turns the firehose of AI into a ranked daily feed — prompting, agents, automation, business, and ML basics, scored and filtered before it reaches you, across 50 domains refreshed every two hours.",
    primaryCta: { label: "Start Free", to: "/signup" },
    secondaryCta: { label: "Explore the Vault", to: "/pricing" },
  },
  ctas: {
    primary: "Start Free",
    secondary: "View Pricing",
    upgrade: "Upgrade",
    manageBilling: "Manage Billing",
  },
  features: {
    prompts: "A growing library of copy-ready prompts for every workflow.",
    courses: "Bite-sized prompt courses you finish in a sitting.",
    labs: "Hands-on practice labs that teach you to improve any prompt.",
    quest: "A daily Prompt Quest to keep your streak alive.",
  },
  pricing: {
    free: {
      name: "Free",
      tierKey: "free" as const,
      priceLabel: "$0",
      period: "forever",
      tagline: "Start learning. No credit card.",
      features: [
        "Daily AI prompts",
        "Daily AI insights",
        "Full glossary + blog (always free)",
        "Save up to 10 items",
      ],
      cta: { label: "Start Free", to: "/signup" },
    },
    tier1: {
      name: "Starter",
      tierKey: "tier1" as const,
      priceId: "tier1_monthly_v4" as const,
      priceLabel: "$5",
      period: "per month",
      tagline: "For learners getting serious about AI mastery.",
      features: [
        "Full prompt library",
        "All daily insights",
        "All workflows",
        "Beginner + intermediate courses",
        "Save unlimited items",
        "Personalized feed",
      ],
      cta: { label: "Choose Starter", to: "/dashboard/account" },
    },
    tier2: {
      name: "Creator",
      tierKey: "tier2" as const,
      priceId: "tier2_monthly_v4" as const,
      priceLabel: "$12",
      originalPriceLabel: "$24",
      discountPercent: 50,
      period: "per month",
      tagline: "The plan most creators and founders pick.",
      features: [
        "Everything in Starter",
        "Full micro-courses",
        "Full agent blueprints",
        "Full business lessons",
        "Tool guides + playbooks + challenges",
        "Advanced personalization",
      ],
      cta: { label: "Choose Creator", to: "/dashboard/account" },
      highlighted: true,
    },
    tier3: {
      name: "Pro",
      tierKey: "tier3" as const,
      priceId: "tier3_monthly_v3" as const,
      priceLabel: "$30",
      originalPriceLabel: "$39",
      discountPercent: 23,
      period: "per month",
      tagline: "For builders shipping AI-powered products every week.",
      features: [
        "Everything in Creator",
        "Premium AI categories",
        "Advanced agent blueprints",
        "Advanced business models",
        "Early access to new drops",
        "Full archive access",
        "Priority feed",
      ],
      cta: { label: "Choose Pro", to: "/dashboard/account" },
    },
  },
} as const;

export type Brand = typeof brand;
export const TIER_LABEL: Record<"free" | "tier1" | "tier2" | "tier3" | "tier4", string> = {
  free: "Free",
  tier1: "Starter",
  tier2: "Creator",
  tier3: "Pro",
  tier4: "Master",
};
