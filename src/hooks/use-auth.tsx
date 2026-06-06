import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { identifyUser, resetIdentity } from "@/lib/analytics";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  /** Re-pull the session from Supabase so UI reflects server-side changes
   *  (e.g. email update via the admin API). Returns the refreshed user. */
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  refreshUser: async () => null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listener FIRST (per Supabase guidance)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      // Wire PostHog identity to Supabase auth state
      if (event === "SIGNED_IN" && s?.user) {
        void identifyUser(s.user.id, { email: s.user.email });
      } else if (event === "SIGNED_OUT") {
        void resetIdentity();
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
      // Identify on initial hydration if already signed in
      if (s?.user) void identifyUser(s.user.id, { email: s.user.email });
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    void resetIdentity();
    await supabase.auth.signOut();
  };

  // Force a session refresh so server-side changes (e.g. an email update made
  // via the admin API) show up immediately without requiring a re-login.
  const refreshUser = async () => {
    const { data, error } = await supabase.auth.refreshSession();
    if (!error && data.session) {
      setSession(data.session);
      setUser(data.session.user);
      return data.session.user;
    }
    // Fallback: pull the latest user record directly.
    const { data: u } = await supabase.auth.getUser();
    if (u?.user) setUser(u.user);
    return u?.user ?? null;
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
