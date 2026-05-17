# 소켓 명세서

생성일: 2026년 5월 10일 오후 4:58

# WebSocket API 명세

> **대상:** 프론트엔드 구현 담당자 / AI
> **프로토콜:** WebSocket (Raw, not STOMP)
> **메시지 형식:** JSON 텍스트 (바이너리 프레임 사용 안 함)
> **Yjs 바이너리 전달 방식:** Base64 인코딩 문자열

---

## 팀스페이스 소켓

- **URL:** `ws://{host}/ws/teamspace/{teamspaceId}`
- **Header:** `Authorization: Bearer {accessToken}`
- **용도:** 팀스페이스 초기화, AI 초안 생성 완료 이벤트 수신, 접속 멤버 상태 동기화

### 연결 거부 케이스 (HTTP Upgrade 단계)

| 상태코드           | 원인                                 |
| ------------------ | ------------------------------------ |
| `401 Unauthorized` | 토큰이 없거나 유효하지 않음          |
| `404 Not Found`    | 팀스페이스가 존재하지 않음           |
| `403 Forbidden`    | 해당 팀스페이스에 소속되지 않은 유저 |

---

## 팀스페이스 소켓 이벤트

### teamspace:init

### server → client

소켓 연결 직후 발행

```json
{
  "event": "teamspace:init",
  "data": {
    "teamspace": {
      "id": "ts_abc123",
      "name": "프로젝트 이름",
      "status": "CREATING"
    },
    "onlineMembers": [
      {
        "userId": 1,
        "name": "강민석",
        "profileImageUrl": "<https://avatars.githubusercontent.com/>...",
        "role": "OWNER",
        "currentDocumentId": "doc_001"
      }
    ]
  }
}
```

| 필드                                | 타입                              | 설명                                       |
| ----------------------------------- | --------------------------------- | ------------------------------------------ |
| `teamspace.id`                      | `string`                          | 팀스페이스 UUID (`ts_` prefix)             |
| `teamspace.name`                    | `string`                          | 팀스페이스 이름 (max 50자)                 |
| `teamspace.status`                  | `"CREATING" \| "CREATED"`         | AI 초안 생성 진행 상태                     |
| `onlineMembers`                     | `ActiveMember[]`                  | 현재 팀스페이스 소켓에 접속 중인 멤버 목록 |
| `onlineMembers[].userId`            | `number`                          | 유저 ID                                    |
| `onlineMembers[].name`              | `string`                          | 유저 이름                                  |
| `onlineMembers[].profileImageUrl`   | `string \| null`                  | 프로필 이미지 URL                          |
| `onlineMembers[].role`              | `"OWNER" \| "MEMBER" \| "VIEWER"` | 역할                                       |
| `onlineMembers[].currentDocumentId` | `string \| null`                  | 현재 보고 있는 문서 ID. 없으면 `null`      |

> 문서 목록은 REST API(`GET /api/documents?teamspaceId=...`)로 별도 조회
> 전체 멤버 목록(오프라인 포함)은 REST API(`GET /api/teamspaces/{teamspaceId}/members`)로 별도 조회
> `status`가 `CREATING`이면 로딩 오버레이 표시. 다른 유저가 뒤늦게 접속해도 동일 조건이면 같은 화면 표시

---

### teamspace:ready

### server → client

팀 스페이스 처음 생성 후 AI 초안 생성 완료 시 발행

```json
{
  "event": "teamspace:ready",
  "data": {
    "status": "CREATED",
    "documents": [
      {
        "id": "doc_001",
        "type": "IDEA",
        "title": "아이디어",
        "yjsBinary": "base64_encoded...",
        "updatedAt": "2026-05-10T10:05:00"
      }
    ]
  }
}
```

