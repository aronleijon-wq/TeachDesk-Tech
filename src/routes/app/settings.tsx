import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PageHeader, Panel, StatusPill } from "@/components/primitives";
import { classes } from "@/lib/demo-data";
import { useStore, type Profile } from "@/lib/store";

export const Route = createFileRoute("/app/settings")({
  head: () => ({
    meta: [
      { title: "Settings — TeachDesk" },
      { name: "description", content: "Profile, school, classes, notifications and data settings." },
      { property: "og:title", content: "Settings — TeachDesk" },
      { property: "og:description", content: "Profile, school, classes and data settings." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { demoMode, setDemoMode, profile, setProfile, resetWorkspace } = useStore();
  const [draft, setDraft] = useState<Profile>(profile);
  // Follow the saved profile after a save, a reset, or a change in another tab.
  useEffect(() => setDraft(profile), [profile]);
  const dirty = (Object.keys(draft) as (keyof Profile)[]).some((k) => draft[k] !== profile[k]);
  const field = (k: keyof Profile) => ({
    value: draft[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setDraft((d) => ({ ...d, [k]: e.target.value })),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader title="Settings" subtitle="Profile, school and data." />

      <Panel title="Teacher profile">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Name</Label>
            <Input {...field("name")} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Email</Label>
            <Input {...field("email")} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Role</Label>
            <Input {...field("role")} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">School</Label>
            <Input {...field("school")} />
          </div>
        </div>
        <Button
          className="mt-4"
          size="sm"
          disabled={!dirty || !draft.name.trim()}
          onClick={() => {
            setProfile({ ...draft, name: draft.name.trim() });
            toast.success("Profile saved");
          }}
        >
          Save changes
        </Button>
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
        <div className="flex items-center justify-between gap-4 border-t border-border py-3">
          <div>
            <p className="text-sm font-medium">Saved in this browser</p>
            <p className="text-xs text-muted-foreground">
              Exams, versions, attendance, retakes and your profile are saved automatically on this device.
              Resetting deletes them and restores the demo data.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="shrink-0">Reset demo data</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset all data?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently deletes every exam, generated version, attendance record, retake and profile change
                  saved in this browser, and restores the original demo data. It can't be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    resetWorkspace();
                    toast.success("Demo data restored");
                  }}
                >
                  Reset everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </Panel>

      <Panel title="Subscription">
        <div className="flex items-center justify-between">
          <p className="text-sm">Plan: <span className="font-medium">{profile.plan}</span></p>
          <Button variant="outline" size="sm" onClick={() => toast.info("Billing opens in your school portal")}>
            Manage plan
          </Button>
        </div>
      </Panel>
    </div>
  );
}
