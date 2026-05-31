# Task 04 — Welcome 화면 & Config 모달 UI

> 상태: ⬜ 미완료  
> 의존성: [Task 01](task-01-types-and-api.md), [Task 02](task-02-store.md), [Task 03](task-03-ws-hook.md)

---

## 목표

백로그 최초 진입 시 표시되는 Welcome 화면과, 백로그 설정 모달을 구현한다.

---

## 화면 전환 흐름

```
백로그 모달 열림
  └─ WS backlog:init 수신
       ├─ config가 모두 false → WelcomeScreen 표시
       │    └─ "시작하기" 클릭 → ConfigModal 표시
       │         └─ "만들기" 클릭 → saveBacklogConfig() → BacklogListView로 이동
       └─ config에 하나라도 true → BacklogListView 즉시 표시
```

---

## 1. `src/components/backlog/WelcomeScreen.tsx`

### UI 구성 (디자인 첫 번째 스크린샷 참조)

```
[X] 닫기 버튼 (우상단)

[아이콘 — 목록 SVG 아이콘, 파란/녹색 구슬]

"백로그로 팀 할 일을 한눈에"  (font-bold, text-xl ~1.25rem)

"팀원별 담당 이슈를 배정하고 진행 상황을
실시간으로 함께 관리해보세요."  (text-ink-muted, text-sm)

[이슈 관리] [담당자 배정] [스프린트] [실시간 협업]  (작은 outlined 뱃지)

[시작하기 버튼 — primary, 전폭]
```

### Props

```ts
interface WelcomeScreenProps {
  onStart: () => void; // ConfigModal로 전환
  onClose: () => void; // 모달 전체 닫기
}
```

### 스타일 참고

- 모달 카드: `bg-white rounded-2xl shadow-2xl p-10 flex flex-col items-center gap-6 w-[480px]`
- 아이콘 컨테이너: `w-20 h-20 rounded-full bg-primary-light flex items-center justify-center`
- 뱃지: `border border-border rounded-sm px-3 py-1 text-xs text-ink-muted`

---

## 2. `src/components/backlog/ConfigModal.tsx`

### UI 구성 (디자인 두 번째 스크린샷 참조)

```
"백로그 설정"  (제목)
"팀에 맞는 백로그 구성을 선택해주세요."  (부제)
[X] 닫기

─── 팀 구성 ───────────────────────────────
[Toggle] 프론트엔드 / 백엔드 구분
         "FE-001, BE-001 형식으로 이슈 ID를 분류합니다"

─── 이슈 유형 ──────────────────────────────
[✓] 태스크  [기본] 개별 작업 단위입니다  (항상 체크, 비활성화)
[□] 에픽        여러 스토리/태스크를 묶는 큰 단위입니다
[□] 스토리      사용자 관점의 기능 단위입니다

─── 추가 필드 ──────────────────────────────
[Toggle] 우선순위   높음 / 낮음으로 이슈 중요도를 설정합니다
[Toggle] 스프린트   이슈를 스프린트 단위로 묶어 관리합니다
[Toggle] 마감일     각 이슈에 마감일을 설정합니다

         [취소]  [만들기 →]
```

### 로컬 상태

```ts
const [settings, setSettings] = useState({
  feBeEnabled: false,
  epicEnabled: false,
  storyEnabled: false,
  priorityEnabled: false,
  sprintEnabled: false,
  dueDateEnabled: false,
});
```

### Props

```ts
interface ConfigModalProps {
  initialConfig?: BacklogConfigResponse; // 재설정 시 기존 값으로 초기화
  teamspaceId: string;
  onSaved: () => void; // 저장 성공 후 BacklogListView로 전환
  onClose: () => void;
  onBack?: () => void; // WelcomeScreen으로 돌아가기 (선택적)
}
```

### 저장 흐름

```ts
const handleSave = async () => {
  setLoading(true);
  try {
    const config = await saveBacklogConfig(teamspaceId, settings);
    applyConfigUpdated(config); // 스토어 직접 업데이트 (내가 직접 변경한 경우)
    onSaved();
  } finally {
    setLoading(false);
  }
};
```

### 주의사항

- "태스크" 체크박스는 항상 checked + disabled (설명 텍스트 하단에 표시).
- "에픽" 체크를 해제해도 나중에 에픽을 추가할 수 있음 (단순히 AI 초안 참고용 설정).
- "AI로 만들기" → 백엔드 미구현으로 "만들기"로 표시. 클릭 시 AI 로딩 화면 스킵.
- 기존 설정이 있는 경우(`initialConfig` 제공) 이 모달을 설정 수정용으로 재사용 가능.

---

## Toggle 컴포넌트

`src/components/ui/Toggle.tsx`를 새로 만들거나 Tailwind CSS로 인라인 구현.  
기존 프로젝트에 Toggle 컴포넌트가 없으므로 Tailwind로 직접 구현:

```tsx
function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        'w-10 h-6 rounded-full transition-colors shrink-0',
        checked ? 'bg-primary' : 'bg-border',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <span
        className={cn(
          'block w-4 h-4 rounded-full bg-white shadow transition-transform mx-1',
          checked ? 'translate-x-4' : 'translate-x-0'
        )}
      />
    </button>
  );
}
```

이 컴포넌트는 `ConfigModal.tsx` 내부에 두거나 `src/components/ui/Toggle.tsx`로 분리한다.  
분리 권장 (보드 뷰나 필터 바에서 재사용될 수 있음).

---

## 작업 로그

| 날짜       | 내용                                                                                                                                                                |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-05-26 | 작업 시작.                                                                                                                                                          |
| 2026-05-26 | BacklogModal 화면 전환: useEffect 내 setState 대신 스토어 상태에서 직접 파생(storeScreen 변수)하는 방식으로 변경. ESLint react-hooks/set-state-in-effect 규칙 대응. |
| 2026-05-26 | 작업 완료. Toggle.tsx, WelcomeScreen.tsx, ConfigModal.tsx, BacklogModal.tsx(교체) 구현. tsc & eslint 통과.                                                          |
