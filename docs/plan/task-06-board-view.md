# Task 06 — 보드 뷰 (칸반)

> 상태: ⬜ 미완료  
> 의존성: [Task 05](task-05-list-view.md) (BacklogMainView 공유)

---

## 목표

백로그 보드 뷰 (칸반 스타일)를 구현한다.  
디자인 스크린샷 5번 (보드 뷰)을 기준으로 한다.

---

## UI 구성

```
[할 일  4]  +       [진행 중  2]  +       [완료  2]  +
─────────────       ────────────────       ────────────
[StoryCard]         [StoryCard]            [StoryCard]
[StoryCard]         [StoryCard]            [StoryCard]
[StoryCard]
[StoryCard]

+ 이슈 추가         + 이슈 추가            + 이슈 추가
```

### 컬럼 정의

| 컬럼    | status 값     | 헤더 색상 선                 |
| ------- | ------------- | ---------------------------- |
| 할 일   | `OPEN`        | `border-t-4 border-gray-300` |
| 진행 중 | `IN_PROGRESS` | `border-t-4 border-primary`  |
| 완료    | `DONE`        | `border-t-4 border-green`    |

`CLOSED` 스토리는 별도 컬럼 없이 보드 뷰에서 숨김 (또는 "완료" 컬럼에 포함).

---

## 파일: `src/components/backlog/BacklogBoardView.tsx`

### Props

```ts
interface BacklogBoardViewProps {
  teamspaceId: string;
  config: BacklogConfigResponse;
  onAddStory: (defaultStatus?: StoryStatus) => void;
  onEditStory: (story: StorySummary) => void;
}
```

### 컬럼별 스토리 필터링

```ts
const COLUMNS: { label: string; status: StoryStatus }[] = [
  { label: '할 일', status: 'OPEN' },
  { label: '진행 중', status: 'IN_PROGRESS' },
  { label: '완료', status: 'DONE' },
];

// 컴포넌트 내부
const storiesByStatus = useMemo(() => {
  const map: Record<StoryStatus, StorySummary[]> = {
    OPEN: [],
    IN_PROGRESS: [],
    DONE: [],
    CLOSED: [],
  };
  stories.forEach((s) => map[s.status].push(s));
  return map;
}, [stories]);
```

---

## 파일: `src/components/backlog/StoryCard.tsx`

### 카드 UI 구성 (스크린샷 참조)

```
FE-001                          [높음 뱃지]
기획서 에디터 컴포넌트 개발

[아바타 — 강민석]
```

### Props

```ts
interface StoryCardProps {
  story: StorySummary;
  config: BacklogConfigResponse;
  onEdit: () => void;
  onDelete: () => void;
}
```

### 카드 스타일

```
bg-white rounded-md border border-border shadow-sm p-3 flex flex-col gap-2
hover:shadow-md transition-shadow cursor-pointer
```

### 카드 내 요소

1. **상단 행**: `IssueTypeTag` (FE-001) + 우선순위 뱃지 (우측 정렬)
2. **제목**: `text-sm font-medium text-ink`
3. **에픽 뱃지**: `EpicBadge` (있는 경우)
4. **하단 행**: 아바타 + 미배정 표시

### 우선순위 뱃지 (`PriorityBadge`)

| Priority | 배경색                          | 텍스트 |
| -------- | ------------------------------- | ------ |
| HIGH     | `bg-red-100 text-red-600`       | 높음   |
| MEDIUM   | `bg-orange-100 text-orange-600` | 중간   |
| LOW      | `bg-gray-100 text-gray-500`     | 낮음   |
| URGENT   | `bg-red-200 text-red-700`       | 긴급   |

---

## 드래그앤드롭 (보드 뷰)

**이 태스크에서는 DnD 미구현.** 카드 클릭으로 상태 변경 드롭다운 제공.

향후 DnD 구현 시:

- `@dnd-kit/core` + `@dnd-kit/sortable` 사용 권장 (React 19 호환, 접근성 지원)
- 컬럼 간 드래그 → `updateStoryStatus` 호출
- 동일 컬럼 내 재정렬 → `reorderStories` 호출

현재는 카드 우측 클릭(또는 더보기 버튼)으로 상태 변경 드롭다운 표시:

```
[할 일로 변경]
[진행 중으로 변경]
[완료로 변경]
───────────────
[수정]
[삭제]
```

---

## 컬럼 하단 "이슈 추가" 버튼

```tsx
<button
  className="mt-2 w-full text-ink-muted text-sm hover:text-ink flex items-center gap-1 py-1"
  onClick={() => onAddStory(column.status)}
>
  <MdAdd size={16} /> 이슈 추가
</button>
```

`onAddStory(status)` 호출 시 해당 status가 기본값으로 설정된 스토리 생성 폼 열림.

---

## 구현 주의사항

- 보드 뷰는 스크롤이 컬럼 단위로 발생해야 함.  
  각 컬럼: `flex flex-col overflow-y-auto max-h-[calc(90vh-200px)]`
- 보드 뷰와 목록 뷰는 같은 `stories` 스토어를 공유하므로 별도 데이터 로딩 불필요.

---

## 작업 로그

| 날짜 | 내용 |
| ---- | ---- |
| —    | —    |
