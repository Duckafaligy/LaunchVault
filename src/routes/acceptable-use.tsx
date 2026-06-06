import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal/LegalPage";
import { brand } from "@/config/brand";
import { buildSeoMeta, buildSeoLinks } from "@/lib/seo";

export const Route = createFileRoute("/acceptable-use")({
  head: () => ({
    meta: buildSeoMeta({
      title: `Acceptable Use Policy — ${brand.brandName}`,
      description: `What you can and cannot do with ${brand.brandName} content and platform.`,
      path: "/acceptable-use",
    }),
    links: buildSeoLinks("/acceptable-use"),
  }),
  component: AcceptableUsePage,
});

function AcceptableUsePage() {
  return (
    <LegalPage
      title="Acceptable Use Policy"
      subtitle={`What you can — and absolutely cannot — do with ${brand.brandName}.`}
      lastUpdated="May 24, 2026"
      intro={
        <p>
          This Acceptable Use Policy (&ldquo;AUP&rdquo;) is part of our Terms. It exists to keep the platform
          useful, safe, and high-quality for every member. Breach of this AUP may result in account
          suspension or termination.
        </p>
      }
      sections={[
        {
          id: "what-you-can-do",
          title: "What you CAN do",
          body: (
            <ul className="list-disc space-y-2 pl-5">
              <li>Use unlocked prompts, courses, workflows, agent blueprints, and other content in your own personal or commercial projects.</li>
              <li>Adapt, modify, and remix the content for your own work — change the placeholders, retune for your industry, build on top of the frameworks.</li>
              <li>Run the prompts on any AI tool you like (ChatGPT, Claude, Gemini, your own integration).</li>
              <li>Share specific outputs you created with our content openly, including with attribution when you feel like giving us a shout-out.</li>
              <li>Reference us in your own materials (&ldquo;I followed a workflow from LaunchVault…&rdquo;).</li>
            </ul>
          ),
        },
        {
          id: "platform-misuse",
          title: "Platform misuse",
          body: (
            <>
              <p>You must NOT:</p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>Attempt to bypass tier gates or access content you have not paid for.</li>
                <li>Reverse-engineer, decompile, or probe the platform for vulnerabilities outside an authorized disclosure channel.</li>
                <li>Scrape, mirror, or systematically download our library at scale.</li>
                <li>Share, sell, or transfer your account credentials.</li>
                <li>Use bots, scripts, or automation to interact with the platform beyond your own personal use.</li>
                <li>Overload the autonomous content endpoint or any rate-limited API.</li>
                <li>Spoof Stripe webhooks, fake payments, or attempt to bypass the subscription paywall.</li>
              </ul>
            </>
          ),
        },
        {
          id: "content-misuse",
          title: "Content misuse",
          body: (
            <>
              <p>You must NOT use {brand.brandName} content to:</p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>Train, fine-tune, evaluate, or benchmark competing AI models or competing prompt/learning libraries.</li>
                <li>Build a competing &ldquo;AI mastery&rdquo; product that resells our library.</li>
                <li>Republish content at scale (blog scraping, content farms, SEO spam).</li>
                <li>Misrepresent AI-generated content as written by a human in contexts that require disclosure (academic submissions, regulated journalism, etc.).</li>
                <li>Pass off our content as your own original work where authorship matters.</li>
              </ul>
            </>
          ),
        },
        {
          id: "harmful-use",
          title: "Harmful, illegal, or abusive use",
          body: (
            <>
              <p>You must NOT use the Service or its content to:</p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>Plan or execute illegal activity, harassment, hate speech, violence, or harm against any person or group.</li>
                <li>Generate or distribute CSAM, non-consensual intimate imagery, or content sexualizing minors.</li>
                <li>Build phishing kits, malware, exploit chains, or other security-attack tools.</li>
                <li>Spread medical, legal, financial, or safety misinformation as if it were authoritative advice.</li>
                <li>Build manipulative dark-pattern marketing, deceptive sales scripts, or fraud schemes.</li>
                <li>Build autonomous AI agents that take harmful real-world actions without human review.</li>
              </ul>
            </>
          ),
        },
        {
          id: "reporting",
          title: "Reporting abuse",
          body: (
            <p>If you see content or a user violating this AUP, email <a href={`mailto:${brand.supportEmail}`} className="text-indigo-600 underline-offset-2 hover:underline">{brand.supportEmail}</a> with the URL or details. We investigate every report.</p>
          ),
        },
        {
          id: "enforcement",
          title: "Enforcement",
          body: (
            <p>We may, at our sole discretion: warn the offending account, temporarily suspend, permanently terminate, remove the offending content, and report severe cases to law enforcement. Termination is final — no refunds are issued under any circumstances.</p>
          ),
        },
      ]}
    />
  );
}
