/**
 * AIProvider — Single entry point for every AI capability in the platform.
 *
 * Goals:
 *   - Vendor-agnostic. Modules import this interface, never an SDK.
 *   - Stable surface. New providers add a class; old callers keep working.
 *   - Telemetry-friendly. Every call returns token/cost/latency metadata.
 *
 * Implementations live under `/modules/ai/infrastructure/providers/*` and are
 * wired in `AIProviderFactory`. The default is `MockAIProvider` which returns
 * deterministic content for tests, local dev, and the offline PWA experience.
 */

export type AIRole = "system" | "user" | "assistant";

export interface AIMessage {
  role: AIRole;
  content: string;
}

export interface AIInvocationMetadata {
  provider: string;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  costUsd?: number;
  latencyMs: number;
  finishReason?: string;
}

export interface AIResponse<T> {
  data: T;
  metadata: AIInvocationMetadata;
}

export interface GenerateStoryRequest {
  language: string;
  name?: string;
  age?: number;
  context?: string;
  situation: string;
  objective?: string;
  cognitiveLevel?: "low" | "medium" | "high";
  readingLevel?: "pre-reader" | "beginner" | "intermediate" | "advanced";
  numberOfPages?: number;
  organizationId: string;
}

export interface GeneratedStoryDraft {
  title: string;
  description: string;
  pages: Array<{
    text: string;
    pictogramKeyword: string;
  }>;
}

export interface AdaptTextRequest {
  text: string;
  language: string;
  targetAudience?: string;
  tone?: "neutral" | "warm" | "formal";
}

export interface SimplifyTextRequest {
  text: string;
  language: string;
  level?: "easy" | "very-easy";
}

export interface SuggestPictogramsRequest {
  text: string;
  language: string;
  maxSuggestions?: number;
}

export interface RoutineStep {
  order: number;
  text: string;
  pictogramKeyword: string;
  durationMinutes?: number;
}

export interface GenerateRoutineRequest {
  title: string;
  description?: string;
  language: string;
  totalDurationMinutes?: number;
  numberOfSteps?: number;
}

export interface GenerateVisualScheduleRequest {
  title: string;
  language: string;
  activities: string[];
}

export interface GenerateComprehensionQuestionsRequest {
  text: string;
  language: string;
  numberOfQuestions?: number;
  questionTypes?: Array<"factual" | "inferential" | "personal">;
}

export interface ComprehensionQuestion {
  question: string;
  type: "factual" | "inferential" | "personal";
  expectedAnswer?: string;
  pictogramKeyword?: string;
}

export interface AIProvider {
  readonly name: string;

  generateStory(req: GenerateStoryRequest): Promise<AIResponse<GeneratedStoryDraft>>;
  adaptText(req: AdaptTextRequest): Promise<AIResponse<string>>;
  simplifyText(req: SimplifyTextRequest): Promise<AIResponse<string>>;
  suggestPictograms(req: SuggestPictogramsRequest): Promise<AIResponse<string[]>>;
  generateRoutine(req: GenerateRoutineRequest): Promise<AIResponse<RoutineStep[]>>;
  generateVisualSchedule(
    req: GenerateVisualScheduleRequest,
  ): Promise<AIResponse<RoutineStep[]>>;
  generateComprehensionQuestions(
    req: GenerateComprehensionQuestionsRequest,
  ): Promise<AIResponse<ComprehensionQuestion[]>>;
}
