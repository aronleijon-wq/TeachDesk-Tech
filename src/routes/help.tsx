import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/primitives";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help — Classflow" },
      { name: "description", content: "How the Classflow teaching workflow works, from exam creation to retakes and follow-up." },
      { property: "og:title", content: "Help — Classflow" },
      { property: "og:description", content: "How the Classflow workflow works." },
    ],
  }),
  component: HelpPage,
});

const steps = [
  ["Create an exam", "Five steps: basics, source, assessment settings, review and publish."],
  ["Mark attendance", "Absent students enter the retake queue automatically."],
  ["Generate an equivalent version", "Same skills and points, new numbers and contexts. You approve it before use."],
  ["Schedule retakes", "Pick date, time and room; the retake version is assigned automatically."],
  ["Grade", "Objective questions score automatically; open answers get a suggestion you confirm."],
  ["Follow up", "The dashboard surfaces missing work and students who need attention."],
];

function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Help" subtitle="The Classflow workflow, end to end." />
      <Panel>
        <ol className="space-y-4">
          {steps.map(([title, body], i) => (
            <li key={title} className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                {i + 1}
              </span>
              <span>
                <span className="block text-sm font-medium">{title}</span>
                <span className="block text-sm text-muted-foreground">{body}</span>
              </span>
            </li>
          ))}
        </ol>
      </Panel>
    </div>
  );
}
