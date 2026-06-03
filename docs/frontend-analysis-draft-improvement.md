# 프론트엔드 현황 분석: 초안 생성 시스템 개선

> 기준 문서: `docs/frontend-changes-draft-improvement.md`  
> 분석 일자: 2026-06-01  
> 대상 브랜치: `hotfix/ai-draft`

---

## 1. 백엔드 구현 상황 요약

### 1-1. REST API 변경

| 엔드포인트                 | 변경 내용                                                       |
| -------------------------- | --------------------------------------------------------------- |
| `POST /api/teamspaces`     | 응답에서 `status` 필드 제거                                     |
| `GET /api/teamspaces`      | 목록 항목에서 `status` 필드 제거                                |
| `GET /api/teamspaces/{id}` | 팀스페이스 레벨 `status` 제거, `documents[].aiStatus` 필드 추가 |
| `PUT /api/teamspaces/{id}` | 요청 body의 `status` 필드 무시 (응답에서도 제거)                |

`documents[].aiStatus` 가능한 값:

| 값                     | 의미                     |
| ---------------------- | ------------------------ |
| `IDLE`                 | AI 작업 없음 (일반 상태) |
| `DRAFT`                | AI 초안 생성 진행 중     |
| `FEEDBACK_IN_PROGRESS` | AI 피드백 진행 중        |

### 1-2. WebSocket 변경

| 이벤트            | 변경 내용                                                                                       |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| `teamspace:init`  | `data.teamspace.status` 필드 제거                                                               |
| `teamspace:ready` | **이벤트 자체가 사라짐** (초안 완료 알림은 `draft:ready`로 대체)                                |
| `draft:ready`     | **문서 WS → 팀스페이스 WS로 채널 이동**. `data.documentId`, `data.draftId`, `data.content` 포함 |
| `draft:error`     | **문서 WS → 팀스페이스 WS로 채널 이동**. `data.documentId` 포함                                 |

---

## 2. 현재 프론트엔드 구현 상황

### 2-1. 타입 정의

#### `src/types/api.ts`

```ts
export type TeamspaceStatus = 'CREATING' | 'CREATED';

export interface DocumentSummary {
  id: string;
  type: DocumentType;
  title: string;
  updatedAt: string;
  updatedBy: string | null;
  // aiStatus 필드 없음 ← 추가 필요
}

export interface TeamspaceSummary {
  teamspaceId: string;
  name: string;
  memberCount: number;
  status: TeamspaceStatus; // ← 제거 필요
  createdAt: string;
}

export interface TeamspaceDetail {
  teamspaceId: string;
  name: string;
  status: TeamspaceStatus; // ← 제거 필요
  documents: DocumentSummary[];
  members: MemberInfo[];
  createdAt: string;
}
```

#### `src/types/teamspaceSocket.ts`

```ts
export type TeamspaceStatus = 'CREATING' | 'CREATED'; // ← 타입 자체 제거 필요

export interface TeamspaceSocketMeta {
  id: string;
  name: string;
  status: TeamspaceStatus; // ← 제거 필요
}

export interface TeamspaceInitEvent {
  event: 'teamspace:init';
  data: {
    teamspace: TeamspaceSocketMeta; // status 포함 ← 제거 필요
    onlineMembers: ActiveMember[];
  };
}

export interface TeamspaceReadyEvent {
  event: 'teamspace:ready'; // ← 이벤트 자체 제거 필요
  data: {
    status: 'CREATED';
    documents: DocumentReady[];
  };
}

// draft:ready, draft:error 이벤트 타입 정의 없음 ← 추가 필요
```

#### `src/types/socket.ts` (라인 120)

```ts
// TeamspaceInitEvent의 teamspace 객체에 status 필드 존재 ← 제거 필요
teamspace: {
  id: string;
  name: string;
  status: 'CREATING' | 'CREATED';
}
```

### 2-2. Store (`src/store/teamspaceStore.ts`)

