/**
 * Seed script — populates the database with:
 *   - Subscription plan (FREE)
 *   - Demo organization (Acme Education)
 *   - Demo owner / editor / viewer users
 *   - 3 sample social stories with ARASAAC pictograms
 *
 * Idempotent: re-running does not duplicate rows.
 *
 * Run with: pnpm run seed
 */

import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_OWNER_EMAIL = "demo@adaptedbooks.app";
const DEMO_EDITOR_EMAIL = "editor@adaptedbooks.app";
const DEMO_VIEWER_EMAIL = "viewer@adaptedbooks.app";
const DEMO_PASSWORD = "Demo12345!";

const ORG_NAME = "Acme Education";
const ORG_SLUG = "acme-education";

const ARASAAC_BASE = process.env.ARASAAC_STATIC_URL ?? "https://static.arasaac.org";
const picto = (id: number) => `${ARASAAC_BASE}/${id}/${id}_500.png`;

async function upsertPlan() {
  return prisma.subscriptionPlan.upsert({
    where: { key: "FREE" },
    update: {},
    create: {
      key: "FREE",
      name: "Free",
      description: "Up to 10 stories, single organization, community support.",
      priceMonthlyUsd: 0,
      priceYearlyUsd: 0,
      isActive: true,
      features: ["social_stories", "arasaac_pictograms", "pdf_export", "zip_export"],
      limits: {
        maxStories: 10,
        maxMembers: 3,
        maxPictogramsPerMonth: 500,
        maxAiGenerationsPerMonth: 50,
        maxExportsPerMonth: 20,
      },
    },
  });
}

async function upsertOrganization() {
  return prisma.organization.upsert({
    where: { slug: ORG_SLUG },
    update: {},
    create: {
      name: ORG_NAME,
      slug: ORG_SLUG,
      status: "ACTIVE",
      settings: {
        locale: "en",
        theme: "system",
        highContrast: false,
        textSize: "default",
      },
    },
  });
}

async function upsertUser(email: string, name: string) {
  const passwordHash = await hash(DEMO_PASSWORD, 12);
  return prisma.user.upsert({
    where: { email },
    update: { name },
    create: {
      email,
      name,
      emailVerified: new Date(),
      passwordHash,
      accounts: {
        create: {
          type: "credentials",
          provider: "credentials",
          providerAccountId: email,
        },
      },
    },
  });
}

async function upsertMembership(userId: string, organizationId: string, role: "OWNER" | "ADMIN" | "EDITOR" | "VIEWER") {
  const existing = await prisma.membership.findFirst({ where: { userId, organizationId } });
  if (existing) return existing;
  return prisma.membership.create({
    data: { userId, organizationId, role, status: "ACTIVE" },
  });
}

