import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { defineMessages, useMessages } from "@/lib/i18n";

const messages = defineMessages({
  en: {
    pageTitle: "Choose a new password — TeachDesk",
    updated: "Password updated",
    failed: "Could not update the password.",
    expired: "Link expired",
    expiredText: "This reset link is no longer valid. Request a new one from the sign-in page.",
    backToSignIn: "Back to sign in",
    title: "Choose a new password",
    subtitle: "Use at least 8 characters.",
    newPassword: "New password",
    save: "Save password",
  },
  sv: {
    pageTitle: "Välj ett nytt lösenord — TeachDesk",
    updated: "Lösenordet har uppdaterats",
    failed: "Det gick inte att uppdatera lösenordet.",
    expired: "Länken har gått ut",
    expiredText: "Länken fungerar inte längre. Be om en ny från inloggningssidan.",
    backToSignIn: "Tillbaka till inloggningen",
    title: "Välj ett nytt lösenord",
    subtitle: "Använd minst 8 tecken.",
    newPassword: "Nytt lösenord",
    save: "Spara lösenordet",
  },
});

// The reset email links here; Supabase signs the user in from the link first.
export const Route = createFileRoute("/reset-password")({
  head: ({ match }) => ({
    meta: [{ title: messages[match.context.language].pageTitle }, { name: "robots", content: "noindex" }],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { user, loading, updatePassword } = useAuth();
  const t = useMessages(messages);
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await updatePassword(password);
      toast.success(t.updated);
      await navigate({ to: "/app" });
    } catch (err) {
      setError(err instanceof Error ? err.message : t.failed);
    } finally {
      setBusy(false);
    }
  };

  if (!loading && !user) {
    return (
      <AuthLayout title={t.expired} subtitle={t.expiredText}>
        <Button className="w-full" onClick={() => void navigate({ to: "/login" })}>{t.backToSignIn}</Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={t.title} subtitle={t.subtitle}>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="password">{t.newPassword}</Label>
          <Input id="password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={busy || loading}>
          {busy && <Loader2 className="size-4 animate-spin" />}
          {t.save}
        </Button>
      </form>
    </AuthLayout>
  );
}
