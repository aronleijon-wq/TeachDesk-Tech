// Calling Claude from server functions: one client setup, and API failures turned into
// messages a teacher can act on. Only used on the server, where ANTHROPIC_API_KEY is set:
// in .env.local when running locally, and in Lovable Cloud's secrets on the live site.
import Anthropic from "@anthropic-ai/sdk";

/** Runs a request with a Claude client; API failures become messages fit to show a teacher. */
export async function callClaude<T>(request: (client: Anthropic) => Promise<T>): Promise<T> {
  if (!process.env["ANTHROPIC_API_KEY"]) {
    console.error("ANTHROPIC_API_KEY is not set, so AI features are off.");
    throw new Error("AI isn't set up on this site yet. Please contact support.");
  }
  try {
    return await request(new Anthropic());
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      console.error("Anthropic rejected ANTHROPIC_API_KEY.", err);
      throw new Error("AI isn't working right now. Please contact support.");
    }
    if (err instanceof Anthropic.RateLimitError) {
      throw new Error("AI is busy right now. Please try again in a moment.");
    }
    if (err instanceof Anthropic.APIError) {
      throw new Error(`AI request failed (${err.status ?? "network error"}). Please try again.`);
    }
    throw err;
  }
}
