# Phase 2 — 실시간 협업 에디터

> **선행 조건:** [Phase 1](./phase-1-setup.md) 완료 (패키지 설치, 타입 정의, 환경 변수)  
> **다음 단계:** [Phase 3 — 권한 & 문서 복원](./phase-3-permission-restore.md)  
> **공통 규칙:** 반드시 [README.md](./README.md)를 먼저 읽는다.

이 Phase에서 만드는 것:

- `src/hooks/useCollabEditor.ts` — Yjs + BlockNote 통합 훅
- `src/components/document/CollaborativeEditor.tsx` — 에디터 컴포넌트

---

## 배경: 실습 코드와의 관계

실습에서 구현한 `CollaborativeEditor.tsx`(이 레포 `src/components/CollaborativeEditor.tsx`)를 기반으로 한다.  
실습 코드에서 아래 세 가지만 달라진다.

| 항목      | 실습 코드                         | Phase 2 코드                                                                       |
| --------- | --------------------------------- | ---------------------------------------------------------------------------------- |
| WS URL    | `VITE_WS_BASE_URL + '/ws/editor'` | `VITE_WS_BASE_URL/ws/documents/{docId}?token={jwt}` (Raw WebSocket, JSON 프로토콜) |
| 유저 정보 | `randomPick(NAMES/COLORS)`        | 외부에서 주입 (`user` prop)                                                        |
| 읽기 전용 | 없음                              | `useCreateBlockNote({ editable })`                                                 |

단, 실습은 `WebsocketProvider`가 자동으로 sync를 처리했지만, AIdea에서는 백엔드가 커스텀 JSON 프로토콜을 사용하므로 직접 `WebSocket`을 생성하고 `doc:init`/`doc:update` 이벤트를 수동으로 처리한다.

---

## 1. useCollabEditor 훅

백엔드는 Raw WebSocket + JSON 프로토콜을 사용한다. `y-websocket`의 `WebsocketProvider`는 **실제 연결에 사용하지 않는다.**
`WebsocketProvider`는 `connect: false`로만 생성해 BlockNote `collaboration` 타입 요구사항을 충족하는 용도로만 쓴다.

**백엔드 이벤트:**

- `doc:init` (서버→클라이언트, 연결 직후 1회): `updates: string[]` — Base64 Yjs 배열, 순서대로 `Y.applyUpdate`
- `doc:update` (서버→클라이언트): `update: string` — 다른 유저의 편집, `Y.applyUpdate`
- `doc:update` (클라이언트→서버): `update: string, clientId?: string` — 내 편집 Base64 전송

```typescript
// src/hooks/useCollabEditor.ts
import { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { useCreateBlockNote } from '@blocknote/react';

function base64ToUint8Array(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

function uint8ArrayToBase64(arr: Uint8Array): string {
  return btoa(String.fromCharCode(...arr));
}

interface UseCollabEditorOptions {
  docId: string;
  user: { name: string; color: string };
  token: string; // JWT — WS 연결 시 query param으로 전달
  editable: boolean; // Viewer 권한이면 false
}

export function useCollabEditor({ docId, user, token, editable }: UseCollabEditorOptions) {
  // lazy initializer: 첫 렌더 때 딱 한 번만 실행
  // provider는 connect: false — 실제 WS 연결에 사용하지 않음
  // BlockNote collaboration 타입 요구사항을 충족하기 위한 더미 인스턴스
  const [{ doc, provider }] = useState(() => {
    const doc = new Y.Doc();
    const provider = new WebsocketProvider(import.meta.env.VITE_WS_BASE_URL, docId, doc, {
      connect: false,
    });
    return { doc, provider };
  });

  const [connected, setConnected] = useState(false);
  // doc:init 수신 전까지 doc:update 무시
  const initializedRef = useRef(false);

  useEffect(() => {
    const ws = new WebSocket(
      `${import.meta.env.VITE_WS_BASE_URL}/ws/documents/${docId}?token=${token}`
    );

    ws.onopen = () => setConnected(true);
    ws.onclose = () => {
      setConnected(false);
      initializedRef.current = false;
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === 'doc:init') {
        // updates 배열을 순서대로 apply — 빈 배열이면 신규 문서
        for (const b64 of msg.updates) {
          Y.applyUpdate(doc, base64ToUint8Array(b64), 'remote');
        }
        initializedRef.current = true;
        return;
      }

      if (msg.type === 'doc:update') {
        // doc:init 수신 전 업데이트는 무시
        if (!initializedRef.current) return;
        Y.applyUpdate(doc, base64ToUint8Array(msg.update), 'remote');
      }
    };

    // Y.Doc 편집 감지 → 서버 전송
    const handleUpdate = (update: Uint8Array, origin: unknown) => {
      if (origin === 'remote') return; // 원격 update 재전송 방지
      if (!initializedRef.current) return;
      if (ws.readyState !== WebSocket.OPEN) return;
      ws.send(
        JSON.stringify({
          type: 'doc:update',
          update: uint8ArrayToBase64(update),
        })
      );
    };
    doc.on('update', handleUpdate);

    return () => {
      doc.off('update', handleUpdate);
      ws.close(1000);
    };
  }, [docId, token, doc]);

  // useCreateBlockNote는 훅이므로 조건문 없이 최상위 레벨에서 호출
  const editor = useCreateBlockNote({
    collaboration: {
      // connect: false provider — 타입 요구사항 충족용
      // Awareness(커서 공유)는 백엔드 미지원이므로 커서 레이블은 로컬에만 표시됨
      provider,
      fragment: doc.getXmlFragment('document-store'),
      user: { name: user.name, color: user.color },
    },
    editable,
  });

  return { editor, doc, provider, connected };
}
```

