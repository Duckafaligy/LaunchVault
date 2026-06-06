import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X, Sparkles } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

const NAV = [
  { label: "Learn AI", to: "/learn-ai" },
  { label: "Features", to: "/features" },
  { label: "Pricing",  to: "/pricing"  },
  { label: "Our story", to: "/about"   },
];

export function LandingNavbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled
          ? "border-b border-border/80 bg-background/85 shadow-soft backdrop-blur-xl"
          : "border-b border-transparent bg-background/40 backdrop-blur-md"
      }`}
    >
      {/* Top live-pulse strip — subtle "vault is alive" cue */}
      <div className="hidden md:block">
        <div className="mx-auto flex h-7 max-w-6xl items-center justify-between px-4 text-[11px]">
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            Fresh AI prompts, courses &amp; guides — new every 2 hours
          </span>
          <Link to="/features" className="text-muted-foreground transition-colors hover:text-foreground">
            See how it works <span className="opacity-50">→</span>
          </Link>
        </div>
      </div>

      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Logo />

        <nav className="hidden items-center gap-1 text-sm font-medium md:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="rounded-lg px-3 py-1.5 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
              activeProps={{ className: "bg-muted text-foreground" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <Button asChild className="bg-gradient-primary shadow-soft hover:opacity-95">
              <Link to="/dashboard"><Sparkles className="mr-1.5 h-3.5 w-3.5" /> Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost"><Link to="/login">Log in</Link></Button>
              <Button asChild className="bg-gradient-primary shadow-soft transition-transform hover:scale-[1.02] hover:opacity-95">
                <Link to="/signup">Start Free</Link>
              </Button>
            </>
          )}
        </div>

        <button
          className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle navigation"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
              >
                {n.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2">
              {user ? (
                <Button asChild className="flex-1 bg-gradient-primary">
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="outline" className="flex-1">
                    <Link to="/login">Log in</Link>
                  </Button>
                  <Button asChild className="flex-1 bg-gradient-primary">
                    <Link to="/signup">Start Free</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
