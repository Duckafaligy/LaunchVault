// =====================================================================
// LAUNCHVAULT — 50 AI Mastery Domains
// Used by content tagging, filtering, landing-page domain grid, OpenAI
// content generation. The slug is what gets stored in content_items.domain.
// =====================================================================

export type DomainSlug =
  | "ai-prompting-mastery"
  | "prompt-engineering-fundamentals"
  | "advanced-prompt-engineering"
  | "ai-for-business"
  | "ai-business-models"
  | "ai-monetization"
  | "ai-automation-workflows"
  | "no-code-ai-automation"
  | "ai-agents-blueprints"
  | "multi-agent-systems"
  | "agent-memory-tool-use"
  | "machine-learning-basics"
  | "deep-learning-basics"
  | "data-literacy-for-ai"
  | "ai-coding-development"
  | "ai-app-building"
  | "ai-saas-building"
  | "ai-productivity"
  | "ai-content-creation"
  | "ai-copywriting"
  | "ai-marketing"
  | "ai-sales"
  | "ai-customer-support"
  | "ai-research"
  | "ai-for-students"
  | "ai-for-creators"
  | "ai-for-agencies"
  | "ai-for-freelancers"
  | "ai-for-founders"
  | "ai-for-ecommerce"
  | "ai-for-local-businesses"
  | "ai-for-finance-operations"
  | "ai-for-hr-recruiting"
  | "ai-for-education"
  | "ai-for-healthcare-concepts"
  | "ai-ethics-safety"
  | "ai-privacy-security"
  | "ai-tool-reviews"
  | "ai-tool-workflows"
  | "ai-news-daily-insights"
  | "ai-strategy"
  | "ai-product-management"
  | "ai-ux-interface-design"
  | "ai-image-generation"
  | "ai-video-generation"
  | "ai-voice-audio"
  | "ai-search-rag"
  | "ai-data-analysis"
  | "ai-workflow-optimization"
  | "ai-future-trends";

export type DomainGroupSlug =
  | "prompting"
  | "business"
  | "automation"
  | "agents"
  | "ml"
  | "coding"
  | "productivity"
  | "personas"
  | "industries"
  | "safety"
  | "tools"
  | "strategy"
  | "media"
  | "data";

export type Domain = {
  slug: DomainSlug;
  label: string;
  group: DomainGroupSlug;
  description: string;
};

