// The one place for TeachDesk's plans, prices and plan limits. The public pricing section
// and the in-app Plans page both read from here, so they always agree.
//
// Every new teacher gets Pro free for TRIAL_DAYS, then keeps the free plan unless they
// upgrade. Enterprise is for schools and municipalities: no public price — they contact
// us for a quote.

export const TRIAL_DAYS = 14;
export const FREE_CLASS_LIMIT = 2;
/** Enforced in the database (ai_generations_left) — keep the two in sync. */
export const FREE_AI_PER_MONTH = 3;

export interface Plan {
  name: "Free" | "Pro" | "Enterprise";
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

export const PLANS: Plan[] = [
  {
    name: "Free",
    tagline: "The essentials, for teachers on their own.",
    price: 0,
    unit: "forever",
    features: [
      { label: `Up to ${FREE_CLASS_LIMIT} classes` },
      { label: "Exams, attendance and retakes" },
      { label: "Gradebook and calendar" },
      { label: `${FREE_AI_PER_MONTH} AI-generated retakes per month` },
    ],
  },
  {
    name: "Pro",
    tagline: "Every tool, for teachers on their own.",
    price: 229,
    unit: "per month",
    // Two months free when paying yearly.
    yearlyPrice: 229 * 10,
    features: [
      { label: "Unlimited classes" },
      { label: "Unlimited AI-generated retakes" },
      { label: "Import existing exams from text, PDF or photo" },
      { label: "Rubrics and analytics" },
      { label: "Exports", comingSoon: true },
    ],
  },
  {
    name: "Enterprise",
    tagline: "For whole schools and municipalities.",
    price: null,
    unit: "tailored to your school",
    badge: "For schools",
    features: [
      { label: "Pro for every teacher" },
      { label: "Invoice billing and a data processing agreement" },
      { label: "Onboarding for your staff" },
      { label: "Shared exam library", comingSoon: true },
      { label: "Admin roles and school system integrations", comingSoon: true },
    ],
  },
];

export const formatPrice = (sek: number | null) =>
  sek == null ? "Let's talk" : `${sek.toLocaleString("sv-SE")} kr`;

/** "or 2 290 kr per year — 2 months free", for plans with a yearly option. */
export const yearlyOffer = (plan: Plan) =>
  plan.yearlyPrice && plan.price
    ? `or ${formatPrice(plan.yearlyPrice)} per year — ${Math.round(12 - plan.yearlyPrice / plan.price)} months free`
    : null;

export const PRICE_NOTE = `Every new account starts with ${TRIAL_DAYS} days of Pro for free — no card needed. Afterwards you keep the free plan unless you upgrade.`;

// --- A teacher's plan -------------------------------------------------------------------

export interface Access {
  /** What the teacher can use right now. */
  level: "pro" | "free";
  /** Days left of the free Pro trial, or null if not on a trial. */
  trialDaysLeft: number | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Pro if the teacher pays for it or their trial is still running, otherwise Free. */
export function accessFor(plan: string, trialEndsAt: string, now = new Date()): Access {
  if (plan === "pro") return { level: "pro", trialDaysLeft: null };
  const msLeft = new Date(trialEndsAt).getTime() - now.getTime();
  return msLeft > 0
    ? { level: "pro", trialDaysLeft: Math.ceil(msLeft / DAY_MS) }
    : { level: "free", trialDaysLeft: null };
}

/** "Pro", "Pro trial · 12 days left" or "Free". */
export function accessLabel(access: Access): string {
  if (access.level === "free") return "Free";
  if (access.trialDaysLeft === null) return "Pro";
  return `Pro trial · ${access.trialDaysLeft} ${access.trialDaysLeft === 1 ? "day" : "days"} left`;
}
