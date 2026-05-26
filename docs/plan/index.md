# 백로그 기능 프론트엔드 구현 계획 — 마스터 인덱스

> 기반 문서: [backlog-frontend-spec.md](../backlog-frontend-spec.md)  
> 마지막 업데이트: 2026-05-26 (작업 진행 절차 섹션 추가)

---

## 전체 구조 개요

```
사용자가 사이드바에서 "백로그" 클릭
  │
  ├─ 최초 진입 (config 미설정)
  │    └─ WelcomeScreen → ConfigModal → BacklogMainModal
  │
  └─ 재진입 (config 설정됨)
       └─ BacklogMainModal (WebSocket 연결 후 backlog:init으로 초기 데이터 로드)
```

### 데이터 흐름

```
WebSocket /ws/backlog/{teamspaceId}
  └─ backlog:init  →  backlogStore (config, epics, stories 초기화)
  └─ 브로드캐스트 이벤트  →  backlogStore 점진 업데이트

REST API (직접 수행한 작업)
  └─ 응답 수신  →  backlogStore 즉시 업데이트 (WS 이벤트는 다른 유저에게만 전송됨)
```

### 상태 관리 전략

- **Zustand** (`backlogStore`) — config, epics, stories 목록, 스토리별 tasks
- REST는 직접 `apiClient` 호출 (기존 패턴 유지, TanStack Query 미사용)
- WS 이벤트 → 스토어 액션 직접 호출
- 낙관적 업데이트 없음 — REST 응답 후 스토어 반영 (단순성 우선)

---

## 작업 목록

| #   | 작업                                                          | 파일                                                                             | 상태         |
| --- | ------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------ |
| 01  | [타입 정의 및 API 레이어](task-01-types-and-api.md)           | `src/types/backlog.ts`, `src/api/backlog.ts`                                     | ✅ 완료      |
| 02  | [Zustand 백로그 스토어](task-02-store.md)                     | `src/store/backlogStore.ts`                                                      | ✅ 완료      |
| 03  | [WebSocket 훅](task-03-ws-hook.md)                            | `src/hooks/useBacklogSocket.ts`                                                  | ✅ 완료      |
| 04  | [Welcome 화면 & Config 모달 UI](task-04-welcome-config-ui.md) | `src/components/backlog/WelcomeScreen.tsx`, `ConfigModal.tsx`                    | ✅ 완료      |
| 05  | [백로그 메인 모달 (목록 뷰)](task-05-list-view.md)            | `src/components/backlog/BacklogModal.tsx`, `BacklogListView.tsx`, `StoryRow.tsx` | ⬜ 미완료    |
| 06  | [보드 뷰 (칸반)](task-06-board-view.md)                       | `src/components/backlog/BacklogBoardView.tsx`, `StoryCard.tsx`                   | ⬜ 미완료    |
| 07  | [스토리 생성/수정 폼](task-07-story-form.md)                  | `src/components/backlog/StoryFormModal.tsx`, `TaskList.tsx`                      | ⬜ 미완료    |
| 08  | [에픽 관리](task-08-epic-management.md)                       | `src/components/backlog/EpicManagerModal.tsx`                                    | ⬜ 미완료    |
| 09  | [사이드바 & 라우팅 통합](task-09-sidebar-integration.md)      | `MainSideBar.tsx`, `MainPage.tsx`, `MainContent.tsx`                             | ✅ 완료      |
| BE  | [백엔드 제안 사항](backend-proposal.md)                       | —                                                                                | 📋 검토 필요 |

**권장 구현 순서**: 01 → 02 → 03 → 09 → 04 → 05 → 06 → 07 → 08

---

## 작업 진행 절차

각 작업을 시작하기 전 **반드시** 아래 절차를 따른다.

### 0단계 — 문서 & 코드 읽기 (구현 전 필수)

1. `docs/plan/index.md`(이 파일)를 읽어 전체 작업 현황을 파악한다.
2. 다음으로 진행할 태스크 파일(`task-NN-*.md`)을 읽는다.
3. 태스크 파일에 명시된 **변경 파일**을 모두 읽어 기존 코드 패턴을 파악한다.

### 1단계 — TodoWrite 설정

문서와 코드를 모두 읽은 뒤, **구현을 시작하기 전에** 반드시 `TodoWrite`로 작업 목록을 설정한다.

목록은 아래 구조를 따른다:

```
[ 구현 항목들 ... ]
타입 체크 & 린트 실행
작업 로그 업데이트
커밋 메시지 추천
```

