import type { PrismaClient, Role } from "@prisma/client";
import type { MembershipRepository } from "@/modules/organizations/domain/repositories/membership-repository";
import { Membership } from "@/modules/organizations/domain/entities/membership";

export class PrismaMembershipRepository implements MembershipRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Membership | null> {
    const row = await this.prisma.membership.findFirst({
      where: { id, deletedAt: null },
    });
    return row ? this.toDomain(row) : null;
  }

  async findByUserAndOrg(userId: string, organizationId: string): Promise<Membership | null> {
    const row = await this.prisma.membership.findFirst({
      where: { userId, organizationId, deletedAt: null },
    });
    return row ? this.toDomain(row) : null;
  }

  async listByOrganization(
    organizationId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<{ items: Membership[]; total: number }> {
    const [rows, total] = await Promise.all([
      this.prisma.membership.findMany({
        where: { organizationId, deletedAt: null },
        orderBy: { joinedAt: "asc" },
        take: options?.limit ?? 50,
        skip: options?.offset ?? 0,
      }),
      this.prisma.membership.count({
        where: { organizationId, deletedAt: null },
      }),
    ]);
    return { items: rows.map((r) => this.toDomain(r)), total };
  }

  async countByRole(organizationId: string, role: Role): Promise<number> {
    return this.prisma.membership.count({
      where: { organizationId, role, status: "ACTIVE", deletedAt: null },
    });
  }

  async save(membership: Membership): Promise<void> {
    const data = membership.toJSON();
    await this.prisma.membership.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        userId: data.userId,
        organizationId: data.organizationId,
        role: data.role,
        status: data.status,
      },
      update: {
        role: data.role,
        status: data.status,
        deletedAt: data.deletedAt,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.membership.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private toDomain(row: {
    id: string;
    userId: string;
    organizationId: string;
    role: Role;
    status: "ACTIVE" | "INVITED" | "SUSPENDED";
    joinedAt: Date;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }): Membership {
    return Membership.fromPersistence({
      id: row.id,
      userId: row.userId,
      organizationId: row.organizationId,
      role: row.role,
      status: row.status,
      joinedAt: row.joinedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    });
  }
}
