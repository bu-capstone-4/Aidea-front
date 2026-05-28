# 백엔드 기능 제안: 태스크 이슈 ↔ 스토리 연결

> 작성일: 2026-05-28  
> 대상 브랜치: `feat/79-backlog-co-op` 기준

---

## 1. 배경 및 목적

현재 백로그 시스템에서 독립 백로그 태스크(`BacklogTask`)와 스토리 하위 태스크(`Task`)는 별개의 엔티티로 분리되어 있으며, 두 유형 간 전환이나 연결 기능이 없습니다.

프론트엔드에서 다음 두 가지 사용자 시나리오를 지원하기 위해 백엔드 API 추가가 필요합니다.

| 시나리오 | 설명                                                                     |
| -------- | ------------------------------------------------------------------------ |
| A        | 독립 태스크 **생성 시** 상위 스토리를 지정하여 스토리 하위 태스크로 귀속 |
| B        | 이미 생성된 독립 태스크에 **나중에** 상위 스토리를 할당(또는 해제)       |

---

## 2. 현재 명세 분석

### 2.1 독립 백로그 태스크 (`BacklogTask`)

- 생성: `POST /api/teamspaces/{teamspaceId}/tasks`
- 수정: `PUT /api/teamspaces/{teamspaceId}/tasks/{taskId}`
- 요청 본문 필드: `title`, `status`, `priority`, `issueType`, `sprint`, `assigneeId`, `dueDate`
- **`storyId` 필드 없음** → 스토리 연결 불가

### 2.2 스토리 하위 태스크 (`Task`)

- 생성: `POST /api/teamspaces/{teamspaceId}/stories/{storyId}/tasks`
- 수정: `PUT /api/teamspaces/{teamspaceId}/stories/{storyId}/tasks/{taskId}`
- 요청 본문 필드: `title`, `issueType`, `assigneeId`
- **`status`, `priority`, `sprint`, `dueDate` 필드 없음** → 스토리 하위 태스크로 생성 후 해당 필드 유실

### 2.3 타입 불일치 문제

두 엔티티의 응답 구조가 다릅니다.

| 필드            | `BacklogTaskResponse` | `TaskResponse` |
| --------------- | :-------------------: | :------------: |
| `number` (채번) |          ✅           |       ❌       |
| `status`        |          ✅           |       ❌       |
| `priority`      |          ✅           |       ❌       |
| `sprint`        |          ✅           |       ❌       |
| `dueDate`       |          ✅           |       ❌       |
| `reporter`      |          ✅           |       ❌       |
| `isCompleted`   |          ❌           |       ✅       |
| `position`      |          ✅           |       ✅       |

단순히 기존 엔드포인트에 `storyId`를 추가하는 방식으로는 필드 유실 문제가 발생합니다.

---

## 3. 제안하는 API

### 방안 1 (권장): 독립 태스크에 `storyId` 연결 필드 추가

독립 태스크의 정체성을 유지하면서 스토리와 **연결(link)** 관계를 맺는 방식입니다.  
`BacklogTask`가 스토리와 연결되어도 `status`, `priority` 등 필드는 그대로 유지합니다.

#### 3.1.1 독립 태스크 생성 시 스토리 연결

**기존 엔드포인트 확장**

```
POST /api/teamspaces/{teamspaceId}/tasks
```

**Request Body 변경 (추가 필드)**

| 필드      | 타입     | 필수 | 설명                                       |
| --------- | -------- | :--: | ------------------------------------------ |
| `storyId` | `number` |  —   | 연결할 상위 스토리 ID (없으면 독립 태스크) |

**예시 요청**

```json
{
  "title": "로그인 API 연동",
  "priority": "HIGH",
  "issueType": "FE",
  "assigneeId": 42,
  "storyId": 7
}
```

**응답 변경**

`BacklogTaskResponse`에 `storyId` 필드 추가:

| 필드      | 타입             | 설명                                         |
| --------- | ---------------- | -------------------------------------------- |
| `storyId` | `number \| null` | 연결된 상위 스토리 ID (독립 태스크면 `null`) |

**오류**

| HTTP | code              | 설명                                                  |
| ---- | ----------------- | ----------------------------------------------------- |
| 404  | `STORY_NOT_FOUND` | `storyId`가 존재하지 않거나 해당 팀스페이스 소속 아님 |

> WebSocket: `backlogtask:created` 브로드캐스트 (기존 동일, `storyId` 필드 포함)

---

#### 3.1.2 기존 독립 태스크에 상위 스토리 할당 / 해제

**신규 엔드포인트**

