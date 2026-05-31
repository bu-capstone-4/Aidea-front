# Task 08 — 에픽 관리

> 상태: ⬜ 미완료  
> 의존성: [Task 01](task-01-types-and-api.md), [Task 02](task-02-store.md), [Task 05](task-05-list-view.md)

---

## 목표

에픽을 생성, 수정, 삭제하는 UI를 구현한다.  
에픽은 백로그 메인 화면의 필터 바 또는 설정 진입점에서 관리한다.

---

## 에픽 관리 진입점

1. **목록 뷰 필터 바** — "그룹: 에픽 ▼" 버튼 옆에 "에픽 관리" 버튼 (설정 아이콘)
2. **스토리 폼** — 에픽 선택 드롭다운 내 "에픽 추가 +" 버튼

두 진입점 모두 `EpicManagerModal`을 열어 처리.

---

## 파일: `src/components/backlog/EpicManagerModal.tsx`

### UI 구성

```
"에픽 관리"                [X]
──────────────────────────────
[+ 에픽 추가]

[●] 인증        #6366f1   [수정] [삭제]
[●] 에디터 개발  #f97316   [수정] [삭제]
──────────────────────────────
                           [닫기]
```

### Props

```ts
interface EpicManagerModalProps {
  teamspaceId: string;
  epics: EpicResponse[];
  onClose: () => void;
}
```

### 에픽 색상 선택기

색상 팔레트: 사전 정의된 HEX 색상 12개 중 선택.  
커스텀 HEX 입력 옵션 제공 (선택적).

```ts
const EPIC_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#3b82f6', // blue
  '#06b6d4', // cyan
  '#78716c', // stone
  '#6b7280', // gray
];
```

### 에픽 생성/수정 인라인 폼

에픽 추가 버튼 클릭 시 같은 모달 내 인라인 폼 표시:

```
이름: [___________]    색상: [● ● ● ●...]    설명: [___] (선택)
                                              [취소] [저장]
```

### 저장 흐름

```ts
// 생성
const handleCreate = async () => {
  const epic = await createEpic(teamspaceId, { name, color, description });
  applyEpicCreated(epic);
  resetForm();
};

// 수정
const handleUpdate = async (epicId: number) => {
  const epic = await updateEpic(teamspaceId, epicId, { name, color, description });
  applyEpicUpdated(epic);
  setEditingId(null);
};

// 삭제
const handleDelete = async (epicId: number) => {
  if (!confirm('이 에픽을 삭제하면 연결된 스토리에서 에픽이 제거됩니다. 삭제할까요?')) return;
  await deleteEpic(teamspaceId, epicId);
  applyEpicDeleted(epicId); // 스토어에서 에픽 + 스토리의 epics 배열 동시 업데이트
};
```

### 에픽 색상 프리뷰 (`EpicBadge`)

```tsx
// src/components/backlog/EpicBadge.tsx
export function EpicBadge({ epic }: { epic: EpicSummary }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: epic.color + '22', color: epic.color }}
    >
      <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: epic.color }} />
      {epic.name}
    </span>
  );
}
```

---

## 에픽 없이 생성된 스토리 ("미분류")

`stories` 중 `epics` 배열이 비어있는 스토리는 에픽 그룹핑 시 "미분류" 구획으로 정렬 마지막에 배치.  
별도 헤더 없이 에픽 뱃지 미표시 상태로 렌더링.

---

## `config.epicEnabled` 비활성 상태에서의 에픽

- `epicEnabled: false` → 에픽 생성 API가 차단됨 (400 BACKLOG_CONFIG_FIELD_NOT_ALLOWED)
- UI에서는 에픽 관리 버튼을 숨기거나 비활성화
- 단, 이미 에픽이 있는 경우 수정/삭제는 가능 (API는 epicEnabled 무관하게 PUT/DELETE 허용)  
  → 확인 필요 ([백엔드 제안 사항](backend-proposal.md) 검토)

---

## 작업 로그

| 날짜       | 내용                                                                                                                         |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 2026-05-26 | 작업 시작. EpicManagerModal.tsx 신규 생성, BacklogModal.tsx / StoryFormModal.tsx 수정.                                       |
| 2026-05-26 | EpicBadge.tsx는 `epics: EpicSummary[]` 인터페이스로 이미 구현되어 있어 스펙 단일 epic 서명 대신 기존 구현 유지.              |
| 2026-05-26 | StoryFormModal에 `onManageEpics` 선택적 prop 추가. EpicManagerModal z-[70]으로 StoryFormModal(z-[60]) 위에 스택 렌더링 가능. |
| 2026-05-26 | 작업 완료. tsc & eslint 오류 없음.                                                                                           |
