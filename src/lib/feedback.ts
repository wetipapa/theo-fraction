/**
 * 소리와 진동.
 *
 * 음원 파일을 두지 않고 Web Audio로 그때그때 만든다. 받을 것이 없어 첫 로딩이 빠르고,
 * 콤보 수에 따라 음을 올리는 것처럼 상황에 맞춰 바꾸기도 쉽다.
 *
 * 모바일 브라우저는 사용자가 화면을 한 번 건드리기 전에는 소리를 내주지 않는다.
 * 그래서 첫 터치에서 `unlock()`을 부른다.
 */

let ctx: AudioContext | null = null;
let soundOn = true;
let hapticsOn = true;

export function setSound(on: boolean) {
  soundOn = on;
}

export function setHaptics(on: boolean) {
  hapticsOn = on;
}

export function unlock() {
  if (ctx) {
    if (ctx.state === "suspended") void ctx.resume();
    return;
  }
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctor();
  } catch {
    ctx = null;
  }
}

function ready(): AudioContext | null {
  if (!soundOn || !ctx) return null;
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** 음정이 있는 소리 */
function tone(freq: number, duration: number, type: OscillatorType, gain: number, delay = 0) {
  const ac = ready();
  if (!ac) return;
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(amp).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

/** 음정 없는 잡음. 칼이 지나가는 "슥" 소리의 몸통이다 */
function noise(duration: number, gain: number, filterFreq: number, sweepTo?: number) {
  const ac = ready();
  if (!ac) return;
  const t0 = ac.currentTime;
  const frames = Math.floor(ac.sampleRate * duration);
  const buffer = ac.createBuffer(1, frames, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;

  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(filterFreq, t0);
  if (sweepTo) filter.frequency.exponentialRampToValueAtTime(sweepTo, t0 + duration);
  filter.Q.value = 0.9;

  const amp = ac.createGain();
  amp.gain.setValueAtTime(gain, t0);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

  src.connect(filter).connect(amp).connect(ac.destination);
  src.start(t0);
}

function buzz(pattern: number | number[]) {
  if (!hapticsOn) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* 진동을 지원하지 않는 기기 — 없어도 게임은 굴러간다 */
  }
}

/** 칼이 허공을 지나갈 때. 아무것도 못 베도 손맛은 남는다 */
export function playSwing() {
  noise(0.12, 0.05, 2600, 900);
}

/**
 * 제대로 벴을 때.
 * 한 획에 여러 개를 베면 음이 한 칸씩 올라간다 — 콤보가 귀로도 들리게 하는 자리다.
 */
export function playSlice(comboIndex = 0) {
  noise(0.09, 0.16, 3400, 1200);
  const step = Math.min(comboIndex, 6);
  tone(520 * Math.pow(2, step / 12), 0.16, "triangle", 0.16);
  tone(780 * Math.pow(2, step / 12), 0.12, "sine", 0.08, 0.01);
  buzz(comboIndex > 0 ? [12, 22, 16] : 16);
}

/** 오답을 벴을 때. 낮고 둔탁하게 — 야단치는 소리가 되지 않게 짧게 끊는다 */
export function playWrong() {
  tone(180, 0.22, "sawtooth", 0.1);
  tone(120, 0.26, "sine", 0.09, 0.02);
  buzz([30, 40, 30]);
}

/** 폭탄 */
export function playBomb() {
  noise(0.45, 0.3, 420, 90);
  tone(90, 0.4, "sawtooth", 0.14);
  buzz([50, 60, 90]);
}

/** 문제 하나를 다 풀었을 때 */
export function playSolved() {
  [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.2, "triangle", 0.13, i * 0.07));
  buzz([14, 30, 14, 30, 22]);
}

export function playGameOver() {
  [523, 440, 349, 262].forEach((f, i) => tone(f, 0.3, "sine", 0.13, i * 0.14));
  buzz([40, 70, 40, 70, 90]);
}

export function playTap() {
  tone(660, 0.07, "sine", 0.06);
  buzz(10);
}
