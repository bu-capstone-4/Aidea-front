# Task 07 — 스토리 생성/수정 폼 & 태스크 목록

> 상태: ⬜ 미완료  
> 의존성: [Task 01](task-01-types-and-api.md), [Task 02](task-02-store.md), [Task 05](task-05-list-view.md)

---

## 목표

스토리를 생성/수정하는 폼 모달과, 스토리 상세 패널 내 태스크 목록 UI를 구현한다.

---

## 1. `src/components/backlog/StoryFormModal.tsx`

### UI 구성

```
"이슈 추가" or "이슈 수정"   [X]
──────────────────────────────────────
제목 *          [___________________]
상태            [할 일 ▼]
에픽            [에픽 선택 ▼]  (epicEnabled 시)
이슈 유형       [FE ▼] [BE ▼]   (feBeEnabled 시)
우선순위        [낮음/중간/높음/긴급 ▼]  (priorityEnabled 시)
담당자          [멤버 선택 ▼]
스프린트        [Sprint 1 ___]    (sprintEnabled 시)
마감일          [YYYY-MM-DD ___]  (dueDateEnabled 시)
본문            [Markdown textarea (선택)]

                     [취소]  [저장]
```

### Props

```ts
interface StoryFormModalProps {
  mode: 'create' | 'edit';
  initialData?: Partial<CreateStoryRequest> & { id?: number };
  defaultStatus?: StoryStatus; // 보드 뷰 컬럼에서 생성 시 초기값
  teamspaceId: string;
  config: BacklogConfigResponse;
  epics: EpicResponse[];
  members: MemberInfo[]; // 담당자 선택용 팀스페이스 멤버 목록
  onSaved: (story: StoryDetail) => void;
  onClose: () => void;
}
```

### 폼 상태

```ts
const [form, setForm] = useState<CreateStoryRequest>({
  title: initialData?.title ?? '',
  body: initialData?.body ?? '',
  status: initialData?.status ?? defaultStatus ?? 'OPEN',
  priority: initialData?.priority ?? null,
  issueType: initialData?.issueType ?? null,
  sprint: initialData?.sprint ?? null,
  epicIds: initialData?.epicIds ?? [],
  assigneeId: initialData?.assigneeId ?? null,
  dueDate: initialData?.dueDate ?? null,
});
```

> `status` 필드는 스펙상 `CreateStoryRequest`에 없으나, 생성 후 `updateStoryStatus`를 별도 호출하는 대신 생성 시 기본 상태 지정이 불가함. 보드 뷰에서 컬럼별 생성은 UX상 해당 상태로 시작되어야 하므로, 생성 완료 후 status가 `OPEN`이 아닌 경우 `updateStoryStatus` 추가 호출 필요. 이 동작을 [백엔드 제안 사항](backend-proposal.md)에 기록.

### 저장 흐름

```ts
const handleSave = async () => {
  if (!form.title.trim()) {
    // 제목 validation
    return;
  }
  setLoading(true);
  try {
    if (mode === 'create') {
      const story = await createStory(teamspaceId, form);
      applyStoryCreated(toStorySummary(story)); // StoryDetail → StorySummary 변환
      // 기본 status와 다른 경우 추가 상태 변경 호출
      if (form.status && form.status !== 'OPEN') {
        const statusRes = await updateStoryStatus(teamspaceId, story.id, form.status);
        applyStoryStatusChanged(story.id, statusRes.status, statusRes.closedAt);
      }
      onSaved(story);
    } else {
      const story = await updateStory(teamspaceId, initialData!.id!, form);
      applyStoryUpdated(toStorySummary(story));
      onSaved(story);
    }
  } finally {
    setLoading(false);
  }
};
```

### 멤버 목록 조달

`StoryFormModal`은 `members: MemberInfo[]`를 prop으로 받는다.  
부모(`BacklogMainView`)에서 `useTeamspaceDetail`이나 팀스페이스 API에서 이미 로드한 멤버 목록 전달.

---

## 2. `src/components/backlog/StoryDetailPanel.tsx`

목록 뷰에서 스토리 행 펼치면 표시되는 패널. 태스크 목록과 새 태스크 추가 인라인 입력.

### UI 구성

```
  [태스크 목록]
  ──────────────────────────────────
  □ [FE]  GitHub App 등록       [아바타]  ...
  □ [BE]  OAuth 콜백 처리       [미배정]  ...
  ──────────────────────────────────
  + 태스크 추가   [___________________]  [Enter: 저장]
```

