type Mood = "happy" | "cheer" | "sleepy" | "proud";

interface DachshundProps {
  mood?: Mood;
  size?: number;
  className?: string;
}

/**
 * 댁이 — 앱 마스코트 닥스훈트.
 * mood 로 표정/포즈, size 로 크기를 조절합니다.
 */
export function Dachshund({ mood = "happy", size = 160, className }: DachshundProps) {
  const body = "var(--dog-body)";
  const bodyDark = "var(--dog-body-dark)";
  const belly = "var(--dog-belly)";
  const ink = "var(--dog-ink)";

  const proud = mood === "proud";
  const cheer = mood === "cheer";

  return (
    <svg
      width={size}
      height={size * 0.78}
      viewBox="0 0 200 156"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="닥스훈트 마스코트 댁이"
    >
      {/* 그림자 */}
      <ellipse cx="100" cy="143" rx="66" ry="8" fill={ink} opacity="0.08" />

      {/* 꼬리 */}
      <path
        d={cheer ? "M42 92 C24 86 20 68 30 60" : "M42 94 C26 92 20 80 26 70"}
        stroke={body}
        strokeWidth="9"
        strokeLinecap="round"
      />

      {/* 뒷다리 */}
      <rect x="46" y="104" width="16" height="26" rx="8" fill={bodyDark} />
      <rect x="70" y="104" width="16" height="26" rx="8" fill={bodyDark} />

      {/* 앞다리 */}
      {cheer ? (
        <>
          <path d="M118 98 C126 84 138 78 146 74" stroke={body} strokeWidth="15" strokeLinecap="round" />
          <path d="M134 100 C144 90 154 86 162 84" stroke={bodyDark} strokeWidth="14" strokeLinecap="round" />
        </>
      ) : (
        <>
          <rect x="118" y="104" width="16" height="26" rx="8" fill={bodyDark} />
          <rect x="140" y="104" width="16" height="26" rx="8" fill={body} />
        </>
      )}

      {/* 긴 몸통 */}
      <rect
        x="38"
        y={proud ? 66 : 72}
        width="126"
        height={proud ? 48 : 42}
        rx={proud ? 24 : 21}
        fill={body}
      />
      <rect x="52" y={proud ? 88 : 90} width="96" height="22" rx="11" fill={belly} opacity="0.55" />

      {/* 머리 */}
      <g transform={proud ? "translate(0,-8)" : cheer ? "translate(2,-4)" : ""}>
        <ellipse cx="150" cy="60" rx="34" ry="30" fill={body} />
        {/* 주둥이 */}
        <ellipse cx="172" cy="66" rx="18" ry="14" fill={belly} />
        {/* 코 */}
        <ellipse cx="185" cy="63" rx="7" ry="6" fill={ink} />
        <circle cx="183" cy="61" r="2" fill="var(--dog-shine)" opacity="0.7" />

        {/* 축 처진 귀 */}
        <path d="M132 40 C112 44 108 76 124 92 C138 88 138 60 138 48 Z" fill={bodyDark} />
        <path d="M166 38 C178 42 180 60 172 72 C162 66 160 50 160 42 Z" fill={bodyDark} opacity="0.85" />

        {/* 눈 */}
        {mood === "sleepy" ? (
          <>
            <path d="M141 58 q6 6 12 0" stroke={ink} strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M159 58 q5 5 10 0" stroke={ink} strokeWidth="3" strokeLinecap="round" fill="none" />
          </>
        ) : mood === "happy" || cheer ? (
          <>
            <path d="M141 60 q6 -8 12 0" stroke={ink} strokeWidth="3.4" strokeLinecap="round" fill="none" />
            <path d="M159 60 q5 -7 10 0" stroke={ink} strokeWidth="3.4" strokeLinecap="round" fill="none" />
          </>
        ) : (
          <>
            <circle cx="147" cy="58" r="4.4" fill={ink} />
            <circle cx="164" cy="57" r="4.4" fill={ink} />
            <circle cx="148.6" cy="56.4" r="1.6" fill="var(--dog-shine)" />
            <circle cx="165.6" cy="55.4" r="1.6" fill="var(--dog-shine)" />
          </>
        )}

        {/* 볼터치 */}
        <ellipse cx="136" cy="70" rx="7" ry="4.5" fill="var(--dog-blush)" opacity="0.75" />

        {/* 입 */}
        {mood === "sleepy" ? (
          <ellipse cx="176" cy="76" rx="4" ry="5" fill={ink} opacity="0.6" />
        ) : (
          <path d="M172 74 q6 6 12 0" stroke={ink} strokeWidth="2.6" strokeLinecap="round" fill="none" />
        )}
      </g>

      {/* 무드 장식 */}
      {mood === "sleepy" && (
        <g fill={ink} opacity="0.45" fontSize="14" fontWeight="700">
          <text x="176" y="26">z</text>
          <text x="188" y="14">Z</text>
        </g>
      )}
      {cheer && (
        <g stroke="var(--dog-spark)" strokeWidth="3" strokeLinecap="round">
          <path d="M100 30 v-10" />
          <path d="M84 38 l-7 -7" />
          <path d="M116 38 l7 -7" />
        </g>
      )}
      {proud && (
        <path
          d="M100 24 l4.6 9.4 10.4 1.5 -7.5 7.3 1.8 10.3 -9.3 -4.9 -9.3 4.9 1.8 -10.3 -7.5 -7.3 10.4 -1.5 Z"
          fill="var(--dog-spark)"
        />
      )}
    </svg>
  );
}

export default Dachshund;