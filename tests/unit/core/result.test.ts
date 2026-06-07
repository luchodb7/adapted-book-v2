import { describe, expect, it } from "vitest";
import { Ok, Err, isOk, isErr, combine, map, flatMap } from "@/core/result/result";

describe("Result", () => {
  it("Ok holds a value and isOk is true", () => {
    const r = Ok(42);
    expect(isOk(r)).toBe(true);
    expect(isErr(r)).toBe(false);
    expect(r.value).toBe(42);
  });

  it("Err holds an error and isErr is true", () => {
    const r = Err(new Error("boom"));
    expect(isErr(r)).toBe(true);
    expect(r.error.message).toBe("boom");
  });

  it("map transforms Ok values, leaves Err alone", () => {
    expect(map(Ok(2), (n) => n * 3)).toEqual({ value: 6 });
    const err = Err(new Error("x"));
    expect(map(err, (n: number) => n * 3)).toBe(err);
  });

  it("flatMap short-circuits on Err", () => {
    const err = Err(new Error("x"));
    expect(flatMap(err, () => Ok(1))).toBe(err);
    expect(flatMap(Ok(2), (n) => Ok(n + 1))).toEqual({ value: 3 });
  });

  it("combine collects a list of Results, returning the first error", () => {
    const all = combine([Ok(1), Ok(2), Ok(3)]);
    expect(all).toEqual({ value: [1, 2, 3] });
    const some = combine([Ok(1), Err(new Error("a")), Ok(2)]);
    expect(isErr(some)).toBe(true);
  });
});
