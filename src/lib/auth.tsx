import type { Session, User } from "@supabase/supabase-js";
import { useNavigate } from "@tanstack/react-router";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { defineMessages, readLanguage } from "./i18n";
import { rememberReturnPath, takeReturnPath } from "./return-path";

interface AuthValue {
  user: User | null;
  /** True until the stored session has been read. */
  loading: boolean;
  isAdmin: boolean;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  /** `returnTo` is where the link in the confirmation email should lead, if one is needed. */
  signUpWithPassword: (
    name: string,
    email: string,
    password: string,
    returnTo: string,
  ) => Promise<{ needsConfirmation: boolean }>;
  /** Sends the browser to Google; once signed in, it continues to `returnTo`. */
  signInWithGoogle: (returnTo: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

const messages = defineMessages({
  en: {
    wrongPassword: "Wrong email or password.",
    confirmFirst: "Confirm your email first — check your inbox for the link.",
    exists: "An account with this email already exists. Sign in instead.",
    notEnabled: "This sign-in method isn't switched on yet. Contact TeachDesk support.",
    passwordLength: (n: string) => `The password must be at least ${n} characters.`,
    samePassword: "The new password must be different from the old one.",
    somethingWrong: "Something went wrong. Please try again.",
    googleFailed: "Google sign-in failed. Please try again.",
    teacher: "Teacher",
  },
  sv: {
    wrongPassword: "Fel e-postadress eller lösenord.",
    confirmFirst: "Bekräfta din e-postadress först — länken finns i din inkorg.",
    exists: "Det finns redan ett konto med den e-postadressen. Logga in i stället.",
    notEnabled: "Det här inloggningssättet är inte påslaget än. Kontakta TeachDesks support.",
    passwordLength: (n) => `Lösenordet måste ha minst ${n} tecken.`,
    samePassword: "Det nya lösenordet måste skilja sig från det gamla.",
    somethingWrong: "Något gick fel. Försök igen.",
    googleFailed: "Inloggningen med Google misslyckades. Försök igen.",
    teacher: "Lärare",
  },
});

/** Supabase returns English technical messages; map the common ones to plain language. */
function friendly(error: { message: string } | null): Error | null {
  if (!error) return null;
  const t = messages[readLanguage()];
  const m = error.message.toLowerCase();
  if (m.includes("invalid login credentials")) return new Error(t.wrongPassword);
  if (m.includes("email not confirmed")) return new Error(t.confirmFirst);
  if (m.includes("already registered")) return new Error(t.exists);
  if (m.includes("disabled") || m.includes("not enabled") || m.includes("signups not allowed"))
    return new Error(t.notEnabled);
  const length = m.match(/password should be at least (\d+)/)?.[1];
  if (length) return new Error(t.passwordLength(length));
  if (m.includes("different from the old password")) return new Error(t.samePassword);
  if (m.includes("password")) return new Error(error.message);
  return new Error(t.somethingWrong);
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

  // Signing in with Google or confirming an email lands on the site again; continue to the
  // page the visitor was on their way to, like an invitation.
  const navigate = useNavigate();
  useEffect(() => {
    if (!userId) return;
    const path = takeReturnPath();
    if (path) void navigate({ to: path });
  }, [userId, navigate]);

  const value = useMemo<AuthValue>(
    () => ({
      user: session?.user ?? null,
      loading,
      isAdmin,
      async signInWithPassword(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        throwIf(error);
      },
      async signUpWithPassword(name, email, password, returnTo) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name }, emailRedirectTo: siteUrl("/app") },
        });
        throwIf(error);
        if (!data.session) rememberReturnPath(returnTo);
        return { needsConfirmation: !data.session };
      },
      async signInWithGoogle(returnTo) {
        // Google sign-in is brokered by Lovable Cloud, which then sets the Supabase session
        // and comes back to the front page.
        rememberReturnPath(returnTo);
        const result = await lovable.auth.signInWithOAuth("google", {
          redirect_uri: window.location.origin,
        });
        if (result.error) {
          takeReturnPath(); // Not signing in after all, so forget where to go.
          throw friendly(result.error) ?? new Error(messages[readLanguage()].googleFailed);
        }
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
  return (
    meta.full_name || meta.name || user.email?.split("@")[0] || messages[readLanguage()].teacher
  );
}
