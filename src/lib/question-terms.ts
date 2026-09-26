import { defineMessages } from "./messages";
import type { Question } from "./types";

/** What question types and difficulties are called, wherever questions are shown. */
export const questionTerms = defineMessages({
  en: {
    types: {
      "short-answer": "Short answer",
      "open-ended": "Open answer",
      calculation: "Calculation",
      "multiple-choice": "Multiple choice",
    } satisfies Record<Question["type"], string>,
    difficulties: {
      Easy: "Easy",
      Medium: "Medium",
      Hard: "Hard",
    } satisfies Record<Question["difficulty"], string>,
  },
  sv: {
    types: {
      "short-answer": "Kortsvar",
      "open-ended": "Öppen fråga",
      calculation: "Beräkning",
      "multiple-choice": "Flerval",
    },
    difficulties: { Easy: "Lätt", Medium: "Medel", Hard: "Svår" },
  },
});
