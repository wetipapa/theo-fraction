/**
 * 분수 계산 유틸.
 *
 * 화면·게임 로직 어디서도 분수를 소수로 바꿔 비교하지 않는다.
 * 1/3을 0.333…으로 다루면 2/6과 같은지 판정할 때 반올림 오차가 끼어든다.
 * 정수 곱셈(a.n * b.d === b.n * a.d)으로만 비교한다.
 */
export interface Fraction {
  /** 분자 */
  n: number;
  /** 분모 — 0이 될 수 없다 */
  d: number;
}

export function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    [x, y] = [y, x % y];
  }
  return x;
}

/** 기약분수로 줄인다. 2/4 -> 1/2 */
export function reduce(f: Fraction): Fraction {
  const g = gcd(f.n, f.d) || 1;
  return { n: f.n / g, d: f.d / g };
}

/** 생김새까지 똑같은가. 1/2과 2/4는 다르다고 본다 */
export function isSame(a: Fraction, b: Fraction): boolean {
  return a.n === b.n && a.d === b.d;
}

/** 크기가 같은가. 1/2과 2/4는 같다고 본다 (동치분수) */
export function isEquivalent(a: Fraction, b: Fraction): boolean {
  return a.n * b.d === b.n * a.d;
}

/** a가 b보다 크면 양수, 작으면 음수, 같으면 0 */
export function compare(a: Fraction, b: Fraction): number {
  return a.n * b.d - b.n * a.d;
}

/** 0 <= n <= d 인 제대로 된 분수인가 */
export function isValid(f: Fraction): boolean {
  return Number.isInteger(f.n) && Number.isInteger(f.d) && f.d > 0 && f.n >= 0 && f.n <= f.d;
}

/** 화면에 쓰는 표기. 세로 분수는 컴포넌트가 그리고, 여기서는 읽기용 한 줄만 만든다 */
export function toText(f: Fraction): string {
  return `${f.d}분의 ${f.n}`;
}

/** 같은 크기의 다른 표현을 만든다. 1/2 -> [2/4, 3/6, 4/8] */
export function equivalentsOf(f: Fraction, maxDenominator: number): Fraction[] {
  const base = reduce(f);
  const out: Fraction[] = [];
  for (let k = 2; base.d * k <= maxDenominator; k++) {
    out.push({ n: base.n * k, d: base.d * k });
  }
  return out;
}
