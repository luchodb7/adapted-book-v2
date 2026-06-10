import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpenText, LayoutDashboard, LogOut, Settings, Users } from "lucide-react";
import { auth } from "@/modules/auth/infrastructure/authjs";
import { signOutAction } from "@/modules/auth/presentation/server-actions/auth-actions";
import { Button } from "@/components/ui/button";

interface AppLayoutProps {
  children: React.ReactNode;
}

const NAV = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/stories", label: "Stories", icon: BookOpenText },
  { href: "/app/members", label: "Members", icon: Users },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

export default async function AppLayout({ children }: AppLayoutProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container-app flex h-14 items-center justify-between gap-4">
          <Link href="/app" className="flex items-center gap-2 font-semibold">
            <BookOpenText className="size-5 text-primary" aria-hidden /> Adapted Books
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {session.user.name ?? session.user.email}
            </span>
            <form action={signOutAction}>
              <Button variant="ghost" size="sm" type="submit" aria-label="Sign out">
                <LogOut className="size-4" /> Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="container-app grid gap-6 py-6 md:grid-cols-[220px_1fr]">
        <aside aria-label="Main navigation">
          <nav className="sticky top-20 flex flex-col gap-1" aria-label="Sections">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <item.icon className="size-4" aria-hidden />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main id="main-content" tabIndex={-1} className="min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
