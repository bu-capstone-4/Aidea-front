# Task 03 — WebSocket 훅

> 상태: ⬜ 미완료  
> 의존성: [Task 01 — 타입 정의](task-01-types-and-api.md), [Task 02 — 스토어](task-02-store.md)

---

## 목표

백로그 WebSocket 연결을 관리하는 훅을 구현한다.  
기존 `src/hooks/useTeamspaceSocket.ts` 패턴을 따른다.

---

## 파일: `src/hooks/useBacklogSocket.ts`

### 연결 엔드포인트

```
ws://{host}/ws/backlog/{teamspaceId}
```

환경 변수: `import.meta.env.VITE_WS_BASE_URL` (기존과 동일)

### 인터페이스

```ts
interface UseBacklogSocketOptions {
  teamspaceId: string | null;
  enabled?: boolean; // false면 연결 안 함 (모달 닫힌 상태)
}

interface UseBacklogSocketResult {
  connected: boolean;
  onlineEditorCount: number; // 임시값 (백엔드 미구현 — 항상 0)
}
```

### 구현 구조

```ts
export function useBacklogSocket({
  teamspaceId,
  enabled = true,
}: UseBacklogSocketOptions): UseBacklogSocketResult {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);

  const applyInit = useBacklogStore((s) => s.applyInit);
  const applyConfigUpdated = useBacklogStore((s) => s.applyConfigUpdated);
  // ... 나머지 스토어 액션들

  useEffect(() => {
    if (!enabled || !teamspaceId) return;

    const ws = new WebSocket(`${import.meta.env.VITE_WS_BASE_URL}/ws/backlog/${teamspaceId}`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);

    ws.onmessage = (event: MessageEvent<string>) => {
      const msg = JSON.parse(event.data) as BacklogServerMessage;

      // 에러 이벤트 처리 (event 키 사용)
      if ('event' in msg) {
        handleSocketError({ code: msg.code, message: msg.message });
        return;
      }

      switch (msg.type) {
        case 'backlog:init':
          applyInit(msg.config, msg.epics, msg.stories);
          break;
        case 'backlog:config_updated':
          applyConfigUpdated(msg.config);
          break;
        case 'epic:created':
          applyEpicCreated(msg.epic);
          break;
        // ... 나머지 케이스들
      }
    };

    ws.onclose = () => {
      setConnected(false);
      wsRef.current = null;
    };

    ws.onerror = () => {
      setConnected(false);
    };

    return () => {
      ws.close(1000);
      wsRef.current = null;
    };
  }, [enabled, teamspaceId /* 스토어 액션들 */]);

  return { connected, onlineEditorCount: 0 };
}
```

### 메시지 타입 가드

```ts
function isBacklogServerMessage(msg: unknown): msg is BacklogServerMessage {
  if (!msg || typeof msg !== 'object') return false;
  const m = msg as Record<string, unknown>;
  // error 이벤트
  if (m.event === 'error') return true;
  // 일반 이벤트
  const validTypes = new Set([
    'backlog:init',
    'backlog:config_updated',
    'epic:created',
    'epic:updated',
    'epic:deleted',
    'story:created',
    'story:updated',
    'story:status_changed',
    'story:reordered',
    'story:deleted',
    'task:created',
    'task:updated',
    'task:completed',
    'task:reordered',
    'task:deleted',
  ]);
  return typeof m.type === 'string' && validTypes.has(m.type);
}
```

### `src/shared/socketErrorHandler.ts` 업데이트

백로그 WS 전용 에러 코드를 기존 `ERROR_MESSAGES` 맵에 추가:

```ts
// 백로그 소켓 에러 코드 추가
INVALID_MESSAGE: '잘못된 요청 형식입니다.',
// INSUFFICIENT_PERMISSION, UNAUTHORIZED, SESSION_EXPIRED 는 이미 존재
```

백로그 에러 코드 타입도 `src/types/backlog.ts`에 추가:

```ts
export type BacklogSocketErrorCode =
  | 'INSUFFICIENT_PERMISSION'
  | 'DOCUMENT_NOT_FOUND'
  | 'INVALID_MESSAGE'
  | 'INTERNAL_SERVER_ERROR'
  | 'UNAUTHORIZED'
  | 'SESSION_EXPIRED';
```

---

## 스토어 연결 패턴

각 WS 이벤트 → 스토어 액션 매핑:

| WS 이벤트                | 스토어 액션                                          |
| ------------------------ | ---------------------------------------------------- |
| `backlog:init`           | `applyInit(config, epics, stories)`                  |
| `backlog:config_updated` | `applyConfigUpdated(config)`                         |
| `epic:created`           | `applyEpicCreated(epic)`                             |
| `epic:updated`           | `applyEpicUpdated(epic)`                             |
| `epic:deleted`           | `applyEpicDeleted(epicId)`                           |
| `story:created`          | `applyStoryCreated(story)`                           |
| `story:updated`          | `applyStoryUpdated(story)`                           |
| `story:status_changed`   | `applyStoryStatusChanged(storyId, status, closedAt)` |
| `story:reordered`        | `applyStoryReordered(orderedIds)`                    |
| `story:deleted`          | `applyStoryDeleted(storyId)`                         |
| `task:created`           | `applyTaskCreated(storyId, task)`                    |
| `task:updated`           | `applyTaskUpdated(storyId, task)`                    |
| `task:completed`         | `applyTaskCompleted(storyId, taskId, isCompleted)`   |
| `task:reordered`         | `applyTaskReordered(storyId, orderedIds)`            |
| `task:deleted`           | `applyTaskDeleted(storyId, taskId)`                  |

---

## 구현 주의사항

- `useEffect` deps 배열에 스토어 액션 함수들을 넣으면 WS가 재생성될 수 있다.  
  Zustand 액션은 reference stable하므로 deps에 넣어도 안전하지만,  
  과도한 deps 나열이 싫으면 `useRef`로 최신 액션을 참조하는 방식 사용.

- WS 연결은 `enabled=true`일 때만 (백로그 모달이 열려있을 때만) 유지.  
  `enabled=false` 또는 `teamspaceId=null`이면 연결하지 않음.

- `ws.close(1000)` — 정상 종료 코드. 서버에서 의도치 않은 에러로 처리되지 않도록.

- `backlog:init` 수신 시 `isInitialized=true`로 바꿔 화면 전환 트리거.  
  config가 모두 `false`이면 WelcomeScreen → ConfigModal로 유도.

---

## 작업 로그

| 날짜       | 내용                                                                                    |
| ---------- | --------------------------------------------------------------------------------------- |
| 2026-05-26 | 작업 시작.                                                                              |
| 2026-05-26 | `BacklogSocketErrorCode` 타입을 `src/types/backlog.ts`에 추가.                          |
| 2026-05-26 | `socketErrorHandler.ts`에 `BacklogSocketErrorCode` 유니온 추가.                         |
| 2026-05-26 | `src/hooks/useBacklogSocket.ts` 구현 완료. 15개 WS 이벤트 → 스토어 액션 매핑 전체 처리. |
| 2026-05-26 | 작업 완료.                                                                              |
