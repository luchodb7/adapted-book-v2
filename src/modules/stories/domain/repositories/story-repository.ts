import type { StoryStatus } from "@prisma/client";
import type { Story } from "../entities/story";

export interface ListStoriesQuery {
  organizationId: string;
  search?: string;
  status?: StoryStatus;
  tags?: string[];
  createdById?: string;
  limit?: number;
  offset?: number;
  sortBy?: "createdAt" | "updatedAt" | "title";
  sortDir?: "asc" | "desc";
}

export interface ListStoriesResult {
  items: Story[];
  total: number;
}

export interface StoryRepository {
  findById(id: string, organizationId: string): Promise<Story | null>;
  list(query: ListStoriesQuery): Promise<ListStoriesResult>;
  save(story: Story): Promise<void>;
  delete(id: string, organizationId: string): Promise<void>;
}
