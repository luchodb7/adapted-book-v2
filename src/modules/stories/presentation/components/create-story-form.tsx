"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createStoryAction } from "@/modules/stories/presentation/server-actions/story-actions";
import type { ActionResult } from "@/shared/auth/action-result";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} disabled={pending} size="lg">
      <Sparkles className="size-4" /> Generate Social Story
    </Button>
  );
}

export function CreateStoryForm() {
  const [state, action] = useActionState<ActionResult<{ storyId: string }>, FormData>(
    createStoryAction,
    { status: "idle" },
  );

  return (
    <form action={action} className="space-y-6" aria-describedby={state.message ? "form-msg" : undefined}>
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          required
          maxLength={200}
          placeholder="e.g. Going to the dentist"
          aria-required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="originalText">Original text</Label>
        <Textarea
          id="originalText"
          name="originalText"
          rows={10}
          required
          maxLength={50000}
          aria-required
          aria-describedby="text-help"
          placeholder="Paste or write the text you want to adapt into a social story…"
        />
        <p id="text-help" className="text-xs text-muted-foreground">
          We'll split it into short sentences, simplify them, and match each one with a
          pictogram.
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-md border bg-secondary/30 px-3 py-2">
        <input
          id="generatePictograms"
          type="checkbox"
          name="generatePictograms"
          defaultChecked
          value="true"
          className="size-4"
        />
        <Label htmlFor="generatePictograms" className="font-normal">
          Auto-attach ARASAAC pictograms
        </Label>
      </div>

      <div className="flex items-center gap-3">
        <Label htmlFor="language" className="sr-only">
          Language
        </Label>
        <select
          id="language"
          name="language"
          defaultValue="en"
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
          <option value="pt">Português</option>
          <option value="de">Deutsch</option>
          <option value="it">Italiano</option>
        </select>
        <SubmitButton />
      </div>

      {state.status === "error" && state.message && (
        <p
          id="form-msg"
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
