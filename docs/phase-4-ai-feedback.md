# Phase 4 — AI 피드백 시스템

> **선행 조건:** [Phase 3](./phase-3-permission-restore.md) 완료 (DocumentPage, 권한 처리, documentMeta.snapshotClock 접근 가능)  
> **공통 규칙:** 반드시 [README.md](./README.md)를 먼저 읽는다.

이 Phase에서 만드는 것:

- `src/hooks/useFeedback.ts` — 피드백 상태 관리 + SSE 수신 + API 호출
- `src/components/document/feedback/FeedbackButton.tsx` — 피드백 요청 버튼
- `src/components/document/feedback/FeedbackModal.tsx` — 추가 요청사항 입력 모달
- `src/components/document/feedback/QuestionPanel.tsx` — AI 질문 UI
- `src/components/document/feedback/FeedbackSplitView.tsx` — 수정 전/후 비교 뷰

사용하는 타입: `Feedback`, `FeedbackStatus`, `Question`, `Answer` (`src/types/document.ts`)

---

## 1. AI 피드백 상태 흐름

```
[유저가 "AI 피드백" 버튼 클릭]
        │
        ▼
  FeedbackModal 열림 (추가 요청사항 입력, 선택사항)
        │
        ▼ POST /api/documents/{docId}/feedback
        │
   status: PENDING  ← 로딩 스피너 표시
        │
        ├─ [문서 충분] Gemini가 바로 피드백 생성
        │       │
        │       └─ SSE: feedback:ready { feedbackId, yjsBinary(base64) }
        │              status: DONE
        │              → FeedbackSplitView 표시
        │
        └─ [문서 빈약] Gemini가 질문 생성
                │
                └─ SSE: feedback:questioning { feedbackId, questions }
                       status: QUESTIONING
                       → QuestionPanel 표시
                              │
                              ▼ POST /api/feedbacks/{feedbackId}/answer
                       status: ANSWERING  ← 로딩 스피너
                              │
                              └─ SSE: feedback:ready
                                     status: DONE
                                     → FeedbackSplitView 표시

[FeedbackSplitView에서 "이 버전 선택하기" 클릭]
        │
        ▼ POST /api/feedbacks/{feedbackId}/accept
   status: ACCEPTED
        └─ 서버가 AI 버전을 문서에 반영 → WS로 전체 클라이언트에 전파
           → 일반 편집 상태로 돌아감
```

---

## 2. UI 분기 규칙

`feedback` 상태에 따라 DocumentPage에서 렌더링을 분기한다.

```
feedback === null
  → FeedbackButton 표시

feedback.status === 'PENDING' | 'ANSWERING'
  → 로딩 스피너 오버레이

feedback.status === 'QUESTIONING'
  → documentMeta.snapshotClock === null (신규 문서)
      ? <QuestionPanel variant="fullscreen" />   — 전체화면 (문서 내용 없으므로)
      : <QuestionPanel variant="side-panel" />   — 우측 사이드 패널

feedback.status === 'DONE'
  → <FeedbackSplitView>
      left:  현재 문서 (읽기 전용)
      right: feedback.yjsBinary로 복원한 AI 버전
      [이 버전 선택하기] → acceptFeedback() → status: ACCEPTED

feedback.status === 'ACCEPTED'
  → 일반 편집 상태 (feedback을 null로 초기화)
```

---

## 3. useFeedback 훅

> **MSW 개발 환경 제한사항:**  
> 현재 MSW mock(`src/mocks/handlers/feedback.ts`)은 SSE를 구현하지 않는다.  
> MSW v2에서 SSE를 시뮬레이션하려면 별도 작업이 필요하며, 현재 mock은 PENDING → DONE  
> 상태 전환만 지원하고 QUESTIONING / ANSWERING 상태는 구현되어 있지 않다.  
> SSE 이벤트 수신 테스트는 실제 백엔드(`VITE_USE_REAL_AUTH=true`)를 연결한 상태에서 진행한다.

