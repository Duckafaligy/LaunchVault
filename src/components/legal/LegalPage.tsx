import { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/landing/PublicLayout";
import { ChevronRight } from "lucide-react";
import { brand } from "@/config/brand";

export type LegalSection = {
  id: string;
  title: string;
  body: ReactNode;
};

interface LegalPageProps {
  title: string;
  subtitle: string;
  lastUpdated: string;
  intro: ReactNode;
  sections: LegalSection[];
}

export function LegalPage({ title, subtitle, lastUpdated, intro, sections }: LegalPageProps) {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-slate-950 text-white">
        <div className="absolute inset-0 opacity-60">
          <div className="absolute -top-24 left-1/4 h-64 w-64 rounded-full bg-indigo-600/30 blur-3xl" />
          <div className="absolute -bottom-24 right-1/4 h-64 w-64 rounded-full bg-fuchsia-600/20 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 py-16 md:py-20">
          <div className="flex items-center gap-2 text-xs text-indigo-200/80">
            <Link to="/" className="hover:text-white">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <span>Legal</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white">{title}</span>
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-base text-indigo-100/80 md:text-lg">{subtitle}</p>
          <p className="mt-4 text-xs uppercase tracking-wider text-indigo-300/80">Last updated · {lastUpdated}</p>
        </div>
      </section>

      {/* Body with sticky TOC */}
      <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-[220px_1fr]">
          <aside className="md:sticky md:top-24 md:self-start">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">On this page</p>
            <nav className="mt-3 space-y-1.5 border-l border-border pl-3 text-sm">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="block text-muted-foreground hover:text-foreground"
                >
                  {s.title}
                </a>
              ))}
            </nav>
          </aside>
          <article className="min-w-0">
            <div className="rounded-2xl border border-border bg-card/50 p-6 text-sm text-muted-foreground shadow-sm md:p-8">
              {intro}
            </div>
            <div className="mt-10 space-y-12">
              {sections.map((s, i) => (
                <section key={s.id} id={s.id} className="scroll-mt-24">
                  <div className="flex items-baseline gap-3">
                    <span className="text-xs font-semibold text-indigo-500">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h2 className="text-xl font-semibold text-foreground md:text-2xl">{s.title}</h2>
                  </div>
                  <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-muted-foreground">
                    {s.body}
                  </div>
                </section>
              ))}
            </div>

            <div className="mt-12 rounded-2xl border border-border bg-gradient-to-br from-indigo-50 to-fuchsia-50 p-6 text-sm dark:from-indigo-950/40 dark:to-fuchsia-950/40">
              <p className="font-semibold text-foreground">Need to talk to a human?</p>
              <p className="mt-1 text-muted-foreground">
                Email{" "}
                <a href={`mailto:${brand.supportEmail}`} className="font-medium text-indigo-600 hover:underline">
                  {brand.supportEmail}
                </a>{" "}
                — we usually reply within one business day.
              </p>
            </div>
          </article>
        </div>
      </div>
    </PublicLayout>
  );
}