```ts
interface TeamspaceState {
  teamspaceStatus: TeamspaceStatus | null; // ← 제거 또는 문서별 aiStatus로 대체
  setTeamspaceStatus: (status: TeamspaceStatus | null) => void; // ← 제거 필요
  // 문서별 aiStatus 상태 없음 ← 추가 필요
}
```

현재 `teamspaceStatus`는 저장되지만 **컴포넌트에서 실제로 소비되는 곳이 없음** (grep 결과 store 파일 외 참조 없음). 즉, 기존 "초기화 중" UI가 아직 구현되지 않은 상태.

### 2-3. WebSocket Hook (`src/hooks/useTeamspaceSocket.ts`)

```ts
// 현재 처리 중인 이벤트
if (message.event === 'teamspace:init') {
  setTeamspaceStatus(message.data.teamspace.status); // ← status 참조 제거 필요
  setOnlineMembers(message.data.onlineMembers);
}

if (message.event === 'teamspace:ready') {
  setTeamspaceStatus(message.data.status); // ← 이벤트 자체 제거 필요
}

// draft:ready, draft:error 핸들러 없음 ← 추가 필요

// isTeamspaceServerMessage() 검증 함수에 teamspace:ready 포함 ← 제거 필요
// draft:ready, draft:error 미포함 ← 추가 필요
```

### 2-4. 문서 WebSocket Hook (`src/hooks/useCollabEditor.ts`)

현재 피드백 이벤트(`feedback:ready`, `feedback:error`)를 문서 WS에서 처리 중.  
**초안 관련 `draft:ready`, `draft:error`는 문서 WS에서 처리하는 코드가 없음** — 즉 기존에 문서 WS에서 처리하던 draft 이벤트가 애초에 구현되지 않았거나 이미 제거된 상태.

### 2-5. 팀스페이스 생성 컴포넌트 (`src/components/CreateTeamSpace/index.tsx`)

```ts
const response = await apiClient.post('/api/teamspaces', { name, idea });
setTeamspaceId(response.data.data.teamspaceId);
setStep(2); // 생성 후 바로 Step2(멤버 초대)로 이동
```

생성 응답의 `status` 필드를 직접 읽는 코드는 없음. 단, `TeamspaceSummary`/`TeamspaceDetail` 타입에 `status`가 남아있어 다른 곳에서 타입 오류 가능성 있음.

---

## 3. 수정이 필요한 내용

### 3-1. Breaking 대응 (필수 — 타입/런타임 오류 방지)

#### A. 타입 정의 수정

| 파일                           | 수정 내용                                                                                                                                                                                                         |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/types/api.ts`             | `TeamspaceStatus` 타입 제거, `TeamspaceSummary.status` 제거, `TeamspaceDetail.status` 제거, `DocumentSummary`에 `aiStatus: 'IDLE' \| 'DRAFT' \| 'FEEDBACK_IN_PROGRESS'` 추가                                      |
| `src/types/teamspaceSocket.ts` | `TeamspaceStatus` 타입 제거, `TeamspaceSocketMeta.status` 제거, `TeamspaceReadyEvent` 인터페이스 제거, `DraftReadyEvent` / `DraftErrorEvent` 인터페이스 추가, `TeamspaceServerMessage` 유니온에 draft 이벤트 추가 |
| `src/types/socket.ts`          | `TeamspaceInitEvent`의 `teamspace.status` 필드 제거                                                                                                                                                               |

#### B. Store 수정 (`src/store/teamspaceStore.ts`)

- `teamspaceStatus: TeamspaceStatus | null` 필드 제거
- `setTeamspaceStatus()` 액션 제거
- `clearTeamspacePresence()`에서 `teamspaceStatus: null` 초기화 제거
- 문서별 `aiStatus` 상태 추가: `documentAiStatuses: Record<string, 'IDLE' | 'DRAFT' | 'FEEDBACK_IN_PROGRESS'>`
- `setDocumentAiStatus(documentId, aiStatus)` 액션 추가

#### C. WebSocket Hook 수정 (`src/hooks/useTeamspaceSocket.ts`)

- `isTeamspaceServerMessage()`에서 `'teamspace:ready'` 제거, `'draft:ready'`, `'draft:error'` 추가
- `teamspace:init` 핸들러에서 `setTeamspaceStatus(...)` 제거
- `teamspace:ready` 핸들러 전체 제거
- `draft:ready` 핸들러 추가: 해당 `documentId`의 `aiStatus`를 `'IDLE'`로 갱신
- `draft:error` 핸들러 추가: 해당 `documentId`의 `aiStatus`를 `'IDLE'`로 갱신, 에러 알림 표시

### 3-2. 신규 기능 구현 (필수 — 초안 생성 상태 UI)

#### A. 팀스페이스 상세 조회 응답 활용

`useTeamspaceDetail` hook이 반환하는 `documents[].aiStatus`를 읽어 Store에 초기값 세팅.

```
GET /api/teamspaces/{id} 응답
  → documents[].aiStatus 순회
  → store.setDocumentAiStatus(id, aiStatus) 일괄 반영
