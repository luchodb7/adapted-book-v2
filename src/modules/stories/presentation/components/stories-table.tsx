"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Copy, FileDown, Pencil, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  deleteStoryAction,
  duplicateStoryAction,
} from "@/modules/stories/presentation/server-actions/story-actions";

interface StoryRow {
  id: string;
  title: string;
  status: string;
  pages: unknown[];
  updatedAt: string | Date;
}

interface Props {
  items: StoryRow[];
}

export function StoriesTable({ items }: Props) {
  const [pending, startTransition] = useTransition();

  if (items.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-12 text-center">
        <p className="text-base font-medium">No stories match your filters.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try adjusting your search or create a new story.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full text-sm">
        <caption className="sr-only">Stories in your organization</caption>
        <thead className="border-b bg-secondary/50">
          <tr>
            <th scope="col" className="px-4 py-3 text-left font-medium">Title</th>
            <th scope="col" className="px-4 py-3 text-left font-medium">Status</th>
            <th scope="col" className="px-4 py-3 text-left font-medium">Pages</th>
            <th scope="col" className="px-4 py-3 text-left font-medium">Updated</th>
            <th scope="col" className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {items.map((s) => (
            <tr key={s.id}>
              <td className="px-4 py-3 font-medium">
                <Link
                  href={`/app/stories/${s.id}/edit`}
                  className="text-foreground underline-offset-4 hover:underline"
                >
                  {s.title}
                </Link>
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex rounded-full bg-secondary px-2 py-0.5 text-xs">
                  {s.status.toLowerCase().replace("_", " ")}
                </span>
              </td>
              <td className="px-4 py-3">{s.pages.length}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {new Date(s.updatedAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <Button asChild size="icon" variant="ghost" aria-label={`Edit ${s.title}`}>
                    <Link href={`/app/stories/${s.id}/edit`}>
                      <Pencil className="size-4" />
                    </Link>
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Duplicate ${s.title}`}
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        const res = await duplicateStoryAction(s.id);
                        if (res.status === "success") toast.success(res.message ?? "Duplicated");
                        else toast.error(res.message ?? "Failed");
                      })
                    }
                  >
                    <Copy className="size-4" />
                  </Button>
                  <Button asChild size="icon" variant="ghost" aria-label={`Download ${s.title} as PDF`}>
                    <a href={`/api/stories/${s.id}/export?format=pdf-a4-portrait`} download>
                      <FileDown className="size-4" />
                    </a>
                  </Button>
                  <Button asChild size="icon" variant="ghost" aria-label={`Print ${s.title}`}>
                    <a href={`/api/stories/${s.id}/export?format=pdf-a4-portrait`} target="_blank" rel="noreferrer">
                      <Printer className="size-4" />
                    </a>
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Delete ${s.title}`}
                    disabled={pending}
                    onClick={() => {
                      if (!confirm(`Delete "${s.title}"? This cannot be undone.`)) return;
                      startTransition(async () => {
                        const res = await deleteStoryAction(s.id);
                        if (res.status === "success") toast.success(res.message ?? "Deleted");
                        else toast.error(res.message ?? "Failed");
                      });
                    }}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
