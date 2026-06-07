import { ForbiddenError } from "@/core/errors/app-error";
import type { TenantContext } from "@/shared/tenant/tenant-context";
import { can, type Permission } from "./permissions";

/**
 * Assert that the actor has the given permission within the current tenant.
 * Use this in use-cases and server actions for declarative authorization.
 */
export function authorize(ctx: TenantContext, permission: Permission): void {
  if (!can(ctx.role, permission)) {
    throw new ForbiddenError(`Permission denied: ${permission}`);
  }
}

export function authorizeAny(ctx: TenantContext, permissions: Permission[]): void {
  if (!permissions.some((p) => can(ctx.role, p))) {
    throw new ForbiddenError(`Permission denied: requires one of [${permissions.join(", ")}]`);
  }
}

export function authorizeAll(ctx: TenantContext, permissions: Permission[]): void {
  const missing = permissions.filter((p) => !can(ctx.role, p));
  if (missing.length > 0) {
    throw new ForbiddenError(`Permission denied: missing [${missing.join(", ")}]`);
  }
}
