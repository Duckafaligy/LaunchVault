import { createFileRoute } from "@tanstack/react-router";
import { Wrench } from "lucide-react";
import { ContentTypeLibrary } from "@/components/library/ContentTypeLibrary";

export const Route = createFileRoute("/dashboard/tools")({
  component: ToolsPage,
});

function ToolsPage() {
  return (
    <ContentTypeLibrary
      theme={{
        type: "tool_guide",
        eyebrow: "Tool Guides",
        title: "What to use, how to use it, and when",
        blurb: "Honest, structured guides to AI tools — what they do, who they're for, and how to run them in real workflows.",
        icon: Wrench,
        gradient: "from-zinc-700 to-zinc-900",
        ring: "ring-zinc-500/30",
        ctaSingular: "Open guide",
        emptyTitle: "No tool guides yet",
        emptyHint: "New tool guides arrive on every generation run.",
      }}
    />
  );
}
