import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StatusPill } from "@/components/primitives";
import { PlanFeatures } from "@/components/plan-features";
import { Button } from "@/components/ui/button";
import { LEGAL } from "@/lib/legal";
import { PLANS, PRICE_NOTE, formatPrice, yearlyOffer, type Access, type Plan } from "@/lib/pricing";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/pricing")({
  head: () => ({
    meta: [
      { title: "Plans — TeachDesk" },
      {
        name: "description",
        content: "Plans for individual teachers, departments and whole schools.",
      },
      { property: "og:title", content: "Plans — TeachDesk" },
      { property: "og:description", content: "Plans for teachers, departments and schools." },
    ],
  }),
  component: Pricing,
});

/** Until online payment exists, choosing a plan emails TeachDesk with the details filled in. */
function planRequestLink(plan: Plan, teacher: { name: string; email: string; school: string }) {
  const subject = `TeachDesk ${plan.name} plan`;
  const request =
    plan.price == null
      ? `Hi! I'd like to talk about ${plan.name} for our school.`
      : `Hi! I'd like to start the ${plan.name} plan (${formatPrice(plan.price)} ${plan.unit}).`;
  const body = [
    request,
    "",
    `Name: ${teacher.name}`,
    `Email: ${teacher.email}`,
    `School: ${teacher.school || "—"}`,
  ].join("\n");
  return `mailto:${LEGAL.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** What the Plans page says about the teacher's plan. */
function planSummary({ via, daysLeft }: Access) {
  const days = `${daysLeft} ${daysLeft === 1 ? "day" : "days"}`;
  if (via === "trial")
    return `Your free Pro trial ends in ${days}. Choose Pro to keep every tool — otherwise you'll move to the free plan.`;
  if (via === "pilot")
    return `Your school is trying TeachDesk with every Pro tool — the pilot has ${days} left.`;
  if (via === "school") return "Your school's Enterprise plan gives you every Pro tool.";
  return `You're on the ${via === "plan" ? "Pro" : "Free"} plan.`;
}

function Pricing() {
  const { profile } = useStore();
  const { level, via, daysLeft } = profile.access;
  const currentPlan =
    via === "school" || via === "pilot" ? "Enterprise" : level === "pro" ? "Pro" : "Free";

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Plans" subtitle={planSummary(profile.access)} />
      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((p) => {
          const current = p.name === currentPlan;
          // The free plan needs no choosing, and a running trial or pilot can become a paid plan.
          const canChoose = p.price !== 0 && (!current || daysLeft !== null);
          return (
            <div
              key={p.name}
              className={cn(
                "flex flex-col rounded-lg border bg-surface p-5 shadow-card",
                current ? "border-primary" : "border-border",
              )}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{p.name}</h3>
                {current && (
                  <StatusPill tone="primary">
                    {via === "trial" ? "Trial" : via === "pilot" ? "Pilot" : "Current plan"}
                  </StatusPill>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{p.tagline}</p>
              <p className="stat-number mt-3">{formatPrice(p.price)}</p>
              <p className="text-xs text-muted-foreground">{p.unit}</p>
              <p className="h-4 text-xs font-medium text-primary">{yearlyOffer(p)}</p>
              <PlanFeatures plan={p} className="mt-4 flex-1" />
              {canChoose && (
                <Button asChild className="mt-5 w-full" variant={p.badge ? "default" : "outline"}>
                  <a href={planRequestLink(p, profile)}>
                    {p.price == null ? "Contact us" : `Choose ${p.name}`}
                  </a>
                </Button>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-6 text-sm text-muted-foreground">
        {PRICE_NOTE} Choosing a plan sends us an email and we'll set it up for you.
      </p>
    </div>
  );
}
