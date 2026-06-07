import Link from "next/link";
import { BookOpenText } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main-content" className="grid min-h-screen lg:grid-cols-2">
      <section
        aria-labelledby="auth-marketing-title"
        className="hidden bg-gradient-to-br from-primary via-primary/80 to-accent p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between"
      >
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
          <BookOpenText className="size-6" aria-hidden />
          Adapted Books
        </Link>
        <div>
          <h2 id="auth-marketing-title" className="text-4xl font-bold leading-tight">
            Accessible stories, every classroom, every family.
          </h2>
          <p className="mt-4 max-w-md text-base opacity-90">
            Pictograms by ARASAAC. Built with families, teachers and therapists.
          </p>
        </div>
        <p className="text-sm opacity-75">© {new Date().getFullYear()} Adapted Books</p>
      </section>
      <section className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">{children}</div>
      </section>
    </main>
  );
}
