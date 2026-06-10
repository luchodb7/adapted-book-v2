import type { Logger } from "@/core/logger/logger";
import type { PictogramService } from "@/modules/pictograms/domain/services/pictogram-service";
import type { Story } from "@/modules/stories/domain/entities/story";
import {
  type GenerateSocialStoryInput,
  type GenerateSocialStoryOutput,
  type SocialStoryGenerator,
} from "@/modules/stories/domain/services/social-story-generator";
import { StoryPage } from "@/modules/stories/domain/value-objects/story-page";
import { PagePictogram } from "@/modules/stories/domain/value-objects/page-pictogram";
import { extractKeywords, splitIntoSentences, simplifySentence } from "./text-processing";

const DEFAULT_SENTENCES_PER_PAGE = 1;
const DEFAULT_MAX_PAGES = 60;

/**
 * Default deterministic implementation of `SocialStoryGenerator`.
 *
 * Steps:
 *   1. Normalise & split text into sentences (i18n-aware via Intl.Segmenter).
 *   2. Simplify each sentence to social-story style (active voice, present
 *      tense, first person where appropriate).
 *   3. Bundle N sentences per page.
 *   4. Extract keyword per page and request a pictogram from PictogramService.
 *
 * Designed so the same interface can be served by an AI-backed implementation
 * with zero changes to callers — see /modules/ai/application/use-cases.
 */
export class DefaultSocialStoryGenerator implements SocialStoryGenerator {
  constructor(
    private readonly pictograms: PictogramService,
    private readonly logger: Logger,
  ) {}

  async generate(input: GenerateSocialStoryInput): Promise<GenerateSocialStoryOutput> {
    const sentencesPerPage = input.sentencesPerPage ?? DEFAULT_SENTENCES_PER_PAGE;
    const maxPages = input.maxPages ?? DEFAULT_MAX_PAGES;
    const language = input.language ?? "en";
    const attachPictograms = input.attachPictograms ?? true;

    const sentences = splitIntoSentences(input.originalText, language);
    if (sentences.length === 0) {
      return { adaptedText: "", pages: [] };
    }

    const simplifiedSentences = sentences.map((s) => simplifySentence(s, language));

    const pageGroups: string[][] = [];
    for (let i = 0; i < simplifiedSentences.length; i += sentencesPerPage) {
      pageGroups.push(simplifiedSentences.slice(i, i + sentencesPerPage));
      if (pageGroups.length >= maxPages) break;
    }

    const pages = await Promise.all(
      pageGroups.map(async (group, index) => {
        const text = group.join(" ").trim();
        const keyword = extractKeywords(text, language)[0] ?? null;
        let pictogramUrl: string | null = null;
        let pictogramId: string | null = null;

        if (attachPictograms && keyword) {
          try {
            const result = await this.pictograms.findBestForKeyword(keyword, { language });
            if (result) {
              pictogramUrl = result.imageUrl;
              pictogramId = String(result.id);
            }
          } catch (err) {
            this.logger.warn({ err, keyword }, "social-story-generator.pictogram_failed");
          }
        }

        const pictograms = pictogramUrl && keyword
          ? [PagePictogram.create({ id: `${input.storyId}-page-${index}-pic-0`, order: 0, pictogramUrl, pictogramKeyword: keyword, pictogramId })]
          : [];

        return StoryPage.create({
          id: `${input.storyId}-page-${index}`,
          order: index,
          text,
          pictograms,
          backgroundColor: null,
          textColor: null,
          fontSize: null,
          layout: pictogramUrl ? "text-bottom" : "text-only",
          notes: null,
        });
      }),
    );

    return {
      adaptedText: simplifiedSentences.join(" "),
      pages,
    };
  }

  async regeneratePictograms(story: Story): Promise<StoryPage[]> {
    const language = story.toJSON().language;
    return Promise.all(
      story.pages.map(async (page) => {
        const pictograms = await Promise.all(
          page.pictograms.map(async (pic) => {
            const keyword = pic.pictogramKeyword ?? extractKeywords(page.text, language)[0] ?? null;
            if (!keyword) return pic;
            const result = await this.pictograms.findBestForKeyword(keyword, { language });
            if (!result) return pic;
            return pic.withUrl(result.imageUrl);
          }),
        );
        return page.replacePictograms(pictograms as typeof page.pictograms extends readonly (infer U)[] ? U[] : never[]);
      }),
    );
  }
}
