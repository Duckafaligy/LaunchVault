import { createFileRoute } from "@tanstack/react-router";
import { Target } from "lucide-react";
import { ContentTypeLibrary } from "@/components/library/ContentTypeLibrary";

export const Route = createFileRoute("/dashboard/challenges")({
  component: ChallengesPage,
});

function ChallengesPage() {
  return (
    <ContentTypeLibrary
      theme={{
        type: "challenge",
        eyebrow: "Challenges",
        title: "Small tasks that build real AI skill",
        blurb: "Short focused challenges with starter material, success criteria, and an example solution. Practice over passive reading.",
        icon: Target,
        gradient: "from-red-600 to-orange-500",
        ring: "ring-red-400/30",
        ctaSingular: "Start challenge",
        emptyTitle: "No challenges yet",
        emptyHint: "New challenges arrive on the next generation run.",
      }}
    />
  );
}
