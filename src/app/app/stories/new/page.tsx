import type { Metadata } from "next";
import { CreateStoryForm } from "@/modules/stories/presentation/components/create-story-form";

export const metadata: Metadata = { title: "Create story" };

export default function NewStoryPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create a new story</h1>
        <p className="text-sm text-muted-foreground">
          Provide a title and the original text. We'll generate pages and pictograms for you.
        </p>
      </div>
      <CreateStoryForm />
    </div>
  );
}
