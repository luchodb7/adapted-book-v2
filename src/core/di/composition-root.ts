import { Container } from "@/core/di/container";
import {
  AIProviderToken,
  AuditLoggerToken,
  ClockToken,
  LoggerToken,
  MembershipRepositoryToken,
  OrganizationRepositoryToken,
  PictogramServiceToken,
  PrismaToken,
  SocialStoryGeneratorToken,
  StoryExportServiceToken,
  StoryRepositoryToken,
  UserRepositoryToken,
} from "@/core/di/tokens";
import { logger } from "@/core/logger/logger";
import { prisma } from "@/lib/prisma/client";
import { PrismaStoryRepository } from "@/modules/stories/infrastructure/persistence/prisma-story-repository";
import { DefaultSocialStoryGenerator } from "@/modules/stories/infrastructure/services/default-social-story-generator";
import { PrismaOrganizationRepository } from "@/modules/organizations/infrastructure/persistence/prisma-organization-repository";
import { PrismaMembershipRepository } from "@/modules/organizations/infrastructure/persistence/prisma-membership-repository";
import { PrismaUserRepository } from "@/modules/users/infrastructure/persistence/prisma-user-repository";
import { ArasaacPictogramService } from "@/modules/pictograms/infrastructure/services/arasaac-pictogram-service";
import { ArasaacClient } from "@/modules/pictograms/infrastructure/services/arasaac-client";
import { AIProviderFactory } from "@/modules/ai/infrastructure/ai-provider-factory";
import { PrismaAuditLogger } from "@/modules/audit/infrastructure/prisma-audit-logger";
import { StoryExportService } from "@/modules/export/infrastructure/story-export-service";
import { env } from "@/core/types/env";

/**
 * Builds the application's root DI container.
 *
 * All wiring lives here so business modules never `new` their dependencies
 * directly. To swap an implementation (e.g. AI provider, repository) you only
 * touch this file and the corresponding env variable.
 */
export function buildContainer(): Container {
  const c = new Container();

  // ---------- Infrastructure ----------
  c.registerValue(PrismaToken, prisma);
  c.registerValue(LoggerToken, logger);
  c.registerValue(ClockToken, { now: () => new Date() });

  // ---------- Repositories ----------
  c.register(StoryRepositoryToken, (cc) => new PrismaStoryRepository(cc.resolve(PrismaToken)));
  c.register(
    OrganizationRepositoryToken,
    (cc) => new PrismaOrganizationRepository(cc.resolve(PrismaToken)),
  );
  c.register(
    MembershipRepositoryToken,
    (cc) => new PrismaMembershipRepository(cc.resolve(PrismaToken)),
  );
  c.register(UserRepositoryToken, (cc) => new PrismaUserRepository(cc.resolve(PrismaToken)));

  // ---------- Domain services ----------
  c.register(
    PictogramServiceToken,
    (cc) =>
      new ArasaacPictogramService(
        new ArasaacClient({
          baseUrl: env.ARASAAC_API_BASE_URL,
          staticUrl: env.ARASAAC_STATIC_URL,
          defaultLocale: env.ARASAAC_DEFAULT_LOCALE,
          cacheTtlSeconds: env.ARASAAC_CACHE_TTL_SECONDS,
          logger: cc.resolve(LoggerToken).child({ component: "ArasaacClient" }),
        }),
        cc.resolve(LoggerToken),
      ),
  );

  c.register(
    SocialStoryGeneratorToken,
    (cc) =>
      new DefaultSocialStoryGenerator(
        cc.resolve(PictogramServiceToken),
        cc.resolve(LoggerToken).child({ component: "SocialStoryGenerator" }),
      ),
  );

  c.register(AIProviderToken, (cc) =>
    AIProviderFactory.create({
      provider: env.AI_PROVIDER,
      logger: cc.resolve(LoggerToken),
    }),
  );

  c.register(AuditLoggerToken, (cc) => new PrismaAuditLogger(cc.resolve(PrismaToken)));

  c.register(StoryExportServiceToken, (cc) =>
    new StoryExportService(cc.resolve(StoryRepositoryToken), cc.resolve(LoggerToken)),
  );

  return c;
}

declare global {
  // eslint-disable-next-line no-var
  var __container: Container | undefined;
}

export function getContainer(): Container {
  if (!globalThis.__container) {
    globalThis.__container = buildContainer();
  }
  return globalThis.__container;
}
