import type { BillingInterval, SubscriptionStatus } from "@prisma/client";

/**
 * SubscriptionPlan — read-only catalogue entity. Mutated only via admin tools
 * / migrations.
 */
export interface SubscriptionPlan {
  id: string;
  key: string;
  name: string;
  description: string | null;
  priceMonthlyUsd: number;
  priceYearlyUsd: number;
  features: PlanFeatures;
  limits: PlanLimits;
  isActive: boolean;
}

export interface PlanFeatures {
  aiStoryGeneration?: boolean;
  textSimplification?: boolean;
  routineGeneration?: boolean;
  visualSchedules?: boolean;
  prioritySupport?: boolean;
  customBranding?: boolean;
}

export interface PlanLimits {
  maxStoriesPerMonth: number | null;
  maxAiGenerationsPerMonth: number | null;
  maxMembers: number | null;
  maxStorageMb: number | null;
}

export interface OrganizationSubscription {
  id: string;
  organizationId: string;
  planId: string;
  status: SubscriptionStatus;
  billingInterval: BillingInterval;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEndsAt: Date | null;
}

export interface UsageSnapshot {
  organizationId: string;
  periodStart: Date;
  periodEnd: Date;
  storiesCreated: number;
  aiGenerations: number;
  pdfExports: number;
  pictogramLookups: number;
  storageBytes: number;
}

/**
 * Quota enforcement helper. Returns true if `current` is below `limit`, or
 * if `limit` is null (= unlimited).
 */
export function withinQuota(current: number, limit: number | null): boolean {
  return limit === null || current < limit;
}