```typescript
// src/hooks/useFeedback.ts
import { useEffect, useState } from 'react';
import { apiClient } from '@/shared/apiClient';
import type { Feedback, Answer } from '@/types/document';

export function useFeedback(documentId: string) {
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  // 서버 → 클라이언트: SSE로 피드백 상태 이벤트 수신
  // SSE는 쿠키 인증을 자동 포함하므로 별도 헤더 설정 불필요
  useEffect(() => {
    const baseUrl =
      import.meta.env.VITE_USE_REAL_AUTH === 'true'
        ? (import.meta.env.VITE_API_BASE_URL ?? '')
        : '';
    const eventSource = new EventSource(`${baseUrl}/api/documents/${documentId}/feedback/events`, {
      withCredentials: true,
    });

    // QUESTIONING: 문서가 빈약해서 AI가 질문 목록 생성 완료
    eventSource.addEventListener('feedback:questioning', (e) => {
      const data = JSON.parse(e.data); // { feedbackId: string, questions: Question[] }
      setFeedback((prev) =>
        prev
          ? { ...prev, id: data.feedbackId, status: 'QUESTIONING', questions: data.questions }
          : null
      );
    });

    // DONE: AI 피드백 생성 완료 — Yjs 바이너리 포함
    eventSource.addEventListener('feedback:ready', (e) => {
      const data = JSON.parse(e.data); // { feedbackId: string, yjsBinary: string (base64) }
      // 서버는 BYTEA를 base64로 직렬화해서 전송 → 클라이언트에서 Uint8Array로 변환
      const yjsBinary = Uint8Array.from(atob(data.yjsBinary), (c) => c.charCodeAt(0));
      setFeedback((prev) =>
        prev ? { ...prev, id: data.feedbackId, status: 'DONE', yjsBinary } : null
      );
    });

    return () => eventSource.close();
  }, [documentId]);

  // 피드백 요청 (FeedbackModal에서 호출)
  const requestFeedback = async (additionalRequest?: string) => {
    const res = await apiClient.post(`/api/documents/${documentId}/feedback`, {
      additionalRequest,
    });
    const data = res.data.data; // { feedbackId: string, status: 'PENDING' }
    setFeedback({
      id: data.feedbackId,
      documentId,
      status: 'PENDING',
      questions: null,
      yjsBinary: null,
    });
  };

  // 질문 답변 제출 (QuestionPanel에서 호출, QUESTIONING → ANSWERING)
  const submitAnswers = async (feedbackId: string, answers: Answer[]) => {
    await apiClient.post(`/api/feedbacks/${feedbackId}/answer`, { answers });
    setFeedback((prev) => (prev ? { ...prev, status: 'ANSWERING' } : null));
    // 이후 서버가 Gemini 재호출 → SSE feedback:ready 이벤트 발행
  };

  // 버전 선택 수락 (FeedbackSplitView에서 호출, DONE → ACCEPTED)
  const acceptFeedback = async (feedbackId: string) => {
    await apiClient.post(`/api/feedbacks/${feedbackId}/accept`);
    setFeedback((prev) => (prev ? { ...prev, status: 'ACCEPTED' } : null));
    // 서버가 AI 버전을 yjs_snapshot에 반영하고 WS로 전파
    // 모든 클라이언트의 Y.Doc에 자동으로 적용됨
  };

  // ACCEPTED 이후 피드백 UI를 초기 상태로 되돌림
  const resetFeedback = () => setFeedback(null);

  return { feedback, requestFeedback, submitAnswers, acceptFeedback, resetFeedback };
}
```

---

## 4. FeedbackButton & FeedbackModal

```tsx
// src/components/document/feedback/FeedbackButton.tsx
interface Props {
  onClick: () => void;
}

function FeedbackButton({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium
                 text-purple-700 bg-purple-50 rounded-full border border-purple-200
                 hover:bg-purple-100 transition-colors"
    >
      + AI 피드백
    </button>
  );
}

export default FeedbackButton;
```

