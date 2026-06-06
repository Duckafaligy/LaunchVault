import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal/LegalPage";
import { brand } from "@/config/brand";
import { buildSeoMeta, buildSeoLinks } from "@/lib/seo";

// NOTE: The URL path stays at /refund-policy for backwards compatibility
// with existing inbound links, sitemap entries, and indexed search results.
// The page itself is now a Cancellation Policy — we no longer issue refunds.

export const Route = createFileRoute("/refund-policy")({
  head: () => ({
    meta: buildSeoMeta({
      title: `Cancellation Policy — ${brand.brandName}`,
      description: `${brand.brandName}'s cancellation policy. All subscriptions are non-refundable — but you can cancel anytime to stop future billing.`,
      path: "/refund-policy",
    }),
    links: buildSeoLinks("/refund-policy"),
  }),
  component: CancellationPage,
});

function CancellationPage() {
  return (
    <LegalPage
      title="Cancellation Policy"
      subtitle="No refunds. But cancel anytime — your tier stays active through the end of the cycle."
      lastUpdated="May 25, 2026"
      intro={
        <>
          <p>
            {brand.brandName} is a digital learning product. The moment your subscription is active, you gain instant access to a substantial library of premium AI mastery content — prompts, courses, agent blueprints, business plays, and more. Because that content can be consumed within hours of signing up, <strong className="text-foreground">we do not offer refunds</strong> on subscriptions.
          </p>
          <p className="mt-3">
            What you can do, at any time and with no friction: <strong className="text-foreground">cancel your subscription</strong>. Cancellation stops future billing immediately. You keep access until the end of the current billing period.
          </p>
        </>
      }
      sections={[
        {
          id: "no-refunds",
          title: "No refunds",
          body: (
            <>
              <p>All charges — monthly subscriptions and prorated upgrades — are <strong className="text-foreground">final and non-refundable</strong>.</p>
              <p>This applies regardless of:</p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>How recently the charge occurred (including the first day).</li>
                <li>Whether you've consumed content or unlocked items.</li>
                <li>Whether you forgot to cancel before a renewal.</li>
                <li>Whether you signed up &ldquo;just to look around&rdquo;.</li>
              </ul>
              <p className="mt-3">If this feels unforgiving — we get it. The trade-off is that we keep prices low, never run aggressive billing tactics, and never quietly raise rates. Everything you need to evaluate the product is available before you pay: the <Link to="/features" className="text-indigo-600 underline-offset-2 hover:underline">features list</Link>, real <Link to="/about" className="text-indigo-600 underline-offset-2 hover:underline">member stories</Link>, transparent <Link to="/pricing" className="text-indigo-600 underline-offset-2 hover:underline">pricing</Link>, and a generous Free tier that you can use forever without paying a cent.</p>
            </>
          ),
        },
        {
          id: "cancel-anytime",
          title: "Cancel anytime — instantly",
          body: (
            <>
              <p>You can cancel your subscription at any moment from your <Link to="/dashboard/account" className="text-indigo-600 underline-offset-2 hover:underline">account page</Link>. The cancellation:</p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>Takes effect immediately for future billing — no further charges.</li>
                <li>Keeps your tier active until the end of the current billing period (you paid for it, you get it).</li>
                <li>Downgrades your account to the Free tier automatically when the period ends.</li>
                <li>Preserves your read-only history, XP, and streaks.</li>
              </ul>
              <p className="mt-3">No phone call, no email back-and-forth, no &ldquo;are you sure&rdquo; loop. One click.</p>
            </>
          ),
        },
        {
          id: "duplicate-or-fraud",
          title: "Duplicate or unauthorised charges",
          body: (
            <p>If you believe you have been charged twice for the same subscription cycle, or if a charge appears on your statement that you did not authorise, email <a href={`mailto:${brand.supportEmail}`} className="text-indigo-600 underline-offset-2 hover:underline">{brand.supportEmail}</a> with the relevant Stripe receipt details. Verified duplicates and unauthorised charges are reversed.</p>
          ),
        },
        {
          id: "consumer-rights",
          title: "Statutory consumer rights",
          body: (
            <p>This policy does not override any statutory consumer rights you may have under your local law (for example, EU/UK consumer cooling-off rules for distance contracts). Where those rights apply, they apply — but note that the right typically extinguishes the moment you begin consuming digital content, which on {brand.brandName} happens at signup.</p>
          ),
        },
        {
          id: "service-issues",
          title: "If the service is broken",
          body: (
            <>
              <p>If {brand.brandName} experiences extended downtime, a content-generation outage that prevents you from receiving the service you paid for, or a billing error we caused, contact <a href={`mailto:${brand.supportEmail}`} className="text-indigo-600 underline-offset-2 hover:underline">{brand.supportEmail}</a>.</p>
              <p>Where appropriate we may extend your subscription period at our discretion — this is not a refund and is granted case-by-case.</p>
            </>
          ),
        },
        {
          id: "contact",
          title: "Contact",
          body: (
            <p>Questions about cancellation? Email <a href={`mailto:${brand.supportEmail}`} className="text-indigo-600 underline-offset-2 hover:underline">{brand.supportEmail}</a>.</p>
          ),
        },
      ]}
    />
  );
}
