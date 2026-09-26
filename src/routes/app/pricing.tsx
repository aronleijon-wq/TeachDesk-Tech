import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StatusPill } from "@/components/primitives";
import { PlanFeatures } from "@/components/plan-features";
import { Button } from "@/components/ui/button";
import { defineMessages, useLanguage, useMessages, type Language } from "@/lib/i18n";
import { LEGAL } from "@/lib/legal";
import { formatPrice, plans, priceNote, yearlyOffer, type Access, type Plan } from "@/lib/pricing";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const messages = defineMessages({
  en: {
    pageTitle: "Plans — TeachDesk",
    title: "Plans",
    subject: (plan: string) => `TeachDesk ${plan} plan`,
    talkAbout: (plan: string) => `Hi! I'd like to talk about ${plan} for our school.`,
    start: (plan: string, price: string, unit: string) =>
      `Hi! I'd like to start the ${plan} plan (${price} ${unit}).`,
    name: "Name",
    email: "Email",
    school: "School",
    days: (n: number) => `${n} ${n === 1 ? "day" : "days"}`,
    trialEnds: (days: string) =>
      `Your free Pro trial ends in ${days}. Choose Pro to keep every tool — otherwise you'll move to the free plan.`,
    pilot: (days: string) =>
      `Your school is trying TeachDesk with every Pro tool — the pilot has ${days} left.`,
    schoolPlan: "Your school's Enterprise plan gives you every Pro tool.",
    onPlan: (plan: string) => `You're on the ${plan} plan.`,
    trial: "Trial",
    pilotBadge: "Pilot",
    current: "Current plan",
    contactUs: "Contact us",
    choose: (plan: string) => `Choose ${plan}`,
    emailNote: "Choosing a plan sends us an email and we'll set it up for you.",
  },
  sv: {
    pageTitle: "Abonnemang — TeachDesk",
    title: "Abonnemang",
    subject: (plan) => `TeachDesk ${plan}`,
    talkAbout: (plan) => `Hej! Jag vill prata om ${plan} för vår skola.`,
    start: (plan, price, unit) => `Hej! Jag vill börja med ${plan} (${price} ${unit}).`,
    name: "Namn",
    email: "E-post",
    school: "Skola",
    days: (n) => `${n} ${n === 1 ? "dag" : "dagar"}`,
    trialEnds: (days) =>
      `Din gratisperiod med Pro tar slut om ${days}. Välj Pro för att behålla alla verktyg — annars går du över till gratisplanen.`,
    pilot: (days) => `Din skola provar TeachDesk med alla Pro-verktyg — piloten har ${days} kvar.`,
    schoolPlan: "Skolans licens ger dig alla Pro-verktyg.",
    onPlan: (plan) => `Du har ${plan}.`,
    trial: "Gratisperiod",
    pilotBadge: "Pilot",
    current: "Nuvarande",
    contactUs: "Kontakta oss",
    choose: (plan) => `Välj ${plan}`,
    emailNote: "När du väljer ett abonnemang skickas ett mejl till oss, och vi ordnar resten.",
  },
});

export const Route = createFileRoute("/app/pricing")({
  head: ({ match }) => ({ meta: [{ title: messages[match.context.language].pageTitle }] }),
  component: Pricing,
});

/** Until online payment exists, choosing a plan emails TeachDesk with the details filled in. */
function planRequestLink(
  plan: Plan,
  teacher: { name: string; email: string; school: string },
  language: Language,
) {
  const t = messages[language];
  const subject = t.subject(plan.title);
  const request =
    plan.price == null
      ? t.talkAbout(plan.title)
      : t.start(plan.title, formatPrice(plan.price, language), plan.unit);
  const body = [
    request,
    "",
    `${t.name}: ${teacher.name}`,
    `${t.email}: ${teacher.email}`,
    `${t.school}: ${teacher.school || "—"}`,
  ].join("\n");
  return `mailto:${LEGAL.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** What the Plans page says about the teacher's plan. */
function planSummary({ via, daysLeft }: Access, language: Language) {
  const t = messages[language];
  const days = t.days(daysLeft ?? 0);
  if (via === "trial") return t.trialEnds(days);
  if (via === "pilot") return t.pilot(days);
  if (via === "school") return t.schoolPlan;
  const [free, pro] = plans(language);
  return t.onPlan((via === "plan" ? pro : free)?.title ?? "");
}

function Pricing() {
  const { profile } = useStore();
  const { language } = useLanguage();
  const t = useMessages(messages);
  const { level, via, daysLeft } = profile.access;
  const currentPlan =
    via === "school" || via === "pilot" ? "Enterprise" : level === "pro" ? "Pro" : "Free";

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title={t.title} subtitle={planSummary(profile.access, language)} />
      <div className="grid gap-4 md:grid-cols-3">
        {plans(language).map((p) => {
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
                <h3 className="text-sm font-semibold">{p.title}</h3>
                {current && (
                  <StatusPill tone="primary">
                    {via === "trial" ? t.trial : via === "pilot" ? t.pilotBadge : t.current}
                  </StatusPill>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{p.tagline}</p>
              <p className="stat-number mt-3">{formatPrice(p.price, language)}</p>
              <p className="text-xs text-muted-foreground">{p.unit}</p>
              <p className="h-4 text-xs font-medium text-primary">{yearlyOffer(p, language)}</p>
              <PlanFeatures plan={p} language={language} className="mt-4 flex-1" />
              {canChoose && (
                <Button asChild className="mt-5 w-full" variant={p.badge ? "default" : "outline"}>
                  <a href={planRequestLink(p, profile, language)}>
                    {p.price == null ? t.contactUs : t.choose(p.title)}
                  </a>
                </Button>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-6 text-sm text-muted-foreground">
        {priceNote(language)} {t.emailNote}
      </p>
    </div>
  );
}
