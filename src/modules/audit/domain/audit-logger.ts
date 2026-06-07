import type { AuditAction } from "@prisma/client";

export interface AuditLogEntry {
  organizationId?: string | null;
  userId?: string | null;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

/**
 * AuditLogger — single, fire-and-forget interface for recording security and
 * compliance-relevant events. Implementations MUST never throw to the caller;
 * audit failures are observability concerns, not request-flow concerns.
 */
export interface AuditLogger {
  log(entry: AuditLogEntry): Promise<void>;
}
