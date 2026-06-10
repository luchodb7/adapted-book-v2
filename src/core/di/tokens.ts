import { createToken } from "./container";
import type { Logger } from "@/core/logger/logger";
import type { PrismaClient } from "@prisma/client";

/**
 * Application-wide DI tokens.
 *
 * Modules export their own tokens for their public interfaces; this file lists
 * cross-cutting infrastructure tokens used by multiple modules.
 */

// ---------- Infrastructure ----------
export const PrismaToken = createToken<PrismaClient>("PrismaClient");
export const LoggerToken = createToken<Logger>("Logger");
export const ClockToken = createToken<{ now(): Date }>("Clock");

// ---------- AI ----------
import type { AIProvider } from "@/modules/ai/domain/providers/ai-provider";
export const AIProviderToken = createToken<AIProvider>("AIProvider");

// ---------- Stories ----------
import type { StoryRepository } from "@/modules/stories/domain/repositories/story-repository";
import type { SocialStoryGenerator } from "@/modules/stories/domain/services/social-story-generator";
export const StoryRepositoryToken = createToken<StoryRepository>("StoryRepository");
export const SocialStoryGeneratorToken = createToken<SocialStoryGenerator>("SocialStoryGenerator");

// ---------- Pictograms ----------
import type { PictogramService } from "@/modules/pictograms/domain/services/pictogram-service";
export const PictogramServiceToken = createToken<PictogramService>("PictogramService");

// ---------- Organizations & Users ----------
import type { OrganizationRepository } from "@/modules/organizations/domain/repositories/organization-repository";
import type { UserRepository } from "@/modules/users/domain/repositories/user-repository";
import type { MembershipRepository } from "@/modules/organizations/domain/repositories/membership-repository";
export const OrganizationRepositoryToken = createToken<OrganizationRepository>("OrganizationRepository");
export const UserRepositoryToken = createToken<UserRepository>("UserRepository");
export const MembershipRepositoryToken = createToken<MembershipRepository>("MembershipRepository");

// ---------- Audit ----------
import type { AuditLogger } from "@/modules/audit/domain/audit-logger";
export const AuditLoggerToken = createToken<AuditLogger>("AuditLogger");

// ---------- Export ----------
import type { IStoryExportService } from "@/modules/export/domain/story-export-service";
export const StoryExportServiceToken = createToken<IStoryExportService>("StoryExportService");