```tsx
// src/components/document/feedback/FeedbackModal.tsx
import { useState } from 'react';

interface Props {
  onSubmit: (additionalRequest?: string) => void;
  onClose: () => void;
}

function FeedbackModal({ onSubmit, onClose }: Props) {
  const [additionalRequest, setAdditionalRequest] = useState('');

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-130 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-lg flex items-center gap-2">+ AI 피드백 요청</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="mb-5">
          <label className="text-sm font-medium mb-1.5 block">
            추가 요청 사항 <span className="text-gray-400 font-normal">선택사항</span>
          </label>
          <textarea
            className="w-full border rounded-lg px-3 py-2.5 text-sm resize-none
                       placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300"
            rows={5}
            placeholder="선택사항입니다. 입력하지 않으면 아이디어와 비교해서 피드백을 해드립니다."
            value={additionalRequest}
            onChange={(e) => setAdditionalRequest(e.target.value)}
          />
        </div>

        <button
          onClick={() => onSubmit(additionalRequest || undefined)}
          className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium
                     flex items-center justify-center gap-2 hover:bg-blue-700"
        >
          + 피드백 요청
        </button>
      </div>
    </div>
  );
}

export default FeedbackModal;
```

---

## 5. QuestionPanel 컴포넌트

AI가 문서가 빈약하다고 판단했을 때 표시하는 질문 UI다.  
`variant`로 전체화면(신규 문서)과 사이드 패널(기존 문서) 두 가지 레이아웃을 지원한다.

```tsx
// src/components/document/feedback/QuestionPanel.tsx
import { useState } from 'react';
import type { Question, Answer } from '@/types/document';

interface Props {
  questions: Question[];
  variant: 'fullscreen' | 'side-panel';
  onSubmit: (answers: Answer[]) => void;
}

function QuestionPanel({ questions, variant, onSubmit }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleSelect = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = () => {
    // 답하지 않은 질문은 제외하고 제출 — 서버가 부분 답변도 수용
    const result: Answer[] = Object.entries(answers).map(([questionId, value]) => ({
      questionId,
      value,
    }));
    onSubmit(result);
  };

  const containerClass =
    variant === 'fullscreen'
      ? 'fixed inset-0 bg-gray-50 z-40 overflow-auto p-8 flex flex-col items-center'
      : 'w-[420px] h-full overflow-auto p-6 bg-white border-l';

  return (
    <div className={containerClass}>
      <div className={variant === 'fullscreen' ? 'w-full max-w-2xl' : 'w-full'}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-purple-600 font-medium">+ Aldea</span>
        </div>
        <p className="text-sm text-gray-600 mb-1">
          기획 내용을 검토했어요. 피드백을 드리기 전에 방향을 조금 더 명확하게 파악하고 싶어서요.
        </p>
        <p className="text-sm text-purple-600 mb-6">
          몇 가지만 여쭤봐도 될까요? 선택하거나 직접 입력하실 수 있어요.
        </p>

        {questions.map((q, idx) => (
          <div key={q.id} className="mb-4 p-4 border rounded-lg bg-white">
            <p className="font-medium text-sm mb-3">
              {idx + 1}. {q.text}
            </p>

            {/* 선택지가 있는 질문 */}
            {q.options?.map((option) => (
              <label key={option} className="flex items-center gap-2 mb-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  name={q.id}
                  value={option}
                  checked={answers[q.id] === option}
                  onChange={() => handleSelect(q.id, option)}
                  className="accent-blue-600"
                />
                {option}
              </label>
            ))}

            {/* 직접 입력 라디오 (선택지가 있을 때만 표시) */}
            {q.options && (
              <>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name={q.id}
                    value="__custom__"
                    checked={!!answers[q.id] && !q.options.includes(answers[q.id])}
                    onChange={() => handleSelect(q.id, '')}
                    className="accent-blue-600"
                  />
                  ✏️ 직접 입력
                </label>
                {!!answers[q.id] && !q.options.includes(answers[q.id]) && (
                  <input
                    className="mt-2 w-full border rounded px-3 py-2 text-sm
                               focus:outline-none focus:ring-2 focus:ring-blue-300"
                    placeholder="직접 입력해주세요..."
                    value={answers[q.id]}
                    onChange={(e) => handleSelect(q.id, e.target.value)}
                  />
                )}
              </>
            )}

            {/* 선택지 없는 질문 — 텍스트 직접 입력만 */}
            {!q.options && (
              <input
                className="w-full border rounded px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="직접 입력해주세요..."
                value={answers[q.id] ?? ''}
                onChange={(e) => handleSelect(q.id, e.target.value)}
              />
            )}
          </div>
        ))}

        <button
          onClick={handleSubmit}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium
                     hover:bg-blue-700 transition-colors"
        >
          답변 완료 — AI 피드백 받기 →
        </button>
        <p className="text-center text-xs text-gray-400 mt-2">
          모든 질문에 답하지 않아도 피드백을 받을 수 있어요. 답변할수록 더 정확한 피드백을 드립니다.
        </p>
      </div>
    </div>
  );
}

export default QuestionPanel;
```

