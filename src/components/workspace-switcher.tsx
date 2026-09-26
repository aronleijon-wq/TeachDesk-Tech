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
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

/**
 * Switches between the teacher's school workspace, their personal one and the demo. Only
 * shown to teachers who belong to a school; everyone else has one workspace and the demo
 * switch in Settings.
 */
export function WorkspaceSwitcher({ className }: { className?: string }) {
  const { schools, openSchool, openWorkspace, demoMode, setDemoMode } = useStore();
  const navigate = useNavigate();
  if (schools.length === 0) return null;

  const current = demoMode
    ? { icon: FlaskConical, name: "Demo data" }
    : { icon: openSchool ? School : User, name: openSchool?.name ?? "Personal" };

  const open = async (change: () => Promise<void>) => {
    try {
      await change();
      // The page that was showing may not exist in the other workspace.
      await navigate({ to: "/app" });
    } catch (e) {
      toast.error("Couldn't switch workspace", {
        description: e instanceof Error ? e.message : "Please try again.",
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
          aria-label={`Workspace: ${current.name}. Switch workspace`}
        >
          <current.icon className="size-4 shrink-0 text-primary" />
          <span className="truncate">{current.name}</span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Workspaces</DropdownMenuLabel>
        {schools.map((school) => (
          <Option
            key={school.id}
            icon={School}
            name={school.name}
            detail="Shared with your school"
            active={!demoMode && openSchool?.id === school.id}
            onSelect={() => void open(() => openWorkspace(school.id))}
          />
        ))}
        <Option
          icon={User}
          name="Personal"
          detail="Only you"
          active={!demoMode && !openSchool}
          onSelect={() => void open(() => openWorkspace(null))}
        />
        <DropdownMenuSeparator />
        <Option
          icon={FlaskConical}
          name="Demo data"
          detail="Example classes to try things on"
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
