import { describe, expect, it, vi } from "vitest";
import { prisma as prismaModule } from "@/lib/prisma/client";
import { PrismaOrganizationRepository } from "@/modules/organizations/infrastructure/persistence/prisma-organization-repository";

vi.mock("@/lib/prisma/client", () => ({ prisma: { organization: {}, membership: {} } }));

describe("tenant isolation at the repository layer", () => {
  it("every find* call is scoped by organizationId", async () => {
    const findMany = vi.fn(async () => []);
    const findFirst = vi.fn(async () => null);
    (prismaModule.organization as unknown as { findMany: typeof findMany }).findMany = findMany;
    (prismaModule.organization as unknown as { findFirst: typeof findFirst }).findFirst = findFirst;

    const repo = new PrismaOrganizationRepository();
    await repo.findAll("org1");
    expect(findMany).toHaveBeenCalledWith({ where: { id: "org1", status: { not: "DELETED" } } });

    await repo.findBySlug("acme", "org1");
    expect(findFirst).toHaveBeenCalledWith({ where: { slug: "acme", id: "org1" } });
  });

  it("membership repository only ever queries memberships for the tenant", async () => {
    const findMany = vi.fn(async () => []);
    (prismaModule.membership as unknown as { findMany: typeof findMany }).findMany = findMany;
    const { PrismaMembershipRepository } = await import(
      "@/modules/organizations/infrastructure/persistence/prisma-membership-repository"
    );
    const repo = new PrismaMembershipRepository();
    await repo.listByOrganization("org1");
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ organizationId: "org1" }) }),
    );
  });
});
