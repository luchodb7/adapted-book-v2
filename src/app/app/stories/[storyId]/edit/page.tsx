import { notFound } from "next/navigation";
import { authorize } from "@/shared/tenant/guards";
import { getContainer } from "@/core/di/composition-root";
import { StoryRepositoryToken } from "@/core/di/tokens";
import { StoryEditor } from "@/modules/stories/presentation/components/story-editor";

interface PageProps {
  params: Promise<{ storyId: string }>;
}

export default async function EditStoryPage({ params }: PageProps) {
  const ctx = await authorize("EDITOR");
  const { storyId } = await params;
  const c = getContainer();
  const stories = c.resolve(StoryRepositoryToken);
  const story = await stories.findById(storyId, ctx.organizationId);
  if (!story) notFound();

  const data = story.toJSON();

  return (
    <StoryEditor
      storyId={story.id}
      initialTitle={data.title}
      initialStatus={data.status}
      initialPages={data.pages.map((p) => ({
        id: p.id,
        order: p.order,
        text: p.text,
        pictograms: p.pictograms.map((pic) => ({
          id: pic.id,
          order: pic.order,
          pictogramUrl: pic.pictogramUrl,
          pictogramKeyword: pic.pictogramKeyword ?? null,
          pictogramId: pic.pictogramId ?? null,
        })),
        backgroundColor: p.backgroundColor,
        textColor: p.textColor,
        fontSize: p.fontSize,
        layout: p.layout,
        notes: p.notes,
      }))}
    />
  );
}
