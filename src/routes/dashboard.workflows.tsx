import { createFileRoute } from "@tanstack/react-router";
import { Workflow } from "lucide-react";
import { ContentTypeLibrary } from "@/components/library/ContentTypeLibrary";

export const Route = createFileRoute("/dashboard/workflows")({
  component: WorkflowsPage,
});

function WorkflowsPage() {
  return (
    <ContentTypeLibrary
      theme={{
        type: "workflow",
        eyebrow: "Workflows",
        title: "Step-by-step AI execution guides",
        blurb: "Each workflow walks you from input to output — tools, prompts, checks, and the exact order to run them in.",
        icon: Workflow,
        gradient: "from-sky-500 to-indigo-600",
        ring: "ring-sky-400/30",
        ctaSingular: "Open workflow",
        emptyTitle: "No workflows yet",
        emptyHint: "New workflows ship every few hours. Check back soon — or trigger the generator from Admin.",
      }}
    />
  );
}
