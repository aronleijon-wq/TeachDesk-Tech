import type { Session, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";

interface AuthValue {
  user: User | null;
  /** True until the stored session has been read. */
  loading: boolean;
  isAdmin: boolean;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (
    name: string,
    email: string,
    password: string,
  ) => Promise<{ needsConfirmation: boolean }>;
  /** Resolves once signed in; if the browser is sent to Google instead, it never needs to. */
  signInWithGoogle: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

/** Supabase returns English technical messages; map the common ones to plain language. */
function friendly(error: { message: string } | null): Error | null {
  if (!error) return null;
  const m = error.message.toLowerCase();
  if (m.includes("invalid login credentials")) return new Error("Wrong email or password.");
  if (m.includes("email not confirmed"))
    return new Error("Confirm your email first — check your inbox for the link.");
  if (m.includes("already registered"))
    return new Error("An account with this email already exists. Sign in instead.");
  if (m.includes("disabled") || m.includes("not enabled") || m.includes("signups not allowed"))
    return new Error("This sign-in method isn't switched on yet. Contact TeachDesk support.");
  if (m.includes("password")) return new Error(error.message);
  return new Error("Something went wrong. Please try again.");
}

function throwIf(error: { message: string } | null) {
  const e = friendly(error);
  if (e) throw e;
}

const siteUrl = (path: string) => `${window.location.origin}${path}`;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id;
  useEffect(() => {
    if (!userId) return setIsAdmin(false);
    // Admin rights are decided by the database; this only controls what the UI shows.
    supabase.rpc("is_admin").then(({ data, error }) => setIsAdmin(!error && data === true));
  }, [userId]);

  const value = useMemo<AuthValue>(
    () => ({
      user: session?.user ?? null,
      loading,
      isAdmin,
      async signInWithPassword(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        throwIf(error);
      },
      async signUpWithPassword(name, email, password) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name }, emailRedirectTo: siteUrl("/app") },
        });
        throwIf(error);
        return { needsConfirmation: !data.session };
      },
      async signInWithGoogle() {
        // Google sign-in is brokered by Lovable Cloud, which then sets the Supabase session.
        const result = await lovable.auth.signInWithOAuth("google", {
          redirect_uri: window.location.origin,
        });
        if (result.error)
          throw friendly(result.error) ?? new Error("Google sign-in failed. Please try again.");
      },
      async sendPasswordReset(email) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: siteUrl("/reset-password"),
        });
        throwIf(error);
      },
      async updatePassword(password) {
        const { error } = await supabase.auth.updateUser({ password });
        throwIf(error);
      },
      async signOut() {
        await supabase.auth.signOut();
      },
    }),
    [session, loading, isAdmin],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

/** Display name for a signed-in user: their chosen name, else the part of the email before @. */
export function displayName(user: User) {
  const meta = user.user_metadata as { full_name?: string; name?: string };
  return meta.full_name || meta.name || user.email?.split("@")[0] || "Teacher";
}
