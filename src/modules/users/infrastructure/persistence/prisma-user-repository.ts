import type { PrismaClient } from "@prisma/client";
import type { UserRepository } from "@/modules/users/domain/repositories/user-repository";
import { User } from "@/modules/users/domain/entities/user";

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });
    return row ? this.toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.prisma.user.findFirst({
      where: { email: email.toLowerCase(), deletedAt: null },
    });
    return row ? this.toDomain(row) : null;
  }

  async save(user: User): Promise<void> {
    const data = user.toJSON();
    await this.prisma.user.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        email: data.email,
        emailVerified: data.emailVerified,
        hashedPassword: data.hashedPassword,
        name: data.name,
        image: data.image,
        locale: data.locale,
        timezone: data.timezone,
        preferences: data.preferences as object,
      },
      update: {
        emailVerified: data.emailVerified,
        hashedPassword: data.hashedPassword,
        name: data.name,
        image: data.image,
        locale: data.locale,
        timezone: data.timezone,
        preferences: data.preferences as object,
        lastLoginAt: data.lastLoginAt,
        failedLoginAttempts: data.failedLoginAttempts,
        lockedUntil: data.lockedUntil,
        deletedAt: data.deletedAt,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private toDomain(row: Awaited<ReturnType<PrismaClient["user"]["findUnique"]>>): User {
    if (!row) throw new Error("User row is null");
    return User.fromPersistence({
      id: row.id,
      email: row.email,
      emailVerified: row.emailVerified,
      hashedPassword: row.hashedPassword,
      name: row.name,
      image: row.image,
      locale: row.locale,
      timezone: row.timezone,
      preferences: (row.preferences as Record<string, unknown>) ?? {},
      lastLoginAt: row.lastLoginAt,
      failedLoginAttempts: row.failedLoginAttempts,
      lockedUntil: row.lockedUntil,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    });
  }
}
