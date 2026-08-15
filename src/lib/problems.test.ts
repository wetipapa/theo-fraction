import { describe, expect, it } from "vitest";
import { ALL_DENOMINATORS, DIFFICULTY_SETS, denominatorsLabel } from "../config/gameConfig";
import { isCorrectPiece, makeQuestion, makeWave, type Rng } from "./problems";

/** 씨앗을 고정한 난수. 테스트가 실행할 때마다 달라지지 않게 한다 */
function seeded(seed: number): Rng {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const ALL = [...ALL_DENOMINATORS];
const BASIC = [2, 3, 4];

describe("makeQuestion", () => {
  it("고른 분모 안에서만 낸다", () => {
    const rng = seeded(7);
    const picked = [3, 7];
    for (let i = 0; i < 300; i++) {
      expect(picked).toContain(makeQuestion(picked, rng).target.d);
    }
  });

  it("통째로 칠해진 분수(3/3)는 내지 않는다", () => {
    const rng = seeded(11);
    for (let i = 0; i < 300; i++) {
      const q = makeQuestion(ALL, rng);
      expect(q.target.n).toBeGreaterThanOrEqual(1);
      expect(q.target.n).toBeLessThan(q.target.d);
    }
  });

  it("아무것도 안 골랐어도 문제는 나온다", () => {
    const rng = seeded(2);
    const q = makeQuestion([], rng);
    expect(q.target.d).toBeGreaterThanOrEqual(2);
    expect(q.target.n).toBeLessThan(q.target.d);
  });
});

describe("makeWave", () => {
  it("정답이 반드시 하나는 들어간다", () => {
    const rng = seeded(3);
    for (const diff of Object.values(DIFFICULTY_SETS)) {
      for (const list of [BASIC, ALL, [5], [2, 9]]) {
        for (let i = 0; i < 60; i++) {
          const q = makeQuestion(list, rng);
          const wave = makeWave(q, list, diff, rng);
          const correct = wave.filter((p) => p.role !== "bomb" && isCorrectPiece(q, p.fraction, diff));
          expect(correct.length).toBeGreaterThanOrEqual(1);
        }
      }
    }
  });

  it("고르지 않은 분모는 화면에 올리지 않는다", () => {
    const rng = seeded(21);
    const picked = [2, 4];
    for (const diff of Object.values(DIFFICULTY_SETS)) {
      for (let i = 0; i < 200; i++) {
        const q = makeQuestion(picked, rng);
        for (const piece of makeWave(q, picked, diff, rng)) {
          if (!piece.fraction) continue; // 폭탄
          expect(picked).toContain(piece.fraction.d);
        }
      }
    }
  });

  it("오답으로 낸 것이 실제로 오답이다", () => {
    const rng = seeded(5);
    for (const diff of Object.values(DIFFICULTY_SETS)) {
      for (let i = 0; i < 200; i++) {
        const q = makeQuestion(ALL, rng);
        for (const piece of makeWave(q, ALL, diff, rng)) {
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
        const q = makeQuestion(ALL, rng);
        expect(makeWave(q, ALL, diff, rng).length).toBeLessThanOrEqual(diff.maxConcurrent);
      }
    }
  });

  it("쉬움에는 폭탄이 나오지 않는다", () => {
    const rng = seeded(13);
    for (let i = 0; i < 400; i++) {
      const q = makeQuestion(ALL, rng);
      const wave = makeWave(q, ALL, DIFFICULTY_SETS.slow, rng);
      expect(wave.some((p) => p.role === "bomb")).toBe(false);
    }
  });

  it("분모를 하나만 골라도 오답을 만들어 낸다", () => {
    const rng = seeded(31);
    // 분모가 5뿐이면 분자만 다른 오답(2/5, 3/5…)으로 채워야 한다
    for (let i = 0; i < 100; i++) {
      const q = makeQuestion([5], rng);
      const wave = makeWave(q, [5], DIFFICULTY_SETS.normal, rng);
      expect(wave.length).toBeGreaterThanOrEqual(2);
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

describe("denominatorsLabel", () => {
  it("이어지는 숫자는 물결로 묶는다", () => {
    expect(denominatorsLabel([2, 3, 4])).toBe("2~4");
    expect(denominatorsLabel([2, 4])).toBe("2·4");
    expect(denominatorsLabel([2, 3, 7, 8, 9])).toBe("2·3·7~9");
    expect(denominatorsLabel(ALL)).toBe("전체");
  });
});

describe("난이도", () => {
  it("떨어질 때가 올라갈 때보다 느리다", () => {
    for (const diff of Object.values(DIFFICULTY_SETS)) {
      expect(diff.fall).toBeLessThan(1);
    }
  });

  it("쉬울수록 더 천천히 떨어지고 기회가 많다", () => {
    expect(DIFFICULTY_SETS.slow.fall).toBeLessThan(DIFFICULTY_SETS.normal.fall);
    expect(DIFFICULTY_SETS.normal.fall).toBeLessThan(DIFFICULTY_SETS.fast.fall);
    expect(DIFFICULTY_SETS.slow.hearts).toBeGreaterThan(DIFFICULTY_SETS.fast.hearts);
  });

  it("쉬울수록 한 번에 적게 나오고 사이가 넉넉하다", () => {
    expect(DIFFICULTY_SETS.slow.maxConcurrent).toBeLessThan(DIFFICULTY_SETS.fast.maxConcurrent);
    expect(DIFFICULTY_SETS.slow.interval).toBeGreaterThan(DIFFICULTY_SETS.fast.interval);
    expect(DIFFICULTY_SETS.slow.decoys).toBeLessThan(DIFFICULTY_SETS.fast.decoys);
    expect(DIFFICULTY_SETS.slow.bombRate).toBeLessThan(DIFFICULTY_SETS.fast.bombRate);
  });

  it("난이도가 튀어 오르는 높이를 건드리지 않는다", () => {
    // 예전에 난이도마다 발사 배수를 곱했더니 쉬움이 제일 낮게 떠서
    // 아래쪽 좁은 구간을 스쳐 지나갔다. 정작 쉬움이 제일 어려웠다.
    for (const diff of Object.values(DIFFICULTY_SETS)) {
      expect(diff).not.toHaveProperty("speed");
      expect(diff).not.toHaveProperty("launch");
    }
  });
});
