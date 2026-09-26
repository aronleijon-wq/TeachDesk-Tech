// The one place for TeachDesk's plans, prices and plan limits. The public pricing section
// and the in-app Plans page both read from here, so they always agree.
//
// Every new teacher gets Pro free for TRIAL_DAYS, then keeps the free plan unless they
// upgrade. Enterprise is for schools and municipalities: no public price — they contact
// us for a quote.
import { defineMessages, type Language } from "./messages";

export const TRIAL_DAYS = 14;
export const FREE_CLASS_LIMIT = 2;
/** Enforced in the database (ai_generations_left) — keep the two in sync. */
export const FREE_AI_PER_MONTH = 3;
/** Questions each teacher can ask the help assistant per day. Enforced in the database
 * (use_help_question) — keep the two in sync. */
export const HELP_QUESTIONS_PER_DAY = 20;

export interface Plan {
  name: "Free" | "Pro" | "Enterprise";
  /** The plan's name as shown: "Free" is "Gratis" in Swedish. */
  title: string;
  tagline: string;
  /** Monthly price in SEK, or null for "contact us". */
  price: number | null;
  /** Price in SEK when paying for a year up front, if offered. */
  yearlyPrice?: number;
  unit: string;
  features: { label: string; comingSoon?: boolean }[];
  /** Highlighted on the public pricing section, with this badge. */
  badge?: string;
}

const PRO_PRICE = 229;

const messages = defineMessages({
  en: {
    free: {
      title: "Free",
      tagline: "The essentials, for teachers on their own.",
      unit: "forever",
      features: [
        `Up to ${FREE_CLASS_LIMIT} classes`,
        "Exams, attendance and retakes",
        "Gradebook and calendar",
        `${FREE_AI_PER_MONTH} AI-generated retakes per month`,
      ],
    },
    pro: {
      title: "Pro",
      tagline: "Every tool, for teachers on their own.",
      unit: "per month",
      features: [
        "Unlimited classes",
        "Unlimited AI-generated retakes",
        "Generate new exams with AI",
        "Import your own exams from PDF, photo or text",
        "Grade tests with AI — you approve every score",
      ],
    },
    enterprise: {
      title: "Enterprise",
      tagline: "For whole schools and municipalities.",
      unit: "tailored to your school",
      badge: "For schools",
      features: [
        "Pro for every teacher",
        "Invoice billing and a data processing agreement",
        "Onboarding for your staff",
        "A shared workspace with admin roles for your school",
      ],
      comingSoon: "School system integrations",
    },
    contactUs: "Let's talk",
    yearly: (price: string, monthsFree: number) =>
      `or ${price} per year — ${monthsFree} months free`,
    priceNote: `Every new account starts with ${TRIAL_DAYS} days of Pro for free — no card needed. Afterwards you keep the free plan unless you upgrade.`,
    daysLeft: (n: number) => `${n} ${n === 1 ? "day" : "days"} left`,
    school: "Enterprise",
    pilot: "School pilot",
    trial: "Pro trial",
  },
  sv: {
    free: {
      title: "Gratis",
      tagline: "Grunderna, för dig som lärare.",
      unit: "för alltid",
      features: [
        `Upp till ${FREE_CLASS_LIMIT} klasser`,
        "Prov, närvaro och omprov",
        "Resultat och kalender",
        `${FREE_AI_PER_MONTH} omprov skapade med AI per månad`,
      ],
    },
    pro: {
      title: "Pro",
      tagline: "Alla verktyg, för dig som lärare.",
      unit: "per månad",
      features: [
        "Obegränsat antal klasser",
        "Obegränsat antal omprov skapade med AI",
        "Skapa nya prov med AI",
        "Importera dina egna prov från PDF, foto eller text",
        "Rätta prov med AI — du godkänner varje resultat",
      ],
    },
    enterprise: {
      title: "Skola",
      tagline: "För hela skolor och kommuner.",
      unit: "anpassat efter er skola",
      badge: "För skolor",
      features: [
        "Pro för alla lärare",
        "Betalning mot faktura och personuppgiftsbiträdesavtal",
        "Introduktion för er personal",
        "En gemensam arbetsyta med administratörer för skolan",
      ],
      comingSoon: "Koppling till skolans system",
    },
    contactUs: "Enligt offert",
    yearly: (price, monthsFree) => `eller ${price} per år — ${monthsFree} månader gratis`,
    priceNote: `Alla nya konton börjar med ${TRIAL_DAYS} dagar Pro gratis — inget kort behövs. Sedan har du gratisplanen kvar om du inte uppgraderar.`,
    daysLeft: (n) => `${n} ${n === 1 ? "dag" : "dagar"} kvar`,
    school: "Skollicens",
    pilot: "Skolpilot",
    trial: "Gratis Pro",
  },
});

