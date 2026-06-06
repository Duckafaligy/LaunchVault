import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal/LegalPage";
import { brand } from "@/config/brand";
import { buildSeoMeta, buildSeoLinks } from "@/lib/seo";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: buildSeoMeta({
      title: `Cookie Policy — ${brand.brandName}`,
      description: `Which cookies and browser-storage items ${brand.brandName} uses, and how to control them.`,
      path: "/cookies",
    }),
    links: buildSeoLinks("/cookies"),
  }),
  component: CookiesPage,
});

function CookiesPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      subtitle="What we store on your device, why, and how to turn it off."
      lastUpdated="May 24, 2026"
      intro={
        <p>
          This Cookie Policy explains how {brand.brandName} uses cookies and similar browser-storage technologies
          (localStorage, sessionStorage). It supplements our{" "}
          <Link to="/privacy" className="text-indigo-600 underline-offset-2 hover:underline">Privacy Policy</Link>.
        </p>
      }
      sections={[
        {
          id: "what",
          title: "What is a cookie?",
          body: (
            <p>A cookie is a small text file stored on your device by your browser. We also use the browser&rsquo;s built-in storage APIs (localStorage, sessionStorage) for the same purposes — they are functionally equivalent for privacy purposes and treated the same way under this policy.</p>
          ),
        },
        {
          id: "what-we-use",
          title: "What we actually use",
          body: (
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-left text-[13.5px]">
                <thead className="bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5">Name</th>
                    <th className="px-4 py-2.5">Type</th>
                    <th className="px-4 py-2.5">Purpose</th>
                    <th className="px-4 py-2.5">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border [&_td]:px-4 [&_td]:py-3">
                  <tr>
                    <td className="font-mono text-[12.5px]">sb-*-auth-token</td>
                    <td>Essential</td>
                    <td>Supabase Auth session — keeps you logged in.</td>
                    <td>Session / refresh on activity</td>
                  </tr>
                  <tr>
                    <td className="font-mono text-[12.5px]">lv_anon_id</td>
                    <td>Analytics</td>
                    <td>An anonymous random ID stored in localStorage so we can count unique visitors without identifying you.</td>
                    <td>Persistent</td>
                  </tr>
                  <tr>
                    <td className="font-mono text-[12.5px]">__cf_bm / cf_clearance</td>
                    <td>Essential (Cloudflare)</td>
                    <td>Cloudflare bot-management and DDoS protection. Set by our edge layer.</td>
                    <td>~30 min</td>
                  </tr>
                  <tr>
                    <td className="font-mono text-[12.5px]">__stripe_mid / __stripe_sid</td>
                    <td>Essential (Stripe)</td>
                    <td>Stripe Checkout fraud prevention. Set only when you open the checkout dialog.</td>
                    <td>~1 year / 30 min</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ),
        },
        {
          id: "no-tracking",
          title: "What we don't use",
          body: (
            <ul className="list-disc space-y-1.5 pl-5">
              <li>No Google Analytics, Facebook Pixel, or other third-party advertising trackers.</li>
              <li>No re-targeting cookies.</li>
              <li>No fingerprinting.</li>
              <li>No selling of any of your data.</li>
            </ul>
          ),
        },
        {
          id: "control",
          title: "How to control cookies",
          body: (
            <>
              <p>You can clear browser storage at any time via your browser settings. Note that clearing the Supabase auth cookie will log you out, and clearing the Cloudflare cookie may temporarily slow down or block access while the protection layer revalidates.</p>
              <p>Most browsers let you block all cookies or third-party cookies in settings. Blocking essential cookies will prevent login and payments.</p>
            </>
          ),
        },
        {
          id: "changes",
          title: "Changes",
          body: (
            <p>We update this policy when we add or change cookies. The latest version always lives at this URL.</p>
          ),
        },
        {
          id: "contact",
          title: "Contact",
          body: (
            <p>For questions, email <a href={`mailto:${brand.supportEmail}`} className="text-indigo-600 underline-offset-2 hover:underline">{brand.supportEmail}</a>.</p>
          ),
        },
      ]}
    />
  );
}
