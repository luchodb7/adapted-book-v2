import type { ExportableStory } from "@/modules/export/domain/story-export-service";

export class MemoryStoryRepository {
  private readonly byId = new Map<string, ExportableStory>();
  constructor(stories: ExportableStory[]) {
    for (const s of stories) this.byId.set(s.id, s);
  }
  async findExportable(id: string): Promise<ExportableStory | null> {
    return this.byId.get(id) ?? null;
  }
}
