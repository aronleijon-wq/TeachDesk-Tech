import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PageHeader, Panel, StatusPill } from "@/components/primitives";
import { classes, teacher } from "@/lib/demo-data";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/app/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Classflow" },
      { name: "description", content: "Profile, school, classes, notifications and data settings." },
      { property: "og:title", content: "Settings — Classflow" },
      { property: "og:description", content: "Profile, school, classes and data settings." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { demoMode, setDemoMode } = useStore();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader title="Settings" subtitle="Profile, school and data." />

      <Panel title="Teacher profile">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Name</Label>
            <Input defaultValue={teacher.name} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Email</Label>
            <Input defaultValue={teacher.email} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Role</Label>
            <Input defaultValue={teacher.role} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">School</Label>
            <Input defaultValue={teacher.school} />
          </div>
        </div>
        <Button className="mt-4" size="sm" onClick={() => toast.success("Profile saved")}>Save changes</Button>
      </Panel>

      <Panel title="Classes">
        <ul className="divide-y divide-border text-sm">
          {classes.map((c) => (
            <li key={c.id} className="flex items-center justify-between py-2">
              <span>
                <span className="font-medium">{c.name}</span>
                <span className="block text-xs text-muted-foreground">{c.subject} · Room {c.room}</span>
              </span>
              <span className="text-xs text-muted-foreground">{c.studentCount} students</span>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Data & AI">
        <div className="flex items-center justify-between gap-4 py-2">
          <div>
            <p className="text-sm font-medium">Demo mode</p>
            <p className="text-xs text-muted-foreground">
              Uses seeded demo classes and students. Turn off to work with live school data.
            </p>
          </div>
          <Switch checked={demoMode} onCheckedChange={setDemoMode} />
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-border py-3">
          <div>
            <p className="text-sm font-medium">Teacher approval required</p>
            <p className="text-xs text-muted-foreground">AI output is never applied without your confirmation.</p>
          </div>
          <StatusPill tone="success">Always on</StatusPill>
        </div>
      </Panel>

      <Panel title="Subscription">
        <div className="flex items-center justify-between">
          <p className="text-sm">Plan: <span className="font-medium">{teacher.plan}</span></p>
          <Button variant="outline" size="sm" onClick={() => toast.info("Billing opens in your school portal")}>
            Manage plan
          </Button>
        </div>
      </Panel>
    </div>
  );
}
