/**
 * 목표 도메인 타입과 그리드 좌표 계산 로직.
 * 좌표 계산이 이상하면 이 파일만 고치면 됩니다.
 */

export type Goal = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  importance: number; // 1~5
  deadline: string; // "YYYY-MM-DD"
  is_done: boolean;
  is_public: boolean; // 모두의 목표 피드 공개 여부
  created_at: string;
};

/** 그리드 가로축이 담는 최대 기간(일). 이 값을 넘으면 맨 오른쪽에 고정됩니다. */
export const HORIZON_DAYS = 60;

/**
 * deadline 이 date 가 아니라 timestamptz 로 저장돼 있어도 안전하게 날짜만 뽑습니다.
 * "2026-08-07T00:00:00+09:00" -> "2026-08-07"
 */
export function dateOnly(value: string): string {
  return value.slice(0, 10);
}

/** 로컬 타임존 기준 오늘 날짜를 YYYY-MM-DD 로 반환 */
export function todayISO(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

/** YYYY-MM-DD 를 UTC 기준 일(day) 정수로 변환 — 타임존 오차 없이 날짜만 비교하기 위함 */
function toDayNumber(value: string): number {
  const [y, m, d] = dateOnly(value).split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 86_400_000;
}

/** 오늘부터 기한까지 남은 일수. 음수면 이미 지난 것 */
export function daysLeft(deadline: string): number {
  return Math.round(toDayNumber(deadline) - toDayNumber(todayISO()));
}

export function ddayLabel(deadline: string): string {
  const n = daysLeft(deadline);
  if (n === 0) return "D-DAY";
  return n > 0 ? `D-${n}` : `D+${Math.abs(n)}`;
}

/** 기한이 지났는데 아직 못 끝낸 목표 */
export function isOverdue(goal: Goal): boolean {
  return !goal.is_done && daysLeft(goal.deadline) < 0;
}

/** 기한 → 가로 위치. 0 = 임박(왼쪽), 1 = 여유(오른쪽) */
export function xRatio(deadline: string): number {
  const n = daysLeft(deadline);
  if (n <= 0) return 0; // 오늘이거나 지났으면 맨 왼쪽
  if (n >= HORIZON_DAYS) return 1; // 60일 넘으면 맨 오른쪽 고정
  return n / HORIZON_DAYS;
}

/** 중요도 → 세로 위치. 0 = 위(중요), 1 = 아래 */
export function yRatio(importance: number): number {
  const clamped = Math.min(5, Math.max(1, importance));
  return (5 - clamped) / 4;
}

export type Quadrant = {
  key: "now" | "plan" | "spare" | "slow";
  label: string;
  hint: string;
  tone: string; // 배경 클래스
};

/** 배열 순서 = 좌상 → 우상 → 좌하 → 우하 (CSS grid 흐름과 동일) */
export const QUADRANTS: Quadrant[] = [
  { key: "now", label: "지금 당장 🔥", hint: "급하고 중요해요", tone: "bg-accent/15" },
  { key: "plan", label: "계획해서 📌", hint: "중요하니 미리 쪼개기", tone: "bg-primary/10" },
  { key: "spare", label: "짬날 때 ⚡", hint: "빨리 털어버리기", tone: "bg-muted/70" },
  { key: "slow", label: "천천히 🌱", hint: "여유 있게", tone: "bg-secondary/25" },
];

export function quadrantOf(goal: Goal): Quadrant {
  const row = yRatio(goal.importance) < 0.5 ? 0 : 2;
  const col = xRatio(goal.deadline) < 0.5 ? 0 : 1;
  return QUADRANTS[row + col];
}

export type PlacedGoal = { goal: Goal; x: number; y: number };

const GOLDEN_ANGLE = 2.399963229728653;

/**
 * 목표들을 그리드 위 좌표(%)로 배치합니다.
 * 같은 자리에 겹치면 황금각 나선으로 조금씩 흩어놓습니다.
 */
export function layoutGoals(goals: Goal[]): PlacedGoal[] {
  const PAD = 9; // 점이 테두리 밖으로 잘리지 않도록 여백(%)
  const MIN_GAP = 13; // 이보다 가까우면 겹친 것으로 판단
  const clamp = (v: number) => Math.min(100 - PAD, Math.max(PAD, v));

  // 중요하고 급한 것부터 기준 자리를 차지하도록 정렬
  const sorted = [...goals].sort(
    (a, b) => b.importance - a.importance || daysLeft(a.deadline) - daysLeft(b.deadline),
  );

  const placed: PlacedGoal[] = [];
  for (const goal of sorted) {
    const baseX = clamp(xRatio(goal.deadline) * 100);
    const baseY = clamp(yRatio(goal.importance) * 100);

    let x = baseX;
    let y = baseY;
    let step = 0;
    while (step < 30 && placed.some((p) => Math.hypot(p.x - x, p.y - y) < MIN_GAP)) {
      step += 1;
      const radius = 7 + step * 1.6;
      x = clamp(baseX + Math.cos(step * GOLDEN_ANGLE) * radius);
      y = clamp(baseY + Math.sin(step * GOLDEN_ANGLE) * radius);
    }
    placed.push({ goal, x, y });
  }
  return placed;
}
