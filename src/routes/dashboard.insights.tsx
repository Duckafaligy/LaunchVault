import { createFileRoute } from "@tanstack/react-router";
import { Lightbulb } from "lucide-react";
import { ContentTypeLibrary } from "@/components/library/ContentTypeLibrary";

export const Route = createFileRoute("/dashboard/insights")({
  component: InsightsPage,
});

function InsightsPage() {
  return (
    <ContentTypeLibrary
      theme={{
        type: "insight",
        eyebrow: "Daily Insights",
        title: "Your daily AI intelligence feed",
        blurb: "Short, useful insights on what changed in AI, what to use, and what to do — refreshed throughout the day.",
        icon: Lightbulb,
        gradient: "from-amber-500 to-orange-500",
        ring: "ring-amber-400/30",
        ctaSingular: "Read insight",
        emptyTitle: "No insights yet",
        emptyHint: "Today's insights drop on the next generation run.",
      }}
    />
  );
}
