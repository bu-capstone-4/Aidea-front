# 백로그 구현 로그

> 작업 진행 중 발생하는 특이사항, 결정 사항, 막힌 부분을 기록한다.  
> 각 항목은 날짜 + 태스크 + 내용 형식으로 작성.

---

## 로그 작성 방법

```markdown
### YYYY-MM-DD

**[Task XX]** 제목 or 작업 설명

내용:

- 발생한 상황 / 결정 이유 / 변경 사항

영향 범위:

- 변경된 파일 or 태스크
```

---

## 로그

### 2026-05-26

**[Task 07]** 작업 완료. 스토리 생성/수정 폼 및 태스크 목록 완전 구현.

내용:

- `src/utils/backlog.ts`에 `toStorySummary` 추가 시 ESLint `no-unused-vars` 오류 발생 → `// eslint-disable-next-line` 주석으로 해결 (destructuring rest 패턴 특성상 불가피)
- `MoreMenu` 컴포넌트 미존재 — 태스크 행 수정/삭제를 연필·X 아이콘 인라인 버튼으로 구현 (스펙 대안)
- 태스크 수정 UI를 별도 모달 대신 인라인 input 전환 방식으로 구현 (단순성 우선)
- `BacklogModal` 내 `BacklogMainViewProps`에서 `onAddStory`/`onEditStory`를 제거하고 `BacklogMainView` 내부에서 `useStoryApi` 직접 호출 (props 드릴링 최소화)
- 담당자 목록은 `useTeamspaceDetail(teamspaceId)`로 `BacklogMainView` 내부에서 로드해 `StoryFormModal`에 prop 전달

영향 범위:

- `src/utils/backlog.ts` (수정 — toStorySummary 추가)
- `src/hooks/useStoryApi.ts` (신규)
- `src/hooks/useTaskApi.ts` (신규)
- `src/components/backlog/StoryFormModal.tsx` (신규)
- `src/components/backlog/StoryDetailPanel.tsx` (기존 스텁 → 완전 구현)
- `src/components/backlog/BacklogModal.tsx` (수정 — StoryFormModal 연결)

---

### 2026-05-26

**[Task 06]** 작업 완료. 보드 뷰 (칸반) 구현.

내용:

- `BacklogMainView`에 `onAddStory`, `onEditStory` props 추가. Task 07 연결 전까지 BacklogModal에서 no-op으로 전달.
- 드래그앤드롭 미구현. 카드 더보기 버튼(···) 클릭으로 상태 변경 드롭다운 제공 (스펙 동일).
- `CLOSED` 스토리는 보드 뷰 3개 컬럼(OPEN/IN_PROGRESS/DONE)에서 숨김 처리.
- `storiesByStatus` map에 `CLOSED` 키도 초기화해 TypeScript Record 완전 충족.

영향 범위:

- `src/components/backlog/StoryCard.tsx` (신규)
- `src/components/backlog/BacklogBoardView.tsx` (신규)
- `src/components/backlog/BacklogModal.tsx` (수정)

---

### 2026-05-26

**[Task 05]** 작업 완료. 백로그 메인 모달 및 목록 뷰 구현.

내용:

- `editingStory` 상태 제거: StoryFormModal은 Task 07 스코프이므로 `onEditStory` 콜백을 no-op으로 연결. Task 07에서 상태 복구 예정.
- `deleteStory` import를 StoryRow에서 제거: 삭제 confirm + API 호출 로직을 BacklogListView로 이동해 관심사 분리.
- `StoryDetailPanel`은 최소 스텁(태스크 읽기 전용 표시)만 구현. 태스크 CRUD는 Task 07에서 확장.
- `BacklogMainView`는 별도 파일 없이 BacklogModal.tsx 내부 컴포넌트로 선언.

영향 범위:

- `src/components/backlog/BacklogModal.tsx` (수정)
- `src/components/backlog/BacklogListView.tsx` (신규)
- `src/components/backlog/StoryRow.tsx` (신규)
- `src/components/backlog/StoryDetailPanel.tsx` (신규, 스텁)
- `src/components/backlog/StatusBadge.tsx` (신규)
- `src/components/backlog/IssueTypeTag.tsx` (신규)
- `src/components/backlog/EpicBadge.tsx` (신규)
- `src/components/backlog/PriorityBadge.tsx` (신규)

---

### 2026-05-26

**[Task 04]** BacklogModal 화면 전환 — useEffect 내 setState 제거

내용:

- ESLint `react-hooks/set-state-in-effect` 규칙으로 useEffect 내 `setScreen()` 호출 불가
- 해결: `isInitialized`, `config` 스토어 값에서 `storeScreen`을 직접 파생 (별도 effect 없음)
- 사용자 조작(welcome → config) 전환은 `showConfig: boolean` 단일 상태로만 관리

영향 범위:

- `src/components/backlog/BacklogModal.tsx`

---

**[Task 04]** Toggle 컴포넌트 분리

내용:

- 스펙에서 ConfigModal 내부 또는 `ui/Toggle.tsx`로 분리 선택 가능 → 분리 선택
- Task 06 보드 뷰 필터 바 및 이후 태스크에서 재사용 예정

영향 범위:

- `src/components/ui/Toggle.tsx` (신규)

---

**[Task 04]** 작업 완료. WelcomeScreen, ConfigModal, Toggle, BacklogModal(교체) 구현. tsc & eslint 통과.

영향 범위:

- `src/components/backlog/WelcomeScreen.tsx` (신규)
- `src/components/backlog/ConfigModal.tsx` (신규)
- `src/components/backlog/BacklogModal.tsx` (교체)

---

**[Task 03]** 작업 완료. useBacklogSocket 훅 구현. 모든 WS 이벤트 타입 핸들링.

영향 범위:

- `src/hooks/useBacklogSocket.ts` (신규)

---

**[Task 01 / 02]** 작업 완료. 타입 정의, API 레이어, Zustand 스토어 구현.

내용:

- `BacklogUser` 타입을 기존 `UserResponse`와 분리 (필드 구조 불일치)
- REST 응답 래퍼 `GlobalResponse<T>` 타입을 api 파일 내부에서만 사용 (외부 노출 안 함)

영향 범위:

- `src/types/backlog.ts`, `src/api/backlog.ts`, `src/store/backlogStore.ts` (신규)

---

**[Task 09]** 작업 완료. 사이드바 백로그 버튼 및 MainPage 오버레이 상태 추가.

영향 범위:

- `src/components/main/MainSideBar.tsx`, `src/pages/MainPage.tsx`

---

**[계획]** 백로그 구현 계획 문서 초안 작성 완료

내용:

- `docs/backlog-frontend-spec.md` 기반으로 총 9개 태스크 계획 수립
- 백엔드 제안 사항 6건 식별 및 `backend-proposal.md` 작성
- 주요 설계 결정:
  - 백로그는 URL 라우팅 변경 없이 상태 기반 오버레이 모달로 구현
  - 에픽 토글(아코디언) 없이 라벨 + 정렬 방식
  - AI 초안 생성 미구현으로 "만들기" 버튼으로 대체
  - Tasks 지연 로딩 (스토리 펼칠 때 getStoryDetail 호출)
  - `BacklogUser` 타입을 기존 `UserResponse`와 분리

영향 범위:

- 계획 문서 전체 (신규 작성)
