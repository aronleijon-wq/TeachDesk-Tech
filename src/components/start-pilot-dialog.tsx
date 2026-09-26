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
import { defineMessages, useMessages } from "@/lib/i18n";
import { invitationLink, startPilot } from "@/lib/schools";

const messages = defineMessages({
  en: {
    failed: "Couldn't start the pilot",
    failedText: "Check the details and your internet connection, then try again.",
    started: "Pilot started",
    start: "Start a pilot",
    startedText: (school: string) =>
      `${school} has TeachDesk with every Pro tool until the pilot ends.`,
    startText:
      "Creates the school and an invitation for its contact person, who becomes the school's admin and invites their colleagues.",
    done: "Done",
    school: "School",
    schoolPlaceholder: "Enskede Gårds gymnasium",
    email: "Contact person's email",
    emailPlaceholder: "rektor@school.se",
    days: "Length of the pilot (days)",
    cancel: "Cancel",
    submit: "Start pilot",
  },
  sv: {
    failed: "Det gick inte att starta piloten",
    failedText: "Kontrollera uppgifterna och internetanslutningen och försök igen.",
    started: "Piloten har startat",
    start: "Starta en pilot",
    startedText: (school) => `${school} har TeachDesk med alla Pro-verktyg tills piloten tar slut.`,
    startText:
      "Skapar skolan och en inbjudan till kontaktpersonen, som blir skolans administratör och bjuder in sina kollegor.",
    done: "Klar",
    school: "Skola",
    schoolPlaceholder: "Enskede Gårds gymnasium",
    email: "Kontaktpersonens e-post",
    emailPlaceholder: "rektor@skola.se",
    days: "Pilotens längd (dagar)",
    cancel: "Avbryt",
    submit: "Starta piloten",
  },
});

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
  const t = useMessages(messages);

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
      toast.error(t.failed, { description: t.failedText });
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
          <DialogTitle>{created ? t.started : t.start}</DialogTitle>
          <DialogDescription>
            {created ? t.startedText(form.school.trim()) : t.startText}
          </DialogDescription>
        </DialogHeader>

        {created ? (
          <>
            <InvitationLinkBox {...created} />
            <DialogFooter>
              <Button onClick={onClose}>{t.done}</Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="pilot-school">{t.school}</Label>
              <Input
                {...field("school")}
                required
                maxLength={200}
                placeholder={t.schoolPlaceholder}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pilot-email">{t.email}</Label>
              <Input {...field("email")} type="email" required placeholder={t.emailPlaceholder} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pilot-days">{t.days}</Label>
              <Input {...field("days")} type="number" required min={1} max={365} className="w-28" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                {t.cancel}
              </Button>
              <Button type="submit" disabled={busy}>
                {t.submit}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
