import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardList,
  HelpCircle,
  Inbox,
  LayoutDashboard,
  LifeBuoy,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Sparkles,
  Sun,
  Table2,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { LogoMark, Wordmark } from "@/components/brand";
import { useAuth } from "@/lib/auth";
import { classById, students } from "@/lib/demo-data";
import { initialsOf, useAttentionSummary, useStore } from "@/lib/store";

const nav = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/exams", label: "Exams", icon: BookOpen },
  { to: "/app/assignments", label: "Assignments", icon: ClipboardList },
  { to: "/app/students", label: "Students", icon: Users },
  { to: "/app/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/app/gradebook", label: "Gradebook", icon: Table2 },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/app/ai-tools", label: "AI Tools", icon: Sparkles },
] as const;

// Only shown to admins; the database enforces access either way.
const adminNav = { to: "/app/admin", label: "Demo requests", icon: Inbox } as const;

const secondary = [
  { to: "/app/settings", label: "Settings", icon: Settings },
  { to: "/app/help", label: "Help", icon: LifeBuoy },
] as const;

function useDarkMode() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  return { dark, setDark };
}

function GlobalSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { exams, assignments } = useStore();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-lg">
        <DialogTitle className="sr-only">Search</DialogTitle>
        <Command>
          <CommandInput placeholder="Search students, exams, assignments, classes..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Students">
              {students.slice(0, 40).map((s) => (
                <CommandItem key={s.id} value={`${s.name} ${classById(s.classId)?.name}`} asChild>
                  <Link to="/app/students/$studentId" params={{ studentId: s.id }} onClick={() => onOpenChange(false)}>
                    <span className="font-medium">{s.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {classById(s.classId)?.name} · {s.missingWork} missing
                    </span>
                  </Link>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Exams">
              {exams.map((e) => (
                <CommandItem key={e.id} value={e.title} asChild>
                  <Link to="/app/exams/$examId" params={{ examId: e.id }} onClick={() => onOpenChange(false)}>
                    <span className="font-medium">{e.title}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{classById(e.classId)?.name}</span>
                  </Link>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Assignments">
              {assignments.map((a) => (
                <CommandItem key={a.id} value={a.title} asChild>
                  <Link to="/app/assignments" onClick={() => onOpenChange(false)}>
                    <span className="font-medium">{a.title}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{classById(a.classId)?.name}</span>
                  </Link>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { dark, setDark } = useDarkMode();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { missedExams, toGrade, needsScheduling } = useAttentionSummary();
  const { profile } = useStore();
  const { isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const teacher = { ...profile, initials: initialsOf(profile.name) };
  const subtitle = [teacher.school, teacher.plan].filter(Boolean).join(" · ");
  const handleSignOut = async () => {
    await signOut();
    await navigate({ to: "/login" });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const title = useMemo(() => {
    const match = [...nav, adminNav, ...secondary].find(
      (n) => n.to === pathname || (n.to !== "/app" && pathname.startsWith(n.to)),
    );
      return match?.label ?? "TeachDesk";
  }, [pathname]);

  return (
    <TooltipProvider delayDuration={120}>
      <div className="flex min-h-screen bg-background">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-30 hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 md:flex",
            collapsed ? "w-16" : "w-60",
          )}
        >
          <div className={cn("flex h-14 items-center gap-2 px-4", collapsed && "justify-center px-0")}>
            {collapsed ? <LogoMark /> : <Wordmark />}
          </div>

          <nav className="flex-1 space-y-0.5 px-2 py-2">
            {nav.map((item) => (
              <NavLink key={item.to} {...item} collapsed={collapsed} />
            ))}
            <div className="my-3 border-t border-sidebar-border" />
            {isAdmin && <NavLink {...adminNav} collapsed={collapsed} />}
            {secondary.map((item) => (
              <NavLink key={item.to} {...item} collapsed={collapsed} />
            ))}
          </nav>

          <div className="border-t border-sidebar-border p-2">
            <Link
              to="/app/settings"
              aria-label={collapsed ? `${teacher.name} — settings` : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-sidebar-accent",
                collapsed && "justify-center",
              )}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                {teacher.initials}
              </span>
              {!collapsed && (
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{teacher.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {subtitle}
                  </span>
                </span>
              )}
            </Link>
          </div>
        </aside>

        <div className={cn("flex min-w-0 flex-1 flex-col transition-[padding] duration-200", collapsed ? "md:pl-16" : "md:pl-60")}>
          <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border bg-surface/90 px-4 backdrop-blur">
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:inline-flex"
              onClick={() => setCollapsed((v) => !v)}
              aria-label="Toggle sidebar"
            >
              {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
            </Button>
            <p className="truncate text-sm font-semibold">{title}</p>

            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={() => setSearchOpen(true)}
                className="hidden h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground transition-colors hover:bg-accent sm:flex"
              >
                <Search className="size-4" />
                <span>Search</span>
                <kbd className="ml-6 rounded border border-border px-1.5 text-[10px]">⌘K</kbd>
              </button>
              <Button variant="ghost" size="icon" className="sm:hidden" onClick={() => setSearchOpen(true)} aria-label="Search">
                <Search className="size-4" />
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
                    <Bell className="size-4" />
                    <span className="absolute right-2 top-2 size-1.5 rounded-full bg-primary" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-0">
                  <div className="border-b border-border px-4 py-3 text-sm font-semibold">Notifications</div>
                  <ul className="divide-y divide-border text-sm">
                    <li className="px-4 py-3">
                      <p className="font-medium">{missedExams.length} students missed an exam</p>
                      <p className="text-xs text-muted-foreground">Retakes can be scheduled now</p>
                    </li>
                    <li className="px-4 py-3">
                      <p className="font-medium">{toGrade} submissions need grading</p>
                      <p className="text-xs text-muted-foreground">Across 3 assignments</p>
                    </li>
                    <li className="px-4 py-3">
                      <p className="font-medium">{needsScheduling.length} retakes need scheduling</p>
                      <p className="text-xs text-muted-foreground">Mathematics 3C</p>
                    </li>
                  </ul>
                </PopoverContent>
              </Popover>

              <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={() => setDark(!dark)}>
                {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </Button>
              <Button variant="ghost" size="icon" asChild aria-label="Help">
                <Link to="/app/help">
                  <HelpCircle className="size-4" />
                </Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="ml-1 flex size-8 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                    {teacher.initials}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <span className="block text-sm">{teacher.name}</span>
                    <span className="block text-xs font-normal text-muted-foreground">{teacher.email}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/app/settings">Profile & settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/app/settings">{teacher.school ? `School — ${teacher.school}` : "Add your school"}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/app/pricing">Plan — {teacher.plan}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to={adminNav.to}>Demo requests</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onSelect={() => void handleSignOut()}>Sign out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-10">{children}</main>
        </div>

        {/* Mobile bottom navigation */}
        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-surface md:hidden">
          {nav.slice(0, 5).map((item) => {
            const active = item.to === "/app" ? pathname === "/app" || pathname === "/app/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 text-[10px] font-medium",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
      </div>
    </TooltipProvider>
  );
}

function NavLink({
  to,
  label,
  icon: Icon,
  collapsed,
}: {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  collapsed: boolean;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active = to === "/app" ? pathname === "/app" || pathname === "/app/" : pathname.startsWith(to);

  const link = (
    <Link
      to={to}
      aria-label={collapsed ? label : undefined}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent/60",
        collapsed && "justify-center px-0",
      )}
    >
      <Icon className={cn("size-4 shrink-0", active && "text-primary")} />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );

  if (!collapsed) return link;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}
