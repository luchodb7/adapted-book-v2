import { headers } from "next/headers";
import { auth } from "@/modules/auth/infrastructure/authjs";
import { prisma } from "@/lib/prisma/client";
import {
  ForbiddenError,
  TenantMismatchError,
  UnauthorizedError,
} from "@/core/errors/app-error";
import type { Role } from "@prisma/client";
import type { TenantContext } from "./tenant-context";

/**
 * RBAC: ordered from most privileged to least.
 * Higher index = lower privilege; OWNER > ADMIN > EDITOR > VIEWER.
 */
const roleOrder: Record<Role, number> = {
  OWNER: 0,
  ADMIN: 1,
  EDITOR: 2,
  VIEWER: 3,
};

export function hasMinimumRole(actual: Role, required: Role): boolean {
  return roleOrder[actual] <= roleOrder[required];
}

/**
 * Resolve the current tenant context from the session.
 * Throws UnauthorizedError if no valid session, ForbiddenError if no active
 * organization membership.
 */
export async function requireTenantContext(): Promise<TenantContext> {
  const session = await auth();
  if (!session?.user?.id) throw new UnauthorizedError();

  const organizationId = session.user.activeOrganizationId;
  if (!organizationId) {
    throw new ForbiddenError("You don't belong to any organization");
  }

  const headerStore = await headers();

  if (session.user.role) {
    return {
      userId: session.user.id,
      organizationId,
      role: session.user.role as TenantContext["role"],
      email: session.user.email,
      locale: session.user.locale ?? "en",
      ipAddress: headerStore.get("x-forwarded-for") ?? undefined,
      userAgent: headerStore.get("user-agent") ?? undefined,
    };
  }

  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.user.id,
      organizationId,
      status: "ACTIVE",
      deletedAt: null,
    },
    select: {
      userId: true,
      organizationId: true,
      role: true,
      user: { select: { email: true, locale: true } },
      organization: { select: { deletedAt: true } },
    },
  });

  if (!membership || membership.organization.deletedAt) {
    throw new ForbiddenError("Active membership not found for this organization");
  }

  return {
    userId: membership.userId,
    organizationId: membership.organizationId,
    role: membership.role,
    email: membership.user.email,
    locale: membership.user.locale,
    ipAddress: headerStore.get("x-forwarded-for") ?? undefined,
    userAgent: headerStore.get("user-agent") ?? undefined,
  };
}

/**
 * Assert the actor has at least the given role within the current tenant.
 */
export function requireRole(ctx: TenantContext, required: Role): void {
  if (!hasMinimumRole(ctx.role, required)) {
    throw new ForbiddenError(`Requires role ${required} or higher`);
  }
}

/**
 * Tenant boundary guard: ensure the resource being accessed belongs to the
 * actor's organization. This is the second line of defence on top of repository
 * queries that filter by organizationId.
 */
export function assertTenant(ctx: TenantContext, resourceOrgId: string): void {
  if (resourceOrgId !== ctx.organizationId) {
    throw new TenantMismatchError();
  }
}

/**
 * Convenience: combine context resolution + role check.
 */
export async function authorize(required: Role = "VIEWER"): Promise<TenantContext> {
  const ctx = await requireTenantContext();
  requireRole(ctx, required);
  return ctx;
}
