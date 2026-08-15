import type { FoodKind, ShapeKind } from "../types";

/**
 * 분수를 담는 음식들.
 *
 * 같은 1/2이라도 피자로 보면 부채꼴이고 초콜릿으로 보면 가로 칸이다.
 * 한 가지 모양만 쓰면 아이가 "반원 = 1/2"으로 외워 버려서, 분수가 아니라 그림을 외우게 된다.
 * 그래서 원형과 막대형을 섞고, 같은 문제 안에서도 모양이 겹치지 않게 뽑는다.
 */
export interface Food {
  id: FoodKind;
  label: string;
  shape: ShapeKind;
  /** 칠해진 칸(먹은 만큼)의 색 */
  fill: string;
  /** 안 칠해진 칸의 색 */
  empty: string;
  /** 테두리와 칸 나누는 선 */
  line: string;
  /** 잘렸을 때 튀는 즙·부스러기 색 */
  juice: string;
}

export const FOODS: Food[] = [
  {
    id: "pizza",
    label: "피자",
    shape: "circle",
    fill: "#F2A33C",
    empty: "#FBEBD2",
    line: "#8A5A2B",
    juice: "#E2762A",
  },
  {
    id: "watermelon",
    label: "수박",
    shape: "circle",
    fill: "#F0567A",
    empty: "#FCE4EA",
    line: "#3F7A3A",
    juice: "#E8455F",
  },
  {
    id: "cake",
    label: "케이크",
    shape: "circle",
    fill: "#F6C6D8",
    empty: "#FFF6F9",
    line: "#9B6A7C",
    juice: "#EC9BBB",
  },
  {
    id: "orange",
    label: "오렌지",
    shape: "circle",
    fill: "#FF9F1C",
    empty: "#FFF0DA",
    line: "#B36A0C",
    juice: "#FFB84D",
  },
  {
    id: "chocolate",
    label: "초콜릿",
    shape: "bar",
    fill: "#8B5E3C",
    empty: "#EADACB",
    line: "#5A3A22",
    juice: "#7A4E2E",
  },
  {
    id: "bread",
    label: "식빵",
    shape: "bar",
    fill: "#E8B45E",
    empty: "#FBF1DE",
    line: "#A9752F",
    juice: "#D69B45",
  },
  {
    id: "gimbap",
    label: "김밥",
    shape: "bar",
    fill: "#5FA85A",
    empty: "#F2F7EE",
    line: "#3A6B37",
    juice: "#4E8F4A",
  },
];

export function foodById(id: FoodKind): Food {
  const found = FOODS.find((f) => f.id === id);
  if (!found) throw new Error(`Unknown food: ${id}`);
  return found;
}

export const CIRCLE_FOODS = FOODS.filter((f) => f.shape === "circle");
export const BAR_FOODS = FOODS.filter((f) => f.shape === "bar");
