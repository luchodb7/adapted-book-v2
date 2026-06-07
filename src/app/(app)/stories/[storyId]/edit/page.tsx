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
      initialPages={data.pages.map((p) => {
        const pj = p.toJSON();
        return {
          id: pj.id,
          order: pj.order,
          text: pj.text,
          pictogramUrl: pj.pictogramUrl,
          pictogramKeyword: pj.pictogramKeyword,
          pictogramId: pj.pictogramId,
          backgroundColor: pj.backgroundColor,
          textColor: pj.textColor,
          fontSize: pj.fontSize,
          layout: pj.layout,
          notes: pj.notes,
        };
      })}
    />
  );
}
