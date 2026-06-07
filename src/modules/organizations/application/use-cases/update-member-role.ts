import { z } from "zod";
import type { Role } from "@prisma/client";
import { ConflictError, ForbiddenError, NotFoundError } from "@/core/errors/app-error";
import { authorize } from "@/shared/auth/authorize";
import type { TenantContext } from "@/shared/tenant/tenant-context";
import type { MembershipRepository } from "@/modules/organizations/domain/repositories/membership-repository";
import type { OrganizationRepository } from "@/modules/organizations/domain/repositories/organization-repository";
import type { UserRepository } from "@/modules/users/domain/repositories/user-repository";
import type { AuditLogger } from "@/modules/audit/domain/audit-logger";
import { parseInput } from "@/core/validation/parse";

const inputSchema = z.object({
  membershipId: z.string(),
  newRole: z.enum(["OWNER", "ADMIN", "EDITOR", "VIEWER"]),
});

export class UpdateMemberRoleUseCase {
  constructor(
    private readonly memberships: MembershipRepository,
    private readonly organizations: OrganizationRepository,
    private readonly users: UserRepository,
    private readonly audit: AuditLogger,
  ) {}

  async execute(ctx: TenantContext, input: unknown): Promise<void> {
    const data = parseInput(inputSchema, input);
    authorize(ctx, "members.update");

    const target = await this.memberships.findById(data.membershipId);
    if (!target) throw new NotFoundError("Membership", data.membershipId);
    if (target.organizationId !== ctx.organizationId) {
      throw new ForbiddenError("Membership does not belong to this organization");
    }

    if (data.newRole === "OWNER") {
      authorize(ctx, "members.changeOwner");
    }

    if (target.role === "OWNER" && data.newRole !== "OWNER") {
      const owners = await this.memberships.countByRole(ctx.organizationId, "OWNER");
      if (owners <= 1) {
        throw new ConflictError("Cannot demote the last OWNER. Transfer ownership first.");
      }
    }

    const previousRole = target.role;
    target.changeRole(data.newRole as Role);
    await this.memberships.save(target);

    await this.audit.log({
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      action: "PERMISSION_CHANGE",
      resource: "Membership",
      resourceId: target.id,
      metadata: { previousRole, newRole: data.newRole, targetUserId: target.userId },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });
  }
}
