# Phase 3 — 권한 처리 & 문서 복원

> **선행 조건:** [Phase 2](./phase-2-collab-editor.md) 완료 (useCollabEditor, CollaborativeEditor)  
> **다음 단계:** [Phase 4 — AI 피드백](./phase-4-ai-feedback.md)  
> **공통 규칙:** 반드시 [README.md](./README.md)를 먼저 읽는다.

이 Phase에서 만드는 것:

- `src/hooks/usePermission.ts` — 팀스페이스 역할 → canEdit 계산
- `src/pages/DocumentPage.tsx` — 훅들을 조립하는 페이지 컴포넌트
- DB 스냅샷 복원 흐름 이해 (프론트 코드 변경 없음, 서버 동작 이해)

사용하는 타입: `DocumentMeta`, `TeamRole` (`src/types/document.ts`)

---

## 1. 권한 모델

팀스페이스 역할별 문서 접근 권한:

| 역할     | 문서 열람 | 문서 편집 |
| -------- | --------- | --------- |
| `OWNER`  | 가능      | 가능      |
| `MEMBER` | 가능      | 가능      |
| `VIEWER` | 가능      | 불가능    |
| 미소속   | 불가능    | 불가능    |

미소속 유저는 라우팅 단계에서 차단한다. Phase 3에서는 `VIEWER` vs 나머지의 분기만 처리한다.

---

## 2. usePermission 훅

```typescript
// src/hooks/usePermission.ts
import type { TeamRole } from '@/types/document';

export function usePermission(role: TeamRole): { canEdit: boolean } {
  return { canEdit: role !== 'VIEWER' };
}
```

단순하지만 명시적으로 훅으로 분리하는 이유: 나중에 역할별 세부 권한(예: 특정 문서 타입 편집 제한)이 추가될 때 이 훅만 수정하면 된다.

---

## 3. DB 스냅샷 복원 — 프론트엔드 관점

실습에서는 서버가 항상 빈 문서를 제공했다.  
AIdea에서는 서버가 연결 직후 `doc:init` 이벤트로 이전 상태를 전송한다.

**서버가 하는 일:**

```
WebSocket 연결 시 서버 동작:
  1. documents.yjs_snapshot (BYTEA) 조회
  2. document_updates WHERE document_id = ? 전체 조회 (id ASC)
  3. { type: "doc:init", updates: ["<base64>", "<base64>", ...] } 전송
     updates[0] = yjs_snapshot (없으면 생략)
     updates[1..] = document_updates rows (미머지 업데이트 목록)
  4. 이후 클라이언트가 보내는 doc:update를 document_updates에 INSERT + 브로드캐스트
```

**프론트엔드가 하는 일 (`useCollabEditor` 내부, Phase 2에서 구현됨):**  
`ws.onmessage`에서 `doc:init` 이벤트를 수신해 `updates` 배열의 각 항목을 순서대로 `Y.applyUpdate(doc, binary, 'remote')`로 적용한다.  
신규 문서라면 `updates`가 빈 배열 `[]`이므로 빈 에디터로 시작한다.

### snapshotClock === null (신규 문서) 처리

`snapshotClock`이 `null`이면 DB에 저장된 내용이 없는 신규 문서다.

```typescript
// DocumentPage에서 snapshotClock을 체크해 AI 피드백 UI 분기에 활용
// (Phase 4에서 useFeedback과 연결)
const isNewDocument = documentMeta.snapshotClock === null;
```

Phase 4의 AI 피드백 `QUESTIONING` 상태에서:

- `isNewDocument === true` → 전체화면 질문 UI (`variant="fullscreen"`)
- `isNewDocument === false` → 사이드 패널 질문 UI (`variant="side-panel"`)

---

## 4. DocumentPage 조립

Phase 2에서 만든 `CollaborativeEditor`와 `usePermission`을 조립한다.  
Phase 4의 피드백 UI는 이 페이지에 추가된다.

DocumentPage는 별도 라우트로 등록하지 않는다.  
현재 프로젝트는 `/main/:docId` → `MainPage` → `MainContent` 구조이므로,  
**`MainContent.tsx`에서 `CollaborativeEditor`를 렌더링하는 방식으로 통합한다.**

