import { formatDate, StatusPill } from "@/components/primitives";
import type { StudentStats } from "@/lib/workspace";

/** What a student still has to do — retakes and missing work — or "Up to date". */
export function FollowUp({ stats }: { stats: StudentStats }) {
  if (stats.upToDate) return <StatusPill tone="success">Up to date</StatusPill>;

  const toSchedule = stats.retakesToSchedule;
  const [nextRetake, ...laterRetakes] = stats.retakeDates;
  return (
    <span className="inline-flex flex-wrap justify-end gap-1">
      {toSchedule > 0 && (
        <StatusPill tone="warning">
          {toSchedule === 1 ? "Needs a retake" : `Needs ${toSchedule} retakes`}
        </StatusPill>
      )}
      {nextRetake && (
        <StatusPill tone="primary">
          {laterRetakes.length > 0
            ? `${laterRetakes.length + 1} retakes booked`
            : `Retake ${formatDate(nextRetake)}`}
        </StatusPill>
      )}
      {stats.missingWork > 0 && <StatusPill tone="warning">{stats.missingWork} missing</StatusPill>}
    </span>
  );
}
