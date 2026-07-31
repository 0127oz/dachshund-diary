import { useId, type CSSProperties } from "react";

export type Mood = "happy" | "cheer" | "sleepy" | "proud";

export type DogPalette = Partial<Record<
  | "--dog-body"
  | "--dog-body-dark"
  | "--dog-belly"
  | "--dog-saddle"
  | "--dog-ink"
  | "--dog-shine"
  | "--dog-blush"
  | "--dog-spark"
  | "--dog-collar",
  string
>>;

/** 초콜릿 앤 탄 — 이 컴포넌트의 기본 배색 */
export const CHOCOLATE: DogPalette = {
  "--dog-body": "#6b4430", // 초콜릿
  "--dog-body-dark": "#452a1c", // 귀·꼬리·그림자 쪽 진한 초콜릿
  "--dog-belly": "#dcab6e", // 탄 포인트 — 주둥이·배·발·눈썹
  "--dog-saddle": "#33200f", // 등 무늬
  "--dog-ink": "#2a180d", // 코·눈 (초콜릿은 코가 검정이 아니라 갈색)
  "--dog-shine": "#ffffff",
  "--dog-blush": "#d98a72",
  "--dog-spark": "#f2c14e", // 금색 — 짙은 갈색 위에서 잘 뜹니다
  "--dog-collar": "#3fb5a3",
};

interface DachshundProps {
  mood?: Mood;
  size?: number;
  className?: string;
  /** 꼬리 흔들기·깜빡임 등 미세 애니메이션. 기본 true (reduced-motion 자동 존중) */
  animated?: boolean;
  /** 스크린리더 문구를 직접 지정하고 싶을 때 */
  label?: string;
  /** 일부 색만 갈아끼우고 싶을 때. 지정한 키만 CHOCOLATE 위에 덮어씁니다. */
  palette?: DogPalette;
  style?: CSSProperties;
}

const MOOD_LABEL: Record<Mood, string> = {
  happy: "기분 좋게 서 있는 닥스훈트 마스코트 댁이",
  cheer: "신나서 폴짝 뛰는 닥스훈트 마스코트 댁이",
  sleepy: "졸고 있는 닥스훈트 마스코트 댁이",
  proud: "가슴을 펴고 뿌듯해하는 닥스훈트 마스코트 댁이",
};

/**
 * 댁이 — 앱 마스코트 닥스훈트.
 * mood 로 표정/포즈, size 로 크기를 조절합니다.
 *
 * 기본 배색은 초콜릿 앤 탄(CHOCOLATE)이며 svg 루트에 인라인 변수로 적용됩니다.
 * 색을 바꾸려면 palette prop 으로 필요한 키만 덮어쓰세요.
 *   <Dachshund palette={{ "--dog-collar": "#e2725b" }} />
 */
