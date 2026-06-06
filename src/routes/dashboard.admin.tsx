// /dashboard/admin redirects to /dashboard/account.
// The visitor-stats widget there is admin-only.
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/admin")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard/account" });
  },
  component: () => null,
});
