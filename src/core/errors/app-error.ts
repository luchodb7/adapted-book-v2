/**
 * Application-wide error hierarchy.
 *
 * Domain & application errors are *expected* failures with a stable code/message
 * that can be safely surfaced to the client. Anything else is an
 * `UnexpectedError` and must be treated as a 5xx by the presentation layer.
 */

export type AppErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "TENANT_MISMATCH"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "EXTERNAL_SERVICE_ERROR"
  | "AI_PROVIDER_ERROR"
  | "FEATURE_DISABLED"
  | "QUOTA_EXCEEDED"
  | "UNEXPECTED_ERROR";

export interface AppErrorOptions {
  code: AppErrorCode;
  message: string;
  status: number;
  cause?: unknown;
  details?: Record<string, unknown>;
}

export class AppError extends Error {
  public readonly code: AppErrorCode;
  public readonly status: number;
  public readonly details?: Record<string, unknown>;
  public override readonly cause?: unknown;

  constructor(options: AppErrorOptions) {
    super(options.message);
    this.name = this.constructor.name;
    this.code = options.code;
    this.status = options.status;
    this.details = options.details;
    this.cause = options.cause;
    Error.captureStackTrace?.(this, this.constructor);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

export class ValidationError extends AppError {
  constructor(message = "Invalid input", details?: Record<string, unknown>) {
    super({ code: "VALIDATION_ERROR", message, status: 422, details });
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super({
      code: "NOT_FOUND",
      message: id ? `${resource} ${id} not found` : `${resource} not found`,
      status: 404,
      details: { resource, id },
    });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super({ code: "UNAUTHORIZED", message, status: 401 });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You don't have permission to perform this action") {
    super({ code: "FORBIDDEN", message, status: 403 });
  }
}

export class TenantMismatchError extends AppError {
  constructor(message = "Resource does not belong to your organization") {
    super({ code: "TENANT_MISMATCH", message, status: 403 });
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super({ code: "CONFLICT", message, status: 409, details });
  }
}

export class RateLimitedError extends AppError {
  constructor(retryAfterSeconds?: number) {
    super({
      code: "RATE_LIMITED",
      message: "Too many requests, please slow down",
      status: 429,
      details: { retryAfterSeconds },
    });
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, cause?: unknown) {
    super({
      code: "EXTERNAL_SERVICE_ERROR",
      message: `Upstream service '${service}' is unavailable`,
      status: 502,
      cause,
      details: { service },
    });
  }
}

export class AIProviderError extends AppError {
  constructor(provider: string, reason: string, cause?: unknown) {
    super({
      code: "AI_PROVIDER_ERROR",
      message: `AI provider '${provider}' failed: ${reason}`,
      status: 502,
      cause,
      details: { provider, reason },
    });
  }
}

export class FeatureDisabledError extends AppError {
  constructor(feature: string) {
    super({
      code: "FEATURE_DISABLED",
      message: `Feature '${feature}' is not enabled for this organization`,
      status: 403,
      details: { feature },
    });
  }
}

export class QuotaExceededError extends AppError {
  constructor(metric: string, limit: number) {
    super({
      code: "QUOTA_EXCEEDED",
      message: `Quota exceeded for ${metric} (limit: ${limit})`,
      status: 402,
      details: { metric, limit },
    });
  }
}

export class UnexpectedError extends AppError {
  constructor(message = "An unexpected error occurred", cause?: unknown) {
    super({ code: "UNEXPECTED_ERROR", message, status: 500, cause });
  }
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (error instanceof Error) {
    return new UnexpectedError(error.message, error);
  }
  return new UnexpectedError(String(error));
}
