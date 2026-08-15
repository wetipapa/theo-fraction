import { DIFFICULTY_SETS, PHYSICS, RULES, type Settings } from "../config/gameConfig";
import { foodById } from "../data/foods";
import type { Particle, Phase, Piece, Popup, Question } from "../types";
import { isCorrectPiece, makeQuestion, makeWave, type Rng } from "./problems";
import { angleOf, distanceToSegment, type Point } from "./swipe";

export interface SliceOutcome {
  hits: number;
  wrong: number;
  bomb: boolean;
  /** 이번 획으로 얻은 점수 */
  gained: number;
  /** 문제를 다 풀어 다음 문제로 넘어갔는가 */
  solved: boolean;
}

/**
 * 게임 한 판.
 *
 * 화면 크기와 무관하게 같은 궤적이 나오도록 **0~1 좌표계**로 계산한다.
 * x는 화면폭, y는 화면높이를 1로 본다. 픽셀로 바꾸는 일은 렌더러가 한다.
 * 이렇게 해 두면 세로가 긴 폰과 짧은 폰에서 난이도가 달라지지 않는다.
 */
export class Engine {
  phase: Phase = "playing";
  hearts: number;
  readonly maxHearts: number;
  score = 0;
  combo = 0;
  bestCombo = 0;
  solved = 0;
  hitsInQuestion = 0;
  question: Question;
  pieces: Piece[] = [];
  particles: Particle[] = [];
  popups: Popup[] = [];
  /** 화면을 흔드는 세기(0~1). 폭탄이나 오답에서 잠깐 오른다 */
  shake = 0;

  private nextId = 1;
  private spawnTimer = 0;
  private readonly diff = DIFFICULTY_SETS.slow;
  private readonly rng: Rng;

  private readonly denominators: number[];

  constructor(settings: Settings, rng: Rng = Math.random) {
    this.rng = rng;
    this.diff = DIFFICULTY_SETS[settings.speed];
    this.denominators = settings.denominators.length > 0 ? settings.denominators : [2, 3, 4];
    this.maxHearts = this.diff.hearts;
    this.hearts = this.diff.hearts;
    this.question = makeQuestion(this.denominators, rng);
    // 시작하자마자 한 무리 올린다. 빈 화면을 보여 주지 않는다
    this.spawnWave();
  }

  get difficulty() {
    return this.diff;
  }

  private spawnWave() {
    const specs = makeWave(this.question, this.denominators, this.diff, this.rng);
    const n = specs.length;
    specs.forEach((spec, i) => {
      // 화면 아래에서 고르게 흩어 올린다. 같은 자리에서 겹쳐 나오지 않게 칸을 나눈다
      const slot = (i + 0.5) / n;
      const jitter = (this.rng() - 0.5) * (0.6 / n);
      const x = Math.min(0.88, Math.max(0.12, slot + jitter));
      const speed = this.diff.speed;
      this.pieces.push({
        id: this.nextId++,
        role: spec.role,
        fraction: spec.fraction,
        food: spec.food,
        x,
        y: 1.12,
        vx: rand(this.rng, PHYSICS.driftSpeed.min, PHYSICS.driftSpeed.max) * speed,
        vy: -rand(this.rng, PHYSICS.launchSpeed.min, PHYSICS.launchSpeed.max) * speed,
        angle: (this.rng() - 0.5) * 2 * PHYSICS.tilt,
        spin: rand(this.rng, PHYSICS.spin.min, PHYSICS.spin.max),
        sliced: false,
        sliceAngle: 0,
        slicedAt: 0,
      });
    });
  }

  tick(dt: number) {
    if (this.phase === "over") {
      this.stepParticles(dt);
      return;
    }

    this.spawnTimer += dt;
    const airborne = this.pieces.filter((p) => !p.sliced).length;
    if (this.spawnTimer >= this.diff.interval && airborne < this.diff.maxConcurrent) {
      this.spawnTimer = 0;
      this.spawnWave();
    }

    for (const p of this.pieces) {
      // 올라갈 때와 떨어질 때 힘을 다르게 준다. 같은 힘으로 떨어뜨리면
      // 올라온 속도 그대로 내려가서 겨냥할 틈 없이 휙 지나간다.
      p.vy += (p.vy < 0 ? PHYSICS.gravity : PHYSICS.fallGravity * this.diff.fall) * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.angle += p.spin * dt * Math.PI * 2;
      if (p.sliced) p.slicedAt += dt;
    }

    // 화면 밖으로 나간 것 정리. 정답을 놓쳐도 벌점은 없다 — 콤보만 끊긴다.
    // 아이가 화면을 다 훑을 수는 없는데 놓칠 때마다 하트가 깎이면 금방 끝나 버린다.
    const before = this.pieces.length;
    this.pieces = this.pieces.filter((p) => {
      const gone = p.y > 1.3 || p.x < -0.3 || p.x > 1.3;
      if (gone && !p.sliced && p.role === "target") this.combo = 0;
      return !gone && !(p.sliced && p.slicedAt > 1.1);
    });
    if (before !== this.pieces.length) this.spawnTimer = Math.max(this.spawnTimer, 0);

    this.stepParticles(dt);
    this.shake = Math.max(0, this.shake - dt * 3);
  }

