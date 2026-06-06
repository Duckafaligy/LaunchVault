import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal/LegalPage";
import { brand } from "@/config/brand";
import { buildSeoMeta, buildSeoLinks } from "@/lib/seo";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: buildSeoMeta({
      title: `Privacy Policy — ${brand.brandName}`,
      description: `How ${brand.brandName} collects, uses, and protects your data. GDPR / UK GDPR / CCPA compliant.`,
      path: "/privacy",
    }),
    links: buildSeoLinks("/privacy"),
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      subtitle="We collect the minimum data to run your account — and we tell you exactly what, why, and for how long."
      lastUpdated="May 24, 2026"
      intro={
        <p>
          This Privacy Policy explains how {brand.brandName} (&ldquo;we&rdquo;) collects, uses, shares, and protects
          personal information when you use the Service. It is designed to comply with GDPR, UK GDPR, and CCPA.
          For a list of cookies and browser-storage items we use, see our{" "}
          <Link to="/cookies" className="text-indigo-600 underline-offset-2 hover:underline">Cookie Policy</Link>.
        </p>
      }
      sections={[
        {
          id: "data-we-collect",
          title: "Data we collect",
          body: (
            <ul className="list-disc space-y-2 pl-5">
              <li><strong className="text-foreground">Account data:</strong> email and full name you provide at signup; a hashed password (Supabase Auth never gives us your plaintext password); your role (user / admin).</li>
              <li><strong className="text-foreground">Subscription data:</strong> tier, subscription status, current period end. Linked to your Stripe customer ID.</li>
              <li><strong className="text-foreground">Billing data:</strong> Stripe processes your payment method. We store only the Stripe customer ID, subscription ID, the last 4 digits of your card, and your billing country. We never see your full card number or CVC.</li>
              <li><strong className="text-foreground">Learning data:</strong> XP earned, daily streak, courses in progress, lessons completed, prompts copied, items saved, quiz attempts.</li>
              <li><strong className="text-foreground">Onboarding preferences:</strong> the goals, persona, AI experience level, favourite domains and content types you selected during onboarding. Used to personalize your feed.</li>
              <li><strong className="text-foreground">Page-view data:</strong> for each navigation we log: path, timestamp, your user ID (if logged in), an anonymous device ID stored in localStorage (so we can count unique visitors without identifying you), the referring URL. Used only for aggregate admin analytics.</li>
              <li><strong className="text-foreground">Device/browser data:</strong> User-Agent header, approximate region from Cloudflare (city/country level — never IP-based geolocation stored long-term).</li>
              <li><strong className="text-foreground">Support data:</strong> messages you send us by email.</li>
            </ul>
          ),
        },
        {
          id: "how-we-use",
          title: "How we use your data",
          body: (
            <ul className="list-disc space-y-2 pl-5">
              <li>To provide the Service: authentication, tier-gated content access, learning progress tracking.</li>
              <li>To process payments through Stripe and update your subscription state via Stripe webhooks.</li>
              <li>To personalize your dashboard feed based on onboarding preferences and viewing history.</li>
              <li>To send transactional emails (signup confirmation, password reset, change-email, magic-link login). Marketing or product-update emails only with your explicit opt-in.</li>
              <li>To produce aggregate site analytics for admins (total visitors, page views, content engagement). No individual user is profiled or shown to advertisers.</li>
              <li>To prevent abuse, fraud, and rate-limit attacks against our autonomous content engine.</li>
            </ul>
          ),
        },
        {
          id: "ai-providers",
          title: "What we send to AI providers",
          body: (
            <>
              <p>{brand.brandName}&rsquo;s autonomous content engine calls OpenAI to generate the prompts, courses, workflows, and other content you see in the library. <strong className="text-foreground">We do not send your personal data to OpenAI</strong> as part of normal content generation. The generation prompts are pre-authored by us; only our prompt text plus the list of existing content IDs is sent to the model.</p>
              <p>If a future feature ever processes your personal data through an AI model (e.g. a personalized AI tutor), we will disclose it here and request your consent first.</p>
            </>
          ),
        },
        {
          id: "legal-basis",
          title: "Legal basis (GDPR)",
          body: (
            <p>We process your data under: (i) <strong className="text-foreground">contract</strong> — to deliver the Service you signed up for; (ii) <strong className="text-foreground">legitimate interests</strong> — to secure and improve the Service; (iii) <strong className="text-foreground">legal obligation</strong> — to retain tax and billing records; (iv) <strong className="text-foreground">consent</strong> — for optional marketing emails and non-essential cookies.</p>
          ),
        },
        {
          id: "who-we-share-with",
          title: "Who we share data with",
          body: (
            <>
              <p>We do <strong className="text-foreground">not</strong> sell your personal data. We share it only with the following processors, each under data-processing terms:</p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li><strong className="text-foreground">Stripe Payments Canada Ltd.</strong> — to process subscription payments.</li>
                <li><strong className="text-foreground">Supabase Inc.</strong> — database hosting and authentication. Your data is stored in a Supabase project we control.</li>
                <li><strong className="text-foreground">OpenAI, L.L.C.</strong> — for backend content generation only (no personal data sent).</li>
                <li><strong className="text-foreground">Cloudflare, Inc.</strong> — DNS, edge hosting, Workers runtime, and bot protection.</li>
                <li>Law-enforcement or regulators when required by valid legal process.</li>
              </ul>
            </>
          ),
        },
        {
          id: "retention",
          title: "Retention",
          body: (
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Account data: kept while your account is active. Deleted within 30 days of account closure.</li>
              <li>Billing &amp; transaction data: kept for 7 years to meet tax obligations.</li>
              <li>Page-view analytics: kept for 13 months in aggregated form, then deleted.</li>
              <li>Support emails: kept for 24 months after the last response.</li>
            </ul>
          ),
        },
        {
          id: "your-rights",
          title: "Your rights",
          body: (
            <>
              <p>You have the right to: access your data, correct it, delete it, restrict its processing, port it to another service, and object to certain types of processing. EU/UK users may lodge a complaint with their supervisory authority. California residents have CCPA rights including the right to know, delete, and opt out of any sale (we do not sell).</p>
              <p>To exercise any right, email <a href={`mailto:${brand.supportEmail}`} className="text-indigo-600 underline-offset-2 hover:underline">{brand.supportEmail}</a>. We respond within 30 days.</p>
            </>
          ),
        },
        {
          id: "security",
          title: "Security",
          body: (
            <p>Data is encrypted in transit (TLS 1.3) and at rest. Authentication uses Supabase Auth with hashed passwords. Database access requires row-level-security policies — premium content payloads are never returned to the browser without a verified access check. Payment data lives in Stripe, never on our servers.</p>
          ),
        },
        {
          id: "children",
          title: "Children",
          body: (
            <p>{brand.brandName} is not directed to children under 16. We do not knowingly collect personal data from anyone under 16. If you believe a child has provided us data, contact us and we will delete it.</p>
          ),
        },
        {
          id: "changes",
          title: "Changes to this policy",
          body: (
            <p>We may update this Policy from time to time. Material changes will be notified by email at least 14 days in advance. The current version always lives at this URL.</p>
          ),
        },
        {
          id: "contact",
          title: "Contact",
          body: (
            <p>For questions about this Privacy Policy or to exercise your rights, email <a href={`mailto:${brand.supportEmail}`} className="text-indigo-600 underline-offset-2 hover:underline">{brand.supportEmail}</a>.</p>
          ),
        },
      ]}
    />
  );
}
