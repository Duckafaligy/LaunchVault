// =====================================================================
// ProfileSettings — change name, email, password.
// Lives on /dashboard/account.
//
// Email + password go through Supabase auth.updateUser (sends confirmation
// emails when SMTP is configured). Name lives on profiles.full_name and
// updates via standard PostgREST upsert (RLS allows row owner).
// =====================================================================

import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { User as UserIcon, Mail, Lock, Loader2, Check, AlertCircle, Trash2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { updateProfileName, updateAuthEmail, changePasswordVerified, deleteAccount } from "@/utils/profile.functions";

type Props = {
  initialName?: string | null;
};

export function ProfileSettings({ initialName }: Props) {
  const { user } = useAuth();

  return (
    <section className="space-y-6">
      <div>
        <p className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-primary">Account settings</p>
        <h2 className="font-display mt-2 text-2xl font-bold tracking-tight md:text-3xl">Manage your account</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Update your name, email, or password. Changes apply immediately.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <NameCard initialName={initialName} />
        <EmailCard currentEmail={user?.email ?? ""} />
        <PasswordCard className="lg:col-span-2" />
        <DeleteAccountCard email={user?.email ?? ""} className="lg:col-span-2" />
      </div>
    </section>
  );
}

/* ===================== name ===================== */

function NameCard({ initialName }: { initialName?: string | null }) {
  const { user, refreshUser } = useAuth();
  const qc = useQueryClient();
  const updateNameFn = useServerFn(updateProfileName);
  const [name, setName] = useState(initialName ?? "");
  useEffect(() => { setName(initialName ?? ""); }, [initialName]);

  const m = useMutation({
    mutationFn: (newName: string) => updateNameFn({ data: { name: newName.trim() } }),
    onSuccess: async () => {
      // Refetch the profile (drives the dashboard greeting + sidebar) and
      // refresh the auth session (keeps user_metadata in sync).
      await qc.invalidateQueries({ queryKey: ["profile", user?.id] });
      void refreshUser();
      toast.success("Name updated", { description: "Your dashboard greeting now uses this name." });
    },
    onError: (e: any) => toast.error(e?.message ?? "Couldn't update name"),
  });

  const currentName = (initialName ?? "").trim();
  const disabled = !user || m.isPending || name.trim() === currentName;

  return (
    <Card icon={UserIcon} title="Display name" description="This is what the dashboard calls you — greeting, sidebar, and avatar initial.">
      <form
        onSubmit={(e) => { e.preventDefault(); if (!disabled) m.mutate(name); }}
        className="space-y-3"
      >
        <div>
          <Label htmlFor="profile-name">Name</Label>
          <Input
            id="profile-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            placeholder="Your name"
            className="mt-1.5"
          />
          <p className="mt-1.5 text-[11.5px] text-muted-foreground">
            Current: <span className="font-medium text-foreground">{currentName || "—"}</span>
          </p>
        </div>
        <Button type="submit" disabled={disabled} className="bg-gradient-primary">
          {m.isPending ? (<><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Saving…</>) : (<><Check className="mr-1.5 h-4 w-4" /> Save name</>)}
        </Button>
      </form>
    </Card>
  );
}

/* ===================== email ===================== */

function EmailCard({ currentEmail }: { currentEmail: string }) {
  const { refreshUser } = useAuth();
  const updateEmailFn = useServerFn(updateAuthEmail);
  const [email, setEmail] = useState(currentEmail);
  useEffect(() => { setEmail(currentEmail); }, [currentEmail]);

  const m = useMutation({
    mutationFn: (newEmail: string) => updateEmailFn({ data: { email: newEmail.trim().toLowerCase() } }),
    onSuccess: async (res) => {
      // Pull the new email into the live session so the UI updates immediately
      // (the admin email change doesn't touch the cached browser session).
      await refreshUser();
      toast.success("Email updated", {
        description: `Your account email is now ${res.email}. Use it for your next sign-in.`,
        duration: 6000,
      });
    },
    onError: (e: any) => toast.error(e?.message ?? "Couldn't update email"),
  });

  const disabled = m.isPending || email.trim().toLowerCase() === currentEmail.toLowerCase() || !email.trim();

  return (
    <Card icon={Mail} title="Email address" description="We'll send a confirmation link to the new address before switching.">
      <form
        onSubmit={(e) => { e.preventDefault(); if (!disabled) m.mutate(email); }}
        className="space-y-3"
      >
        <div>
          <Label htmlFor="profile-email">Email</Label>
          <Input
            id="profile-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-1.5"
            autoComplete="email"
          />
          <p className="mt-1.5 text-[11.5px] text-muted-foreground">
            Current: <span className="font-mono text-foreground">{currentEmail}</span>
          </p>
        </div>
        <Button type="submit" disabled={disabled} className="bg-gradient-primary">
          {m.isPending ? (<><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Sending…</>) : (<><Check className="mr-1.5 h-4 w-4" /> Send confirmation</>)}
        </Button>
      </form>
    </Card>
  );
}

/* ===================== password ===================== */

function PasswordCard({ className }: { className?: string }) {
  const changePwFn = useServerFn(changePasswordVerified);
  const [current, setCurrent] = useState("");
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");

  const m = useMutation({
    mutationFn: () => changePwFn({ data: { currentPassword: current, newPassword: pw } }),
    onSuccess: () => {
      toast.success("Password updated");
      setCurrent(""); setPw(""); setConfirm("");
    },
    onError: (e: any) => toast.error(e?.message ?? "Couldn't update password"),
  });

  const mismatch = !!confirm && pw !== confirm;
  const disabled = m.isPending || !current || pw.length < 8 || pw !== confirm;

  return (
    <Card icon={Lock} title="Password" description="Verify your current password, then set a new one. At least 8 characters." className={className}>
      <form
        onSubmit={(e) => { e.preventDefault(); if (!disabled) m.mutate(); }}
        className="grid gap-3 sm:grid-cols-2"
      >
        <div className="sm:col-span-2">
          <Label htmlFor="profile-pw-current">Current password</Label>
          <Input
            id="profile-pw-current"
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            placeholder="Your current password"
            className="mt-1.5"
            autoComplete="current-password"
          />
        </div>
        <div>
          <Label htmlFor="profile-pw">New password</Label>
          <Input
            id="profile-pw"
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            minLength={8}
            placeholder="At least 8 characters"
            className="mt-1.5"
            autoComplete="new-password"
          />
        </div>
        <div>
          <Label htmlFor="profile-pw-confirm">Confirm new password</Label>
          <Input
            id="profile-pw-confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Re-enter new password"
            className={`mt-1.5 ${mismatch ? "border-rose-500 focus-visible:ring-rose-500" : ""}`}
            autoComplete="new-password"
          />
          {mismatch && (
            <p className="mt-1.5 inline-flex items-center gap-1 text-[11.5px] font-semibold text-rose-600">
              <AlertCircle className="h-3 w-3" /> Passwords don't match
            </p>
          )}
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={disabled} className="bg-gradient-primary">
            {m.isPending ? (<><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Updating…</>) : (<><Check className="mr-1.5 h-4 w-4" /> Update password</>)}
          </Button>
        </div>
      </form>
    </Card>
  );
}

/* ===================== delete account ===================== */

function DeleteAccountCard({ email, className }: { email: string; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className={`rounded-2xl border border-rose-500/30 bg-gradient-to-br from-rose-50/40 to-card p-5 shadow-soft dark:from-rose-950/20 ${className ?? ""}`}>
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-soft">
            <Trash2 className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-lg font-bold leading-tight tracking-tight">Delete account</h3>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Permanently remove your account, content, saved items, and any active subscription. This can't be undone.
            </p>
          </div>
        </div>
        <div className="mt-5">
          <Button
            type="button"
            onClick={() => setOpen(true)}
            variant="outline"
            className="border-rose-500/40 text-rose-700 hover:bg-rose-500/10 hover:text-rose-700 dark:text-rose-300 dark:hover:text-rose-300"
          >
            <Trash2 className="mr-1.5 h-4 w-4" /> Delete my account…
          </Button>
        </div>
      </div>
      <DeleteAccountDialog open={open} onOpenChange={setOpen} email={email} />
    </>
  );
}

function DeleteAccountDialog({
  open, onOpenChange, email,
}: { open: boolean; onOpenChange: (o: boolean) => void; email: string }) {
  const deleteFn = useServerFn(deleteAccount);
  const navigate = useNavigate();
  const [confirmEmail, setConfirmEmail] = useState("");
  const [agreed, setAgreed] = useState(false);

  // Reset on open
  useEffect(() => { if (open) { setConfirmEmail(""); setAgreed(false); } }, [open]);

  const m = useMutation({
    mutationFn: () => deleteFn({ data: { confirmEmail, acknowledgedTerms: true } }),
    onSuccess: async () => {
      toast.success("Account deleted. Goodbye.");
      // Sign out the browser session locally + redirect
      try { await supabase.auth.signOut(); } catch {}
      navigate({ to: "/" });
    },
    onError: (e: any) => toast.error(e?.message ?? "Couldn't delete account"),
  });

  const emailMatches = confirmEmail.trim().toLowerCase() === email.trim().toLowerCase();
  const canDelete = !!email && emailMatches && agreed && !m.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="space-y-1">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-glow">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <DialogTitle className="font-display text-center text-xl font-bold tracking-tight">
            Delete your account?
          </DialogTitle>
          <DialogDescription className="text-center text-[13px] text-muted-foreground">
            This permanently erases your data and cancels any active subscription. It cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-3 rounded-xl border border-rose-500/20 bg-rose-500/[0.04] p-3 text-[12.5px] leading-relaxed text-foreground">
          <p className="font-bold text-rose-700 dark:text-rose-300">What gets deleted, right now:</p>
          <ul className="space-y-1.5 pl-4 list-disc text-muted-foreground">
            <li>Your profile, name, email, and password</li>
            <li>All Saved Vault items + course progress + XP / streaks</li>
            <li>Your Stripe subscription (cancelled immediately, no further charges)</li>
            <li>All analytics events tied to your user ID</li>
          </ul>
          <p className="text-muted-foreground">
            Content created by the autonomous engine stays public; it isn't tied to your account.
          </p>
        </div>

        <div className="mt-2 space-y-3">
          <div>
            <Label htmlFor="del-email" className="text-[13px]">Type your email to confirm</Label>
            <Input
              id="del-email"
              type="email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder={email}
              className={`mt-1.5 ${confirmEmail && !emailMatches ? "border-rose-500" : ""}`}
              autoComplete="off"
            />
            {confirmEmail && !emailMatches && (
              <p className="mt-1 text-[11.5px] font-semibold text-rose-600">Doesn't match your account email.</p>
            )}
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer select-none rounded-lg border border-border bg-card px-3 py-2.5">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-rose-600"
            />
            <span className="text-[12.5px] leading-snug text-foreground">
              I understand this <strong>permanently deletes all my data</strong>, cancels any active subscription, and cannot be reversed.
            </span>
          </label>
        </div>

        <DialogFooter className="mt-3 gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={m.isPending}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => m.mutate()}
            disabled={!canDelete}
            className="bg-gradient-to-br from-rose-600 to-red-700 text-white shadow-glow hover:opacity-95"
          >
            {m.isPending ? (<><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Deleting…</>) : (<><Trash2 className="mr-1.5 h-4 w-4" /> Delete permanently</>)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ===================== shared card shell ===================== */

function Card({
  icon: Icon, title, description, children, className,
}: { icon: typeof UserIcon; title: string; description: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-5 shadow-soft ${className ?? ""}`}>
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-soft">
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-bold leading-tight tracking-tight">{title}</h3>
          <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}
