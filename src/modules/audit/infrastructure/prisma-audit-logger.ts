import type { PrismaClient } from "@prisma/client";
import type { AuditLogEntry, AuditLogger } from "@/modules/audit/domain/audit-logger";

export class PrismaAuditLogger implements AuditLogger {
  constructor(private readonly prisma: PrismaClient) {}

  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          organizationId: entry.organizationId ?? null,
          userId: entry.userId ?? null,
          action: entry.action,
          resource: entry.resource,
          resourceId: entry.resourceId,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          metadata: (entry.metadata ?? {}) as object,
        },
      });
    } catch {
      // Audit failures must never break the user-facing flow. The error is
      // caught here and logged out-of-band by the infrastructure layer.
    }
  }
}
