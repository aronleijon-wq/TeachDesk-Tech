import { Copy } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  invitationLink,
  inviteToSchool,
  isExpired,
  roleLabel,
  type Invitation,
  type SchoolRole,
} from "@/lib/schools";
import { defineMessages, useLanguage, useMessages } from "@/lib/i18n";

const messages = defineMessages({
  en: {
    copied: "Link copied",
    copiedText: "Paste it into an email or a chat message.",
    copyPrompt: "Copy this link:",
    copy: "Copy link",
    sendTo: "Send this link to",
    sendToAfter: ". It works for 14 days, and only for that email address.",
    linkLabel: "Invitation link",
    expired: "Link expired",
    worksUntil: (date: string) => `Link works until ${date}`,
    renew: "Renew link",
    withdraw: "Withdraw",
    alreadyIn: (email: string) => `${email} is already in the school.`,
    createFailed: "Couldn't create the invitation",
    createFailedText: "Check the email address and your internet connection, then try again.",
    email: "Email address",
    emailPlaceholder: "colleague@school.se",
    role: "Role",
    create: "Create invite link",
  },
  sv: {
    copied: "Länken har kopierats",
    copiedText: "Klistra in den i ett mejl eller ett chattmeddelande.",
    copyPrompt: "Kopiera länken:",
    copy: "Kopiera länken",
    sendTo: "Skicka länken till",
    sendToAfter: ". Den gäller i 14 dagar, och bara för den e-postadressen.",
    linkLabel: "Inbjudningslänk",
    expired: "Länken har gått ut",
    worksUntil: (date) => `Länken gäller till ${date}`,
    renew: "Förnya länken",
    withdraw: "Dra tillbaka",
    alreadyIn: (email) => `${email} finns redan i skolan.`,
    createFailed: "Det gick inte att skapa inbjudan",
    createFailedText: "Kontrollera e-postadressen och internetanslutningen och försök igen.",
    email: "E-postadress",
    emailPlaceholder: "kollega@skola.se",
    role: "Roll",
    create: "Skapa inbjudningslänk",
  },
});

// Invitations are shared as links: whoever invites copies the link and sends it themselves.

export function CopyLinkButton({ link }: { link: string }) {
  const t = useMessages(messages);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success(t.copied, { description: t.copiedText });
    } catch {
      // Clipboard blocked: let them copy it by hand.
      window.prompt(t.copyPrompt, link);
    }
  };
  return (
    <Button type="button" size="sm" variant="outline" onClick={() => void copy()}>
      <Copy className="size-3.5" /> {t.copy}
    </Button>
  );
}

/** A newly created invitation link, ready to copy. */
export function InvitationLinkBox({ email, link }: { email: string; link: string }) {
  const t = useMessages(messages);
  return (
    <div className="space-y-2 rounded-md border border-primary/30 bg-primary-soft/40 p-3">
      <p className="text-sm">
        {t.sendTo} <span className="font-medium">{email}</span>
        {t.sendToAfter}
      </p>
      <div className="flex gap-2">
        <Input
          readOnly
          value={link}
          aria-label={t.linkLabel}
          className="font-mono text-xs"
          onFocus={(e) => e.currentTarget.select()}
        />
        <CopyLinkButton link={link} />
      </div>
    </div>
  );
}

/** An open invitation: copy its link again, renew it once expired, or withdraw it. */
export function InvitationRow({
  invitation,
  onRenew,
  onWithdraw,
}: {
  invitation: Invitation;
  onRenew: () => void;
  onWithdraw: () => void;
}) {
  const expired = isExpired(invitation);
  const { language, formatDate } = useLanguage();
  const t = useMessages(messages);
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 py-2">
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{invitation.email}</span>
        <span className="block text-xs text-muted-foreground">
          {roleLabel(invitation.role, language)} ·{" "}
          {expired ? t.expired : t.worksUntil(formatDate(invitation.expiresAt))}
        </span>
      </span>
      <span className="flex gap-2">
        {expired ? (
          <Button size="sm" variant="outline" onClick={onRenew}>
            {t.renew}
          </Button>
        ) : (
          <CopyLinkButton link={invitationLink(invitation.token)} />
        )}
        <Button size="sm" variant="ghost" onClick={onWithdraw}>
          {t.withdraw}
        </Button>
      </span>
    </li>
  );
}

/** Creates an invitation and shows its link. */
export function InviteForm({
  schoolId,
  defaultRole = "teacher",
  memberEmails = [],
  onInvited,
}: {
  schoolId: string;
  defaultRole?: SchoolRole;
  /** People already in the school, who don't need an invitation. */
  memberEmails?: string[];
  onInvited?: () => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<SchoolRole>(defaultRole);
  const [created, setCreated] = useState<{ email: string; link: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const { language } = useLanguage();
  const t = useMessages(messages);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const address = email.trim().toLowerCase();
    if (memberEmails.some((m) => m.toLowerCase() === address)) {
      toast.info(t.alreadyIn(address));
      return;
    }
    setBusy(true);
    try {
      const token = await inviteToSchool(schoolId, address, role);
      setCreated({ email: address, link: invitationLink(token) });
      setEmail("");
      onInvited?.();
    } catch {
      toast.error(t.createFailed, { description: t.createFailedText });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
        <div className="min-w-48 flex-1 space-y-1.5">
          <Label htmlFor="invite-email">{t.email}</Label>
          <Input
            id="invite-email"
            type="email"
            required
            placeholder={t.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <Select value={role} onValueChange={(v) => setRole(v as SchoolRole)}>
          <SelectTrigger className="w-36" aria-label={t.role}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="teacher">{roleLabel("teacher", language)}</SelectItem>
            <SelectItem value="admin">{roleLabel("admin", language)}</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" disabled={busy}>
          {t.create}
        </Button>
      </form>
      {created && <InvitationLinkBox {...created} />}
    </div>
  );
}
