import type { Role } from "@prisma/client";

/**
 * Static catalogue of permissions used throughout the application.
 *
 * Keep this list in sync with the docs (docs/RBAC.md). Each permission has a
 * single, canonical role minimum. Resource-level ownership rules are layered
 * on top in the use cases (e.g. EDITORs may only edit stories they created).
 */

export const PERMISSIONS = {
  // Organization
  "organization.view": "VIEWER",
  "organization.update": "ADMIN",
  "organization.delete": "OWNER",
  "organization.transferOwnership": "OWNER",

  // Members
  "members.view": "VIEWER",
  "members.invite": "ADMIN",
  "members.update": "ADMIN",
  "members.remove": "ADMIN",
  "members.changeOwner": "OWNER",

  // Stories
  "stories.view": "VIEWER",
  "stories.create": "EDITOR",
  "stories.update": "EDITOR",
  "stories.delete": "ADMIN",
  "stories.publish": "EDITOR",
  "stories.export": "VIEWER",
  "stories.duplicate": "EDITOR",

  // AI
  "ai.generate": "EDITOR",
  "ai.viewHistory": "ADMIN",
  "ai.configurePrompts": "ADMIN",

  // Subscriptions
  "subscription.view": "ADMIN",
  "subscription.update": "OWNER",
  "subscription.cancel": "OWNER",

  // Audit
  "audit.view": "ADMIN",
} as const satisfies Record<string, Role>;

export type Permission = keyof typeof PERMISSIONS;

const roleOrder: Record<Role, number> = { OWNER: 0, ADMIN: 1, EDITOR: 2, VIEWER: 3 };

export function can(actorRole: Role, permission: Permission): boolean {
  const required = PERMISSIONS[permission];
  return roleOrder[actorRole] <= roleOrder[required];
}

export function requiredRoleFor(permission: Permission): Role {
  return PERMISSIONS[permission];
}