async function upsertSubscription(organizationId: string, planId: string) {
  const existing = await prisma.organizationSubscription.findUnique({ where: { organizationId } });
  if (existing) return existing;
  return prisma.organizationSubscription.create({
    data: {
      organizationId,
      planId,
      status: "ACTIVE",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });
}

type SampleStory = {
  slug: string;
  title: string;
  language: string;
  targetAge: number;
  status: "DRAFT" | "PUBLISHED";
  text: string;
  pages: { text: string; pictogramId: number | null; pictogramKeyword: string | null }[];
};

const SAMPLE_STORIES: SampleStory[] = [
  {
    slug: "going-to-the-dentist",
    title: "Going to the Dentist",
    language: "en",
    targetAge: 6,
    status: "PUBLISHED",
    text: "I am going to the dentist. The dentist is friendly. I will sit in the chair. The dentist will look at my teeth. I will be brave. I will get a sticker.",
    pages: [
      { text: "I am going to the dentist.", pictogramId: 2514, pictogramKeyword: "dentist" },
      { text: "The dentist is friendly.", pictogramId: 4107, pictogramKeyword: "friendly" },
      { text: "I will sit in the chair.", pictogramId: 1783, pictogramKeyword: "chair" },
      { text: "The dentist will look at my teeth.", pictogramId: 4422, pictogramKeyword: "teeth" },
      { text: "I will be brave.", pictogramId: 1289, pictogramKeyword: "brave" },
      { text: "I will get a sticker.", pictogramId: 3461, pictogramKeyword: "sticker" },
    ],
  },
  {
    slug: "sharing-toys-at-school",
    title: "Sharing Toys at School",
    language: "en",
    targetAge: 5,
    status: "PUBLISHED",
    text: "I am at school with my friends. We have lots of toys. Sometimes I want a toy my friend has. I can ask nicely. My friend can say yes or no. We can take turns. Sharing makes us happy.",
    pages: [
      { text: "I am at school with my friends.", pictogramId: 518, pictogramKeyword: "school" },
      { text: "We have lots of toys.", pictogramId: 900, pictogramKeyword: "toys" },
      { text: "I can ask nicely.", pictogramId: 1135, pictogramKeyword: "ask" },
      { text: "We can take turns.", pictogramId: 2418, pictogramKeyword: "turn" },
      { text: "Sharing makes us happy.", pictogramId: 1320, pictogramKeyword: "happy" },
    ],
  },
  {
    slug: "washing-my-hands",
    title: "Washing My Hands",
    language: "en",
    targetAge: 4,
    status: "DRAFT",
    text: "My hands can get dirty. I will wash them. I turn on the tap. I use soap. I rub my hands. I rinse. I dry. My hands are clean.",
    pages: [
      { text: "My hands can get dirty.", pictogramId: 1820, pictogramKeyword: "dirty" },
      { text: "I turn on the tap.", pictogramId: 3041, pictogramKeyword: "tap" },
      { text: "I use soap.", pictogramId: 3602, pictogramKeyword: "soap" },
      { text: "I rub my hands.", pictogramId: 2190, pictogramKeyword: "rub" },
      { text: "I dry my hands.", pictogramId: 1275, pictogramKeyword: "dry" },
      { text: "My hands are clean.", pictogramId: 905, pictogramKeyword: "clean" },
    ],
  },
];

async function upsertSampleStory(organizationId: string, createdById: string, s: SampleStory) {
  const existing = await prisma.story.findUnique({
    where: { organizationId_slug: { organizationId, slug: s.slug } },
  });
  if (existing) return existing;

  return prisma.story.create({
    data: {
      organizationId,
      createdById,
      title: s.title,
      slug: s.slug,
      originalText: s.text,
      adaptedText: s.text,
      language: s.language,
      targetAge: s.targetAge,
      visibility: "ORGANIZATION",
      status: s.status,
      publishedAt: s.status === "PUBLISHED" ? new Date() : null,
      pages: {
        create: s.pages.map((p, i) => ({
          order: i,
          text: p.text,
          pictogramId: p.pictogramId?.toString() ?? null,
          pictogramKeyword: p.pictogramKeyword,
          pictogramUrl: p.pictogramId ? picto(p.pictogramId) : null,
          layout: "text-top",
        })),
      },
    },
  });
}

async function main() {
  console.log("→ Seeding plans…");
  const plan = await upsertPlan();

  console.log("→ Seeding organization…");
  const org = await upsertOrganization();

  console.log(`→ Seeding users (password: ${DEMO_PASSWORD})…`);
  const owner = await upsertUser(DEMO_OWNER_EMAIL, "Demo Owner");
  const editor = await upsertUser(DEMO_EDITOR_EMAIL, "Demo Editor");
  const viewer = await upsertUser(DEMO_VIEWER_EMAIL, "Demo Viewer");

  console.log("→ Linking memberships…");
  await upsertMembership(owner.id, org.id, "OWNER");
  await upsertMembership(editor.id, org.id, "EDITOR");
  await upsertMembership(viewer.id, org.id, "VIEWER");

  console.log("→ Assigning subscription…");
  await upsertSubscription(org.id, plan.id);

  console.log("→ Creating sample stories…");
  for (const s of SAMPLE_STORIES) {
    await upsertSampleStory(org.id, owner.id, s);
  }

  console.log("\n✔ Seed complete.");
  console.log(`  Demo login: ${DEMO_OWNER_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error("✖ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
