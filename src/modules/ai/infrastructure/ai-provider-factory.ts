import type { Logger } from "@/core/logger/logger";
import type { AIProvider } from "@/modules/ai/domain/providers/ai-provider";
import { MockAIProvider } from "./providers/mock-ai-provider";
import { AIProviderError } from "@/core/errors/app-error";

/**
 * AIProviderFactory — environment-driven selection of the active AI provider.
 *
 * Real provider classes (OpenAI, Anthropic, Gemini, Azure, Ollama, LMStudio)
 * are lazy-loaded only when selected, so production deployments do not ship
 * unused SDK code. Today only the `mock` provider is included; adding a real
 * one is a 30-line file under `./providers/`.
 *
 * Switching providers does NOT require any business-logic change — that's the
 * whole point of the AI module being hexagonal.
 */
export type AIProviderName =
  | "mock"
  | "openai"
  | "anthropic"
  | "gemini"
  | "azure"
  | "ollama"
  | "lmstudio";

export interface FactoryOptions {
  provider: AIProviderName;
  logger: Logger;
}

export class AIProviderFactory {
  static create(options: FactoryOptions): AIProvider {
    const { provider, logger } = options;
    logger.info({ provider }, "ai.factory.creating_provider");

    switch (provider) {
      case "mock":
        return new MockAIProvider();

      case "openai":
      case "anthropic":
      case "gemini":
      case "azure":
      case "ollama":
      case "lmstudio": {
        logger.warn(
          { provider },
          "ai.factory.provider_not_implemented_falling_back_to_mock",
        );
        // Real provider classes will be added here. They must implement
        // `AIProvider` exactly so callers never change.
        //
        // Example of the future shape:
        //   case "openai": {
        //     const { OpenAIProvider } = await import("./providers/openai-provider");
        //     return new OpenAIProvider({ apiKey: env.OPENAI_API_KEY!, model: env.OPENAI_MODEL! });
        //   }
        return new MockAIProvider();
      }

      default: {
        const _exhaustive: never = provider;
        throw new AIProviderError(String(_exhaustive), "Unknown provider");
      }
    }
  }
}
