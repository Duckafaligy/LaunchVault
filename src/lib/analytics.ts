// =====================================================================
// LaunchVault — PostHog client analytics
//
// Tracks the visitor → signup → paid funnel + key product interactions.
// Initialised lazily once on first call to identifyUser() or capture().
// Reads VITE_POSTHOG_KEY / VITE_POSTHOG_HOST at build time. Safe no-op
// if either is missing (e.g. local dev without keys).
//
// Server-side this module is a no-op — call sites use `if (typeof window
// !== 'undefined')` guards or simply call into capture() which handles
// the SSR case.
// =====================================================================

import type { PostHog } from "posthog-js";

let posthog: PostHog | null = null;
let initialised = false;
let initPromise: Promise<void> | null = null;

const KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const HOST = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? "https://us.posthog.com";

/**
 * Lazy-init PostHog on first capture. Bundle splits so we don't pay
 * the cost on routes that never track anything.
 */
async function ensureInit(): Promise<void> {
  if (initialised) return;
  if (typeof window === "undefined") return; // SSR no-op
  if (!KEY) return; // no key configured → silent no-op
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const mod = await import("posthog-js");
    posthog = mod.default;
    posthog.init(KEY, {
      api_host: HOST,
      person_profiles: "identified_only", // only create profiles for signed-in users (cheaper)
      capture_pageview: true,              // auto-track $pageview
      capture_pageleave: true,
      autocapture: false,                  // we'll fire explicit named events
      disable_session_recording: true,     // privacy-respecting default; enable later if needed
      loaded: () => { initialised = true; },
    });
  })();
  return initPromise;
}

/**
 * Identify a logged-in user. Call once when auth state hydrates, then
 * every time the user upgrades / changes tier.
 */
export async function identifyUser(
  userId: string,
  traits?: Record<string, any>,
): Promise<void> {
  await ensureInit();
  if (!posthog) return;
  posthog.identify(userId, traits);
}

/**
 * Reset on sign-out so we don't keep the previous user's identity
 * attached to the anonymous session that follows.
 */
export async function resetIdentity(): Promise<void> {
  await ensureInit();
  if (!posthog) return;
  posthog.reset();
}

/**
 * Capture an event. Use named exports below for the standard ones to
 * keep call-sites consistent.
 */
export async function capture(
  event: string,
  props?: Record<string, any>,
): Promise<void> {
  await ensureInit();
  if (!posthog) return;
  posthog.capture(event, props);
}

/* ---------- Named events — the funnel ---------- */

export const track = {
  // Top of funnel
  pricingViewed: (props?: { tier?: string }) =>
    capture("pricing_viewed", props),
  signupStarted: (props?: { from?: string; upgrade?: string }) =>
    capture("signup_started", props),
  signupCompleted: (props?: { userId: string; method?: "password" | "magic_link" }) =>
    capture("signup_completed", props),
  loginCompleted: (props?: { userId: string }) =>
    capture("login_completed", props),

  // Conversion
  checkoutOpened: (props?: { tier?: string; from?: string }) =>
    capture("checkout_opened", props),
  checkoutCompleted: (props?: { tier?: string; amount?: number }) =>
    capture("checkout_completed", props),
  subscriptionUpgraded: (props?: { fromTier?: string; toTier?: string }) =>
    capture("subscription_upgraded", props),
  subscriptionCancelled: (props?: { fromTier?: string }) =>
    capture("subscription_cancelled", props),

  // Content engagement
  contentViewed: (props: { contentId: string; type: string; locked: boolean; tierRequired?: string }) =>
    capture("content_viewed", props),
  contentUnlocked: (props: { contentId: string; method: "subscription" | "admin" }) =>
    capture("content_unlocked", props),
  contentCopied: (props: { contentId: string; type: string }) =>
    capture("content_copied", props),
  courseStarted: (props: { courseId: string }) =>
    capture("course_started", props),
  courseLessonCompleted: (props: { courseId: string; lessonIndex: number }) =>
    capture("course_lesson_completed", props),
  courseCompleted: (props: { courseId: string }) =>
    capture("course_completed", props),
  dailyQuestStarted: (props: { questId: string }) =>
    capture("daily_quest_started", props),

  // SEO / acquisition
  blogPostRead: (props: { slug: string }) =>
    capture("blog_post_read", props),
  glossaryTermViewed: (props: { slug: string; term: string }) =>
    capture("glossary_term_viewed", props),
  libraryArticleViewed: (props: { slug: string; type: string }) =>
    capture("library_article_viewed", props),
  domainPageViewed: (props: { slug: string }) =>
    capture("domain_page_viewed", props),
};
