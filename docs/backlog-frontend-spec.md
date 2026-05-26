# 백로그 기능 프론트엔드 연동 명세

> 백로그(Epic / Story / Task) 기능의 REST API, WebSocket, DTO를 프론트엔드 구현에 필요한 형태로 정리한 문서.
> 설계 원본은 [backlog-design.md](backlog-design.md) 참조.

---

## 목차

1. [공통 규칙](#1-공통-규칙)
2. [타입 및 Enum 정의](#2-타입-및-enum-정의)
3. [공통 DTO](#3-공통-dto)
4. [REST API — BacklogConfig](#4-rest-api--backlogconfig)
5. [REST API — Epic](#5-rest-api--epic)
6. [REST API — Story](#6-rest-api--story)
7. [REST API — Task](#7-rest-api--task)
8. [에러 코드](#8-에러-코드)
9. [WebSocket 연결 및 핸드셰이크](#9-websocket-연결-및-핸드셰이크)
10. [WebSocket 서버 → 클라이언트 이벤트](#10-websocket-서버--클라이언트-이벤트)

---

## 1. 공통 규칙

### 인증

모든 REST API는 JWT 인증이 필요하다.

| 방식               | 형식                          |
| ------------------ | ----------------------------- |
| HttpOnly 쿠키      | `access_token=<JWT>`          |
| Authorization 헤더 | `Authorization: Bearer <JWT>` |

### 권한 체계

팀스페이스 멤버 역할에 따라 접근 가능한 API가 다르다.

| 역할   | GET | POST / PUT / PATCH / DELETE |
| ------ | --- | --------------------------- |
| OWNER  | O   | O                           |
| MEMBER | O   | O                           |
| VIEWER | O   | X (403 응답)                |

### REST 응답 래퍼

모든 REST 응답은 `GlobalResponse<T>` 구조로 감싸진다.

```json
// 성공 응답
{
  "success": true,
  "message": "success",
  "data": { /* 아래 각 API의 Response 내용 */ }
}

// 성공 응답 — 데이터 없음 (DELETE 등)
{
  "success": true,
  "code": "SUCCESS",
  "message": "요청이 성공적으로 처리되었습니다."
}

// 실패 응답
{
  "success": false,
  "code": "EPIC_NOT_FOUND",
  "message": "에픽을 찾을 수 없습니다."
}
```

> `@JsonInclude(NON_NULL)` 적용으로 `null` 필드는 응답 JSON에 포함되지 않는다.

### HTTP 상태 코드 규칙

| 작업               | 상태 코드 |
| ------------------ | --------- |
| 조회 (GET)         | 200       |
| 생성 (POST)        | 201       |
| 수정 (PUT / PATCH) | 200       |
| 삭제 (DELETE)      | 200       |

---

## 2. 타입 및 Enum 정의

### `StoryStatus`

스토리의 진행 상태.

| 값            | 설명               |
| ------------- | ------------------ |
| `OPEN`        | 미시작 (기본값)    |
| `IN_PROGRESS` | 진행 중            |
| `DONE`        | 완료               |
| `CLOSED`      | 종료 (not planned) |

> `DONE` 또는 `CLOSED`로 전환되면 서버가 `closedAt`을 현재 시각으로 기록한다.
> `OPEN` / `IN_PROGRESS`로 다시 되돌려도 `closedAt`은 초기화되지 않는다 (이전 종료 시각이 유지된다).

### `Priority`

스토리 우선순위. nullable. `BacklogConfig.priorityEnabled`가 `true`일 때만 사용 가능.

| 값       | 설명 |
| -------- | ---- |
| `LOW`    | 낮음 |
| `MEDIUM` | 보통 |
| `HIGH`   | 높음 |
| `URGENT` | 긴급 |

### `IssueType`

스토리 및 태스크의 팀 구분. nullable. `BacklogConfig.feBeEnabled`가 `true`일 때만 사용 가능.

| 값   | 설명            |
| ---- | --------------- |
| `FE` | 프론트엔드 이슈 |
| `BE` | 백엔드 이슈     |

> `feBeEnabled`가 `true`이면 프론트엔드가 `issueType` + `number`를 조합해 `FE-001`, `BE-002` 형식의 이슈 ID를 표시한다.
> 표시 형식: `` `${issueType}-${String(number).padStart(3, '0')}` ``
> `feBeEnabled`가 `false`이거나 `issueType`이 `null`이면 `number` 숫자만 표시한다.

---

## 3. 공통 DTO

### `UserResponse`

사용자 정보 공통 객체. 여러 Response에 중첩된다.

```json
{
  "id": 1,
  "name": "강민석",
  "githubLogin": "kang-min-seok",
  "profileImageUrl": "https://avatars.githubusercontent.com/..."
}
```

| 필드              | 타입     | 설명              |
| ----------------- | -------- | ----------------- |
| `id`              | `Long`   | 유저 식별자       |
| `name`            | `String` | 표시 이름         |
| `githubLogin`     | `String` | GitHub 계정명     |
| `profileImageUrl` | `String` | 프로필 이미지 URL |

> `avatarUrl`이 아닌 `profileImageUrl`임에 주의.

### `BacklogConfigResponse`

백로그 설정 객체. `backlog:init` 및 설정 API 응답에 포함된다.

```json
{
  "teamspaceId": "abc-123",
  "feBeEnabled": true,
  "epicEnabled": true,
  "storyEnabled": false,
  "priorityEnabled": true,
  "sprintEnabled": true,
  "dueDateEnabled": false
}
```

| 필드              | 타입      | 설명                         |
| ----------------- | --------- | ---------------------------- |
| `teamspaceId`     | `String`  | 팀스페이스 식별자            |
| `feBeEnabled`     | `boolean` | FE/BE 구분 활성화 여부       |
| `epicEnabled`     | `boolean` | 에픽 이슈 유형 활성화 여부   |
| `storyEnabled`    | `boolean` | 스토리 이슈 유형 활성화 여부 |
| `priorityEnabled` | `boolean` | 우선순위 필드 활성화 여부    |
| `sprintEnabled`   | `boolean` | 스프린트 필드 활성화 여부    |
| `dueDateEnabled`  | `boolean` | 마감일 필드 활성화 여부      |

> 설정이 아직 저장된 적 없는 팀스페이스는 모든 필드가 `false`인 기본값을 반환한다 (404가 아님).
> 태스크(Task)는 기본 이슈 유형이므로 별도 활성화 설정 없이 항상 사용 가능하다.

### `EpicSummaryResponse`

Story 조회 시 Epic을 간략하게 표현하는 객체.

```json
{
  "id": 1,
  "name": "인증",
  "color": "#6366f1"
}
```

| 필드    | 타입     | 설명                 |
| ------- | -------- | -------------------- |
| `id`    | `Long`   | 에픽 식별자          |
| `name`  | `String` | 에픽 이름            |
| `color` | `String` | HEX 색상 (`#rrggbb`) |

### `EpicResponse`

Epic 생성/수정/목록 조회 시 사용하는 전체 에픽 객체.

```json
{
  "id": 1,
  "name": "인증",
  "color": "#6366f1",
  "description": "사용자 인증 관련 작업",
  "createdAt": "2026-05-21T10:00:00",
  "createdBy": {
    "id": 1,
    "name": "강민석",
    "githubLogin": "kang-min-seok",
    "profileImageUrl": "https://..."
  }
}
```

| 필드          | 타입            | Nullable | 설명        |
| ------------- | --------------- | -------- | ----------- |
| `id`          | `Long`          | N        | 에픽 식별자 |
| `name`        | `String`        | N        | 에픽 이름   |
| `color`       | `String`        | N        | HEX 색상    |
| `description` | `String`        | Y        | 설명        |
| `createdAt`   | `LocalDateTime` | N        | 생성 시각   |
| `createdBy`   | `UserResponse`  | N        | 생성자      |

### `StorySummaryResponse`

Story 목록 조회 및 WebSocket 브로드캐스트에 사용. 태스크 목록은 포함하지 않는다.

```json
{
  "id": 1,
  "number": 1,
  "title": "GitHub OAuth 로그인",
  "status": "OPEN",
  "priority": "HIGH",
  "issueType": "FE",
  "sprint": "Sprint 1",
  "epics": [{ "id": 1, "name": "인증", "color": "#6366f1" }],
  "assignee": {
    "id": 1,
    "name": "강민석",
    "githubLogin": "kang-min-seok",
    "profileImageUrl": "https://..."
  },
  "reporter": {
    "id": 1,
    "name": "강민석",
    "githubLogin": "kang-min-seok",
    "profileImageUrl": "https://..."
  },
  "taskCount": 3,
  "completedTaskCount": 1,
  "dueDate": "2026-06-01",
  "position": 1000,
  "createdAt": "2026-05-21T10:00:00",
  "updatedAt": "2026-05-21T10:00:00"
}
```

| 필드                 | 타입                    | Nullable | 설명                                                       |
| -------------------- | ----------------------- | -------- | ---------------------------------------------------------- |
| `id`                 | `Long`                  | N        | 스토리 식별자                                              |
| `number`             | `Long`                  | N        | 팀스페이스 내 순차 번호                                    |
| `title`              | `String`                | N        | 제목                                                       |
| `status`             | `StoryStatus`           | N        | 진행 상태                                                  |
| `priority`           | `Priority`              | Y        | 우선순위 (`priorityEnabled` 시 사용)                       |
| `issueType`          | `IssueType`             | Y        | FE/BE 구분 (`feBeEnabled` 시 사용)                         |
| `sprint`             | `String`                | Y        | 스프린트 이름 (예: `"Sprint 1"`) (`sprintEnabled` 시 사용) |
| `epics`              | `EpicSummaryResponse[]` | N        | 부착된 에픽 목록 (없으면 빈 배열)                          |
| `assignee`           | `UserResponse`          | Y        | 담당자                                                     |
| `reporter`           | `UserResponse`          | N        | 보고자 (생성자)                                            |
| `taskCount`          | `int`                   | N        | 전체 태스크 수                                             |
| `completedTaskCount` | `int`                   | N        | 완료된 태스크 수                                           |
| `dueDate`            | `LocalDate`             | Y        | 마감일 (`YYYY-MM-DD`) (`dueDateEnabled` 시 사용)           |
| `position`           | `int`                   | N        | 백로그 내 정렬 순서                                        |
| `createdAt`          | `LocalDateTime`         | N        | 생성 시각                                                  |
| `updatedAt`          | `LocalDateTime`         | N        | 수정 시각                                                  |

### `StoryDetailResponse`

Story 상세 조회, 생성, 수정 응답. `StorySummaryResponse` 필드에 `body`, `closedAt`, `tasks`가 추가된다.

```json
{
  "id": 1,
  "number": 1,
  "title": "GitHub OAuth 로그인",
  "body": "## 설명\n로그인 플로우를 구현한다.",
  "status": "OPEN",
  "priority": "HIGH",
  "issueType": "FE",
  "sprint": "Sprint 1",
  "epics": [{ "id": 1, "name": "인증", "color": "#6366f1" }],
  "assignee": {
    "id": 1,
    "name": "강민석",
    "githubLogin": "kang-min-seok",
    "profileImageUrl": "https://..."
  },
  "reporter": {
    "id": 1,
    "name": "강민석",
    "githubLogin": "kang-min-seok",
    "profileImageUrl": "https://..."
  },
  "dueDate": "2026-06-01",
  "position": 1000,
  "createdAt": "2026-05-21T10:00:00",
  "updatedAt": "2026-05-21T10:00:00",
  "closedAt": null,
  "tasks": [
    {
      "id": 1,
      "title": "GitHub App 등록",
      "issueType": "FE",
      "isCompleted": true,
      "assignee": {
        "id": 1,
        "name": "강민석",
        "githubLogin": "kang-min-seok",
        "profileImageUrl": "https://..."
      },
      "position": 1000,
      "createdAt": "2026-05-21T10:00:00"
    },
    {
      "id": 2,
      "title": "OAuth 콜백 처리",
      "issueType": null,
      "isCompleted": false,
      "assignee": null,
      "position": 2000,
      "createdAt": "2026-05-21T10:00:00"
    }
  ]
}
```

`StorySummaryResponse` 대비 추가 필드:

| 필드       | 타입             | Nullable | 설명                         |
| ---------- | ---------------- | -------- | ---------------------------- |
| `body`     | `String`         | Y        | Markdown 본문                |
| `closedAt` | `LocalDateTime`  | Y        | DONE/CLOSED 전환 시각        |
| `tasks`    | `TaskResponse[]` | N        | 태스크 목록 (없으면 빈 배열) |

### `TaskResponse`

```json
{
  "id": 1,
  "title": "GitHub App 등록",
  "issueType": "FE",
  "isCompleted": false,
  "assignee": null,
  "position": 1000,
  "createdAt": "2026-05-21T10:00:00"
}
```

| 필드          | 타입            | Nullable | 설명                               |
| ------------- | --------------- | -------- | ---------------------------------- |
| `id`          | `Long`          | N        | 태스크 식별자                      |
| `title`       | `String`        | N        | 제목                               |
| `issueType`   | `IssueType`     | Y        | FE/BE 구분 (`feBeEnabled` 시 사용) |
| `isCompleted` | `boolean`       | N        | 완료 여부                          |
| `assignee`    | `UserResponse`  | Y        | 담당자                             |
| `position`    | `int`           | N        | 스토리 내 정렬 순서                |
| `createdAt`   | `LocalDateTime` | N        | 생성 시각                          |

> `isCompleted` 필드는 Java record이지만 `@JsonProperty("isCompleted")`가 명시되어 있어 JSON 키가 `isCompleted`로 직렬화된다.

### `StoryStatusResponse`

상태 변경(`PATCH .../status`) 전용 응답.

```json
{
  "id": 1,
  "status": "IN_PROGRESS",
  "closedAt": null
}
```

| 필드       | 타입            | Nullable | 설명                                 |
| ---------- | --------------- | -------- | ------------------------------------ |
| `id`       | `Long`          | N        | 스토리 식별자                        |
| `status`   | `StoryStatus`   | N        | 변경된 상태                          |
| `closedAt` | `LocalDateTime` | Y        | DONE/CLOSED 시 기록, 나머지는 `null` |

### `ReorderResponse`

순서 변경(`PATCH .../reorder`) 전용 응답.

```json
{
  "orderedIds": [3, 1, 5, 2, 4]
}
```

---

## 4. REST API — BacklogConfig

Base URL: `/api/teamspaces/{teamspaceId}/backlog/config`

백로그 설정을 조회하거나 저장한다. 설정은 팀스페이스 단위로 관리되며, 어떤 이슈 유형과 추가 필드를 활성화할지 결정한다.

### 4-1. 백로그 설정 조회

```
GET /api/teamspaces/{teamspaceId}/backlog/config
```

**응답 200** — `GlobalResponse<BacklogConfigResponse>`

```json
{
  "success": true,
  "message": "success",
  "data": {
    "teamspaceId": "abc-123",
    "feBeEnabled": true,
    "epicEnabled": true,
    "storyEnabled": false,
    "priorityEnabled": true,
    "sprintEnabled": true,
    "dueDateEnabled": false
  }
}
```

> 설정이 한 번도 저장된 적 없는 경우 404가 아닌 모든 필드가 `false`인 기본값을 200으로 반환한다.

---

### 4-2. 백로그 설정 저장 (upsert)

```
PUT /api/teamspaces/{teamspaceId}/backlog/config
Content-Type: application/json
```

설정이 없으면 새로 생성하고, 이미 있으면 전체 덮어쓰기한다.

**Request Body**

```json
{
  "feBeEnabled": true,
  "epicEnabled": true,
  "storyEnabled": false,
  "priorityEnabled": true,
  "sprintEnabled": true,
  "dueDateEnabled": false
}
```

| 필드              | 타입      | 설명                       |
| ----------------- | --------- | -------------------------- |
| `feBeEnabled`     | `boolean` | FE/BE 구분 사용 여부       |
| `epicEnabled`     | `boolean` | 에픽 이슈 유형 사용 여부   |
| `storyEnabled`    | `boolean` | 스토리 이슈 유형 사용 여부 |
| `priorityEnabled` | `boolean` | 우선순위 필드 사용 여부    |
| `sprintEnabled`   | `boolean` | 스프린트 필드 사용 여부    |
| `dueDateEnabled`  | `boolean` | 마감일 필드 사용 여부      |

**응답 200** — `GlobalResponse<BacklogConfigResponse>`

> 설정 저장 성공 시 동일 팀스페이스에 접속 중인 다른 유저에게 `backlog:config_updated` WebSocket 이벤트가 브로드캐스트된다.

---

## 5. REST API — Epic

Base URL: `/api/teamspaces/{teamspaceId}/epics`

`teamspaceId`: `String` (UUID 문자열)

> `BacklogConfig.epicEnabled`가 `false`인 경우 에픽 생성(`POST`)이 차단된다 (`400 BACKLOG_CONFIG_FIELD_NOT_ALLOWED`).

### 5-1. 에픽 목록 조회

```
GET /api/teamspaces/{teamspaceId}/epics
```

**응답 200** — `GlobalResponse<EpicResponse[]>`

```json
{
  "success": true,
  "message": "success",
  "data": [
    {
      "id": 1,
      "name": "인증",
      "color": "#6366f1",
      "description": "사용자 인증 관련 작업",
      "createdAt": "2026-05-21T10:00:00",
      "createdBy": {
        "id": 1,
        "name": "강민석",
        "githubLogin": "kang-min-seok",
        "profileImageUrl": "..."
      }
    }
  ]
}
```

---

### 5-2. 에픽 생성

```
POST /api/teamspaces/{teamspaceId}/epics
Content-Type: application/json
```

**Request Body**

```json
{
  "name": "인증",
  "color": "#6366f1",
  "description": "사용자 인증 관련 작업"
}
```

| 필드          | 타입     | 필수 | 제약                         |
| ------------- | -------- | ---- | ---------------------------- |
| `name`        | `String` | Y    | 공백 불가                    |
| `color`       | `String` | Y    | HEX 형식 `^#[0-9a-fA-F]{6}$` |
| `description` | `String` | N    | —                            |

**응답 201** — `GlobalResponse<EpicResponse>`

---

### 5-3. 에픽 수정

```
PUT /api/teamspaces/{teamspaceId}/epics/{epicId}
Content-Type: application/json
```

**Request Body** — `CreateEpicRequest`와 동일

```json
{
  "name": "인증 v2",
  "color": "#22c55e",
  "description": "수정된 설명"
}
```

**응답 200** — `GlobalResponse<EpicResponse>`

---

### 5-4. 에픽 삭제

```
DELETE /api/teamspaces/{teamspaceId}/epics/{epicId}
```

> 연결된 `story_epics` 관계 행도 함께 삭제된다. 스토리 자체는 삭제되지 않는다.

**응답 200** — `GlobalResponse<Void>`

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "요청이 성공적으로 처리되었습니다."
}
```

---

## 6. REST API — Story

Base URL: `/api/teamspaces/{teamspaceId}/stories`

> `BacklogConfig.storyEnabled`가 `false`인 경우 스토리 생성(`POST`)이 차단된다 (`400 BACKLOG_CONFIG_FIELD_NOT_ALLOWED`).

### 6-1. 스토리 목록 조회

```
GET /api/teamspaces/{teamspaceId}/stories
```

**Query Parameters** (모두 선택)

| 파라미터     | 타입                 | 설명                                                     |
| ------------ | -------------------- | -------------------------------------------------------- |
| `status`     | `string` (반복 가능) | `OPEN`, `IN_PROGRESS`, `DONE`, `CLOSED` — 미지정 시 전체 |
| `epicId`     | `Long`               | 특정 에픽 필터                                           |
| `assigneeId` | `Long`               | 담당자 필터                                              |
| `priority`   | `string`             | `LOW`, `MEDIUM`, `HIGH`, `URGENT`                        |

**URL 예시**

```
GET /api/teamspaces/abc123/stories?status=OPEN&status=IN_PROGRESS&epicId=1
```

**응답 200** — `GlobalResponse<StorySummaryResponse[]>`

태스크 목록(`tasks`)은 포함되지 않는다. `taskCount`/`completedTaskCount`로 진행도 확인 가능.

---

### 6-2. 스토리 상세 조회

```
GET /api/teamspaces/{teamspaceId}/stories/{storyId}
```

**응답 200** — `GlobalResponse<StoryDetailResponse>`

태스크 목록(`tasks`)이 포함된다. 태스크 별도 조회 API는 없으며 항상 이 응답에 포함된다.

---

### 6-3. 스토리 생성

```
POST /api/teamspaces/{teamspaceId}/stories
Content-Type: application/json
```

**Request Body**

```json
{
  "title": "GitHub OAuth 로그인",
  "body": "## 설명\n...",
  "priority": "HIGH",
  "issueType": "FE",
  "sprint": "Sprint 1",
  "epicIds": [1, 2],
  "assigneeId": 1,
  "dueDate": "2026-06-01"
}
```

| 필드         | 타입        | 필수 | 설명                                                                          |
| ------------ | ----------- | ---- | ----------------------------------------------------------------------------- |
| `title`      | `String`    | Y    | 공백 불가                                                                     |
| `body`       | `String`    | N    | Markdown 본문                                                                 |
| `priority`   | `Priority`  | N    | `LOW`/`MEDIUM`/`HIGH`/`URGENT`. `priorityEnabled`가 `false`이면 `null`만 허용 |
| `issueType`  | `IssueType` | N    | `FE`/`BE`. `feBeEnabled`가 `false`이면 `null`만 허용                          |
| `sprint`     | `String`    | N    | 스프린트 이름. `sprintEnabled`가 `false`이면 `null`만 허용                    |
| `epicIds`    | `Long[]`    | N    | 부착할 에픽 ID 배열 (빈 배열 또는 null 허용)                                  |
| `assigneeId` | `Long`      | N    | 담당자 유저 ID                                                                |
| `dueDate`    | `LocalDate` | N    | `YYYY-MM-DD` 형식. `dueDateEnabled`가 `false`이면 `null`만 허용               |

**응답 201** — `GlobalResponse<StoryDetailResponse>` (tasks 빈 배열)

---

### 6-4. 스토리 수정

```
PUT /api/teamspaces/{teamspaceId}/stories/{storyId}
Content-Type: application/json
```

**Request Body** — `CreateStoryRequest`와 동일한 구조.

전체 필드를 재전송하는 방식. `epicIds`에 현재 부착할 에픽 ID 전체를 넘기면 기존 에픽 관계가 교체된다.

**응답 200** — `GlobalResponse<StoryDetailResponse>`

---

### 6-5. 스토리 상태 변경

```
PATCH /api/teamspaces/{teamspaceId}/stories/{storyId}/status
Content-Type: application/json
```

**Request Body**

```json
{
  "status": "IN_PROGRESS"
}
```

| 필드     | 타입          | 필수 | 설명      |
| -------- | ------------- | ---- | --------- |
| `status` | `StoryStatus` | Y    | null 불가 |

**응답 200** — `GlobalResponse<StoryStatusResponse>`

```json
{
  "success": true,
  "message": "success",
  "data": {
    "id": 1,
    "status": "IN_PROGRESS",
    "closedAt": null
  }
}
```

> `DONE` / `CLOSED`로 전환 시 `closedAt`에 현재 시각이 기록된다.
> 이미 설정된 `closedAt`은 다시 `OPEN`/`IN_PROGRESS`로 되돌려도 초기화되지 않는다.

---

### 6-6. 스토리 순서 변경

백로그 내 드래그앤드롭 후 최종 순서를 서버에 반영한다.

```
PATCH /api/teamspaces/{teamspaceId}/stories/reorder
Content-Type: application/json
```

**Request Body**

```json
{
  "orderedIds": [3, 1, 5, 2, 4]
}
```

| 필드         | 타입     | 필수 | 설명                                     |
| ------------ | -------- | ---- | ---------------------------------------- |
| `orderedIds` | `Long[]` | Y    | 빈 배열 불가. 정렬된 스토리 ID 전체 목록 |

서버는 배열 순서대로 `position` 값을 재계산한다.

**응답 200** — `GlobalResponse<ReorderResponse>`

```json
{
  "success": true,
  "message": "success",
  "data": { "orderedIds": [3, 1, 5, 2, 4] }
}
```

---

### 6-7. 스토리 삭제

```
DELETE /api/teamspaces/{teamspaceId}/stories/{storyId}
```

> 스토리 삭제 시 하위 태스크도 함께 삭제된다.

**응답 200** — `GlobalResponse<Void>`

---

## 7. REST API — Task

Base URL: `/api/teamspaces/{teamspaceId}/stories/{storyId}/tasks`

> 태스크 조회 API는 별도로 없다. 태스크 목록은 [스토리 상세 조회](#6-2-스토리-상세-조회) 응답의 `tasks` 배열로만 확인한다.

### 7-1. 태스크 생성

```
POST /api/teamspaces/{teamspaceId}/stories/{storyId}/tasks
Content-Type: application/json
```

**Request Body**

```json
{
  "title": "GitHub App 등록",
  "issueType": "FE",
  "assigneeId": null
}
```

| 필드         | 타입        | 필수 | 설명                                                 |
| ------------ | ----------- | ---- | ---------------------------------------------------- |
| `title`      | `String`    | Y    | 공백 불가                                            |
| `issueType`  | `IssueType` | N    | `FE`/`BE`. `feBeEnabled`가 `false`이면 `null`만 허용 |
| `assigneeId` | `Long`      | N    | 담당자 유저 ID                                       |

**응답 201** — `GlobalResponse<TaskResponse>`

---

### 7-2. 태스크 수정

```
PUT /api/teamspaces/{teamspaceId}/stories/{storyId}/tasks/{taskId}
Content-Type: application/json
```

**Request Body** — `CreateTaskRequest`와 동일

```json
{
  "title": "수정된 제목",
  "issueType": "BE",
  "assigneeId": 2
}
```

**응답 200** — `GlobalResponse<TaskResponse>`

---

### 7-3. 태스크 완료 토글

Request body 없음. 현재 `isCompleted` 값을 반전한다.

```
PATCH /api/teamspaces/{teamspaceId}/stories/{storyId}/tasks/{taskId}/complete
```

**응답 200** — `GlobalResponse<Map>`

```json
{
  "success": true,
  "message": "success",
  "data": {
    "id": 1,
    "isCompleted": true
  }
}
```

---

### 7-4. 태스크 순서 변경

```
PATCH /api/teamspaces/{teamspaceId}/stories/{storyId}/tasks/reorder
Content-Type: application/json
```

**Request Body**

```json
{
  "orderedIds": [2, 1, 3]
}
```

스토리 내 드래그앤드롭 결과를 반영한다.

**응답 200** — `GlobalResponse<ReorderResponse>`

```json
{
  "success": true,
  "message": "success",
  "data": { "orderedIds": [2, 1, 3] }
}
```

---

### 7-5. 태스크 삭제

```
DELETE /api/teamspaces/{teamspaceId}/stories/{storyId}/tasks/{taskId}
```

**응답 200** — `GlobalResponse<Void>`

---

## 8. 에러 코드

### REST API 에러

| `code`                             | HTTP | 메시지                                 | 발생 상황                                                   |
| ---------------------------------- | ---- | -------------------------------------- | ----------------------------------------------------------- |
| `INVALID_INPUT`                    | 400  | 입력값이 올바르지 않습니다.            | Bean Validation 실패                                        |
| `BACKLOG_CONFIG_FIELD_NOT_ALLOWED` | 400  | 백로그 설정에서 비활성화된 필드입니다. | 비활성화된 필드 값 전송 또는 비활성화된 이슈 유형 생성 시도 |
| `UNAUTHORIZED`                     | 401  | 인증이 필요합니다.                     | JWT 없음 또는 만료                                          |
| `NOT_TEAMSPACE_MEMBER`             | 403  | 팀스페이스 소속이 아닙니다.            | 팀스페이스 비멤버 접근                                      |
| `INSUFFICIENT_PERMISSION`          | 403  | 권한이 없습니다.                       | VIEWER의 쓰기 요청                                          |
| `TEAMSPACE_NOT_FOUND`              | 404  | 팀스페이스를 찾을 수 없습니다.         | 유효하지 않은 teamspaceId                                   |
| `EPIC_NOT_FOUND`                   | 404  | 에픽을 찾을 수 없습니다.               | 유효하지 않은 epicId                                        |
| `STORY_NOT_FOUND`                  | 404  | 스토리를 찾을 수 없습니다.             | 유효하지 않은 storyId                                       |
| `TASK_NOT_FOUND`                   | 404  | 태스크를 찾을 수 없습니다.             | 유효하지 않은 taskId                                        |

### WebSocket 에러 (`event: "error"`)

WebSocket 에러 메시지는 `"type"` 키 대신 **`"event"` 키**를 사용한다.

```json
{
  "event": "error",
  "code": "INSUFFICIENT_PERMISSION",
  "message": "이 작업을 수행할 권한이 없습니다."
}
```

| `code`                    | `fatal` | 설명                               |
| ------------------------- | ------- | ---------------------------------- |
| `INSUFFICIENT_PERMISSION` | false   | 권한 없는 작업 시도                |
| `DOCUMENT_NOT_FOUND`      | false   | 잘못된 문서 접근                   |
| `INVALID_MESSAGE`         | false   | 클라이언트 → 서버 메시지 형식 오류 |
| `INTERNAL_SERVER_ERROR`   | false   | 서버 내부 오류                     |
| `UNAUTHORIZED`            | true    | 인증 만료 (세션 종료됨)            |
| `SESSION_EXPIRED`         | true    | 세션 만료 (세션 종료됨)            |

> `fatal: true`인 에러는 서버가 에러 메시지 전송 후 WebSocket 세션을 강제 종료한다.

> 백로그 WebSocket은 클라이언트 → 서버 메시지를 처리하지 않는다. 클라이언트가 메시지를 전송하면 `INVALID_MESSAGE` 에러가 응답된다. 모든 변경은 REST API로만 수행한다.

---

## 9. WebSocket 연결 및 핸드셰이크

### 엔드포인트

```
ws://{host}/ws/backlog/{teamspaceId}
```

### 토큰 전달 방법 (우선순위 순)

1. `Authorization: Bearer <JWT>` 헤더
2. 쿼리 파라미터 `?token=<JWT>`
3. `access_token` 쿠키

### 핸드셰이크 실패 시 HTTP 상태

| 상태 코드 | 원인                             |
| --------- | -------------------------------- |
| 401       | JWT 없음 또는 유효하지 않은 토큰 |
| 403       | 해당 팀스페이스의 멤버가 아님    |

### 세션 속성 (핸드셰이크 성공 시 서버 내부 설정)

| 키            | 타입         | 설명                          |
| ------------- | ------------ | ----------------------------- |
| `teamSpaceId` | `String`     | URL에서 추출한 팀스페이스 ID  |
| `userId`      | `String`     | 인증된 유저 ID (숫자 문자열)  |
| `role`        | `MemberRole` | `OWNER` / `MEMBER` / `VIEWER` |

### 연결 수립 직후 — `backlog:init`

연결이 확립되는 즉시 서버가 현재 전체 상태를 전송한다. 클라이언트는 이 메시지로 초기 상태를 구성한다.

```json
{
  "type": "backlog:init",
  "config": {
    "teamspaceId": "abc-123",
    "feBeEnabled": true,
    "epicEnabled": true,
    "storyEnabled": false,
    "priorityEnabled": true,
    "sprintEnabled": true,
    "dueDateEnabled": false
  },
  "epics": [
    {
      "id": 1,
      "name": "인증",
      "color": "#6366f1",
      "description": "...",
      "createdAt": "2026-05-21T10:00:00",
      "createdBy": {
        "id": 1,
        "name": "강민석",
        "githubLogin": "kang-min-seok",
        "profileImageUrl": "..."
      }
    }
  ],
  "stories": [
    {
      "id": 1,
      "number": 1,
      "title": "GitHub OAuth 로그인",
      "status": "OPEN",
      "priority": "HIGH",
      "issueType": "FE",
      "sprint": "Sprint 1",
      "epics": [{ "id": 1, "name": "인증", "color": "#6366f1" }],
      "assignee": {
        "id": 1,
        "name": "강민석",
        "githubLogin": "kang-min-seok",
        "profileImageUrl": "..."
      },
      "reporter": {
        "id": 1,
        "name": "강민석",
        "githubLogin": "kang-min-seok",
        "profileImageUrl": "..."
      },
      "taskCount": 2,
      "completedTaskCount": 0,
      "dueDate": "2026-06-01",
      "position": 1000,
      "createdAt": "2026-05-21T10:00:00",
      "updatedAt": "2026-05-21T10:00:00"
    }
  ]
}
```

| 필드      | 타입                     | 설명                                          |
| --------- | ------------------------ | --------------------------------------------- |
| `type`    | `String`                 | 항상 `"backlog:init"`                         |
| `config`  | `BacklogConfigResponse`  | 팀스페이스의 현재 백로그 설정                 |
| `epics`   | `EpicResponse[]`         | 팀스페이스의 전체 에픽 목록                   |
| `stories` | `StorySummaryResponse[]` | 팀스페이스의 전체 스토리 목록 (태스크 미포함) |

---

## 10. WebSocket 서버 → 클라이언트 이벤트

### 브로드캐스트 규칙

- REST API를 **직접 호출한 유저**는 WebSocket 이벤트를 받지 않는다 (HTTP 응답으로 결과를 수신).
- 동일 팀스페이스에 접속 중인 **다른 유저**가 브로드캐스트 이벤트를 수신한다.

### 메시지 공통 구조

모든 브로드캐스트 이벤트는 `payload` 래퍼 없이 필드가 최상위에 flat하게 배치된다.

```json
{
  "type": "<이벤트-타입>",
  "actorId": "1",
  ...이벤트별 추가 필드
}
```

| 필드      | 타입     | 설명                                |
| --------- | -------- | ----------------------------------- |
| `type`    | `String` | 이벤트 종류 식별자                  |
| `actorId` | `String` | 변경을 수행한 유저 ID (숫자 문자열) |

---

### BacklogConfig 이벤트

#### `backlog:config_updated`

백로그 설정이 변경되었을 때.

```json
{
  "type": "backlog:config_updated",
  "actorId": "1",
  "config": {
    "teamspaceId": "abc-123",
    "feBeEnabled": true,
    "epicEnabled": true,
    "storyEnabled": false,
    "priorityEnabled": true,
    "sprintEnabled": true,
    "dueDateEnabled": false
  }
}
```

| 추가 필드 | 타입                    | 설명                  |
| --------- | ----------------------- | --------------------- |
| `config`  | `BacklogConfigResponse` | 변경된 전체 설정 객체 |

> 클라이언트는 이 이벤트 수신 시 활성화된 필드를 다시 렌더링해야 한다.

---

### Epic 이벤트

#### `epic:created`

에픽이 생성되었을 때.

```json
{
  "type": "epic:created",
  "actorId": "1",
  "epic": {
    "id": 2,
    "name": "결제",
    "color": "#f97316",
    "description": null,
    "createdAt": "2026-05-21T11:00:00",
    "createdBy": {
      "id": 1,
      "name": "강민석",
      "githubLogin": "kang-min-seok",
      "profileImageUrl": "..."
    }
  }
}
```

| 추가 필드 | 타입           | 설명                  |
| --------- | -------------- | --------------------- |
| `epic`    | `EpicResponse` | 생성된 에픽 전체 객체 |

---

#### `epic:updated`

에픽이 수정되었을 때.

```json
{
  "type": "epic:updated",
  "actorId": "1",
  "epic": {
    "id": 2,
    "name": "결제 시스템",
    "color": "#f97316",
    "description": "수정된 설명",
    "createdAt": "2026-05-21T11:00:00",
    "createdBy": {
      "id": 1,
      "name": "강민석",
      "githubLogin": "kang-min-seok",
      "profileImageUrl": "..."
    }
  }
}
```

| 추가 필드 | 타입           | 설명                  |
| --------- | -------------- | --------------------- |
| `epic`    | `EpicResponse` | 수정된 에픽 전체 객체 |

---

#### `epic:deleted`

에픽이 삭제되었을 때.

```json
{
  "type": "epic:deleted",
  "actorId": "1",
  "epicId": 2
}
```

| 추가 필드 | 타입   | 설명           |
| --------- | ------ | -------------- |
| `epicId`  | `Long` | 삭제된 에픽 ID |

> 에픽 삭제 시 각 스토리의 `epics` 배열에서 해당 에픽을 제거해야 한다.

---

### Story 이벤트

#### `story:created`

스토리가 생성되었을 때.

```json
{
  "type": "story:created",
  "actorId": "1",
  "story": {
    "id": 5,
    "number": 5,
    "title": "새 스토리",
    "status": "OPEN",
    "priority": null,
    "issueType": "FE",
    "sprint": "Sprint 1",
    "epics": [],
    "assignee": null,
    "reporter": {
      "id": 1,
      "name": "강민석",
      "githubLogin": "kang-min-seok",
      "profileImageUrl": "..."
    },
    "taskCount": 0,
    "completedTaskCount": 0,
    "dueDate": null,
    "position": 5000,
    "createdAt": "2026-05-21T12:00:00",
    "updatedAt": "2026-05-21T12:00:00"
  }
}
```

| 추가 필드 | 타입                   | 설명                          |
| --------- | ---------------------- | ----------------------------- |
| `story`   | `StorySummaryResponse` | 생성된 스토리 (태스크 미포함) |

---

#### `story:updated`

스토리가 수정되었을 때.

```json
{
  "type": "story:updated",
  "actorId": "1",
  "story": { "/* StorySummaryResponse 전체 */": "..." }
}
```

| 추가 필드 | 타입                   | 설명                               |
| --------- | ---------------------- | ---------------------------------- |
| `story`   | `StorySummaryResponse` | 수정된 스토리 전체 (태스크 미포함) |

---

#### `story:status_changed`

스토리 상태가 변경되었을 때.

```json
{
  "type": "story:status_changed",
  "actorId": "1",
  "storyId": 1,
  "status": "DONE",
  "closedAt": "2026-05-21T13:00:00"
}
```

| 추가 필드  | 타입            | Nullable | 설명                                 |
| ---------- | --------------- | -------- | ------------------------------------ |
| `storyId`  | `Long`          | N        | 대상 스토리 ID                       |
| `status`   | `StoryStatus`   | N        | 변경된 상태                          |
| `closedAt` | `LocalDateTime` | Y        | DONE/CLOSED 시 기록, 나머지는 `null` |

---

#### `story:reordered`

스토리 순서가 변경되었을 때.

```json
{
  "type": "story:reordered",
  "actorId": "1",
  "orderedIds": [3, 1, 5, 2, 4]
}
```

| 추가 필드    | 타입     | 설명                            |
| ------------ | -------- | ------------------------------- |
| `orderedIds` | `Long[]` | 변경 후 스토리 ID의 정렬된 배열 |

---

#### `story:deleted`

스토리가 삭제되었을 때.

```json
{
  "type": "story:deleted",
  "actorId": "1",
  "storyId": 1
}
```

| 추가 필드 | 타입   | 설명             |
| --------- | ------ | ---------------- |
| `storyId` | `Long` | 삭제된 스토리 ID |

---

### Task 이벤트

모든 태스크 이벤트는 `storyId`를 포함한다. 클라이언트는 이를 통해 어느 스토리의 태스크인지 식별한다.

#### `task:created`

태스크가 생성되었을 때.

```json
{
  "type": "task:created",
  "actorId": "1",
  "storyId": 1,
  "task": {
    "id": 3,
    "title": "새 태스크",
    "issueType": "BE",
    "isCompleted": false,
    "assignee": null,
    "position": 3000,
    "createdAt": "2026-05-21T12:00:00"
  }
}
```

| 추가 필드 | 타입           | 설명           |
| --------- | -------------- | -------------- |
| `storyId` | `Long`         | 부모 스토리 ID |
| `task`    | `TaskResponse` | 생성된 태스크  |

---

#### `task:updated`

태스크가 수정되었을 때.

```json
{
  "type": "task:updated",
  "actorId": "1",
  "storyId": 1,
  "task": { "/* TaskResponse 전체 */": "..." }
}
```

| 추가 필드 | 타입           | 설명               |
| --------- | -------------- | ------------------ |
| `storyId` | `Long`         | 부모 스토리 ID     |
| `task`    | `TaskResponse` | 수정된 태스크 전체 |

---

#### `task:completed`

태스크 완료 상태가 토글되었을 때.

```json
{
  "type": "task:completed",
  "actorId": "1",
  "storyId": 1,
  "taskId": 2,
  "isCompleted": true
}
```

| 추가 필드     | 타입      | 설명             |
| ------------- | --------- | ---------------- |
| `storyId`     | `Long`    | 부모 스토리 ID   |
| `taskId`      | `Long`    | 대상 태스크 ID   |
| `isCompleted` | `boolean` | 변경된 완료 여부 |

---

#### `task:reordered`

태스크 순서가 변경되었을 때.

```json
{
  "type": "task:reordered",
  "actorId": "1",
  "storyId": 1,
  "orderedIds": [2, 1, 3]
}
```

| 추가 필드    | 타입     | 설명                            |
| ------------ | -------- | ------------------------------- |
| `storyId`    | `Long`   | 부모 스토리 ID                  |
| `orderedIds` | `Long[]` | 변경 후 태스크 ID의 정렬된 배열 |

---

#### `task:deleted`

태스크가 삭제되었을 때.

```json
{
  "type": "task:deleted",
  "actorId": "1",
  "storyId": 1,
  "taskId": 2
}
```

| 추가 필드 | 타입   | 설명             |
| --------- | ------ | ---------------- |
| `storyId` | `Long` | 부모 스토리 ID   |
| `taskId`  | `Long` | 삭제된 태스크 ID |

---

## 부록 — 전체 이벤트 타입 참조

| 이벤트 `type`            | 트리거 REST API                                    |
| ------------------------ | -------------------------------------------------- |
| `backlog:init`           | WebSocket 연결 수립 직후 서버 자동 전송            |
| `backlog:config_updated` | `PUT /backlog/config`                              |
| `epic:created`           | `POST /epics`                                      |
| `epic:updated`           | `PUT /epics/{epicId}`                              |
| `epic:deleted`           | `DELETE /epics/{epicId}`                           |
| `story:created`          | `POST /stories`                                    |
| `story:updated`          | `PUT /stories/{storyId}`                           |
| `story:status_changed`   | `PATCH /stories/{storyId}/status`                  |
| `story:reordered`        | `PATCH /stories/reorder`                           |
| `story:deleted`          | `DELETE /stories/{storyId}`                        |
| `task:created`           | `POST /stories/{storyId}/tasks`                    |
| `task:updated`           | `PUT /stories/{storyId}/tasks/{taskId}`            |
| `task:completed`         | `PATCH /stories/{storyId}/tasks/{taskId}/complete` |
| `task:reordered`         | `PATCH /stories/{storyId}/tasks/reorder`           |
| `task:deleted`           | `DELETE /stories/{storyId}/tasks/{taskId}`         |
