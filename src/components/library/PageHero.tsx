import type { LucideIcon } from "lucide-react";

export function PageHero({
  eyebrow,
  title,
  subtitle,
  icon: Icon,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-hero p-6 text-primary-foreground shadow-elevated md:p-8">
      <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-black/20 blur-3xl" />
      <div className="relative flex items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15 backdrop-blur-md ring-1 ring-white/20">
          <Icon className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-80">
            {eyebrow}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm opacity-90 md:text-base">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}
