import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  ClipboardCheck,
  CreditCard,
  Mail,
  Rocket,
  School,
  Search,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { AskAi } from "@/components/ask-ai";
import { Panel } from "@/components/primitives";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  HELP_CATEGORIES,
  SUPPORT_EMAIL,
  searchHelp,
  type HelpArticle,
  type HelpCategory,
} from "@/lib/help-articles";

export const Route = createFileRoute("/app/help")({
  head: () => ({
    meta: [
      { title: "Help — TeachDesk" },
      {
        name: "description",
        content: "Answers about exams, retakes, grading, schools and plans in TeachDesk.",
      },
      { property: "og:title", content: "Help — TeachDesk" },
      { property: "og:description", content: "Answers about using TeachDesk." },
    ],
  }),
  component: HelpPage,
});

const categoryIcons: Record<string, LucideIcon> = {
  "getting-started": Rocket,
  exams: BookOpen,
  grading: ClipboardCheck,
  students: Users,
  schools: School,
  account: CreditCard,
};

function HelpPage() {
  const [query, setQuery] = useState("");
  const searching = query.trim().length > 0;
  const results = searchHelp(query);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-xl border border-border bg-primary-soft/40 px-6 py-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">How can we help?</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search the help articles, or ask TeachDesk AI.
        </p>
        <div className="relative mx-auto mt-5 max-w-xl">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search, e.g. “retake”"
            aria-label="Search help"
            className="h-11 bg-background pl-9"
          />
        </div>
      </div>

      {searching ? (
        <Panel title={results.length === 1 ? "1 article" : `${results.length} articles`}>
          {results.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing matches “{query.trim()}”. Try another word, or ask TeachDesk AI below.
            </p>
          ) : (
            <Accordion type="multiple">
              {results.map(({ category, article }) => (
                <Article key={article.id} article={article} category={category.title} />
              ))}
            </Accordion>
          )}
        </Panel>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {HELP_CATEGORIES.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      )}

      <AskAi />

      {!searching &&
        HELP_CATEGORIES.map((category) => (
          <section key={category.id} id={category.id} className="scroll-mt-20">
            <Panel title={category.title} description={category.description}>
              <Accordion type="multiple">
                {category.articles.map((article) => (
                  <Article key={article.id} article={article} />
                ))}
              </Accordion>
            </Panel>
          </section>
        ))}

      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">Still need help?</p>
            <p className="text-sm text-muted-foreground">
              Email us and we'll get back to you. Read how we handle data in the{" "}
              <Link to="/privacy" className="text-primary hover:underline">
                privacy policy
              </Link>
              .
            </p>
          </div>
          <Button asChild variant="outline">
            <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("TeachDesk help")}`}>
              <Mail className="size-4" /> {SUPPORT_EMAIL}
            </a>
          </Button>
        </div>
      </Panel>
    </div>
  );
}

function CategoryCard({ category }: { category: HelpCategory }) {
  const Icon = categoryIcons[category.id] ?? BookOpen;
  return (
    <button
      type="button"
      onClick={() =>
        document.getElementById(category.id)?.scrollIntoView({ behavior: "smooth", block: "start" })
      }
      className="rounded-lg border border-border bg-surface p-4 text-left shadow-card transition-colors hover:border-primary/40"
    >
      <Icon className="size-5 text-primary" />
      <p className="mt-3 text-sm font-semibold">{category.title}</p>
      <p className="mt-1 hidden text-sm text-muted-foreground sm:block">{category.description}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        {category.articles.length} {category.articles.length === 1 ? "article" : "articles"}
      </p>
    </button>
  );
}

function Article({ article, category }: { article: HelpArticle; category?: string }) {
  return (
    <AccordionItem value={article.id}>
      <AccordionTrigger className="text-left text-sm">
        <span>
          {category && <span className="block text-xs text-muted-foreground">{category}</span>}
          {article.title}
        </span>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p className="text-foreground">{article.summary}</p>
          {article.steps && (
            <ol className="list-decimal space-y-1 pl-5">
              {article.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          )}
          {article.details?.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
