# 댁이의 목표수첩 — 2·3단계 소스

1단계(디자인 시스템 · 마스코트 · 온보딩)에 이어 붙이는 파일들입니다.
기존 파일은 하나도 수정하지 않아도 되고, 아래 파일들만 추가하면 됩니다.

## 파일 목록

### 2단계 — 목표 등록 + 2×2 그리드
| 파일 | 역할 |
|---|---|
| `src/lib/goals.ts` | 타입, D-day 계산, **그리드 좌표 로직** |
| `src/hooks/useGoals.ts` | 데이터 조회/변경 훅 (2·3단계 공용) |
| `src/components/goals/GoalFormModal.tsx` | 목표 만들기 · 수정 모달 |
| `src/components/goals/PriorityGrid.tsx` | 기한 × 중요도 매트릭스 |
| `src/components/goals/GoalListCard.tsx` | D-day 순 리스트 카드 |
| `src/components/goals/GoalDetailSheet.tsx` | 상세 · 완료 · 삭제 |
| `src/routes/index.tsx` | 내 목표 화면 |
| `supabase/step2_goals.sql` | goals 테이블 + RLS |

### 3단계 — 모두의 목표 + 응원
| 파일 | 역할 |
|---|---|
| `src/components/social/FeedCard.tsx` | 피드 카드 + 발바닥 응원 버튼 |
| `src/components/social/CommentSheet.tsx` | 댓글 시트 + 빠른 응원 칩 |
| `src/routes/everyone.tsx` | 모두의 목표 |
| `src/routes/me.tsx` | 마이페이지 (완료율 · 받은 응원) |
| `supabase/step3_social.sql` | comments · cheers 테이블 + RLS |

## 적용 순서

1. `supabase/step2_goals.sql` 실행 → 2단계 tsx 파일 추가 → 동작 확인
2. `supabase/step3_social.sql` 실행 → 3단계 tsx 파일 추가

SQL은 러버블 채팅에 그대로 붙여넣고 "이 SQL을 마이그레이션으로 실행해줘"라고 하면 됩니다.

## 전제 조건

- `profiles` 테이블이 이미 있고, `id` 가 `auth.users.id` 와 같아야 합니다
  (goals·comments·cheers 가 `profiles.id` 를 참조합니다).
- `profiles` 의 SELECT 정책이 전체 공개여야 피드에 닉네임이 뜹니다.
  `step2_goals.sql` 마지막에 해당 정책이 들어 있습니다.
- 익명 로그인(Anonymous Sign-in)이 켜져 있어야 합니다.

## 그리드 좌표가 이상할 때

좌표 계산은 전부 `src/lib/goals.ts` 안에 있습니다.

- `HORIZON_DAYS` — 가로축이 담는 기간(기본 60일). 90일로 늘리면 점이 더 왼쪽으로 몰립니다.
- `xRatio()` — 기한 → 가로 위치. 오늘이거나 지난 목표는 0(맨 왼쪽) 고정.
- `yRatio()` — 중요도 5 → 맨 위, 1 → 맨 아래.
- `layoutGoals()` — 겹친 점을 황금각 나선으로 흩뿌립니다.
  `MIN_GAP` 을 키우면 더 멀리, `PAD` 를 키우면 테두리에서 더 안쪽으로 배치됩니다.

## 알아둘 점

- 데이터 조회는 `useState` + `useEffect` 로만 짰습니다. 프로젝트에 react-query가
  있다면 `useGoals.ts` 만 바꿔 끼우면 됩니다.
- 피드는 최신순 60개까지만 불러옵니다. 무한 스크롤이 필요하면 `useFeed` 의
  `.limit(60)` 부분을 페이지네이션으로 바꾸세요.
- 댓글의 `nickname` 은 작성 시점 값을 그대로 저장합니다(비정규화).
  나중에 닉네임을 바꿔도 예전 댓글은 옛 이름으로 남습니다.
- 마이페이지의 "받은 응원"은 내가 내 목표에 누른 응원은 빼고 셉니다.
