import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { AuthLayout, GoogleIcon } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { defineMessages, useMessages } from "@/lib/i18n";
import { safeReturnPath } from "@/lib/return-path";

type Mode = "sign-in" | "sign-up" | "forgot";

const messages = defineMessages({
  en: {
    pageTitle: "Sign in — TeachDesk",
    modes: {
      "sign-in": { title: "Sign in", subtitle: "Welcome back to TeachDesk.", submit: "Sign in" },
      "sign-up": {
        title: "Create your account",
        subtitle: "Start using TeachDesk in a minute.",
        submit: "Create account",
      },
      forgot: {
        title: "Reset your password",
        subtitle: "We'll email you a link to choose a new one.",
        submit: "Send reset link",
      },
    } satisfies Record<Mode, { title: string; subtitle: string; submit: string }>,
    // Shown instead when someone signs in to accept an invitation.
    joining: {
      "sign-in": "Sign in to join your school on TeachDesk.",
      "sign-up": "Use the email address your invitation was sent to.",
    },
    somethingWrong: "Something went wrong. Please try again.",
    resetSent: "If an account exists for that email, a reset link is on its way.",
    confirmEmail: "Check your inbox and click the link to confirm your email.",
    google: "Continue with Google",
    orEmail: "or with email",
    name: "Your name",
    email: "Email",
    password: "Password",
    forgot: "Forgot password?",
    newHere: "New to TeachDesk?",
    createAccount: "Create an account",
    backToSignIn: "Back to sign in",
  },
  sv: {
    pageTitle: "Logga in — TeachDesk",
    modes: {
      "sign-in": { title: "Logga in", subtitle: "Välkommen tillbaka till TeachDesk.", submit: "Logga in" },
      "sign-up": {
        title: "Skapa ditt konto",
        subtitle: "Kom igång med TeachDesk på en minut.",
        submit: "Skapa konto",
      },
      forgot: {
        title: "Återställ ditt lösenord",
        subtitle: "Vi mejlar dig en länk där du väljer ett nytt.",
        submit: "Skicka länk",
      },
    },
    joining: {
      "sign-in": "Logga in för att gå med i din skola på TeachDesk.",
      "sign-up": "Använd e-postadressen som inbjudan skickades till.",
    },
    somethingWrong: "Något gick fel. Försök igen.",
    resetSent: "Om det finns ett konto för den e-postadressen är en länk på väg.",
    confirmEmail: "Titta i din inkorg och klicka på länken för att bekräfta din e-postadress.",
    google: "Fortsätt med Google",
    orEmail: "eller med e-post",
    name: "Ditt namn",
    email: "E-post",
    password: "Lösenord",
    forgot: "Glömt lösenordet?",
    newHere: "Ny på TeachDesk?",
    createAccount: "Skapa ett konto",
    backToSignIn: "Tillbaka till inloggningen",
  },
});

export const Route = createFileRoute("/login")({
  // Only allow redirects to the app or an invitation, never to another site.
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => {
    const redirect = safeReturnPath(search["redirect"]);
    return redirect ? { redirect } : {};
  },
  head: ({ match }) => ({
    meta: [{ title: messages[match.context.language].pageTitle }, { name: "robots", content: "noindex" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { redirect = "/app" } = Route.useSearch();
  const joining = redirect.startsWith("/invite/");
  const navigate = useNavigate();
  const auth = useAuth();
  const t = useMessages(messages);
  const copy = t.modes;
  const joiningCopy: Partial<Record<Mode, string>> = t.joining;
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
      setError(e instanceof Error ? e.message : t.somethingWrong);
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
        return setNotice(t.resetSent);
      }
      const { needsConfirmation } = await auth.signUpWithPassword(
        form.name.trim(),
        form.email,
        form.password,
        redirect,
      );
      if (needsConfirmation) setNotice(t.confirmEmail);
    });
  };

  const field = (key: keyof typeof form) => ({
    id: key,
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  return (
    <AuthLayout title={copy[mode].title} subtitle={(joining && joiningCopy[mode]) || copy[mode].subtitle}>
      {mode !== "forgot" && (
        <>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={busy}
            onClick={() => void run(() => auth.signInWithGoogle(redirect))}
          >
            <GoogleIcon /> {t.google}
          </Button>
          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> {t.orEmail} <span className="h-px flex-1 bg-border" />
          </div>
        </>
      )}

      <form onSubmit={submit} className="space-y-4">
        {mode === "sign-up" && (
          <div className="space-y-1.5">
            <Label htmlFor="name">{t.name}</Label>
            <Input {...field("name")} autoComplete="name" required />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="email">{t.email}</Label>
          <Input {...field("email")} type="email" autoComplete="email" required />
        </div>
        {mode !== "forgot" && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{t.password}</Label>
              {mode === "sign-in" && (
                <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => switchMode("forgot")}>
                  {t.forgot}
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
            {t.newHere}{" "}
            <button type="button" className="font-medium text-foreground hover:underline" onClick={() => switchMode("sign-up")}>
              {t.createAccount}
            </button>
          </>
        ) : (
          <button type="button" className="font-medium text-foreground hover:underline" onClick={() => switchMode("sign-in")}>
            {t.backToSignIn}
          </button>
        )}
      </p>
    </AuthLayout>
  );
}