```

#### B. 문서 목록 UI에서 aiStatus 표시

`aiStatus === 'DRAFT'`인 문서 항목에 "AI 초안 생성 중" 인디케이터 표시.  
대상 컴포넌트: 사이드바 문서 목록 (`src/components/main/MainSideBar.tsx` 또는 해당 문서 리스트 렌더링 컴포넌트).

#### C. draft:ready 수신 시 처리

```
팀스페이스 WS에서 draft:ready 수신
  → store.setDocumentAiStatus(documentId, 'IDLE') 갱신
  → (선택) 해당 문서가 현재 열려있으면 초안 내용 적용 또는 알림
```

#### D. draft:error 수신 시 처리

```
팀스페이스 WS에서 draft:error 수신
  → store.setDocumentAiStatus(documentId, 'IDLE') 갱신
  → 에러 토스트/알림 표시
```

### 3-3. 제거 가능한 레거시 코드

- `teamspace:ready` 이벤트 관련 타입, 핸들러, Store 액션 전체
- `TeamspaceStatus = 'CREATING' | 'CREATED'` 타입 (양쪽 파일 모두)
- `setTeamspaceStatus` Store 액션 및 관련 참조

---

## 4. 파일별 수정 대상 요약

| 파일                                                            | 수정 종류                                                         | 우선순위 |
| --------------------------------------------------------------- | ----------------------------------------------------------------- | -------- |
| `src/types/api.ts`                                              | `status` 제거, `aiStatus` 추가                                    | 필수     |
| `src/types/teamspaceSocket.ts`                                  | `status` 제거, `TeamspaceReadyEvent` 제거, draft 이벤트 타입 추가 | 필수     |
| `src/types/socket.ts`                                           | `teamspace.status` 필드 제거                                      | 필수     |
| `src/store/teamspaceStore.ts`                                   | `teamspaceStatus` 제거, `documentAiStatuses` 추가                 | 필수     |
| `src/hooks/useTeamspaceSocket.ts`                               | 핸들러 수정 (status 제거, draft 이벤트 추가)                      | 필수     |
| `src/components/main/MainSideBar.tsx` (또는 문서 목록 컴포넌트) | `aiStatus === 'DRAFT'` 인디케이터 UI 추가                         | 신규     |

---

## 5. 주의 사항

- `teamspaceStatus`는 현재 store에 저장되지만 컴포넌트에서 소비하는 곳이 없어 "초기화 중" UI가 실질적으로 동작하지 않는 상태. 이번 개선에서 문서 단위 `aiStatus`로 완전히 대체한다.
- `draft:ready`/`draft:error`를 문서 WS에서 처리하는 코드가 현재 없으므로 "문서 WS에서 제거" 작업은 불필요. 팀스페이스 WS 핸들러 추가만 하면 된다.
- 백엔드 배포와 프론트 배포는 **동시에** 이루어져야 한다. 분리 배포 시 `status` 필드 누락으로 기존 팀스페이스 목록/상세 페이지가 깨질 수 있다.
