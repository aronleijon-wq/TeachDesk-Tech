// Calling Claude from server functions: one client setup, and API failures turned into
// messages a teacher can act on. Only used on the server, where ANTHROPIC_API_KEY is set:
// in .env.local when running locally, and in Lovable Cloud's secrets on the live site.
import Anthropic from "@anthropic-ai/sdk";
import { defineMessages, readLanguage } from "./i18n";

const messages = defineMessages({
  en: {
    notSetUp: "AI isn't set up on this site yet. Please contact support.",
    notWorking: "AI isn't working right now. Please contact support.",
    busy: "AI is busy right now. Please try again in a moment.",
    failed: (status: string) => `AI request failed (${status}). Please try again.`,
    networkError: "network error",
  },
  sv: {
    notSetUp: "AI är inte igång på den här webbplatsen än. Kontakta supporten.",
    notWorking: "AI fungerar inte just nu. Kontakta supporten.",
    busy: "AI är upptagen just nu. Försök igen om en stund.",
    failed: (status) => `AI-förfrågan misslyckades (${status}). Försök igen.`,
    networkError: "nätverksfel",
  },
});

/** Runs a request with a Claude client; API failures become messages fit to show a teacher. */
export async function callClaude<T>(request: (client: Anthropic) => Promise<T>): Promise<T> {
  const t = messages[readLanguage()];
  if (!process.env["ANTHROPIC_API_KEY"]) {
    console.error("ANTHROPIC_API_KEY is not set, so AI features are off.");
    throw new Error(t.notSetUp);
  }
  try {
    return await request(new Anthropic());
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      console.error("Anthropic rejected ANTHROPIC_API_KEY.", err);
      throw new Error(t.notWorking);
    }
    if (err instanceof Anthropic.RateLimitError) throw new Error(t.busy);
    if (err instanceof Anthropic.APIError) {
      throw new Error(t.failed(String(err.status ?? t.networkError)));
    }
    throw err;
  }
}
