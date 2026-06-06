import { createFileRoute } from "@tanstack/react-router";
import { Bot } from "lucide-react";
import { ContentTypeLibrary } from "@/components/library/ContentTypeLibrary";

export const Route = createFileRoute("/dashboard/agents")({
  component: AgentsPage,
});

function AgentsPage() {
  return (
    <ContentTypeLibrary
      theme={{
        type: "agent",
        eyebrow: "Agent Blueprints",
        title: "Production-ready agent blueprints",
        blurb: "Goal, tools, memory, system instructions, workflow, safety — everything you need to ship a single-purpose agent.",
        icon: Bot,
        gradient: "from-fuchsia-600 to-pink-600",
        ring: "ring-fuchsia-400/30",
        ctaSingular: "Open blueprint",
        emptyTitle: "No agent blueprints yet",
        emptyHint: "New agent blueprints arrive on every generation run.",
      }}
    />
  );
}
