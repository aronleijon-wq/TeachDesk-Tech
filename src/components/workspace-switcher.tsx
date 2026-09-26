import { useNavigate } from "@tanstack/react-router";
import { Check, ChevronsUpDown, FlaskConical, School, User, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { defineMessages, useMessages } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const messages = defineMessages({
  en: {
    demo: "Demo data",
    personal: "Personal",
    switchFailed: "Couldn't switch workspace",
    tryAgain: "Please try again.",
    switchLabel: (name: string) => `Workspace: ${name}. Switch workspace`,
    workspaces: "Workspaces",
    shared: "Shared with your school",
    onlyYou: "Only you",
    demoDetail: "Example classes to try things on",
  },
  sv: {
    demo: "Exempeldata",
    personal: "Personlig",
    switchFailed: "Det gick inte att byta arbetsyta",
    tryAgain: "Försök igen.",
    switchLabel: (name) => `Arbetsyta: ${name}. Byt arbetsyta`,
    workspaces: "Arbetsytor",
    shared: "Delas med din skola",
    onlyYou: "Bara du",
    demoDetail: "Exempelklasser att prova saker på",
  },
});

/**
 * Switches between the teacher's school workspace, their personal one and the demo. Only
 * shown to teachers who belong to a school; everyone else has one workspace and the demo
 * switch in Settings.
 */
export function WorkspaceSwitcher({ className }: { className?: string }) {
  const { schools, openSchool, openWorkspace, demoMode, setDemoMode } = useStore();
  const navigate = useNavigate();
  const t = useMessages(messages);
  if (schools.length === 0) return null;

  const current = demoMode
    ? { icon: FlaskConical, name: t.demo }
    : { icon: openSchool ? School : User, name: openSchool?.name ?? t.personal };

  const open = async (change: () => Promise<void>) => {
    try {
      await change();
      // The page that was showing may not exist in the other workspace.
      await navigate({ to: "/app" });
    } catch (e) {
      toast.error(t.switchFailed, {
        description: e instanceof Error ? e.message : t.tryAgain,
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex min-w-0 max-w-56 items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-sm font-medium transition-colors hover:bg-accent",
            className,
          )}
          aria-label={t.switchLabel(current.name)}
        >
          <current.icon className="size-4 shrink-0 text-primary" />
          <span className="truncate">{current.name}</span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          {t.workspaces}
        </DropdownMenuLabel>
        {schools.map((school) => (
          <Option
            key={school.id}
            icon={School}
            name={school.name}
            detail={t.shared}
            active={!demoMode && openSchool?.id === school.id}
            onSelect={() => void open(() => openWorkspace(school.id))}
          />
        ))}
        <Option
          icon={User}
          name={t.personal}
          detail={t.onlyYou}
          active={!demoMode && !openSchool}
          onSelect={() => void open(() => openWorkspace(null))}
        />
        <DropdownMenuSeparator />
        <Option
          icon={FlaskConical}
          name={t.demo}
          detail={t.demoDetail}
          active={demoMode}
          onSelect={() => void open(() => setDemoMode(true))}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Option({
  icon: Icon,
  name,
  detail,
  active,
  onSelect,
}: {
  icon: LucideIcon;
  name: string;
  detail: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <DropdownMenuItem
      className="gap-2"
      onSelect={() => {
        if (!active) onSelect();
      }}
    >
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1">
        <span className="block truncate">{name}</span>
        <span className="block truncate text-xs text-muted-foreground">{detail}</span>
      </span>
      {active && <Check className="size-4 shrink-0 text-primary" />}
    </DropdownMenuItem>
  );
}
