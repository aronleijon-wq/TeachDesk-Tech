// The one place for TeachDesk's plans and prices. The public pricing section and the
// in-app Plans page both read from here, so they always agree.
//
// Teacher and Professional are for teachers who pay themselves. Enterprise is for
// schools and municipalities: no public price — they contact us for a quote.

export interface Plan {
  name: "Teacher" | "Professional" | "Enterprise";
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
    name: "Teacher",
    tagline: "The essentials, for teachers on their own.",
    price: 129,
    unit: "per month",
    features: [
      { label: "Exams, classes and students" },
      { label: "Attendance and retakes" },
      { label: "Gradebook and calendar" },
    ],
  },
  {
    name: "Professional",
    tagline: "Every tool, for teachers on their own.",
    price: 229,
    unit: "per month",
    // Two months free when paying yearly.
    yearlyPrice: 229 * 10,
    features: [
      { label: "Everything in Teacher" },
      { label: "AI-generated equivalent retakes" },
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
      { label: "Professional for every teacher" },
      { label: "Invoice billing and a data processing agreement" },
      { label: "Onboarding for your staff" },
      { label: "Shared exam library", comingSoon: true },
      { label: "Admin roles and school system integrations", comingSoon: true },
    ],
  },
];

export const formatPrice = (sek: number | null) => (sek == null ? "Let's talk" : `${sek.toLocaleString("sv-SE")} kr`);

/** "or 2 290 kr per year — 2 months free", for plans with a yearly option. */
export const yearlyOffer = (plan: Plan) =>
  plan.yearlyPrice && plan.price
    ? `or ${formatPrice(plan.yearlyPrice)} per year — ${Math.round(12 - plan.yearlyPrice / plan.price)} months free`
    : null;

export const PRICE_NOTE = "Teacher and Professional are billed monthly (Professional also yearly). Enterprise is quoted per school.";
