// Lets the Node test runner load project files the way Vite does: "@/…" means "src/…",
// and imports without an extension find the .ts file.
const src = new URL("../src/", import.meta.url);

export async function resolve(specifier, context, next) {
  const target = specifier.startsWith("@/") ? new URL(specifier.slice(2), src).href : specifier;
  const local = target.startsWith(".") || target.startsWith("file:");
  if (local && !/\.[cm]?[jt]sx?$/.test(target)) {
    for (const extension of [".ts", ".tsx"]) {
      try {
        return await next(target + extension, context);
      } catch {
        // Try the next extension.
      }
    }
  }
  return next(target, context);
}
