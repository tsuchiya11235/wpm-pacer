import { countCharacters, countWords, tokenize } from "@/lib/text";

describe("countWords", () => {
  it("counts whitespace-separated words", () => {
    expect(countWords("the quick brown fox")).toBe(4);
  });

  it("ignores leading/trailing and repeated whitespace", () => {
    expect(countWords("  hello   world \n")).toBe(2);
  });

  it("returns 0 for empty or whitespace-only text", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("   \n\t ")).toBe(0);
  });
});

describe("countCharacters", () => {
  it("counts trimmed characters", () => {
    expect(countCharacters("  abc  ")).toBe(3);
  });
});

describe("tokenize", () => {
  it("preserves whitespace and assigns sequential word indices", () => {
    const tokens = tokenize("a  b");
    expect(tokens.map((t) => t.text)).toEqual(["a", "  ", "b"]);
    expect(tokens.filter((t) => t.isWord).map((t) => t.wordIndex)).toEqual([
      0, 1,
    ]);
    expect(tokens[1].wordIndex).toBe(-1);
  });

  it("returns an empty array for empty input", () => {
    expect(tokenize("")).toEqual([]);
  });
});
