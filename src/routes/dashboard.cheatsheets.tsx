import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { ContentTypeLibrary } from "@/components/library/ContentTypeLibrary";

export const Route = createFileRoute("/dashboard/cheatsheets")({
  component: CheatsheetsPage,
});

function CheatsheetsPage() {
  return (
    <ContentTypeLibrary
      theme={{
        type: "cheatsheet",
        eyebrow: "Cheatsheets",
        title: "One-page references you'll actually use",
        blurb: "Compact frameworks, prompt patterns, do's and don'ts — everything you want at a glance, in one place.",
        icon: FileText,
        gradient: "from-indigo-500 to-cyan-500",
        ring: "ring-indigo-400/30",
        ctaSingular: "Open cheatsheet",
        emptyTitle: "No cheatsheets yet",
        emptyHint: "New cheatsheets ship on the next generation run.",
      }}
    />
  );
}
