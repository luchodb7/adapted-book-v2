import { describe, expect, it, vi } from "vitest";
import {
  AppError,
  ForbiddenError,
  NotFoundError,
  TenantMismatchError,
  UnauthorizedError,
  toAppError,
} from "@/core/errors/app-error";
import { assertTenant, requireRole } from "@/shared/tenant/guards";
import type { TenantContext } from "@/shared/tenant/tenant-context";

const ctxOwner: TenantContext = {
  userId: "u1", organizationId: "org_a", role: "OWNER", email: "a@x", locale: "en",
};
const ctxViewer: TenantContext = {
  userId: "u2", organizationId: "org_a", role: "VIEWER", email: "v@x", locale: "en",
};

describe("tenant guards", () => {
  it("requireRole passes when actor has the role", () => {
    expect(() => requireRole(ctxOwner, "ADMIN")).not.toThrow();
  });

  it("requireRole throws ForbiddenError when actor is below required", () => {
    expect(() => requireRole(ctxViewer, "EDITOR")).toThrow(ForbiddenError);
  });

  it("assertTenant throws when org ids differ", () => {
    expect(() => assertTenant(ctxOwner, "org_b")).toThrow(TenantMismatchError);
  });

  it("assertTenant passes when org ids match", () => {
    expect(() => assertTenant(ctxOwner, "org_a")).not.toThrow();
  });
});

describe("AppError hierarchy", () => {
  it("toAppError preserves AppError subclasses", () => {
    const err = new NotFoundError("Story", "s1");
    expect(toAppError(err)).toBe(err);
  });

  it("toAppError wraps unknown values", () => {
    const wrapped = toAppError("boom");
    expect(wrapped).toBeInstanceOf(AppError);
    expect(wrapped.code).toBe("UNEXPECTED_ERROR");
  });

  it("each error has a sensible HTTP status", () => {
    expect(new UnauthorizedError().status).toBe(401);
    expect(new ForbiddenError().status).toBe(403);
    expect(new NotFoundError("X").status).toBe(404);
    expect(new TenantMismatchError().status).toBe(403);
  });

  it("serializes safely via toJSON (no stack leak)", () => {
    const err = new NotFoundError("Story", "s1");
    const json = err.toJSON();
    expect(json).toMatchObject({ code: "NOT_FOUND" });
    expect("stack" in json).toBe(false);
  });
});

describe("smoke: vitest mocks work", () => {
  it("uses a vi.fn()", () => {
    const fn = vi.fn(() => 42);
    expect(fn()).toBe(42);
    expect(fn).toHaveBeenCalledOnce();
  });
});
