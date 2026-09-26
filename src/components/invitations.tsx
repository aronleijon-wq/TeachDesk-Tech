import { Copy } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { formatDate } from "@/components/primitives";
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

// Invitations are shared as links: whoever invites copies the link and sends it themselves.

export function CopyLinkButton({ link }: { link: string }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copied", { description: "Paste it into an email or a chat message." });
    } catch {
      // Clipboard blocked: let them copy it by hand.
      window.prompt("Copy this link:", link);
    }
  };
  return (
    <Button type="button" size="sm" variant="outline" onClick={() => void copy()}>
      <Copy className="size-3.5" /> Copy link
    </Button>
  );
}

/** A newly created invitation link, ready to copy. */
export function InvitationLinkBox({ email, link }: { email: string; link: string }) {
  return (
    <div className="space-y-2 rounded-md border border-primary/30 bg-primary-soft/40 p-3">
      <p className="text-sm">
        Send this link to <span className="font-medium">{email}</span>. It works for 14 days, and
        only for that email address.
      </p>
      <div className="flex gap-2">
        <Input
          readOnly
          value={link}
          aria-label="Invitation link"
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
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 py-2">
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{invitation.email}</span>
        <span className="block text-xs text-muted-foreground">
          {roleLabel(invitation.role)} ·{" "}
          {expired ? "Link expired" : `Link works until ${formatDate(invitation.expiresAt)}`}
        </span>
      </span>
      <span className="flex gap-2">
        {expired ? (
          <Button size="sm" variant="outline" onClick={onRenew}>
            Renew link
          </Button>
        ) : (
          <CopyLinkButton link={invitationLink(invitation.token)} />
        )}
        <Button size="sm" variant="ghost" onClick={onWithdraw}>
          Withdraw
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

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const address = email.trim().toLowerCase();
    if (memberEmails.some((m) => m.toLowerCase() === address)) {
      toast.info(`${address} is already in the school.`);
      return;
    }
    setBusy(true);
    try {
      const token = await inviteToSchool(schoolId, address, role);
      setCreated({ email: address, link: invitationLink(token) });
      setEmail("");
      onInvited?.();
    } catch {
      toast.error("Couldn't create the invitation", {
        description: "Check the email address and your internet connection, then try again.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
        <div className="min-w-48 flex-1 space-y-1.5">
          <Label htmlFor="invite-email">Email address</Label>
          <Input
            id="invite-email"
            type="email"
            required
            placeholder="colleague@school.se"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <Select value={role} onValueChange={(v) => setRole(v as SchoolRole)}>
          <SelectTrigger className="w-32" aria-label="Role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="teacher">Teacher</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" disabled={busy}>
          Create invite link
        </Button>
      </form>
      {created && <InvitationLinkBox {...created} />}
    </div>
  );
}
