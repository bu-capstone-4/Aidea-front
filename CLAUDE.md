# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Aidea — AI가 아이디어를 기획 문서로 구체화하고, 팀이 실시간으로 함께 다듬은 뒤, 완성된 기획을 기반으로 AI가 백로그(Epic/Story/Task)를 자동 생성해 관리할 수 있게 하는 협업 플랫폼의 프론트엔드. 백엔드는 별도 레포(`Aidea-back`, Spring).

## Commands

```bash
pnpm install      # 의존성 설치
pnpm dev           # 개발 서버 (vite)
pnpm build         # tsc -b && vite build (타입체크 포함)
pnpm lint          # eslint .
pnpm preview       # 빌드 결과 프리뷰
```

테스트 러너는 구성되어 있지 않음. `pnpm build`가 타입 오류 검출(tsc) 역할을 겸함.

커밋 시 husky `pre-commit` 훅이 `lint-staged`를 실행해 staged된 `*.ts/tsx`에 prettier+eslint --fix, `*.css/json/md`에 prettier를 적용함.

## Environment

`.env.local`에 다음 값 필요 (`vite.config.ts`에서 `@` → `src` 경로 별칭 사용):

- `VITE_USE_REAL_AUTH`: `true`면 GitHub OAuth 등 auth API가 실제 백엔드로 전달됨. `false`(기본값)면 목 모드로 동작.
- `VITE_API_BASE_URL`: 실제 백엔드 모드에서 사용 (예: `http://localhost:8080`). 목 모드에서는 빈 값 유지.
- `VITE_WS_BASE_URL`: WebSocket 서버 주소. 목 모드 여부와 무관하게 항상 실제 서버를 바라봄.

## Architecture

### 인증 흐름

- `App.tsx`의 `AuthInitializer`가 마운트 시 `/api/auth/me`를 호출해 `authStore`의 인증 상태를 채움. 라우트는 이 상태로 게이팅됨(`ProtectedRoute`).
- 로그인은 GitHub OAuth 리다이렉트(`useAuth.login`)이며, 세션은 httpOnly 쿠키 기반(`apiClient`에 `withCredentials: true`).
- `apiClient`(axios) 응답 인터셉터가 401을 가로채 `basicClient`(인터셉터 없는 별도 인스턴스)로 `/api/auth/refresh`를 호출하고 원요청을 재시도함. refresh 자체가 실패하면 `authStore`를 비인증으로 돌리고 `/`로 리다이렉트. 동시에 여러 401이 발생하면 `failedQueue`로 직렬화해 refresh를 한 번만 수행.
- 서버 에러 코드(`code` 필드)는 `apiClient.ts` 내 도메인별 메시지 맵(`INVITATION_ERROR_MESSAGES`, `ROLE_CHANGE_ERROR_MESSAGES`, `BACKLOG_DRAFT_ERROR_MESSAGES`)으로 한국어 토스트 메시지로 변환됨. 새 에러 코드를 다루는 API를 추가하면 이 패턴을 따라 맵을 확장할 것.

### 실시간 통신 — 3개의 독립된 WebSocket

raw `WebSocket`(socket.io 아님)을 사용하는 3개의 분리된 연결이 있고, 각각 자신의 Zustand 스토어만 갱신함:

1. **문서 협업 소켓** (`useCollabEditor.ts`, `/ws/documents/{docId}`) — Yjs CRDT 업데이트를 base64로 인코딩해 주고받음. BlockNote 에디터(`CollaborativeEditor.tsx`)가 `Y.Doc` + `WebsocketProvider`(connect: false인 더미, 실제 동기화는 위 raw socket이 수행)로 동작. 같은 소켓으로 AI 피드백 진행 상태(`feedback:*`)와 AI 초안 질의응답 상태(`activeDraft`)도 함께 전달됨 → `FeedbackStore`, `teamspaceStore`의 `draftQA`를 갱신.
2. **백로그 소켓** (`useBacklogSocket.ts`, `/ws/backlog/{teamspaceId}`) — Epic/Story/Task/BacklogTask의 CRUD 및 정렬, AI 백로그 초안 생성 상태(`backlog:draft_*`)를 JSON 이벤트로 전달. `backlogStore`를 갱신. `backlog:draft_ready` 수신 시 최신 목록을 다시 받기 위해 소켓을 강제 재연결함(`reconnectKey`).
3. **팀스페이스 소켓** (`useTeamspaceSocket.ts`, `/ws/teamspace/{teamspaceId}`) — 온라인 멤버 프레즌스, 문서별 AI 상태(`documentAiStatuses`), 멤버 역할 변경을 전달. 연결 시/문서 전환 시 `member:focus` 이벤트로 현재 보고 있는 문서를 서버에 알림.

