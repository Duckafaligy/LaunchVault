import { cn } from "@/lib/utils";

/**
 * Premium shimmer skeleton — replaces flat `animate-pulse` boxes with a
 * subtle horizontal gradient sweep. Use anywhere you'd use a loading box.
 *
 * Example:
 *   <Shimmer className="h-44 rounded-2xl" />
 */
export function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-md bg-muted",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.6s_ease-in-out_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent",
        "dark:before:via-white/10",
        className,
      )}
    />
  );
}

/**
 * Common pre-set shapes used across the dashboard.
 */
export function ShimmerCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-5 shadow-soft", className)}>
      <div className="flex items-center gap-3">
        <Shimmer className="h-10 w-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Shimmer className="h-3 w-1/3 rounded-full" />
          <Shimmer className="h-3 w-2/3 rounded-full" />
        </div>
      </div>
      <div className="mt-5 space-y-2">
        <Shimmer className="h-4 w-full rounded-full" />
        <Shimmer className="h-4 w-5/6 rounded-full" />
      </div>
      <div className="mt-6 flex justify-between">
        <Shimmer className="h-3 w-14 rounded-full" />
        <Shimmer className="h-3 w-14 rounded-full" />
      </div>
    </div>
  );
}

export function ShimmerGrid({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid gap-5 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <ShimmerCard key={i} />
      ))}
    </div>
  );
}
