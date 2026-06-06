import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";
import { DOMAIN_GROUPS } from "@/config/domains";

export function DomainGrid() {
  return (
    <section id="domains" className="relative border-y border-border bg-gradient-surface">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <div className="text-center">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-primary">
            <Sparkles className="h-3 w-3" /> 50 mastery domains
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
            Every AI skill, organized
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Prompts, courses, workflows, agents, business plays, and daily insights — sorted across 50 domains so you find the exact help you need fast.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {DOMAIN_GROUPS.map((g) => (
            <article
              key={g.slug}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated"
            >
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${g.accent}`} />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold tracking-tight">{g.label}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">{g.blurb}</p>
                </div>
                <span className={`rounded-full bg-gradient-to-r ${g.accent} bg-clip-text text-xs font-bold text-transparent`}>
                  {g.domains.length}
                </span>
              </div>
              <ul className="mt-5 space-y-1.5">
                {g.domains.slice(0, 4).map((d) => (
                  <li key={d.slug} className="flex items-start gap-2 text-sm">
                    <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-r ${g.accent}`} />
                    <span className="font-medium">{d.label}</span>
                  </li>
                ))}
                {g.domains.length > 4 && (
                  <li className="pl-3.5 pt-1 text-xs italic text-muted-foreground">
                    + {g.domains.length - 4} more
                  </li>
                )}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            to="/signup"
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-95"
          >
            Explore the vault <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
