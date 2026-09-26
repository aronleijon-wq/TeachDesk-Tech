import { StatusPill } from "@/components/primitives";
import { defineMessages, useLanguage, useMessages } from "@/lib/i18n";
import type { StudentStats } from "@/lib/workspace";

const messages = defineMessages({
  en: {
    upToDate: "Up to date",
    needsRetakes: (n: number) => (n === 1 ? "Needs a retake" : `Needs ${n} retakes`),
    retakesBooked: (n: number) => `${n} retakes booked`,
    retakeOn: (date: string) => `Retake ${date}`,
    missing: (n: number) => `${n} missing`,
  },
  sv: {
    upToDate: "I fas",
    needsRetakes: (n) => (n === 1 ? "Behöver omprov" : `Behöver ${n} omprov`),
    retakesBooked: (n) => `${n} omprov bokade`,
    retakeOn: (date) => `Omprov ${date}`,
    missing: (n) => `${n} saknas`,
  },
});

/** What a student still has to do — retakes and missing work — or "Up to date". */
export function FollowUp({ stats }: { stats: StudentStats }) {
  const t = useMessages(messages);
  const { formatDate } = useLanguage();
  if (stats.upToDate) return <StatusPill tone="success">{t.upToDate}</StatusPill>;

  const toSchedule = stats.retakesToSchedule;
  const [nextRetake, ...laterRetakes] = stats.retakeDates;
  return (
    <span className="inline-flex flex-wrap justify-end gap-1">
      {toSchedule > 0 && <StatusPill tone="warning">{t.needsRetakes(toSchedule)}</StatusPill>}
      {nextRetake && (
        <StatusPill tone="primary">
          {laterRetakes.length > 0
            ? t.retakesBooked(laterRetakes.length + 1)
            : t.retakeOn(formatDate(nextRetake))}
        </StatusPill>
      )}
      {stats.missingWork > 0 && (
        <StatusPill tone="warning">{t.missing(stats.missingWork)}</StatusPill>
      )}
    </span>
  );
}
