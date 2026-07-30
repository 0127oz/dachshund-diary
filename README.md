# Dachshund Diary

목표 관리 웹앱 "응지의 목표수첩"을 만들어줘. 귀여운 닥스훈트가 마스코트인 앱이야.

[디자인 톤]

- 따뜻하고 말랑한 느낌. 배경 크림색(#FFF8F0), 메인 브라운(#8B5E3C),

  포인트 코랄(#FF8A65), 서브 민트(#A8D5BA)

- 모든 카드는 radius 20px 이상, 부드러운 그림자

- 폰트는 Pretendard, 제목은 굵고 둥글게

- 모바일 우선 반응형

[마스코트 - 중요]

Dachshund.tsx 라는 재사용 컴포넌트를 SVG로 직접 만들어줘.

- 몸통이 길고 다리가 짧은 갈색 닥스훈트, 축 처진 귀, 동그란 코

- mood prop으로 표정 4가지: 'happy'(웃는 눈), 'cheer'(앞발 들고 응원),

  'sleepy'(눈 감음), 'proud'(가슴 펴고 뿌듯)

- size prop으로 크기 조절 가능

- 이 컴포넌트를 앱 곳곳에서 재사용할 거야

[온보딩]

- 처음 접속하면 닉네임 입력 화면. 가운데에 큰 마스코트(mood='happy')

- "안녕! 나는 댁이야. 너를 뭐라고 부를까?" 문구

- 닉네임 입력 후 시작하기 → Supabase 익명 로그인 처리하고

  profiles 테이블(id, nickname, created_at)에 저장

- 이미 로그인된 사용자는 이 화면을 건너뛰고 바로 홈으로

하단에 탭 네비게이션 3개: 내 목표 / 모두의 목표 / 마이페이지

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ebbdbd65-23ce-43b1-96e8-839b93eb5cf3).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
