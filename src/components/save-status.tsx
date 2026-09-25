import { Link } from "@tanstack/react-router";
import { Check, CloudOff, Loader2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const STATES = {
  saved: { icon: Check, text: "Saved", className: "text-muted-foreground" },
  saving: {
    icon: Loader2,
    text: "Saving…",
    className: "text-muted-foreground [&>svg]:animate-spin",
  },
  offline: { icon: CloudOff, text: "Not saved — retrying", className: "text-destructive" },
} as const;

/** Tells the teacher whether their work is saved, or that they're looking at demo data. */
export function SaveStatus() {
  const { demoMode, saveState } = useStore();

  if (demoMode) {
    return (
      <Link
        to="/app/settings"
        title="You're looking at example data. Turn it off in Settings."
        className="rounded-full bg-warning/15 px-2 py-0.5 text-[11px] font-medium text-warning-foreground hover:bg-warning/25 dark:text-warning"
      >
        Demo data
      </Link>
    );
  }

  const { icon: Icon, text, className } = STATES[saveState];
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn("flex items-center gap-1.5 text-xs", className)}
    >
      <Icon className="size-3.5" />
      <span className="hidden sm:inline">{text}</span>
    </span>
  );
}
