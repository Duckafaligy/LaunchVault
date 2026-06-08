import { Link } from "@tanstack/react-router";
import { Github, Instagram, Youtube, Sparkles, Mail } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { brand } from "@/config/brand";

const SOCIAL_LINKS = [
  { href: brand.social.instagram, label: "Instagram", icon: Instagram },
  { href: brand.social.github,    label: "GitHub",    icon: Github    },
  { href: brand.social.youtube,   label: "YouTube",   icon: Youtube   },
];

export function LandingFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-border bg-slate-950 text-white">
      <div className="pointer-events-none absolute -top-32 left-1/4 h-72 w-72 rounded-full bg-indigo-600/20 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-32 right-1/4 h-72 w-72 rounded-full bg-fuchsia-600/15 blur-[120px]" />

      <div className="relative mx-auto max-w-6xl px-4 py-16">
        {/* Top: brand + columns */}
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <div className="text-white"><Logo /></div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-300">
              {brand.tagline}
            </p>
            <p className="mt-4 max-w-xs text-xs text-slate-400">
              A self-growing library of prompts, courses, workflows, agent blueprints, business plays, and daily insights — across 50 AI mastery domains.
            </p>

            <div className="mt-6 flex items-center gap-2">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition-all hover:border-white/30 hover:bg-white/10 hover:text-white"
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
              <a
                href={`mailto:${brand.supportEmail}`}
                aria-label="Email support"
                className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition-all hover:border-white/30 hover:bg-white/10 hover:text-white"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          <FooterCol
            title="Product"
            links={[
              { to: "/how-to-learn-ai",         label: "How to learn AI" },
              { to: "/features",                label: "Features" },
              { to: "/pricing",                 label: "Pricing" },
              { to: "/signup",                  label: "Get started" },
            ]}
          />
          <FooterCol
            title="Library"
            links={[
              { to: "/dashboard/insights",      label: "Daily Insights" },
              { to: "/dashboard/prompts",       label: "Prompts" },
              { to: "/dashboard/courses",       label: "Courses" },
              { to: "/dashboard/workflows",     label: "Workflows" },
              { to: "/dashboard/agents",        label: "Agents" },
              { to: "/dashboard/business",      label: "Business" },
            ]}
          />
          <FooterCol
            title="Company"
            links={[
              { to: "/about",          label: "About" },
              { to: "/how-it-works",   label: "How it works" },
              { to: "/blog",           label: "Stories" },
              { to: "/glossary",       label: "AI Glossary" },
              { to: "/library",        label: "Public library" },
              { to: "/contact",        label: "Contact" },
            ]}
          />
          <FooterCol
            title="Legal"
            links={[
              { to: "/terms",                   label: "Terms" },
              { to: "/privacy",                 label: "Privacy" },
              { to: "/cookies",                 label: "Cookies" },
              { to: "/refund-policy",           label: "Cancellations" },
              { to: "/acceptable-use",          label: "AUP" },
              { to: "/dpa",                     label: "DPA" },
            ]}
          />
        </div>

        {/* Live pulse mini-card */}
        <div className="mt-12 flex flex-col items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 backdrop-blur md:flex-row md:items-center">
          <div className="flex items-center gap-3 text-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <span className="text-slate-200">
              <span className="font-bold text-white">Quality-gated engine</span> — new AI mastery content every 2 hours, published only when it clears the bar.
            </span>
          </div>
          <Link
            to="/signup"
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-indigo-600 to-fuchsia-600 px-4 py-2 text-xs font-bold text-white shadow-glow hover:opacity-95"
          >
            <Sparkles className="h-3.5 w-3.5" /> Start free
          </Link>
        </div>

        {/* Bottom */}
        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 text-xs text-slate-400 md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} {brand.brandName}. Built for AI mastery.</p>
          <p>
            Support: <a href={`mailto:${brand.supportEmail}`} className="text-slate-300 hover:text-white">{brand.supportEmail}</a>
          </p>
        </div>

      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { to: string; label: string }[] }) {
  return (
    <div className="md:col-span-2">
      <h4 className="text-[11px] font-bold uppercase tracking-[0.16em] text-white">{title}</h4>
      <ul className="mt-4 space-y-2.5 text-sm text-slate-300">
        {links.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className="transition-colors hover:text-white">{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