  private stepParticles(dt: number) {
    for (const q of this.particles) {
      q.vy += PHYSICS.gravity * 0.8 * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.life -= dt;
    }
    this.particles = this.particles.filter((q) => q.life > 0);
    for (const u of this.popups) u.life -= dt;
    this.popups = this.popups.filter((u) => u.life > 0);
  }

  /**
   * 한 획을 그었다. 걸린 것들을 모두 벤다.
   *
   * 정답과 오답이 같은 획에 걸리면 둘 다 처리한다 — 오답을 피하는 것도 실력이라
   * "정답만 골라 세는" 식으로 봐주지는 않는다. 다만 판정 반경은 넉넉하다.
   */
  slice(a: Point, b: Point, aspect: number): SliceOutcome {
    const out: SliceOutcome = { hits: 0, wrong: 0, bomb: false, gained: 0, solved: false };
    if (this.phase === "over") return out;

    const radius = PHYSICS.radius * RULES.hitPadding;

    for (const p of this.pieces) {
      if (p.sliced) continue;
      // y는 화면높이 기준이라 x와 축척이 다르다. 거리를 재기 전에 x축으로 환산해 맞춘다
      const hit =
        distanceToSegment(
          { x: p.x, y: p.y * aspect },
          { x: a.x, y: a.y * aspect },
          { x: b.x, y: b.y * aspect },
        ) <= radius;
      if (!hit) continue;

      p.sliced = true;
      p.sliceAngle = angleOf(a, b);
      p.slicedAt = 0;

      if (p.role === "bomb") {
        out.bomb = true;
        this.burst(p, "#3A3A3A", 26);
        continue;
      }

      if (isCorrectPiece(this.question, p.fraction, this.diff)) {
        out.hits++;
        this.burst(p, foodById(p.food).juice, 18);
      } else {
        out.wrong++;
        this.burst(p, "#9A9A9A", 10);
      }
    }

    if (out.bomb) {
      this.hearts--;
      this.combo = 0;
      this.shake = 1;
      this.popups.push({ x: 0.5, y: 0.42, text: "앗! 폭탄", life: 0.9, kind: "miss" });
    }

    if (out.wrong > 0) {
      this.hearts--;
      this.combo = 0;
      this.shake = Math.max(this.shake, 0.6);
      this.popups.push({ x: 0.5, y: 0.5, text: "이건 아니야", life: 0.9, kind: "miss" });
    }

    if (out.hits > 0) {
      // 한 획에 여러 개를 베면 배수가 붙는다. 몰아 베는 맛을 만드는 자리
      const multiplier = Math.min(out.hits, RULES.maxComboMultiplier);
      out.gained = RULES.baseScore * out.hits * multiplier;
      this.score += out.gained;
      this.combo += out.hits;
      this.bestCombo = Math.max(this.bestCombo, this.combo);
      this.hitsInQuestion += out.hits;

      this.popups.push({
        x: 0.5,
        y: 0.34,
        text: out.hits > 1 ? `${out.hits}개 동시! +${out.gained}` : `+${out.gained}`,
        life: 1,
        kind: out.hits > 1 ? "combo" : "score",
      });

      if (this.hitsInQuestion >= RULES.hitsPerQuestion) {
        this.hitsInQuestion = 0;
        this.solved++;
        this.question = makeQuestion(this.denominators, this.rng);
        out.solved = true;
      }
    }

    if (this.hearts <= 0) {
      this.hearts = 0;
      this.phase = "over";
    }

    return out;
  }

  private burst(p: Piece, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const a = this.rng() * Math.PI * 2;
      const s = 0.12 + this.rng() * 0.45;
      this.particles.push({
        x: p.x,
        y: p.y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 0.15,
        life: 0.4 + this.rng() * 0.5,
        maxLife: 0.9,
        size: 0.004 + this.rng() * 0.012,
        color,
      });
    }
  }

  result(previousBest: number) {
    return {
      score: this.score,
      bestCombo: this.bestCombo,
      solved: this.solved,
      isBest: this.score > previousBest,
    };
  }
}

function rand(rng: Rng, min: number, max: number): number {
  return min + rng() * (max - min);
}
