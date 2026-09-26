import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { NoAccess, PageHeader, Panel, StatusPill } from "@/components/primitives";
import { StartPilotDialog, type PilotTarget } from "@/components/start-pilot-dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/lib/auth";
import { defineMessages, useLanguage, useMessages } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type DemoRequest = Database["public"]["Tables"]["demo_requests"]["Row"];

const statuses = ["new", "contacted", "closed"] as const;
type Status = (typeof statuses)[number];
const statusTone = { new: "warning", contacted: "primary", closed: "neutral" } as const;

const messages = defineMessages({
  en: {
    pageTitle: "Demo requests — TeachDesk",
    title: "Demo requests",
    subtitle:
      "People who asked for a demo on the website. After the demo, start a pilot for their school.",
    statuses: { new: "New", contacted: "Contacted", closed: "Closed" } satisfies Record<Status, string>,
    markAs: { new: "Mark new", contacted: "Mark contacted", closed: "Mark closed" } satisfies Record<
      Status,
      string
    >,
    updateFailed: "Couldn't update the status. Please try again.",
    staffOnly: "Only TeachDesk staff can see demo requests.",
    all: (n: number) => `All (${n})`,
    loading: "Loading requests…",
    loadFailed: "Couldn't load demo requests. Refresh the page to try again.",
    none: "No demo requests yet.",
    tryFilter: "Nothing here — try another filter.",
    emailSubject: "Your TeachDesk demo",
    startPilot: "Start pilot",
    changeStatus: "Change status",
    received: (date: string) => `Received ${date}`,
  },
  sv: {
    pageTitle: "Demoförfrågningar — TeachDesk",
    title: "Demoförfrågningar",
    subtitle:
      "Personer som har bett om en demo på webbplatsen. Starta en pilot för deras skola efter demon.",
    statuses: { new: "Ny", contacted: "Kontaktad", closed: "Avslutad" },
    markAs: { new: "Markera som ny", contacted: "Markera som kontaktad", closed: "Markera som avslutad" },
    updateFailed: "Det gick inte att ändra statusen. Försök igen.",
    staffOnly: "Bara TeachDesks personal kan se demoförfrågningar.",
    all: (n) => `Alla (${n})`,
    loading: "Laddar förfrågningar…",
    loadFailed: "Det gick inte att ladda demoförfrågningarna. Ladda om sidan och försök igen.",
    none: "Inga demoförfrågningar än.",
    tryFilter: "Inget här — prova ett annat filter.",
    emailSubject: "Din demo av TeachDesk",
    startPilot: "Starta pilot",
    changeStatus: "Ändra status",
    received: (date) => `Mottagen ${date}`,
  },
});

export const Route = createFileRoute("/app/admin/")({
  head: ({ match }) => ({ meta: [{ title: messages[match.context.language].pageTitle }] }),
  component: AdminPage,
});

function AdminPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Status | "all">("new");
  const [pilotFor, setPilotFor] = useState<PilotTarget | null>(null);
  const t = useMessages(messages);

  const requests = useQuery({
    queryKey: ["demo-requests"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("demo_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Status }) => {
      const { error } = await supabase.from("demo_requests").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["demo-requests"] }),
    onError: () => toast.error(t.updateFailed),
  });

  if (!isAdmin) return <NoAccess title={t.title} message={t.staffOnly} />;

  const all = requests.data ?? [];
  const counts = Object.fromEntries(statuses.map((s) => [s, all.filter((r) => r.status === s).length])) as Record<Status, number>;
  const shown = filter === "all" ? all : all.filter((r) => r.status === filter);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {([...statuses, "all"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              "rounded-md border px-3 py-1.5 text-sm",
              filter === s ? "border-primary bg-primary-soft font-medium" : "border-border hover:bg-accent",
            )}
          >
            {s === "all" ? t.all(all.length) : `${t.statuses[s]} (${counts[s]})`}
          </button>
        ))}
      </div>

      {requests.isLoading && <p className="text-sm text-muted-foreground">{t.loading}</p>}
      {requests.isError && (
        <Panel>
          <p className="text-sm text-destructive">{t.loadFailed}</p>
        </Panel>
      )}
      {requests.isSuccess && shown.length === 0 && (
        <Panel>
          <p className="text-sm text-muted-foreground">
            {all.length === 0 ? t.none : t.tryFilter}
          </p>
        </Panel>
      )}

      <div className="space-y-3">
        {shown.map((r) => (
          <RequestCard
            key={r.id}
            request={r}
            onStatus={(status) => setStatus.mutate({ id: r.id, status })}
            onStartPilot={() => setPilotFor({ school: r.organization, email: r.email })}
          />
        ))}
      </div>

      <StartPilotDialog
        target={pilotFor}
        onClose={() => setPilotFor(null)}
        onStarted={() => void queryClient.invalidateQueries({ queryKey: ["schools"] })}
      />
    </div>
  );
}

function RequestCard({
  request: r,
  onStatus,
  onStartPilot,
}: {
  request: DemoRequest;
  onStatus: (s: Status) => void;
  onStartPilot: () => void;
}) {
  const status = (statuses as readonly string[]).includes(r.status) ? (r.status as Status) : "new";
  const { language } = useLanguage();
  const t = useMessages(messages);
  const received = new Date(r.created_at).toLocaleString(language === "sv" ? "sv-SE" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">
            {r.name} <span className="font-normal text-muted-foreground">· {r.role}</span>
          </p>
          <p className="text-sm text-muted-foreground">{r.organization}</p>
          <a
            href={`mailto:${r.email}?subject=${encodeURIComponent(t.emailSubject)}`}
            className="mt-1 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <Mail className="size-3.5" /> {r.email}
          </a>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={onStartPilot}>
            {t.startPilot}
          </Button>
          <StatusPill tone={statusTone[status]}>{t.statuses[status]}</StatusPill>
          <Select value={status} onValueChange={(v) => onStatus(v as Status)}>
            <SelectTrigger className="h-8 w-[180px]" aria-label={t.changeStatus}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((s) => (
                <SelectItem key={s} value={s}>
                  {t.markAs[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {r.message && <p className="mt-3 whitespace-pre-line border-t border-border pt-3 text-sm">{r.message}</p>}
      <p className="mt-3 text-xs text-muted-foreground">{t.received(received)}</p>
    </div>
  );
}