export const DOMAINS: Domain[] = [
  // Prompting
  { slug: "ai-prompting-mastery", label: "AI Prompting Mastery", group: "prompting",
    description: "End-to-end prompting skill — from clarity to control." },
  { slug: "prompt-engineering-fundamentals", label: "Prompt Engineering Fundamentals", group: "prompting",
    description: "The building blocks every prompter needs." },
  { slug: "advanced-prompt-engineering", label: "Advanced Prompt Engineering", group: "prompting",
    description: "Chains, evals, structured outputs, prompt programs." },

  // Business
  { slug: "ai-for-business", label: "AI for Business", group: "business",
    description: "Apply AI to real business problems." },
  { slug: "ai-business-models", label: "AI Business Models", group: "business",
    description: "What models actually work for AI products." },
  { slug: "ai-monetization", label: "AI Monetization", group: "business",
    description: "Turn AI capabilities into recurring revenue." },

  // Automation
  { slug: "ai-automation-workflows", label: "AI Automation & Workflows", group: "automation",
    description: "Replace repetitive work with AI workflows." },
  { slug: "no-code-ai-automation", label: "No-Code AI Automation", group: "automation",
    description: "Build with n8n, Make, Zapier + AI." },

  // Agents
  { slug: "ai-agents-blueprints", label: "AI Agents & Blueprints", group: "agents",
    description: "Design and ship single-purpose agents." },
  { slug: "multi-agent-systems", label: "Multi-Agent Systems", group: "agents",
    description: "Coordinate multiple agents on real work." },
  { slug: "agent-memory-tool-use", label: "Agent Memory & Tool Use", group: "agents",
    description: "Give agents memory and the right tools." },

  // ML
  { slug: "machine-learning-basics", label: "Machine Learning Basics", group: "ml",
    description: "The concepts behind every AI system." },
  { slug: "deep-learning-basics", label: "Deep Learning Basics", group: "ml",
    description: "Neural networks made simple." },
  { slug: "data-literacy-for-ai", label: "Data Literacy for AI", group: "ml",
    description: "Read, clean, and reason about data." },

  // Coding
  { slug: "ai-coding-development", label: "AI Coding & Development", group: "coding",
    description: "Ship code faster with AI pair-programming." },
  { slug: "ai-app-building", label: "AI App Building", group: "coding",
    description: "Build apps with AI as a co-developer." },
  { slug: "ai-saas-building", label: "AI SaaS Building", group: "coding",
    description: "Launch AI-native SaaS from idea to revenue." },

  // Productivity
  { slug: "ai-productivity", label: "AI Productivity & Personal Use", group: "productivity",
    description: "Daily AI workflows that buy back your time." },
  { slug: "ai-content-creation", label: "AI Content Creation", group: "media",
    description: "Ideate, draft, and ship content with AI." },
  { slug: "ai-copywriting", label: "AI Copywriting", group: "media",
    description: "Persuasive copy with AI as your editor." },
  { slug: "ai-marketing", label: "AI Marketing", group: "business",
    description: "Marketing motions powered by AI." },
  { slug: "ai-sales", label: "AI Sales", group: "business",
    description: "Sales workflows that close more deals." },
  { slug: "ai-customer-support", label: "AI Customer Support", group: "business",
    description: "Faster, smarter customer support with AI." },
  { slug: "ai-research", label: "AI Research", group: "productivity",
    description: "Use AI to go deeper, faster." },

  // Personas
  { slug: "ai-for-students", label: "AI for Students", group: "personas",
    description: "Study, learn, and ship with AI." },
  { slug: "ai-for-creators", label: "AI for Creators", group: "personas",
    description: "Compound your creative output." },
  { slug: "ai-for-agencies", label: "AI for Agencies", group: "personas",
    description: "Scale agency work without scaling headcount." },
  { slug: "ai-for-freelancers", label: "AI for Freelancers", group: "personas",
    description: "Charge more, deliver faster, with AI." },
  { slug: "ai-for-founders", label: "AI for Founders", group: "personas",
    description: "Operate like a 10-person company alone." },

  // Industries
  { slug: "ai-for-ecommerce", label: "AI for E-commerce", group: "industries",
    description: "AI in stores, ads, fulfilment, and CX." },
  { slug: "ai-for-local-businesses", label: "AI for Local Businesses", group: "industries",
    description: "AI plays for service & local brands." },
  { slug: "ai-for-finance-operations", label: "AI for Finance & Operations", group: "industries",
    description: "Finance, ops, and back-office with AI." },
  { slug: "ai-for-hr-recruiting", label: "AI for HR & Recruiting", group: "industries",
    description: "Hire, onboard, and retain with AI." },
  { slug: "ai-for-education", label: "AI for Education", group: "industries",
    description: "Teaching and learning with AI." },
  { slug: "ai-for-healthcare-concepts", label: "AI for Healthcare Concepts", group: "industries",
    description: "Educational concepts — not medical advice." },

  // Safety
  { slug: "ai-ethics-safety", label: "AI Ethics & Safety", group: "safety",
    description: "Use AI responsibly and honestly." },
  { slug: "ai-privacy-security", label: "AI Privacy & Security", group: "safety",
    description: "Protect data and users when using AI." },

  // Tools
  { slug: "ai-tool-reviews", label: "AI Tool Reviews", group: "tools",
    description: "What's actually worth using." },
  { slug: "ai-tool-workflows", label: "AI Tool Workflows", group: "tools",
    description: "Real workflows in real tools." },

  // Strategy
  { slug: "ai-news-daily-insights", label: "AI News & Daily Insights", group: "strategy",
    description: "Daily intelligence on AI shifts." },
  { slug: "ai-strategy", label: "AI Strategy", group: "strategy",
    description: "How to bet, prioritize, and ship with AI." },
  { slug: "ai-product-management", label: "AI Product Management", group: "strategy",
    description: "PM craft when AI is in the product." },
  { slug: "ai-ux-interface-design", label: "AI UX & Interface Design", group: "strategy",
    description: "Designing for AI-native products." },

  // Media
  { slug: "ai-image-generation", label: "AI Image Generation", group: "media",
    description: "From concept to final image, with AI." },
  { slug: "ai-video-generation", label: "AI Video Generation", group: "media",
    description: "Generate, edit, and remix video with AI." },
  { slug: "ai-voice-audio", label: "AI Voice & Audio", group: "media",
    description: "Voices, narration, music, podcasts." },

  // Data
  { slug: "ai-search-rag", label: "AI Search & RAG", group: "data",
    description: "Retrieval-augmented generation, done right." },
  { slug: "ai-data-analysis", label: "AI Data Analysis", group: "data",
    description: "Let AI read, query, and chart your data." },
  { slug: "ai-workflow-optimization", label: "AI Workflow Optimization", group: "data",
    description: "Spot inefficiencies; insert AI where it pays." },
  { slug: "ai-future-trends", label: "AI Future Trends", group: "strategy",
    description: "What's coming, and what to do about it." },
];

