import NextAuth, { type DefaultSession, type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma/client";
import { env } from "@/core/types/env";
import { verifyPassword } from "@/modules/auth/infrastructure/security/password";
import { signInSchema } from "@/modules/auth/domain/schemas";
import { logger } from "@/core/logger/logger";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      locale?: string | null;
      activeOrganizationId?: string | null;
      role?: string | null;
    } & DefaultSession["user"];
  }
}

const log = logger.child({ component: "auth" });

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

const providers: NextAuthConfig["providers"] = [
  Credentials({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const parsed = signInSchema.safeParse(credentials);
      if (!parsed.success) {
        log.warn({ event: "auth.credentials.invalid_input" });
        return null;
      }

      const { email, password } = parsed.data;
      const user = await prisma.user.findUnique({
        where: { email, deletedAt: null },
      });

      if (!user || !user.hashedPassword) {
        log.warn({ event: "auth.credentials.unknown_user", email });
        return null;
      }

      if (user.lockedUntil && user.lockedUntil > new Date()) {
        log.warn({ event: "auth.credentials.account_locked", userId: user.id });
        return null;
      }

      const valid = await verifyPassword(password, user.hashedPassword);
      if (!valid) {
        const attempts = user.failedLoginAttempts + 1;
        const update: Record<string, unknown> = { failedLoginAttempts: attempts };
        if (attempts >= MAX_FAILED_ATTEMPTS) {
          update.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
          update.failedLoginAttempts = 0;
        }
        await prisma.user.update({ where: { id: user.id }, data: update });
        log.warn({ event: "auth.credentials.bad_password", userId: user.id, attempts });
        return null;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
      });

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      };
    },
  }),
];

if (env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: false,
    }),
  );
}

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/login",
    error: "/login",
    verifyRequest: "/verify-email",
    newUser: "/app",
  },
  cookies: {
    sessionToken: {
      name: env.NODE_ENV === "production" ? "__Secure-authjs.session-token" : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user?.id) {
        token.sub = user.id;
        const firstMembership = await prisma.membership.findFirst({
          where: { userId: user.id, status: "ACTIVE", deletedAt: null },
          orderBy: { joinedAt: "asc" },
          select: { organizationId: true, role: true },
        });
        token.activeOrganizationId = firstMembership?.organizationId ?? null;
        token.role = firstMembership?.role ?? null;
      }

      if (trigger === "update" && session?.activeOrganizationId) {
        const membership = await prisma.membership.findFirst({
          where: {
            userId: token.sub!,
            organizationId: session.activeOrganizationId,
            status: "ACTIVE",
            deletedAt: null,
          },
          select: { role: true },
        });
        if (membership) {
          token.activeOrganizationId = session.activeOrganizationId;
          token.role = membership.role;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      session.user.activeOrganizationId =
        (token.activeOrganizationId as string | null | undefined) ?? null;
      session.user.role =
        (token.role as string | null | undefined) ?? null;
      return session;
    },
    authorized({ auth, request }) {
      const isAppRoute = request.nextUrl.pathname.startsWith("/app");
      const isAuthRoute = ["/login", "/register", "/forgot-password", "/reset-password"].some(
        (p) => request.nextUrl.pathname.startsWith(p),
      );

      if (isAppRoute) return !!auth;
      if (isAuthRoute && auth) {
        return Response.redirect(new URL("/app", request.nextUrl));
      }
      return true;
    },
  },
  events: {
    async signIn({ user, account }) {
      log.info({ event: "auth.signin", userId: user.id, provider: account?.provider });
    },
    async signOut(message) {
      const userId = "token" in message ? message.token?.sub : undefined;
      log.info({ event: "auth.signout", userId });
    },
    async createUser({ user }) {
      log.info({ event: "auth.createUser", userId: user.id });
    },
  },
  trustHost: env.AUTH_TRUST_HOST === "true",
  secret: env.AUTH_SECRET,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
