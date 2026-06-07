"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/modules/auth/infrastructure/authjs";
import { prisma } from "@/lib/prisma/client";
import { hashPassword } from "@/modules/auth/infrastructure/security/password";
import { signInSchema, signUpSchema } from "@/modules/auth/domain/schemas";
import { logger } from "@/core/logger/logger";
import { rateLimit } from "@/lib/rate-limit/rate-limit";
import { generateSlug } from "@/lib/utils/slug";
import type { ActionResult } from "@/shared/auth/action-result";

const log = logger.child({ component: "auth.actions" });

export async function signInAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = signInSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", message: "Please enter a valid email and password" };
  }

  const ip = formData.get("__clientHint") as string | null;
  const limit = await rateLimit({ key: `signin:${parsed.data.email}:${ip ?? "unknown"}`, kind: "auth" });
  if (!limit.allowed) {
    return { status: "error", message: "Too many sign-in attempts. Please try again later." };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      log.warn({ event: "auth.signin.failed", type: error.type });
      return { status: "error", message: "Invalid email or password" };
    }
    throw error;
  }

  redirect("/app");
}

export async function signUpAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    organizationName: formData.get("organizationName"),
    acceptTerms: formData.get("acceptTerms") === "on",
  };

  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid input";
    return { status: "error", message };
  }

  const ip = (formData.get("__clientHint") as string | null) ?? "unknown";
  const limit = await rateLimit({ key: `signup:${ip}`, kind: "auth" });
  if (!limit.allowed) {
    return { status: "error", message: "Too many registration attempts. Please try again later." };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return { status: "error", message: "An account with this email already exists" };
  }

  const hashed = await hashPassword(parsed.data.password);
  const slug = await generateSlug(parsed.data.organizationName, async (s) =>
    Boolean(await prisma.organization.findUnique({ where: { slug: s } })),
  );

  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: parsed.data.email,
          name: parsed.data.name,
          hashedPassword: hashed,
        },
      });

      const org = await tx.organization.create({
        data: {
          name: parsed.data.organizationName,
          slug,
        },
      });

      await tx.membership.create({
        data: {
          userId: user.id,
          organizationId: org.id,
          role: "OWNER",
          status: "ACTIVE",
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: org.id,
          userId: user.id,
          action: "CREATE",
          resource: "Organization",
          resourceId: org.id,
        },
      });
    });
  } catch (error) {
    log.error({ event: "auth.signup.failed", err: error });
    return { status: "error", message: "Could not create your account. Please try again." };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch {
    return { status: "success", message: "Account created. Please sign in." };
  }

  redirect("/app");
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
  revalidatePath("/", "layout");
}
