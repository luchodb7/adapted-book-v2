import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BookOpenText, Sparkles, Users2, FileDown, ShieldCheck, Languages } from "lucide-react";

export default function HomePage() {
  return (
    <main id="main-content" className="min-h-screen">
      <header className="border-b">
        <div className="container-app flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
            <BookOpenText className="size-6 text-primary" aria-hidden />
            Adapted Books
          </Link>
          <nav aria-label="Primary" className="flex items-center gap-2">
            <Link
              href="/login"
              className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
            <Button asChild>
              <Link href="/register">Get started</Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="container-app py-16 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
            <Sparkles className="size-3.5" aria-hidden /> Powered by ARASAAC pictograms
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Accessible social stories,{" "}
            <span className="text-primary">made easy.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Adapt any text into a beautiful social story with pictograms, share it with families
            and classrooms, and print or export in seconds. Built for special education
            professionals, therapists and inclusive schools.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/register">Create your free organization</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>

        <ul className="mx-auto mt-20 grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Feature icon={<BookOpenText className="size-5" />} title="Adapt any text">
            Paste a paragraph; we'll split it into pages and pair each sentence with a
            pictogram automatically.
          </Feature>
          <Feature icon={<Users2 className="size-5" />} title="Multi-tenant by design">
            Built for schools, therapy centers and organizations. Roles, audit logs, and
            per-organization libraries — all included.
          </Feature>
          <Feature icon={<FileDown className="size-5" />} title="Print &amp; export">
            One-click PDF (portrait or landscape), ZIP archive of pages, and direct printing
            from your browser.
          </Feature>
          <Feature icon={<ShieldCheck className="size-5" />} title="Accessible from the start">
            WCAG 2.1 AA. Keyboard navigation, screen-reader support, high-contrast mode and
            adjustable text size.
          </Feature>
          <Feature icon={<Sparkles className="size-5" />} title="AI-ready">
            A pluggable AI layer ready for OpenAI, Claude, Gemini, Azure, Ollama and local
            models — without any vendor lock-in.
          </Feature>
          <Feature icon={<Languages className="size-5" />} title="Multilingual">
            ARASAAC supports dozens of languages. Adapted Books embraces every locale your
            community speaks.
          </Feature>
        </ul>
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>
          &copy; {new Date().getFullYear()} Adapted Books. Built with care for accessibility.
        </p>
      </footer>
    </main>
  );
}

function Feature({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="mb-3 inline-flex items-center gap-2 text-primary">
        {icon}
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      <p className="text-sm text-muted-foreground">{children}</p>
    </li>
  );
}
