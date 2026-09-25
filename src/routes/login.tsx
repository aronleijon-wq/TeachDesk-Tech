import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { AuthLayout, GoogleIcon } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";

type Mode = "sign-in" | "sign-up" | "forgot";

export const Route = createFileRoute("/login")({
  // Only allow redirects back into the app, never to another site.
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => {
    const redirect = search["redirect"];
    return typeof redirect === "string" && redirect.startsWith("/app") ? { redirect } : {};
  },
  head: () => ({
    meta: [
      { title: "Sign in — TeachDesk" },
      { name: "description", content: "Sign in to your TeachDesk account to plan exams, grade work and follow up with students." },
      { property: "og:title", content: "Sign in — TeachDesk" },
      { property: "og:description", content: "Sign in to your TeachDesk account to plan exams, grade work and follow up with students." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

const copy: Record<Mode, { title: string; subtitle: string; submit: string }> = {
  "sign-in": { title: "Sign in", subtitle: "Welcome back to TeachDesk.", submit: "Sign in" },
  "sign-up": { title: "Create your account", subtitle: "Start using TeachDesk in a minute.", submit: "Create account" },
  forgot: { title: "Reset your password", subtitle: "We'll email you a link to choose a new one.", submit: "Send reset link" },
};

function LoginPage() {
  const { redirect = "/app" } = Route.useSearch();
  const navigate = useNavigate();
  const auth = useAuth();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Already signed in (or just signed in): go to the app.
  useEffect(() => {
    if (auth.user) void navigate({ to: redirect });
  }, [auth.user, navigate, redirect]);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setNotice(null);
  };

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void run(async () => {
      if (mode === "sign-in") return auth.signInWithPassword(form.email, form.password);
      if (mode === "forgot") {
        await auth.sendPasswordReset(form.email);
        return setNotice("If an account exists for that email, a reset link is on its way.");
      }
      const { needsConfirmation } = await auth.signUpWithPassword(form.name.trim(), form.email, form.password);
      if (needsConfirmation) setNotice("Check your inbox and click the link to confirm your email.");
    });
  };

  const field = (key: keyof typeof form) => ({
    id: key,
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  return (
    <AuthLayout title={copy[mode].title} subtitle={copy[mode].subtitle}>
      {mode !== "forgot" && (
        <>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={busy}
            onClick={() => void run(auth.signInWithGoogle)}
          >
            <GoogleIcon /> Continue with Google
          </Button>
          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or with email <span className="h-px flex-1 bg-border" />
          </div>
        </>
      )}

      <form onSubmit={submit} className="space-y-4">
        {mode === "sign-up" && (
          <div className="space-y-1.5">
            <Label htmlFor="name">Your name</Label>
            <Input {...field("name")} autoComplete="name" required />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input {...field("email")} type="email" autoComplete="email" required />
        </div>
        {mode !== "forgot" && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              {mode === "sign-in" && (
                <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => switchMode("forgot")}>
                  Forgot password?
                </button>
              )}
            </div>
            <Input
              {...field("password")}
              type="password"
              autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
              minLength={mode === "sign-up" ? 8 : undefined}
              required
            />
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
        {notice && <p className="text-sm text-success">{notice}</p>}

        <Button type="submit" className="w-full" disabled={busy}>
          {busy && <Loader2 className="size-4 animate-spin" />}
          {copy[mode].submit}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {mode === "sign-in" ? (
          <>
            New to TeachDesk?{" "}
            <button type="button" className="font-medium text-foreground hover:underline" onClick={() => switchMode("sign-up")}>
              Create an account
            </button>
          </>
        ) : (
          <button type="button" className="font-medium text-foreground hover:underline" onClick={() => switchMode("sign-in")}>
            Back to sign in
          </button>
        )}
      </p>
    </AuthLayout>
  );
}
