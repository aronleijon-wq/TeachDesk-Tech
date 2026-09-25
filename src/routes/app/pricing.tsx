import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader, StatusPill } from "@/components/primitives";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/pricing")({
  head: () => ({
    meta: [
      { title: "Plans — Classflow" },
      { name: "description", content: "Plans for individual teachers, departments and whole schools." },
      { property: "og:title", content: "Plans — Classflow" },
      { property: "og:description", content: "Plans for teachers, departments and schools." },
    ],
  }),
  component: Pricing,
});

const plans = [
  {
    name: "Teacher",
    price: "129 kr",
    period: "per month",
    features: ["Unlimited exams", "Attendance and retakes", "Gradebook", "1 AI version per exam"],
  },
  {
    name: "Professional",
    price: "249 kr",
    period: "per month",
    highlight: true,
    features: ["Everything in Teacher", "Unlimited AI versions", "Rubrics and grading suggestions", "Analytics", "Exports"],
  },
  {
    name: "School",
    price: "Custom",
    period: "per school",
    features: ["Everything in Professional", "Shared exam library", "Admin roles and audit log", "School system integrations"],
  },
];

function Pricing() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Plans" subtitle="Less administration. More teaching." />
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((p) => (
          <div
            key={p.name}
            className={cn(
              "rounded-lg border bg-surface p-5 shadow-card",
              p.highlight ? "border-primary" : "border-border",
            )}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">{p.name}</h3>
              {p.highlight && <StatusPill tone="primary">Current plan</StatusPill>}
            </div>
            <p className="stat-number mt-3">{p.price}</p>
            <p className="text-xs text-muted-foreground">{p.period}</p>
            <ul className="mt-4 space-y-2 text-sm">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 text-primary" /> {f}
                </li>
              ))}
            </ul>
            <Button
              className="mt-5 w-full"
              variant={p.highlight ? "default" : "outline"}
              onClick={() => toast.info("Billing opens in your school portal")}
            >
              {p.highlight ? "Manage plan" : `Choose ${p.name}`}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
