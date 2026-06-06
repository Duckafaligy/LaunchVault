import { createFileRoute } from "@tanstack/react-router";
import { Briefcase } from "lucide-react";
import { ContentTypeLibrary } from "@/components/library/ContentTypeLibrary";

export const Route = createFileRoute("/dashboard/business")({
  component: BusinessPage,
});

function BusinessPage() {
  return (
    <ContentTypeLibrary
      theme={{
        type: "business_lesson",
        eyebrow: "Business",
        title: "AI business lessons that actually move revenue",
        blurb: "Strategy, monetization angles, real use cases, common mistakes — built for founders, agencies, and operators.",
        icon: Briefcase,
        gradient: "from-emerald-600 to-teal-500",
        ring: "ring-emerald-400/30",
        ctaSingular: "Read lesson",
        emptyTitle: "No business lessons yet",
        emptyHint: "New business plays ship every few hours.",
      }}
    />
  );
}
