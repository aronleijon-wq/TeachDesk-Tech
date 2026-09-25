import type { ReactNode } from "react";
import { SiteFooter, SiteNav } from "@/components/marketing/site-chrome";
import { LEGAL } from "@/lib/legal";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto max-w-3xl px-5 py-16 md:py-24">
        <h1 className="display-lg">{title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">Last updated {LEGAL.lastUpdated}</p>
        <div className="mt-10 space-y-8 text-[15px] leading-7 [&_a]:text-primary [&_a]:underline [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1">
          {children}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export function ContactEmail() {
  return <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>;
}
