# Task 05 — 백로그 메인 모달 & 목록 뷰

> 상태: ⬜ 미완료  
> 의존성: [Task 02](task-02-store.md), [Task 03](task-03-ws-hook.md), [Task 04](task-04-welcome-config-ui.md)

---

## 목표

백로그 메인 컨테이너 모달과 목록 뷰(List View)를 구현한다.  
디자인 스크린샷 4번 (목록 뷰)을 기준으로 한다.

---

## 1. `src/components/backlog/BacklogModal.tsx` — 최상위 모달 컨테이너

### 역할

- WS 연결 상태에 따라 WelcomeScreen / ConfigModal / 메인 화면을 전환
- 배경 오버레이 렌더링
- 뷰 전환 (목록 ↔ 보드) 상태 관리

### 화면 전환 상태 머신

```ts
type BacklogView =
  | 'welcome' // config 미설정 — WelcomeScreen
  | 'config' // WelcomeScreen에서 "시작하기" 클릭 또는 설정 변경
  | 'loading' // WS 연결 중, backlog:init 수신 전
  | 'list' // 메인 목록 뷰
  | 'board'; // 칸반 보드 뷰
```

### Props

```ts
interface BacklogModalProps {
  teamspaceId: string;
  onClose: () => void;
}
```

### 내부 구조

```tsx
export default function BacklogModal({ teamspaceId, onClose }: BacklogModalProps) {
  const [view, setView] = useState<BacklogView>('loading');
  const { connected } = useBacklogSocket({ teamspaceId, enabled: true });
  const isInitialized = useBacklogStore((s) => s.isInitialized);
  const config = useBacklogStore((s) => s.config);
  const reset = useBacklogStore((s) => s.reset);

  // init 수신 후 화면 결정
  useEffect(() => {
    if (!isInitialized || !config) return;
    const hasAnyEnabled = Object.values(config).some((v) => typeof v === 'boolean' && v === true);
    setView(hasAnyEnabled ? 'list' : 'welcome');
  }, [isInitialized, config]);

  // 모달 닫기 시 스토어 초기화
  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-[900px] max-w-[96vw] max-h-[90vh] flex flex-col overflow-hidden">
        {view === 'loading' && <BacklogLoadingSpinner />}
        {view === 'welcome' && (
          <WelcomeScreen onStart={() => setView('config')} onClose={handleClose} />
        )}
        {view === 'config' && (
          <ConfigModal
            initialConfig={config ?? undefined}
            teamspaceId={teamspaceId}
            onSaved={() => setView('list')}
            onClose={handleClose}
            onBack={() => setView('welcome')}
          />
        )}
        {(view === 'list' || view === 'board') && (
          <BacklogMainView
            view={view}
            onViewChange={setView}
            onConfigOpen={() => setView('config')}
            onClose={handleClose}
            teamspaceId={teamspaceId}
          />
        )}
      </div>
    </div>
  );
}
```

---

## 2. `BacklogMainView` (내부 컴포넌트 또는 분리 파일)

### 헤더 영역

```
[백로그]  ● 2명이 함께 편집 중         [민] [김] [이]    [X]
[전체] [할 일] [진행 중] [완료]  [그룹: 에픽▼]      ≡필터  ↕정렬  ≡목록  ⊞보드   [+ 이슈 추가]
```

#### 헤더 상세

- 제목: `text-xl font-bold text-ink`
- 온라인 편집자: 점(●) + 카운트 (Task 03 메모: 현재 항상 0 — 백엔드 미구현)
  - 임시로 `useTeamspaceStore`의 `onlineMembers`에서 팀스페이스 현재 온라인 인원 표시 검토
- 아바타 스택: `src/components/ui/AvatarStack.tsx` 또는 `OnlineMemberStack.tsx` 재활용
- 닫기: `Button variant="ghost" size="icon"`

#### 탭 (Status 필터)

- `전체`, `할 일(OPEN)`, `진행 중(IN_PROGRESS)`, `완료(DONE)`
- 활성 탭: `bg-primary-light text-primary-dark`, 비활성: `text-ink-muted hover:text-ink`
- `CLOSED` 상태는 별도 탭 없이 전체에서만 노출 (디자인 스크린샷 기준)

#### 그룹 필터 버튼 (에픽 활성 시만 표시)

- `[그룹: 에픽 ▼]` — 클릭 시 드롭다운으로 "에픽별", "없음" 선택
- `config.epicEnabled`가 false이면 숨김

#### 뷰 전환 버튼

- `≡ 목록` / `⊞ 보드` — active 상태 표시

---

## 3. `src/components/backlog/BacklogListView.tsx`

### 레이아웃

```
─── 컬럼 헤더 ─────────────────────────────────────────────
□  상태  제목    담당자  우선순위  마감일  스프린트
────────────────────────────────────────────────────────────
[StoryRow × N]
────────────────────────────────────────────────────────────
총 N개 이슈 · 진행 중 N개 · 할 일 N개 · 완료 N개
```

#### 컬럼 표시 여부 (config 기반)

