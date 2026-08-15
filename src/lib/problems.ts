import type { DifficultySet } from "../config/gameConfig";
import { BAR_FOODS, CIRCLE_FOODS } from "../data/foods";
import type { FoodKind, PieceRole, Question, QuestionMode } from "../types";
import { equivalentsOf, isEquivalent, isSame, reduce, type Fraction } from "./fraction";

export type Rng = () => number;

const pick = <T,>(rng: Rng, list: readonly T[]): T => list[Math.floor(rng() * list.length)];
const randInt = (rng: Rng, min: number, max: number) => min + Math.floor(rng() * (max - min + 1));

/** 화면에 올릴 것 하나의 설계도. 엔진이 이걸 받아 실제 물리를 붙인다 */
export interface PieceSpec {
  role: PieceRole;
  fraction: Fraction | null;
  food: FoodKind;
}

/**
 * 문제 하나를 만든다.
 *
 * 분모 2는 반, 3은 삼등분… 아이가 처음 만나는 분수부터 나오도록 작은 분모에 무게를 둔다.
 * 분자는 분모보다 작게만 잡는다. 통째로 다 칠해진 그림(3/3)은 분수라기보다 "하나"로 읽혀서 뺐다.
 */
export function makeQuestion(diff: DifficultySet, rng: Rng, mode: QuestionMode = "find"): Question {
  // 작은 분모가 자주 나오도록 후보를 겹쳐 담는다
  const pool: number[] = [];
  for (let d = 2; d <= diff.maxDenominator; d++) {
    const weight = Math.max(1, diff.maxDenominator - d + 1);
    for (let i = 0; i < weight; i++) pool.push(d);
  }
  const d = pick(rng, pool);
  const n = randInt(rng, 1, d - 1);
  const target = { n, d };

  return { mode, prompt: promptFor(mode, target), target };
}

function promptFor(mode: QuestionMode, f: Fraction): string {
  switch (mode) {
    case "find":
      return "이만큼 칠해진 것만 쓱싹!";
    case "read":
      return "그림에 맞는 분수를 쓱싹!";
    case "compare":
      return "이것보다 큰 것만 쓱싹!";
    case "equivalent":
      return "이것과 같은 크기만 쓱싹!";
    case "sum":
      return "모아서 이만큼 만들어요!";
    default:
      return `${f.d}분의 ${f.n}을 쓱싹!`;
  }
}

/**
 * 이 조각이 정답인가.
 *
 * **판정을 여기 한 곳에 모아 둔다.** 엔진이 직접 분수를 비교하지 않는다.
 * 문제 종류가 늘어도 엔진은 이 함수만 부르면 되고, 새 종류는 여기에 case 하나만 붙인다.
 */
export function isCorrectPiece(q: Question, f: Fraction | null, diff: DifficultySet): boolean {
  if (!f) return false;
  switch (q.mode) {
    case "find":
      return diff.allowEquivalent ? isEquivalent(f, q.target) : isSame(f, q.target);
    case "equivalent":
      return isEquivalent(f, q.target);
    case "compare":
      return f.n * q.target.d > q.target.n * f.d;
    default:
      return isSame(f, q.target);
  }
}

/**
 * 한 무리를 만든다. 정답 하나에 오답 몇 개, 가끔 폭탄.
 *
 * 정답이 항상 한 개는 들어가게 한다. 무리마다 정답이 없으면 아이는 아무것도 못 베고
 * 화면만 지나가는 걸 보게 되는데, 그게 몇 번 반복되면 게임을 놓는다.
 */
export function makeWave(q: Question, diff: DifficultySet, rng: Rng): PieceSpec[] {
  const specs: PieceSpec[] = [];
  const usedFoods = new Set<FoodKind>();

  const takeFood = (shape: "circle" | "bar" | "any"): FoodKind => {
    const from =
      shape === "circle" ? CIRCLE_FOODS : shape === "bar" ? BAR_FOODS : [...CIRCLE_FOODS, ...BAR_FOODS];
    const free = from.filter((f) => !usedFoods.has(f.id));
    const chosen = pick(rng, free.length > 0 ? free : from);
    usedFoods.add(chosen.id);
    return chosen.id;
  };

  // 정답 하나. 난이도가 열려 있으면 가끔 같은 크기의 다른 표현으로 낸다
  const equivalents = diff.allowEquivalent ? equivalentsOf(q.target, diff.maxDenominator) : [];
  const useEquivalent = equivalents.length > 0 && rng() < 0.35;
  specs.push({
    role: "target",
    fraction: useEquivalent ? pick(rng, equivalents) : q.target,
    food: takeFood("any"),
  });

  // 오답. 정답과 헷갈리기 쉬운 것부터 고른다
  for (let i = 0; i < diff.decoys; i++) {
    const decoy = makeDecoy(q, diff, rng);
    if (decoy) specs.push({ role: "decoy", fraction: decoy, food: takeFood("any") });
  }

  if (rng() < diff.bombRate) {
    specs.push({ role: "bomb", fraction: null, food: "pizza" });
  }

  return shuffle(rng, specs).slice(0, diff.maxConcurrent);
}

/**
 * 헷갈리기 좋은 오답을 만든다.
 *
 * 아무 분수나 내면 정답이 눈에 너무 잘 띈다. 분자만 하나 다르거나 분모만 다른 것을 섞어야
 * 아이가 그림을 실제로 세어 보게 된다.
 */
function makeDecoy(q: Question, diff: DifficultySet, rng: Rng): Fraction | null {
  const { n, d } = q.target;
  const candidates: Fraction[] = [
    { n: n + 1, d },
    { n: n - 1, d },
    { n, d: d + 1 },
    { n, d: d - 1 },
    { n: d - n, d }, // 칠해진 곳과 빈 곳을 뒤집어 본 것 — 가장 흔한 실수다
  ];

  for (let guard = 0; guard < 30; guard++) {
    const c = guard < 12 ? pick(rng, candidates) : randomFraction(diff, rng);
    if (!c) continue;
    if (c.n < 1 || c.d < 2 || c.n >= c.d) continue;
    if (c.d > diff.maxDenominator) continue;
    if (isCorrectPiece(q, c, diff)) continue; // 오답인데 정답이 되어 버리면 안 된다
    return c;
  }
  return null;
}

function randomFraction(diff: DifficultySet, rng: Rng): Fraction {
  const d = randInt(rng, 2, diff.maxDenominator);
  return { n: randInt(rng, 1, d - 1), d };
}

export function shuffle<T>(rng: Rng, list: T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** 결과 화면에서 "1/2" 처럼 보여줄 때 쓴다 */
export function displayFraction(f: Fraction): string {
  const r = reduce(f);
  return `${r.n}/${r.d}`;
}
