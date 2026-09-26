import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { InvitationLinkBox } from "@/components/invitations";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { invitationLink, startPilot } from "@/lib/schools";

/** The school and the contact person to start a pilot for, e.g. from a demo request. */
export interface PilotTarget {
  school: string;
  email: string;
}

const DEFAULT_PILOT_DAYS = 30;

/** For TeachDesk staff: starts a school's pilot and gives the link for the school's admin. */
export function StartPilotDialog({
  target,
  onClose,
  onStarted,
}: {
  target: PilotTarget | null;
  onClose: () => void;
  onStarted?: () => void;
}) {
  const [form, setForm] = useState({ school: "", email: "", days: String(DEFAULT_PILOT_DAYS) });
  const [created, setCreated] = useState<{ email: string; link: string } | null>(null);
  const [busy, setBusy] = useState(false);

  // Start from the target's details every time the dialog opens.
  useEffect(() => {
    if (!target) return;
    setForm({ school: target.school, email: target.email, days: String(DEFAULT_PILOT_DAYS) });
    setCreated(null);
  }, [target]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const email = form.email.trim().toLowerCase();
    setBusy(true);
    try {
      const token = await startPilot(form.school.trim(), email, Number(form.days));
      setCreated({ email, link: invitationLink(token) });
      onStarted?.();
    } catch {
      toast.error("Couldn't start the pilot", {
        description: "Check the details and your internet connection, then try again.",
      });
    } finally {
      setBusy(false);
    }
  };

  const field = (key: keyof typeof form) => ({
    id: `pilot-${key}`,
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{created ? "Pilot started" : "Start a pilot"}</DialogTitle>
          <DialogDescription>
            {created
              ? `${form.school.trim()} has TeachDesk with every Pro tool until the pilot ends.`
              : "Creates the school and an invitation for its contact person, who becomes the school's admin and invites their colleagues."}
          </DialogDescription>
        </DialogHeader>

        {created ? (
          <>
            <InvitationLinkBox {...created} />
            <DialogFooter>
              <Button onClick={onClose}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="pilot-school">School</Label>
              <Input
                {...field("school")}
                required
                maxLength={200}
                placeholder="Enskede Gårds gymnasium"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pilot-email">Contact person's email</Label>
              <Input {...field("email")} type="email" required placeholder="rektor@school.se" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pilot-days">Length of the pilot (days)</Label>
              <Input {...field("days")} type="number" required min={1} max={365} className="w-28" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                Start pilot
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
