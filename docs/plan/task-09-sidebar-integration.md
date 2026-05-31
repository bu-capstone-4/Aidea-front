# Task 09 — 사이드바 & 라우팅 통합

> 상태: ⬜ 미완료  
> 의존성: [Task 04](task-04-welcome-config-ui.md) — BacklogModal 컴포넌트 존재해야 함

---

## 목표

기존 사이드바에 "백로그" 항목을 추가하고, BacklogModal을 올바르게 열고 닫도록 MainPage를 수정한다.

---

## 변경 파일

### 1. `src/components/main/MainSideBar.tsx`

#### 추가 항목

기존 문서 목록 아래, "추가하기" 버튼 위에 "백로그" 버튼 추가:

```tsx
import { MdList } from 'react-icons/md';

// 문서 목록 아래에 추가
<Button
  variant="ghost"
  size={isSideBarOpen ? 'sm' : 'icon'}
  icon={<MdList size={18} className="shrink-0" />}
  className={cn(
    isSideBarOpen && 'w-full justify-start',
    isBacklogOpen && 'bg-primary-light text-primary-dark'
  )}
  onClick={onBacklogClick}
>
  백로그
</Button>;
```

#### Props 변경

```ts
interface SideBarProps {
  isSideBarOpen: boolean;
  toggleSideBar: () => void;
  isBacklogOpen: boolean; // 추가
  onBacklogClick: () => void; // 추가
}
```

---

### 2. `src/pages/MainPage.tsx`

#### 상태 추가

```ts
const [isBacklogOpen, setIsBacklogOpen] = useState(false);
```

#### 백로그 모달 렌더링

```tsx
return (
  <div className="h-screen flex">
    <MainSideBar
      isSideBarOpen={isSideBarOpen}
      toggleSideBar={() => setIsSideBarOpen((p) => !p)}
      isBacklogOpen={isBacklogOpen}
      onBacklogClick={() => setIsBacklogOpen(true)}
    />
    <div className="flex-1 flex flex-col overflow-hidden">
      <MainHeaderBar />
      <MainContent />
    </div>

    {isBacklogOpen && currentTeamspaceId && (
      <BacklogModal teamspaceId={currentTeamspaceId} onClose={() => setIsBacklogOpen(false)} />
    )}
  </div>
);
```

#### 주의: `currentTeamspaceId` null 처리

백로그 버튼을 클릭했을 때 `currentTeamspaceId`가 아직 null인 경우 (로딩 중).  
이 경우 버튼을 비활성화하거나 클릭 시 toast("팀스페이스 로딩 중...") 표시.

---

### 3. `src/components/main/MainHeaderBar.tsx` (검토)

현재 `MainHeaderBar`에 온라인 멤버 아바타가 있다면, 백로그 열림 여부와 무관하게 유지.  
변경 불필요할 가능성이 높음 — 코드 확인 후 결정.

---

## URL 라우팅 변경 여부

**URL 변경 없음.** 백로그는 상태 기반 오버레이로 구현.  
현재 `/main/:docId` 경로에서 백로그 모달을 오버레이로 띄우는 방식.

**이유:**

- 백로그는 특정 document ID가 아니라 teamspace 단위 기능
- URL에 백로그 상태를 포함하면 새로고침 시 추가 로직 필요 (복잡도 증가)
- 기존 `useTeamspaceSocket` 연결이 `teamspaceId` 기반으로 이미 동작 중

향후 deep link 필요 시: `?backlog=true` 쿼리 파라미터로 확장 가능.

---

## 키보드 접근성

백로그 모달 오버레이 열림 시:

- `Escape` 키 → 모달 닫기
- 포커스 트랩: 모달 내부에 포커스 유지

```ts
// BacklogModal.tsx 내부
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') handleClose();
  };
  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [handleClose]);
```

---

## 작업 로그

| 날짜       | 내용                                                                                                            |
| ---------- | --------------------------------------------------------------------------------------------------------------- |
| 2026-05-26 | 작업 시작.                                                                                                      |
| 2026-05-26 | Task 04 의존성 충돌: 권장 순서(09→04)에 따라 `BacklogModal.tsx` 스텁을 Task 09에서 먼저 생성. Task 04에서 교체. |
| 2026-05-26 | `currentTeamspaceId` null 처리: toast 대신 버튼 `disabled` 처리로 단순화.                                       |
| 2026-05-26 | 작업 완료. 타입 체크 & 린트 통과.                                                                               |
