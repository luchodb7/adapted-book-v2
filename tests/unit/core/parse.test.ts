import { describe, expect, it } from "vitest";
import { parse } from "@/core/validation/parse";
import { z } from "zod";

const Schema = z.object({
  name: z.string().min(2).max(40),
  email: z.string().email(),
  age: z.number().int().min(0).max(120).optional(),
});

describe("parse", () => {
  it("returns a typed object on success", () => {
    const r = parse(Schema, { name: "Ada", email: "ada@x.io" });
    expect(r.name).toBe("Ada");
    expect(r.age).toBeUndefined();
  });

  it("throws a ValidationError on failure with field-level details", () => {
    let caught: unknown;
    try {
      parse(Schema, { name: "A", email: "not-an-email" });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(Error);
    const message = (caught as Error).message;
    expect(message).toContain("name");
    expect(message).toContain("email");
  });

  it("rejects non-object input", () => {
    expect(() => parse(Schema, "string" as unknown as object)).toThrow();
  });
});
