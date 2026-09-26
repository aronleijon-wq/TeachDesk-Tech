import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AuthLayout, GoogleIcon } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { writeOpenSchool } from "@/lib/browser-storage";
import { defineMessages, useLanguage, useMessages } from "@/lib/i18n";
import { acceptInvitation, previewInvitation, type InvitationPreview } from "@/lib/schools";

const messages = defineMessages({
  en: {
    pageTitle: "Join your school — TeachDesk",
    invitation: "Invitation",
    loading: "Loading your invitation…",
    loadFailed: "Couldn't load the invitation. Check your internet connection.",
    tryAgain: "Try again",
    notFound: "Invitation not found",
    notFoundText: "This link isn't valid. Ask for a new invitation.",
    used: "Invitation already used",
    usedText: (school: string) => `This invitation to ${school} has been accepted.`,
    expired: "Invitation expired",
    expiredText: (school: string) => `Ask ${school} to send you a new link.`,
    join: (school: string) => `Join ${school}`,
    invitedAs: (admin: boolean, email: string) =>
      `You're invited to TeachDesk as ${admin ? "an admin" : "a teacher"}. The invitation is for ${email}.`,
    googleFailed: "Google sign-in failed. Please try again.",
    google: "Continue with Google",
    email: "Continue with email",
    newHere:
      "New to TeachDesk? You can create an account on the next step — use the invited address.",
    welcome: (school: string) => `Welcome to ${school}!`,
    joinFailed: "Couldn't join the school. Please try again.",
    signedInAs: "Signed in as",
    notYou: "Not you? Use another account",
    open: "Open TeachDesk",
  },
  sv: {
    pageTitle: "Gå med i din skola — TeachDesk",
    invitation: "Inbjudan",
    loading: "Laddar din inbjudan…",
    loadFailed: "Det gick inte att ladda inbjudan. Kontrollera internetanslutningen.",
    tryAgain: "Försök igen",
    notFound: "Inbjudan hittades inte",
    notFoundText: "Länken är inte giltig. Be om en ny inbjudan.",
    used: "Inbjudan har redan använts",
    usedText: (school) => `Inbjudan till ${school} har redan tagits emot.`,
    expired: "Inbjudan har gått ut",
    expiredText: (school) => `Be ${school} att skicka en ny länk.`,
    join: (school) => `Gå med i ${school}`,
    invitedAs: (admin, email) =>
      `Du är inbjuden till TeachDesk som ${admin ? "administratör" : "lärare"}. Inbjudan gäller ${email}.`,
    googleFailed: "Inloggningen med Google misslyckades. Försök igen.",
    google: "Fortsätt med Google",
    email: "Fortsätt med e-post",
    newHere: "Ny på TeachDesk? Du kan skapa ett konto i nästa steg — använd adressen som bjöds in.",
    welcome: (school) => `Välkommen till ${school}!`,
    joinFailed: "Det gick inte att gå med i skolan. Försök igen.",
    signedInAs: "Inloggad som",
    notYou: "Inte du? Använd ett annat konto",
    open: "Öppna TeachDesk",
  },
});

// Where an invitation link leads. Shows which school it's for, lets the visitor sign in or
// create an account, and joins the school once they're signed in with the invited address.
export const Route = createFileRoute("/invite/$token")({
  head: ({ match }) => ({
    meta: [
      { title: messages[match.context.language].pageTitle },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: InvitePage,
});

function InvitePage() {
  const { token } = Route.useParams();
  const auth = useAuth();
  const t = useMessages(messages);
  const preview = useQuery({
    queryKey: ["invitation", token],
    queryFn: () => previewInvitation(token),
    // Don't keep the visitor waiting long if the link can't be checked.
    retry: 1,
  });

  if (auth.loading || preview.isPending) {
    return (
      <AuthLayout title={t.invitation} subtitle={t.loading}>
        <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
      </AuthLayout>
    );
  }

  if (preview.isError) {
    return (
      <AuthLayout title={t.invitation} subtitle={t.loadFailed}>
        <Button className="w-full" onClick={() => void preview.refetch()}>
          {t.tryAgain}
        </Button>
      </AuthLayout>
    );
  }

  const invitation = preview.data;
  if (!invitation) {
    return (
      <AuthLayout title={t.notFound} subtitle={t.notFoundText}>
        <OpenTeachDesk />
      </AuthLayout>
    );
  }
  if (invitation.status === "used") {
    return (
      <AuthLayout title={t.used} subtitle={t.usedText(invitation.school)}>
        <OpenTeachDesk />
      </AuthLayout>
    );
  }
  if (invitation.status === "expired") {
    return (
      <AuthLayout title={t.expired} subtitle={t.expiredText(invitation.school)}>
        <OpenTeachDesk />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={t.join(invitation.school)}
      subtitle={t.invitedAs(invitation.role === "admin", invitation.emailHint)}
    >
      {auth.user ? (
        <JoinSchool token={token} invitation={invitation} />
      ) : (
        <SignInToJoin token={token} />
      )}
    </AuthLayout>
  );
}

function SignInToJoin({ token }: { token: string }) {
  const { signInWithGoogle } = useAuth();
  const t = useMessages(messages);
  const [busy, setBusy] = useState(false);
  const here = `/invite/${token}`;

  const google = async () => {
    setBusy(true);
    try {
      await signInWithGoogle(here);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t.googleFailed);
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button variant="outline" className="w-full" disabled={busy} onClick={() => void google()}>
        <GoogleIcon /> {t.google}
      </Button>
      <Button asChild className="w-full">
        <Link to="/login" search={{ redirect: here }}>
          {t.email}
        </Link>
      </Button>
      <p className="text-center text-xs text-muted-foreground">{t.newHere}</p>
    </div>
  );
}

function JoinSchool({ token, invitation }: { token: string; invitation: InvitationPreview }) {
  const { user, signOut } = useAuth();
  const { language } = useLanguage();
  const t = useMessages(messages);
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const join = async () => {
    setBusy(true);
    setError(null);
    try {
      const schoolId = await acceptInvitation(token, language);
      // Open the school's workspace in the app.
      if (user) writeOpenSchool(user.id, schoolId);
      toast.success(t.welcome(invitation.school));
      await navigate({ to: "/app" });
    } catch (e) {
      setError(e instanceof Error ? e.message : t.joinFailed);
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm">
        {t.signedInAs} <span className="font-medium">{user?.email}</span>
      </p>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button className="w-full" disabled={busy} onClick={() => void join()}>
        {busy && <Loader2 className="size-4 animate-spin" />}
        {t.join(invitation.school)}
      </Button>
      <button
        type="button"
        className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
        onClick={() => void signOut()}
      >
        {t.notYou}
      </button>
    </div>
  );
}

function OpenTeachDesk() {
  const t = useMessages(messages);
  return (
    <Button asChild className="w-full">
      <Link to="/app">{t.open}</Link>
    </Button>
  );
}