---

## 6. FeedbackSplitView 컴포넌트

수정 전(현재 문서)과 AI 피드백 후(Yjs 바이너리 복원)를 좌우로 비교하는 뷰다.

### 핵심 기술 포인트: connect:false 패턴

`useCreateBlockNote`의 `collaboration` 옵션은 `provider`가 필수 타입이다.  
서버 연결 없이 로컬 Y.Doc을 렌더할 때는 `connect: false`로 생성한 WebsocketProvider를 쓴다.  
이렇게 하면 실제 WS 연결 없이 collaboration 타입 요구사항을 만족한다.

```tsx
// src/components/document/feedback/FeedbackSplitView.tsx
import '@blocknote/mantine/style.css';
import { useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';

interface Props {
  currentEditor: ReturnType<typeof useCreateBlockNote>; // DocumentPage에서 useCollabEditor가 반환한 editor
  yjsBinary: Uint8Array; // useFeedback의 feedback.yjsBinary
  onAccept: () => void;
}

function FeedbackSplitView({ currentEditor, yjsBinary, onAccept }: Props) {
  // AI 버전 Y.Doc을 현재 문서와 완전히 분리해서 생성
  // useState lazy initializer — 한 번만 생성 (Yjs 생성 패턴 그대로)
  const [{ aiDoc, aiProvider }] = useState(() => {
    const aiDoc = new Y.Doc();
    // yjsBinary를 Y.Doc에 적용 — 현재 문서에 영향 없음
    Y.applyUpdate(aiDoc, yjsBinary);

    // connect: false — 서버에 연결하지 않는 로컬 전용 provider
    // collaboration.provider 타입을 맞추기 위해 필요
    const aiProvider = new WebsocketProvider(
      import.meta.env.VITE_WS_BASE_URL,
      'ai-feedback-preview',
      aiDoc,
      { connect: false }
    );
    return { aiDoc, aiProvider };
  });

  // AI 버전 에디터 — 읽기 전용, 서버 동기화 없음
  // useCreateBlockNote는 훅이므로 조건문 없이 최상위에서 호출
  const aiEditor = useCreateBlockNote({
    collaboration: {
      provider: aiProvider,
      fragment: aiDoc.getXmlFragment('document-store'), // 이름은 실제 문서와 반드시 동일
      user: { name: 'AI', color: '#7c3aed' },
    },
    editable: false,
  });

  return (
    <div className="flex flex-col h-full">
      {/* 상단 배너 */}
      <div className="flex items-center justify-between px-6 py-3 bg-purple-50 border-b">
        <span className="text-sm text-purple-700">
          + AI가 총 3곳을 수정했습니다 — 서비스 목적 보완, 핵심 기능 재정의, 타깃 사용자 항목 추가
        </span>
        <button className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
      </div>

      {/* 좌우 분할 뷰 */}
      <div className="grid grid-cols-2 gap-0 flex-1" style={{ minHeight: 0 }}>
        {/* 왼쪽: 수정 전 (현재 문서) */}
        <div className="flex flex-col border-r">
          <div className="flex items-center gap-2 px-4 py-2 border-b bg-gray-50">
            <span className="w-2 h-2 rounded-full bg-gray-400" />
            <span className="text-sm font-medium text-gray-600">수정 전</span>
          </div>
          <div className="flex-1 overflow-auto opacity-70">
            {/*
              currentEditor는 editable=true로 만들어진 에디터다.
              FeedbackSplitView에서는 읽기 전용으로 보여야 하므로
              BlockNoteView의 editable prop을 예외적으로 사용한다.
              (신규 에디터를 만드는 것보다 기존 인스턴스를 재사용하는 게 나음)
            */}
            <BlockNoteView editor={currentEditor} editable={false} />
          </div>
          <div className="p-3 border-t">
            <button
              disabled
              className="w-full py-2 text-sm text-gray-400 border rounded-lg cursor-not-allowed"
            >
              이 버전 선택
            </button>
          </div>
        </div>

        {/* 오른쪽: AI 피드백 후 */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 px-4 py-2 border-b bg-blue-50">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-sm font-medium text-blue-700">AI 피드백 후</span>
            <span className="ml-auto text-xs text-purple-600">+ AI</span>
          </div>
          <div className="flex-1 overflow-auto">
            <BlockNoteView editor={aiEditor} />
          </div>
          <div className="p-3 border-t">
            <button
              onClick={onAccept}
              className="w-full py-2 text-sm bg-blue-600 text-white rounded-lg
                         font-medium hover:bg-blue-700 transition-colors"
            >
              이 버전 선택하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FeedbackSplitView;
```

