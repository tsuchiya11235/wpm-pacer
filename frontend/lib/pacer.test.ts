import {
  exactWordCount,
  isComplete,
  msPerWord,
  readWordCount,
  reanchor,
  wordsElapsed,
  type PacerAnchor,
} from "@/lib/pacer";

describe("msPerWord", () => {
  it("converts wpm to ms per word", () => {
    expect(msPerWord(60)).toBe(1000);
    expect(msPerWord(300)).toBe(200);
    expect(msPerWord(600)).toBe(100);
  });

  it("rejects non-positive wpm", () => {
    expect(() => msPerWord(0)).toThrow();
  });
});

describe("wordsElapsed", () => {
  it("is zero at or before start", () => {
    expect(wordsElapsed(0, 300)).toBe(0);
    expect(wordsElapsed(-500, 300)).toBe(0);
  });

  it("scales linearly with time", () => {
    // 300 wpm => 200 ms/word; 1000ms => 5 words.
    expect(wordsElapsed(1000, 300)).toBe(5);
  });
});

describe("readWordCount", () => {
  const anchor: PacerAnchor = { wordsAtAnchor: 0, anchorMs: 1000 };

  it("floors fractional progress", () => {
    // 600 wpm => 100 ms/word. 250ms => 2.5 words => floor 2.
    expect(readWordCount(anchor, 1250, 600, 100)).toBe(2);
  });

  it("clamps to total words", () => {
    expect(readWordCount(anchor, 1_000_000, 600, 10)).toBe(10);
  });

  it("never goes below zero", () => {
    expect(readWordCount(anchor, 500, 600, 10)).toBe(0);
  });
});

describe("reanchor preserves position across a wpm change", () => {
  it("carries fractional progress onto the new pace", () => {
    // Start at 300 wpm (200 ms/word). After 500ms => 2.5 words.
    const start: PacerAnchor = { wordsAtAnchor: 0, anchorMs: 0 };
    expect(exactWordCount(start, 500, 300)).toBe(2.5);

    // Change to 600 wpm at t=500ms; progress must stay at 2.5.
    const next = reanchor(start, 500, 300);
    expect(next.wordsAtAnchor).toBe(2.5);
    expect(next.anchorMs).toBe(500);

    // After another 100ms at 600 wpm (100 ms/word) => 2.5 + 1 = 3.5.
    expect(exactWordCount(next, 600, 600)).toBe(3.5);
  });
});

describe("drift resistance with fake timers", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("depends only on elapsed time, not on how many ticks fired", () => {
    // Model a backgrounded tab: the render loop is starved of ticks for a full
    // second, then reads the clock. The count must reflect the elapsed time.
    let now = 1000;
    const clock = () => now;
    const anchor: PacerAnchor = { wordsAtAnchor: 0, anchorMs: clock() };
    const wpm = 600; // 100 ms/word

    // No intermediate ticks; jump the clock forward by 1s.
    jest.advanceTimersByTime(1000);
    now += 1000;

    expect(readWordCount(anchor, clock(), wpm, 100)).toBe(10);
  });
});

describe("isComplete", () => {
  it("is true once all words are read", () => {
    expect(isComplete(10, 10)).toBe(true);
    expect(isComplete(9, 10)).toBe(false);
    expect(isComplete(0, 0)).toBe(false);
  });
});