> 마지막 세 항목(타입 체크 & 린트 실행 / 작업 로그 업데이트 / 커밋 메시지 추천)은 **모든 작업에 고정**으로 포함한다.

### 2단계 — 계획 수립 (구현 전)

TodoWrite 설정 후, 구현을 시작하기 전에 다음 항목을 포함한 계획을 사용자에게 제시한다:

1. **작업 범위**: 생성/수정할 파일 목록과 각 파일에서 할 일
2. **의존성 확인**: 선행 작업 완료 여부, 참조할 기존 코드 패턴
3. **설계 결정**: 스펙과 다르게 구현할 부분이 있으면 이유와 함께 명시
4. **구현 순서**: 파일 단위 작업 순서

계획을 사용자가 확인한 뒤 구현을 시작한다.

### 3단계 — 구현

계획대로 구현한다. 각 파일 완료 시 즉시 해당 Todo를 `completed`로 표시한다.  
스펙과 달라지는 부분이 생기면 즉시 사용자에게 알리고 작업 로그에 기록한다.

### 4단계 — 린트 & 타입 체크

구현 완료 후 반드시 아래 명령어를 실행하고 오류가 없어야 다음 단계로 넘어간다.

```bash
npx tsc --noEmit   # 타입 체크
npx eslint src     # 린트 (프로젝트 eslint 설정 기준)
```

오류가 있으면 수정 후 재실행한다. 완료 시 Todo를 `completed`로 표시한다.

### 5단계 — 작업 로그 업데이트

린트·타입 체크 통과 후 해당 태스크 파일 하단의 **작업 로그 섹션**과 `index.md`의 상태 표를 업데이트한다.  
완료 시 Todo를 `completed`로 표시한다.

### 6단계 — 커밋 메시지 추천

