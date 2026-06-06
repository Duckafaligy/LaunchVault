import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Sparkles } from "lucide-react";
import { brand } from "@/config/brand";

// Exported so the homepage head() can emit matching FAQPage JSON-LD.
// IMPORTANT: this schema is only legitimate because these exact Q/As are
// rendered visibly on the page below — never emit FAQ schema without the
// visible content to back it (same rule that killed the fake aggregateRating).
export const HOMEPAGE_FAQS = [
  {
    q: "What exactly is LaunchVault?",
    a: `A self-growing AI mastery platform. ${brand.brandName} ships 10 content types — prompts, micro-courses, workflows, agent blueprints, business plays, daily insights, tool guides, playbooks, challenges, and cheatsheets — sorted across 50 AI mastery domains. New content is generated and quality-scored every two hours by our autonomous engine.`,
  },
  {
    q: "What do I get for free?",
    a: "A real account, full browsing of the library, the daily AI insight feed, the complete AI glossary, and the founder blog — all free, no card required, plus the ability to save items. Prompts, workflows, courses and agent blueprints are on the paid tiers.",
  },
  {
    q: "How is the content actually generated?",
    a: "Every two hours, a Cloudflare Worker cron triggers our OpenAI integration to generate ~12 new items across the core content types. Each item is validated against a strict JSON schema, quality-scored 0–100, and only items above the threshold are published. Borderline items are flagged for review.",
  },
  {
    q: "Are the courses really 'Q/A learning'?",
    a: "Yes. Every lesson ends with a mandatory checkpoint quiz. The Continue button stays locked until you answer correctly — wrong picks give immediate feedback so you can retry. It's the difference between reading about prompting and actually learning it.",
  },
  {
    q: "How are the subscription tiers different?",
    a: `${brand.pricing.tier1.priceLabel} Starter = full prompt library + workflows + insights + beginner courses. ${brand.pricing.tier2.priceLabel} Creator (most popular) = adds full micro-courses, agent blueprints, business lessons. ${brand.pricing.tier3.priceLabel} Pro = adds advanced agent blueprints, premium categories, early access. Higher tiers always include everything below.`,
  },
  {
    q: "Can I use the content commercially?",
    a: "Yes. Anything you unlock through your subscription is yours to use in any project, commercial or personal. See our Terms for details.",
  },
  {
    q: "Do you offer refunds?",
    a: "No. All subscription charges are final and non-refundable. Because the library is large and instantly accessible, we don't run a free-trial-then-keep-the-content loophole. Instead we keep prices fair and let you cancel any time to stop future billing.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. One click from your account page or the Stripe billing portal. Cancellation stops future billing immediately, your tier stays active through the end of the current cycle, then downgrades cleanly to Free.",
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="relative mx-auto max-w-3xl px-4 py-20 scroll-mt-24">
      <div className="text-center">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
          <Sparkles className="h-3 w-3" /> FAQ
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">Questions, answered</h2>
        <p className="mt-3 text-muted-foreground">Everything you need to know before getting started.</p>
      </div>
      <div className="mt-10 rounded-3xl border border-border bg-card p-2 shadow-soft md:p-3">
        <Accordion type="single" collapsible>
          {HOMEPAGE_FAQS.map((item, i) => (
            <AccordionItem key={i} value={`q-${i}`} className="border-border last:border-b-0">
              <AccordionTrigger className="px-3 py-4 text-left text-base font-bold hover:no-underline md:px-4">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-5 text-[15px] leading-relaxed text-muted-foreground md:px-4">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Still got questions? Email <a href={`mailto:${brand.supportEmail}`} className="font-semibold text-primary hover:underline">{brand.supportEmail}</a>
      </p>
    </section>
  );
}
