import { useState } from "react";
import { BlogLink } from "../components/BlogLink";
import { FractionPreview } from "../components/FractionPreview";
import { HubLink } from "../components/HubLink";
import { Button } from "../components/ui/Button";
import { DIFFICULTY_SETS, type Settings, type SpeedId } from "../config/gameConfig";
import { playTap, setHaptics, setSound, unlock } from "../lib/feedback";
import wetiStanding from "../assets/characters/weti-fullbody.png";

interface HomeScreenProps {
  settings: Settings;
  bestScore: number;
  onChange: (next: Settings) => void;
  onStart: () => void;
}

type Panel = "settings" | "how" | null;

/**
 * 첫 화면.
 *
 * 형제 서비스(구구단 팡팡)의 첫 화면을 그대로 따른다 —
 * 그림 → 이름 → 한 줄 설명 → 바로 시작 → 접힌 보조 버튼 둘 → 링크.
 * 설명을 읽지 않아도 바로 시작할 수 있어야 하고, 고르는 일은 원할 때 펼쳐서 한다.
 */
export function HomeScreen({ settings, bestScore, onChange, onStart }: HomeScreenProps) {
  const [panel, setPanel] = useState<Panel>(null);
  const toggle = (p: Panel) => setPanel((cur) => (cur === p ? null : p));

  return (
    <div className="theme-service flex h-full flex-col items-center justify-center gap-5 overflow-y-auto px-5 py-6 safe-top safe-bottom">
      <div className="flex flex-col items-center gap-2">
        {/* 무슨 게임인지 한 컷으로 보여준다. 웨티 옆에 실제 게임에 나오는 그림을 그대로 띄운다 */}
        <div className="flex items-end gap-1">
          <FractionPreview fraction={{ n: 1, d: 2 }} food="watermelon" size={54} />
          <img src={wetiStanding} alt="분수 그림 앞에 서 있는 웨티" className="h-[18vh] max-h-40 w-auto" draggable={false} />
          <FractionPreview fraction={{ n: 3, d: 4 }} food="pizza" size={54} />
        </div>
        <h1 className="text-3xl font-black text-[var(--color-ink)]">분수 쓱싹</h1>
        <p className="text-sm font-bold text-[var(--color-ink-soft)]">문제에 맞는 그림만 골라 쓱싹 베어요</p>
      </div>

      <Button
        size="xl"
        className="w-full max-w-xs"
        onClick={() => {
          // 첫 터치에서 오디오를 깨운다 (모바일 자동재생 정책)
          unlock();
          setSound(settings.sound);
          setHaptics(settings.haptics);
          playTap();
          onStart();
        }}
        aria-label="바로 시작"
      >
        바로 시작
      </Button>

      <p className="-mt-2 text-xs font-bold text-[var(--color-ink-soft)]">
        {DIFFICULTY_SETS[settings.speed].label}
        {bestScore > 0 && ` · 최고 ${bestScore}점`}
      </p>

      <div className="flex w-full max-w-xs flex-col gap-2">
        <div className="flex gap-2">
          <Button variant="soft" size="sm" className="flex-1" onClick={() => toggle("settings")}>
            설정 바꾸기 {panel === "settings" ? "▴" : "▾"}
          </Button>
          <Button variant="soft" size="sm" className="flex-1" onClick={() => toggle("how")}>
            게임 방법 {panel === "how" ? "▴" : "▾"}
          </Button>
        </div>

        {panel === "settings" && (
          <div className="flex flex-col gap-3 rounded-2xl border-2 border-[var(--color-line)] bg-[var(--color-card)] p-3">
            <Choice
              label="난이도"
              value={settings.speed}
              options={(Object.keys(DIFFICULTY_SETS) as SpeedId[]).map((k) => ({
                id: k,
                label: DIFFICULTY_SETS[k].label,
              }))}
              onPick={(id) => onChange({ ...settings, speed: id })}
            />
            <p className="text-xs font-bold text-[var(--color-ink-soft)]">
              {settings.speed === "slow"
                ? "2·3·4로 나눈 그림만 나와요. 폭탄은 없어요"
                : settings.speed === "normal"
                  ? "6까지 나눠지고 폭탄이 섞여요. 2/4처럼 같은 크기도 정답이에요"
                  : "8까지 나눠지고 빠르게 올라와요"}
            </p>
            <div className="flex flex-col gap-1.5">
              <Toggle
                label="효과음"
                on={settings.sound}
                onToggle={() => onChange({ ...settings, sound: !settings.sound })}
              />
              <Toggle
                label="진동"
                on={settings.haptics}
                onToggle={() => onChange({ ...settings, haptics: !settings.haptics })}
              />
            </div>
          </div>
        )}

        {panel === "how" && (
          <ol className="flex flex-col gap-1.5 rounded-2xl border-2 border-[var(--color-line)] bg-[var(--color-card)] p-4 text-sm font-bold text-[var(--color-ink-soft)]">
            <li>1. 위에 나온 분수만큼 칠해진 그림을 찾아요</li>
            <li>2. 손가락으로 <span className="text-[var(--color-accent)]">쓱</span> 그어서 베어요</li>
            <li>3. 한 번에 여러 개를 베면 점수가 확 올라가요</li>
            <li>4. 다른 그림이나 폭탄을 베면 하트가 줄어요</li>
            <li className="text-[var(--color-ink)]">못 베고 놓친 건 괜찮아요. 하트는 안 줄어요</li>
          </ol>
        )}
      </div>

      <HubLink className="pt-1" />
      <BlogLink />
    </div>
  );
}

function Choice<T extends string>({
  label,
  value,
  options,
  onPick,
}: {
  label: string;
  value: T;
  options: { id: T; label: string }[];
  onPick: (id: T) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-black text-[var(--color-ink-soft)]">{label}</p>
      <div className="flex gap-1.5" role="group" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            aria-pressed={value === o.id}
            onClick={() => {
              playTap();
              onPick(o.id);
            }}
            className={`min-h-11 flex-1 rounded-xl border-2 text-sm font-black transition-transform active:scale-95 ${
              value === o.id
                ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                : "border-[var(--color-line)] bg-white text-[var(--color-ink-soft)]"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Toggle({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => {
        playTap();
        onToggle();
      }}
      className="flex min-h-11 items-center justify-between rounded-xl px-1 text-sm font-black text-[var(--color-ink)]"
    >
      {label}
      <span
        className={`inline-flex h-7 w-12 items-center rounded-full border-2 px-0.5 transition-colors ${
          on ? "border-[var(--color-accent)] bg-[var(--color-accent)]" : "border-[var(--color-line)] bg-white"
        }`}
      >
        <span
          className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : ""}`}
        />
      </span>
    </button>
  );
}