아래 [커밋 메시지 규칙](#커밋-메시지-규칙)에 따라 커밋 메시지를 사용자에게 추천한다.  
완료 시 Todo를 `completed`로 표시한다.

---

## 작업 로그

작업 진행 중 발생하는 특이사항, 결정 사항, 막힌 부분은 아래 로그 파일에 기록한다.

- [구현 로그](impl-logs/implementation-log.md)

---

## 작업 로그 작성 지침

각 작업 계획 문서 하단에는 **작업 로그 섹션**을 유지한다. 작업 시작/완료 시 반드시 기록한다.

```markdown
## 작업 로그

| 날짜       | 내용                         |
| ---------- | ---------------------------- |
| YYYY-MM-DD | 작업 시작. [특이사항]        |
| YYYY-MM-DD | [결정한 내용 또는 변경 사항] |
| YYYY-MM-DD | 작업 완료.                   |
```

**기록해야 할 항목:**

- 구현 중 스펙과 달라진 부분
- 기존 코드와 충돌한 부분 및 해결책
- 성능 고려로 인한 설계 변경
- 백엔드 제안 사항이 추가로 발생한 경우

---

## 커밋 메시지 규칙

작업 완료 시 아래 규칙에 따라 커밋 메시지를 작성(또는 AI에게 추천 요청)한다.

### Commit Type

- `feature`: 기능 추가
- `refactor`: 기능 변경없이 개선
- `fix`: 느긋한 버그 수정
- `hotfix`: 급한 버그 수정
- `chore`: 환경 설정 (문서 추가, 파일 위치 변경 등)
- `style`: 스타일 관련 작업 (CSS, 코드 포맷팅 등)
- `remove`: 파일 & 폴더 제거 단순 작업

### Commit 양식

```
{type}: commit명

- ...
- ...
```

### 작업별 커밋 메시지 예시

| #   | 커밋 메시지                                                     |
| --- | --------------------------------------------------------------- |
| 01  | `feature: 백로그 타입 정의, API 레이어, Zustand 스토어 구현` ✅ |
| 02  | (01과 함께 커밋) ✅                                             |
| 03  | `feature: 백로그 WebSocket 훅 구현`                             |
| 04  | `feature: 백로그 Welcome 화면 및 Config 모달 UI 구현`           |
| 05  | `feature: 백로그 메인 모달 및 목록 뷰 구현`                     |
| 06  | `feature: 백로그 보드 뷰(칸반) 구현`                            |
| 07  | `feature: 스토리 생성/수정 폼 구현`                             |
| 08  | `feature: 에픽 관리 모달 구현`                                  |
| 09  | `feature: 사이드바 및 라우팅 백로그 통합`                       |

---

## 핵심 설계 결정 사항

### 1. 백로그 진입 방식

사이드바에 "백로그" 항목 추가. 클릭 시 `MainPage` 수준의 오버레이 모달 렌더링.  
URL 라우팅 변경 없음 — 기존 `/main/:docId` 라우트 유지, 백로그는 상태 기반 오버레이.

### 2. Config 최초 설정 여부 판단

`backlog:init` 이벤트 수신 시 모든 config 필드가 `false`이면 "최초 진입"으로 판단하여 Welcome 화면 표시.

### 3. 에픽 그룹핑 방식

에픽 토글(아코디언) 없음. 에픽 뱃지를 각 스토리에 부착 + "그룹: 에픽" 활성 시 에픽별로 정렬하여 표시.  
스토리에 여러 에픽이 붙을 수 있으므로 그룹핑 기준은 `epics[0].id` 사용.

### 4. Tasks 로딩 전략

`backlog:init`에는 태스크 목록이 포함되지 않음. 스토리 행 클릭(펼치기) 시 `GET /stories/{id}` 호출하여 태스크 로드.  
한 번 로드된 태스크는 `backlogStore.tasksByStoryId`에 캐싱. WS 이벤트로 incremental 업데이트.

### 5. 실시간 편집자 표시

백로그 WS 스펙에 "온라인 멤버" 이벤트 없음. [백엔드 제안 사항](backend-proposal.md) 참조.  
임시로 WS 연결 수 카운팅 대신 UI에서 현재 연결된 팀스페이스 온라인 멤버 수 재활용 검토.

### 6. AI 초안 생성

백엔드 미구현. "AI로 만들기" 버튼 클릭 시 설정만 저장하고 빈 백로그 화면으로 이동.  
버튼 라벨을 "만들기"로 변경하고 AI 로딩 화면 스킵. (향후 AI 기능 구현 시 복구)

### 7. `UserResponse` 타입 충돌

기존 `src/types/api.ts`의 `UserResponse`와 백로그 스펙의 사용자 객체 필드 구조가 다름.  
백로그 전용 타입 `BacklogUser`를 `src/types/backlog.ts`에 별도 정의. [백엔드 제안 사항](backend-proposal.md) 참조.

---

## 새로 생성하는 파일 목록

```
src/
  types/
    backlog.ts               # 백로그 전용 TypeScript 타입
  api/
    backlog.ts               # REST API 함수 모음
  store/
    backlogStore.ts          # Zustand 스토어
  hooks/
    useBacklogSocket.ts      # WebSocket 훅
    useEpicApi.ts            # 에픽 CRUD 훅
    useStoryApi.ts           # 스토리 CRUD 훅
    useTaskApi.ts            # 태스크 CRUD 훅
  components/
    backlog/
      BacklogModal.tsx        # 최상위 모달 컨테이너 (WS 연결 + 화면 전환 관리)
      WelcomeScreen.tsx       # 최초 진입 안내 화면
      ConfigModal.tsx         # 백로그 설정 모달
      BacklogListView.tsx     # 목록 뷰
      BacklogBoardView.tsx    # 보드 뷰 (칸반)
      StoryRow.tsx            # 목록 뷰 스토리 행
      StoryCard.tsx           # 보드 뷰 스토리 카드
      StoryFormModal.tsx      # 스토리 생성/수정 폼
      StoryDetailPanel.tsx    # 스토리 상세 (태스크 목록 포함)
      TaskList.tsx            # 태스크 목록 (StoryDetailPanel 내부)
      EpicBadge.tsx           # 에픽 라벨 뱃지
      PriorityBadge.tsx       # 우선순위 뱃지
      StatusBadge.tsx         # 상태 뱃지
      IssueTypeTag.tsx        # FE/BE 태그
      EpicManagerModal.tsx    # 에픽 생성/수정/삭제 관리
      BacklogFilterBar.tsx    # 필터 + 정렬 + 뷰 전환 툴바
```

---

## 수정하는 기존 파일

| 파일                                      | 변경 내용                                                  |
| ----------------------------------------- | ---------------------------------------------------------- |
| `src/types/document.ts`                   | `DocumentType`에 `'BACKLOG'` 추가 (사이드바 아이콘 매핑용) |
| `src/components/CreateTeamSpace/types.ts` | `DOC_OPTIONS`에 백로그 엔트리 추가 여부 검토               |
| `src/components/main/MainSideBar.tsx`     | 사이드바 하단에 "백로그" 항목 추가                         |
| `src/pages/MainPage.tsx`                  | 백로그 모달 오버레이 상태 관리 추가                        |
| `src/shared/socketErrorHandler.ts`        | 백로그 WS 에러 코드 추가                                   |
