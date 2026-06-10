import Link from "next/link";
import { Plus } from "lucide-react";
import { authorize } from "@/shared/tenant/guards";
import { getContainer } from "@/core/di/composition-root";
import { StoryRepositoryToken } from "@/core/di/tokens";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const ctx = await authorize("VIEWER");
  const c = getContainer();
  const stories = c.resolve(StoryRepositoryToken);
  const recent = await stories.list({
    organizationId: ctx.organizationId,
    limit: 6,
    sortBy: "updatedAt",
    sortDir: "desc",
  });

  const totals = {
    stories: recent.total,
    drafts: recent.items.filter((s) => s.status === "DRAFT").length,
    pages: recent.items.reduce((sum, s) => sum + s.pages.length, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            Here's what's happening in your organization.
          </p>
        </div>
        <Button asChild>
          <Link href="/app/stories/new">
            <Plus className="size-4" /> New story
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Stories" value={totals.stories} />
        <Stat label="Drafts" value={totals.drafts} />
        <Stat label="Pages created" value={totals.pages} />
      </div>

      <section aria-labelledby="recent-stories-heading">
        <h2 id="recent-stories-heading" className="mb-3 text-lg font-semibold">
          Recently updated
        </h2>
        {recent.items.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CardTitle className="text-base">No stories yet</CardTitle>
              <CardDescription className="mt-1">
                Create your first social story in seconds.
              </CardDescription>
              <Button asChild className="mt-4">
                <Link href="/app/stories/new">Create your first story</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recent.items.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/app/stories/${s.id}/edit`}
                  className="block rounded-lg border bg-card p-4 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <p className="line-clamp-1 font-medium">{s.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.pages.length} pages · {s.status.toLowerCase().replace("_", " ")}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-3xl font-bold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