| 컬럼     | 표시 조건                |
| -------- | ------------------------ |
| 상태     | 항상                     |
| 제목     | 항상                     |
| 담당자   | 항상                     |
| 우선순위 | `config.priorityEnabled` |
| 마감일   | `config.dueDateEnabled`  |
| 스프린트 | `config.sprintEnabled`   |

### 스토리 목록 렌더링

```ts
// 에픽 그룹핑 활성 시
const displayedStories = groupByEpic ? sortStoriesByEpic(filteredStories, epics) : filteredStories;
```

필터링 로직 (로컬 상태 + `stories`에서 파생):

```ts
const filteredStories = useMemo(() => {
  let result = stories;
  if (statusFilter !== 'all') {
    result = result.filter((s) => s.status === statusFilter);
  }
  return result;
}, [stories, statusFilter]);
```

---

## 4. `src/components/backlog/StoryRow.tsx`

### 스토리 행 구성

```
□  [상태뱃지]  [IssueTypeTag]  제목           [아바타]  [우선순위]  [마감일]  [스프린트]  ...
   └── 펼쳐진 경우 → 태스크 목록 (StoryDetailPanel)
```

### Props

```ts
interface StoryRowProps {
  story: StorySummary;
  config: BacklogConfigResponse;
  teamspaceId: string;
  isExpanded: boolean;
  onExpandToggle: () => void;
  onEditClick: () => void;
  onDeleteClick: () => void;
}
```

### 체크박스 (상태 변경)

- 체크 시 `OPEN` ↔ `IN_PROGRESS` 토글이 아닌, 상태 변경 드롭다운 또는 클릭 → `DONE` 처리.
- 디자인에서 체크박스는 "완료 처리"용 → 클릭 시 `updateStoryStatus(storyId, 'DONE')`.
- 이미 `DONE`인 경우 클릭 시 `OPEN`으로 복귀.

### 상태 뱃지 (`StatusBadge`)

```
OPEN       → "할 일"    gray bg
IN_PROGRESS → "진행 중"  blue bg
DONE       → "완료"     green bg
CLOSED     → "종료"     gray bg
```

### `IssueTypeTag`

- `config.feBeEnabled`가 true이고 `issueType`이 있을 때 표시
- 포맷: `formatIssueId(issueType, number, feBeEnabled)` → `FE-001`
- 색상: FE = 파란 계열, BE = 보라 계열

### 에픽 뱃지 (`EpicBadge`)

- 스토리에 에픽이 있으면 제목 옆에 색상 점 + 에픽 이름 표시
- `epics[0]`만 표시 (여러 개 있으면 `+N` 축약)
- `EpicBadge` 컴포넌트: `bg-[color]/20 text-[color] rounded px-2 py-0.5 text-xs`
  - HEX 색상을 Tailwind inline style로: `style={{ backgroundColor: epic.color + '33', color: epic.color }}`

### 펼치기 (`expandedStoryId`)

- 클릭 시 해당 스토리 ID를 `expandedStoryId`로 설정하고 `StoryDetailPanel` 렌더링
- 최초 펼칠 때 `getStoryDetail(teamspaceId, storyId)` 호출, 결과를 `setTasksForStory`에 저장
- 로딩 중 스피너 표시

### `: ...` (더보기 메뉴)

- 클릭 시 드롭다운: "수정", "삭제"
- 삭제 클릭 시 confirm 다이얼로그 후 `deleteStory` 호출

---

## 5. `src/components/backlog/StoryDetailPanel.tsx`

펼쳐진 스토리 행 아래에 렌더링. 태스크 목록과 태스크 추가 기능 포함.  
상세 구현은 [Task 07 — 스토리 폼](task-07-story-form.md)에서 다룸.

---

## 6. 하단 요약 바

```
총 8개 이슈 · 진행 중 2개 · 할 일 4개 · 완료 2개    [↑ GitHub 이슈로 내보내기]
```

- `stories` 배열에서 상태 카운트 파생 (memoized)
- "GitHub 이슈로 내보내기" 버튼: 현재 미구현 (클릭 시 `"준비 중입니다"` toast 표시)

---

## 구현 주의사항

- `StoryRow`에서 드래그앤드롭으로 순서 변경 기능은 이 태스크 범위에서 제외.  
  순서 변경은 Task 07 이후 추가 작업으로 분리 (외부 DnD 라이브러리 필요).
- 컬럼 헤더의 가로 비율은 `grid` 또는 `flex` 사용.  
  `grid` 권장: `grid-cols-[auto_1fr_120px_80px_100px_90px_32px]` (활성 컬럼에 따라 조정).

---

## 작업 로그

| 날짜       | 내용                                                                                          |
| ---------- | --------------------------------------------------------------------------------------------- |
| 2026-05-26 | 작업 시작.                                                                                    |
| 2026-05-26 | `editingStory` 상태 제거 — StoryFormModal 미구현(Task 07)으로 `onEditStory`를 no-op으로 연결. |
| 2026-05-26 | `deleteStory` import StoryRow에서 제거 — 삭제 로직을 BacklogListView로 이동.                  |
| 2026-05-26 | 작업 완료. tsc & eslint 통과.                                                                 |