세 소켓 모두 에러 메시지를 `socketErrorHandler.handleSocketError`로 위임해 토스트로 표시하고, `UNAUTHORIZED`/`SESSION_EXPIRED`는 치명적 에러로 처리해 로그인 페이지로 보냄.

신규 WebSocket 이벤트 타입을 추가할 때는 `types/backlog.ts` 또는 `types/socket.ts`의 판별 유니온(discriminated union)에 추가하고, 해당 훅의 `VALID_*_TYPES`/타입가드와 `switch`에도 반영해야 함.

### 백로그 도메인 모델

`Epic` → `Story` → `Task`(스토리 하위 태스크)의 계층 구조와, 별도로 어떤 스토리에도 속하지 않을 수 있는 최상위 `BacklogTask`(`storyId: number | null`로 스토리에 연결 가능)가 공존함. 이 구분은 `backlogStore`의 상태 분리(`stories`/`tasksByStoryId` vs `backlogTasks`)와 `api/backlog.ts`의 엔드포인트 분리(`/stories/{id}/tasks` vs `/tasks`)에 그대로 반영되어 있음.

백로그 설정(`BacklogConfigResponse`)은 팀스페이스당 1회 초기 생성 시 `generateDraft: true`를 함께 보내면 기획 문서를 기반으로 AI가 Epic/Story/Task 초안을 생성함(`backlog:draft_started` → `backlog:draft_ready`/`backlog:draft_error`). 이미 설정이 존재하면 초안 재생성 불가(`BACKLOG_DRAFT_NOT_FIRST_CREATION`).

### 상태 관리 패턴

- 전역 상태는 Zustand 스토어(`src/store/`)로 관리하고, 서버 권위 상태(인증, 백로그, 팀스페이스 프레즌스, 피드백, 문서 에디터)를 보관함. 컴포넌트 로컬 UI 상태는 `useState`로 충분.
- REST 호출과 스토어 갱신을 묶는 훅(`useTaskApi.ts`, `useStoryApi.ts`, `useBacklogTaskApi.ts`)이 `src/hooks/`에 있고, 순수 axios 호출 자체는 `src/api/`에 분리되어 있음. API 함수는 모두 `GlobalResponse<T> = { data: T }` 래퍼를 벗기고 `T`를 반환.
- WebSocket으로 들어온 변경은 REST 응답을 거치지 않고 직접 스토어의 `apply*` 액션을 호출해 반영됨 (다른 사용자의 변경사항을 실시간으로 보여주기 위함). REST 훅도 자기 자신의 변경을 같은 `apply*` 액션으로 반영하므로, 본인 변경에 대해 소켓 이벤트가 중복 도착해도 멱등하게 처리되어야 함(`applyEpicCreated` 등의 `some(...)` 중복 체크 참고).

### 라우팅 및 페이지

- `/` : 비인증 시 `LandingPage`, 인증 시 `MainPage`(팀스페이스/문서 자동 선택 후 `/main/:docId`로 리다이렉트).
- `/main/:docId` : 기획 문서 에디터 + 백로그 모달 진입점(`MainPage.tsx`).
- `/create` : 팀스페이스 생성 플로우(`CreateTeamSpace/Step1`, `Step2`).
- `/invite` : 초대 링크 수신 페이지. 비인증 상태면 토큰을 `localStorage`에 보관(`pending_invite_token`) 후 로그인 완료 시 `App.tsx`의 `RootRoute`에서 자동으로 `/api/invitations/accept` 호출.

### 기타

- `docs/openapi.json`에 백엔드 OpenAPI 스펙이 있음 — 새 API 연동 전에 요청/응답 스키마 확인용으로 참고.
- 경로 별칭 `@/*` → `src/*` (`tsconfig.app.json`, `vite.config.ts` 양쪽에 동기화되어 있어야 함).
- React Compiler가 babel 플러그인(`babel-plugin-react-compiler`)으로 활성화되어 있음 — `useRef.current`를 렌더 중 직접 읽는 패턴은 컴파일러가 금지하므로 `useState`의 lazy initializer 등으로 대체할 것(`useCollabEditor.ts`의 주석 참고).
