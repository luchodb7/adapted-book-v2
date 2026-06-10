"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getContainer } from "@/core/di/composition-root";
import {
  AuditLoggerToken,
  SocialStoryGeneratorToken,
  StoryRepositoryToken,
} from "@/core/di/tokens";
import { authorize as requireRole } from "@/shared/tenant/guards";
import { CreateStoryUseCase } from "@/modules/stories/application/use-cases/create-story";
import { UpdateStoryUseCase } from "@/modules/stories/application/use-cases/update-story";
import { DeleteStoryUseCase } from "@/modules/stories/application/use-cases/delete-story";
import { DuplicateStoryUseCase } from "@/modules/stories/application/use-cases/duplicate-story";
import { rateLimit } from "@/lib/rate-limit/rate-limit";
import { toAppError } from "@/core/errors/app-error";
import { logger } from "@/core/logger/logger";
import { errorResult, successResult, type ActionResult } from "@/shared/auth/action-result";

const log = logger.child({ component: "story.actions" });

export async function createStoryAction(
  _prev: ActionResult<{ storyId: string }>,
  formData: FormData,
): Promise<ActionResult<{ storyId: string }>> {
  try {
    const ctx = await requireRole("EDITOR");
    const limit = await rateLimit({ key: `stories.create:${ctx.userId}`, kind: "default" });
    if (!limit.allowed) return errorResult("Too many requests, please slow down.") as unknown as ActionResult<{ storyId: string }>;

    const c = getContainer();
    const useCase = new CreateStoryUseCase(
      c.resolve(StoryRepositoryToken),
      c.resolve(SocialStoryGeneratorToken),
      c.resolve(AuditLoggerToken),
    );

    const result = await useCase.execute(ctx, {
      title: formData.get("title"),
      originalText: formData.get("originalText"),
      language: formData.get("language") || "en",
      generatePictograms: formData.get("generatePictograms") !== "false",
    });

    revalidatePath("/app/stories");
    redirect(`/app/stories/${result.storyId}/edit`);
  } catch (error) {
    if ((error as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) throw error;
    const app = toAppError(error);
    log.error({ err: error }, "createStoryAction.failed");
    return errorResult(app.message, app.details?.fieldErrors as Record<string, string[]> | undefined) as unknown as ActionResult<{ storyId: string }>;
  }
}

export async function updateStoryAction(input: unknown): Promise<ActionResult> {
  try {
    const ctx = await requireRole("EDITOR");
    const c = getContainer();
    const useCase = new UpdateStoryUseCase(
      c.resolve(StoryRepositoryToken),
      c.resolve(AuditLoggerToken),
    );
    await useCase.execute(ctx, input);
    revalidatePath("/app/stories");
    return successResult(undefined, "Saved");
  } catch (error) {
    const app = toAppError(error);
    log.error({ err: error }, "updateStoryAction.failed");
    return errorResult(app.message);
  }
}

export async function deleteStoryAction(storyId: string): Promise<ActionResult> {
  try {
    const ctx = await requireRole("ADMIN");
    const c = getContainer();
    const useCase = new DeleteStoryUseCase(
      c.resolve(StoryRepositoryToken),
      c.resolve(AuditLoggerToken),
    );
    await useCase.execute(ctx, { storyId });
    revalidatePath("/app/stories");
    return successResult(undefined, "Story deleted");
  } catch (error) {
    const app = toAppError(error);
    log.error({ err: error }, "deleteStoryAction.failed");
    return errorResult(app.message);
  }
}

export async function duplicateStoryAction(storyId: string): Promise<ActionResult<{ storyId: string }>> {
  try {
    const ctx = await requireRole("EDITOR");
    const c = getContainer();
    const useCase = new DuplicateStoryUseCase(
      c.resolve(StoryRepositoryToken),
      c.resolve(AuditLoggerToken),
    );
    const result = await useCase.execute(ctx, { storyId });
    revalidatePath("/app/stories");
    return successResult(result, "Story duplicated");
  } catch (error) {
    const app = toAppError(error);
    log.error({ err: error }, "duplicateStoryAction.failed");
    return errorResult(app.message) as unknown as ActionResult<{ storyId: string }>;
  }
}
