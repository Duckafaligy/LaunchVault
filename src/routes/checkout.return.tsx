import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/checkout/return")({
  validateSearch: (search: Record<string, unknown>): { session_id?: string } => ({
    session_id:
      typeof search.session_id === "string" ? search.session_id : undefined,
  }),
  component: CheckoutReturn,
});

function CheckoutReturn() {
  const { session_id } = Route.useSearch();
  return (
    <div className="grid min-h-screen place-items-center bg-gradient-surface px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-elevated">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-2xl font-bold">Thanks for your purchase!</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {session_id
            ? "Your payment is being processed. Your access will update in a moment."
            : "Your payment is being processed."}
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button asChild>
            <Link to="/dashboard">Go to dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/dashboard/account">View account</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