```tsx
// src/components/main/MainContent.tsx (수정)
// — 기존 article 텍스트 렌더 부분을 CollaborativeEditor로 교체

import { useParams } from 'react-router';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useDocument } from '@/hooks/useDocument';
import { useTeamspaceStore } from '@/store/teamspaceStore';
import { usePermission } from '@/hooks/usePermission';
import CollaborativeEditor from '@/components/document/CollaborativeEditor';
import type { TeamRole } from '@/types/document';

const CURSOR_COLORS = ['#1971c2', '#e03131', '#2f9e44', '#f08c00', '#7048e8'];

export default function MainContent() {
  const { docId } = useParams();
  const { doc } = useDocument(docId);
  const { user } = useCurrentUser();
  const { currentTeamspaceId } = useTeamspaceStore();

  // JWT 액세스 토큰 — WS 연결 시 ?token= 쿼리 파라미터로 전달
  // 프로젝트의 auth 스토어 또는 useAuth() 훅에서 가져온다
  // 예: const { accessToken } = useAuth()
  const accessToken = ''; // TODO: 실제 JWT 토큰으로 교체

  // 현재 유저의 팀스페이스 역할 — 실제로는 API에서 받아온 role을 사용
  // useTeamspaceDetail() 등에서 members를 조회해 현재 유저의 role을 찾는다
  const currentUserRole: TeamRole = 'MEMBER'; // Phase 3 임시값. Phase 4에서 실제 role로 교체
  const { canEdit } = usePermission(currentUserRole);

  if (!docId || !doc || !user) {
    return <main className="flex-1 bg-white overflow-auto" />;
  }

  const userColor = CURSOR_COLORS[user.id % CURSOR_COLORS.length];
  const collabUser = { name: user.name, color: userColor };

  return (
    <main className="flex-1 bg-white overflow-auto flex flex-col">
      <div className="flex items-center px-6 py-3 border-b shrink-0">
        <span className="text-sm text-gray-500">{doc.title}</span>
        {!canEdit && (
          <span className="ml-3 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
            읽기 전용
          </span>
        )}
      </div>

      <div className="flex-1" style={{ minHeight: 0 }}>
        {/*
          key={docId}: docId가 바뀌면 컴포넌트를 완전 재마운트
          → 새 Y.Doc + 새 WebSocket 연결 생성
        */}
        <CollaborativeEditor
          key={docId}
          docId={docId}
          editable={canEdit}
          user={collabUser}
          token={accessToken}
        />
      </div>

      {/*
        Phase 4에서 추가:
        <FeedbackButton onClick={openFeedbackModal} />
        {feedback 상태에 따른 UI...}
      */}
    </main>
  );
}
```

> **token 처리:** 백엔드 WebSocket은 쿠키 인증을 지원하지 않는다.  
> JWT 액세스 토큰을 `?token={jwt}` 쿼리 파라미터로 전달해야 한다 (websocket-spec.md 방법 B).  
> 토큰은 프로젝트의 auth 스토어 또는 `useAuth()` 훅에서 가져온다.  
> httpOnly 쿠키만 발급하는 구조라면 백엔드 팀에 별도 토큰 접근 방법을 협의한다.

> **currentUserRole:** 현재는 임시로 `'MEMBER'`를 하드코딩했다.  
> 실제 구현 시에는 `useTeamspaceDetail(currentTeamspaceId)`로 멤버 목록을 가져와  
> 현재 유저(`user.id`)의 `role`을 찾아 `usePermission()`에 전달한다.

---

## 5. Phase 3 완료 확인

- [ ] `/main/:docId` 접속 시 `MainContent`에서 `CollaborativeEditor`가 렌더됨
- [ ] `OWNER` / `MEMBER`로 열면 에디터에서 타이핑 가능
- [ ] `VIEWER`로 열면 에디터 타이핑 차단 + "읽기 전용" 표시
- [ ] 다른 문서로 이동(docId 변경) 후 에디터가 새로 초기화됨 (이전 문서 내용이 남지 않음)
- [ ] `useCurrentUser()`에서 가져온 실제 유저 이름이 에디터에 표시됨
- [ ] JWT 액세스 토큰을 `CollaborativeEditor`의 `token` prop으로 전달 중
- [ ] `doc.snapshotClock` 값을 Phase 4에서 사용할 수 있도록 접근 가능한 상태로 보관 중
