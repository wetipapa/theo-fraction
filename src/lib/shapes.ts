import type { Food } from "../data/foods";
import type { Fraction } from "./fraction";

/**
 * 분수를 그림으로 그린다.
 *
 * 원점(0,0)을 가운데로 두고 반지름 `r` 안에 그린다. 회전·이동은 부르는 쪽이 한다.
 *
 * 숫자를 함께 적지 않는다. 숫자가 있으면 아이가 그림을 세지 않고 글자만 읽는다.
 * 이 게임에서 배우는 건 "칠해진 칸이 전체의 얼마인가"를 눈으로 가늠하는 일이다.
 */
export function drawFraction(
  ctx: CanvasRenderingContext2D,
  food: Food,
  f: Fraction,
  r: number,
) {
  if (food.shape === "circle") drawCircleFraction(ctx, food, f, r);
  else drawBarFraction(ctx, food, f, r);
}

function drawCircleFraction(ctx: CanvasRenderingContext2D, food: Food, f: Fraction, r: number) {
  const step = (Math.PI * 2) / f.d;
  // 12시 방향에서 시작한다. 시계처럼 읽히는 편이 아이에게 익숙하다
  const start = -Math.PI / 2;

  for (let i = 0; i < f.d; i++) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r, start + i * step, start + (i + 1) * step);
    ctx.closePath();
    ctx.fillStyle = i < f.n ? food.fill : food.empty;
    ctx.fill();
  }

  // 칸 나누는 선. 몇 등분인지 세려면 선이 또렷해야 한다
  ctx.strokeStyle = food.line;
  ctx.lineWidth = Math.max(1.5, r * 0.055);
  ctx.lineCap = "round";
  for (let i = 0; i < f.d; i++) {
    const a = start + i * step;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.lineWidth = Math.max(2, r * 0.09);
  ctx.stroke();
}

function drawBarFraction(ctx: CanvasRenderingContext2D, food: Food, f: Fraction, r: number) {
  const w = r * 1.85;
  const h = r * 1.0;
  const x0 = -w / 2;
  const y0 = -h / 2;
  const cell = w / f.d;

  for (let i = 0; i < f.d; i++) {
    ctx.beginPath();
    ctx.rect(x0 + i * cell, y0, cell, h);
    ctx.fillStyle = i < f.n ? food.fill : food.empty;
    ctx.fill();
  }

  ctx.strokeStyle = food.line;
  ctx.lineWidth = Math.max(1.5, r * 0.05);
  for (let i = 1; i < f.d; i++) {
    ctx.beginPath();
    ctx.moveTo(x0 + i * cell, y0);
    ctx.lineTo(x0 + i * cell, y0 + h);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.rect(x0, y0, w, h);
  ctx.lineWidth = Math.max(2, r * 0.085);
  ctx.stroke();
}

/** 폭탄. 분수가 아니라 피해야 할 것이라, 생김새를 음식들과 확실히 다르게 둔다 */
export function drawBomb(ctx: CanvasRenderingContext2D, r: number, t: number) {
  ctx.beginPath();
  ctx.arc(0, r * 0.08, r * 0.82, 0, Math.PI * 2);
  ctx.fillStyle = "#2E2E33";
  ctx.fill();
  ctx.strokeStyle = "#101013";
  ctx.lineWidth = Math.max(2, r * 0.08);
  ctx.stroke();

  // 반짝이는 하이라이트
  ctx.beginPath();
  ctx.arc(-r * 0.28, -r * 0.2, r * 0.16, 0, Math.PI * 2);
  ctx.fillStyle = "#6A6A75";
  ctx.fill();

  // 심지
  ctx.beginPath();
  ctx.moveTo(r * 0.2, -r * 0.62);
  ctx.quadraticCurveTo(r * 0.55, -r * 0.95, r * 0.34, -r * 1.2);
  ctx.strokeStyle = "#8A6A4A";
  ctx.lineWidth = Math.max(2, r * 0.09);
  ctx.stroke();

  // 불꽃. 깜빡여서 위험하다는 게 눈에 들어오게 한다
  const flicker = 0.75 + Math.sin(t * 18) * 0.25;
  ctx.beginPath();
  ctx.arc(r * 0.34, -r * 1.24, r * 0.17 * flicker, 0, Math.PI * 2);
  ctx.fillStyle = "#FFB020";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(r * 0.34, -r * 1.26, r * 0.09 * flicker, 0, Math.PI * 2);
  ctx.fillStyle = "#FFF0C0";
  ctx.fill();
}
