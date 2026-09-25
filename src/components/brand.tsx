import { cn } from "@/lib/utils";

/** Brand colours are fixed (not theme tokens) so the logo looks the same everywhere. */
export const BRAND_BLUE = "#2E56A6";
export const BRAND_BLUE_LIGHT = "#A9C0EE";

/** The TeachDesk mark: a T drawn as a desk, with a book on it. Keep in sync with public/logo.svg. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("size-7 shrink-0", className)} aria-hidden>
      <rect width="64" height="64" rx="14" fill={BRAND_BLUE} />
      <rect x="16" y="15" width="11" height="9" rx="1.5" fill={BRAND_BLUE_LIGHT} />
      <rect x="12" y="24" width="40" height="7" rx="2" fill="#FFFFFF" />
      <rect x="28.5" y="31" width="7" height="19" rx="1.5" fill="#FFFFFF" />
    </svg>
  );
}

/** Mark + "TeachDesk" wordmark, with "Desk" in brand blue. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2 font-semibold tracking-tight", className)}>
      <LogoMark />
      <span className="text-[15px]">
        Teach<span className="text-primary">Desk</span>
      </span>
    </span>
  );
}
