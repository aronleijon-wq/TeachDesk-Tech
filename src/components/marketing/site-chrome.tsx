import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const NAV = [
  { href: "/#product", label: "Product" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#teachers", label: "For teachers" },
  { href: "/#schools", label: "For schools" },
  { href: "/#integrations", label: "Integrations" },
  { href: "/#pricing", label: "Pricing" },
];

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2 font-semibold tracking-tight", className)} aria-label="Teachdesk home">
      <span className="grid size-7 place-items-center rounded-md bg-foreground text-background">
        <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
          <path d="M2 3h12v2.5H9.25V13h-2.5V5.5H2z" fill="currentColor" />
        </svg>
      </span>
      <span className="text-[15px]">Teachdesk</span>
    </Link>
  );
}

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-colors duration-300",
        scrolled || open ? "border-border bg-background/85 backdrop-blur-md" : "border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-5">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
              {n.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto hidden items-center gap-2 lg:flex">
          <Button asChild variant="ghost" size="sm">
            <Link to="/app">Log in</Link>
          </Button>
          <Button asChild size="sm" className="bg-foreground text-background hover:bg-foreground/90">
            <Link to="/demo">Book a demo</Link>
          </Button>
        </div>
        <button className="ml-auto grid size-9 place-items-center rounded-md lg:hidden" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu" aria-expanded={open}>
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-border px-5 pb-6 pt-3 lg:hidden">
          <nav className="flex flex-col" aria-label="Mobile">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} onClick={() => setOpen(false)} className="border-b border-border py-3 text-base">
                {n.label}
              </a>
            ))}
          </nav>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <Button asChild variant="outline"><Link to="/app">Log in</Link></Button>
            <Button asChild className="bg-foreground text-background hover:bg-foreground/90"><Link to="/demo">Book a demo</Link></Button>
          </div>
        </div>
      )}
    </header>
  );
}

const FOOTER = [
  { title: "Product", links: [["Product", "/#product"], ["Features", "/#features"], ["How it works", "/#how-it-works"], ["Integrations", "/#integrations"]] },
  { title: "Company", links: [["About", "/#schools"], ["Contact", "/demo"], ["Book a demo", "/demo"]] },
  { title: "Resources", links: [["Help", "/app/help"], ["Security", "/#security"], ["Documentation", "/app/help"]] },
  { title: "Legal", links: [["Privacy", "/#security"], ["Terms", "/#security"]] },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">The workspace for the work behind teaching.</p>
        </div>
        {FOOTER.map((col) => (
          <div key={col.title}>
            <p className="text-sm font-medium">{col.title}</p>
            <ul className="mt-4 space-y-2.5">
              {col.links.map(([label, href]) => (
                <li key={label}>
                  <a href={href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">{label}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto flex max-w-6xl flex-col justify-between gap-2 border-t border-border px-5 py-6 text-xs text-muted-foreground sm:flex-row">
        <span>© {new Date().getFullYear()} Teachdesk</span>
        <span>Made in Sweden</span>
      </div>
    </footer>
  );
}

export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={cn("reveal", visible && "is-visible", className)} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export function useInView<T extends Element>(threshold = 0.3) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(!!e?.isIntersecting), { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
}

export function SectionHeading({ eyebrow, title, children, center }: { eyebrow?: string; title: string; children?: ReactNode; center?: boolean }) {
  return (
    <Reveal className={cn("max-w-2xl", center && "mx-auto text-center")}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className="display-lg mt-3 text-balance">{title}</h2>
      {children && <p className="mt-5 text-lg text-pretty text-muted-foreground">{children}</p>}
    </Reveal>
  );
}
