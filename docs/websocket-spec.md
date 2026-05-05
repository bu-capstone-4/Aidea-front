# WebSocket API 명세서 — 문서 실시간 협업

> **대상:** 프론트엔드 구현 담당자 / AI
> **프로토콜:** WebSocket (Raw, not STOMP)
> **메시지 형식:** JSON 텍스트 (바이너리 프레임 사용 안 함)
> **Yjs 바이너리 전달 방식:** Base64 인코딩 문자열

---

## 1. 연결 (Connection)

### 엔드포인트

```
ws://{host}/ws/documents/{docId}
```

| 파라미터 | 타입          | 설명             |
| -------- | ------------- | ---------------- |
| `docId`  | string (UUID) | 연결할 문서의 ID |

### 인증

WebSocket은 브라우저 API 제약상 커스텀 헤더를 설정하기 어려운 경우가 있으므로 **두 가지 방법 중 하나**를 사용한다.

**방법 A — Authorization 헤더 (권장)**

```
Authorization: Bearer <access_token>
```

**방법 B — 쿼리 파라미터 fallback**

```
ws://{host}/ws/documents/{docId}?token=<access_token>
```

두 방법 모두 서버가 지원하며, 헤더가 있으면 헤더를 우선으로 사용한다.

### 연결 거부 케이스 (HTTP Upgrade 단계)

연결이 거부되면 WebSocket 핸드셰이크 자체가 실패하며, 아래 HTTP 상태코드가 응답된다.

| 상태코드           | 원인                                        |
| ------------------ | ------------------------------------------- |
| `401 Unauthorized` | 토큰이 없거나 유효하지 않음                 |
| `404 Not Found`    | `docId`에 해당하는 문서가 존재하지 않음     |
| `403 Forbidden`    | 해당 문서의 팀스페이스에 소속되지 않은 유저 |

### 연결 성공 조건

- 유효한 JWT 토큰
- 존재하는 `docId`
- 해당 문서의 팀스페이스에 소속된 유저 (`OWNER` / `MEMBER` / `VIEWER` 모두 허용)

---

## 2. 연결 직후 서버 동작

연결이 수립되면 **서버가 즉시** `doc:init` 이벤트를 전송한다. 클라이언트가 먼저 요청할 필요 없음.

---

## 3. 이벤트 목록

### 3-1. `doc:init` — 문서 초기 상태 수신

**방향:** 서버 → 클라이언트  
**시점:** 연결 수립 직후 1회

```json
{
  "type": "doc:init",
  "updates": ["<base64_string>", "<base64_string>", "..."]
}
```

| 필드      | 타입         | 설명                              |
| --------- | ------------ | --------------------------------- |
| `type`    | `"doc:init"` | 이벤트 타입 고정값                |
| `updates` | `string[]`   | Base64 인코딩된 Yjs 바이너리 배열 |

**`updates` 배열 구성 규칙:**

```
updates[0]     → yjs_snapshot (배치 머지된 스냅샷, 없으면 생략)
updates[1..]   → document_updates rows (id ASC 순서, 미머지 업데이트 목록)
```

- 아직 배치 머지가 한 번도 실행되지 않은 새 문서라면 `updates`는 빈 배열 `[]`일 수 있음
- `updates`가 비어 있어도 `doc:init` 이벤트 자체는 항상 전송됨

**클라이언트 처리 방법 (Yjs):**

```typescript
socket.onmessage = (event) => {
  const msg = JSON.parse(event.data);

  if (msg.type === 'doc:init') {
    // updates 배열의 모든 항목을 순서대로 apply
    for (const b64 of msg.updates) {
      const binary = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      Y.applyUpdate(ydoc, binary);
    }
  }
};
```

---

### 3-2. `doc:update` — 편집 내용 전송

**방향:** 클라이언트 → 서버  
**시점:** 유저가 문서를 편집할 때마다

```json
{
  "type": "doc:update",
  "update": "<base64_string>",
  "clientId": "userId|tabId"
}
```

| 필드       | 타입           | 필수 | 설명                                                             |
| ---------- | -------------- | ---- | ---------------------------------------------------------------- |
| `type`     | `"doc:update"` | ✓    | 이벤트 타입 고정값                                               |
| `update`   | `string`       | ✓    | `Y.encodeStateAsUpdate(ydoc)` 결과를 Base64 인코딩한 값          |
| `clientId` | `string`       | —    | `"userId\|tabId"` 형태 식별자 (서버는 현재 무시, 향후 활용 가능) |

**클라이언트 전송 예시:**

```typescript
ydoc.on('update', (update: Uint8Array) => {
  const b64 = btoa(String.fromCharCode(...update));
  socket.send(
    JSON.stringify({
      type: 'doc:update',
      update: b64,
      clientId: `${userId}|${tabId}`,
    })
  );
});
```

**역할(Role)별 서버 처리:**

| 역할     | 동작                                                      |
| -------- | --------------------------------------------------------- |
| `OWNER`  | 정상 처리 (버퍼 저장 + DB 저장 + 브로드캐스트)            |
| `MEMBER` | 정상 처리 (버퍼 저장 + DB 저장 + 브로드캐스트)            |
| `VIEWER` | **무시** — 연결은 유지되지만 서버가 아무 처리도 하지 않음 |

> VIEWER가 `doc:update`를 보내도 오류 응답은 없음. 서버가 조용히 무시한다.

---

### 3-3. `doc:update` — 다른 유저 편집 수신

**방향:** 서버 → 클라이언트  
**시점:** 같은 문서에 연결된 다른 유저가 편집을 전송했을 때

