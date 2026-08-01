/** 모서리가 둥근 노란색 별 아이콘 (중요도 표시용) */
export function StarIcon({
  size = 14,
  filled = true,
  className = "",
}: {
  size?: number;
  filled?: boolean;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
      className={`inline-block shrink-0 ${className}`}
    >
      <path
        d="M12 2.9c.62 0 1.19.35 1.47.9l2.3 4.53 5.02.73c1.32.19 1.85 1.82.89 2.75l-3.63 3.5.86 4.96c.22 1.31-1.15 2.31-2.33 1.7L12 19.66l-4.48 2.31c-1.18.61-2.55-.39-2.33-1.7l.86-4.96-3.63-3.5c-.96-.93-.43-2.56.89-2.75l5.02-.73 2.3-4.53c.28-.55.85-.9 1.47-.9Z"
        fill={filled ? "var(--star)" : "var(--muted)"}
        stroke={filled ? "var(--star-edge)" : "var(--border)"}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 중요도(1~5)를 별로 보여줍니다 */
export function StarRating({
  value,
  size = 14,
  className = "",
}: {
  value: number;
  size?: number;
  className?: string;
}) {
  const count = Math.min(5, Math.max(0, Math.round(value)));
  return (
    <span
      className={`inline-flex items-center gap-0.5 ${className}`}
      aria-label={`중요도 ${count}점`}
    >
      {Array.from({ length: count }, (_, i) => (
        <StarIcon key={i} size={size} />
      ))}
    </span>
  );
}