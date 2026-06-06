// =====================================================================
// LaunchVault — SEO helpers
// Builds OpenGraph, Twitter card, canonical, and JSON-LD meta blocks
// used by TanStack Start's route head() function.
// =====================================================================

import { brand } from "@/config/brand";

const SITE_URL = "https://launchvault.ca";
const OG_IMAGE = `${SITE_URL}/og-default.png`; // 1200x630 brand image (provided via static asset)
const TWITTER_HANDLE = "@launchvault";

export type SeoInput = {
  title: string;                // page-specific, will be appended with brand
  description: string;
  path?: string;                // canonical path, e.g. "/features"
  ogImage?: string;             // override OG image
  type?: "website" | "article";
};

export function buildSeoMeta({ title, description, path = "/", ogImage = OG_IMAGE, type = "website" }: SeoInput) {
  // Case-insensitive brand check so keyword-led titles that already contain
  // "LaunchVault" (any casing) don't get the brand appended twice.
  const hasBrand = title.toLowerCase().includes(brand.brandName.toLowerCase());
  const fullTitle = hasBrand ? title : `${title} — ${brand.brandName}`;
  const url = `${SITE_URL}${path}`;
  return [
    { title: fullTitle },
    { name: "description",   content: description },
    { name: "robots",        content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
    { name: "theme-color",   content: "#0b0f1a" },

    // Open Graph
    { property: "og:type",         content: type },
    { property: "og:site_name",    content: brand.brandName },
    { property: "og:title",        content: fullTitle },
    { property: "og:description",  content: description },
    { property: "og:url",          content: url },
    { property: "og:image",        content: ogImage },
    { property: "og:image:width",  content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:locale",       content: "en_US" },

    // Twitter card
    { name: "twitter:card",        content: "summary_large_image" },
    { name: "twitter:site",        content: TWITTER_HANDLE },
    { name: "twitter:title",       content: fullTitle },
    { name: "twitter:description", content: description },
    { name: "twitter:image",       content: ogImage },
  ];
}

export function buildSeoLinks(path = "/") {
  return [
    { rel: "canonical", href: `${SITE_URL}${path}` },
  ];
}

/**
 * JSON-LD Organization payload — drop into the page head once, helps every
 * search engine understand who LaunchVault is.
 */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brand.brandName,
    url: SITE_URL,
    logo: `${SITE_URL}/icon-512.png`,
    description: brand.homepageSubheadline,
    sameAs: [
      brand.social.instagram,
      brand.social.github,
      brand.social.youtube,
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: brand.supportEmail,
      availableLanguage: ["English"],
    },
  };
}

/**
 * JSON-LD WebSite payload — enables the Google sitelinks search box.
 */
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: brand.brandName,
    url: SITE_URL,
    description: brand.homepageSubheadline,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * JSON-LD SoftwareApplication payload — declares LaunchVault as a SaaS product.
 */
export function softwareAppJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: brand.brandName,
    operatingSystem: "Web",
    applicationCategory: "EducationalApplication",
    description: brand.homepageSubheadline,
    offers: {
      "@type": "AggregateOffer",
      lowPrice: "0",
      highPrice: brand.pricing.tier3.priceLabel.replace(/[^0-9.]/g, ""),
      priceCurrency: "USD",
      offerCount: "4",
    },
    // NOTE: intentionally NO aggregateRating. Emitting a fabricated rating
    // violates Google's structured-data policy (can trigger a manual action)
    // and contradicts our own "no fabricated metrics" promise. Re-add this
    // ONLY when we have real, verifiable reviews to back it.
  };
}

/**
 * Build a head-level <script type="application/ld+json"> entry.
 */
export function jsonLdScript(data: unknown) {
  return {
    tag: "script",
    attrs: { type: "application/ld+json" },
    children: JSON.stringify(data),
  };
}

/* =====================================================================
 * AEO (Answer-Engine Optimization) schema helpers
 *
 * These produce the schema.org markup that LLMs (Claude, ChatGPT,
 * Perplexity, Gemini, Bing Copilot) explicitly look for when deciding
 * what content to cite and how.
 * ===================================================================== */

/**
 * FAQPage — for pages with FAQ sections. LLMs love this — they cite
 * answers directly when users ask matching questions.
 */
export function faqPageJsonLd(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };
}

/**
 * HowTo — for workflows, playbooks, and step-by-step content. Triggers
 * step-by-step rich results in Google + structured ingest by Claude/GPT.
 */
export function howToJsonLd(input: {
  name: string;
  description: string;
  steps: Array<{ name: string; text: string }>;
  totalTime?: string; // ISO 8601 duration e.g. "PT15M"
  tool?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: input.name,
    description: input.description,
    totalTime: input.totalTime,
    tool: input.tool?.map((t) => ({ "@type": "HowToTool", name: t })),
    step: input.steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  };
}

/**
 * DefinedTerm — for glossary entries. LLMs CITE these for "what is X"
 * queries. Single biggest AEO lever for an AI-mastery platform.
 */
export function definedTermJsonLd(input: {
  term: string;
  definition: string;
  slug: string;
  related?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: input.term,
    description: input.definition,
    url: `${SITE_URL}/glossary/${input.slug}`,
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: `${brand.brandName} AI Glossary`,
      url: `${SITE_URL}/glossary`,
    },
    sameAs: input.related?.map((r) => `${SITE_URL}/glossary/${r}`),
  };
}

/**
 * Article + author byline. Use for blog/essay/long-form library pieces.
 * Includes structured author info — boosts trust signals for E-E-A-T.
 */
export function articleWithAuthorJsonLd(input: {
  title: string;
  description: string;
  slug: string;
  basePath: string; // e.g. "/blog" or "/library"
  datePublished: string;
  dateModified?: string;
  isPaywalled?: boolean;
  authorName?: string;
  keywords?: string[];
  timeRequired?: string;
}) {
  const url = `${SITE_URL}${input.basePath}/${input.slug}`;
  const author = input.authorName ?? brand.founder.name;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    url,
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    author: {
      "@type": "Person",
      name: author,
      jobTitle: brand.founder.role,
      description: brand.founder.bio,
      url: `${SITE_URL}/about`,
    },
    publisher: {
      "@type": "Organization",
      name: brand.brandName,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/icon-512.png` },
    },
    isAccessibleForFree: !input.isPaywalled,
    hasPart: input.isPaywalled
      ? {
          "@type": "WebPageElement",
          isAccessibleForFree: false,
          cssSelector: ".paywalled-content",
        }
      : undefined,
    keywords: input.keywords?.join(", "),
    timeRequired: input.timeRequired,
  };
}

/**
 * BreadcrumbList — helps Google build rich-snippet breadcrumbs and helps
 * LLMs understand site hierarchy.
 */
export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${SITE_URL}${it.path}`,
    })),
  };
}
