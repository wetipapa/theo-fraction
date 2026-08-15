import type { Fraction } from "../lib/fraction";

/**
 * 문제로 제시하는 분수를 세로로 보여준다.
 *
 * `1/2` 같은 한 줄 표기 대신 위아래로 쌓아 그린다. 교과서에서 만나는 모양과 같아야
 * 아이가 학교에서 본 것과 이 게임을 같은 것으로 연결한다.
 *
 * 숫자만으로는 처음 배우는 아이에게 와닿지 않아, 옆에 같은 크기의 그림을 함께 둔다.
 * (그림은 부르는 쪽에서 `FractionPreview`로 붙인다)
 */
export function FractionCard({ fraction, size = 44 }: { fraction: Fraction; size?: number }) {
  const line = Math.max(3, Math.round(size * 0.09));
  return (
    <span
      className="inline-flex flex-col items-center leading-none font-black text-[var(--color-accent-deep)]"
      aria-label={`${fraction.d}분의 ${fraction.n}`}
    >
      <span style={{ fontSize: size }}>{fraction.n}</span>
      <span
        aria-hidden="true"
        style={{ width: size * 0.9, height: line, background: "currentColor", borderRadius: line, margin: `${size * 0.1}px 0` }}
      />
      <span style={{ fontSize: size }}>{fraction.d}</span>
    </span>
  );
}
