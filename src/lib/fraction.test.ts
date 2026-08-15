import { describe, expect, it } from "vitest";
import { compare, equivalentsOf, isEquivalent, isSame, isValid, reduce } from "./fraction";

describe("reduce", () => {
  it("기약분수로 줄인다", () => {
    expect(reduce({ n: 2, d: 4 })).toEqual({ n: 1, d: 2 });
    expect(reduce({ n: 6, d: 8 })).toEqual({ n: 3, d: 4 });
    expect(reduce({ n: 3, d: 5 })).toEqual({ n: 3, d: 5 });
  });

  it("분자가 0이어도 터지지 않는다", () => {
    expect(reduce({ n: 0, d: 4 })).toEqual({ n: 0, d: 1 });
  });
});

describe("isSame / isEquivalent", () => {
  it("1/2과 2/4는 생김새는 다르고 크기는 같다", () => {
    expect(isSame({ n: 1, d: 2 }, { n: 2, d: 4 })).toBe(false);
    expect(isEquivalent({ n: 1, d: 2 }, { n: 2, d: 4 })).toBe(true);
  });

  it("소수로 바꾸면 오차가 나는 조합도 정확히 본다", () => {
    // 1/3 = 0.333... 을 실수로 비교하면 2/6과 다르다고 나올 수 있다
    expect(isEquivalent({ n: 1, d: 3 }, { n: 2, d: 6 })).toBe(true);
    expect(isEquivalent({ n: 1, d: 3 }, { n: 3, d: 8 })).toBe(false);
  });
});

describe("compare", () => {
  it("크기 순서를 정확히 낸다", () => {
    expect(compare({ n: 1, d: 2 }, { n: 1, d: 3 })).toBeGreaterThan(0);
    expect(compare({ n: 1, d: 4 }, { n: 1, d: 3 })).toBeLessThan(0);
    expect(compare({ n: 2, d: 4 }, { n: 1, d: 2 })).toBe(0);
  });
});

describe("isValid", () => {
  it("분모가 0이거나 분자가 더 크면 안 된다", () => {
    expect(isValid({ n: 1, d: 0 })).toBe(false);
    expect(isValid({ n: 5, d: 4 })).toBe(false);
    expect(isValid({ n: 1.5, d: 3 })).toBe(false);
    expect(isValid({ n: 3, d: 4 })).toBe(true);
  });
});

describe("equivalentsOf", () => {
  it("분모 한도 안에서 같은 크기를 만든다", () => {
    expect(equivalentsOf({ n: 1, d: 2 }, 8)).toEqual([
      { n: 2, d: 4 },
      { n: 3, d: 6 },
      { n: 4, d: 8 },
    ]);
  });

  it("한도가 작으면 아무것도 안 나온다", () => {
    expect(equivalentsOf({ n: 1, d: 3 }, 4)).toEqual([]);
  });
});
