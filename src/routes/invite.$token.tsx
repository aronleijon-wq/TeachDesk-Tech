import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AuthLayout, GoogleIcon } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { writeOpenSchool } from "@/lib/browser-storage";
import { acceptInvitation, previewInvitation, type InvitationPreview } from "@/lib/schools";

// Where an invitation link leads. Shows which school it's for, lets the visitor sign in or
// create an account, and joins the school once they're signed in with the invited address.
export const Route = createFileRoute("/invite/$token")({
  head: () => ({
    meta: [{ title: "Join your school — TeachDesk" }, { name: "robots", content: "noindex" }],
  }),
  component: InvitePage,
});

function InvitePage() {
  const { token } = Route.useParams();
  const auth = useAuth();
  const preview = useQuery({
    queryKey: ["invitation", token],
    queryFn: () => previewInvitation(token),
    // Don't keep the visitor waiting long if the link can't be checked.
    retry: 1,
  });

  if (auth.loading || preview.isPending) {
    return (
      <AuthLayout title="Invitation" subtitle="Loading your invitation…">
        <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
      </AuthLayout>
    );
  }

  if (preview.isError) {
    return (
      <AuthLayout
        title="Invitation"
        subtitle="Couldn't load the invitation. Check your internet connection."
      >
        <Button className="w-full" onClick={() => void preview.refetch()}>
          Try again
        </Button>
      </AuthLayout>
    );
  }

  const invitation = preview.data;
  if (!invitation) {
    return (
      <AuthLayout
        title="Invitation not found"
        subtitle="This link isn't valid. Ask for a new invitation."
      >
        <OpenTeachDesk />
      </AuthLayout>
    );
  }
  if (invitation.status === "used") {
    return (
      <AuthLayout
        title="Invitation already used"
        subtitle={`This invitation to ${invitation.school} has been accepted.`}
      >
        <OpenTeachDesk />
      </AuthLayout>
    );
  }
  if (invitation.status === "expired") {
    return (
      <AuthLayout
        title="Invitation expired"
        subtitle={`Ask ${invitation.school} to send you a new link.`}
      >
        <OpenTeachDesk />
      </AuthLayout>
    );
  }

  const asRole = invitation.role === "admin" ? "an admin" : "a teacher";
  return (
    <AuthLayout
      title={`Join ${invitation.school}`}
      subtitle={`You're invited to TeachDesk as ${asRole}. The invitation is for ${invitation.emailHint}.`}
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
  const [busy, setBusy] = useState(false);
  const here = `/invite/${token}`;

  const google = async () => {
    setBusy(true);
    try {
      await signInWithGoogle(here);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Google sign-in failed. Please try again.");
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button variant="outline" className="w-full" disabled={busy} onClick={() => void google()}>
        <GoogleIcon /> Continue with Google
      </Button>
      <Button asChild className="w-full">
        <Link to="/login" search={{ redirect: here }}>
          Continue with email
        </Link>
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        New to TeachDesk? You can create an account on the next step — use the invited address.
      </p>
    </div>
  );
}

function JoinSchool({ token, invitation }: { token: string; invitation: InvitationPreview }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const join = async () => {
    setBusy(true);
    setError(null);
    try {
      const schoolId = await acceptInvitation(token);
      // Open the school's workspace in the app.
      if (user) writeOpenSchool(user.id, schoolId);
      toast.success(`Welcome to ${invitation.school}!`);
      await navigate({ to: "/app" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't join the school. Please try again.");
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm">
        Signed in as <span className="font-medium">{user?.email}</span>
      </p>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button className="w-full" disabled={busy} onClick={() => void join()}>
        {busy && <Loader2 className="size-4 animate-spin" />}
        Join {invitation.school}
      </Button>
      <button
        type="button"
        className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
        onClick={() => void signOut()}
      >
        Not you? Use another account
      </button>
    </div>
  );
}

function OpenTeachDesk() {
  return (
    <Button asChild className="w-full">
      <Link to="/app">Open TeachDesk</Link>
    </Button>
  );
}
