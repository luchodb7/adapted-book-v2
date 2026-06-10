import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { authorize } from "@/shared/tenant/guards";
import { getContainer } from "@/core/di/composition-root";
import { StoryRepositoryToken } from "@/core/di/tokens";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StoriesTable } from "@/modules/stories/presentation/components/stories-table";

interface PageProps {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}

export default async function StoriesPage({ searchParams }: PageProps) {
  const ctx = await authorize("VIEWER");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const limit = 24;
  const offset = (page - 1) * limit;

  const c = getContainer();
  const stories = c.resolve(StoryRepositoryToken);
  const result = await stories.list({
    organizationId: ctx.organizationId,
    search: sp.q,
    status:
      sp.status && ["DRAFT", "IN_REVIEW", "PUBLISHED", "ARCHIVED"].includes(sp.status)
        ? (sp.status as "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "ARCHIVED")
        : undefined,
    limit,
    offset,
    loadPages: false,
  });

  const totalPages = Math.max(1, Math.ceil(result.total / limit));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stories</h1>
          <p className="text-sm text-muted-foreground">
            Browse, search and manage your organization's library.
          </p>
        </div>
        <Button asChild>
          <Link href="/app/stories/new">
            <Plus className="size-4" /> New story
          </Link>
        </Button>
      </div>

      <form className="flex flex-wrap items-end gap-3" role="search">
        <div className="grow space-y-2">
          <label htmlFor="q" className="text-sm font-medium">
            Search
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              id="q"
              name="q"
              defaultValue={sp.q ?? ""}
              placeholder="Search by title or description…"
              className="pl-9"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="status" className="text-sm font-medium">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={sp.status ?? ""}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">All</option>
            <option value="DRAFT">Draft</option>
            <option value="IN_REVIEW">In review</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
        <Button type="submit" variant="secondary">
          Apply filters
        </Button>
      </form>

      <StoriesTable
        items={result.items.map((s) => {
          const json = s.toJSON();
          return {
            id: json.id,
            title: json.title,
            status: json.status,
            pages: json.pages as unknown[],
            updatedAt: json.updatedAt instanceof Date ? json.updatedAt.toISOString() : json.updatedAt,
          };
        })}
      />

      {totalPages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} · {result.total} stories
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Button variant="outline" asChild>
                <Link href={`/app/stories?page=${page - 1}${sp.q ? `&q=${sp.q}` : ""}`}>
                  Previous
                </Link>
              </Button>
            )}
            {page < totalPages && (
              <Button variant="outline" asChild>
                <Link href={`/app/stories?page=${page + 1}${sp.q ? `&q=${sp.q}` : ""}`}>Next</Link>
              </Button>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
