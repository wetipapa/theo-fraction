/**
 * 웨티아빠 블로그로 가는 링크.
 *
 * 아이가 노는 화면을 방해하지 않는 자리(첫 화면 맨 아래, 결과 화면)에만 둔다.
 * 게임 중에는 띄우지 않는다 — 이 게임을 아이 손에 쥐여 준 부모가 보는 자리다.
 * 형제 서비스가 같은 문구와 같은 자리를 쓴다.
 */
export function BlogLink({ className = "" }: { className?: string }) {
  return (
    <p className={`text-center text-xs font-bold text-[var(--color-ink-soft)] ${className}`}>
      <a
        href="https://blog.naver.com/wetipapa"
        target="_blank"
        rel="noopener noreferrer"
        className="underline decoration-2 underline-offset-4 hover:text-[var(--color-ink)]"
      >
        ✍️ 웨티아빠 블로그
      </a>
      에서 더 많은 학습 자료를 만나요
    </p>
  );
}
