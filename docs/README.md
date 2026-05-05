# AIdea 프론트엔드 개발 공통 가이드

**AI에게 작업을 위임할 때 반드시 이 문서를 먼저 읽힌 뒤 해당 Phase 문서를 함께 전달한다.**  
이 문서에 정의된 규칙은 모든 Phase에서 예외 없이 적용된다.

---

## Phase 목록

| Phase | 문서                                                             | 주요 내용                                        | 선행 조건    |
| ----- | ---------------------------------------------------------------- | ------------------------------------------------ | ------------ |
| 1     | [phase-1-setup.md](./phase-1-setup.md)                           | 패키지 설치, 파일 구조, 타입 정의, 환경 변수     | 없음         |
| 2     | [phase-2-collab-editor.md](./phase-2-collab-editor.md)           | useCollabEditor 훅, CollaborativeEditor 컴포넌트 | Phase 1 완료 |
| 3     | [phase-3-permission-restore.md](./phase-3-permission-restore.md) | 권한 처리, DB 문서 복원, DocumentPage 조립       | Phase 2 완료 |
| 4     | [phase-4-ai-feedback.md](./phase-4-ai-feedback.md)               | useFeedback 훅, QuestionPanel, FeedbackSplitView | Phase 3 완료 |

---

## 프로젝트 개요

AIdea는 팀 단위 기획 문서를 실시간으로 작성하는 협업 도구다. Notion과 유사하되 아래 기능이 추가된다.

- **팀스페이스** — 팀별로 문서를 분리. 역할(Owner / Member / Viewer)에 따라 편집 권한 분기
- **실시간 협업 편집** — Yjs CRDT + BlockNote 기반. 여러 명이 동시에 수정해도 충돌 없이 병합
- **DB 영속화** — 편집 내용을 `yjs_snapshot` + `document_updates`로 DB에 저장. 재접속 시 복원
- **AI 피드백** — Gemini API가 문서를 분석해 개선안을 Yjs 바이너리로 제안. 유저가 버전 선택

---

## 전체 아키텍처 흐름

```
브라우저
  └── DocumentPage
        ├── useDocument()         — 문서 메타 + snapshotClock fetch (REST)
        ├── useCollabEditor()     — Y.Doc / 커스텀 WebSocket(JSON) / BlockNote 통합
        ├── usePermission()       — 팀스페이스 역할 → canEdit
        └── useFeedback()         — AI 피드백 상태 구독 + API 호출

서버 (WebSocket)
  └── /ws/documents/{docId}?token={jwt}
        ├── 연결 시: { type: "doc:init", updates: string[] } 전송 (Base64 Yjs 배열)
        ├── 수신: { type: "doc:update", update: string } → document_updates INSERT + 브로드캐스트
        └── 배치: document_updates → yjs_snapshot 머지 후 DELETE (같은 트랜잭션)

서버 (REST)
  └── GET  /api/documents/{docId}                — 문서 메타 조회
  └── POST /api/documents/{docId}/feedback       — AI 피드백 요청
  └── POST /api/feedbacks/{feedbackId}/answer    — 질문 답변 제출
  └── POST /api/feedbacks/{feedbackId}/accept    — AI 버전 선택 수락

서버 (SSE)
  └── GET /api/documents/{docId}/feedback/events
        ├── feedback:questioning  — AI가 질문 목록 생성 완료
        └── feedback:ready        — AI 피드백(Yjs 바이너리) 생성 완료
```

---

## AI 개발 규칙

### 코드 스타일

| 항목          | 규칙                                                             |
| ------------- | ---------------------------------------------------------------- |
| 세미콜론      | 사용 안 함                                                       |
| 따옴표        | 작은따옴표 `'`                                                   |
| 컴포넌트 선언 | `function` 선언식 + `default export`                             |
| 타입 선언     | `interface` 우선. union 등 필요한 경우만 `type`                  |
| Tailwind      | v4 — CSS 변수 참조 시 `text-(--var)` 또는 `bg-[var(--var)]` 형식 |
| 주석          | 최소화. WHY가 명확하지 않으면 쓰지 않음                          |

### 파일 위치 규칙

```
새 훅              → src/hooks/{이름}.ts
새 페이지          → src/pages/{이름}Page.tsx
문서 관련 컴포넌트  → src/components/document/{이름}.tsx
피드백 UI 컴포넌트 → src/components/document/feedback/{이름}.tsx
공통 타입          → src/types/document.ts
```

### Yjs 필수 패턴

**① Y.Doc과 connect:false WebsocketProvider는 반드시 `useState` lazy initializer 안에서 생성한다.**

실제 WebSocket 연결은 `useEffect` 안에서 `new WebSocket(...)`으로 직접 생성한다.  
`WebsocketProvider`는 BlockNote `collaboration` 타입 요구사항을 충족하는 더미 인스턴스로만 사용한다.

```tsx
// ✅ 올바름 — 첫 렌더 때 딱 한 번만 실행
const [{ doc, provider }] = useState(() => ({
  doc: new Y.Doc(),
  // connect: false — 실제 WS 연결 없음, BlockNote 타입 요구사항용 더미
  provider: new WebsocketProvider(WS_BASE_URL, docId, doc, { connect: false }),
}))

// ❌ 금지 — 렌더마다 새 인스턴스 생성됨
const doc = new Y.Doc()
const provider = new WebsocketProvider(...)
```

