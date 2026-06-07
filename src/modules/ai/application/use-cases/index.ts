import type {
  AIProvider,
  AdaptTextRequest,
  ComprehensionQuestion,
  GenerateComprehensionQuestionsRequest,
  GenerateRoutineRequest,
  GenerateStoryRequest,
  GenerateVisualScheduleRequest,
  GeneratedStoryDraft,
  RoutineStep,
  SimplifyTextRequest,
  SuggestPictogramsRequest,
} from "@/modules/ai/domain/providers/ai-provider";

/**
 * Use-case interfaces — every AI feature in the platform corresponds to one
 * of these. Concrete implementations live next to this file.
 *
 * Splitting the interface from the implementation lets us:
 *   - depend on the abstraction in higher-level orchestration code
 *   - swap implementations (e.g. add caching, throttling, A/B prompts)
 *     without rewriting callers
 */

export interface GenerateSocialStoryUseCase {
  execute(req: GenerateStoryRequest): Promise<GeneratedStoryDraft>;
}

export interface GenerateStoryFromPromptUseCase {
  execute(req: GenerateStoryRequest): Promise<GeneratedStoryDraft>;
}

export interface AdaptTextUseCase {
  execute(req: AdaptTextRequest): Promise<string>;
}

export interface SimplifyTextUseCase {
  execute(req: SimplifyTextRequest): Promise<string>;
}

export interface SuggestPictogramsUseCase {
  execute(req: SuggestPictogramsRequest): Promise<string[]>;
}

export interface GenerateRoutineUseCase {
  execute(req: GenerateRoutineRequest): Promise<RoutineStep[]>;
}

export interface GenerateVisualScheduleUseCase {
  execute(req: GenerateVisualScheduleRequest): Promise<RoutineStep[]>;
}

export interface GenerateComprehensionQuestionsUseCase {
  execute(req: GenerateComprehensionQuestionsRequest): Promise<ComprehensionQuestion[]>;
}

/**
 * Default implementations: thin orchestrators that delegate to the active
 * `AIProvider` while emitting an `AIGeneration` audit record (handled by the
 * audit module via DI; callers don't need to know).
 */

export class DefaultGenerateSocialStoryUseCase implements GenerateSocialStoryUseCase {
  constructor(private readonly ai: AIProvider) {}
  async execute(req: GenerateStoryRequest): Promise<GeneratedStoryDraft> {
    const { data } = await this.ai.generateStory(req);
    return data;
  }
}

export class DefaultAdaptTextUseCase implements AdaptTextUseCase {
  constructor(private readonly ai: AIProvider) {}
  async execute(req: AdaptTextRequest): Promise<string> {
    const { data } = await this.ai.adaptText(req);
    return data;
  }
}

export class DefaultSimplifyTextUseCase implements SimplifyTextUseCase {
  constructor(private readonly ai: AIProvider) {}
  async execute(req: SimplifyTextRequest): Promise<string> {
    const { data } = await this.ai.simplifyText(req);
    return data;
  }
}

export class DefaultSuggestPictogramsUseCase implements SuggestPictogramsUseCase {
  constructor(private readonly ai: AIProvider) {}
  async execute(req: SuggestPictogramsRequest): Promise<string[]> {
    const { data } = await this.ai.suggestPictograms(req);
    return data;
  }
}

export class DefaultGenerateRoutineUseCase implements GenerateRoutineUseCase {
  constructor(private readonly ai: AIProvider) {}
  async execute(req: GenerateRoutineRequest): Promise<RoutineStep[]> {
    const { data } = await this.ai.generateRoutine(req);
    return data;
  }
}

export class DefaultGenerateVisualScheduleUseCase implements GenerateVisualScheduleUseCase {
  constructor(private readonly ai: AIProvider) {}
  async execute(req: GenerateVisualScheduleRequest): Promise<RoutineStep[]> {
    const { data } = await this.ai.generateVisualSchedule(req);
    return data;
  }
}

export class DefaultGenerateComprehensionQuestionsUseCase
  implements GenerateComprehensionQuestionsUseCase
{
  constructor(private readonly ai: AIProvider) {}
  async execute(req: GenerateComprehensionQuestionsRequest): Promise<ComprehensionQuestion[]> {
    const { data } = await this.ai.generateComprehensionQuestions(req);
    return data;
  }
}