| 필드                    | 타입              | 설명                                                               |
| ----------------------- | ----------------- | ------------------------------------------------------------------ |
| `status`                | `"CREATED"`       | 항상 `CREATED`                                                     |
| `documents`             | `DocumentReady[]` | 생성 완료된 문서 목록                                              |
| `documents[].id`        | `string`          | 문서 UUID                                                          |
| `documents[].type`      | `DocumentType`    | 문서 유형                                                          |
| `documents[].title`     | `string`          | 문서 제목                                                          |
| `documents[].yjsBinary` | `string \| null`  | AI 생성 내용의 Yjs 바이너리 (Base64). `null`이면 빈 Doc으로 초기화 |
| `documents[].updatedAt` | `string`          | ISO 8601 datetime                                                  |

> 클라이언트에서 `Y.applyUpdate(doc, base64ToUint8Array(yjsBinary))`로 Yjs Doc에 반영
> 로딩 오버레이 제거, 메인 MD 텍스트 화면으로 전환

---

### member:update

### server → client

팀스페이스 접속 멤버 상태 변경 시 브로드캐스트

**발행 시점:**

- 멤버가 팀스페이스 소켓에 연결될 때
- 멤버가 팀스페이스 소켓에서 해제될 때
- 멤버가 `member:focus` 이벤트를 전송했을 때

```json
{
  "event": "member:update",
  "data": {
    "onlineMembers": [
      {
        "userId": 1,
        "name": "강민석",
        "profileImageUrl": "<https://avatars.githubusercontent.com/>...",
        "role": "OWNER",
        "currentDocumentId": "doc_001"
      },
      {
        "userId": 2,
        "name": "김철수",
        "profileImageUrl": "<https://avatars.githubusercontent.com/>...",
        "role": "MEMBER",
        "currentDocumentId": null
      }
    ]
  }
}
```

| 필드                                | 타입                              | 설명                                       |
| ----------------------------------- | --------------------------------- | ------------------------------------------ |
| `onlineMembers`                     | `ActiveMember[]`                  | 현재 팀스페이스 소켓에 접속 중인 멤버 목록 |
| `onlineMembers[].userId`            | `number`                          | 유저 ID                                    |
| `onlineMembers[].name`              | `string`                          | 유저 이름                                  |
| `onlineMembers[].profileImageUrl`   | `string \| null`                  | 프로필 이미지 URL                          |
| `onlineMembers[].role`              | `"OWNER" \| "MEMBER" \| "VIEWER"` | 역할                                       |
| `onlineMembers[].currentDocumentId` | `string \| null`                  | 현재 보고 있는 문서 ID. 없으면 `null`      |

> 접속 중인 멤버만 포함. 오프라인 멤버 포함 전체 목록은 REST API로 조회

---

### error

### server → client

오류 발생 시 해당 클라이언트에게 발행

```json
{
  "event": "error",
  "code": "INSUFFICIENT_PERMISSION",
  "message": "이 팀스페이스에 접근할 권한이 없습니다."
}
```

| 필드      | 타입     | 설명                          |
| --------- | -------- | ----------------------------- |
| `code`    | `string` | 에러 코드                     |
| `message` | `string` | 사용자에게 표시할 에러 메시지 |

**에러 코드:**

| code                      | 설명                     |
| ------------------------- | ------------------------ |
| `INSUFFICIENT_PERMISSION` | 권한 없음                |
| `UNAUTHORIZED`            | 인증 실패                |
| `SESSION_EXPIRED`         | 세션 만료, 재로그인 필요 |
| `INTERNAL_SERVER_ERROR`   | 서버 내부 오류           |

> `SESSION_EXPIRED` · `UNAUTHORIZED` 수신 시 클라이언트는 소켓을 닫고 로그인 페이지로 이동

---

### member:focus

### client → server

현재 보고 있는 문서가 바뀔 때 전송

```json
{
  "event": "member:focus",
  "data": {
    "documentId": "doc_001"
  }
}
```

| 필드         | 타입             | 필수 | 설명                                                             |
| ------------ | ---------------- | ---- | ---------------------------------------------------------------- |
| `documentId` | `string \| null` | ✓    | 현재 보고 있는 문서 ID. 문서를 닫거나 대시보드로 이동하면 `null` |

> 서버는 이 이벤트를 수신하면 팀스페이스 전체 접속자에게 `member:update`를 브로드캐스트

---

## 문서 소켓

