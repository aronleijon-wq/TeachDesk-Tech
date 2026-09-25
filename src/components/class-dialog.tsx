import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/store";
import { parseStudentList } from "@/lib/workspace";

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
      toast.success(`${details.name.trim()} created`, { description: `${lines.length} students added.` });
      onCreated?.(classId);
    } else if (existing) {
      addStudents(existing.id, lines);
      toast.success(`Students added to ${existing.name}`);
    }
    onClose();
  };

  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isNew ? "New class" : `Add students to ${existing?.name ?? "class"}`}</DialogTitle>
          <DialogDescription>
            Paste your student list — one student per line. You can copy a column straight from SchoolSoft, Excel or
            Google Sheets.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          {isNew && (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5 sm:col-span-3">
                <Label htmlFor="class-name">Class name</Label>
                <Input
                  id="class-name"
                  required
                  autoFocus
                  placeholder="Matematik 3C"
                  value={details.name}
                  onChange={(e) => setDetails((d) => ({ ...d, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="class-subject">Subject</Label>
                <Input
                  id="class-subject"
                  placeholder="Matematik"
                  value={details.subject}
                  onChange={(e) => setDetails((d) => ({ ...d, subject: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="class-room">Room</Label>
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
            <Label htmlFor="class-students">Students</Label>
            <Textarea
              id="class-students"
              rows={8}
              autoFocus={!isNew}
              placeholder={"Sara Andersson\nKarlsson, Leo\nWilliam Johansson, william@skola.se"}
              value={list}
              onChange={(e) => setList(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {lines.length === 0
                ? "“First Last” or “Last, First”, with an optional email. You can also add students later."
                : `${lines.length} ${lines.length === 1 ? "student" : "students"} · names already in the class are skipped`}
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isNew ? !details.name.trim() : lines.length === 0}>
              {isNew ? "Create class" : "Add students"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
