import { foodById } from "../data/foods";
import type { RunResult } from "../types";
import { drawFraction } from "./shapes";
import wetiProud from "../assets/characters/weti-proud.png";
import wetiHappy from "../assets/characters/weti-happy.png";

/**
 * 결과를 한 장의 사진으로 만든다.
 *
 * 부모가 아이 기록을 남기거나 카톡으로 보내려면 화면 캡처밖에 방법이 없는데,
 * 캡처는 브라우저 주소창까지 같이 찍힌다. 필요한 것만 담은 카드를 그려 준다.
 * 형제 서비스(구구단 팡팡)와 같은 규격·같은 구조다.
 *
 * 서버로 보내지 않는다. 기기 안에서 그려서 바로 저장하거나 공유한다.
 */
const W = 1080;
const H = 1350;
const FONT = '"Apple SD Gothic Neo", "Malgun Gothic", "맑은 고딕", system-ui, sans-serif';

const ACCENT = "#C42D6E";
const ACCENT_DEEP = "#8E1B4C";
const INK = "#4A3626";
const INK_SOFT = "#8A6A4A";
const CARD = "#FFFAF1";
const LINE = "#F1E0C4";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

export async function buildResultImage(result: RunResult, bestScore: number): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const c = canvas.getContext("2d");
  if (!c) return null;

  // 배경 (흰 분홍 → 연분홍). 서비스 색 계열로 어느 게임 기록인지 한눈에 보이게 한다
  const bg = c.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#FFF5F8");
  bg.addColorStop(1, "#FBE4EE");
  c.fillStyle = bg;
  c.fillRect(0, 0, W, H);

  c.textAlign = "center";

  // 제목
  c.fillStyle = INK_SOFT;
  c.font = `700 40px ${FONT}`;
  c.fillText("분수 쓱싹", W / 2, 108);

  // 웨티 배지
  try {
    const img = await loadImage(result.isBest ? wetiProud : wetiHappy);
    const size = 220;
    const cx = W / 2;
    const cy = 268;
    c.save();
    c.beginPath();
    c.arc(cx, cy, size / 2, 0, Math.PI * 2);
    c.fillStyle = CARD;
    c.fill();
    c.lineWidth = 10;
    c.strokeStyle = ACCENT;
    c.stroke();
    c.clip();
    c.drawImage(img, cx - size / 2, cy - size / 2, size, size);
    c.restore();
  } catch {
    // 이미지를 못 불러와도 카드는 만들어져야 한다
  }

  // 점수
  c.fillStyle = ACCENT;
  c.font = `800 38px ${FONT}`;
  c.fillText(result.isBest ? "새 최고 기록!" : "오늘의 기록", W / 2, 432);

  c.fillStyle = INK;
  c.font = `800 168px ${FONT}`;
  c.fillText(String(result.score), W / 2, 580);

  c.fillStyle = INK_SOFT;
  c.font = `700 34px ${FONT}`;
  c.fillText(`최고 ${Math.max(bestScore, result.score)}점`, W / 2, 632);

  // 통계 2칸
  const stats: [string, string][] = [
    ["푼 문제", `${result.solved}개`],
    ["최고 연속", `${result.bestCombo}개`],
  ];
  const bw = 452;
  const bh = 150;
  const gap = 28;
  const x0 = (W - bw * 2 - gap) / 2;
  const y0 = 700;
  stats.forEach(([label, value], i) => {
    const x = x0 + i * (bw + gap);
    c.fillStyle = CARD;
    roundRect(c, x, y0, bw, bh, 32);
    c.fill();
    c.lineWidth = 5;
    c.strokeStyle = LINE;
    c.stroke();

    c.fillStyle = INK_SOFT;
    c.font = `700 30px ${FONT}`;
    c.fillText(label, x + bw / 2, y0 + 56);
    c.fillStyle = INK;
    c.font = `800 54px ${FONT}`;
    c.fillText(value, x + bw / 2, y0 + 116);
  });

  // 이 판에서 만난 분수들.
  // 숫자만 있는 카드보다, 게임에서 보던 그림이 그대로 있어야 아이가 자기 기록으로 알아본다.
  if (result.seen.length > 0) {
    const y = y0 + bh + 118;
    c.fillStyle = INK_SOFT;
    c.font = `700 30px ${FONT}`;
    c.fillText("오늘 만난 분수", W / 2, y);

    const shown = result.seen.slice(0, 4);
    const cell = 190;
    const gapX = 24;
    const totalW = shown.length * cell + (shown.length - 1) * gapX;
    shown.forEach((f, i) => {
      const x = (W - totalW) / 2 + i * (cell + gapX);
      c.fillStyle = "#FFFFFF";
      roundRect(c, x, y + 34, cell, cell, 34);
      c.fill();
      c.lineWidth = 5;
      c.strokeStyle = LINE;
      c.stroke();

      c.save();
      c.translate(x + cell / 2, y + 34 + cell * 0.44);
      drawFraction(c, foodById(i % 2 === 0 ? "pizza" : "watermelon"), f, cell * 0.3);
      c.restore();

      c.fillStyle = ACCENT_DEEP;
      c.font = `800 34px ${FONT}`;
      c.fillText(`${f.n}/${f.d}`, x + cell / 2, y + 34 + cell - 22);
    });
  }

  // 날짜와 주소
  c.fillStyle = ACCENT_DEEP;
  c.font = `700 30px ${FONT}`;
  const d = new Date();
  c.fillText(`${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}  ·  slice.wetipapa.com`, W / 2, H - 48);

  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/png"));
}

export type SaveOutcome = "shared" | "downloaded" | "failed";

/**
 * 사진을 저장한다.
 * 모바일은 공유 시트가 뜨는 편이 자연스럽고(사진 앱에 바로 저장된다),
 * 공유를 지원하지 않으면 내려받기로 넘어간다.
 */
export async function saveResultImage(blob: Blob, filename: string): Promise<SaveOutcome> {
  const file = new File([blob], filename, { type: "image/png" });

  if (navigator.canShare?.({ files: [file] })) {
    try {
      // 공유 시트가 열려 있는 동안 이 약속은 끝나지 않는다. 사용자가 앱을 고르는 시간이
      // 필요하므로 넉넉히 두되, 시트가 아예 뜨지 않는 환경에서 버튼이 영영 굳지 않도록
      // 안전장치로만 시간 제한을 건다.
      await Promise.race([
        navigator.share({ files: [file], title: "분수 쓱싹 기록" }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("share-timeout")), 60000)),
      ]);
      return "shared";
    } catch (err) {
      // 사용자가 공유 시트를 닫은 경우는 실패가 아니다
      if (err instanceof DOMException && err.name === "AbortError") return "shared";
    }
  }

  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    // 일부 브라우저는 문서에 붙어 있지 않은 링크의 클릭을 무시한다
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 1000);
    return "downloaded";
  } catch {
    return "failed";
  }
}