- **URL:** `ws://{host}/ws/documents/{documentId}`
- **Header:** `Authorization: Bearer {accessToken}`
- **용도:** 실시간 문서 편집 동기화, AI 피드백 이벤트 수신

### 연결 거부 케이스 (HTTP Upgrade 단계)

| 상태코드           | 원인                                         |
| ------------------ | -------------------------------------------- |
| `401 Unauthorized` | 토큰이 없거나 유효하지 않음                  |
| `404 Not Found`    | `documentId`에 해당하는 문서가 존재하지 않음 |
| `403 Forbidden`    | 해당 문서의 팀스페이스에 소속되지 않은 유저  |

### 인증 방법

WebSocket 브라우저 API 제약 상 **두 가지 방법 중 하나** 사용:

**방법 A — Authorization 헤더 (권장)**

```
Authorization: Bearer <access_token>
```

**방법 B — 쿼리 파라미터 fallback**

```
ws://{host}/ws/documents/{documentId}?token=<access_token>
```

---

## 문서 소켓 이벤트

### doc:init

### server → client

소켓 연결 직후 발행

```json
{
  "type": "doc:init",
  "updates": ["<base64_string>", "<base64_string>"]
}
```

| 필드      | 타입         | 설명                              |
| --------- | ------------ | --------------------------------- |
| `type`    | `"doc:init"` | 이벤트 타입                       |
| `updates` | `string[]`   | Base64 인코딩된 Yjs 바이너리 배열 |

**`updates` 배열 구성 규칙:**

```
updates[0]    → yjs_snapshot (배치 머지된 스냅샷. 아직 없으면 생략)
updates[1..]  → document_updates rows (id ASC 순서, 미머지 업데이트 목록)
```

> 배치 머지가 한 번도 실행되지 않은 새 문서라면 `updates`는 빈 배열 `[]`일 수 있음
> `updates`가 비어 있어도 `doc:init` 이벤트 자체는 항상 전송됨

**클라이언트 처리:**

```tsx
if (msg.type === 'doc:init') {
  for (const b64 of msg.updates) {
    Y.applyUpdate(ydoc, base64ToUint8Array(b64));
  }
}
```

---

### doc:update

### client → server

사용자가 편집할 때 전송

```json
{
  "type": "doc:update",
  "update": "base64_encoded_yjs_update...",
  "clientId": "1|tab_abc"
}
```

| 필드       | 타입           | 필수 | 설명                                                    |
| ---------- | -------------- | ---- | ------------------------------------------------------- |
| `type`     | `"doc:update"` | ✓    |                                                         |
| `update`   | `string`       | ✓    | `Y.encodeStateAsUpdate(ydoc)` 결과를 Base64 인코딩한 값 |
| `clientId` | `string`       | —    | `"userId\|tabId"` 형태 식별자                           |

**역할(Role)별 서버 처리:**

| 역할               | 동작                                                                        |
| ------------------ | --------------------------------------------------------------------------- |
| `OWNER` / `MEMBER` | 버퍼 저장 + DB INSERT (`document_updates`) + 다른 클라이언트에 브로드캐스트 |
| `VIEWER`           | **무시** — 연결은 유지되지만 서버가 아무 처리도 하지 않음 (오류 응답 없음)  |

---

### doc:update

### server → client

다른 사용자의 편집 내용 수신

```json
{
  "type": "doc:update",
  "update": "base64_encoded_yjs_update..."
}
```

| 필드     | 타입           | 설명                                       |
| -------- | -------------- | ------------------------------------------ |
| `type`   | `"doc:update"` |                                            |
| `update` | `string`       | 다른 유저의 Yjs 업데이트 바이너리 (Base64) |

> 발신자 본인에게는 이 이벤트가 전달되지 않음

**클라이언트 처리:**

```tsx
if (msg.type === 'doc:update') {
  Y.applyUpdate(ydoc, base64ToUint8Array(msg.update));
}
```

---

### feedback:start

### server → client

AI 피드백 요청이 정상 수락될 때 문서 전체 접속자에게 브로드캐스트

**발행 시점:** REST API `POST /api/documents/{documentId}/feedback` 서버 수락 직후

