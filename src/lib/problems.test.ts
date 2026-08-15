import { describe, expect, it } from "vitest";
import { DIFFICULTY_SETS } from "../config/gameConfig";
import { isCorrectPiece, makeQuestion, makeWave, type Rng } from "./problems";

/** 씨앗을 고정한 난수. 테스트가 실행할 때마다 달라지지 않게 한다 */
function seeded(seed: number): Rng {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

describe("makeQuestion", () => {
  it("난이도가 정한 분모를 넘지 않는다", () => {
    const rng = seeded(7);
    for (const diff of Object.values(DIFFICULTY_SETS)) {
      for (let i = 0; i < 200; i++) {
        const q = makeQuestion(diff, rng);
        expect(q.target.d).toBeGreaterThanOrEqual(2);
        expect(q.target.d).toBeLessThanOrEqual(diff.maxDenominator);
      }
    }
  });

  it("통째로 칠해진 분수(3/3)는 내지 않는다", () => {
    const rng = seeded(11);
    for (let i = 0; i < 300; i++) {
      const q = makeQuestion(DIFFICULTY_SETS.fast, rng);
      expect(q.target.n).toBeGreaterThanOrEqual(1);
      expect(q.target.n).toBeLessThan(q.target.d);
    }
  });
});

describe("makeWave", () => {
  it("정답이 반드시 하나는 들어간다", () => {
    const rng = seeded(3);
    for (const diff of Object.values(DIFFICULTY_SETS)) {
      for (let i = 0; i < 200; i++) {
        const q = makeQuestion(diff, rng);
        const wave = makeWave(q, diff, rng);
        const correct = wave.filter((p) => p.role !== "bomb" && isCorrectPiece(q, p.fraction, diff));
        expect(correct.length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it("오답으로 낸 것이 실제로 오답이다", () => {
    const rng = seeded(5);
    for (const diff of Object.values(DIFFICULTY_SETS)) {
      for (let i = 0; i < 200; i++) {
        const q = makeQuestion(diff, rng);
        for (const piece of makeWave(q, diff, rng)) {
          if (piece.role !== "decoy") continue;
          expect(isCorrectPiece(q, piece.fraction, diff)).toBe(false);
        }
      }
    }
  });

  it("한 번에 뜨는 개수가 난이도 상한을 넘지 않는다", () => {
    const rng = seeded(9);
    for (const diff of Object.values(DIFFICULTY_SETS)) {
      for (let i = 0; i < 100; i++) {
        const q = makeQuestion(diff, rng);
        expect(makeWave(q, diff, rng).length).toBeLessThanOrEqual(diff.maxConcurrent);
      }
    }
  });

  it("쉬움에는 폭탄이 나오지 않는다", () => {
    const rng = seeded(13);
    for (let i = 0; i < 400; i++) {
      const q = makeQuestion(DIFFICULTY_SETS.slow, rng);
      const wave = makeWave(q, DIFFICULTY_SETS.slow, rng);
      expect(wave.some((p) => p.role === "bomb")).toBe(false);
    }
  });
});

describe("isCorrectPiece", () => {
  const q = { mode: "find" as const, prompt: "", target: { n: 1, d: 2 } };

  it("쉬움에서는 2/4를 1/2로 쳐주지 않는다", () => {
    expect(isCorrectPiece(q, { n: 2, d: 4 }, DIFFICULTY_SETS.slow)).toBe(false);
    expect(isCorrectPiece(q, { n: 1, d: 2 }, DIFFICULTY_SETS.slow)).toBe(true);
  });

  it("보통부터는 같은 크기도 정답이다", () => {
    expect(isCorrectPiece(q, { n: 2, d: 4 }, DIFFICULTY_SETS.normal)).toBe(true);
    expect(isCorrectPiece(q, { n: 3, d: 6 }, DIFFICULTY_SETS.normal)).toBe(true);
    expect(isCorrectPiece(q, { n: 1, d: 3 }, DIFFICULTY_SETS.normal)).toBe(false);
  });

  it("폭탄은 절대 정답이 아니다", () => {
    expect(isCorrectPiece(q, null, DIFFICULTY_SETS.normal)).toBe(false);
  });
});
