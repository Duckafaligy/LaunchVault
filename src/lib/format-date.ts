// =====================================================================
// Date helpers for content "published / added on" labels.
// Every content item stores created_at; these format it consistently
// across the public site + dashboard.
// =====================================================================

import { format, formatDistanceToNowStrict, isValid, parseISO } from "date-fns";

function toDate(input?: string | number | Date | null): Date | null {
  if (!input) return null;
  if (input instanceof Date) return isValid(input) ? input : null;
  if (typeof input === "number") {
    const d = new Date(input);
    return isValid(d) ? d : null;
  }
  const d = parseISO(input);
  return isValid(d) ? d : null;
}

/** Absolute date — e.g. "May 28, 2026". Empty string if unparseable. */
export function formatDate(input?: string | number | Date | null): string {
  const d = toDate(input);
  return d ? format(d, "MMM d, yyyy") : "";
}

/** Absolute date + time — e.g. "May 28, 2026 · 3:14 PM". */
export function formatDateTime(input?: string | number | Date | null): string {
  const d = toDate(input);
  return d ? format(d, "MMM d, yyyy · h:mm a") : "";
}

/** Relative — e.g. "2 hours ago", "3 days ago". Empty string if unparseable. */
export function timeAgo(input?: string | number | Date | null): string {
  const d = toDate(input);
  return d ? `${formatDistanceToNowStrict(d)} ago` : "";
}
