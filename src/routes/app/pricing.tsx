import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StatusPill } from "@/components/primitives";
import { PlanFeatures } from "@/components/plan-features";
import { Button } from "@/components/ui/button";
import { LEGAL } from "@/lib/legal";
import { PLANS, PRICE_NOTE, formatPrice, yearlyOffer, type Plan } from "@/lib/pricing";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/pricing")({
  head: () => ({
    meta: [
      { title: "Plans — TeachDesk" },
      { name: "description", content: "Plans for individual teachers, departments and whole schools." },
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

function Pricing() {
  const { profile } = useStore();

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Plans" subtitle={`You're on the ${profile.plan} plan.`} />
      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((p) => {
          const current = p.name === profile.plan;
          return (
            <div
              key={p.name}
              className={cn("flex flex-col rounded-lg border bg-surface p-5 shadow-card", current ? "border-primary" : "border-border")}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{p.name}</h3>
                {current && <StatusPill tone="primary">Current plan</StatusPill>}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{p.tagline}</p>
              <p className="stat-number mt-3">{formatPrice(p.price)}</p>
              <p className="text-xs text-muted-foreground">{p.unit}</p>
              <p className="h-4 text-xs font-medium text-primary">{yearlyOffer(p)}</p>
              <PlanFeatures plan={p} className="mt-4 flex-1" />
              {!current && (
                <Button asChild className="mt-5 w-full" variant={p.badge ? "default" : "outline"}>
                  <a href={planRequestLink(p, profile)}>{p.price == null ? "Contact us" : `Choose ${p.name}`}</a>
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
