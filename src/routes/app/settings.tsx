import { createFileRoute, Link } from "@tanstack/react-router";
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
import { defineMessages, LANGUAGE_NAMES, useLanguage, useMessages, type Language } from "@/lib/i18n";
import { useStore, type Profile } from "@/lib/store";
import { accessLabel } from "@/lib/pricing";
import { cn } from "@/lib/utils";

const messages = defineMessages({
  en: {
    pageTitle: "Settings — TeachDesk",
    title: "Settings",
    subtitle: "Profile, school and data.",
    language: "Language",
    languageText: "The language TeachDesk is shown in on this device. Printed exams use it too.",
    profile: "Teacher profile",
    name: "Name",
    email: "Email",
    emailHint: "Your sign-in email.",
    role: "Role",
    school: "School",
    saved: "Profile saved",
    saveFailed: "Couldn't save your profile",
    checkConnection: "Check your internet connection and try again.",
    save: "Save changes",
    classes: "Classes",
    manageClasses: "Manage classes",
    noClasses: "No classes yet. Add your first class on the Students page.",
    room: (room: string) => `Room ${room}`,
    students: (n: number) => `${n} ${n === 1 ? "student" : "students"}`,
    dataAndAi: "Data & AI",
    showDemo: "Show demo data",
    showDemoText:
      "On: explore TeachDesk with example classes and students. Off: your real classes, students and exams. Switching never deletes anything.",
    showingDemo: "Showing demo data",
    showingOwn: "Showing your own workspace",
    settingFailed: "Couldn't change the setting",
    approval: "Teacher approval required",
    approvalText: "AI output is never applied without your confirmation.",
    alwaysOn: "Always on",
    whereSaved: "Where your data is saved",
    whereSavedText:
      "Your classes, exams and profile are saved to your account automatically, so they're there on any device. A school's workspace is shared with the teachers at that school. The demo is kept in this browser only; resetting it restores the example data and doesn't touch your real classes.",
    resetDemo: "Reset demo data",
    resetTitle: "Reset the demo data?",
    resetText:
      "Changes you made while exploring the demo are undone and the example data is restored. Your own classes, students and exams are kept.",
    cancel: "Cancel",
    restored: "Demo data restored",
    subscription: "Subscription",
    plan: "Plan:",
    seePlans: "See plans",
  },
  sv: {
    pageTitle: "Inställningar — TeachDesk",
    title: "Inställningar",
    subtitle: "Profil, skola och data.",
    language: "Språk",
    languageText: "Språket som TeachDesk visas på i den här enheten. Utskrivna prov använder det också.",
    profile: "Lärarprofil",
    name: "Namn",
    email: "E-post",
    emailHint: "E-postadressen du loggar in med.",
    role: "Roll",
    school: "Skola",
    saved: "Profilen har sparats",
    saveFailed: "Det gick inte att spara profilen",
    checkConnection: "Kontrollera internetanslutningen och försök igen.",
    save: "Spara ändringar",
    classes: "Klasser",
    manageClasses: "Hantera klasser",
    noClasses: "Inga klasser än. Lägg till din första klass på sidan Elever.",
    room: (room) => `Sal ${room}`,
    students: (n) => `${n} ${n === 1 ? "elev" : "elever"}`,
    dataAndAi: "Data och AI",
    showDemo: "Visa exempeldata",
    showDemoText:
      "På: utforska TeachDesk med exempelklasser och exempelelever. Av: dina riktiga klasser, elever och prov. Inget tas bort när du byter.",
    showingDemo: "Visar exempeldata",
    showingOwn: "Visar din egen arbetsyta",
    settingFailed: "Det gick inte att ändra inställningen",
    approval: "Lärarens godkännande krävs",
    approvalText: "Inget som AI tar fram används utan att du har godkänt det.",
    alwaysOn: "Alltid på",
    whereSaved: "Var din data sparas",
    whereSavedText:
      "Dina klasser, prov och din profil sparas automatiskt på ditt konto, så att de finns på alla enheter. En skolas arbetsyta delas med lärarna på skolan. Exempeldatan finns bara i den här webbläsaren; när du återställer den kommer exemplen tillbaka och dina riktiga klasser påverkas inte.",
    resetDemo: "Återställ exempeldata",
    resetTitle: "Återställa exempeldatan?",
    resetText:
      "Ändringar du har gjort i exempeldatan tas bort och exemplen återställs. Dina egna klasser, elever och prov finns kvar.",
    cancel: "Avbryt",
    restored: "Exempeldatan har återställts",
    subscription: "Abonnemang",
    plan: "Abonnemang:",
    seePlans: "Se abonnemang",
  },
});

export const Route = createFileRoute("/app/settings")({
  head: ({ match }) => ({ meta: [{ title: messages[match.context.language].pageTitle }] }),
  component: SettingsPage,
});

