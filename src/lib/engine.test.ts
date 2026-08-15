import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../config/gameConfig";
import { Engine } from "./engine";
import type { Rng } from "./problems";

function seeded(seed: number): Rng {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const settings = { ...DEFAULT_SETTINGS };

describe("판을 시작할 때", () => {
  it("빈 화면을 보여 주지 않는다", () => {
    const e = new Engine(settings, seeded(1));
    expect(e.pieces.length).toBeGreaterThan(0);
  });

  it("난이도가 정한 만큼 기회를 준다", () => {
    const e = new Engine({ ...settings, speed: "slow" }, seeded(1));
    expect(e.hearts).toBe(5);
    expect(e.maxHearts).toBe(5);
    const hard = new Engine({ ...settings, speed: "fast" }, seeded(1));
    expect(hard.hearts).toBe(3);
  });

  it("첫 문제를 기록에 담는다", () => {
    const e = new Engine(settings, seeded(1));
    expect(e.seen).toHaveLength(1);
  });
});

describe("떨어지는 것", () => {
  it("올라갔다가 내려온다", () => {
    const e = new Engine(settings, seeded(3));
    const first = e.pieces[0];
    const startY = first.y;
    for (let i = 0; i < 40; i++) e.tick(1 / 60);
    expect(first.y).toBeLessThan(startY); // 올라갔다
    const top = first.y;
    for (let i = 0; i < 200; i++) e.tick(1 / 60);
    expect(first.y).toBeGreaterThan(top); // 내려왔다
  });

  it("떨어질 때가 올라갈 때보다 느리다", () => {
    const e = new Engine(settings, seeded(5));
    const p = e.pieces[0];
    // 올라가는 중의 가속도
    const vBeforeUp = p.vy;
    e.tick(0.1);
    const risingAccel = (p.vy - vBeforeUp) / 0.1;

    // 꼭대기를 넘길 때까지 굴린 뒤 떨어지는 중의 가속도
    for (let i = 0; i < 200 && p.vy < 0; i++) e.tick(1 / 60);
    const vBeforeDown = p.vy;
    e.tick(0.1);
    const fallingAccel = (p.vy - vBeforeDown) / 0.1;

    expect(fallingAccel).toBeLessThan(risingAccel);
  });

  it("놓쳐도 하트가 줄지 않는다", () => {
    const e = new Engine(settings, seeded(7));
    // 전부 화면 밖으로 나갈 때까지 굴린다
    for (let i = 0; i < 60 * 12; i++) e.tick(1 / 60);
    expect(e.hearts).toBe(e.maxHearts);
    expect(e.phase).toBe("playing");
  });
});

describe("기록", () => {
  it("아직 풀지 않은 마지막 문제는 기록에서 뺀다", () => {
    // 화면에 떠 있는 채로 끝난 문제까지 "만났다"고 하면 실제로 푼 것보다 많아진다
    const e = new Engine(settings, seeded(9));
    expect(e.result(0).seen).toHaveLength(0);
  });

  it("최고 점수를 넘겼는지 알려준다", () => {
    const e = new Engine(settings, seeded(11));
    expect(e.result(0).isBest).toBe(false); // 0점이므로 갱신 아님
    expect(e.result(-1).isBest).toBe(true);
  });
});
