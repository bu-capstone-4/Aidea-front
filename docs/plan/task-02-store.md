# Task 02 — Zustand 백로그 스토어

> 상태: ⬜ 미완료  
> 의존성: [Task 01 — 타입 정의](task-01-types-and-api.md)

---

## 목표

백로그 기능 전체 상태를 관리하는 Zustand 스토어를 구현한다.  
기존 `authStore`, `teamspaceStore`, `FeedbackStore` 패턴을 따른다.

---

## 파일: `src/store/backlogStore.ts`

### 상태 구조

```ts
interface BacklogState {
  // 초기화 여부
  isInitialized: boolean;

  // 백로그 설정 (null = 아직 수신 전)
  config: BacklogConfigResponse | null;

  // 에픽 목록 (position 없음, id 순 또는 생성일 순)
  epics: EpicResponse[];

  // 스토리 목록 (position 기준 정렬 유지)
  stories: StorySummary[];

  // 태스크 캐시 (storyId → tasks). getStoryDetail 호출 후 채워짐
  tasksByStoryId: Record<number, TaskResponse[]>;

  // 현재 펼쳐진 스토리 ID (목록 뷰에서 상세 보기용)
  expandedStoryId: number | null;
}
```

### 액션 구조

```ts
interface BacklogActions {
  // ─── 초기화 / 리셋 ───────────────────────────────────
  applyInit: (
    config: BacklogConfigResponse,
    epics: EpicResponse[],
    stories: StorySummary[]
  ) => void;
  reset: () => void;

  // ─── Config ──────────────────────────────────────────
  // WS 브로드캐스트 또는 직접 PUT 후 호출
  applyConfigUpdated: (config: BacklogConfigResponse) => void;

  // ─── Epic ────────────────────────────────────────────
  applyEpicCreated: (epic: EpicResponse) => void;
  applyEpicUpdated: (epic: EpicResponse) => void;
  applyEpicDeleted: (epicId: number) => void;

  // ─── Story ───────────────────────────────────────────
  applyStoryCreated: (story: StorySummary) => void;
  applyStoryUpdated: (story: StorySummary) => void;
  applyStoryStatusChanged: (storyId: number, status: StoryStatus, closedAt: string | null) => void;
  applyStoryReordered: (orderedIds: number[]) => void;
  applyStoryDeleted: (storyId: number) => void;

  // ─── Task (캐시된 경우에만 업데이트) ─────────────────
  setTasksForStory: (storyId: number, tasks: TaskResponse[]) => void;
  applyTaskCreated: (storyId: number, task: TaskResponse) => void;
  applyTaskUpdated: (storyId: number, task: TaskResponse) => void;
  applyTaskCompleted: (storyId: number, taskId: number, isCompleted: boolean) => void;
  applyTaskReordered: (storyId: number, orderedIds: number[]) => void;
  applyTaskDeleted: (storyId: number, taskId: number) => void;

  // ─── UI 상태 ─────────────────────────────────────────
  setExpandedStoryId: (id: number | null) => void;
}
```

### 핵심 구현 로직

#### `applyStoryReordered`

`orderedIds` 배열의 인덱스 순서대로 `stories`를 재배열.

```ts
applyStoryReordered: (orderedIds) => set((state) => {
  const map = new Map(state.stories.map((s) => [s.id, s]));
  const reordered = orderedIds.flatMap((id) => {
    const s = map.get(id);
    return s ? [s] : [];
  });
  return { stories: reordered };
}),
```

#### `applyEpicDeleted`

에픽 삭제 시 각 스토리의 `epics` 배열에서도 제거.

```ts
applyEpicDeleted: (epicId) => set((state) => ({
  epics: state.epics.filter((e) => e.id !== epicId),
  stories: state.stories.map((s) => ({
    ...s,
    epics: s.epics.filter((e) => e.id !== epicId),
  })),
})),
```

#### `applyTaskCompleted`

태스크 캐시 업데이트 + 부모 스토리의 `completedTaskCount` 동기화.

```ts
applyTaskCompleted: (storyId, taskId, isCompleted) => set((state) => {
  const tasks = state.tasksByStoryId[storyId];
  const updatedTasks = tasks
    ? tasks.map((t) => (t.id === taskId ? { ...t, isCompleted } : t))
    : undefined;

  const completedTaskCount = updatedTasks
    ? updatedTasks.filter((t) => t.isCompleted).length
    : null;

  return {
    tasksByStoryId: updatedTasks
      ? { ...state.tasksByStoryId, [storyId]: updatedTasks }
      : state.tasksByStoryId,
    stories: completedTaskCount !== null
      ? state.stories.map((s) =>
          s.id === storyId ? { ...s, completedTaskCount } : s
        )
      : state.stories,
  };
}),
```

#### `applyTaskReordered`

```ts
applyTaskReordered: (storyId, orderedIds) => set((state) => {
  const tasks = state.tasksByStoryId[storyId];
  if (!tasks) return state;
  const map = new Map(tasks.map((t) => [t.id, t]));
  const reordered = orderedIds.flatMap((id) => {
    const t = map.get(id);
    return t ? [t] : [];
  });
  return { tasksByStoryId: { ...state.tasksByStoryId, [storyId]: reordered } };
}),
```

---

## 관련 유틸: 에픽 정렬/그룹 헬퍼

스토어 외부 (컴포넌트 또는 selector 함수) 에서 에픽 그룹핑 정렬:

```ts
// 에픽 그룹핑 활성 시 story를 epics[0].id 기준으로 정렬.
// 에픽 없는 스토리는 마지막에 배치.
export function sortStoriesByEpic(stories: StorySummary[], epics: EpicResponse[]): StorySummary[] {
  const epicOrder = new Map(epics.map((e, i) => [e.id, i]));
  return [...stories].sort((a, b) => {
    const ai = a.epics[0] ? (epicOrder.get(a.epics[0].id) ?? Infinity) : Infinity;
    const bi = b.epics[0] ? (epicOrder.get(b.epics[0].id) ?? Infinity) : Infinity;
    if (ai !== bi) return ai - bi;
    return a.position - b.position;
  });
}
```

이 함수는 `src/utils/backlog.ts`에 위치시킨다.

---

## 구현 주의사항

- `tasksByStoryId`는 스토리 상세 조회 후에만 채워짐. 없는 경우(`undefined`) 처리 필요.
- 스토어 `reset()`은 백로그 모달을 닫을 때 호출하여 메모리 회수.  
  단, 다시 열 때 WS 재연결로 `applyInit`이 다시 채워주므로 안전.
- `stories` 배열은 `position` 기준 정렬을 유지하지 않아도 됨 — `backlog:init` 시 서버가 정렬해서 보냄. 이후 `applyStoryReordered`가 순서를 유지.
- `applyStoryCreated` 시 새 스토리는 배열 끝에 추가 (서버가 마지막 position 부여).

---

## 작업 로그

| 날짜       | 내용                                                                                                                                 |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-05-26 | 작업 시작 및 완료. `src/store/backlogStore.ts` 생성. `applyTaskDeleted` 시 `taskCount` 동기화 로직 추가 (스펙에 없으나 일관성 유지). |
