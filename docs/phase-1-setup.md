# Phase 1 — 프로젝트 세팅

> **선행 조건:** 없음  
> **다음 단계:** [Phase 2 — 실시간 협업 에디터](./phase-2-collab-editor.md)  
> **공통 규칙:** 반드시 [README.md](./README.md)를 먼저 읽는다.

이 Phase에서 만드는 것:

- 패키지 설치
- 파일/디렉토리 구조
- 공통 타입 정의 (`src/types/document.ts`)
- 환경 변수 설정 (`.env.development` / `.env.production`)

---

## 1. 패키지 설치

```bash
pnpm add yjs@^13.6.30 y-websocket@^3.0.0 \
  @blocknote/core@^0.48.0 \
  @blocknote/react@^0.48.0 \
  @blocknote/mantine@^0.48.0
```

**패키지 역할:**

| 패키지               | 역할                                           |
| -------------------- | ---------------------------------------------- |
| `yjs`                | CRDT 기반 실시간 동기화 데이터 구조            |
| `y-websocket`        | Y.Doc을 WebSocket으로 서버와 연결하는 Provider |
| `@blocknote/core`    | BlockNote 에디터 핵심 로직                     |
| `@blocknote/react`   | `useCreateBlockNote` 훅 등 React 바인딩        |
| `@blocknote/mantine` | 에디터 UI 테마. **CSS 임포트 필수**            |

> `@blocknote/mantine/style.css` 임포트를 빠뜨리면 에디터 레이아웃이 완전히 깨진다.  
> 에디터를 사용하는 컴포넌트 최상단에 반드시 추가한다.
>
> ```tsx
> import '@blocknote/mantine/style.css';
> ```

---

## 2. 파일 구조

Phase 1~4를 거쳐 완성될 전체 파일 구조다. Phase별로 해당 파일만 만들면 된다.

```
src/
├── pages/
│   └── DocumentPage.tsx                          — Phase 3
├── components/
│   └── document/
│       ├── CollaborativeEditor.tsx               — Phase 2
│       └── feedback/
│           ├── FeedbackButton.tsx                — Phase 4
│           ├── FeedbackModal.tsx                 — Phase 4
│           ├── QuestionPanel.tsx                 — Phase 4
│           └── FeedbackSplitView.tsx             — Phase 4
├── hooks/
│   ├── useCollabEditor.ts                        — Phase 2
│   ├── usePermission.ts                          — Phase 3
│   └── useFeedback.ts                            — Phase 4
└── types/
    └── document.ts                               — Phase 1 (지금 만든다)
```

---

## 3. 공통 타입 정의

```typescript
// src/types/document.ts

export type DocumentType = 'IDEA' | 'PLAN' | 'USER_SCENARIO' | 'API_SPEC' | 'ERD';
export type FeedbackStatus = 'PENDING' | 'QUESTIONING' | 'ANSWERING' | 'DONE' | 'ACCEPTED';
export type TeamRole = 'OWNER' | 'MEMBER' | 'VIEWER';

export interface DocumentMeta {
  id: string;
  teamspaceId: string;
  type: DocumentType;
  title: string;
  snapshotClock: number | null; // null이면 신규 문서 — DB에 yjs_snapshot 없음
}

export interface Question {
  id: string; // "q1", "q2" ...
  section: string; // AI가 빈약하다고 판단한 섹션명 (예: "핵심 기능")
  text: string; // 실제 질문 텍스트
  options?: string[]; // 선택지. 없으면 직접 입력만 가능
}

export interface Answer {
  questionId: string; // Question.id 참조
  value: string; // 유저가 선택하거나 직접 입력한 값
}

export interface Feedback {
  id: string;
  documentId: string;
  status: FeedbackStatus;
  questions: Question[] | null; // QUESTIONING 상태에서 채워짐
  yjsBinary: Uint8Array | null; // DONE 상태에서 채워짐
}
```

**타입별 사용 시점:**

| 타입                                               | 사용 Phase                                              |
| -------------------------------------------------- | ------------------------------------------------------- |
| `DocumentMeta`, `TeamRole`                         | Phase 3 — DocumentPage, usePermission                   |
| `Feedback`, `FeedbackStatus`, `Question`, `Answer` | Phase 4 — useFeedback, QuestionPanel, FeedbackSplitView |

---

## 4. 환경 변수

`VITE_` 접두사가 없으면 브라우저에서 읽을 수 없다.

현재 프로젝트는 `.env.local` 파일을 사용한다. 기존 `.env.local`에 `VITE_WS_BASE_URL`을 추가한다.

```bash
# .env.local (기존 내용에 VITE_WS_BASE_URL 추가)
VITE_USE_REAL_AUTH=true
VITE_API_BASE_URL=http://localhost:8080
VITE_WS_BASE_URL=ws://localhost:8080     ← 이 줄을 추가
```

> **`VITE_USE_REAL_AUTH` 플래그:**
>
> - `true`: REST API 요청이 `VITE_API_BASE_URL`로 전달됨 (실제 백엔드 연동)
> - `false` (기본값): MSW가 REST API를 목킹함  
>   WebSocket은 MSW가 인터셉트하지 않으므로 `VITE_WS_BASE_URL`은 항상 실제 서버를 바라봐야 한다.

프로덕션 배포 시에는 `.env.production` 또는 CI/CD 환경 변수로 설정한다.

```bash
# 프로덕션 환경 변수
VITE_USE_REAL_AUTH=true
VITE_API_BASE_URL=https://api.aidea.dev
VITE_WS_BASE_URL=wss://api.aidea.dev
```

WS URL 스킴: `http://` → `ws://`, `https://` → `wss://`

---

## 5. Phase 1 완료 확인

- [ ] `node_modules/@blocknote` 디렉토리 존재 확인
- [ ] `src/types/document.ts` 타입 정의 완료
- [ ] `.env.development` / `.env.production` 양쪽 모두 설정
- [ ] TypeScript 컴파일 에러 없음 (`pnpm build` 또는 IDE 에러 없음)
