import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { Copy, Check, Loader2, ExternalLink, Lock, Crown } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getContentPayload } from "@/utils/content.functions";
import { TIER_LABEL } from "@/config/brand";

export function ContentViewDialog({
  contentId,
  open,
  onOpenChange,
}: {
  contentId: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const fetchPayload = useServerFn(getContentPayload);
  const { data, isLoading } = useQuery({
    queryKey: ["content-payload", contentId],
    queryFn: () => fetchPayload({ data: { contentId } }),
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden p-0">
        {isLoading || !data ? (
          <div className="grid h-72 place-items-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : data.locked ? (
          <LockedBody data={data} onOpenChange={onOpenChange} />
        ) : (
          <UnlockedBody data={data} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function LockedBody({ data, onOpenChange }: { data: any; onOpenChange: (o: boolean) => void }) {
  const tier = data.item?.tier_required;
  return (
    <div className="p-8 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow">
        <Lock className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-xl font-semibold">{data.item?.title ?? "Locked content"}</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        {data.reason === "not_found"
          ? "This item is not available."
          : `Requires ${TIER_LABEL[tier as keyof typeof TIER_LABEL] ?? tier} or higher.`}
      </p>
      <div className="mt-6 flex justify-center gap-2">
        <Button asChild variant="outline" onClick={() => onOpenChange(false)}>
          <Link to="/pricing">View pricing</Link>
        </Button>
        <Button asChild className="bg-gradient-primary" onClick={() => onOpenChange(false)}>
          <Link to="/dashboard/account">Upgrade</Link>
        </Button>
      </div>
    </div>
  );
}

function UnlockedBody({ data }: { data: any }) {
  const item = data.item;
  const payload = data.payload;
  const isTemplate = item.type === "template";
  const isPrompt = item.type === "prompt";

  return (
    <>
      <DialogHeader className="border-b border-border bg-gradient-surface px-6 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="capitalize">{item.type}</Badge>
          <Badge variant="outline" className="capitalize">{item.category}</Badge>
          <Badge className="gap-1 bg-primary/10 text-primary hover:bg-primary/20">
            <Crown className="h-3 w-3" />
            {TIER_LABEL[item.tier_required as keyof typeof TIER_LABEL] ?? "Free"}
          </Badge>
        </div>
        <DialogTitle className="mt-2 text-xl">{item.title}</DialogTitle>
        <DialogDescription>{item.description}</DialogDescription>
      </DialogHeader>

      <div className="max-h-[68vh] overflow-y-auto">
        {isTemplate ? (
          <Tabs defaultValue="preview" className="w-full">
            <div className="border-b border-border px-6 pt-3">
              <TabsList>
                <TabsTrigger value="preview">Live Preview</TabsTrigger>
                {payload?.code && <TabsTrigger value="code">Code</TabsTrigger>}
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="preview" className="px-6 pb-6 pt-4">
              <BrowserFrame>
                {payload?.preview_html ? (
                  <iframe
                    title="Quick preview"
                    srcDoc={buildPreviewDoc(payload.preview_html)}
                    sandbox=""
                    className="h-[55vh] w-full bg-white"
                  />
                ) : (
                  <EmptyPreview />
                )}
              </BrowserFrame>
            </TabsContent>
            {payload?.code && (
              <TabsContent value="code" className="px-6 pb-6 pt-4">
                <CodeBlock code={payload.code} language={payload?.extra?.code_language ?? "tsx"} />
              </TabsContent>
            )}
            <TabsContent value="notes" className="px-6 pb-6 pt-4">
              <NotesPanel item={item} payload={payload} />
            </TabsContent>
          </Tabs>
        ) : isPrompt ? (
          <Tabs defaultValue="prompt" className="w-full">
            <div className="border-b border-border px-6 pt-3">
              <TabsList>
                <TabsTrigger value="prompt">Prompt</TabsTrigger>
                <TabsTrigger value="guide">Usage Guide</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="prompt" className="px-6 pb-6 pt-4">
              <CodeBlock code={payload?.prompt ?? ""} language="prompt" />
            </TabsContent>
            <TabsContent value="guide" className="px-6 pb-6 pt-4">
              <NotesPanel item={item} payload={payload} />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="px-6 py-5">
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-5 text-center">
              <p className="text-sm text-muted-foreground">
                Open the full lesson page for the complete experience.
              </p>
              <Button asChild className="mt-3 bg-gradient-primary">
                <Link to="/dashboard/content/$id" params={{ id: item.id }}>
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Open course
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border bg-card/40 px-6 py-3">
        <p className="text-xs text-muted-foreground">
          {item.preview_text || "Polished, copy-ready content."}
        </p>
        <Button asChild size="sm" variant="outline">
          <Link to="/dashboard/content/$id" params={{ id: item.id }}>
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Open full page
          </Link>
        </Button>
      </div>
    </>
  );
}

function BrowserFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-foreground/5 shadow-soft">
      <div className="flex items-center gap-1.5 border-b border-border bg-card px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
        <span className="ml-3 truncate rounded-md bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
          preview.launchvault.app
        </span>
      </div>
      {children}
    </div>
  );
}

function EmptyPreview() {
  return (
    <div className="grid h-[55vh] w-full place-items-center bg-white text-sm text-muted-foreground">
      No preview available — see the Code tab.
    </div>
  );
}

function NotesPanel({ item, payload }: { item: any; payload: any }) {
  const extra = payload?.extra ?? {};
  const bestFor: string[] = extra?.best_for ?? extra?.ui_preview?.best_for ?? [];
  const tips: string[] =
    extra?.customization_tips ??
    extra?.ui_preview?.customization_tips ??
    extra?.usage_steps ??
    [];
  const checklist: string[] =
    extra?.design_quality_checklist ?? extra?.quality_checklist ?? [];

  return (
    <div className="space-y-5 text-sm">
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          About
        </h4>
        <p className="mt-1.5 leading-relaxed">{item.description}</p>
      </div>
      {bestFor.length > 0 && (
        <ListBlock title="Best for" items={bestFor} />
      )}
      {tips.length > 0 && (
        <ListBlock title={item.type === "prompt" ? "Usage steps" : "Customization tips"} items={tips} />
      )}
      {checklist.length > 0 && (
        <ListBlock title="Quality checklist" items={checklist} />
      )}
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h4>
      <ul className="mt-1.5 space-y-1.5">
        {items.slice(0, 8).map((s, i) => (
          <li key={i} className="flex gap-2 leading-relaxed">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span>{s}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CodeBlock({ code, language = "html" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="relative">
      <div className="mb-2 flex items-center justify-between">
        <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {language}
        </span>
        <Button size="sm" variant="outline" onClick={onCopy}>
          {copied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre className="max-h-[55vh] overflow-auto rounded-xl border border-border bg-foreground/95 p-4 text-xs leading-relaxed text-background">
        <code className="whitespace-pre-wrap break-words">{code}</code>
      </pre>
    </div>
  );
}

function buildPreviewDoc(html: string) {
  const safe = String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "");
  return `<!doctype html><html><head><meta charset="utf-8"/><script src="https://cdn.tailwindcss.com"></script><style>body{margin:0;font-family:ui-sans-serif,system-ui,sans-serif;background:#fff;padding:16px}</style></head><body>${safe}</body></html>`;
}
