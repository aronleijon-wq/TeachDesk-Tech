import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { InvitationRow, InviteForm } from "@/components/invitations";
import { NoAccess, PageHeader, Panel, StatusPill } from "@/components/primitives";
import { StartPilotDialog, type PilotTarget } from "@/components/start-pilot-dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { defineMessages, formatDate, useLanguage, useMessages, type Language } from "@/lib/i18n";
import {
  fetchAllSchools,
  inviteToSchool,
  updateSchool,
  withdrawInvitation,
  type SchoolOverview,
} from "@/lib/schools";

const EXTRA_PILOT_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

const messages = defineMessages({
  en: {
    pageTitle: "Schools — TeachDesk",
    customer: "Customer",
    ended: "Ended",
    pilotUntil: (date: string) => `Pilot until ${date}`,
    ranOut: "Pilot ran out",
    title: "Schools",
    staffOnly: "Only TeachDesk staff can see all schools.",
    subtitle:
      "Pilots and customers. Send each invite link to the school's contact person — they invite their colleagues.",
    startPilot: "Start a pilot",
    loading: "Loading schools…",
    loadFailed: "Couldn't load the schools. Refresh the page to try again.",
    none: "No schools yet. Start a pilot from a demo request, or with the button above.",
    failed: "That didn't work",
    checkConnection: "Check your internet connection and try again.",
    confirmEnd: (school: string) =>
      `End TeachDesk for ${school}? Its teachers keep their data but lose Pro.`,
    hasEnded: (school: string) => `${school} has ended`,
    people: (n: number) => `${n} ${n === 1 ? "person" : "people"}`,
    started: (date: string) => `started ${date}`,
    renewed: "The link works for 14 more days",
    withdrawn: "Invitation withdrawn",
    close: "Close",
    invite: "Invite someone",
    extended: `Pilot extended by ${EXTRA_PILOT_DAYS} days`,
    restart: "Restart pilot",
    extend: `Extend by ${EXTRA_PILOT_DAYS} days`,
    nowCustomer: (school: string) => `${school} is now a customer`,
    markCustomer: "Mark as customer",
    endPilot: "End pilot",
    endSubscription: "End subscription",
  },
  sv: {
    pageTitle: "Skolor — TeachDesk",
    customer: "Kund",
    ended: "Avslutad",
    pilotUntil: (date) => `Pilot till ${date}`,
    ranOut: "Piloten har gått ut",
    title: "Skolor",
    staffOnly: "Bara TeachDesks personal kan se alla skolor.",
    subtitle:
      "Piloter och kunder. Skicka varje inbjudningslänk till skolans kontaktperson — hen bjuder in sina kollegor.",
    startPilot: "Starta en pilot",
    loading: "Laddar skolor…",
    loadFailed: "Det gick inte att ladda skolorna. Ladda om sidan och försök igen.",
    none: "Inga skolor än. Starta en pilot från en demoförfrågan eller med knappen ovan.",
    failed: "Det gick inte",
    checkConnection: "Kontrollera internetanslutningen och försök igen.",
    confirmEnd: (school) =>
      `Avsluta TeachDesk för ${school}? Lärarna behåller sin data men förlorar Pro.`,
    hasEnded: (school) => `${school} är avslutad`,
    people: (n) => `${n} ${n === 1 ? "person" : "personer"}`,
    started: (date) => `startade ${date}`,
    renewed: "Länken gäller i 14 dagar till",
    withdrawn: "Inbjudan har dragits tillbaka",
    close: "Stäng",
    invite: "Bjud in någon",
    extended: `Piloten har förlängts med ${EXTRA_PILOT_DAYS} dagar`,
    restart: "Starta om piloten",
    extend: `Förläng med ${EXTRA_PILOT_DAYS} dagar`,
    nowCustomer: (school) => `${school} är nu kund`,
    markCustomer: "Markera som kund",
    endPilot: "Avsluta piloten",
    endSubscription: "Avsluta abonnemanget",
  },
});

// For TeachDesk staff: every school, its pilot, and the invitations waiting to be accepted.
export const Route = createFileRoute("/app/admin/schools")({
  head: ({ match }) => ({ meta: [{ title: messages[match.context.language].pageTitle }] }),
  component: SchoolsPage,
});

function statusOf({ status, pilotEndsAt }: SchoolOverview, language: Language) {
  const t = messages[language];
  if (status === "active") return { label: t.customer, tone: "success" } as const;
  if (status === "ended") return { label: t.ended, tone: "neutral" } as const;
  if (pilotEndsAt && new Date(pilotEndsAt) > new Date())
    return { label: t.pilotUntil(formatDate(pilotEndsAt, language)), tone: "primary" } as const;
  return { label: t.ranOut, tone: "warning" } as const;
}

function SchoolsPage() {
  const { isAdmin } = useAuth();
  const t = useMessages(messages);
  const queryClient = useQueryClient();
  const [pilotFor, setPilotFor] = useState<PilotTarget | null>(null);
  const schools = useQuery({ queryKey: ["schools"], enabled: isAdmin, queryFn: fetchAllSchools });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["schools"] });

  if (!isAdmin) return <NoAccess title={t.title} message={t.staffOnly} />;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        actions={
          <Button onClick={() => setPilotFor({ school: "", email: "" })}>
            <Plus className="size-4" /> {t.startPilot}
          </Button>
        }
      />

      {schools.isLoading && <p className="text-sm text-muted-foreground">{t.loading}</p>}
      {schools.isError && (
        <Panel>
          <p className="text-sm text-destructive">{t.loadFailed}</p>
        </Panel>
      )}
      {schools.data?.length === 0 && (
        <Panel>
          <p className="text-sm text-muted-foreground">{t.none}</p>
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
  const { language } = useLanguage();
  const t = useMessages(messages);
  const status = statusOf(school, language);

  /** Runs a change, then shows the result or explains the failure. */
  const change = async (action: () => Promise<unknown>, done: string) => {
    try {
      await action();
      toast.success(done);
    } catch {
      toast.error(t.failed, { description: t.checkConnection });
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
    if (!window.confirm(t.confirmEnd(school.name))) return;
    void change(() => updateSchool(school.id, "ended"), t.hasEnded(school.name));
  };

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">{school.name}</p>
          <p className="text-sm text-muted-foreground">
            {t.people(school.memberCount)} · {t.started(formatDate(school.createdAt, language))}
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
                  t.renewed,
                )
              }
              onWithdraw={() => void change(() => withdrawInvitation(invitation.id), t.withdrawn)}
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
          {inviting ? t.close : t.invite}
        </Button>
        {school.status !== "active" && (
          <Button size="sm" variant="outline" onClick={() => void change(extendPilot, t.extended)}>
            {school.status === "ended" ? t.restart : t.extend}
          </Button>
        )}
        {school.status !== "active" && (
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              void change(() => updateSchool(school.id, "active"), t.nowCustomer(school.name))
            }
          >
            {t.markCustomer}
          </Button>
        )}
        {school.status !== "ended" && (
          <Button size="sm" variant="ghost" onClick={end}>
            {school.status === "pilot" ? t.endPilot : t.endSubscription}
          </Button>
        )}
      </div>
    </div>
  );
}
