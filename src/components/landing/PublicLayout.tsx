import { useEffect, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { LandingNavbar } from "./LandingNavbar";
import { LandingFooter } from "./LandingFooter";
import { recordPageView } from "@/utils/analytics.functions";

export function PublicLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const recordViewFn = useServerFn(recordPageView);
  useEffect(() => {
    let anonId = "";
    try {
      anonId = localStorage.getItem("lv_anon_id") ?? "";
      if (!anonId) {
        anonId = crypto.randomUUID().replace(/-/g, "").slice(0, 24);
        localStorage.setItem("lv_anon_id", anonId);
      }
    } catch {/* ignore */}
    void recordViewFn({
      data: {
        path: pathname,
        anonId: anonId || undefined,
        referrer: typeof document !== "undefined" ? document.referrer.slice(0, 1000) : undefined,
      },
    }).catch(() => {/* best-effort */});
  }, [pathname, recordViewFn]);

  return (
    <div className="flex min-h-screen flex-col">
      <LandingNavbar />
      <main className="flex-1">{children}</main>
      <LandingFooter />
    </div>
  );
}
