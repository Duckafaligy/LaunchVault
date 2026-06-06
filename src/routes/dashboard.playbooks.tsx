import { createFileRoute } from "@tanstack/react-router";
import { ScrollText } from "lucide-react";
import { ContentTypeLibrary } from "@/components/library/ContentTypeLibrary";

export const Route = createFileRoute("/dashboard/playbooks")({
  component: PlaybooksPage,
});

function PlaybooksPage() {
  return (
    <ContentTypeLibrary
      theme={{
        type: "playbook",
        eyebrow: "Playbooks",
        title: "End-to-end execution plans",
        blurb: "From goal to deliverable — multi-phase plays with checklists and success metrics, ready to run start-to-finish.",
        icon: ScrollText,
        gradient: "from-rose-600 to-fuchsia-600",
        ring: "ring-rose-400/30",
        ctaSingular: "Open playbook",
        emptyTitle: "No playbooks yet",
        emptyHint: "New playbooks ship on the next generation run.",
      }}
    />
  );
}
