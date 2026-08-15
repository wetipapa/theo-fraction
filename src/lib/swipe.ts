/**
 * 스와이프 판정.
 *
 * **판정을 후하게 두는 것이 이 게임에서 제일 중요한 규칙이다.**
 * 여섯 살 손가락은 정확할 수 없다. 분수를 제대로 골랐는데 손이 몇 픽셀 빗나가서 못 벴다면
 * 아이는 자기가 분수를 틀린 줄 안다. 학습을 방해하는 실패는 만들지 않는다.
 *
 * 그래서 세 가지를 둔다.
 * 1. 반지름에 여유를 곱해 스친 것도 벤 것으로 친다 (`hitPadding`)
 * 2. 점이 아니라 **선분**과 원의 거리를 본다 — 빠르게 그은 획도 중간이 건너뛰지 않는다
 * 3. 한 획에 여러 개가 걸리면 전부 벤다 — 콤보가 나오는 자리다
 */

export interface Point {
  x: number;
  y: number;
}

/** 선분 ab와 점 p 사이의 최단 거리 */
export function distanceToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;

  // 손가락이 멈춰 있으면 선분이 아니라 점이다
  if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);

  // 점을 선분 위에 투영한 위치. 0~1 밖이면 양 끝점 중 가까운 쪽이 답이다
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/** 선분이 원을 지나가는가 */
export function segmentHitsCircle(a: Point, b: Point, center: Point, radius: number): boolean {
  return distanceToSegment(center, a, b) <= radius;
}

/** 두 점 사이의 각도(라디안). 조각이 갈라질 방향으로 쓴다 */
export function angleOf(a: Point, b: Point): number {
  return Math.atan2(b.y - a.y, b.x - a.x);
}

/**
 * 손가락이 지나간 자취.
 *
 * 화면에 칼자국을 그리는 데도 쓰고, 충돌 판정에도 쓴다.
 * 오래된 점은 스스로 지운다 — 한 번 지나간 자리에 나중에 올라온 것까지 베이면 안 된다.
 */
export class SwipeTrail {
  private points: { p: Point; t: number }[] = [];

  add(p: Point, now: number) {
    this.points.push({ p, t: now });
  }

  /** 수명이 다한 점을 버린다 */
  prune(now: number, life: number) {
    this.points = this.points.filter((q) => now - q.t <= life);
  }

  clear() {
    this.points = [];
  }

  get list(): Point[] {
    return this.points.map((q) => q.p);
  }

  /** 방금 그은 마지막 한 획. 판정은 이 구간으로만 본다 */
  get lastSegment(): [Point, Point] | null {
    const n = this.points.length;
    if (n < 2) return null;
    return [this.points[n - 2].p, this.points[n - 1].p];
  }

  /** 이번 스와이프가 칼질로 칠 만큼 길었는가 */
  totalLength(): number {
    let sum = 0;
    for (let i = 1; i < this.points.length; i++) {
      sum += Math.hypot(
        this.points[i].p.x - this.points[i - 1].p.x,
        this.points[i].p.y - this.points[i - 1].p.y,
      );
    }
    return sum;
  }
}
