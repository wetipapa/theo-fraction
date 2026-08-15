import { BlogLink } from "../components/BlogLink";
import { HubLink } from "../components/HubLink";
import { Button } from "../components/ui/Button";
import { playTap } from "../lib/feedback";
import type { RunResult } from "../types";
import wetiProud from "../assets/characters/weti-proud.png";
import wetiHappy from "../assets/characters/weti-happy.png";
import wetiIdle from "../assets/characters/weti-idle.png";

interface ResultScreenProps {
  result: RunResult;
  bestScore: number;
  onRetry: () => void;
  onHome: () => void;
}

/**
 * 결과 화면.
 *
 * 점수를 크게 보여주되 "몇 개 틀렸는지"는 세지 않는다.
 * 아이가 다시 하고 싶어지는 게 먼저다. 못한 것을 세어 보여 주면 한 판으로 끝난다.
 */
export function ResultScreen({ result, bestScore, onRetry, onHome }: ResultScreenProps) {
  const face = result.isBest ? wetiProud : result.solved > 0 ? wetiHappy : wetiIdle;
  const headline = result.isBest
    ? "새 최고 기록이에요!"
    : result.solved > 0
      ? "잘했어요!"
      : "다시 해볼까요?";

  return (
    <div className="theme-service flex h-full flex-col items-center justify-center gap-4 overflow-y-auto px-5 py-6 safe-top safe-bottom">
      <img
        src={face}
        alt=""
        aria-hidden="true"
        className="h-24 w-24 rounded-full border-4 border-[var(--color-accent-soft)] bg-white object-cover"
      />

      <div className="text-center">
        <p className="text-sm font-black text-[var(--color-ink-soft)]">{headline}</p>
        <p className="text-5xl font-black text-[var(--color-ink)]">{result.score}</p>
        <p className="text-xs font-bold text-[var(--color-ink-soft)]">최고 {Math.max(bestScore, result.score)}점</p>
      </div>

      <div className="grid w-full max-w-xs grid-cols-2 gap-2">
        <Stat label="푼 문제" value={`${result.solved}개`} />
        <Stat label="최고 연속" value={`${result.bestCombo}개`} />
      </div>

      <div className="mt-4 flex w-full max-w-xs flex-col gap-2">
        <Button
          size="xl"
          onClick={() => {
            playTap();
            onRetry();
          }}
        >
          한 번 더 하기
        </Button>
        <Button
          variant="soft"
          size="sm"
          onClick={() => {
            playTap();
            onHome();
          }}
        >
          설정 바꾸기
        </Button>
        <HubLink className="pt-1" />
        <BlogLink />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border-2 border-[var(--color-line)] bg-[var(--color-card)] px-3 py-2.5 text-center">
      <p className="text-[11px] font-black text-[var(--color-ink-soft)]">{label}</p>
      <p className="text-lg font-black text-[var(--color-ink)]">{value}</p>
    </div>
  );
}