---

## 2. CollaborativeEditor 컴포넌트

훅을 조립해 실제 UI를 렌더한다.

```tsx
// src/components/document/CollaborativeEditor.tsx
import '@blocknote/mantine/style.css';
import { BlockNoteView } from '@blocknote/mantine';
import { useCollabEditor } from '@/hooks/useCollabEditor';

interface Props {
  docId: string;
  editable: boolean; // usePermission()의 canEdit을 그대로 전달
  user: { name: string; color: string };
  token: string;
}

function CollaborativeEditor({ docId, editable, user, token }: Props) {
  const { editor, connected } = useCollabEditor({ docId, editable, user, token });

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-1 mb-3">
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${connected ? 'bg-green-500' : 'bg-red-400'}`}
        />
        <span className="text-sm opacity-70">
          {connected ? `${user.name} 으로 연결됨` : '서버에 연결 중...'}
        </span>
      </div>
      <div className="flex-1 rounded-lg border overflow-auto">
        {/* editable은 useCreateBlockNote에서 이미 설정됨 — 여기서 따로 제어하지 않음 */}
        <BlockNoteView editor={editor} />
      </div>
    </div>
  );
}

export default CollaborativeEditor;
```

> **유저 정보 주입:** `user`와 `token`을 prop으로 받는 이유는 Phase 2 단계에서 상위 컴포넌트(MainContent)가 이를 결정하기 때문이다.  
> 실제 유저 정보는 `useCurrentUser()` 훅(`@/hooks/useCurrentUser`)에서 가져온다.  
> `UserResponse`에는 `color` 필드가 없으므로 userId 기반으로 색상을 사전 정의해서 할당한다.
>
> ```typescript
> const CURSOR_COLORS = ['#1971c2', '#e03131', '#2f9e44', '#f08c00', '#7048e8'];
> const userColor = CURSOR_COLORS[user.id % CURSOR_COLORS.length];
> ```

---

## 3. Presence — 접속 중인 유저 목록

> **백엔드 미지원 항목입니다.**
> 현재 백엔드는 Awareness(커서 위치 공유) 프로토콜을 구현하지 않았습니다.
> 헤더 아바타 목록 / 다른 유저 커서 표시는 이번 구현 범위에서 제외됩니다.
> 필요 시 백엔드 팀과 별도 협의 후 추가 구현합니다.

현재 구현에서 `connect: false` provider는 로컬 awareness 상태만 가집니다.
다른 탭/유저의 커서 레이블은 표시되지 않습니다.

---

## 4. WebSocket 연결 주의사항 (실습에서 배운 교훈)

아래 패턴들은 실습에서 직접 겪으며 확인한 내용이다. 절대 어기지 않는다.

### ① Y.Doc / Provider는 lazy initializer로만 생성

```tsx
// ❌ 렌더마다 새 인스턴스 + 새 WebSocket 연결 생성됨
const doc = new Y.Doc()
const provider = new WebsocketProvider(...)

// ✅ 한 번만 생성
const [{ doc, provider }] = useState(() => ({
  doc: new Y.Doc(),
  provider: new WebsocketProvider(...),
}))
```

### ② connected 상태는 WebSocket onopen/onclose로 관리

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

### ③ useCreateBlockNote는 조건문 밖 최상위에서만

```tsx
// ❌ React 훅 규칙 위반 — 런타임 에러
if (editable) { const editor = useCreateBlockNote({ ... }) }

// ✅ 항상 최상위 호출
const editor = useCreateBlockNote({ editable })
```

### ④ docId가 바뀌면 key prop으로 재마운트

```tsx
// ✅ docId가 바뀌면 컴포넌트 완전 재생성 → 새 Y.Doc + 새 Provider
<CollaborativeEditor key={docId} docId={docId} editable={canEdit} ... />
```

### ⑤ cleanup에서는 doc.off()와 ws.close(1000)만 호출

```tsx
// ✅ 올바름 — update 리스너 해제 + WS 정상 종료
return () => {
  doc.off('update', handleUpdate);
  ws.close(1000);
};

// ❌ 금지 — connect:false provider는 destroy 불필요, StrictMode 재마운트 보장 깨짐
return () => provider.destroy();
```

---

## 5. Phase 2 완료 확인

- [ ] 두 개의 브라우저 탭에서 같은 docId로 접속했을 때 텍스트가 실시간 동기화됨 (커서 공유는 백엔드 미지원)
- [ ] `editable: false`로 열었을 때 타이핑이 차단되고, 다른 탭의 수정 내용은 실시간으로 보임
- [ ] 연결 상태 표시(초록/빨강 점)가 올바르게 동작함
- [ ] 새로고침 후에도 에디터가 정상적으로 재연결됨 (connected가 true로 전환)
