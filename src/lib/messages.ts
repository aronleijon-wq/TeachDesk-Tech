// Texts in Swedish and English, and dates written in either. Kept free of React so lib code,
// server functions and tests can use it; components get the chosen language from lib/i18n.

export type Language = "sv" | "en";

export const LANGUAGE_NAMES: Record<Language, string> = { sv: "Svenska", en: "English" };

/** Texts in both languages. The Swedish ones must have the same shape as the English. */
export function defineMessages<T>(messages: { en: T; sv: NoInfer<T> }): Record<Language, T> {
  return messages;
}

const locales: Record<Language, string> = { sv: "sv-SE", en: "en-GB" };

/** A date like "9 okt. 2026" or "9 Oct 2026". */
export function formatDate(iso: string, language: Language) {
  if (!iso || iso === "today") return language === "sv" ? "Idag" : "Today";
  return new Date(iso).toLocaleDateString(locales[language], {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** A date written out, like "9 oktober 2026", or with the weekday: "fredag 9 oktober". */
export function formatLongDate(date: string | Date, language: Language, withWeekday = false) {
  return new Date(date).toLocaleDateString(
    locales[language],
    withWeekday
      ? { weekday: "long", day: "numeric", month: "long" }
      : { day: "numeric", month: "long", year: "numeric" },
  );
}