```json
{
  "event": "feedback:start",
  "data": {
    "feedbackId": "fb_001",
    "requestedBy": 1
  }
}
```

| 필드          | 타입     | 설명                    |
| ------------- | -------- | ----------------------- |
| `feedbackId`  | `string` | 피드백 고유 ID          |
| `requestedBy` | `number` | 피드백을 요청한 유저 ID |

> 스켈레톤 UI 표시 (AI 피드백 대기 중)
> 문서 편집 가능 여부는 프로덕트 정책에 따라 결정 (lock 또는 편집 유지)

---

### feedback:error

### server → client

AI 피드백 처리 중 오류 발생 시 문서 전체 접속자에게 브로드캐스트

```json
{
  "event": "feedback:error",
  "data": {
    "feedbackId": "fb_001",
    "code": "AI_FEEDBACK_FAILED",
    "message": "AI 피드백 생성에 실패했습니다."
  }
}
```

| 필드         | 타입     | 설명                          |
| ------------ | -------- | ----------------------------- |
| `feedbackId` | `string` | 피드백 고유 ID                |
| `code`       | `string` | 에러 코드                     |
| `message`    | `string` | 사용자에게 표시할 에러 메시지 |

**에러 코드:**

| code                 | 설명                         |
| -------------------- | ---------------------------- |
| `AI_FEEDBACK_FAILED` | AI 모델 호출 실패            |
| `AI_TIMEOUT`         | AI 응답 시간 초과            |
| `CONTENT_EMPTY`      | 피드백할 내용이 없는 빈 문서 |
| `DOCUMENT_NOT_FOUND` | 피드백 처리 중 문서가 삭제됨 |

---

### feedback:ready

### server → client

AI 피드백 결과 생성 완료 시 문서 전체 접속자에게 브로드캐스트

```json
{
  "event": "feedback:ready",
  "data": {
    "feedbackId": "fb_001",
    "yjsBinary": "base64_encoded_feedback_result...",
    "status": "DONE"
  }
}
```

| 필드         | 타입     | 설명                                     |
| ------------ | -------- | ---------------------------------------- |
| `feedbackId` | `string` | 피드백 고유 ID                           |
| `yjsBinary`  | `string` | AI가 수정한 문서의 Yjs 바이너리 (Base64) |
| `status`     | `"DONE"` | 항상 `DONE`                              |

> 수정 전/후 비교 UI 렌더링
> 수정 전: 현재 문서 (`originalYjsBinary`), 수정 후: `yjsBinary` 적용 결과

---

### feedback:version-applied

### server → client

버전 선택 시, **선택한 유저를 제외한** 나머지 접속자에게 브로드캐스트

**발행 시점:**

- REST API `POST /api/documents/{documentId}/feedback/{feedbackId}/select` 처리 후
- 선택한 유저는 REST API 응답으로 결과 수신
- 나머지 유저는 이 이벤트로 문서 업데이트 수신

```json
{
  "event": "feedback:version-applied",
  "data": {
    "feedbackId": "fb_001",
    "selectedVersion": "AI",
    "yjsBinary": "base64_encoded_selected_snapshot...",
    "appliedBy": 1
  }
}
```

| 필드              | 타입                 | 설명                                                     |
| ----------------- | -------------------- | -------------------------------------------------------- |
| `feedbackId`      | `string`             | 피드백 고유 ID                                           |
| `selectedVersion` | `"ORIGINAL" \| "AI"` | 선택된 버전. `ORIGINAL`은 이전 버전, `AI`는 AI 수정 버전 |
| `yjsBinary`       | `string`             | 선택된 버전의 Yjs 스냅샷 (Base64)                        |
| `appliedBy`       | `number`             | 버전을 선택한 유저 ID                                    |

> 클라이언트는 현재 ydoc을 새 Doc으로 교체한 후 `Y.applyUpdate(ydoc, base64ToUint8Array(yjsBinary))` 적용
> DocumentLock 해제

---

### error

### server → client

오류 발생 시 해당 클라이언트에게 발행

