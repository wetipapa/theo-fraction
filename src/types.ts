import type { Fraction } from "./lib/fraction";

export type ShapeKind = "circle" | "bar";

export type FoodKind =
  | "pizza"
  | "watermelon"
  | "cake"
  | "orange"
  | "chocolate"
  | "bread"
  | "gimbap";

/**
 * 문제의 종류.
 *
 * 지금은 `find` 하나만 쓴다. 나머지는 이 게임을 늘려 갈 자리를 미리 적어 둔 것이다.
 * 새 종류를 넣을 때 손댈 곳은 `lib/problems.ts`의 생성기 하나뿐이고,
 * 엔진·렌더러·화면은 그대로 둔다 — 어떤 종류든 결과물이 "문제 한 줄 + 베어야 할 것 목록"으로 같기 때문이다.
 *
 * - `find`       : 제시된 분수와 같은 그림을 벤다 (지금 만든 것)
 * - `read`       : 그림 하나를 보여주고 맞는 분수 카드를 벤다
 * - `compare`    : 제시된 분수보다 큰 것(또는 작은 것)만 벤다
 * - `equivalent` : 서로 크기가 같은 것끼리 벤다
 * - `sum`        : 베어 모은 조각의 합이 목표 분수가 되게 한다
 */
export type QuestionMode = "find" | "read" | "compare" | "equivalent" | "sum";

/** 화면 위에 떠 있는 것 하나가 무엇인가 */
export type PieceRole = "target" | "decoy" | "bomb";

/** 문제 하나 */
export interface Question {
  mode: QuestionMode;
  /** 화면 맨 위에 뜨는 한 줄. 아이가 읽는 문장 */
  prompt: string;
  /** 문제의 기준이 되는 분수. `find`에서는 찾아야 할 분수 */
  target: Fraction;
}

/** 튀어 오르는 것 하나 */
export interface Piece {
  id: number;
  role: PieceRole;
  /** 폭탄은 분수를 갖지 않는다 */
  fraction: Fraction | null;
  food: FoodKind;
  /** 화면폭을 1로 본 가로 위치 */
  x: number;
  /** 화면높이를 1로 본 세로 위치. 0이 위, 1이 아래 */
  y: number;
  vx: number;
  vy: number;
  /** 라디안 */
  angle: number;
  spin: number;
  /** 베였는가. 베인 뒤에는 두 조각으로 나뉘어 떨어진다 */
  sliced: boolean;
  /** 베인 각도(라디안). 조각이 갈라지는 방향 */
  sliceAngle: number;
  /** 베인 뒤 흐른 시간(초) */
  slicedAt: number;
}

/** 튀는 즙·부스러기 */
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

/** 점수·콤보가 뜨는 자리 */
export interface Popup {
  x: number;
  y: number;
  text: string;
  life: number;
  kind: "score" | "combo" | "miss";
}

export type Phase = "playing" | "over";

export interface RunResult {
  score: number;
  bestCombo: number;
  solved: number;
  isBest: boolean;
  /**
   * 이 판에서 만난 분수들 (같은 것은 한 번만, 만난 순서대로).
   * 기록 사진에 그림으로 넣는다 — 숫자만 있는 카드보다 아이가 자기 기록으로 알아본다.
   */
  seen: Fraction[];
}