**② `connected` 상태는 WebSocket 이벤트로 관리한다.**

`useCollabEditor`에서는 `WebsocketProvider` 대신 직접 생성한 `WebSocket`의 `onopen` / `onclose` 이벤트로 연결 상태를 추적한다.

```tsx
// ✅ 올바름 — ws 이벤트로 연결 상태 업데이트
const [connected, setConnected] = useState(false);
ws.onopen = () => setConnected(true);
ws.onclose = () => {
  setConnected(false);
  initializedRef.current = false;
};

// ❌ 금지 — connect:false provider는 wsconnected가 항상 false
const [connected, setConnected] = useState(provider.wsconnected);
```

**③ `useEffect` cleanup에서는 `doc.off()`와 `ws.close(1000)`만 호출한다.**

커스텀 WebSocket 연결은 cleanup에서 `ws.close(1000)`으로 정상 종료한다.
`connect: false` provider는 destroy를 호출하지 않는다 — StrictMode 재마운트 보장을 위해.

```tsx
// ✅ 올바름
useEffect(() => {
  const ws = new WebSocket(url);
  const handleUpdate = (update, origin) => {
    /* ... */
  };
  doc.on('update', handleUpdate);
  return () => {
    doc.off('update', handleUpdate);
    ws.close(1000);
  };
}, [docId, token, doc]);
```

**④ `doc.getXmlFragment('document-store')`의 fragment 이름 `'document-store'`는 고정이다.**  
모든 클라이언트가 동일한 fragment 이름을 사용해야 같은 Yjs 공유 데이터를 참조한다. 서버는 Yjs 바이너리를 그대로 저장/릴레이하므로 fragment 이름을 별도로 인식하지 않는다.

**⑤ 서버 연결 없이 로컬 Y.Doc만 렌더할 때는 `connect: false` 옵션을 사용한다.**

```tsx
// useCreateBlockNote의 collaboration.provider는 필수 타입
// 실제 WS 연결 없이 BlockNote collaboration 타입 요구사항을 충족하는 패턴
const provider = new WebsocketProvider(WS_BASE_URL, docId, doc, { connect: false });
```

### 환경 변수 규칙

- 모든 클라이언트 환경 변수는 `VITE_` 접두사 필수
- 현재 프로젝트는 `.env.local` 파일을 사용한다 (`.gitignore`에서 제외됨)
- REST API 호출: `apiClient`를 사용한다 — 환경변수 기반 baseURL이 자동 적용됨
- WebSocket 연결: `${import.meta.env.VITE_WS_BASE_URL}/ws/...`
- `VITE_USE_REAL_AUTH=true` 일 때만 실제 백엔드로 연결; `false`면 MSW가 REST를 목킹

---

## 실습 기반 코드와의 핵심 차이

> 실습 결과물: `src/components/CollaborativeEditor.tsx` (이 레포)

| 항목            | 실습                              | AIdea                                                                      |
| --------------- | --------------------------------- | -------------------------------------------------------------------------- |
| WS URL          | `VITE_WS_BASE_URL + '/ws/editor'` | `/ws/documents/{docId}?token={jwt}` (JWT query param 인증)                 |
| 유저 정보       | `randomPick(NAMES/COLORS)`        | `useCurrentUser()` 훅 + userId 기반 색상                                   |
| 읽기 전용       | 없음                              | `useCreateBlockNote({ editable: false })`                                  |
| 문서 초기화     | 항상 빈 문서                      | `doc:init` 이벤트로 수신 (Base64 Yjs 배열 → `Y.applyUpdate` 순서대로 적용) |
| AI 피드백       | 없음                              | SSE + 상태 기반 UI 4단계 분기                                              |
| 로컬 Y.Doc 렌더 | 없음                              | `connect: false` provider + `Y.applyUpdate()`                              |
| API 호출        | `fetch(...)`                      | `apiClient` (Axios, `@/shared/apiClient`, 쿠키 + 401 자동 처리)            |
| 렌더 위치       | 독립 에디터 페이지                | `MainContent.tsx` 내에 통합 (라우트: `/main/:docId`)                       |

---

## 전체 구현 순서

| 단계 | 파일                                                     | Phase   |
| ---- | -------------------------------------------------------- | ------- |
| 1    | `pnpm add ...` (패키지 설치)                             | Phase 1 |
| 2    | `src/types/document.ts` (타입 정의)                      | Phase 1 |
| 3    | `.env.development` / `.env.production`                   | Phase 1 |
| 4    | `src/hooks/useCollabEditor.ts`                           | Phase 2 |
| 5    | `src/components/document/CollaborativeEditor.tsx`        | Phase 2 |
| 6    | `src/hooks/usePermission.ts`                             | Phase 3 |
| 7    | `src/pages/DocumentPage.tsx`                             | Phase 3 |
| 8    | `src/components/document/feedback/FeedbackButton.tsx`    | Phase 4 |
| 9    | `src/components/document/feedback/FeedbackModal.tsx`     | Phase 4 |
| 10   | `src/hooks/useFeedback.ts`                               | Phase 4 |
| 11   | `src/components/document/feedback/QuestionPanel.tsx`     | Phase 4 |
| 12   | `src/components/document/feedback/FeedbackSplitView.tsx` | Phase 4 |
