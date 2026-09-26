// The interface language: Swedish by default, or English. The choice is kept in a cookie on
// this device, so pages render in it on the server too, and it reaches components through the
// router context. Each component keeps its texts in both languages next to its code:
//
//   const messages = defineMessages({
//     en: { title: "Exams", count: (n: number) => `${n} exams` },
//     sv: { title: "Prov", count: (n) => `${n} prov` },
//   });
//   const t = useMessages(messages);
import { createIsomorphicFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { useRouteContext, useRouter } from "@tanstack/react-router";
import { formatDate, type Language } from "./messages";

export * from "./messages";

const COOKIE = "teachdesk-language";

const toLanguage = (value: string | undefined): Language => (value === "en" ? "en" : "sv");

/** The language chosen on this device (Swedish unless English was chosen). */
export const readLanguage = createIsomorphicFn()
  .server(() => toLanguage(getCookie(COOKIE)))
  .client(() => toLanguage(document.cookie.match(/(?:^|; )teachdesk-language=([^;]*)/)?.[1]));

/** The chosen language, a way to change it, and dates written in it. */
export function useLanguage() {
  const router = useRouter();
  const language = useRouteContext({
    from: "__root__",
    select: (context) => context.language,
  });
  return {
    language,
    setLanguage: (next: Language) => {
      document.cookie = `${COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
      document.documentElement.lang = next;
      void router.invalidate();
    },
    formatDate: (iso: string) => formatDate(iso, language),
  };
}

/** A component's texts in the chosen language. */
export function useMessages<T>(messages: Record<Language, T>): T {
  return messages[useLanguage().language];
}