```
PATCH /api/teamspaces/{teamspaceId}/tasks/{taskId}/story
```

**Request Body**

| 필드      | 타입             | 필수 | 설명                                                           |
| --------- | ---------------- | :--: | -------------------------------------------------------------- |
| `storyId` | `number \| null` |  ✅  | 연결할 스토리 ID. `null` 전달 시 연결 해제(독립 태스크로 전환) |

**예시 요청 — 스토리 할당**

```json
{ "storyId": 7 }
```

**예시 요청 — 스토리 해제**

```json
{ "storyId": null }
```

**Response 200** — `BacklogTaskResponse` (storyId 포함)

**오류**

| HTTP | code                     | 설명                                                  |
| ---- | ------------------------ | ----------------------------------------------------- |
| 404  | `BACKLOG_TASK_NOT_FOUND` | 해당 태스크가 존재하지 않음                           |
| 404  | `STORY_NOT_FOUND`        | `storyId`가 존재하지 않거나 해당 팀스페이스 소속 아님 |

> WebSocket: 신규 이벤트 `backlogtask:story_changed` 브로드캐스트

---

#### 3.1.3 신규 WebSocket 이벤트

**`backlogtask:story_changed`**

```json
{
  "type": "backlogtask:story_changed",
  "actorId": "1",
  "taskId": 100,
  "storyId": 7
}
```

| 필드      | 타입             | 설명                                                  |
| --------- | ---------------- | ----------------------------------------------------- |
| `taskId`  | `number`         | 변경된 태스크 ID                                      |
| `storyId` | `number \| null` | 새로 연결된 스토리 ID (`null`이면 독립 태스크로 전환) |

---

#### 3.1.4 스토리 조회 응답 변경

스토리에 연결된 독립 태스크를 함께 조회할 수 있도록 `StoryDetailResponse`에 필드 추가:

| 필드          | 타입                    | 설명                                |
| ------------- | ----------------------- | ----------------------------------- |
| `linkedTasks` | `BacklogTaskResponse[]` | 이 스토리에 연결된 독립 태스크 목록 |

또는 기존 `StorySummaryResponse`의 `taskCount` / `completedTaskCount`에 연결된 독립 태스크도 포함 여부를 명시해 주세요.

---

### 방안 2 (대안): 스토리 하위 태스크에 독립 태스크 필드 추가

스토리 하위 태스크(`Task`) 엔티티에 `status`, `priority`, `sprint`, `dueDate` 필드를 추가하는 방식입니다.  
두 엔티티를 통합하는 방향이지만 기존 하위 태스크의 단순 체크리스트 용도와 목적이 달라져 스키마 변경이 큰 편입니다.

방안 1보다 변경 범위가 크기 때문에 **방안 1을 우선 권장**합니다.

---

## 4. 영향 범위 요약

| 항목                             | 변경 내용                                             |
| -------------------------------- | ----------------------------------------------------- |
| `POST /tasks`                    | `storyId` 선택 필드 추가                              |
| `PUT /tasks/{taskId}`            | `storyId` 선택 필드 추가 (스토리 재연결 허용)         |
| `PATCH /tasks/{taskId}/story`    | **신규** 엔드포인트                                   |
| `BacklogTaskResponse`            | `storyId: number \| null` 필드 추가                   |
| `StoryDetailResponse`            | `linkedTasks: BacklogTaskResponse[]` 필드 추가 (선택) |
| `backlog:init` WebSocket         | `tasks` 배열의 각 항목에 `storyId` 포함               |
| `backlogtask:*` WebSocket 이벤트 | 페이로드에 `storyId` 필드 포함                        |
| `backlogtask:story_changed`      | **신규** WebSocket 이벤트                             |
| 오류 코드                        | 기존 코드 재사용 (신규 코드 불필요)                   |

---

## 5. 프론트엔드 구현 예정 기능

백엔드 API가 구현되면 프론트엔드에서 아래 UI를 구현할 예정입니다.

1. **태스크 이슈 생성 폼**: 상위 스토리 선택 드롭다운 추가 (`storyId` 전송)
2. **태스크 이슈 상세 패널**: 상위 스토리 표시 및 변경/해제 버튼 (`PATCH /tasks/{taskId}/story` 호출)
3. **스토리 상세 패널**: 연결된 독립 태스크 목록 표시 (`linkedTasks`)

---

## 6. 문의

프론트엔드 담당: `feat/62-backlog-co-op` 브랜치  
추가 논의가 필요하면 해당 브랜치 PR 또는 팀 채널로 연락 부탁드립니다.