```json
{
  "type": "doc:update",
  "update": "<base64_string>"
}
```

| 필드     | 타입           | 설명                                       |
| -------- | -------------- | ------------------------------------------ |
| `type`   | `"doc:update"` | 이벤트 타입 고정값                         |
| `update` | `string`       | 다른 유저의 Yjs 업데이트 바이너리 (Base64) |

> 발신자 본인에게는 이 이벤트가 전달되지 않는다.

**클라이언트 처리 방법:**

```typescript
socket.onmessage = (event) => {
  const msg = JSON.parse(event.data);

  if (msg.type === 'doc:update') {
    const binary = Uint8Array.from(atob(msg.update), (c) => c.charCodeAt(0));
    Y.applyUpdate(ydoc, binary);
  }
};
```

---

## 4. 전체 이벤트 플로우

### 신규 접속 시퀀스

```
클라이언트                          서버
    │                                │
    │── WS Connect (+ JWT) ─────────▶│  핸드셰이크 권한 검사
    │                                │  ├─ 401: 토큰 없음/만료
    │                                │  ├─ 404: 문서 없음
    │                                │  └─ 403: 팀스페이스 비소속
    │◀── { type: "doc:init" } ───────│  연결 성공 직후 즉시 전송
    │    updates: [snapshot, ...db]  │
    │                                │
```

### 편집 송수신 시퀀스 (UserA, UserB 동시 접속)

```
UserA                    서버                    UserB
  │                       │                       │
  │── doc:update ────────▶│                       │
  │   (내 편집 전송)       │── doc:update ────────▶│
  │                       │   (UserA 편집 릴레이)  │
  │                       │                       │ apply update
  │                       │                       │
  │                       │◀── doc:update ─────────│
  │◀── doc:update ─────────│   (UserB 편집 릴레이)  │
  │   apply update        │                       │
```

---

## 5. TypeScript 타입 정의

```typescript
// 서버 → 클라이언트
type ServerMessage = DocInitEvent | DocUpdateEvent;

interface DocInitEvent {
  type: 'doc:init';
  updates: string[]; // Base64 Yjs 바이너리 배열, 빈 배열 가능
}

interface DocUpdateEvent {
  type: 'doc:update';
  update: string; // Base64 Yjs 바이너리
}

// 클라이언트 → 서버
type ClientMessage = DocUpdateRequest;

interface DocUpdateRequest {
  type: 'doc:update';
  update: string; // Y.encodeStateAsUpdate() → Base64
  clientId?: string; // "userId|tabId" 형태, 선택값
}
```

---

## 6. 연결 관리 가이드

### 재연결 전략

서버는 끊긴 세션을 `afterConnectionClosed` 시점에 자동으로 정리한다. 클라이언트는 연결이 끊기면 재연결 후 `doc:init`을 다시 받아 상태를 복원해야 한다.

```typescript
function connect(docId: string, token: string) {
  const ws = new WebSocket(`ws://${host}/ws/documents/${docId}?token=${token}`);

  ws.onopen = () => {
    /* 연결 성공 — doc:init 대기 */
  };
  ws.onclose = (e) => {
    // 비정상 종료인 경우 재연결 시도 (exponential backoff 권장)
    if (e.code !== 1000) setTimeout(() => connect(docId, token), retryDelay);
  };
}
```

### Yjs 초기화 패턴

```typescript
const ydoc = new Y.Doc();
let initialized = false;

ws.onmessage = (event) => {
  const msg: ServerMessage = JSON.parse(event.data);

  switch (msg.type) {
    case 'doc:init':
      // 재연결 시 중복 apply 방지 — 필요하면 ydoc 재생성 후 apply
      for (const b64 of msg.updates) {
        Y.applyUpdate(ydoc, base64ToUint8Array(b64));
      }
      initialized = true;
      break;

    case 'doc:update':
      if (!initialized) return; // doc:init 이전 업데이트 무시
      Y.applyUpdate(ydoc, base64ToUint8Array(msg.update));
      break;
  }
};

// Yjs 편집 감지 → 서버 전송
ydoc.on('update', (update: Uint8Array, origin: unknown) => {
  if (origin === 'remote') return; // 원격 update 재전송 방지
  if (!initialized) return;
  ws.send(
    JSON.stringify({
      type: 'doc:update',
      update: uint8ArrayToBase64(update),
    })
  );
});
```

### Base64 유틸 함수

```typescript
function base64ToUint8Array(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

function uint8ArrayToBase64(arr: Uint8Array): string {
  return btoa(String.fromCharCode(...arr));
}
```

---

## 7. 현재 구현 범위 및 미구현 항목

| 기능                               | 상태       | 비고                       |
| ---------------------------------- | ---------- | -------------------------- |
| 연결 권한 검사 (JWT + 팀스페이스)  | ✅ 구현됨  |                            |
| `doc:init` 초기 상태 전송          | ✅ 구현됨  | snapshot + pending updates |
| `doc:update` 수신 + 브로드캐스트   | ✅ 구현됨  |                            |
| `doc:update` 이중 저장 (버퍼 + DB) | ✅ 구현됨  |                            |
| VIEWER 편집 차단                   | ✅ 구현됨  | 무시 처리, 오류 응답 없음  |
| `feedback:questioning` 이벤트      | ⏳ Phase 4 | AI 피드백 질문 수신        |
| `feedback:ready` 이벤트            | ⏳ Phase 4 | AI 피드백 결과 수신        |
| Awareness (커서 위치 공유)         | ❌ 미계획  | 필요 시 별도 협의          |
