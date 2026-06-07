import type {
  AIProvider,
  AIResponse,
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
 * MockAIProvider — deterministic, offline-capable AI provider.
 *
 * Used by:
 *   - tests (so we never hit a real model)
 *   - local dev when `AI_PROVIDER=mock`
 *   - the PWA offline experience
 *
 * The output is intentionally plausible (proper structure, sensible defaults)
 * so the rest of the application can be exercised end-to-end without an API
 * key.
 */
export class MockAIProvider implements AIProvider {
  readonly name = "mock";

  async generateStory(req: GenerateStoryRequest): Promise<AIResponse<GeneratedStoryDraft>> {
    const start = Date.now();
    const subject = req.name ?? "the child";
    const pages = (req.numberOfPages ?? 5);
    const lines = [
      `Hello! My name is ${subject}.`,
      `Today, I am going to ${req.situation.toLowerCase()}.`,
      req.context ? `This is what happens: ${req.context}` : `It is okay to feel a little nervous.`,
      `I can take a deep breath if I feel worried.`,
      req.objective
        ? `My goal is to ${req.objective.toLowerCase()}.`
        : `When it is finished, I will feel proud of myself.`,
    ];
    while (lines.length < pages) lines.push("I am safe and supported.");

    return {
      data: {
        title: `${subject} — ${req.situation}`,
        description: `A social story to help ${subject} prepare for ${req.situation}.`,
        pages: lines.slice(0, pages).map((text, idx) => ({
          text,
          pictogramKeyword: KEYWORDS[idx % KEYWORDS.length]!,
        })),
      },
      metadata: meta(start, this.name, 256),
    };
  }

  async adaptText(req: AdaptTextRequest): Promise<AIResponse<string>> {
    const start = Date.now();
    const adapted = req.text
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => (s.endsWith(".") ? s : `${s}.`))
      .join(" ");
    return { data: adapted, metadata: meta(start, this.name, adapted.length / 4) };
  }

  async simplifyText(req: SimplifyTextRequest): Promise<AIResponse<string>> {
    const start = Date.now();
    const simplified = req.text
      .replace(/\b(?:however|nevertheless|furthermore|therefore|consequently)\b/gi, "but")
      .replace(/\s+/g, " ")
      .trim();
    return { data: simplified, metadata: meta(start, this.name, simplified.length / 4) };
  }

  async suggestPictograms(req: SuggestPictogramsRequest): Promise<AIResponse<string[]>> {
    const start = Date.now();
    const words = req.text
      .toLowerCase()
      .replace(/[^a-z\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 3);
    const unique = [...new Set(words)].slice(0, req.maxSuggestions ?? 5);
    return { data: unique.length ? unique : KEYWORDS.slice(0, 3), metadata: meta(start, this.name, 64) };
  }

  async generateRoutine(req: GenerateRoutineRequest): Promise<AIResponse<RoutineStep[]>> {
    const start = Date.now();
    const n = req.numberOfSteps ?? 5;
    const totalMinutes = req.totalDurationMinutes ?? n * 10;
    const stepDuration = Math.max(1, Math.floor(totalMinutes / n));
    const steps: RoutineStep[] = Array.from({ length: n }, (_, i) => ({
      order: i,
      text: `Step ${i + 1} of "${req.title}"`,
      pictogramKeyword: ROUTINE_KEYWORDS[i % ROUTINE_KEYWORDS.length]!,
      durationMinutes: stepDuration,
    }));
    return { data: steps, metadata: meta(start, this.name, 96) };
  }

  async generateVisualSchedule(
    req: GenerateVisualScheduleRequest,
  ): Promise<AIResponse<RoutineStep[]>> {
    const start = Date.now();
    const steps: RoutineStep[] = req.activities.map((activity, i) => ({
      order: i,
      text: activity,
      pictogramKeyword: ROUTINE_KEYWORDS[i % ROUTINE_KEYWORDS.length]!,
    }));
    return { data: steps, metadata: meta(start, this.name, 64) };
  }

  async generateComprehensionQuestions(
    req: GenerateComprehensionQuestionsRequest,
  ): Promise<AIResponse<ComprehensionQuestion[]>> {
    const start = Date.now();
    const n = req.numberOfQuestions ?? 3;
    const questions: ComprehensionQuestion[] = Array.from({ length: n }, (_, i) => ({
      question: `Question ${i + 1} about the story`,
      type: (req.questionTypes?.[i % (req.questionTypes?.length ?? 1)] ?? "factual") as
        | "factual"
        | "inferential"
        | "personal",
      pictogramKeyword: "question",
    }));
    return { data: questions, metadata: meta(start, this.name, 96) };
  }
}

const KEYWORDS = ["happy", "play", "school", "friend", "family", "talk", "smile"];
const ROUTINE_KEYWORDS = ["wake-up", "brush-teeth", "breakfast", "dress", "school", "play"];

function meta(start: number, provider: string, tokens: number) {
  return {
    provider,
    model: "mock-1",
    promptTokens: Math.floor(tokens * 0.4),
    completionTokens: Math.floor(tokens * 0.6),
    totalTokens: Math.floor(tokens),
    costUsd: 0,
    latencyMs: Date.now() - start,
    finishReason: "stop",
  };
}
