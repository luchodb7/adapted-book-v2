import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

process.env.DATABASE_URL = process.env.DATABASE_URL ?? "postgresql://test:test@localhost:5432/test?schema=public";
process.env.AUTH_SECRET = process.env.AUTH_SECRET ?? "test-secret-must-be-at-least-32-characters!!";
process.env.NODE_ENV = "test";
process.env.AI_PROVIDER = "mock";
process.env.LOG_LEVEL = "fatal";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
