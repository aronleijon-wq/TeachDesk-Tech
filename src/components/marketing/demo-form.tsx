import { useState } from "react";
import { z } from "zod";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(120),
  email: z.string().trim().email("Enter a valid work email").max(255),
  organization: z.string().trim().min(1, "Enter your school or organization").max(200),
  role: z.string().trim().min(1, "Enter your role").max(80),
  message: z.string().trim().max(2000).optional(),
});

export function DemoForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const raw = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (errs[String(i.path[0])] = i.message));
      setErrors(errs);
      return;
    }
    setErrors({});
    setState("sending");
    const { error } = await supabase.from("demo_requests").insert({ ...parsed.data, message: parsed.data.message || null });
    setState(error ? "error" : "done");
  }

  if (state === "done") {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center">
        <span className="mx-auto grid size-10 place-items-center rounded-full bg-success/12 text-success"><Check className="size-5" /></span>
        <h3 className="mt-4 text-lg font-semibold">Thanks — we'll be in touch.</h3>
        <p className="mt-1 text-sm text-muted-foreground">We usually reply within one working day.</p>
      </div>
    );
  }

  const field = (name: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} aria-invalid={!!errors[name]} {...props} />
      {errors[name] && <p className="text-xs text-destructive">{errors[name]}</p>}
    </div>
  );

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4 rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow-card)] sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        {field("name", "Name", { autoComplete: "name" })}
        {field("email", "Work email", { type: "email", autoComplete: "email" })}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {field("organization", "School / organization", { autoComplete: "organization" })}
        {field("role", "Role", { placeholder: "Teacher, principal, IT…" })}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="message">Message <span className="text-muted-foreground">(optional)</span></Label>
        <Textarea id="message" name="message" rows={4} placeholder="What would you like to see?" />
      </div>
      {state === "error" && <p className="text-sm text-destructive">Something went wrong. Please try again.</p>}
      <Button type="submit" size="lg" disabled={state === "sending"} className="w-full bg-foreground text-background hover:bg-foreground/90">
        {state === "sending" ? "Sending…" : "Book a demo"}
      </Button>
    </form>
  );
}