/** The plans, with their texts in the given language. */
export function plans(language: Language): Plan[] {
  const t = messages[language];
  const features = (labels: string[]) => labels.map((label) => ({ label }));
  return [
    { name: "Free", ...t.free, price: 0, features: features(t.free.features) },
    {
      name: "Pro",
      ...t.pro,
      price: PRO_PRICE,
      // Two months free when paying yearly.
      yearlyPrice: PRO_PRICE * 10,
      features: features(t.pro.features),
    },
    {
      name: "Enterprise",
      title: t.enterprise.title,
      tagline: t.enterprise.tagline,
      unit: t.enterprise.unit,
      badge: t.enterprise.badge,
      price: null,
      features: [
        ...features(t.enterprise.features),
        { label: t.enterprise.comingSoon, comingSoon: true },
      ],
    },
  ];
}

export const formatPrice = (sek: number | null, language: Language) =>
  sek == null ? messages[language].contactUs : `${sek.toLocaleString("sv-SE")} kr`;

/** "or 2 290 kr per year — 2 months free", for plans with a yearly option. */
export const yearlyOffer = (plan: Plan, language: Language) =>
  plan.yearlyPrice && plan.price
    ? messages[language].yearly(
        formatPrice(plan.yearlyPrice, language),
        Math.round(12 - plan.yearlyPrice / plan.price),
      )
    : null;

export const priceNote = (language: Language) => messages[language].priceNote;

// --- A teacher's plan -------------------------------------------------------------------

/** What matters about a teacher's school for their plan. */
export interface SchoolTerms {
  /** "pilot", "active" (a paying school) or "ended". */
  status: string;
  pilotEndsAt: string | null;
}

export interface Access {
  /** What the teacher can use right now. */
  level: "pro" | "free";
  /** Why they have Pro: they pay, their school pays or runs a pilot, or their free trial. */
  via: "plan" | "school" | "pilot" | "trial" | null;
  /** Days left of the pilot or trial; null when nothing runs out. */
  daysLeft: number | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const daysUntil = (iso: string, now: Date) =>
  Math.ceil((new Date(iso).getTime() - now.getTime()) / DAY_MS);

/**
 * Pro if the teacher pays for it, belongs to a paying school or a running school pilot, or
 * their free trial is running; otherwise Free. Matches has_pro_access() in the database.
 */
export function accessFor(
  plan: string,
  trialEndsAt: string,
  schools: SchoolTerms[],
  now = new Date(),
): Access {
  if (plan === "pro") return { level: "pro", via: "plan", daysLeft: null };
  if (schools.some((s) => s.status === "active"))
    return { level: "pro", via: "school", daysLeft: null };

  const pilotDays = Math.max(
    0,
    ...schools.map((s) =>
      s.status === "pilot" && s.pilotEndsAt ? daysUntil(s.pilotEndsAt, now) : 0,
    ),
  );
  if (pilotDays > 0) return { level: "pro", via: "pilot", daysLeft: pilotDays };

  const trialDays = daysUntil(trialEndsAt, now);
  if (trialDays > 0) return { level: "pro", via: "trial", daysLeft: trialDays };
  return { level: "free", via: null, daysLeft: null };
}

/** "Pro", "Enterprise", "School pilot · 21 days left", "Pro trial · 12 days left" or "Free". */
export function accessLabel({ via, daysLeft }: Access, language: Language): string {
  const t = messages[language];
  const left = t.daysLeft(daysLeft ?? 0);
  if (via === "plan") return t.pro.title;
  if (via === "school") return t.school;
  if (via === "pilot") return `${t.pilot} · ${left}`;
  if (via === "trial") return `${t.trial} · ${left}`;
  return t.free.title;
}
