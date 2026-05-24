# ClassRegistration
## 프로젝트 개요

핵심 과제는 화면 그리기보다 **조건부 필드, 스텝 간 데이터 정합성, 검증 시점 설계**에 있음.

예를 들면
- 단체로 일부 입력 후 개인으로 바꾸면 group 데이터는 어떻게 되나
- 인원수를 5명에서 3명으로 줄이면 명단 앞 3명을 남길 것인가 뒷 3명을 남길 것인가
- 정원이 거의 다 찬 강의를 선택했을 때 사용자에게 어떻게 알릴 것인가

작은 결정들이 사용자 경험을 좌우한다고 보고 이 부분에 시간을 더 썼다.

## 기술 스택

| 영역 | 선택 |
|---|---|
| Framework | Next.js 14 (App Router) |
| 언어 | TypeScript (strict) |
| 폼 상태 | React Hook Form |
| 검증 | Zod |
| 스텝 간 상태 | Zustand (+ persist) |
| 서버 통신 | TanStack Query |
| Mock API | MSW |
| 스타일 | Tailwind CSS |

선택 이유는 [설계 결정과 이유](#설계-결정과-이유) 섹션에서.

## 실행 방법

```bash
npm install
npx msw init public/ --save   # 최초 1회만
npm run dev
```

http://localhost:3000

## 프로젝트 구조 설명
src/
├── app/                  # Next.js 진입점
├── features/enrollment/
│   ├── types.ts          # 도메인 타입
│   ├── schemas.ts        # Zod 검증 스키마
│   ├── store.ts          # Zustand store
│   ├── api.ts            # fetch + 에러 처리
│   └── components/
│       ├── EnrollmentForm.tsx    # 스텝 라우팅
│       ├── steps/                # 각 스텝 컴포넌트
│       └── fields/               # 재사용 폼 필드
└── mocks/                # MSW 핸들러

**핵심 원칙**: UI에 의존하지 않는 4개 모듈(`types`, `schemas`, `store`, `api`)을 분리. 컴포넌트는 이 4개를 조립할 뿐이다. 스텝이 늘어나도 영향 범위가 좁음.

## 요구사항 해석 및 가정

명세에 없는 지점은 다음과 같이 해석했다.

**단체 → 개인 전환 시 group 데이터**  
입력된 데이터가 있으면 다이얼로그로 동의를 받고 초기화. 자동 보존은 stale 데이터로 인한 정합성 문제를 만든다.

**참가자 이메일 중복**  
나중에 입력된 칸에 에러 표시. 첫 번째 칸을 에러로 만들면 사용자가 혼란스러워한다.

**인원수 변경 시 명단 동기화**  
앞쪽 보존. 5명 → 3명이면 1~3번만 남기고, 5명 → 7명이면 6, 7번에 빈 칸 추가. 사용자는 보통 위에서부터 채우니까.

**정원 거의 다 찬 강의**  
잔여석 3석 이하면 노란 뱃지, 0석은 마감 처리. 단, 제출 시점에 다른 사용자가 먼저 신청해 정원이 찼을 수 있어 서버에서 한 번 더 검증한다.

## 설계 결정과 이유

### 1. 폼 상태: React Hook Form + Zustand 이중 구조

스텝 내부는 RHF, 스텝 간 공유는 Zustand로 분리했다.

[Step1 폼] ─submit─► store에 commit
[Step2 폼] ─submit─► store에 commit
[Step3]    ─submit─► store 전체를 최종 검증 후 POST

**왜 두 개를 같이 쓰나**

책임이 다르기 때문이다.
- 입력 중인 폼 상태는 RHF가 잘하는 영역 (비제어, 검증, 포커스 처리)
- 스텝 간 공유와 영속화는 Zustand가 잘하는 영역

한쪽으로 다 처리하면 어디서든 비용이 생긴다. 모두 Zustand로 다루면 키 입력마다 store가 갱신돼 셀렉터를 정교하게 짜야 하고, 모두 RHF로 다루면 스텝 이동과 새로고침 복구가 까다롭다.

### 2. 개인/단체를 discriminated union으로

```ts
type EnrollmentRequest =
  | { type: "personal"; ... }
  | { type: "group"; ...; group: GroupInfo };
```

"단체인데 group이 undefined"인 상태가 타입 레벨에서 불가능해진다.  
처음엔 `group?: GroupInfo` optional로 했다가 컴포넌트마다 가드 코드를 반복하게 돼서 갈아엎었다.

### 3. 검증은 3단계로

| 시점 | 무엇을 |
|---|---|
| 필드 blur | 개별 필드 형식 |
| 스텝 이동 | 해당 스텝 전체 |
| 제출 직전 | 전체 폼 + cross-field 검증 |
| 서버 측 | 정원, 중복, 약관 |

클라이언트는 사용성을, 서버는 정확성을 책임진다.

### 4. 에러 UX

- 모든 필드에 인라인 에러 + `aria-describedby`
- 제출 시 첫 에러 필드로 자동 포커스 (RHF의 `shouldFocusError`)
- 에러 코드별 액션 분기:
  - `COURSE_FULL` → "다른 강의 선택" 버튼으로 1단계 복귀
  - `DUPLICATE_ENROLLMENT` → 재시도 불가 안내
  - `NETWORK_ERROR` → 입력 유지하고 재시도 권유

### 5. 중복 제출 방지

`useMutation`의 `isPending`으로 버튼 disabled. mutation의 `retry: 0`으로 자동 재시도 없음.

### 6. 스텝 확장을 고려한 구조

각 Step 컴포넌트는 `onNext / onPrev / onEdit` prop만 받고 자기가 몇 번째인지 모른다. 5단계로 늘려도 `TOTAL_STEPS` 상수, `EnrollmentForm`의 분기, 새 스텝 컴포넌트만 추가하면 된다.

## 미구현 / 제약사항

**모바일 전용 레이아웃**  
데스크탑과 동일한 레이아웃을 공유한다. 좁은 화면에서 자연스럽게 좁아지긴 하지만 의도적인 모바일 디자인 분기는 두지 않았다.

**테스트 코드**  
우선순위에서 밀렸다. 추가한다면 schemas의 단위 테스트(이메일 중복, 명단 일치), store의 transition 테스트가 가장 가치 있다.

**참가자 명단 입력 UX**  
10명까지 모든 입력 칸이 동시에 펼쳐져 스크롤이 길다. 실서비스라면 CSV 붙여넣기나 완료된 행 접기 패턴을 적용했을 것이다. 명세 그대로 단순 구조로 두었다.

**접근성**  
aria 속성과 키보드 네비게이션 기본만 챙겼다. 전체 스크린 리더 동선 점검은 추가 검토 필요.

## AI 활용 범위

AI는 보일러플레이트를 빠르게 만들지만 도메인 판단과 UX 디테일은 사람이 끌고 가야 한다는 게 평소 작업 원칙이다.

**AI를 활용한 영역**
- 폴더 구조와 의존성 초기 구성
- Zod 정규식, 에러 메시지 등 반복적 형식
- Mock 데이터 채워 넣기
- Tailwind 클래스 조합

**직접 결정한 영역**
- 폼 상태 관리 방식 (RHF + Zustand 이중 구조)
- discriminated union으로 개인/단체 분리
- 단체 → 개인 전환 시 동작 (다이얼로그, 초기화 시점)
- 인원수 변경 시 명단 동기화 정책
- 검증 시점의 3단 구조
- 에러 코드별 사용자 액션 분기
- 미구현 항목 기준 판단

LLM이 만든 코드를 그대로 두지 않고 직접 읽으며 의도와 다른 부분을 수정한 흔적이 커밋 히스토리에 남아있다.



