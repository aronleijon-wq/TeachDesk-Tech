import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { InvitationRow, InviteForm } from "@/components/invitations";
import { formatDate, NoAccess, PageHeader, Panel, StatusPill } from "@/components/primitives";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import {
  fetchInvitations,
  fetchMembers,
  inviteToSchool,
  removeMember,
  roleLabel,
  withdrawInvitation,
  type School,
} from "@/lib/schools";
import { useStore } from "@/lib/store";

// For a school's admins: who is in the school, and inviting colleagues.
export const Route = createFileRoute("/app/school")({
  head: () => ({ meta: [{ title: "School — TeachDesk" }] }),
  component: SchoolPage,
});

function schoolSummary({ status, pilotEndsAt }: School) {
  if (status === "active") return "Your school uses TeachDesk Enterprise.";
  if (status === "pilot" && pilotEndsAt && new Date(pilotEndsAt) > new Date())
    return `Your school's pilot runs until ${formatDate(pilotEndsAt)}.`;
  return "Your school's pilot has ended.";
}

function SchoolPage() {
  const { openSchool: school } = useStore();

  if (school?.role !== "admin") {
    return (
      <NoAccess
        title="School"
        message="Open your school's workspace to see this page. Only the school's admins can invite colleagues."
      />
    );
  }
  return <SchoolAdmin school={school} />;
}

function SchoolAdmin({ school }: { school: School }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const members = useQuery({
    queryKey: ["school", school.id, "members"],
    queryFn: () => fetchMembers(school.id),
  });
  const invitations = useQuery({
    queryKey: ["school", school.id, "invitations"],
    queryFn: () => fetchInvitations(school.id),
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["school", school.id] });

  /** Runs a change, then shows the result or explains the failure. */
  const change = async (action: () => Promise<unknown>, done: string) => {
    try {
      await action();
      toast.success(done);
    } catch {
      toast.error("That didn't work", {
        description: "Check your internet connection and try again.",
      });
    }
    await refresh();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader title={school.name} subtitle={schoolSummary(school)} />

      <Panel
        title="Invite colleagues"
        description="Create a link for each colleague and send it to them. They join with the email address you enter."
      >
        <InviteForm
          schoolId={school.id}
          memberEmails={members.data?.map((m) => m.email) ?? []}
          onInvited={() => void refresh()}
        />
      </Panel>

      <Panel title="Waiting to join">
        {invitations.isError && (
          <p className="text-sm text-destructive">Couldn't load the invitations.</p>
        )}
        {invitations.data?.length === 0 && (
          <p className="text-sm text-muted-foreground">Everyone you invited has joined.</p>
        )}
        <ul className="divide-y divide-border">
          {invitations.data?.map((invitation) => (
            <InvitationRow
              key={invitation.id}
              invitation={invitation}
              onRenew={() =>
                void change(
                  () => inviteToSchool(school.id, invitation.email, invitation.role),
                  "The link works for 14 more days",
                )
              }
              onWithdraw={() =>
                void change(() => withdrawInvitation(invitation.id), "Invitation withdrawn")
              }
            />
          ))}
        </ul>
      </Panel>

      <Panel title="People">
        {members.isError && (
          <p className="text-sm text-destructive">Couldn't load the people in your school.</p>
        )}
        <ul className="divide-y divide-border">
          {members.data?.map((member) => (
            <li
              key={member.userId}
              className="flex flex-wrap items-center justify-between gap-2 py-2"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">
                  {member.name || member.email}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {member.name ? `${member.email} · ` : ""}Joined {formatDate(member.joinedAt)}
                </span>
              </span>
              <span className="flex items-center gap-2">
                <StatusPill tone={member.role === "admin" ? "primary" : "neutral"}>
                  {roleLabel(member.role)}
                </StatusPill>
                {member.role === "teacher" && member.userId !== user?.id && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (
                        !window.confirm(
                          `Remove ${member.name || member.email} from ${school.name}?`,
                        )
                      )
                        return;
                      void change(
                        () => removeMember(school.id, member.userId),
                        "Removed from the school",
                      );
                    }}
                  >
                    Remove
                  </Button>
                )}
              </span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
