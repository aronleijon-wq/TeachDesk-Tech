import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { InvitationRow, InviteForm } from "@/components/invitations";
import { formatDate, NoAccess, PageHeader, Panel, StatusPill } from "@/components/primitives";
import { StartPilotDialog, type PilotTarget } from "@/components/start-pilot-dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import {
  fetchAllSchools,
  inviteToSchool,
  updateSchool,
  withdrawInvitation,
  type SchoolOverview,
} from "@/lib/schools";

// For TeachDesk staff: every school, its pilot, and the invitations waiting to be accepted.
export const Route = createFileRoute("/app/admin/schools")({
  head: () => ({ meta: [{ title: "Schools — TeachDesk" }] }),
  component: SchoolsPage,
});

const EXTRA_PILOT_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

function statusOf({ status, pilotEndsAt }: SchoolOverview) {
  if (status === "active") return { label: "Customer", tone: "success" } as const;
  if (status === "ended") return { label: "Ended", tone: "neutral" } as const;
  if (pilotEndsAt && new Date(pilotEndsAt) > new Date())
    return { label: `Pilot until ${formatDate(pilotEndsAt)}`, tone: "primary" } as const;
  return { label: "Pilot ran out", tone: "warning" } as const;
}

function SchoolsPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [pilotFor, setPilotFor] = useState<PilotTarget | null>(null);
  const schools = useQuery({ queryKey: ["schools"], enabled: isAdmin, queryFn: fetchAllSchools });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["schools"] });

  if (!isAdmin)
    return <NoAccess title="Schools" message="Only TeachDesk staff can see all schools." />;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Schools"
        subtitle="Pilots and customers. Send each invite link to the school's contact person — they invite their colleagues."
        actions={
          <Button onClick={() => setPilotFor({ school: "", email: "" })}>
            <Plus className="size-4" /> Start a pilot
          </Button>
        }
      />

      {schools.isLoading && <p className="text-sm text-muted-foreground">Loading schools…</p>}
      {schools.isError && (
        <Panel>
          <p className="text-sm text-destructive">
            Couldn't load the schools. Refresh the page to try again.
          </p>
        </Panel>
      )}
      {schools.data?.length === 0 && (
        <Panel>
          <p className="text-sm text-muted-foreground">
            No schools yet. Start a pilot from a demo request, or with the button above.
          </p>
        </Panel>
      )}

      <div className="space-y-3">
        {schools.data?.map((school) => (
          <SchoolCard key={school.id} school={school} onChanged={refresh} />
        ))}
      </div>

      <StartPilotDialog
        target={pilotFor}
        onClose={() => setPilotFor(null)}
        onStarted={() => void refresh()}
      />
    </div>
  );
}

function SchoolCard({
  school,
  onChanged,
}: {
  school: SchoolOverview;
  onChanged: () => Promise<void>;
}) {
  const [inviting, setInviting] = useState(false);
  const status = statusOf(school);

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
    await onChanged();
  };

  // Counted from today if the pilot has already run out.
  const extendPilot = () => {
    const from = Math.max(Date.now(), new Date(school.pilotEndsAt ?? 0).getTime());
    return updateSchool(
      school.id,
      "pilot",
      new Date(from + EXTRA_PILOT_DAYS * DAY_MS).toISOString(),
    );
  };

  const end = () => {
    if (
      !window.confirm(
        `End TeachDesk for ${school.name}? Its teachers keep their data but lose Pro.`,
      )
    )
      return;
    void change(() => updateSchool(school.id, "ended"), `${school.name} has ended`);
  };

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">{school.name}</p>
          <p className="text-sm text-muted-foreground">
            {school.memberCount} {school.memberCount === 1 ? "person" : "people"} · started{" "}
            {formatDate(school.createdAt)}
          </p>
        </div>
        <StatusPill tone={status.tone}>{status.label}</StatusPill>
      </div>

      {school.invitations.length > 0 && (
        <ul className="mt-3 divide-y divide-border border-t border-border">
          {school.invitations.map((invitation) => (
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
      )}

      {inviting && (
        <div className="mt-3 border-t border-border pt-3">
          <InviteForm schoolId={school.id} defaultRole="admin" onInvited={() => void onChanged()} />
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
        <Button size="sm" variant="outline" onClick={() => setInviting((open) => !open)}>
          {inviting ? "Close" : "Invite someone"}
        </Button>
        {school.status !== "active" && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => void change(extendPilot, `Pilot extended by ${EXTRA_PILOT_DAYS} days`)}
          >
            {school.status === "ended" ? "Restart pilot" : `Extend by ${EXTRA_PILOT_DAYS} days`}
          </Button>
        )}
        {school.status !== "active" && (
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              void change(
                () => updateSchool(school.id, "active"),
                `${school.name} is now a customer`,
              )
            }
          >
            Mark as customer
          </Button>
        )}
        {school.status !== "ended" && (
          <Button size="sm" variant="ghost" onClick={end}>
            {school.status === "pilot" ? "End pilot" : "End subscription"}
          </Button>
        )}
      </div>
    </div>
  );
}
