import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Sparkles, Mail, Lock, User, CheckCircle2, ShieldCheck, RefreshCw, Zap, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/brand/Logo";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { brand } from "@/config/brand";
import { track } from "@/lib/analytics";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: `Sign up — ${brand.brandName}` },
      { name: "description", content: `Create a free ${brand.brandName} account. No credit card. 10 content types across 50 AI mastery domains.` },
      { name: "robots", content: "noindex,follow" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { upgrade?: string } => ({
    upgrade: typeof s.upgrade === "string" ? s.upgrade : undefined,
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { upgrade } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const postAuthTarget = () =>
    upgrade
      ? { to: "/dashboard/account" as const, search: { upgrade } as any }
      : { to: "/dashboard" as const };

  useEffect(() => {
    if (user) navigate(postAuthTarget());
  }, [user, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    void track.signupStarted({ from: "signup_page", upgrade });
    setLoading(true);
    const emailRedirect = upgrade
      ? `${window.location.origin}/dashboard/account?upgrade=${encodeURIComponent(upgrade)}`
      : `${window.location.origin}/dashboard`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: emailRedirect,
        data: { full_name: name },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    if (data?.user) void track.signupCompleted({ userId: data.user.id, method: "password" });
    toast.success("Account created! Check your email to verify.");
    navigate(postAuthTarget());
  };

  // Password strength
  const strength = passwordStrength(password);

  return (
    <div className="relative isolate min-h-[100dvh] overflow-hidden bg-slate-950 text-white">
      {/* Background aurora */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-20 h-[480px] w-[480px] rounded-full bg-fuchsia-600/25 blur-[140px]" />
        <div className="absolute top-1/3 -left-24 h-[420px] w-[420px] rounded-full bg-indigo-600/30 blur-[140px]" />
        <div className="absolute -bottom-32 right-1/3 h-[380px] w-[380px] rounded-full bg-violet-600/20 blur-[120px]" />
      </div>

      <div className="relative grid min-h-[100dvh] lg:grid-cols-2">
        {/* ====== LEFT: brand panel ====== */}
        <aside className="hidden flex-col justify-between border-r border-white/10 p-12 lg:flex">
          <div className="text-white">
            <Logo />
          </div>

          <div className="max-w-md">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-fuchsia-200">
              <Sparkles className="h-3 w-3" /> Free · no credit card
            </span>
            <h2 className="font-display mt-6 text-balance text-4xl font-bold leading-[1.05] tracking-[-0.02em] xl:text-5xl">
              Open the vault.
              <span className="block bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
                Free, forever.
              </span>
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-slate-300">
              Sign up in 30 seconds. Browse the full library, unlock the entire free tier, get the daily AI mastery feed — all without putting a card down.
            </p>

            <ul className="mt-10 space-y-3.5">
              <Perk>10 content types — prompts, courses, agents, business plays &amp; more</Perk>
              <Perk>50 AI mastery domains, refreshed every two hours</Perk>
              <Perk>Q/A-gated lessons, XP, streaks, save unlimited (on paid)</Perk>
              <Perk>Cancel anytime · One click · Zero lock-in</Perk>
            </ul>

            <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
              <div className="flex items-center gap-2 text-emerald-300">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-[0.16em]">No card required</span>
              </div>
              <p className="mt-3 text-[13.5px] leading-relaxed text-slate-200">
                The Free tier is real and never expires. Open the vault, read the full live library, and get the
                daily AI mastery feed — no card, no commitment, upgrade whenever you&apos;re ready.
              </p>
            </div>
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
              <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Create your account</h1>
              <p className="mt-2 text-sm text-slate-300">
                {upgrade ? "Sign up, then continue to checkout." : "Free forever. Upgrade only when you want."}
              </p>
            </div>

            {/* Mobile-only quick perks */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11.5px] text-slate-300 lg:hidden">
              <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> No card</span>
              <span className="inline-flex items-center gap-1"><RefreshCw className="h-3.5 w-3.5 text-indigo-300" /> 2-hour drops</span>
              <span className="inline-flex items-center gap-1"><Zap className="h-3.5 w-3.5 text-amber-400" /> 30 seconds</span>
            </div>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-elevated backdrop-blur">
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-slate-200">Full name</Label>
                  <div className="relative mt-1.5">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="name"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="border-white/10 bg-white/[0.03] pl-9 text-white placeholder:text-slate-500 focus-visible:ring-fuchsia-500"
                      placeholder="Your name"
                    />
                  </div>
                </div>

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
                      className="border-white/10 bg-white/[0.03] pl-9 text-white placeholder:text-slate-500 focus-visible:ring-fuchsia-500"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="password" className="text-slate-200">Password</Label>
                  <div className="relative mt-1.5">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="password"
                      type="password"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="border-white/10 bg-white/[0.03] pl-9 text-white placeholder:text-slate-500 focus-visible:ring-fuchsia-500"
                      placeholder="At least 6 characters"
                    />
                  </div>
                  {/* Strength meter */}
                  {password.length > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex gap-1">
                        {[0, 1, 2, 3].map((i) => (
                          <span
                            key={i}
                            className={`h-1 w-7 rounded-full transition-colors ${
                              i < strength.score
                                ? strength.score === 1 ? "bg-rose-500"
                                : strength.score === 2 ? "bg-amber-500"
                                : strength.score === 3 ? "bg-lime-500"
                                : "bg-emerald-500"
                                : "bg-white/10"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] font-semibold text-slate-300">{strength.label}</span>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="group h-11 w-full bg-gradient-to-br from-indigo-600 to-fuchsia-600 text-base font-bold shadow-[0_0_30px_-5px_rgba(217,70,239,0.6)] transition-all hover:opacity-95"
                >
                  {loading ? "Creating…" : (<>Create free account <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>)}
                </Button>
              </form>
            </div>

            <p className="mt-6 text-center text-sm text-slate-300">
              Already have an account?{" "}
              <Link to="/login" className="font-bold text-white underline-offset-2 hover:underline">
                Log in
              </Link>
            </p>
            <p className="mt-3 text-center text-[11px] text-slate-500">
              By signing up you agree to our{" "}
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

function Perk({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-emerald-400" />
      <span className="text-[14px] leading-relaxed text-slate-200">{children}</span>
    </li>
  );
}

function passwordStrength(pw: string): { score: 0 | 1 | 2 | 3 | 4; label: string } {
  if (!pw) return { score: 0, label: "" };
  let s = 0;
  if (pw.length >= 6) s++;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) s++;
  const score = Math.min(s, 4) as 0 | 1 | 2 | 3 | 4;
  const labels: Record<number, string> = { 1: "Weak", 2: "Fair", 3: "Strong", 4: "Excellent" };
  return { score, label: labels[score] ?? "" };
}
