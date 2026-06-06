import { Link } from "@tanstack/react-router";
import { brand } from "@/config/brand";

/**
 * LaunchVault mark — a stylised vault door with an upward "launch" chevron.
 * Pure SVG, sharp at any size, gradient-aware.
 */
export function Logo({ className = "", size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const dims = size === "lg" ? "h-10 w-10" : size === "sm" ? "h-7 w-7" : "h-8 w-8";
  const text = size === "lg" ? "text-xl" : "text-lg";
  return (
    <Link to="/" className={`group flex items-center gap-2.5 font-bold tracking-tight ${className}`}>
      <span className={`relative grid ${dims} place-items-center overflow-hidden rounded-xl shadow-soft ring-1 ring-white/10`}>
        <span className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-violet-600 to-fuchsia-600" />
        <span className="absolute -top-3 left-1/2 h-6 w-6 -translate-x-1/2 rounded-full bg-white/30 blur-md" />
        <svg viewBox="0 0 32 32" className="relative h-[70%] w-[70%] text-white drop-shadow" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {/* three ascending chevrons — tiered mastery */}
          <path d="M9.5 23.25 L16 18.5 L22.5 23.25" opacity="0.38" />
          <path d="M9.5 18 L16 13.25 L22.5 18" opacity="0.72" />
          <path d="M9.5 12.75 L16 8 L22.5 12.75" opacity="1" />
        </svg>
      </span>
      <span className={`${text} bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent`}>
        {brand.brandName}
      </span>
    </Link>
  );
}
