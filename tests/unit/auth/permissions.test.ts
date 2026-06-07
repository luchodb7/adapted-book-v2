import { describe, expect, it } from "vitest";
import { can, requiredRoleFor } from "@/shared/auth/permissions";
import { hasMinimumRole } from "@/shared/tenant/guards";

describe("RBAC", () => {
  it("OWNER has every permission", () => {
    expect(can("OWNER", "organization.delete")).toBe(true);
    expect(can("OWNER", "stories.create")).toBe(true);
    expect(can("OWNER", "audit.view")).toBe(true);
  });

  it("ADMIN cannot delete the organization but can manage members", () => {
    expect(can("ADMIN", "organization.delete")).toBe(false);
    expect(can("ADMIN", "members.invite")).toBe(true);
  });

  it("EDITOR can create stories but not delete them", () => {
    expect(can("EDITOR", "stories.create")).toBe(true);
    expect(can("EDITOR", "stories.delete")).toBe(false);
  });

  it("VIEWER can only read", () => {
    expect(can("VIEWER", "stories.view")).toBe(true);
    expect(can("VIEWER", "stories.create")).toBe(false);
    expect(can("VIEWER", "members.invite")).toBe(false);
  });

  it("requiredRoleFor returns the canonical minimum role", () => {
    expect(requiredRoleFor("stories.create")).toBe("EDITOR");
    expect(requiredRoleFor("organization.delete")).toBe("OWNER");
  });

  it("hasMinimumRole respects ordering OWNER > ADMIN > EDITOR > VIEWER", () => {
    expect(hasMinimumRole("OWNER", "VIEWER")).toBe(true);
    expect(hasMinimumRole("VIEWER", "EDITOR")).toBe(false);
    expect(hasMinimumRole("ADMIN", "ADMIN")).toBe(true);
  });
});
