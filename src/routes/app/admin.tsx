import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader, Panel, StatusPill } from "@/components/primitives";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

type DemoRequest = Database["public"]["Tables"]["demo_requests"]["Row"];

const statuses = ["new", "contacted", "closed"] as const;
type Status = (typeof statuses)[number];
const statusLabel: Record<Status, string> = { new: "New", contacted: "Contacted", closed: "Closed" };
const statusTone = { new: "warning", contacted: "primary", closed: "neutral" } as const;

export const Route = createFileRoute("/app/admin")({
  head: () => ({ meta: [{ title: "Demo requests — TeachDesk" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Status | "all">("new");

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
    onError: () => toast.error("Couldn't update the status. Please try again."),
  });

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title="Demo requests" subtitle="Admins only." />
        <Panel>
          <p className="text-sm text-muted-foreground">You don't have access to this page.</p>
        </Panel>
      </div>
    );
  }

  const all = requests.data ?? [];
  const counts = Object.fromEntries(statuses.map((s) => [s, all.filter((r) => r.status === s).length])) as Record<Status, number>;
  const shown = filter === "all" ? all : all.filter((r) => r.status === filter);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Demo requests" subtitle="People who asked for a demo on the website." />

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
            {s === "all" ? `All (${all.length})` : `${statusLabel[s]} (${counts[s]})`}
          </button>
        ))}
      </div>

      {requests.isLoading && <p className="text-sm text-muted-foreground">Loading requests…</p>}
      {requests.isError && (
        <Panel>
          <p className="text-sm text-destructive">Couldn't load demo requests. Refresh the page to try again.</p>
        </Panel>
      )}
      {requests.isSuccess && shown.length === 0 && (
        <Panel>
          <p className="text-sm text-muted-foreground">
            {all.length === 0 ? "No demo requests yet." : "Nothing here — try another filter."}
          </p>
        </Panel>
      )}

      <div className="space-y-3">
        {shown.map((r) => (
          <RequestCard key={r.id} request={r} onStatus={(status) => setStatus.mutate({ id: r.id, status })} />
        ))}
      </div>
    </div>
  );
}

function RequestCard({ request: r, onStatus }: { request: DemoRequest; onStatus: (s: Status) => void }) {
  const status = (statuses as readonly string[]).includes(r.status) ? (r.status as Status) : "new";
  const received = new Date(r.created_at).toLocaleString("sv-SE", { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">
            {r.name} <span className="font-normal text-muted-foreground">· {r.role}</span>
          </p>
          <p className="text-sm text-muted-foreground">{r.organization}</p>
          <a
            href={`mailto:${r.email}?subject=${encodeURIComponent("Your TeachDesk demo")}`}
            className="mt-1 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <Mail className="size-3.5" /> {r.email}
          </a>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill tone={statusTone[status]}>{statusLabel[status]}</StatusPill>
          <Select value={status} onValueChange={(v) => onStatus(v as Status)}>
            <SelectTrigger className="h-8 w-[130px]" aria-label="Change status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((s) => (
                <SelectItem key={s} value={s}>
                  Mark {statusLabel[s].toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {r.message && <p className="mt-3 whitespace-pre-line border-t border-border pt-3 text-sm">{r.message}</p>}
      <p className="mt-3 text-xs text-muted-foreground">Received {received}</p>
    </div>
  );
}