export const DOMAIN_BY_SLUG: Record<DomainSlug, Domain> = Object.fromEntries(
  DOMAINS.map((d) => [d.slug, d]),
) as Record<DomainSlug, Domain>;

export type DomainGroup = {
  slug: DomainGroupSlug;
  label: string;
  blurb: string;
  accent: string;
  domains: Domain[];
};

const GROUP_META: Record<DomainGroupSlug, { label: string; blurb: string; accent: string }> = {
  prompting:     { label: "Prompting",      blurb: "Master the craft of talking to AI.",          accent: "from-violet-600 to-fuchsia-500" },
  business:      { label: "Business",       blurb: "Make AI pay for itself, and then some.",      accent: "from-emerald-600 to-teal-500" },
  automation:    { label: "Automation",     blurb: "Replace toil with workflows.",                accent: "from-sky-500 to-indigo-500" },
  agents:        { label: "Agents",         blurb: "Build single-purpose agents that work.",      accent: "from-fuchsia-600 to-pink-500" },
  ml:            { label: "ML Foundations", blurb: "Concepts under every AI system.",             accent: "from-blue-600 to-cyan-500" },
  coding:        { label: "Coding & SaaS",  blurb: "Ship products with AI in the loop.",          accent: "from-amber-500 to-orange-500" },
  productivity:  { label: "Productivity",   blurb: "Compound your output with AI.",               accent: "from-orange-500 to-rose-500" },
  personas:      { label: "By Persona",     blurb: "AI for the role you actually play.",          accent: "from-cyan-500 to-blue-500" },
  industries:    { label: "By Industry",    blurb: "Domain-specific AI plays.",                   accent: "from-teal-500 to-emerald-500" },
  safety:        { label: "Safety & Ethics",blurb: "Use AI responsibly.",                         accent: "from-rose-500 to-red-500" },
  tools:         { label: "AI Tools",       blurb: "What to use, what to skip.",                  accent: "from-zinc-700 to-zinc-900" },
  strategy:      { label: "Strategy",       blurb: "Where AI is going and how to bet.",           accent: "from-indigo-600 to-violet-600" },
  media:         { label: "Media",          blurb: "Visuals, video, voice — all with AI.",        accent: "from-pink-500 to-rose-500" },
  data:          { label: "Data & Search",  blurb: "RAG, analysis, and AI on top of your data.",  accent: "from-lime-500 to-emerald-500" },
};

export const DOMAIN_GROUPS: DomainGroup[] = (Object.keys(GROUP_META) as DomainGroupSlug[]).map((g) => ({
  slug: g,
  label: GROUP_META[g].label,
  blurb: GROUP_META[g].blurb,
  accent: GROUP_META[g].accent,
  domains: DOMAINS.filter((d) => d.group === g),
}));

export const ALL_DOMAIN_SLUGS = DOMAINS.map((d) => d.slug);

export function isDomainSlug(s: string | null | undefined): s is DomainSlug {
  return !!s && ALL_DOMAIN_SLUGS.includes(s as DomainSlug);
}

export function domainLabel(slug: string | null | undefined): string {
  if (!slug) return "";
  return DOMAIN_BY_SLUG[slug as DomainSlug]?.label ?? slug;
}
