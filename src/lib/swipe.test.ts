import { describe, expect, it } from "vitest";
import { PHYSICS, RULES } from "../config/gameConfig";
import { distanceToSegment, segmentHitsCircle, SwipeTrail } from "./swipe";

describe("distanceToSegment", () => {
  it("선분 위의 점은 거리가 0이다", () => {
    expect(distanceToSegment({ x: 5, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBeCloseTo(0);
  });

  it("선분 밖의 점은 끝점까지의 거리로 잰다", () => {
    // 선분을 무한 직선으로 보면 0이지만, 실제로는 끝점에서 3만큼 떨어져 있다
    expect(distanceToSegment({ x: 13, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBeCloseTo(3);
  });

  it("손가락이 멈춰 있어도(길이 0) 계산이 된다", () => {
    expect(distanceToSegment({ x: 3, y: 4 }, { x: 0, y: 0 }, { x: 0, y: 0 })).toBeCloseTo(5);
  });
});

describe("판정을 후하게 두었는가", () => {
  const r = PHYSICS.radius * RULES.hitPadding;

  it("가장자리를 스친 것도 벤 것으로 친다", () => {
    // 그림의 실제 반지름 바로 바깥을 지나간 획
    const grazing = PHYSICS.radius * 1.2;
    expect(segmentHitsCircle({ x: 0, y: grazing }, { x: 1, y: grazing }, { x: 0.5, y: 0 }, r)).toBe(true);
  });

  it("한참 빗나간 것까지 베어 주지는 않는다", () => {
    const far = PHYSICS.radius * 2.5;
    expect(segmentHitsCircle({ x: 0, y: far }, { x: 1, y: far }, { x: 0.5, y: 0 }, r)).toBe(false);
  });

  it("빠르게 그어 점이 띄엄띄엄 찍혀도 사이를 지나간 것을 잡는다", () => {
    // 두 점 사이에 있는 그림. 점만 비교하면 놓치고, 선분으로 봐야 잡힌다
    expect(segmentHitsCircle({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0.5, y: 0.02 }, r)).toBe(true);
  });
});

describe("SwipeTrail", () => {
  it("수명이 지난 점은 스스로 버린다", () => {
    const trail = new SwipeTrail();
    trail.add({ x: 0, y: 0 }, 0);
    trail.add({ x: 1, y: 0 }, 0.5);
    trail.prune(0.6, 0.3);
    expect(trail.list).toHaveLength(1);
  });

  it("길이를 잰다", () => {
    const trail = new SwipeTrail();
    trail.add({ x: 0, y: 0 }, 0);
    trail.add({ x: 3, y: 4 }, 0);
    expect(trail.totalLength()).toBeCloseTo(5);
  });

  it("점이 하나뿐이면 그은 구간이 없다", () => {
    const trail = new SwipeTrail();
    trail.add({ x: 0, y: 0 }, 0);
    expect(trail.lastSegment).toBeNull();
  });
});
