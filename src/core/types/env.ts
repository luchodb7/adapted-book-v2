import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_NAME: z.string().default("Adapted Books"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_NAME: z.string().default("Adapted Books"),

  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),

  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters long"),
  AUTH_URL: z.string().url().optional(),
  AUTH_TRUST_HOST: z.string().optional(),
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),

  BLOB_READ_WRITE_TOKEN: z.string().optional(),

  ARASAAC_API_BASE_URL: z.string().url().default("https://api.arasaac.org/v1"),
  ARASAAC_STATIC_URL: z.string().url().default("https://static.arasaac.org/pictograms"),
  ARASAAC_DEFAULT_LOCALE: z.string().default("en"),
  ARASAAC_CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(86400),

  AI_PROVIDER: z
    .enum(["mock", "openai", "anthropic", "gemini", "azure", "ollama", "lmstudio"])
    .default("mock"),
  AI_DEFAULT_MODEL: z.string().default("mock-model"),
  AI_DEFAULT_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.7),
  AI_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(60_000),

  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().url().optional(),
  OPENAI_MODEL: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().optional(),
  AZURE_OPENAI_API_KEY: z.string().optional(),
  AZURE_OPENAI_ENDPOINT: z.string().url().optional(),
  AZURE_OPENAI_DEPLOYMENT: z.string().optional(),
  AZURE_OPENAI_API_VERSION: z.string().optional(),
  OLLAMA_BASE_URL: z.string().url().optional(),
  OLLAMA_MODEL: z.string().optional(),
  LMSTUDIO_BASE_URL: z.string().url().optional(),
  LMSTUDIO_MODEL: z.string().optional(),

  EMAIL_FROM: z.string().default("Adapted Books <noreply@adaptedbooks.app>"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_AUTH_MAX_REQUESTS: z.coerce.number().int().positive().default(10),

  FEATURE_AI_STORY_GENERATION: z.coerce.boolean().default(false),
  FEATURE_TEXT_SIMPLIFICATION: z.coerce.boolean().default(false),
  FEATURE_ROUTINE_GENERATION: z.coerce.boolean().default(false),
  FEATURE_VISUAL_SCHEDULES: z.coerce.boolean().default(false),
  FEATURE_SUBSCRIPTIONS: z.coerce.boolean().default(false),

  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  SENTRY_DSN: z.string().url().optional().or(z.literal("")),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional().or(z.literal("")),
  OTEL_SERVICE_NAME: z.string().default("adapted-books"),

  TZ: z.string().default("UTC"),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Parses environment variables once at startup.
 * Throws a descriptive error if validation fails — fail-fast.
 */
function parseEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  return parsed.data;
}

export const env: Env = parseEnv();

export const isProduction = env.NODE_ENV === "production";
export const isDevelopment = env.NODE_ENV === "development";
export const isTest = env.NODE_ENV === "test";