```json
{
  "event": "error",
  "code": "DOCUMENT_LOCKED",
  "message": "현재 AI 피드백 중인 문서입니다."
}
```

| 필드      | 타입     | 설명                          |
| --------- | -------- | ----------------------------- |
| `code`    | `string` | 에러 코드                     |
| `message` | `string` | 사용자에게 표시할 에러 메시지 |

**에러 코드:**

| code                      | 설명                               |
| ------------------------- | ---------------------------------- |
| `DOCUMENT_LOCKED`         | AI 피드백 진행 중 편집 시도        |
| `INSUFFICIENT_PERMISSION` | 권한 없음                          |
| `DOCUMENT_NOT_FOUND`      | 문서 없음                          |
| `UNAUTHORIZED`            | 인증 실패                          |
| `SESSION_EXPIRED`         | 세션 만료, 재로그인 필요           |
| `INTERNAL_SERVER_ERROR`   | 서버 내부 오류                     |
| `INVALID_MESSAGE`         | 클라이언트가 보낸 메시지 형식 오류 |

---

## 배치 저장 (Scheduler)

`updateBuffer`에 쌓인 업데이트를 주기적으로 스냅샷에 병합:

1. `updateBuffer[docId]` 판단 기준 도달
2. `UPDATE documents SET yjs_snapshot = mergedBinary, snapshot_clock = currentClock, updated_at = NOW()`
3. `DELETE FROM document_updates WHERE id IN (병합된 update id 목록)`
4. `updateBuffer[docId]` 초기화

---

## TypeScript 타입 정의

### 팀스페이스 소켓

```tsx
type DocumentType = 'IDEA' | 'PLAN' | 'USER_SCENARIO' | 'API_SPEC' | 'ERD';
type MemberRole = 'OWNER' | 'MEMBER' | 'VIEWER';
type TeamspaceSocketErrorCode =
  | 'INSUFFICIENT_PERMISSION'
  | 'UNAUTHORIZED'
  | 'SESSION_EXPIRED'
  | 'INTERNAL_SERVER_ERROR';

// server → client
type TeamspaceServerMessage =
  | TeamspaceInitEvent
  | TeamspaceReadyEvent
  | MemberUpdateEvent
  | TeamspaceSocketErrorEvent;

interface TeamspaceInitEvent {
  event: 'teamspace:init';
  data: {
    teamspace: { id: string; name: string; status: 'CREATING' | 'CREATED' };
    onlineMembers: {
      userId: number;
      name: string;
      profileImageUrl: string | null;
      role: MemberRole;
      currentDocumentId: string | null;
    }[];
  };
}

interface TeamspaceReadyEvent {
  event: 'teamspace:ready';
  data: {
    status: 'CREATED';
    documents: {
      id: string;
      type: DocumentType;
      title: string;
      yjsBinary: string | null;
      updatedAt: string;
    }[];
  };
}

interface MemberUpdateEvent {
  event: 'member:update';
  data: {
    onlineMembers: {
      userId: number;
      name: string;
      profileImageUrl: string | null;
      role: MemberRole;
      currentDocumentId: string | null;
    }[];
  };
}

interface TeamspaceSocketErrorEvent {
  event: 'error';
  code: TeamspaceSocketErrorCode | string;
  message: string;
}

// client → server
type TeamspaceClientMessage = MemberFocusRequest;

interface MemberFocusRequest {
  event: 'member:focus';
  data: { documentId: string | null };
}
```

### 문서 소켓

> **필드 네이밍 규칙:** `doc:init` · `doc:update`는 Yjs 동기화 전용으로 `type` 필드를 사용하고,
> `feedback:*` · `error` 이벤트는 비즈니스 이벤트로 `event` 필드를 사용합니다.
> 수신 측에서는 `"type" in msg` 여부로 두 그룹을 구분할 수 있습니다.

