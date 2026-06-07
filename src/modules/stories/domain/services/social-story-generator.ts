import type { StoryPage } from "../value-objects/story-page";
import type { Story } from "../entities/story";

/**
 * SocialStoryGenerator
 *
 * Domain service that converts free-form text into a sequence of social-story
 * pages. The default implementation is a deterministic text-segmenter +
 * pictogram lookup; the same interface is later satisfied by an AI-backed
 * generator (no change in callers).
 */
export interface SocialStoryGenerator {
  generate(input: GenerateSocialStoryInput): Promise<GenerateSocialStoryOutput>;
  regeneratePictograms(story: Story): Promise<StoryPage[]>;
}

export interface GenerateSocialStoryInput {
  storyId: string;
  organizationId: string;
  originalText: string;
  language?: string;
  /** Maximum sentences per page. Defaults to 1. */
  sentencesPerPage?: number;
  /** Maximum number of pages (safety cap). Defaults to 60. */
  maxPages?: number;
  /** Whether to auto-attach ARASAAC pictograms. Defaults to true. */
  attachPictograms?: boolean;
}

export interface GenerateSocialStoryOutput {
  adaptedText: string;
  pages: StoryPage[];
}
