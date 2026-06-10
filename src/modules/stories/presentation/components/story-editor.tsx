"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { nanoid } from "nanoid";
import { ArrowDown, ArrowUp, FileDown, ImagePlus, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils/cn";
import { updateStoryAction } from "@/modules/stories/presentation/server-actions/story-actions";

export interface EditorPictogram {
  id: string;
  order: number;
  pictogramUrl: string;
  pictogramKeyword: string | null;
  pictogramId: string | null;
}

export interface EditorPage {
  id: string;
  order: number;
  text: string;
  pictograms: EditorPictogram[];
  backgroundColor: string | null;
  textColor: string | null;
  fontSize: number | null;
  layout: "text-top" | "text-bottom" | "text-left" | "text-right" | "text-only" | "pictogram-only";
  notes: string | null;
}

export interface StoryEditorProps {
  storyId: string;
  initialTitle: string;
  initialPages: EditorPage[];
  initialStatus: "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "ARCHIVED";
}

export function StoryEditor({ storyId, initialTitle, initialPages, initialStatus }: StoryEditorProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = React.useState(initialTitle);
  const [pages, setPages] = React.useState<EditorPage[]>(initialPages);
  const [selectedId, setSelectedId] = React.useState<string | null>(initialPages[0]?.id ?? null);
  const [status, setStatus] = React.useState(initialStatus);
  const [dirty, setDirty] = React.useState(false);

  const selected = pages.find((p) => p.id === selectedId) ?? null;

  const updatePage = (id: string, patch: Partial<EditorPage>) => {
    setPages((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    setDirty(true);
  };

  const movePage = (id: string, dir: -1 | 1) => {
    setPages((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      const newIdx = idx + dir;
      if (idx < 0 || newIdx < 0 || newIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx]!, next[idx]!];
      return next.map((p, i) => ({ ...p, order: i }));
    });
    setDirty(true);
  };

  const addPage = () => {
    const id = `page_${nanoid(10)}`;
    setPages((prev) => [
      ...prev,
      {
        id,
        order: prev.length,
        text: "New page text\u2026",
        pictograms: [],
        backgroundColor: null,
        textColor: null,
        fontSize: null,
        layout: "text-top",
        notes: null,
      },
    ]);
    setSelectedId(id);
    setDirty(true);
  };

  const removePage = (id: string) => {
    if (!confirm("Delete this page?")) return;
    setPages((prev) => prev.filter((p) => p.id !== id).map((p, i) => ({ ...p, order: i })));
    if (selectedId === id) setSelectedId(null);
    setDirty(true);
  };

  const addPictogram = () => {
    if (!selectedId) return;
    const picId = `pic_${nanoid(8)}`;
    updatePage(selectedId, {
      pictograms: [
        ...(selected?.pictograms ?? []),
        {
          id: picId,
          order: (selected?.pictograms.length ?? 0),
          pictogramUrl: "",
          pictogramKeyword: null,
          pictogramId: null,
        },
      ],
    });
  };

  const updatePictogram = (picId: string, patch: Partial<EditorPictogram>) => {
    if (!selectedId) return;
    const current = selected?.pictograms ?? [];
    updatePage(selectedId, {
      pictograms: current.map((pic) => (pic.id === picId ? { ...pic, ...patch } : pic)),
    });
  };

  const removePictogram = (picId: string) => {
    if (!selectedId) return;
    const current = selected?.pictograms ?? [];
    updatePage(selectedId, {
      pictograms: current.filter((pic) => pic.id !== picId),
    });
  };

  const save = () => {
    startTransition(async () => {
      const result = await updateStoryAction({
        storyId,
        title,
        status,
        pages: pages.map((p) => ({
          id: p.id,
          order: p.order,
          text: p.text,
          pictograms: p.pictograms.map((pic) => ({
            id: pic.id,
            order: pic.order,
            pictogramUrl: pic.pictogramUrl,
            pictogramKeyword: pic.pictogramKeyword,
            pictogramId: pic.pictogramId,
          })),
          backgroundColor: p.backgroundColor,
          textColor: p.textColor,
          fontSize: p.fontSize,
          layout: p.layout,
          notes: p.notes,
        })),
      });
      if (result.status === "success") {
        toast.success("Changes saved");
        setDirty(false);
        router.refresh();
      } else {
        toast.error(result.message ?? "Could not save");
      }
    });
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-3">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3">
        <div className="flex grow items-center gap-3">
          <Label htmlFor="story-title" className="shrink-0">
            Title
          </Label>
          <Input
            id="story-title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setDirty(true);
            }}
            className="max-w-xl"
            maxLength={200}
          />
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="story-status" className="sr-only">
            Status
          </Label>
          <select
            id="story-status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as typeof status);
              setDirty(true);
            }}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="DRAFT">Draft</option>
            <option value="IN_REVIEW">In review</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <Button asChild variant="outline">
            <a href={`/api/stories/${storyId}/export?format=pdf-a4-portrait`} download>
              <FileDown className="size-4" /> Export PDF
            </a>
          </Button>
          <Button onClick={save} disabled={!dirty || pending} loading={pending}>
            <Save className="size-4" /> Save
          </Button>
        </div>
      </header>

      <div className="grid min-h-0 grow grid-cols-1 gap-3 md:grid-cols-[240px_minmax(0,1fr)_340px]">
        {/* Pages panel */}
        <section
          aria-labelledby="pages-panel"
          className="flex min-h-0 flex-col overflow-hidden rounded-lg border bg-card"
        >
          <h2 id="pages-panel" className="border-b px-3 py-2 text-sm font-semibold">
            Pages
          </h2>
          <ul className="flex-1 space-y-1 overflow-y-auto p-2">
            {pages.map((p, i) => (
              <li key={p.id}>
                <div
                  className={cn(
                    "flex items-center gap-1 rounded-md border bg-background p-1",
                    selectedId === p.id && "ring-2 ring-ring",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedId(p.id)}
                    className="flex grow items-center gap-2 rounded-sm px-2 py-1 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-current={selectedId === p.id ? "true" : undefined}
                  >
                    <span className="tabular-nums text-muted-foreground">{i + 1}</span>
                    <span className="line-clamp-1">{p.text || "(empty)"}</span>
                  </button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Move page up"
                    disabled={i === 0}
                    onClick={() => movePage(p.id, -1)}
                  >
                    <ArrowUp className="size-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Move page down"
                    disabled={i === pages.length - 1}
                    onClick={() => movePage(p.id, 1)}
                  >
                    <ArrowDown className="size-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Delete page"
                    onClick={() => removePage(p.id)}
                  >
                    <Trash2 className="size-3.5 text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          <div className="border-t p-2">
            <Button variant="secondary" className="w-full" onClick={addPage}>
              <Plus className="size-4" /> Add page
            </Button>
          </div>
        </section>

        {/* Preview panel */}
        <section
          aria-labelledby="preview-panel"
          className="flex min-h-0 flex-col overflow-hidden rounded-lg border bg-card"
        >
          <h2 id="preview-panel" className="border-b px-3 py-2 text-sm font-semibold">
            Live preview
          </h2>
          <div className="flex grow items-center justify-center overflow-auto bg-gradient-to-br from-secondary/40 to-background p-6">
            {selected ? <PagePreview page={selected} /> : <p className="text-sm text-muted-foreground">Select a page to preview it.</p>}
          </div>
        </section>

        {/* Properties panel */}
        <section
          aria-labelledby="props-panel"
          className="flex min-h-0 flex-col overflow-y-auto rounded-lg border bg-card"
        >
          <h2 id="props-panel" className="border-b px-3 py-2 text-sm font-semibold">
            Page properties
          </h2>
          {selected ? (
            <div className="space-y-4 p-3">
              <div className="space-y-2">
                <Label htmlFor="page-text">Text</Label>
                <Textarea
                  id="page-text"
                  value={selected.text}
                  rows={4}
                  maxLength={2000}
                  onChange={(e) => updatePage(selected.id, { text: e.target.value })}
                />
              </div>

              {/* Multiple pictograms */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Pictograms</Label>
                  <Button variant="ghost" size="sm" onClick={addPictogram} aria-label="Add pictogram">
                    <ImagePlus className="size-4" />
                  </Button>
                </div>
                {selected.pictograms.length === 0 && (
                  <p className="text-xs text-muted-foreground">No pictograms yet. Click + to add one.</p>
                )}
                <div className="space-y-2">
                  {selected.pictograms.map((pic) => (
                    <div key={pic.id} className="flex flex-col gap-1 rounded-md border p-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">#{pic.order + 1}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-5"
                          aria-label="Remove pictogram"
                          onClick={() => removePictogram(pic.id)}
                        >
                          <X className="size-3" />
                        </Button>
                      </div>
                      <Input
                        value={pic.pictogramKeyword ?? ""}
                        placeholder="Keyword (e.g. happy)"
                        className="h-8 text-xs"
                        onChange={(e) => updatePictogram(pic.id, { pictogramKeyword: e.target.value || null })}
                      />
                      <Input
                        value={pic.pictogramUrl}
                        placeholder="https://\u2026image.png"
                        className="h-8 text-xs"
                        onChange={(e) => updatePictogram(pic.id, { pictogramUrl: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="page-layout">Layout</Label>
                <select
                  id="page-layout"
                  value={selected.layout}
                  onChange={(e) => updatePage(selected.id, { layout: e.target.value as EditorPage["layout"] })}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="text-top">Text on top</option>
                  <option value="text-bottom">Text below pictogram</option>
                  <option value="text-left">Text on the left</option>
                  <option value="text-right">Text on the right</option>
                  <option value="text-only">Text only</option>
                  <option value="pictogram-only">Pictogram only</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="page-bg">Background</Label>
                  <Input
                    id="page-bg"
                    type="color"
                    value={selected.backgroundColor ?? "#ffffff"}
                    onChange={(e) => updatePage(selected.id, { backgroundColor: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="page-fg">Text color</Label>
                  <Input
                    id="page-fg"
                    type="color"
                    value={selected.textColor ?? "#111827"}
                    onChange={(e) => updatePage(selected.id, { textColor: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="page-font-size">Font size</Label>
                <Input
                  id="page-font-size"
                  type="number"
                  min={10}
                  max={72}
                  value={selected.fontSize ?? 24}
                  onChange={(e) =>
                    updatePage(selected.id, { fontSize: Number(e.target.value) || null })
                  }
                />
              </div>
            </div>
          ) : (
            <p className="p-4 text-sm text-muted-foreground">Select a page to edit its properties.</p>
          )}
        </section>
      </div>
    </div>
  );
}

function PagePreview({ page }: { page: EditorPage }) {
  const style: React.CSSProperties = {
    backgroundColor: page.backgroundColor ?? undefined,
    color: page.textColor ?? undefined,
    fontSize: page.fontSize ? `${page.fontSize}px` : undefined,
  };
  const layout = page.layout;
  const images = page.pictograms.filter((p) => p.pictogramUrl);

  if (layout === "pictogram-only") {
    return (
      <article
        style={style}
        className="flex aspect-[3/4] w-full max-w-md flex-col items-center justify-center gap-3 rounded-lg border bg-white p-6 shadow-md"
        aria-label="Page preview"
      >
        {images.length > 0 ? (
          <div className="flex flex-wrap items-center justify-center gap-3">
            {images.map((pic) => (
              <PictogramImg key={pic.id} src={pic.pictogramUrl} alt={pic.pictogramKeyword ?? "Pictogram"} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No pictograms</p>
        )}
      </article>
    );
  }

  const showText = true;
  const showImages = images.length > 0 && layout !== "text-only";

  if (layout === "text-left" || layout === "text-right") {
    return (
      <article
        style={style}
        className={cn(
          "flex aspect-[3/4] w-full max-w-md rounded-lg border bg-white p-4 shadow-md",
          layout === "text-left" ? "flex-row" : "flex-row-reverse",
        )}
        aria-label="Page preview"
      >
        {showText && (
          <p className="flex-1 overflow-y-auto px-2 text-center text-sm font-medium leading-snug">
            {page.text}
          </p>
        )}
        {showImages && (
          <div className="flex w-1/3 flex-col items-center justify-center gap-2">
            {images.map((pic) => (
              <PictogramImg key={pic.id} src={pic.pictogramUrl} alt={pic.pictogramKeyword ?? "Pictogram"} className="max-h-24" />
            ))}
          </div>
        )}
      </article>
    );
  }

  return (
    <article
      style={style}
      className="flex aspect-[3/4] w-full max-w-md flex-col rounded-lg border bg-white p-6 text-center shadow-md"
      aria-label="Page preview"
    >
      {showImages && layout !== "text-top" && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {images.map((pic) => (
            <PictogramImg key={pic.id} src={pic.pictogramUrl} alt={pic.pictogramKeyword ?? "Pictogram"} />
          ))}
        </div>
      )}
      {showText && (
        <p className="grow overflow-y-auto font-medium leading-snug">{page.text}</p>
      )}
      {showImages && layout === "text-top" && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {images.map((pic) => (
            <PictogramImg key={pic.id} src={pic.pictogramUrl} alt={pic.pictogramKeyword ?? "Pictogram"} />
          ))}
        </div>
      )}
    </article>
  );
}

function PictogramImg({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [error, setError] = React.useState(false);
  if (error) return <span className="text-xs text-muted-foreground">{alt}</span>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => setError(true)}
      className={cn("size-16 object-contain", className)}
    />
  );
}
