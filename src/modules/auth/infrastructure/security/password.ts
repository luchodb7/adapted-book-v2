import bcrypt from "bcryptjs";

/**
 * Password hashing utilities.
 *
 * We use bcrypt with cost factor 12 by default. Argon2 would be preferable but
 * is harder to deploy on Vercel edge runtimes — bcryptjs is pure JS and runs
 * everywhere.
 */

const DEFAULT_ROUNDS = 12;

export async function hashPassword(plain: string, rounds = DEFAULT_ROUNDS): Promise<string> {
  return bcrypt.hash(plain, rounds);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Strength check used during sign-up.
 * Minimum: 8 chars, 1 letter, 1 number. Stronger rules are enforced via Zod
 * in the auth schemas.
 */
export function isStrongEnough(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Za-z]/.test(password) &&
    /[0-9]/.test(password)
  );
}