export function Dachshund({
  mood = "happy",
  size = 160,
  className,
  animated = true,
  label,
  palette,
  style,
}: DachshundProps) {
  // 한 화면에 여러 마리가 있어도 gradient/clip id 와 애니메이션 클래스가 충돌하지 않도록
  const uid = `dk${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  const vars = { ...CHOCOLATE, ...palette } as CSSProperties;

  const body = "var(--dog-body, #6b4430)";
  const bodyDark = "var(--dog-body-dark, #452a1c)";
  const belly = "var(--dog-belly, #dcab6e)";
  const saddle = "var(--dog-saddle, #33200f)";
  const ink = "var(--dog-ink, #2a180d)";
  const shine = "var(--dog-shine, #ffffff)";
  const blush = "var(--dog-blush, #d98a72)";
  const spark = "var(--dog-spark, #f2c14e)";
  const collar = "var(--dog-collar, #3fb5a3)";

  const proud = mood === "proud";
  const cheer = mood === "cheer";
  const sleepy = mood === "sleepy";
  const openEyes = mood === "happy" || proud;

  // 포즈: 고개 각도와 몸 전체의 미세한 자세
  const headPose = proud
    ? "translate(-2 -9) rotate(-6 150 54)"
    : cheer
      ? "translate(2 -5) rotate(4 150 54)"
      : sleepy
        ? "translate(-1 4) rotate(5 150 54)"
        : "";

  return (
    <svg
      width={size}
      height={size * 0.78}
      viewBox="0 0 200 156"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ ...vars, ...style }}
      role="img"
      aria-label={label ?? MOOD_LABEL[mood]}
    >
      <style>{`
        .${uid}-tail { transform-origin: 43px 86px; }
        .${uid}-ear  { transform-origin: 138px 34px; }
        .${uid}-eyes { transform-box: fill-box; transform-origin: center; }
        ${
          animated
            ? `
        @media (prefers-reduced-motion: no-preference) {
          .${uid}-wag  { animation: ${uid}-wag 1s ease-in-out infinite; }
          .${uid}-fast { animation: ${uid}-wag .42s ease-in-out infinite; }
          .${uid}-bob  { animation: ${uid}-bob 2.8s ease-in-out infinite; }
          .${uid}-hop  { animation: ${uid}-hop .66s cubic-bezier(.32,.86,.4,1) infinite; }
          .${uid}-ear  { animation: ${uid}-flop 2.8s ease-in-out infinite; }
          .${uid}-eyes { animation: ${uid}-blink 5.2s infinite; }
          .${uid}-zzz  { animation: ${uid}-float 3s ease-in-out infinite; }
          .${uid}-spk  { animation: ${uid}-twinkle 1.1s ease-in-out infinite; }
          .${uid}-star { transform-box: fill-box; transform-origin: center;
                         animation: ${uid}-pop 2.4s ease-in-out infinite; }
        }`
            : ""
        }
        @keyframes ${uid}-wag { 0%,100% { transform: rotate(-11deg) } 50% { transform: rotate(13deg) } }
        @keyframes ${uid}-bob { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-1.6px) } }
        @keyframes ${uid}-hop { 0%,100% { transform: translateY(0) } 42% { transform: translateY(-7px) } }
        @keyframes ${uid}-flop { 0%,100% { transform: rotate(-3deg) } 50% { transform: rotate(4deg) } }
        @keyframes ${uid}-blink { 0%,93%,100% { transform: scaleY(1) } 96% { transform: scaleY(.08) } }
        @keyframes ${uid}-float { 0%,100% { transform: translateY(0); opacity:.5 } 50% { transform: translateY(-5px); opacity:.9 } }
        @keyframes ${uid}-twinkle { 0%,100% { opacity:.35 } 50% { opacity:1 } }
        @keyframes ${uid}-pop { 0%,100% { transform: scale(1) rotate(0) } 50% { transform: scale(1.14) rotate(8deg) } }
      `}</style>

      <defs>
        <linearGradient id={`${uid}-coat`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={body} />
          <stop offset="1" stopColor={bodyDark} />
        </linearGradient>
        <clipPath id={`${uid}-torso`}>
          <path d="M58 70h84a24 24 0 0 1 0 48H58a24 24 0 0 1 0-48Z" />
          <ellipse cx="146" cy="91" rx="26" ry="26" />
        </clipPath>
      </defs>

      {/* 바닥 그림자 — 점프할 때는 작아집니다 */}
      <ellipse
        cx="102"
        cy="143"
        rx={cheer ? 58 : 70}
        ry={cheer ? 5.5 : 7}
        fill={ink}
        opacity={cheer ? 0.07 : 0.11}
      />

      <g className={cheer ? `${uid}-hop` : `${uid}-bob`}>
        {/* 꼬리 */}
        <g>
          <path
            className={`${uid}-tail ${sleepy ? "" : cheer ? `${uid}-fast` : `${uid}-wag`}`}
            d={
              cheer || proud
                ? "M42 82C26 76 18 58 28 47"
                : sleepy
                  ? "M42 88C28 92 20 88 16 80"
                  : "M42 86C26 84 18 72 22 60"
            }
            stroke={bodyDark}
            strokeWidth="9"
            strokeLinecap="round"
          />
        </g>

        {/* 반대편 다리 (몸통 뒤) */}
        <g fill={bodyDark} opacity="0.75">
          <rect x="66" y="104" width="14" height="30" rx="7" />
          <rect x="132" y="104" width="14" height={cheer ? 20 : 30} rx="7" />
          <ellipse cx="73" cy="133" rx="8.5" ry="5" />
          <ellipse cx="139" cy={cheer ? 123 : 133} rx="8.5" ry="5" />
        </g>

        {/* 긴 몸통 + 가슴 */}
        <path d="M58 70h84a24 24 0 0 1 0 48H58a24 24 0 0 1 0-48Z" fill={`url(#${uid}-coat)`} />
        <ellipse cx="146" cy={proud ? 89 : 91} rx={proud ? 28 : 26} ry="26" fill={`url(#${uid}-coat)`} />

        {/* 등 무늬(새들) — 몸통 안쪽으로만 */}
        <g clipPath={`url(#${uid}-torso)`}>
          <path
            d="M30 64h122c2 16-6 27-22 28-18 1-30-8-48-4-18 4-34 3-46-5Z"
            fill={saddle}
            opacity="0.5"
          />
        </g>

        {/* 배 */}
        <ellipse cx="98" cy="108" rx="50" ry="11" fill={belly} opacity="0.55" />

        {/* 앞쪽 다리 */}
        <g>
          <rect x="46" y="105" width="15" height="29" rx="7.5" fill={body} />
          <rect x="118" y="105" width="15" height={cheer ? 18 : 29} rx="7.5" fill={body} />
          <ellipse cx="53.5" cy="133" rx="9" ry="5.5" fill={belly} />
          <ellipse cx="125.5" cy={cheer ? 122 : 133} rx="9" ry="5.5" fill={belly} />
        </g>

        {/* 목줄 */}
        <path
          d="M121 66C117 84 124 98 140 101"
          stroke={collar}
          strokeWidth="8"
          strokeLinecap="round"
        />
        <circle cx="141" cy="105" r="5" fill={spark} />
        <circle cx="139.4" cy="103.6" r="1.5" fill={shine} opacity="0.8" />

        {/* 머리 */}
        <g transform={headPose}>
          {/* 뒤쪽 귀 */}
          <path d="M167 32c15 3 20 19 14 35-8-4-13-19-14-35Z" fill={bodyDark} opacity="0.7" />

          <ellipse cx="150" cy="54" rx="31" ry="28" fill={`url(#${uid}-coat)`} />

          {/* 주둥이 */}
          <path d="M160 42c18-2 30 6 30 16s-14 18-30 16c-6-10-6-22 0-32Z" fill={belly} />
          <ellipse cx="185" cy="55" rx="8" ry="6.5" fill={ink} />
          <ellipse cx="182.4" cy="52.6" rx="2.4" ry="1.8" fill={shine} opacity="0.75" />

          {/* 앞쪽 축 처진 귀 */}
          <path
            className={`${uid}-ear`}
            d="M139 31c-22 3-34 26-29 50 3 15 17 21 25 12 5-19 7-42 4-62Z"
            fill={bodyDark}
          />

          {/* 눈 */}
          <g className={openEyes ? `${uid}-eyes` : undefined}>
            {sleepy ? (
              <>
                <path d="M140 53q6 6 12 0" stroke={ink} strokeWidth="3" strokeLinecap="round" />
                <path d="M159 51q5 6 11 0" stroke={ink} strokeWidth="3" strokeLinecap="round" />
              </>
            ) : cheer ? (
              <>
                <path d="M139 55q7 -9 13 0" stroke={ink} strokeWidth="3.4" strokeLinecap="round" />
                <path d="M158 53q6 -8 12 0" stroke={ink} strokeWidth="3.4" strokeLinecap="round" />
              </>
            ) : (
              <>
                <ellipse cx="146" cy="53" rx="4.6" ry="5" fill={ink} />
                <ellipse cx="165" cy="51" rx="4.6" ry="5" fill={ink} />
                <circle cx="147.8" cy="51.2" r="1.7" fill={shine} />
                <circle cx="166.8" cy="49.2" r="1.7" fill={shine} />
              </>
            )}
          </g>

          {/* 뿌듯할 때 치켜올린 눈썹 */}
          {proud && (
            <g stroke={belly} strokeWidth="2.8" strokeLinecap="round" opacity="0.95">
              <path d="M140 41q7 -5 13 -2" />
              <path d="M159 38q6 -4 12 -1" />
            </g>
          )}

          {/* 볼터치 */}
          <ellipse cx="134" cy="65" rx="7.5" ry="5" fill={blush} opacity={cheer ? 0.85 : 0.65} />

          {/* 입 */}
          {sleepy ? (
            <ellipse cx="176" cy="70" rx="3.6" ry="4.6" fill={ink} opacity="0.55" />
          ) : cheer ? (
            <>
              <path d="M172 65q8 14 16 2Z" fill={ink} opacity="0.85" />
              <path d="M176 71q4 8 8 1Z" fill={blush} />
            </>
          ) : (
            <path
              d="M174 65q6 8 13 1"
              stroke={ink}
              strokeWidth="2.6"
              strokeLinecap="round"
            />
          )}
        </g>
      </g>

      {/* 무드 장식 */}
      {sleepy && (
        <g fill={ink} opacity="0.5" fontSize="13" fontWeight="700" fontFamily="inherit">
          <text className={`${uid}-zzz`} x="172" y="24">
            z
          </text>
          <text className={`${uid}-zzz`} x="184" y="12" style={{ animationDelay: "-1.2s" }}>
            Z
          </text>
        </g>
      )}
      {cheer && (
        <g className={`${uid}-spk`} stroke={spark} strokeWidth="3" strokeLinecap="round">
          <path d="M104 26v-10" />
          <path d="M86 33l-7-7" />
          <path d="M122 33l7-7" />
        </g>
      )}
      {proud && (
        <path
          className={`${uid}-star`}
          d="M104 16l4.8 9.7 10.7 1.6-7.8 7.5 1.9 10.6-9.6-5-9.6 5 1.9-10.6-7.8-7.5 10.7-1.6Z"
          fill={spark}
        />
      )}
    </svg>
  );
}

export default Dachshund;
