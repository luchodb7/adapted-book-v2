import type { Role } from "@prisma/client";

/**
 * Tenant context: the snapshot of "who is acting on behalf of which org" that
 * accompanies every request through the application layer.
 *
 * Created by the auth/tenant middleware and propagated explicitly into use
 * cases (never read from a global). Explicit propagation prevents cross-request
 * leakage in Server Actions / Route Handlers.
 */
export interface TenantContext {
  readonly userId: string;
  readonly organizationId: string;
  readonly role: Role;
  readonly email: string;
  readonly locale: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;
}

export interface AnonymousContext {
  readonly userId: null;
  readonly organizationId: null;
  readonly role: null;
  readonly ipAddress?: string;
  readonly userAgent?: string;
}

export type RequestContext = TenantContext | AnonymousContext;

export const isAuthenticated = (ctx: RequestContext): ctx is TenantContext =>
  ctx.userId !== null && ctx.organizationId !== null;
