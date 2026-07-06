/**
 * Whitespace-based tokenization shared by the input panels (for word/char
 * counts) and the pacer (for stepping through words). Kept deliberately simple
 * for the MVP: words are runs of non-whitespace separated by whitespace.
 */

export interface Token {
  /** The raw text of this token (a word or a whitespace run). */
  text: string;
  /** True when this token is a word (non-whitespace). */
  isWord: boolean;
  /**
   * Zero-based index among words only, or -1 for whitespace tokens. Used by the
   * reading stage to map a "current word" to a DOM node.
   */
  wordIndex: number;
}

/**
 * Splits text into an ordered list of word and whitespace tokens, preserving
 * the original spacing so it can be re-rendered faithfully.
 */
export function tokenize(text: string): Token[] {
  if (!text) {
    return [];
  }
  const parts = text.match(/\s+|\S+/g) ?? [];
  let wordIndex = 0;
  return parts.map((part) => {
    const isWord = !/^\s+$/.test(part);
    return {
      text: part,
      isWord,
      wordIndex: isWord ? wordIndex++ : -1,
    };
  });
}

/** Counts words (runs of non-whitespace) in the given text. */
export function countWords(text: string): number {
  if (!text) {
    return 0;
  }
  const matches = text.match(/\S+/g);
  return matches ? matches.length : 0;
}

/** Counts characters excluding surrounding whitespace. */
export function countCharacters(text: string): number {
  return text.trim().length;
}