type ProfileForm = Pick<Profile, "name" | "role" | "school">;
const FORM_FIELDS = ["name", "role", "school"] as const;
const formFrom = (p: Profile): ProfileForm => ({ name: p.name, role: p.role, school: p.school });

function SettingsPage() {
  const { demoMode, setDemoMode, profile, saveProfile, resetDemo, classes, classSize } = useStore();
  const { language, setLanguage } = useLanguage();
  const t = useMessages(messages);
  const [draft, setDraft] = useState<ProfileForm>(() => formFrom(profile));
  const [saving, setSaving] = useState(false);
  // Follow the saved profile, e.g. after a save or a change on another device.
  useEffect(() => setDraft(formFrom(profile)), [profile]);
  const dirty = FORM_FIELDS.some((k) => draft[k] !== profile[k]);
  const field = (k: keyof ProfileForm) => ({
    value: draft[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setDraft((d) => ({ ...d, [k]: e.target.value })),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader title={t.title} subtitle={t.subtitle} />

      <Panel title={t.language} description={t.languageText}>
        <div className="flex w-fit rounded-md border border-border p-0.5">
          {(Object.keys(LANGUAGE_NAMES) as Language[]).map((option) => (
            <button
              key={option}
              type="button"
              lang={option}
              aria-pressed={language === option}
              onClick={() => setLanguage(option)}
              className={cn(
                "rounded px-4 py-1.5 text-sm",
                language === option ? "bg-primary-soft font-medium text-primary" : "text-muted-foreground",
              )}
            >
              {LANGUAGE_NAMES[option]}
            </button>
          ))}
        </div>
      </Panel>

      <Panel title={t.profile}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t.name}</Label>
            <Input {...field("name")} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t.email}</Label>
            <Input value={profile.email} disabled />
            <p className="text-xs text-muted-foreground">{t.emailHint}</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t.role}</Label>
            <Input {...field("role")} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t.school}</Label>
            <Input {...field("school")} />
          </div>
        </div>
        <Button
          className="mt-4"
          size="sm"
          disabled={saving || !dirty || !draft.name.trim()}
          onClick={async () => {
            setSaving(true);
            try {
              await saveProfile({ ...draft, name: draft.name.trim() });
              toast.success(t.saved);
            } catch {
              toast.error(t.saveFailed, { description: t.checkConnection });
            } finally {
              setSaving(false);
            }
          }}
        >
          {t.save}
        </Button>
      </Panel>

      <Panel
        title={t.classes}
        action={
          <Button asChild variant="outline" size="sm">
            <Link to="/app/students">{t.manageClasses}</Link>
          </Button>
        }
      >
        {classes.length === 0 && <p className="text-sm text-muted-foreground">{t.noClasses}</p>}
        <ul className="divide-y divide-border text-sm">
          {classes.map((c) => (
            <li key={c.id} className="flex items-center justify-between py-2">
              <span>
                <span className="font-medium">{c.name}</span>
                <span className="block text-xs text-muted-foreground">{[c.subject, c.room && t.room(c.room)].filter(Boolean).join(" · ")}</span>
              </span>
              <span className="text-xs text-muted-foreground">{t.students(classSize(c.id))}</span>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title={t.dataAndAi}>
        <div className="flex items-center justify-between gap-4 py-2">
          <div>
            <p className="text-sm font-medium">{t.showDemo}</p>
            <p className="text-xs text-muted-foreground">{t.showDemoText}</p>
          </div>
          <Switch
            checked={demoMode}
            onCheckedChange={async (on) => {
              try {
                await setDemoMode(on);
                toast.success(on ? t.showingDemo : t.showingOwn);
              } catch {
                toast.error(t.settingFailed, { description: t.checkConnection });
              }
            }}
          />
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-border py-3">
          <div>
            <p className="text-sm font-medium">{t.approval}</p>
            <p className="text-xs text-muted-foreground">{t.approvalText}</p>
          </div>
          <StatusPill tone="success">{t.alwaysOn}</StatusPill>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-border py-3">
          <div>
            <p className="text-sm font-medium">{t.whereSaved}</p>
            <p className="text-xs text-muted-foreground">{t.whereSavedText}</p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="shrink-0">{t.resetDemo}</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t.resetTitle}</AlertDialogTitle>
                <AlertDialogDescription>{t.resetText}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    resetDemo();
                    toast.success(t.restored);
                  }}
                >
                  {t.resetDemo}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </Panel>

      <Panel title={t.subscription}>
        <div className="flex items-center justify-between">
          <p className="text-sm">
            {t.plan} <span className="font-medium">{accessLabel(profile.access, language)}</span>
          </p>
          <Button asChild variant="outline" size="sm">
            <Link to="/app/pricing">{t.seePlans}</Link>
          </Button>
        </div>
      </Panel>
    </div>
  );
}