```tsx
type DocumentSocketErrorCode =
  | 'DOCUMENT_LOCKED'
  | 'INSUFFICIENT_PERMISSION'
  | 'DOCUMENT_NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'SESSION_EXPIRED'
  | 'INTERNAL_SERVER_ERROR'
  | 'INVALID_MESSAGE';

type FeedbackErrorCode =
  | 'AI_FEEDBACK_FAILED'
  | 'AI_TIMEOUT'
  | 'CONTENT_EMPTY'
  | 'DOCUMENT_NOT_FOUND';

// server → client
type DocumentServerMessage =
  | DocInitEvent
  | DocUpdateEvent
  | FeedbackStartEvent
  | FeedbackErrorEvent
  | FeedbackReadyEvent
  | FeedbackVersionAppliedEvent
  | DocumentSocketErrorEvent;

interface DocInitEvent {
  type: 'doc:init';
  updates: string[]; // Base64 Yjs 바이너리 배열, 빈 배열 가능
}

interface DocUpdateEvent {
  type: 'doc:update';
  update: string; // Base64 Yjs 바이너리
}

interface FeedbackStartEvent {
  event: 'feedback:start';
  data: { feedbackId: string; requestedBy: number };
}

interface FeedbackErrorEvent {
  event: 'feedback:error';
  data: { feedbackId: string; code: FeedbackErrorCode | string; message: string };
}

interface FeedbackReadyEvent {
  event: 'feedback:ready';
  data: { feedbackId: string; yjsBinary: string; status: 'DONE' };
}

interface FeedbackVersionAppliedEvent {
  event: 'feedback:version-applied';
  data: {
    feedbackId: string;
    selectedVersion: 'ORIGINAL' | 'AI';
    yjsBinary: string;
    appliedBy: number;
  };
}

interface DocumentSocketErrorEvent {
  event: 'error';
  code: DocumentSocketErrorCode | string;
  message: string;
}

// client → server
type DocumentClientMessage = DocUpdateRequest;

interface DocUpdateRequest {
  type: 'doc:update';
  update: string; // Y.encodeStateAsUpdate() → Base64
  clientId?: string; // "userId|tabId" 형태, 선택값
}
```

---

## 구현 현황

| 기능                               | 소켓       | 상태      | 비고                                 |
| ---------------------------------- | ---------- | --------- | ------------------------------------ |
| 연결 권한 검사 (JWT + 팀스페이스)  | 문서       | ✅ 구현됨 |                                      |
| `doc:init` 초기 상태 전송          | 문서       | ✅ 구현됨 | snapshot + pending updates 배열      |
| `doc:update` 수신 + 브로드캐스트   | 문서       | ✅ 구현됨 |                                      |
| `doc:update` 이중 저장 (버퍼 + DB) | 문서       | ✅ 구현됨 |                                      |
| VIEWER 편집 차단                   | 문서       | ✅ 구현됨 | 무시 처리, 오류 응답 없음            |
| `feedback:start` 이벤트            | 문서       | ⏳ 미구현 | AI 피드백 요청 수락 시 브로드캐스트  |
| `feedback:error` 이벤트            | 문서       | ⏳ 미구현 | AI 피드백 오류 브로드캐스트          |
| `feedback:ready` 이벤트            | 문서       | ⏳ 미구현 | AI 피드백 결과 브로드캐스트          |
| `feedback:version-applied` 이벤트  | 문서       | ⏳ 미구현 | 버전 선택 브로드캐스트 (선택자 제외) |
| `error` 이벤트                     | 문서       | ⏳ 미구현 | `DOCUMENT_LOCKED` 등 7개 에러 코드   |
| `error` 이벤트                     | 팀스페이스 | ⏳ 미구현 | `SESSION_EXPIRED` 등 4개 에러 코드   |
| 팀스페이스 소켓 연결 및 핸드셰이크 | 팀스페이스 | ⏳ 미구현 |                                      |
| `teamspace:init` 이벤트            | 팀스페이스 | ⏳ 미구현 |                                      |
| `teamspace:ready` 이벤트           | 팀스페이스 | ⏳ 미구현 |                                      |
| `member:update` 이벤트             | 팀스페이스 | ⏳ 미구현 | 접속 멤버 + 현재 문서 동기화         |
| `member:focus` 이벤트 수신         | 팀스페이스 | ⏳ 미구현 | 현재 보는 문서 업데이트 트리거       |
