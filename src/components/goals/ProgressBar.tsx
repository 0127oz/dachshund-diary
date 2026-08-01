/** 목표 진행률을 보여주는 말랑한 막대 */
export function ProgressBar({
  value,
  done = false,
  className = "",
}: {
  value: number;
  done?: boolean;
  className?: string;
}) {
  const pct = Math.min(100, Math.max(0, Math.round(value)));

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <div
          className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="진행률"
        >
          <div
            className={`h-full rounded-full transition-[width] duration-300 ${
              done || pct === 100 ? "bg-secondary" : "bg-accent"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="shrink-0 text-[11px] font-black text-muted-foreground">{pct}%</span>
      </div>
    </div>
  );
}