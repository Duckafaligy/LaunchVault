import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal/LegalPage";
import { brand } from "@/config/brand";
import { buildSeoMeta, buildSeoLinks } from "@/lib/seo";

export const Route = createFileRoute("/dpa")({
  head: () => ({
    meta: buildSeoMeta({
      title: `Data Processing Addendum — ${brand.brandName}`,
      description: `${brand.brandName}'s Data Processing Addendum for business customers handling EU/UK personal data.`,
      path: "/dpa",
    }),
    links: buildSeoLinks("/dpa"),
  }),
  component: DpaPage,
});

function DpaPage() {
  return (
    <LegalPage
      title="Data Processing Addendum"
      subtitle="For business customers under GDPR / UK GDPR. Annexed to the Terms of Service."
      lastUpdated="May 24, 2026"
      intro={
        <p>
          This Data Processing Addendum (&ldquo;DPA&rdquo;) forms part of the agreement between you (&ldquo;Customer&rdquo;) and {brand.brandName} (&ldquo;Processor&rdquo;) when {brand.brandName} processes personal data on your behalf. It addresses obligations under the EU General Data Protection Regulation (&ldquo;GDPR&rdquo;), UK GDPR, and equivalent laws.
        </p>
      }
      sections={[
        {
          id: "scope",
          title: "Scope & subject matter",
          body: (
            <p>This DPA applies to {brand.brandName}&rsquo;s processing of Customer&rsquo;s personal data in the course of providing the Service. Where Customer is acting as a controller, {brand.brandName} acts as the processor. Where the parties are joint controllers (e.g. transactional emails sent to learners enrolled by Customer), the parties&rsquo; respective duties are set out in our <Link to="/privacy" className="text-indigo-600 underline-offset-2 hover:underline">Privacy Policy</Link>.</p>
          ),
        },
        {
          id: "categories",
          title: "Categories of data & data subjects",
          body: (
            <>
              <p><strong className="text-foreground">Data subjects:</strong> Customer&rsquo;s authorised users (admins, learners) and end-customers if Customer integrates the Service into a downstream offering.</p>
              <p><strong className="text-foreground">Data categories:</strong> account details (email, name), authentication metadata, learning activity (XP, progress, saved items), billing identifiers (Stripe customer ID), support communications.</p>
            </>
          ),
        },
        {
          id: "instructions",
          title: "Processor obligations",
          body: (
            <>
              <p>{brand.brandName} will:</p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>Process Customer data only on documented instructions from Customer.</li>
                <li>Ensure all personnel with access are bound by confidentiality obligations.</li>
                <li>Implement and maintain appropriate technical and organisational security measures (encryption in transit and at rest; row-level access policies; least-privilege access controls).</li>
                <li>Assist Customer in responding to data-subject requests and regulator queries within reasonable timelines.</li>
                <li>Notify Customer without undue delay (and within 72 hours where feasible) of any personal-data breach.</li>
                <li>Delete or return Customer personal data within 30 days after the end of services, unless legal retention applies.</li>
              </ul>
            </>
          ),
        },
        {
          id: "subprocessors",
          title: "Sub-processors",
          body: (
            <>
              <p>Customer authorises the following sub-processors. We notify Customer of changes via email at least 14 days in advance:</p>
              <div className="mt-3 overflow-hidden rounded-xl border border-border">
                <table className="w-full text-left text-[13.5px]">
                  <thead className="bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2.5">Provider</th>
                      <th className="px-4 py-2.5">Service</th>
                      <th className="px-4 py-2.5">Region</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border [&_td]:px-4 [&_td]:py-3">
                    <tr><td>Supabase Inc.</td><td>Database, auth, realtime</td><td>US-West (configurable)</td></tr>
                    <tr><td>Stripe Payments Canada Ltd.</td><td>Payments, billing portal</td><td>US / EU</td></tr>
                    <tr><td>Cloudflare, Inc.</td><td>DNS, edge hosting, Workers</td><td>Global edge</td></tr>
                    <tr><td>OpenAI, L.L.C.</td><td>Content generation (no personal data)</td><td>US</td></tr>
                  </tbody>
                </table>
              </div>
            </>
          ),
        },
        {
          id: "transfers",
          title: "International transfers",
          body: (
            <p>Where personal data is transferred outside the EU/UK, {brand.brandName} relies on Standard Contractual Clauses (SCCs) and the UK International Data Transfer Addendum where applicable. We do not transfer data to countries without an adequacy decision or appropriate safeguards.</p>
          ),
        },
        {
          id: "audits",
          title: "Audit rights",
          body: (
            <p>Customer may, no more than once per year and with at least 30 days&rsquo; written notice, request information to verify {brand.brandName}&rsquo;s compliance with this DPA. {brand.brandName} will provide reasonable evidence (security overviews, sub-processor SOC reports where available).</p>
          ),
        },
        {
          id: "termination",
          title: "Termination",
          body: (
            <p>This DPA terminates automatically with the Terms of Service. On termination, {brand.brandName} will delete or return Customer&rsquo;s personal data within 30 days, except where required to retain by law.</p>
          ),
        },
        {
          id: "signing",
          title: "Signing",
          body: (
            <p>For business customers requiring a counter-signed copy, email <a href={`mailto:${brand.supportEmail}`} className="text-indigo-600 underline-offset-2 hover:underline">{brand.supportEmail}</a> with subject &ldquo;DPA request&rdquo; and your company details. We&rsquo;ll send a signable PDF.</p>
          ),
        },
      ]}
    />
  );
}
