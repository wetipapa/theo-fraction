/**
 * 게임 규칙과 난이도.
 *
 * 숫자를 화면 코드 여기저기에 흩어 두지 않는다. 아이가 하는 걸 보고 고치는 일이
 * 계속 생기는데, 그때 한 곳만 보면 되도록 여기에 모은다.
 */

export type SpeedId = "slow" | "normal" | "fast";

/** 고를 수 있는 분모. 1은 분수가 아니고, 10 이상은 조각이 너무 얇아 눈으로 못 센다 */
export const ALL_DENOMINATORS = [2, 3, 4, 5, 6, 7, 8, 9] as const;

/**
 * 자주 쓰는 조합 단축 버튼.
 * 아이마다 막히는 곳이 다르다. 2·3·4는 되는데 7·8만 안 되는 식이라
 * 난이도에 묶어 두지 않고 부모가 직접 고르게 한다.
 */
export const DENOMINATOR_PRESETS = [
  { id: "basic", label: "2·3·4", list: [2, 3, 4] },
  { id: "upto6", label: "2~6", list: [2, 3, 4, 5, 6] },
  { id: "all", label: "전체", list: [...ALL_DENOMINATORS] },
] as const;

/** "2·3·4" 처럼 짧게. 이어지는 숫자는 물결로 묶는다 */
export function denominatorsLabel(list: number[]): string {
  const sorted = [...list].sort((a, b) => a - b);
  if (sorted.length === 0) return "없음";
  if (sorted.length === ALL_DENOMINATORS.length) return "전체";
  const runs: number[][] = [];
  for (const d of sorted) {
    const last = runs[runs.length - 1];
    if (last && d === last[last.length - 1] + 1) last.push(d);
    else runs.push([d]);
  }
  return runs.map((r) => (r.length >= 3 ? `${r[0]}~${r[r.length - 1]}` : r.join("·"))).join("·");
}

export interface DifficultySet {
  label: string;
  /**
   * 남은 기회.
   * 쉬움에서 넉넉히 주는 이유는 실수를 봐주려는 게 아니라, 분수를 처음 만나는 아이에게
   * "틀려도 계속할 수 있다"를 먼저 알려 주기 위해서다. 세 번 틀리고 끝나면 다시 켜지 않는다.
   */
  hearts: number;
  /**
   * 떨어질 때의 중력 배수.
   * 올라갈 때와 같은 힘으로 떨어뜨리면 올라온 속도 그대로 내려가서 휙 지나가 버린다.
   * 어른이 해도 겨냥할 틈이 없다. 내려올 때만 힘을 줄여 천천히 떨어지게 한다.
   */
  fall: number;
  /** 한 번에 떠 있을 수 있는 최대 개수 */
  maxConcurrent: number;
  /** 다음 무리가 올라오기까지의 간격(초) */
  interval: number;
  /** 튀어 오르는 속도 배수. 1이 기준 */
  speed: number;
  /** 한 무리에 섞이는 오답 개수 */
  decoys: number;
  /** 폭탄이 섞일 확률(0~1) */
  bombRate: number;
  /**
   * 같은 크기의 다른 표현(2/4 = 1/2)도 정답으로 인정할지.
   * 처음 배우는 아이에게 2/4를 1/2이라고 하면 헷갈리기만 한다.
   * 익숙해진 다음 단계에서 열어 준다 — 동치분수를 따로 가르치지 않고 몸으로 익히게 하는 자리다.
   */
  allowEquivalent: boolean;
}

export const DIFFICULTY_SETS: Record<SpeedId, DifficultySet> = {
  slow: {
    label: "쉬움",
    hearts: 5,
    fall: 0.24,
    maxConcurrent: 3,
    interval: 2.2,
    speed: 0.85,
    decoys: 1,
    bombRate: 0,
    allowEquivalent: false,
  },
  normal: {
    label: "보통",
    hearts: 4,
    fall: 0.34,
    maxConcurrent: 4,
    interval: 1.7,
    speed: 1,
    decoys: 2,
    bombRate: 0.18,
    allowEquivalent: true,
  },
  fast: {
    label: "어려움",
    hearts: 3,
    fall: 0.50,
    maxConcurrent: 5,
    interval: 1.25,
    speed: 1.2,
    decoys: 3,
    bombRate: 0.3,
    allowEquivalent: true,
  },
};

