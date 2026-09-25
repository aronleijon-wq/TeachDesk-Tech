// The one place for TeachDesk's plans and prices. The public pricing section and the
// in-app Plans page both read from here, so they always agree.

export interface Plan {
  name: "Teacher" | "Professional" | "School";
  tagline: string;
  /** Monthly price in SEK. */
  price: number;
  unit: string;
  features: { label: string; comingSoon?: boolean }[];
  /** Highlighted on the public pricing section. */
  featured?: boolean;
}

export const PLANS: Plan[] = [
  {
    name: "Teacher",
    tagline: "For individual teachers.",
    price: 129,
    unit: "per month",
    features: [
      { label: "Unlimited exams and classes" },
      { label: "Attendance and retakes" },
      { label: "Gradebook" },
      { label: "AI-generated equivalent retakes" },
    ],
  },
  {
    name: "Professional",
    tagline: "For teachers who want every tool.",
    price: 249,
    unit: "per month",
    features: [
      { label: "Everything in Teacher" },
      { label: "Import existing exams from text, PDF or photo" },
      { label: "Rubrics and analytics" },
      { label: "Exports", comingSoon: true },
    ],
  },
  {
    name: "School",
    tagline: "For departments and whole schools.",
    price: 89,
    unit: "per teacher / month",
    featured: true,
    features: [
      { label: "Everything in Professional, for every teacher" },
      { label: "Invoice billing" },
      { label: "Shared exam library", comingSoon: true },
      { label: "Admin roles and school system integrations", comingSoon: true },
    ],
  },
];

export const formatPrice = (sek: number) => `${sek} kr`;

export const PRICE_NOTE = "All plans are billed monthly.";
