// =====================================================================
// MeteredReveal — metered-paywall preview.
//
// Renders `children` but caps the visible height to ~`fraction` of the
// content's NATURAL height (default 10%), fades the cut edge, and disables
// interaction. The caller stacks an upgrade gate directly beneath it.
//
// Why measure instead of a fixed max-height: articles vary wildly in length,
// so "first 10%" only reads right if it tracks the real content height. We
// clamp the result to [minPx, maxPx] so very short items still show a sensible
// taste and very long ones never dump half a screen of members-only content.
//
// SSR-safe: state starts at `maxPx`, so the server render (and the first client
// frame, before measurement) is already capped — the full body never flashes.
// =====================================================================

import { useEffect, useRef, useState, type ReactNode } from "react";

export function MeteredReveal({
  children,
  fraction = 0.1,
  minPx = 180,
  maxPx = 520,
}: {
  children: ReactNode;
  /** Portion of the natural content height to reveal (0–1). Default 0.10 = 10%. */
  fraction?: number;
  /** Never reveal less than this many px (so short items still show a taste). */
  minPx?: number;
  /** Never reveal more than this many px (so long items don't leak too much). */
  maxPx?: number;
}) {
  const innerRef = useRef<HTMLDivElement>(null);
  // Start capped at maxPx: pre-measurement (incl. SSR) we already hide the body.
  const [maxHeight, setMaxHeight] = useState<number>(maxPx);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const measure = () => {
      const full = el.scrollHeight;
      if (full > 0) {
        setMaxHeight(Math.max(minPx, Math.min(maxPx, Math.round(full * fraction))));
      }
    };
    measure();
    // Re-measure when the content reflows (font load, responsive breakpoints).
    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(measure);
      ro.observe(el);
      return () => ro.disconnect();
    }
    return undefined;
  }, [fraction, minPx, maxPx]);

  return (
    <div
      aria-hidden
      className="pointer-events-none select-none overflow-hidden [mask-image:linear-gradient(to_bottom,black,black_55%,transparent)]"
      style={{ maxHeight }}
    >
      <div ref={innerRef}>{children}</div>
    </div>
  );
}