export const RULES = {
  /** HUD가 하트 자리를 잡을 때 쓰는 최댓값. 실제 개수는 난이도가 정한다 */
  maxHearts: 5,
  /** 이만큼 맞히면 다음 문제로 넘어간다 */
  hitsPerQuestion: 3,
  /** 정답 하나의 기본 점수 */
  baseScore: 10,
  /**
   * 한 번의 스와이프로 여러 개를 베면 배수가 붙는다.
   * 2개 = x2, 3개 = x3 … 한 획에 몰아 베는 맛을 만드는 자리다.
   */
  maxComboMultiplier: 5,
  /**
   * 판정 여유. 오브젝트 반지름에 이만큼을 곱해 스와이프와 충돌을 본다.
   * 손가락이 정확할 수 없는 나이라, 아슬아슬하게 스친 것도 벤 것으로 친다.
   * 여기를 1에 가깝게 두면 아이는 자기가 뭘 틀렸는지 모른 채 하트만 잃는다.
   */
  hitPadding: 1.45,
  /** 스와이프가 이만큼(px) 이상 움직여야 칼질로 친다. 그냥 탭한 것과 구분한다 */
  minSwipeDistance: 24,
  /** 칼자국이 화면에 남아 있는 시간(초) */
  trailLife: 0.28,
  /** 오답을 놓쳐도 벌점은 없다. 콤보만 끊긴다 */
  missPenalty: 0,
} as const;

/** 물리. 화면 높이를 1로 본 좌표계에서 계산한다 (기기 크기와 무관하게 같은 궤적) */
export const PHYSICS = {
  /** 올라갈 때 아래로 당기는 힘 (화면높이/초²) */
  gravity: 1.15,
  /**
   * 떨어질 때의 기본 힘. 난이도의 `fall`을 곱해 쓴다.
   * 올라갈 때보다 훨씬 약하게 둬서 꼭대기에서 천천히 내려온다 —
   * 던져 올린 것이 잠깐 떠 있는 느낌이고, 그동안 아이가 보고 겨냥한다.
   */
  fallGravity: 1.15,
  /**
   * 튀어 오르는 초기 속도의 범위 (화면높이/초).
   * 최고점은 v²/(2g)로 정해진다 — 1.45면 화면 위쪽 10~30%까지 올라오고
   * 공중에 2.5초쯤 머문다. 이보다 낮으면 아래쪽에만 맴돌아 손이 닿기 답답하고,
   * 높으면 화면 밖으로 나갔다 오느라 볼 수 있는 시간이 오히려 줄어든다.
   */
  launchSpeed: { min: 1.36, max: 1.56 },
  /**
   * 좌우로 흩어지는 속도의 범위 (화면폭/초).
   * 공중에 2.5초 머무니 0.22면 화면 반 폭을 가로질러 옆으로 사라진다.
   * 아이가 보고 겨냥할 새도 없이 나가 버리므로 좁게 잡는다.
   */
  driftSpeed: { min: -0.09, max: 0.09 },
  /** 오브젝트 반지름 (화면폭 대비 비율) */
  radius: 0.115,
  /**
   * 초당 회전수의 범위.
   * 과일이 팽팽 도는 게 시원하긴 하지만, 이 게임에서는 그림의 칸을 세어야 한다.
   * 뒤집힌 분수를 읽게 만들지 않도록 살짝 흔들리는 정도로만 둔다.
   */
  spin: { min: -0.18, max: 0.18 },
  /** 처음 기울기의 범위(라디안). 한 바퀴 다 돌리지 않고 살짝만 기울인다 */
  tilt: 0.42,
} as const;

export interface Settings {
  speed: SpeedId;
  /** 문제에 나올 분모들. 부모가 고른다 */
  denominators: number[];
  sound: boolean;
  haptics: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  speed: "slow",
  denominators: [2, 3, 4],
  sound: true,
  haptics: true,
};
