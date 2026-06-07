import { describe, expect, it } from "vitest";
import {
  extractKeywords,
  simplifySentence,
  splitIntoSentences,
} from "@/modules/stories/infrastructure/services/text-processing";

describe("text-processing", () => {
  describe("splitIntoSentences", () => {
    it("returns an empty array for empty input", () => {
      expect(splitIntoSentences("")).toEqual([]);
      expect(splitIntoSentences("   ")).toEqual([]);
    });

    it("splits English sentences", () => {
      const out = splitIntoSentences("Hello world. How are you? I am fine!");
      expect(out).toHaveLength(3);
      expect(out[0]).toBe("Hello world.");
    });

    it("respects Spanish punctuation", () => {
      const out = splitIntoSentences("Hola. ¿Cómo estás? ¡Bien!", "es");
      expect(out.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("simplifySentence", () => {
    it("capitalizes and ensures terminal punctuation", () => {
      expect(simplifySentence("hello world")).toBe("Hello world.");
    });
    it("does not double-punctuate", () => {
      expect(simplifySentence("Hello world!")).toBe("Hello world!");
    });
    it("collapses whitespace", () => {
      expect(simplifySentence("Too   many    spaces.")).toBe("Too many spaces.");
    });
  });

  describe("extractKeywords", () => {
    it("ignores English stopwords", () => {
      const k = extractKeywords("The dog runs to the park.");
      expect(k).not.toContain("the");
      expect(k).toContain("dog");
    });
    it("returns most-frequent words first", () => {
      const k = extractKeywords("school school school house tree");
      expect(k[0]).toBe("school");
    });
    it("normalises diacritics", () => {
      const k = extractKeywords("Camión camión ciudad", "es");
      expect(k[0]).toBe("camion");
    });
  });
});
