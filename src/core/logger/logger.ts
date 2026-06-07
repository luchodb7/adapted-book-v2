import pino, { type Logger as PinoLogger } from "pino";
import { env, isDevelopment } from "@/core/types/env";

/**
 * Structured, level-controllable logger.
 *
 * In development we use `pino-pretty` for human-readable output.
 * In production we emit JSON for log aggregators (Datadog, CloudWatch, etc.).
 */

export interface Logger {
  fatal: (obj: unknown, msg?: string) => void;
  error: (obj: unknown, msg?: string) => void;
  warn: (obj: unknown, msg?: string) => void;
  info: (obj: unknown, msg?: string) => void;
  debug: (obj: unknown, msg?: string) => void;
  trace: (obj: unknown, msg?: string) => void;
  child: (bindings: Record<string, unknown>) => Logger;
}

const baseLogger: PinoLogger = pino({
  level: env.LOG_LEVEL,
  base: {
    service: env.OTEL_SERVICE_NAME,
    env: env.NODE_ENV,
  },
  formatters: {
    level: (label) => ({ level: label }),
  },
  redact: {
    paths: [
      "*.password",
      "*.hashedPassword",
      "*.token",
      "*.access_token",
      "*.refresh_token",
      "*.id_token",
      "*.apiKey",
      "*.authorization",
      "req.headers.authorization",
      "req.headers.cookie",
    ],
    censor: "[REDACTED]",
  },
  transport: isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:HH:MM:ss",
          ignore: "pid,hostname,service,env",
        },
      }
    : undefined,
});

function adapt(p: PinoLogger): Logger {
  return {
    fatal: (obj, msg) => p.fatal(obj as object, msg),
    error: (obj, msg) => p.error(obj as object, msg),
    warn: (obj, msg) => p.warn(obj as object, msg),
    info: (obj, msg) => p.info(obj as object, msg),
    debug: (obj, msg) => p.debug(obj as object, msg),
    trace: (obj, msg) => p.trace(obj as object, msg),
    child: (bindings) => adapt(p.child(bindings)),
  };
}

export const logger: Logger = adapt(baseLogger);
