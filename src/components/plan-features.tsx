import { Check } from "lucide-react";
import type { Plan } from "@/lib/pricing";
import { cn } from "@/lib/utils";

/** A plan's feature list; features that aren't built yet are marked "Coming soon". */
export function PlanFeatures({ plan, className }: { plan: Plan; className?: string }) {
  return (
    <ul className={cn("space-y-2.5 text-sm", className)}>
      {plan.features.map((f) => (
        <li key={f.label} className={cn("flex gap-2.5", f.comingSoon && "text-muted-foreground")}>
          <Check className={cn("mt-0.5 size-4 shrink-0", f.comingSoon ? "text-muted-foreground/60" : "text-primary")} />
          <span>
            {f.label}
            {f.comingSoon && (
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                Coming soon
              </span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