### 태스크 로딩

```ts
useEffect(() => {
  const cached = tasksByStoryId[story.id];
  if (cached) return; // 이미 캐시됨
  getStoryDetail(teamspaceId, story.id)
    .then((detail) => setTasksForStory(story.id, detail.tasks))
    .catch(() => {});
}, [story.id]);
```

### 태스크 행 (`TaskRow`)

```tsx
// inline 컴포넌트 또는 src/components/backlog/TaskList.tsx 내부
<div className="flex items-center gap-2 px-4 py-1.5 hover:bg-surface rounded">
  <input type="checkbox" checked={task.isCompleted} onChange={() => handleToggleTask(task.id)} />
  {config.feBeEnabled && task.issueType && <IssueTypeTag type={task.issueType} />}
  <span className={cn('text-sm', task.isCompleted && 'line-through text-ink-muted')}>
    {task.title}
  </span>
  <div className="ml-auto flex items-center gap-1">
    {task.assignee && <UserAvatar name={task.assignee.name} size="sm" />}
    <MoreMenu onEdit={() => handleEditTask(task)} onDelete={() => handleDeleteTask(task.id)} />
  </div>
</div>
```

### 인라인 태스크 추가

```tsx
const [newTaskTitle, setNewTaskTitle] = useState('');

const handleAddTask = async () => {
  if (!newTaskTitle.trim()) return;
  const task = await createTask(teamspaceId, story.id, { title: newTaskTitle });
  applyTaskCreated(story.id, task);
  setNewTaskTitle('');
};

// Enter 키로 저장
<input
  value={newTaskTitle}
  onChange={(e) => setNewTaskTitle(e.target.value)}
  onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
  placeholder="태스크 추가..."
  className="text-sm flex-1 outline-none border-b border-border focus:border-primary"
/>;
```

---

## 3. `src/hooks/useStoryApi.ts` (옵션)

스토리 CRUD 작업을 묶는 훅. `backlogStore` 액션 호출 포함.

```ts
export function useStoryApi(teamspaceId: string) {
  const { applyStoryCreated, applyStoryUpdated, ... } = useBacklogStore();

  const handleCreate = async (data: CreateStoryRequest) => {
    const story = await createStory(teamspaceId, data);
    applyStoryCreated(toStorySummary(story));
    return story;
  };

  const handleUpdate = async (id: number, data: CreateStoryRequest) => {
    const story = await updateStory(teamspaceId, id, data);
    applyStoryUpdated(toStorySummary(story));
    return story;
  };

  const handleDelete = async (id: number) => {
    await deleteStory(teamspaceId, id);
    applyStoryDeleted(id);
  };

  return { handleCreate, handleUpdate, handleDelete };
}
```

비슷하게 `useTaskApi.ts`도 구현.

---

## 유틸: `toStorySummary`

`StoryDetail → StorySummary` 변환 함수 (`src/utils/backlog.ts`에 위치):

```ts
export function toStorySummary(detail: StoryDetail): StorySummary {
  const { body, closedAt, tasks, ...summary } = detail;
  return summary;
}
```

---

## 구현 주의사항

- `dueDate` 입력 필드: HTML `<input type="date">` 사용. 값은 `YYYY-MM-DD` 형식.
- 에픽 다중 선택: `epicIds`가 배열이므로 multi-select 드롭다운 필요.  
  간단 구현: 체크박스 목록 팝오버.
- `body` (Markdown): 간단한 `<textarea>`로 구현. BlockNote 에디터는 미사용 (오버스펙).
- 태스크 순서 변경(DnD)는 이 태스크 범위에서 제외.

---

## 작업 로그

| 날짜       | 내용                                                                                                     |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| 2026-05-26 | 작업 시작.                                                                                               |
| 2026-05-26 | MoreMenu 미존재 → 태스크 행 수정/삭제 인라인 버튼으로 대체. 태스크 수정 인라인 input 전환 방식으로 구현. |
| 2026-05-26 | BacklogMainView 내부에서 useStoryApi 직접 호출 (onAddStory/onEditStory props 드릴링 제거).               |
| 2026-05-26 | eslint no-unused-vars 오류 수정 (toStorySummary destructuring). tsc & eslint 통과. 작업 완료.            |
