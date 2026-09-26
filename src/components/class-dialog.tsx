import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { defineMessages, useMessages } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { parseStudentList } from "@/lib/workspace";

const messages = defineMessages({
  en: {
    created: (name: string) => `${name} created`,
    studentsAdded: (n: number) => `${n} students added.`,
    addedTo: (name: string) => `Students added to ${name}`,
    newClass: "New class",
    addTo: (name: string) => `Add students to ${name}`,
    class: "class",
    description:
      "Paste your student list — one student per line. You can copy a column straight from SchoolSoft, Excel or Google Sheets.",
    className: "Class name",
    classNamePlaceholder: "Mathematics 3C",
    subject: "Subject",
    subjectPlaceholder: "Mathematics",
    room: "Room",
    students: "Students",
    listPlaceholder: "Sara Andersson\nKarlsson, Leo\nWilliam Johansson, william@skola.se",
    listHint: "“First Last” or “Last, First”, with an optional email. You can also add students later.",
    count: (n: number) =>
      `${n} ${n === 1 ? "student" : "students"} · names already in the class are skipped`,
    cancel: "Cancel",
    create: "Create class",
    add: "Add students",
  },
  sv: {
    created: (name) => `${name} har skapats`,
    studentsAdded: (n) => `${n} elever har lagts till.`,
    addedTo: (name) => `Eleverna har lagts till i ${name}`,
    newClass: "Ny klass",
    addTo: (name) => `Lägg till elever i ${name}`,
    class: "klassen",
    description:
      "Klistra in elevlistan — en elev per rad. Du kan kopiera en kolumn direkt från SchoolSoft, Excel eller Google Kalkylark.",
    className: "Klassens namn",
    classNamePlaceholder: "Matematik 3c",
    subject: "Ämne",
    subjectPlaceholder: "Matematik",
    room: "Sal",
    students: "Elever",
    listPlaceholder: "Sara Andersson\nKarlsson, Leo\nWilliam Johansson, william@skola.se",
    listHint: "”Förnamn Efternamn” eller ”Efternamn, Förnamn”, gärna med e-post. Du kan också lägga till elever senare.",
    count: (n) =>
      `${n} ${n === 1 ? "elev" : "elever"} · namn som redan finns i klassen hoppas över`,
    cancel: "Avbryt",
    create: "Skapa klassen",
    add: "Lägg till elever",
  },
});

/** "new" creates a class with its students; a class id adds more students to that class. */
export type ClassDialogTarget = "new" | { addTo: string };

export function ClassDialog({
  target,
  onClose,
  onCreated,
}: {
  target: ClassDialogTarget | null;
  onClose: () => void;
  onCreated?: (classId: string) => void;
}) {
  const { addClass, addStudents, classById } = useStore();
  const t = useMessages(messages);
  const [details, setDetails] = useState({ name: "", subject: "", room: "" });
  const [list, setList] = useState("");

  // Start with an empty form every time the dialog opens.
  useEffect(() => {
    if (target) {
      setDetails({ name: "", subject: "", room: "" });
      setList("");
    }
  }, [target]);

  const isNew = target === "new";
  const existing = target && target !== "new" ? classById(target.addTo) : undefined;
  const lines = parseStudentList(list);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (isNew) {
      const classId = addClass({ name: details.name.trim(), subject: details.subject.trim(), room: details.room.trim() }, lines);
      toast.success(t.created(details.name.trim()), { description: t.studentsAdded(lines.length) });
      onCreated?.(classId);
    } else if (existing) {
      addStudents(existing.id, lines);
      toast.success(t.addedTo(existing.name));
    }
    onClose();
  };

  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isNew ? t.newClass : t.addTo(existing?.name ?? t.class)}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          {isNew && (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5 sm:col-span-3">
                <Label htmlFor="class-name">{t.className}</Label>
                <Input
                  id="class-name"
                  required
                  autoFocus
                  placeholder={t.classNamePlaceholder}
                  value={details.name}
                  onChange={(e) => setDetails((d) => ({ ...d, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="class-subject">{t.subject}</Label>
                <Input
                  id="class-subject"
                  placeholder={t.subjectPlaceholder}
                  value={details.subject}
                  onChange={(e) => setDetails((d) => ({ ...d, subject: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="class-room">{t.room}</Label>
                <Input
                  id="class-room"
                  placeholder="B214"
                  value={details.room}
                  onChange={(e) => setDetails((d) => ({ ...d, room: e.target.value }))}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="class-students">{t.students}</Label>
            <Textarea
              id="class-students"
              rows={8}
              autoFocus={!isNew}
              placeholder={t.listPlaceholder}
              value={list}
              onChange={(e) => setList(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {lines.length === 0 ? t.listHint : t.count(lines.length)}
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              {t.cancel}
            </Button>
            <Button type="submit" disabled={isNew ? !details.name.trim() : lines.length === 0}>
              {isNew ? t.create : t.add}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
