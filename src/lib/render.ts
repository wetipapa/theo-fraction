import { PHYSICS } from "../config/gameConfig";
import { foodById } from "../data/foods";
import type { Engine } from "./engine";
import { drawBomb, drawFraction } from "./shapes";
import type { Point } from "./swipe";

/** 베인 조각이 갈라져 나가는 거리(반지름 대비). 시간이 갈수록 벌어진다 */
const SPLIT_TRAVEL = 0.9;

/**
 * 한 프레임을 그린다.
 *
 * 엔진은 0~1 좌표로만 계산하고, 픽셀로 바꾸는 일은 전부 여기서 한다.
 * 그래야 화면 크기가 달라져도 게임 자체는 똑같이 굴러간다.
 */
export function render(
  ctx: CanvasRenderingContext2D,
  engine: Engine,
  width: number,
  height: number,
  trail: Point[],
  time: number,
) {
  ctx.clearRect(0, 0, width, height);

  // 화면 흔들림. 폭탄이나 오답에서만 잠깐 흔든다
  ctx.save();
  if (engine.shake > 0) {
    const s = engine.shake * width * 0.012;
    ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
  }

  const radius = PHYSICS.radius * width;

  for (const p of engine.pieces) {
    const px = p.x * width;
    const py = p.y * height;

    if (!p.sliced) {
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(p.angle);
      if (p.role === "bomb" || foodById(p.food).shape === "circle") shadow(ctx, radius);
      if (p.role === "bomb") drawBomb(ctx, radius, time);
      else if (p.fraction) drawFraction(ctx, foodById(p.food), p.fraction, radius);
      ctx.restore();
      continue;
    }

    // 베인 것: 자른 각도의 수직 방향으로 두 조각이 갈라진다
    const t = Math.min(1, p.slicedAt / 0.9);
    const spread = SPLIT_TRAVEL * radius * t;
    const nx = Math.cos(p.sliceAngle + Math.PI / 2);
    const ny = Math.sin(p.sliceAngle + Math.PI / 2);
    const alpha = 1 - t * t;

    for (const dir of [1, -1]) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(px + nx * spread * dir, py + ny * spread * dir);
      ctx.rotate(p.angle + dir * t * 0.9);

      // 자른 선을 기준으로 절반만 남긴다. 두 번 그리면 온전한 하나가 된다
      ctx.beginPath();
      ctx.save();
      ctx.rotate(p.sliceAngle);
      ctx.rect(-radius * 2, dir > 0 ? -radius * 2 : 0, radius * 4, radius * 2);
      ctx.restore();
      ctx.clip();

      if (p.role === "bomb") drawBomb(ctx, radius, time);
      else if (p.fraction) drawFraction(ctx, foodById(p.food), p.fraction, radius);
      ctx.restore();
    }
  }

  for (const q of engine.particles) {
    ctx.globalAlpha = Math.max(0, q.life / q.maxLife);
    ctx.beginPath();
    ctx.arc(q.x * width, q.y * height, q.size * width, 0, Math.PI * 2);
    ctx.fillStyle = q.color;
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  drawTrail(ctx, trail, width, height);

  for (const u of engine.popups) {
    const fade = Math.min(1, u.life * 2.2);
    const rise = (1 - u.life) * height * 0.05;
    ctx.globalAlpha = fade;
    ctx.font = `900 ${Math.round(width * (u.kind === "combo" ? 0.085 : 0.07))}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = Math.max(3, width * 0.012);
    ctx.strokeStyle = "#FFFFFF";
    ctx.strokeText(u.text, u.x * width, u.y * height - rise);
    ctx.fillStyle = u.kind === "miss" ? "#8A8A8A" : u.kind === "combo" ? "#C42D6E" : "#8E1B4C";
    ctx.fillText(u.text, u.x * width, u.y * height - rise);
  }
  ctx.globalAlpha = 1;

  ctx.restore();
}

/**
 * 그림 뒤에 옅은 그림자. 크림 배경에 붙어 보이지 않게 살짝 띄운다.
 * 원형 음식에만 깐다 — 막대 뒤에 동그란 그림자가 깔리면 접시처럼 보인다.
 */
function shadow(ctx: CanvasRenderingContext2D, r: number) {
  ctx.beginPath();
  ctx.arc(0, r * 0.1, r * 0.98, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(80, 50, 30, 0.08)";
  ctx.fill();
}

/** 손가락이 지나간 칼자국. 끝으로 갈수록 굵고 진하다 */
function drawTrail(ctx: CanvasRenderingContext2D, trail: Point[], width: number, height: number) {
  if (trail.length < 2) return;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (let i = 1; i < trail.length; i++) {
    const t = i / trail.length;
    ctx.beginPath();
    ctx.moveTo(trail[i - 1].x * width, trail[i - 1].y * height);
    ctx.lineTo(trail[i].x * width, trail[i].y * height);
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.25 + t * 0.6})`;
    ctx.lineWidth = width * (0.006 + t * 0.022);
    ctx.stroke();
  }
  for (let i = 1; i < trail.length; i++) {
    const t = i / trail.length;
    ctx.beginPath();
    ctx.moveTo(trail[i - 1].x * width, trail[i - 1].y * height);
    ctx.lineTo(trail[i].x * width, trail[i].y * height);
    ctx.strokeStyle = `rgba(196, 45, 110, ${0.15 + t * 0.45})`;
    ctx.lineWidth = width * (0.002 + t * 0.008);
    ctx.stroke();
  }
}
