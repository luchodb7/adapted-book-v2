import type { PrismaClient } from "@prisma/client";
import type { OrganizationRepository } from "@/modules/organizations/domain/repositories/organization-repository";
import { Organization } from "@/modules/organizations/domain/entities/organization";

export class PrismaOrganizationRepository implements OrganizationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Organization | null> {
    const row = await this.prisma.organization.findFirst({
      where: { id, deletedAt: null },
    });
    return row ? this.toDomain(row) : null;
  }

  async findBySlug(slug: string): Promise<Organization | null> {
    const row = await this.prisma.organization.findFirst({
      where: { slug, deletedAt: null },
    });
    return row ? this.toDomain(row) : null;
  }

  async findByUserId(userId: string): Promise<Organization[]> {
    const rows = await this.prisma.organization.findMany({
      where: {
        deletedAt: null,
        memberships: {
          some: { userId, status: "ACTIVE", deletedAt: null },
        },
      },
      orderBy: { name: "asc" },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async save(organization: Organization): Promise<void> {
    const data = organization.toJSON();
    await this.prisma.organization.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        name: data.name,
        slug: data.slug,
        logoUrl: data.logoUrl,
        description: data.description,
        website: data.website,
        locale: data.locale,
        timezone: data.timezone,
        settings: data.settings as object,
      },
      update: {
        name: data.name,
        slug: data.slug,
        logoUrl: data.logoUrl,
        description: data.description,
        website: data.website,
        locale: data.locale,
        timezone: data.timezone,
        settings: data.settings as object,
        deletedAt: data.deletedAt,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.organization.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private toDomain(row: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    description: string | null;
    website: string | null;
    locale: string;
    timezone: string;
    settings: unknown;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }): Organization {
    return Organization.fromPersistence({
      id: row.id,
      name: row.name,
      slug: row.slug,
      logoUrl: row.logoUrl,
      description: row.description,
      website: row.website,
      locale: row.locale,
      timezone: row.timezone,
      settings: (row.settings as Record<string, unknown>) ?? {},
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    });
  }
}
