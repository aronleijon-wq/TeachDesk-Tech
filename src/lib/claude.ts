// Calling Claude from server functions: one client setup, and API failures turned into
// messages a teacher can act on. Only used on the server (ANTHROPIC_API_KEY stays there).
import Anthropic from "@anthropic-ai/sdk";

/** Runs a request with a Claude client; API failures become messages fit to show a teacher. */
export async function callClaude<T>(request: (client: Anthropic) => Promise<T>): Promise<T> {
  if (!process.env["ANTHROPIC_API_KEY"]) {
    throw new Error(
      "AI is not configured. Add ANTHROPIC_API_KEY to .env.local and restart the server.",
    );
  }
  try {
    return await request(new Anthropic());
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      throw new Error("The Anthropic API key was rejected. Check ANTHROPIC_API_KEY in .env.local.");
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
