import { describe, it, expect } from "vitest";
import { add } from "./add.js";

describe("add", () => {
  it("adds two positive numbers", () => {
    expect(add(1, 2)).toBe(3);
  });

  it("adds negative numbers", () => {
    expect(add(-1, -2)).toBe(-3);
  });

  it("adds a negative and a positive number", () => {
    expect(add(-1, 1)).toBe(0);
  });

  it("adds zeros", () => {
    expect(add(0, 0)).toBe(0);
  });

  it("adds floating point numbers", () => {
    expect(add(0.1, 0.2)).toBeCloseTo(0.3);
  });
});
