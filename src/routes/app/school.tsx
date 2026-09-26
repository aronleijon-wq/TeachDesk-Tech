import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { InvitationRow, InviteForm } from "@/components/invitations";
import { NoAccess, PageHeader, Panel, StatusPill } from "@/components/primitives";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { defineMessages, formatDate, useLanguage, useMessages, type Language } from "@/lib/i18n";
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

const messages = defineMessages({
  en: {
    pageTitle: "School — TeachDesk",
    active: "Your school uses TeachDesk Enterprise.",
    pilotUntil: (date: string) => `Your school's pilot runs until ${date}.`,
    pilotEnded: "Your school's pilot has ended.",
    school: "School",
    noAccess:
      "Open your school's workspace to see this page. Only the school's admins can invite colleagues.",
    failed: "That didn't work",
    checkConnection: "Check your internet connection and try again.",
    invite: "Invite colleagues",
    inviteText:
      "Create a link for each colleague and send it to them. They join with the email address you enter.",
    waiting: "Waiting to join",
    invitationsFailed: "Couldn't load the invitations.",
    allJoined: "Everyone you invited has joined.",
    renewed: "The link works for 14 more days",
    withdrawn: "Invitation withdrawn",
    people: "People",
    peopleFailed: "Couldn't load the people in your school.",
    joined: (date: string) => `Joined ${date}`,
    confirmRemove: (name: string, school: string) => `Remove ${name} from ${school}?`,
    removed: "Removed from the school",
    remove: "Remove",
  },
  sv: {
    pageTitle: "Skola — TeachDesk",
    active: "Din skola har en skollicens för TeachDesk.",
    pilotUntil: (date) => `Skolans pilot pågår till ${date}.`,
    pilotEnded: "Skolans pilot har avslutats.",
    school: "Skola",
    noAccess:
      "Öppna skolans arbetsyta för att se den här sidan. Bara skolans administratörer kan bjuda in kollegor.",
    failed: "Det gick inte",
    checkConnection: "Kontrollera internetanslutningen och försök igen.",
    invite: "Bjud in kollegor",
    inviteText:
      "Skapa en länk för varje kollega och skicka den till dem. De går med med e-postadressen du anger.",
    waiting: "Väntar på att gå med",
    invitationsFailed: "Det gick inte att ladda inbjudningarna.",
    allJoined: "Alla du har bjudit in har gått med.",
    renewed: "Länken gäller i 14 dagar till",
    withdrawn: "Inbjudan har dragits tillbaka",
    people: "Personer",
    peopleFailed: "Det gick inte att ladda personerna på skolan.",
    joined: (date) => `Gick med ${date}`,
    confirmRemove: (name, school) => `Ta bort ${name} från ${school}?`,
    removed: "Borttagen från skolan",
    remove: "Ta bort",
  },
});

// For a school's admins: who is in the school, and inviting colleagues.
export const Route = createFileRoute("/app/school")({
  head: ({ match }) => ({ meta: [{ title: messages[match.context.language].pageTitle }] }),
  component: SchoolPage,
});

function schoolSummary({ status, pilotEndsAt }: School, language: Language) {
  const t = messages[language];
  if (status === "active") return t.active;
  if (status === "pilot" && pilotEndsAt && new Date(pilotEndsAt) > new Date())
    return t.pilotUntil(formatDate(pilotEndsAt, language));
  return t.pilotEnded;
}

function SchoolPage() {
  const { openSchool: school } = useStore();
  const t = useMessages(messages);

  if (school?.role !== "admin") {
    return <NoAccess title={t.school} message={t.noAccess} />;
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
  const { language } = useLanguage();
  const t = useMessages(messages);

  /** Runs a change, then shows the result or explains the failure. */
  const change = async (action: () => Promise<unknown>, done: string) => {
    try {
      await action();
      toast.success(done);
    } catch {
      toast.error(t.failed, { description: t.checkConnection });
    }
    await refresh();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader title={school.name} subtitle={schoolSummary(school, language)} />

      <Panel title={t.invite} description={t.inviteText}>
        <InviteForm
          schoolId={school.id}
          memberEmails={members.data?.map((m) => m.email) ?? []}
          onInvited={() => void refresh()}
        />
      </Panel>

      <Panel title={t.waiting}>
        {invitations.isError && <p className="text-sm text-destructive">{t.invitationsFailed}</p>}
        {invitations.data?.length === 0 && (
          <p className="text-sm text-muted-foreground">{t.allJoined}</p>
        )}
        <ul className="divide-y divide-border">
          {invitations.data?.map((invitation) => (
            <InvitationRow
              key={invitation.id}
              invitation={invitation}
              onRenew={() =>
                void change(
                  () => inviteToSchool(school.id, invitation.email, invitation.role),
                  t.renewed,
                )
              }
              onWithdraw={() => void change(() => withdrawInvitation(invitation.id), t.withdrawn)}
            />
          ))}
        </ul>
      </Panel>

      <Panel title={t.people}>
        {members.isError && <p className="text-sm text-destructive">{t.peopleFailed}</p>}
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
                  {member.name ? `${member.email} · ` : ""}
                  {t.joined(formatDate(member.joinedAt, language))}
                </span>
              </span>
              <span className="flex items-center gap-2">
                <StatusPill tone={member.role === "admin" ? "primary" : "neutral"}>
                  {roleLabel(member.role, language)}
                </StatusPill>
                {member.role === "teacher" && member.userId !== user?.id && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (
                        !window.confirm(t.confirmRemove(member.name || member.email, school.name))
                      )
                        return;
                      void change(() => removeMember(school.id, member.userId), t.removed);
                    }}
                  >
                    {t.remove}
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
