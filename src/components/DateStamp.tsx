// =====================================================================
// DateStamp — renders a content item's "added on" timestamp safely.
//
// Why a component: on server-rendered (public) pages the HTML is produced
// in UTC, but the browser formats in the visitor's local timezone. Showing
// the time directly would cause a React hydration mismatch. So we render the
// DATE on the server + first client paint, then upgrade to date + local time
// after mount. suppressHydrationWarning keeps the console clean.
// =====================================================================

import { useEffect, useState } from "react";
import { formatDate, formatDateTime } from "@/lib/format-date";

export function DateStamp({
  iso,
  withTime = true,
  prefix,
  className,
}: {
  iso?: string | null;
  withTime?: boolean;
  prefix?: string;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!iso) return null;
  // Pre-hydration: date only (deterministic enough). After mount: + local time.
  const text = withTime && mounted ? formatDateTime(iso) : formatDate(iso);

  return (
    <span className={className} suppressHydrationWarning>
      {prefix}{text}
    </span>
  );
}
