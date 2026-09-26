import { Link } from "@tanstack/react-router";
import { Check, CloudOff, Loader2 } from "lucide-react";
import { defineMessages, useMessages } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const messages = defineMessages({
  en: {
    saved: "Saved",
    saving: "Saving…",
    offline: "Not saved — retrying",
    demo: "Demo data",
    demoHint: "You're looking at example data. Turn it off in Settings.",
  },
  sv: {
    saved: "Sparat",
    saving: "Sparar…",
    offline: "Inte sparat — försöker igen",
    demo: "Exempeldata",
    demoHint: "Du tittar på exempeldata. Stäng av det under Inställningar.",
  },
});

const STATES = {
  saved: { icon: Check, className: "text-muted-foreground" },
  saving: { icon: Loader2, className: "text-muted-foreground [&>svg]:animate-spin" },
  offline: { icon: CloudOff, className: "text-destructive" },
} as const;

/** Tells the teacher whether their work is saved, or that they're looking at demo data. */
export function SaveStatus() {
  const { demoMode, saveState } = useStore();
  const t = useMessages(messages);

  if (demoMode) {
    return (
      <Link
        to="/app/settings"
        title={t.demoHint}
        className="rounded-full bg-warning/15 px-2 py-0.5 text-[11px] font-medium text-warning-foreground hover:bg-warning/25 dark:text-warning"
      >
        {t.demo}
      </Link>
    );
  }

  const { icon: Icon, className } = STATES[saveState];
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn("flex items-center gap-1.5 text-xs", className)}
    >
      <Icon className="size-3.5" />
      <span className="hidden sm:inline">{t[saveState]}</span>
    </span>
  );
}
