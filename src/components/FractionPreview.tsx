import { useEffect, useRef } from "react";
import { foodById } from "../data/foods";
import type { Fraction } from "../lib/fraction";
import { drawFraction } from "../lib/shapes";
import type { FoodKind } from "../types";

/**
 * 분수 하나를 그림으로 보여주는 작은 캔버스.
 *
 * 게임 화면에서 쓰는 `drawFraction`을 그대로 쓴다. 문제로 보여주는 그림과
 * 날아다니는 그림이 다르게 생기면 아이가 둘을 같은 것으로 못 본다.
 */
export function FractionPreview({
  fraction,
  food = "pizza",
  size = 56,
}: {
  fraction: Fraction;
  food?: FoodKind;
  size?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.translate(size / 2, size / 2);
    drawFraction(ctx, foodById(food), fraction, size * 0.42);
    ctx.restore();
  }, [fraction, food, size]);

  return <canvas ref={ref} width={size} height={size} style={{ width: size, height: size }} aria-hidden="true" />;
}
