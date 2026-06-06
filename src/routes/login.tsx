import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Sparkles, Mail, Lock, Lightbulb, Workflow, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/brand/Logo";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { brand } from "@/config/brand";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: `Log in — ${brand.brandName}` },
      { name: "description", content: `Log in to ${brand.brandName} to continue your AI mastery journey.` },
      { name: "robots", content: "noindex,follow" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { upgrade?: string } => ({
    upgrade: typeof s.upgrade === "string" ? s.upgrade : undefined,
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { upgrade } = Route.useSearch();
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  const postAuthTarget = () =>
    upgrade
      ? { to: "/dashboard/account" as const, search: { upgrade } as any, replace: true as const }
      : { to: "/dashboard" as const, replace: true as const };

  useEffect(() => {
    if (!loading && user) navigate(postAuthTarget());
  }, [user, loading, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    if (!data.session) return toast.error("Login failed — no session returned.");
    toast.success("Welcome back!");
    navigate(postAuthTarget());
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const redirect = upgrade
      ? `${window.location.origin}/dashboard/account?upgrade=${encodeURIComponent(upgrade)}`
      : `${window.location.origin}/dashboard`;
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirect } });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    setMagicSent(true);
    toast.success("Check your inbox for the magic link.");
  };

  return (
    <div className="relative isolate min-h-[100dvh] overflow-hidden bg-slate-950 text-white">
      {/* Background aurora */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-20 h-[480px] w-[480px] rounded-full bg-indigo-600/30 blur-[140px]" />
        <div className="absolute top-1/3 -right-24 h-[420px] w-[420px] rounded-full bg-fuchsia-600/25 blur-[140px]" />
        <div className="absolute -bottom-32 left-1/3 h-[380px] w-[380px] rounded-full bg-violet-600/20 blur-[120px]" />
      </div>

      <div className="relative grid min-h-[100dvh] lg:grid-cols-2">
        {/* ====== LEFT: brand panel ====== */}
        <aside className="hidden flex-col justify-between border-r border-white/10 p-12 lg:flex">
          <div className="text-white">
            <Logo />
          </div>

          <div className="max-w-md">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-200">
              <Sparkles className="h-3 w-3" /> Welcome back
            </span>
            <h2 className="font-display mt-6 text-balance text-4xl font-bold leading-[1.05] tracking-[-0.02em] xl:text-5xl">
              The vault grew while
              <span className="block bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
                you were away.
              </span>
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-slate-300">
              Roughly 12 new items every two hours — quality-validated, sorted by domain, ready for the moment you open your dashboard.
            </p>

            <ul className="mt-10 space-y-4">
              <FeatureLine icon={Lightbulb} title="Daily insights" body="A fresh, opinionated AI take every morning." />
              <FeatureLine icon={BookOpen}  title="Q/A-gated lessons" body="Read, practise, prove it — then unlock the next." />
              <FeatureLine icon={Workflow}  title="Workflows + agents" body="Copy. Adapt. Ship. Today." />
            </ul>
          </div>

          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} {brand.brandName} · Built for AI mastery.
          </p>
        </aside>

        {/* ====== RIGHT: form — vertically centered with safe-area padding ====== */}
        <main className="flex min-h-[100dvh] flex-col items-center justify-center px-4 py-8 pt-[max(env(safe-area-inset-top),2rem)] pb-[max(env(safe-area-inset-bottom),2rem)] sm:px-8 lg:min-h-0 lg:px-12 lg:py-12">
          {/* Mobile-only logo */}
          <div className="mb-8 flex justify-center text-white lg:hidden">
            <Logo />
          </div>

          <div className="w-full max-w-md">
            <div className="text-center">
              <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Welcome back</h1>
              <p className="mt-2 text-sm text-slate-300">
                {upgrade ? "Log in to continue to checkout." : "Log in to pick up where you left off."}
              </p>
            </div>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-elevated backdrop-blur">
              {/* Tabs */}
              <div className="grid grid-cols-2 rounded-lg border border-white/10 bg-white/[0.03] p-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => { setMode("password"); setMagicSent(false); }}
                  className={`rounded-md py-2 transition-all ${mode === "password" ? "bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-md" : "text-slate-300 hover:text-white"}`}
                >
                  Password
                </button>
                <button
                  type="button"
                  onClick={() => { setMode("magic"); setMagicSent(false); }}
                  className={`rounded-md py-2 transition-all ${mode === "magic" ? "bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-md" : "text-slate-300 hover:text-white"}`}
                >
                  Magic link
                </button>
              </div>

              {mode === "password" ? (
                <form onSubmit={handlePasswordLogin} className="mt-5 space-y-4">
                  <div>
                    <Label htmlFor="email" className="text-slate-200">Email</Label>
                    <div className="relative mt-1.5">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="email"
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="border-white/10 bg-white/[0.03] pl-9 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-slate-200">Password</Label>
                    </div>
                    <div className="relative mt-1.5">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="password"
                        type="password"
                        required
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="border-white/10 bg-white/[0.03] pl-9 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="group h-11 w-full bg-gradient-to-br from-indigo-600 to-violet-700 text-base font-bold shadow-[0_0_30px_-5px_rgba(99,102,241,0.7)] transition-all hover:opacity-95"
                  >
                    {submitting ? "Logging in…" : (<>Log in <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>)}
                  </Button>
                </form>
              ) : magicSent ? (
                <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center text-sm text-emerald-100">
                  <Mail className="mx-auto h-7 w-7 text-emerald-400" />
                  <p className="mt-3 font-bold">Check your inbox</p>
                  <p className="mt-1 text-emerald-200/80">
                    We sent a magic link to <span className="font-mono text-white">{email}</span>. Click it to sign in.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleMagicLink} className="mt-5 space-y-4">
                  <div>
                    <Label htmlFor="magic-email" className="text-slate-200">Email</Label>
                    <div className="relative mt-1.5">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="magic-email"
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="border-white/10 bg-white/[0.03] pl-9 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>
                  <p className="text-[12px] leading-relaxed text-slate-400">
                    We'll email you a one-time sign-in link. No password needed.
                  </p>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="group h-11 w-full bg-gradient-to-br from-indigo-600 to-violet-700 text-base font-bold shadow-[0_0_30px_-5px_rgba(99,102,241,0.7)] transition-all hover:opacity-95"
                  >
                    {submitting ? "Sending…" : (<>Send magic link <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>)}
                  </Button>
                </form>
              )}
            </div>

            <p className="mt-6 text-center text-sm text-slate-300">
              New here?{" "}
              <Link to="/signup" className="font-bold text-white underline-offset-2 hover:underline">
                Create a free account
              </Link>
            </p>
            <p className="mt-3 text-center text-[11px] text-slate-500">
              By logging in you agree to our{" "}
              <Link to="/terms" className="text-slate-300 hover:underline">Terms</Link>
              {" & "}
              <Link to="/privacy" className="text-slate-300 hover:underline">Privacy</Link>.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

function FeatureLine({ icon: Icon, title, body }: { icon: typeof Sparkles; title: string; body: string }) {
  return (
    <li className="flex items-start gap-3.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-indigo-300">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-sm font-bold text-white">{title}</p>
        <p className="mt-0.5 text-[13px] leading-relaxed text-slate-400">{body}</p>
      </div>
    </li>
  );
}
