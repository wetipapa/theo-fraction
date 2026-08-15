import { useCallback, useEffect, useRef, useState } from "react";
import { FractionCard } from "../components/FractionCard";
import { FractionPreview } from "../components/FractionPreview";
import { Button } from "../components/ui/Button";
import { DIFFICULTY_SETS, RULES, type Settings } from "../config/gameConfig";
import { Engine } from "../lib/engine";
import { playBomb, playSlice, playSolved, playSwing, playTap, playWrong } from "../lib/feedback";
import { render } from "../lib/render";
import { SwipeTrail, type Point } from "../lib/swipe";
import type { RunResult } from "../types";

interface GameScreenProps {
  settings: Settings;
  bestScore: number;
  onEnd: (result: RunResult) => void;
  onQuit: () => void;
}

/**
 * 게임 화면.
 *
 * 캔버스 하나에 전부 그리고, React는 위아래 HUD만 맡는다.
 * 매 프레임 상태를 React에 올리면 60번 다시 그려지느라 게임이 버벅인다.
 * 그래서 점수·하트처럼 눈에 보여야 하는 값만 골라 천천히 끌어올린다.
 */
export function GameScreen({ settings, bestScore, onEnd, onQuit }: GameScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const trailRef = useRef(new SwipeTrail());
  const drawingRef = useRef(false);
  const rafRef = useRef(0);
  const endedRef = useRef(false);

  // HUD에 보여줄 값만 따로 뽑아 둔다
  const [hud, setHud] = useState<{ score: number; hearts: number; combo: number }>({
    score: 0,
    hearts: DIFFICULTY_SETS[settings.speed].hearts,
    combo: 0,
  });
  const [question, setQuestion] = useState(() => {
    const e = new Engine(settings.speed);
    engineRef.current = e;
    return e.question;
  });
  const [paused, setPaused] = useState(false);

  const finish = useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;
    const e = engineRef.current;
    if (e) onEnd(e.result(bestScore));
  }, [bestScore, onEnd]);

  // ── 화면 크기에 맞춰 캔버스를 맞춘다 (고해상도 대응)
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const { width, height } = wrap.getBoundingClientRect();
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  // ── 게임 루프
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    const engine = engineRef.current;
    if (!canvas || !wrap || !engine) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let last = performance.now();
    let hudTimer = 0;

    const loop = (now: number) => {
      rafRef.current = requestAnimationFrame(loop);
      // 탭을 전환했다 돌아오면 dt가 몇 초씩 튄다. 그대로 넣으면 한 프레임에
      // 모든 게 화면 밖으로 날아가므로 한 프레임 분량으로 자른다.
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      if (!paused) engine.tick(dt);
      trailRef.current.prune(now / 1000, RULES.trailLife);

      const { width, height } = wrap.getBoundingClientRect();
      render(ctx, engine, width, height, trailRef.current.list, now / 1000);

      hudTimer += dt;
      if (hudTimer > 0.08) {
        hudTimer = 0;
        setHud((prev) =>
          prev.score === engine.score && prev.hearts === engine.hearts && prev.combo === engine.combo
            ? prev
            : { score: engine.score, hearts: engine.hearts, combo: engine.combo },
        );
      }

      if (engine.phase === "over") finish();
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [paused, finish]);

  // ── 스와이프 입력
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const toLocal = (e: PointerEvent): Point => {
      const r = wrap.getBoundingClientRect();
      return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
    };

    const onDown = (e: PointerEvent) => {
      if (paused) return;
      drawingRef.current = true;
      trailRef.current.clear();
      trailRef.current.add(toLocal(e), performance.now() / 1000);
      canvas.setPointerCapture(e.pointerId);
    };

    const onMove = (e: PointerEvent) => {
      if (!drawingRef.current || paused) return;
      const engine = engineRef.current;
      if (!engine) return;
      e.preventDefault();

      const p = toLocal(e);
      const trail = trailRef.current;
      const prev = trail.list[trail.list.length - 1];
      trail.add(p, performance.now() / 1000);
      if (!prev) return;

      const r = wrap.getBoundingClientRect();
      const movedPx = Math.hypot((p.x - prev.x) * r.width, (p.y - prev.y) * r.height);
      // 손을 짚고만 있는 것과 그은 것을 구분한다
      if (movedPx < 2) return;

      const outcome = engine.slice(prev, p, r.height / r.width);

      if (outcome.bomb) playBomb();
      else if (outcome.wrong > 0) playWrong();
      else if (outcome.hits > 0) {
        for (let i = 0; i < outcome.hits; i++) playSlice(i);
      } else if (trail.totalLength() * r.width > RULES.minSwipeDistance && Math.random() < 0.12) {
        // 허공을 갈랐을 때도 가끔 소리를 준다. 매번 내면 시끄럽다
        playSwing();
      }

      if (outcome.solved) {
        playSolved();
        setQuestion(engine.question);
      }
    };

    const onUp = () => {
      drawingRef.current = false;
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [paused]);

  return (
    <div className="flex h-full flex-col bg-[var(--color-cream)]">
      {/* 위: 점수와 하트 */}
      <header className="flex items-center justify-between px-4 pt-3 safe-top">
        <button
          type="button"
          onClick={() => {
            playTap();
            setPaused(true);
          }}
          aria-label="잠깐 멈추기"
          className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[var(--color-line)] bg-white text-lg font-black text-[var(--color-ink-soft)] shadow-[0_3px_0_var(--color-line-deep)]"
        >
          ‖
        </button>
        <p className="text-2xl font-black text-[var(--color-ink)]" aria-live="off">
          {hud.score}
        </p>
        <p className="text-xl" aria-label={`남은 기회 ${hud.hearts}개`}>
          {"❤️".repeat(hud.hearts)}
          <span className="opacity-25">
            {"❤️".repeat(Math.max(0, DIFFICULTY_SETS[settings.speed].hearts - hud.hearts))}
          </span>
        </p>
      </header>

      {/* 문제 — 화면에서 가장 먼저 눈에 들어와야 하는 자리 */}
      <div className="mx-4 mt-2 flex items-center justify-center gap-4 rounded-3xl border-2 border-[var(--color-line)] bg-[var(--color-card)] px-4 py-2.5">
        <FractionCard fraction={question.target} size={34} />
        <div className="min-w-0">
          <p className="text-sm font-black text-[var(--color-ink)]">{question.prompt}</p>
          {hud.combo > 1 && (
            <p className="text-xs font-black text-[var(--color-accent)]">{hud.combo}연속!</p>
          )}
        </div>
        <FractionPreview fraction={question.target} size={44} />
      </div>

      {/* 놀이터 */}
      <div ref={wrapRef} className="relative min-h-0 flex-1 touch-none">
        <canvas ref={canvasRef} className="absolute inset-0 block" />
      </div>

      {paused && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-[#4a3626cc] px-8">
          <p className="text-2xl font-black text-white">잠깐 멈췄어요</p>
          <Button size="lg" className="w-full max-w-xs" onClick={() => { playTap(); setPaused(false); }}>
            이어서 하기
          </Button>
          <Button variant="soft" size="md" className="w-full max-w-xs" onClick={() => { playTap(); onQuit(); }}>
            그만하기
          </Button>
        </div>
      )}
    </div>
  );
}
