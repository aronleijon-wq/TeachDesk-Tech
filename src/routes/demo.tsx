import { createFileRoute } from "@tanstack/react-router";
import { SiteFooter, SiteNav } from "@/components/marketing/site-chrome";
import { DemoForm } from "@/components/marketing/demo-form";

const title = "Book a demo — TeachDesk";
const description = "Get a walkthrough of TeachDesk and see how it can fit into your school's existing workflow.";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://teachdesk.lovable.app/demo" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://teachdesk.lovable.app/demo" }],
  }),
  component: DemoPage,
});

function DemoPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto grid max-w-6xl gap-12 px-5 py-16 md:py-24 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <p className="eyebrow">Book a demo</p>
          <h1 className="display-lg mt-3 text-balance">See what TeachDesk could look like at your school.</h1>
          <p className="mt-5 text-lg text-muted-foreground">Get a walkthrough of TeachDesk and see how it can fit into your existing workflow.</p>
          <ul className="mt-10 space-y-4 border-t border-border pt-8 text-sm">
            {["A 30-minute walkthrough of the teacher workspace", "How exams, retakes and grading work end to end", "How TeachDesk fits alongside your current school systems", "Questions on privacy, access and rollout"].map((t) => (
              <li key={t} className="flex gap-3"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />{t}</li>
            ))}
          </ul>
        </div>
        <DemoForm />
      </main>
      <SiteFooter />
    </div>
  );
}