---

## 7. DocumentPage에 피드백 통합

Phase 3에서 만든 `DocumentPage.tsx`에 피드백 UI를 추가한다.

```tsx
// MainContent.tsx — Phase 4 추가분 (Phase 3 코드에 병합)
import { useState } from 'react'
import { useFeedback } from '@/hooks/useFeedback'
import { useCollabEditor } from '@/hooks/useCollabEditor'
import FeedbackButton from '@/components/document/feedback/FeedbackButton'
import FeedbackModal from '@/components/document/feedback/FeedbackModal'
import QuestionPanel from '@/components/document/feedback/QuestionPanel'
import FeedbackSplitView from '@/components/document/feedback/FeedbackSplitView'

// MainContent 함수 내부에 추가
const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false)
const { feedback, requestFeedback, submitAnswers, acceptFeedback, resetFeedback } =
  useFeedback(docId!)

// useCollabEditor에서 editor도 꺼내야 FeedbackSplitView에 전달 가능
// CollaborativeEditor 컴포넌트 대신 useCollabEditor를 직접 호출하고 editor를 FeedbackSplitView에 전달
// token은 Phase 3과 동일하게 auth 스토어에서 가져온다
const { editor, connected } = useCollabEditor({ docId: docId!, editable: canEdit, user: collabUser, token: accessToken })

const isNewDocument = doc.snapshotClock === null

// --- JSX ---

// 헤더에 FeedbackButton 추가
<FeedbackButton onClick={() => setIsFeedbackModalOpen(true)} />

// 에디터 아래 또는 overlay로 피드백 UI 분기
{feedback === null && null}

{(feedback?.status === 'PENDING' || feedback?.status === 'ANSWERING') && (
  <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-30">
    <span className="text-sm text-gray-500">AI가 분석 중입니다...</span>
  </div>
)}

{feedback?.status === 'QUESTIONING' && feedback.questions && (
  <QuestionPanel
    questions={feedback.questions}
    variant={isNewDocument ? 'fullscreen' : 'side-panel'}
    onSubmit={answers => submitAnswers(feedback.id, answers)}
  />
)}

{feedback?.status === 'DONE' && feedback.yjsBinary && (
  <FeedbackSplitView
    currentEditor={editor}
    yjsBinary={feedback.yjsBinary}
    onAccept={() => {
      acceptFeedback(feedback.id)
      resetFeedback()
    }}
  />
)}

{/* FeedbackModal */}
{isFeedbackModalOpen && (
  <FeedbackModal
    onSubmit={additionalRequest => {
      setIsFeedbackModalOpen(false)
      requestFeedback(additionalRequest)
    }}
    onClose={() => setIsFeedbackModalOpen(false)}
  />
)}
```

---

## 8. Phase 4 완료 확인

- [ ] "AI 피드백" 버튼 클릭 → FeedbackModal 열림
- [ ] 피드백 요청 후 로딩 스피너 표시 (PENDING 상태)
- [ ] SSE `feedback:questioning` 수신 → QuestionPanel 표시
  - 신규 문서: 전체화면 레이아웃
  - 기존 문서: 사이드 패널 레이아웃
- [ ] 답변 제출 → 로딩 스피너 (ANSWERING)
- [ ] SSE `feedback:ready` 수신 → FeedbackSplitView 표시
  - 왼쪽: 현재 문서 읽기 전용
  - 오른쪽: AI 버전 렌더링
- [ ] "이 버전 선택하기" → 서버 수락 → 에디터에 AI 버전이 반영됨
