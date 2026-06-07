import { describe, expect, it, vi, beforeEach } from "vitest";
import { CreateStoryUseCase } from "@/modules/stories/application/use-cases/create-story";
import { TenantContext } from "@/shared/tenant/tenant-context";
import { createMockPrisma } from "../_helpers/mock-prisma";
import { makeOrg, makeUser, makeMembership, makeStory } from "../_helpers/factories";

const prisma = createMockPrisma() as never;
const audit = { log: vi.fn(async () => undefined) };

const pictogramService = {
  search: vi.fn(async (q: string) => [
    { id: 1, keyword: q, url: `https://x/${q}.png`, description: q },
  ]),
  getById: vi.fn(),
};

const storyGen = {
  generate: vi.fn(async (input: { originalText: string; language: string }) => ({
    pages: [
      { text: "Sentence one.", pictogram: pictogramService.search("one") as never, pictogramKeyword: "one" },
      { text: "Sentence two.", pictogram: pictogramService.search("two") as never, pictogramKeyword: "two" },
    ],
  })),
};

const ctx: TenantContext = {
  userId: "u1", organizationId: "org1", role: "EDITOR", email: "e@x", locale: "en",
};

const useCase = new CreateStoryUseCase(
  prisma, audit as never, storyGen as never, pictogramService as never,
);

beforeEach(() => {
  vi.clearAllMocks();
  (prisma.organization.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(makeOrg({ id: "org1" }));
  (prisma.story.create as ReturnType<typeof vi.fn>).mockImplementation(async ({ data }: { data: unknown }) => data);
  (prisma.storyPage.createMany as ReturnType<typeof vi.fn>) = vi.fn(async ({ data }: { data: { data: unknown[] } }) => {
    (data.data as unknown[]).forEach((p) => (p as { id: string }).id ??= "p1");
    return { count: 2 };
  }) as never;
});

describe("CreateStoryUseCase", () => {
  it("creates a story and writes audit log within tenant scope", async () => {
    void makeUser({ id: "u1" });
    void makeMembership("u1", "org1");
    void makeStory("org1", "u1");

    const out = await useCase.execute(ctx, {
      title: "Going to the dentist",
      originalText: "I am going to the dentist. The dentist is friendly.",
    });

    expect(out.story.title).toBe("Going to the dentist");
    expect(out.story.organizationId).toBe("org1");
    expect(audit.log).toHaveBeenCalled();
  });

  it("refuses to create a story for an org the actor does not belong to", async () => {
    (prisma.organization.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    await expect(
      useCase.execute({ ...ctx, organizationId: "org_other" }, {
        title: "x",
        originalText: "y",
      }),
    ).rejects.toThrow();
  });
});
