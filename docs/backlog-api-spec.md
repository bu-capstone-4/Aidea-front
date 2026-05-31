# 백로그 API / WebSocket 명세서

> 기준 브랜치: `feat/79-backlog-co-op`  
> Base URL: `http://{host}/api`  
> WebSocket Base: `ws://{host}/ws`

---

## 목차

1. [공통 규칙](#1-공통-규칙)
2. [공통 타입 정의](#2-공통-타입-정의)
3. [백로그 설정 API](#3-백로그-설정-api)
4. [에픽 API](#4-에픽-api)
5. [스토리 API](#5-스토리-api)
6. [스토리 하위 태스크 API](#6-스토리-하위-태스크-api)
7. [독립 백로그 태스크 API](#7-독립-백로그-태스크-api)
8. [오류 코드](#8-오류-코드)
9. [WebSocket 명세](#9-websocket-명세)

---

## 1. 공통 규칙

### 1.1 인증

모든 REST API 요청은 인증이 필요하다.  
JWT 토큰을 아래 방법 중 하나로 전달한다.

| 방법               | 형식                                                |
| ------------------ | --------------------------------------------------- |
| Authorization 헤더 | `Authorization: Bearer {access_token}`              |
| HttpOnly 쿠키      | `access_token={access_token}` (로그인 후 자동 설정) |

### 1.2 응답 래퍼

모든 REST 응답은 아래 구조로 래핑된다.

```json
{
  "success": true,
  "code": null,
  "message": "success",
  "data": {}
}
```

오류 응답:

```json
{
  "success": false,
  "code": "EPIC_NOT_FOUND",
  "message": "에픽을 찾을 수 없습니다.",
  "data": null
}
```

### 1.3 권한 매트릭스

| 역할   | 조회 | 생성 / 수정 / 삭제               |
| ------ | ---- | -------------------------------- |
| OWNER  | ✅   | ✅                               |
| MEMBER | ✅   | ✅                               |
| VIEWER | ✅   | ❌ `403 INSUFFICIENT_PERMISSION` |

팀스페이스 미소속 사용자는 모든 요청에서 `403 NOT_TEAMSPACE_MEMBER`를 반환한다.

### 1.4 BacklogConfig 필드 제약

BacklogConfig로 비활성화된 필드를 요청 본문에 포함하면 `422 BACKLOG_CONFIG_FIELD_NOT_ALLOWED` 오류가 반환된다.

| 설정 플래그              | 비활성화 시 사용 불가 필드 |
| ------------------------ | -------------------------- |
| `feBeEnabled: false`     | `issueType`                |
| `priorityEnabled: false` | `priority`                 |
| `sprintEnabled: false`   | `sprint`                   |
| `dueDateEnabled: false`  | `dueDate`                  |
| `epicEnabled: false`     | Epic 생성 자체 불가        |
| `storyEnabled: false`    | Story 생성 자체 불가       |

### 1.5 날짜/시간 형식

| 타입            | 형식     | 예시                    |
| --------------- | -------- | ----------------------- |
| `LocalDateTime` | ISO 8601 | `"2026-05-23T14:30:00"` |
| `LocalDate`     | ISO 8601 | `"2026-06-01"`          |

---

## 2. 공통 타입 정의

### 2.1 Enum

#### StoryStatus

| 값            | 설명                        |
| ------------- | --------------------------- |
| `OPEN`        | 시작 전                     |
| `IN_PROGRESS` | 진행 중                     |
| `DONE`        | 완료 (`closedAt` 자동 설정) |
| `CLOSED`      | 종료 (`closedAt` 자동 설정) |

#### EpicStatus

| 값            | 설명                        |
| ------------- | --------------------------- |
| `OPEN`        | 시작 전                     |
| `IN_PROGRESS` | 진행 중                     |
| `DONE`        | 완료 (`closedAt` 자동 설정) |
| `CLOSED`      | 종료 (`closedAt` 자동 설정) |

#### Priority

| 값       | 설명 |
| -------- | ---- |
| `LOW`    | 낮음 |
| `MEDIUM` | 보통 |
| `HIGH`   | 높음 |
| `URGENT` | 긴급 |

#### IssueType

| 값   | 설명       |
| ---- | ---------- |
| `FE` | 프론트엔드 |
| `BE` | 백엔드     |

### 2.2 공통 응답 객체

#### UserResponse

| 필드              | 타입     | 설명              |
| ----------------- | -------- | ----------------- |
| `id`              | `number` | 유저 ID           |
| `name`            | `string` | 유저 이름         |
| `githubLogin`     | `string` | GitHub 로그인 ID  |
| `profileImageUrl` | `string` | 프로필 이미지 URL |

#### EpicSummaryResponse

| 필드    | 타입     | 설명                      |
| ------- | -------- | ------------------------- |
| `id`    | `number` | 에픽 ID                   |
| `name`  | `string` | 에픽 이름                 |
| `color` | `string` | 에픽 색상 (hex `#RRGGBB`) |

#### BacklogConfigResponse

| 필드              | 타입      | 설명                        |
| ----------------- | --------- | --------------------------- |
| `teamspaceId`     | `string`  | 팀스페이스 ID               |
| `feBeEnabled`     | `boolean` | FE/BE 구분 기능 활성화 여부 |
| `epicEnabled`     | `boolean` | 에픽 기능 활성화 여부       |
| `storyEnabled`    | `boolean` | 스토리 기능 활성화 여부     |
| `priorityEnabled` | `boolean` | 우선순위 필드 활성화 여부   |
| `sprintEnabled`   | `boolean` | 스프린트 필드 활성화 여부   |
| `dueDateEnabled`  | `boolean` | 마감일 필드 활성화 여부     |

> 설정이 한 번도 저장된 적 없으면 모든 플래그가 `false`인 기본값을 반환한다.

#### EpicResponse

| 필드                  | 타입                   | 설명                                 |
| --------------------- | ---------------------- | ------------------------------------ |
| `id`                  | `number`               | 에픽 ID                              |
| `number`              | `number`               | 팀스페이스 내 고유 채번 (1부터 순증) |
| `name`                | `string`               | 에픽 이름                            |
| `color`               | `string`               | 에픽 색상 (hex `#RRGGBB`)            |
| `description`         | `string \| null`       | 에픽 설명                            |
| `status`              | `EpicStatus`           | 에픽 상태                            |
| `priority`            | `Priority \| null`     | 우선순위                             |
| `issueType`           | `IssueType \| null`    | FE/BE 구분                           |
| `assignee`            | `UserResponse \| null` | 담당자                               |
| `reporter`            | `UserResponse`         | 생성자                               |
| `dueDate`             | `string \| null`       | 마감일 (LocalDate)                   |
| `position`            | `number`               | 정렬 순서 값 (1000 단위)             |
| `storyCount`          | `number`               | 연결된 전체 스토리 수                |
| `completedStoryCount` | `number`               | 완료(DONE/CLOSED)된 스토리 수        |
| `createdAt`           | `string`               | 생성 일시                            |
| `updatedAt`           | `string`               | 수정 일시                            |
| `closedAt`            | `string \| null`       | 종료 일시                            |

#### StorySummaryResponse

| 필드                 | 타입                    | 설명                                 |
| -------------------- | ----------------------- | ------------------------------------ |
| `id`                 | `number`                | 스토리 ID                            |
| `number`             | `number`                | 팀스페이스 내 고유 채번 (1부터 순증) |
| `title`              | `string`                | 스토리 제목                          |
| `status`             | `StoryStatus`           | 상태                                 |
| `priority`           | `Priority \| null`      | 우선순위                             |
| `issueType`          | `IssueType \| null`     | FE/BE 구분                           |
| `sprint`             | `string \| null`        | 스프린트 명                          |
| `epics`              | `EpicSummaryResponse[]` | 연결된 에픽 목록                     |
| `assignee`           | `UserResponse \| null`  | 담당자                               |
| `reporter`           | `UserResponse`          | 보고자                               |
| `taskCount`          | `number`                | 전체 하위 태스크 수                  |
| `completedTaskCount` | `number`                | 완료된 하위 태스크 수                |
| `dueDate`            | `string \| null`        | 마감일 (LocalDate)                   |
| `position`           | `number`                | 정렬 순서 값                         |
| `createdAt`          | `string`                | 생성 일시                            |
| `updatedAt`          | `string`                | 수정 일시                            |

#### StoryDetailResponse

`StorySummaryResponse`의 모든 필드 + 아래 추가 필드:

| 필드       | 타입             | 설명                                      |
| ---------- | ---------------- | ----------------------------------------- |
| `body`     | `string \| null` | 스토리 본문                               |
| `closedAt` | `string \| null` | 종료 일시 (DONE/CLOSED 전환 시 자동 설정) |
| `tasks`    | `TaskResponse[]` | 하위 태스크 목록 (position 오름차순)      |

#### StoryStatusResponse

| 필드       | 타입             | 설명        |
| ---------- | ---------------- | ----------- |
| `id`       | `number`         | 스토리 ID   |
| `status`   | `StoryStatus`    | 변경된 상태 |
| `closedAt` | `string \| null` | 종료 일시   |

#### TaskResponse (스토리 하위)

| 필드          | 타입                   | 설명         |
| ------------- | ---------------------- | ------------ |
| `id`          | `number`               | 태스크 ID    |
| `title`       | `string`               | 태스크 제목  |
| `issueType`   | `IssueType \| null`    | FE/BE 구분   |
| `isCompleted` | `boolean`              | 완료 여부    |
| `assignee`    | `UserResponse \| null` | 담당자       |
| `position`    | `number`               | 정렬 순서 값 |
| `createdAt`   | `string`               | 생성 일시    |

#### BacklogTaskResponse (독립 태스크)

| 필드        | 타입                   | 설명                    |
| ----------- | ---------------------- | ----------------------- |
| `id`        | `number`               | 태스크 ID               |
| `number`    | `number`               | 팀스페이스 내 고유 채번 |
| `title`     | `string`               | 태스크 제목             |
| `status`    | `StoryStatus`          | 상태                    |
| `priority`  | `Priority \| null`     | 우선순위                |
| `issueType` | `IssueType \| null`    | FE/BE 구분              |
| `sprint`    | `string \| null`       | 스프린트 명             |
| `assignee`  | `UserResponse \| null` | 담당자                  |
| `reporter`  | `UserResponse \| null` | 보고자                  |
| `dueDate`   | `string \| null`       | 마감일 (LocalDate)      |
| `position`  | `number`               | 정렬 순서 값            |
| `createdAt` | `string`               | 생성 일시               |
| `updatedAt` | `string`               | 수정 일시               |

#### ReorderRequest / ReorderResponse

```json
{ "orderedIds": [3, 1, 2] }
```

> `orderedIds`에 포함된 항목만 position이 갱신된다. 누락된 항목의 position은 변경되지 않는다.  
> 서버는 인덱스 기반으로 `(index + 1) × 1000` 값을 position에 부여한다.

---

## 3. 백로그 설정 API

### GET `/api/teamspaces/{teamspaceId}/backlog/config`

팀스페이스의 백로그 기능 설정 조회. 설정이 없으면 모든 플래그가 `false`인 기본값 반환.

**권한**: 모든 멤버

**Response 200**

```json
{
  "teamspaceId": "ts-abc123",
  "feBeEnabled": false,
  "epicEnabled": true,
  "storyEnabled": true,
  "priorityEnabled": true,
  "sprintEnabled": false,
  "dueDateEnabled": true
}
```

---

### PUT `/api/teamspaces/{teamspaceId}/backlog/config`

백로그 설정 저장. 없으면 생성, 있으면 전체 덮어씀.

**권한**: MEMBER, OWNER

**Request Body**

| 필드              | 타입      | 설명                   |
| ----------------- | --------- | ---------------------- |
| `feBeEnabled`     | `boolean` | FE/BE 구분 기능 활성화 |
| `epicEnabled`     | `boolean` | 에픽 기능 활성화       |
| `storyEnabled`    | `boolean` | 스토리 기능 활성화     |
| `priorityEnabled` | `boolean` | 우선순위 필드 활성화   |
| `sprintEnabled`   | `boolean` | 스프린트 필드 활성화   |
| `dueDateEnabled`  | `boolean` | 마감일 필드 활성화     |

**Response 200** — `BacklogConfigResponse`

> 저장 시 WebSocket `backlog:config_updated` 이벤트가 다른 접속자에게 브로드캐스트됨.

---

## 4. 에픽 API

### GET `/api/teamspaces/{teamspaceId}/epics`

팀스페이스의 에픽 목록 조회. `position` 오름차순 정렬. 각 에픽에 연결된 스토리 수 포함.

**권한**: 모든 멤버

**Response 200** — `EpicResponse[]`

---

### POST `/api/teamspaces/{teamspaceId}/epics`

에픽 생성. `reporter`(생성자)는 요청한 사용자로 자동 설정됨.

**권한**: MEMBER, OWNER  
**조건**: `epicEnabled: true`이어야 함

**Request Body**

| 필드          | 타입        | 필수 | 제약                | 설명                              |
| ------------- | ----------- | :--: | ------------------- | --------------------------------- |
| `name`        | `string`    |  ✅  | NotBlank            | 에픽 이름                         |
| `color`       | `string`    |  ✅  | `^#[0-9a-fA-F]{6}$` | hex 색상 코드                     |
| `description` | `string`    |  —   | —                   | 에픽 설명                         |
| `priority`    | `Priority`  |  —   | —                   | 우선순위 (`priorityEnabled` 필요) |
| `issueType`   | `IssueType` |  —   | —                   | FE/BE 구분 (`feBeEnabled` 필요)   |
| `assigneeId`  | `number`    |  —   | —                   | 담당자 사용자 ID                  |
| `dueDate`     | `string`    |  —   | `yyyy-MM-dd`        | 마감일 (`dueDateEnabled` 필요)    |

**Response 201** — `EpicResponse`

> 생성 시 WebSocket `epic:created` 브로드캐스트.

---

### PUT `/api/teamspaces/{teamspaceId}/epics/{epicId}`

에픽 전체 수정.

**권한**: MEMBER, OWNER

**Request Body** — `CreateEpicRequest`와 동일 구조

**Response 200** — `EpicResponse`

> 수정 시 WebSocket `epic:updated` 브로드캐스트.

---

### PATCH `/api/teamspaces/{teamspaceId}/epics/{epicId}/status`

에픽 상태만 변경. `DONE`/`CLOSED`로 전환 시 `closedAt` 자동 설정.

**권한**: MEMBER, OWNER

**Request Body**

| 필드     | 타입         | 필수 | 설명        |
| -------- | ------------ | :--: | ----------- |
| `status` | `EpicStatus` |  ✅  | 변경할 상태 |

**Response 200** — `EpicResponse`

> 변경 시 WebSocket `epic:status_changed` 브로드캐스트.

---

### PATCH `/api/teamspaces/{teamspaceId}/epics/reorder`

에픽 순서(position) 일괄 변경.

**권한**: MEMBER, OWNER

**Request Body**

| 필드         | 타입       | 필수 | 설명                          |
| ------------ | ---------- | :--: | ----------------------------- |
| `orderedIds` | `number[]` |  ✅  | 새 순서로 정렬된 에픽 ID 배열 |

**Response 200** — `ReorderResponse`

> 변경 시 WebSocket `epic:reordered` 브로드캐스트.

---

### DELETE `/api/teamspaces/{teamspaceId}/epics/{epicId}`

에픽 삭제. 연결된 StoryEpic 관계도 함께 삭제됨.

**권한**: MEMBER, OWNER

**Response 204** — 본문 없음

> 삭제 시 WebSocket `epic:deleted` 브로드캐스트.

---

## 5. 스토리 API

### GET `/api/teamspaces/{teamspaceId}/stories`

스토리 목록 조회. 여러 필터 조합 가능. 결과는 `position` 오름차순 정렬.

**권한**: 모든 멤버

**Query Parameters** (모두 선택)

| 파라미터     | 타입          | 설명                                                          |
| ------------ | ------------- | ------------------------------------------------------------- |
| `status`     | `StoryStatus` | 상태 필터 (반복 지정 가능: `?status=OPEN&status=IN_PROGRESS`) |
| `epicId`     | `number`      | 특정 에픽에 연결된 스토리만                                   |
| `assigneeId` | `number`      | 특정 담당자의 스토리만                                        |
| `priority`   | `Priority`    | 특정 우선순위의 스토리만                                      |

**Response 200** — `StorySummaryResponse[]`

---

### GET `/api/teamspaces/{teamspaceId}/stories/{storyId}`

스토리 상세 조회. 하위 태스크 목록 포함.

**권한**: 모든 멤버

**Response 200** — `StoryDetailResponse`

---

### POST `/api/teamspaces/{teamspaceId}/stories`

스토리 생성. `reporter`는 요청한 사용자로 자동 설정. 초기 상태는 요청 본문의 `status` (없으면 `OPEN`).

**권한**: MEMBER, OWNER  
**조건**: `storyEnabled: true`이어야 함

**Request Body**

| 필드         | 타입          | 필수 | 제약         | 설명                               |
| ------------ | ------------- | :--: | ------------ | ---------------------------------- |
| `title`      | `string`      |  ✅  | NotBlank     | 스토리 제목                        |
| `body`       | `string`      |  —   | —            | 스토리 본문                        |
| `status`     | `StoryStatus` |  —   | —            | 초기 상태                          |
| `priority`   | `Priority`    |  —   | —            | 우선순위 (`priorityEnabled` 필요)  |
| `issueType`  | `IssueType`   |  —   | —            | FE/BE 구분 (`feBeEnabled` 필요)    |
| `sprint`     | `string`      |  —   | —            | 스프린트 명 (`sprintEnabled` 필요) |
| `epicIds`    | `number[]`    |  —   | —            | 연결할 에픽 ID 목록                |
| `assigneeId` | `number`      |  —   | —            | 담당자 사용자 ID                   |
| `dueDate`    | `string`      |  —   | `yyyy-MM-dd` | 마감일 (`dueDateEnabled` 필요)     |

**Response 201** — `StoryDetailResponse`

> 생성 시 WebSocket `story:created` 브로드캐스트.

---

### PUT `/api/teamspaces/{teamspaceId}/stories/{storyId}`

스토리 전체 수정. 상태 변경은 이 엔드포인트에서 불가 (상태 변경 전용 엔드포인트 사용).

**권한**: MEMBER, OWNER

**Request Body**

| 필드         | 타입        | 필수 | 제약         | 설명                          |
| ------------ | ----------- | :--: | ------------ | ----------------------------- |
| `title`      | `string`    |  ✅  | NotBlank     | 스토리 제목                   |
| `body`       | `string`    |  —   | —            | 스토리 본문                   |
| `priority`   | `Priority`  |  —   | —            | 우선순위                      |
| `issueType`  | `IssueType` |  —   | —            | FE/BE 구분                    |
| `sprint`     | `string`    |  —   | —            | 스프린트 명                   |
| `epicIds`    | `number[]`  |  —   | —            | 연결 에픽 ID 목록 (전체 교체) |
| `assigneeId` | `number`    |  —   | —            | 담당자 사용자 ID              |
| `dueDate`    | `string`    |  —   | `yyyy-MM-dd` | 마감일                        |

> `epicIds`는 전체 교체 방식. 빈 배열 전달 시 모든 에픽 연결 해제.

**Response 200** — `StoryDetailResponse`

> 수정 시 WebSocket `story:updated` 브로드캐스트.

---

### PATCH `/api/teamspaces/{teamspaceId}/stories/{storyId}/status`

스토리 상태만 변경. `DONE`/`CLOSED`로 전환 시 `closedAt` 자동 설정.

**권한**: MEMBER, OWNER

**Request Body**

| 필드     | 타입          | 필수 | 설명        |
| -------- | ------------- | :--: | ----------- |
| `status` | `StoryStatus` |  ✅  | 변경할 상태 |

**Response 200** — `StoryStatusResponse`

> 변경 시 WebSocket `story:status_changed` 브로드캐스트.

---

### PATCH `/api/teamspaces/{teamspaceId}/stories/reorder`

스토리 순서(position) 일괄 변경.

**권한**: MEMBER, OWNER

**Request Body**

| 필드         | 타입       | 필수 | 설명                            |
| ------------ | ---------- | :--: | ------------------------------- |
| `orderedIds` | `number[]` |  ✅  | 새 순서로 정렬된 스토리 ID 배열 |

**Response 200** — `ReorderResponse`

> 변경 시 WebSocket `story:reordered` 브로드캐스트.

---

### DELETE `/api/teamspaces/{teamspaceId}/stories/{storyId}`

스토리 삭제. 하위 태스크와 에픽 연결(StoryEpic)도 함께 삭제됨.

**권한**: MEMBER, OWNER

**Response 204** — 본문 없음

> 삭제 시 WebSocket `story:deleted` 브로드캐스트.

---

## 6. 스토리 하위 태스크 API

스토리에 속한 세부 체크리스트 항목. 상태/우선순위/스프린트/마감일 없이 제목·담당자·완료여부만 관리.

### POST `/api/teamspaces/{teamspaceId}/stories/{storyId}/tasks`

스토리 하위 태스크 생성. 초기 `isCompleted`는 항상 `false`.

**권한**: MEMBER, OWNER

**Request Body**

| 필드         | 타입        | 필수 | 제약     | 설명                            |
| ------------ | ----------- | :--: | -------- | ------------------------------- |
| `title`      | `string`    |  ✅  | NotBlank | 태스크 제목                     |
| `issueType`  | `IssueType` |  —   | —        | FE/BE 구분 (`feBeEnabled` 필요) |
| `assigneeId` | `number`    |  —   | —        | 담당자 사용자 ID                |

**Response 201** — `TaskResponse`

> 생성 시 WebSocket `task:created` 브로드캐스트.

---

### PUT `/api/teamspaces/{teamspaceId}/stories/{storyId}/tasks/{taskId}`

스토리 하위 태스크 수정. 완료 여부 변경은 토글 엔드포인트 사용.

**권한**: MEMBER, OWNER

**Request Body**

| 필드         | 타입        | 필수 | 제약     | 설명             |
| ------------ | ----------- | :--: | -------- | ---------------- |
| `title`      | `string`    |  ✅  | NotBlank | 태스크 제목      |
| `issueType`  | `IssueType` |  —   | —        | FE/BE 구분       |
| `assigneeId` | `number`    |  —   | —        | 담당자 사용자 ID |

**Response 200** — `TaskResponse`

> 수정 시 WebSocket `task:updated` 브로드캐스트.

---

### PATCH `/api/teamspaces/{teamspaceId}/stories/{storyId}/tasks/{taskId}/complete`

태스크 완료 상태 토글 (`false → true` 또는 `true → false`).

**권한**: MEMBER, OWNER

**Request Body**: 없음

**Response 200**

```json
{
  "id": 42,
  "isCompleted": true
}
```

> 변경 시 WebSocket `task:completed` 브로드캐스트.

---

### PATCH `/api/teamspaces/{teamspaceId}/stories/{storyId}/tasks/reorder`

스토리 하위 태스크 순서(position) 일괄 변경.

**권한**: MEMBER, OWNER

**Request Body**

| 필드         | 타입       | 필수 | 설명                            |
| ------------ | ---------- | :--: | ------------------------------- |
| `orderedIds` | `number[]` |  ✅  | 새 순서로 정렬된 태스크 ID 배열 |

**Response 200** — `ReorderResponse`

> 변경 시 WebSocket `task:reordered` 브로드캐스트.

---

### DELETE `/api/teamspaces/{teamspaceId}/stories/{storyId}/tasks/{taskId}`

스토리 하위 태스크 삭제.

**권한**: MEMBER, OWNER

**Response 204** — 본문 없음

> 삭제 시 WebSocket `task:deleted` 브로드캐스트.

---

## 7. 독립 백로그 태스크 API

스토리에 속하지 않는 독립적인 태스크. 스토리처럼 상태/우선순위/스프린트/마감일을 가짐.

### POST `/api/teamspaces/{teamspaceId}/tasks`

독립 백로그 태스크 생성. `reporter`는 요청한 사용자로 자동 설정.

**권한**: MEMBER, OWNER

**Request Body**

| 필드         | 타입          | 필수 | 제약         | 설명                               |
| ------------ | ------------- | :--: | ------------ | ---------------------------------- |
| `title`      | `string`      |  ✅  | NotBlank     | 태스크 제목                        |
| `status`     | `StoryStatus` |  —   | —            | 초기 상태                          |
| `priority`   | `Priority`    |  —   | —            | 우선순위 (`priorityEnabled` 필요)  |
| `issueType`  | `IssueType`   |  —   | —            | FE/BE 구분 (`feBeEnabled` 필요)    |
| `sprint`     | `string`      |  —   | —            | 스프린트 명 (`sprintEnabled` 필요) |
| `assigneeId` | `number`      |  —   | —            | 담당자 사용자 ID                   |
| `dueDate`    | `string`      |  —   | `yyyy-MM-dd` | 마감일 (`dueDateEnabled` 필요)     |

**Response 201** — `BacklogTaskResponse`

> 생성 시 WebSocket `backlogtask:created` 브로드캐스트.

---

### PUT `/api/teamspaces/{teamspaceId}/tasks/{taskId}`

독립 백로그 태스크 전체 수정.

**권한**: MEMBER, OWNER

**Request Body** — `CreateBacklogTaskRequest`와 동일 구조

**Response 200** — `BacklogTaskResponse`

> 수정 시 WebSocket `backlogtask:updated` 브로드캐스트.

---

### PATCH `/api/teamspaces/{teamspaceId}/tasks/{taskId}/status`

독립 백로그 태스크 상태만 변경.

**권한**: MEMBER, OWNER

**Request Body**

| 필드     | 타입          | 필수 | 설명        |
| -------- | ------------- | :--: | ----------- |
| `status` | `StoryStatus` |  ✅  | 변경할 상태 |

**Response 200** — `BacklogTaskResponse`

> 변경 시 WebSocket `backlogtask:status_changed` 브로드캐스트.

---

### PATCH `/api/teamspaces/{teamspaceId}/tasks/reorder`

독립 백로그 태스크 순서(position) 일괄 변경.

**권한**: MEMBER, OWNER

**Request Body**

| 필드         | 타입       | 필수 | 설명                            |
| ------------ | ---------- | :--: | ------------------------------- |
| `orderedIds` | `number[]` |  ✅  | 새 순서로 정렬된 태스크 ID 배열 |

**Response 200** — `ReorderResponse`

> 변경 시 WebSocket `backlogtask:reordered` 브로드캐스트.

---

### DELETE `/api/teamspaces/{teamspaceId}/tasks/{taskId}`

독립 백로그 태스크 삭제.

**권한**: MEMBER, OWNER

**Response 204** — 본문 없음

> 삭제 시 WebSocket `backlogtask:deleted` 브로드캐스트.

---

## 8. 오류 코드

| HTTP | code                               | 설명                    | 발생 상황                                           |
| ---- | ---------------------------------- | ----------------------- | --------------------------------------------------- |
| 400  | `INVALID_INPUT`                    | 입력값 검증 실패        | `@Valid` 검증 실패                                  |
| 401  | `UNAUTHORIZED`                     | 인증 필요               | 토큰 없음 또는 만료                                 |
| 403  | `NOT_TEAMSPACE_MEMBER`             | 팀스페이스 미소속       | 팀스페이스에 소속되지 않은 사용자 접근              |
| 403  | `INSUFFICIENT_PERMISSION`          | 권한 부족               | VIEWER 역할로 쓰기 요청                             |
| 404  | `USER_NOT_FOUND`                   | 사용자 없음             | assigneeId 등 존재하지 않는 사용자 ID 참조          |
| 404  | `EPIC_NOT_FOUND`                   | 에픽 없음               | epicId가 존재하지 않거나 해당 팀스페이스 소속 아님  |
| 404  | `STORY_NOT_FOUND`                  | 스토리 없음             | storyId가 존재하지 않거나 해당 팀스페이스 소속 아님 |
| 404  | `TASK_NOT_FOUND`                   | 스토리 하위 태스크 없음 | taskId가 존재하지 않거나 해당 스토리 소속 아님      |
| 404  | `BACKLOG_TASK_NOT_FOUND`           | 독립 태스크 없음        | taskId가 존재하지 않거나 독립 태스크가 아닌 경우    |
| 422  | `BACKLOG_CONFIG_FIELD_NOT_ALLOWED` | 비활성화 필드 사용      | 설정에서 비활성화된 필드를 요청 본문에 포함         |
| 500  | `INTERNAL_SERVER_ERROR`            | 서버 오류               | 서버 내부 오류                                      |

---

## 9. WebSocket 명세

### 9.1 연결

```
ws://{host}/ws/backlog/{teamspaceId}
```

**JWT 인증 방법** (우선순위 순서)

| 방법               | 형식                                   |
| ------------------ | -------------------------------------- |
| Authorization 헤더 | `Authorization: Bearer {access_token}` |
| 쿼리 파라미터      | `?token={access_token}`                |
| 쿠키               | `access_token={access_token}`          |

**연결 실패**

| HTTP 상태          | 원인                               |
| ------------------ | ---------------------------------- |
| `401 Unauthorized` | 토큰 없음 또는 유효하지 않은 토큰  |
| `403 Forbidden`    | 해당 팀스페이스의 멤버가 아닌 경우 |

---

### 9.2 연결 성공 시 초기 데이터 수신

연결이 수립되면 서버가 즉시 현재 상태 전체를 전송한다.

**`backlog:init`**

```json
{
  "type": "backlog:init",
  "config": BacklogConfigResponse,
  "epics": EpicResponse[],
  "stories": StorySummaryResponse[],
  "tasks": BacklogTaskResponse[],
  "onlineEditors": [
    {
      "id": "123",
      "name": "홍길동",
      "profileImageUrl": "https://..."
    }
  ]
}
```

| 필드            | 타입                     | 설명                                      |
| --------------- | ------------------------ | ----------------------------------------- |
| `config`        | `BacklogConfigResponse`  | 백로그 설정                               |
| `epics`         | `EpicResponse[]`         | 전체 에픽 목록 (position 오름차순)        |
| `stories`       | `StorySummaryResponse[]` | 전체 스토리 목록 (position 오름차순)      |
| `tasks`         | `BacklogTaskResponse[]`  | 전체 독립 태스크 목록 (position 오름차순) |
| `onlineEditors` | `object[]`               | 현재 접속 중인 멤버 목록                  |

---

### 9.3 클라이언트 → 서버

백로그 WebSocket은 **단방향(서버 → 클라이언트)** 브로드캐스트 전용이다.  
모든 변경 요청은 REST API를 통해 수행한다. 클라이언트가 WebSocket으로 메시지를 전송하면 서버는 오류로 응답한다.

---

### 9.4 서버 → 클라이언트 브로드캐스트 이벤트

REST API 호출로 변경이 발생하면 **요청자를 제외한** 같은 팀스페이스의 모든 WebSocket 연결자에게 브로드캐스트된다.

> 요청자 본인은 REST API 응답으로 결과를 수신하므로 WebSocket 이벤트는 수신되지 않는다.

모든 브로드캐스트 이벤트 공통 필드:

| 필드      | 타입     | 설명                             |
| --------- | -------- | -------------------------------- |
| `type`    | `string` | 이벤트 타입                      |
| `actorId` | `string` | 변경을 일으킨 사용자 ID (문자열) |

---

#### `backlog:presence`

멤버가 접속하거나 연결이 끊길 때마다 **모든** 접속자에게 브로드캐스트됨 (자신 포함).

```json
{
  "type": "backlog:presence",
  "onlineEditors": [
    { "id": "1", "name": "홍길동", "profileImageUrl": "https://..." },
    { "id": "2", "name": "김철수", "profileImageUrl": "https://..." }
  ]
}
```

---

#### `backlog:config_updated`

```json
{
  "type": "backlog:config_updated",
  "actorId": "1",
  "config": BacklogConfigResponse
}
```

---

#### `epic:created`

```json
{
  "type": "epic:created",
  "actorId": "1",
  "epic": EpicResponse
}
```

---

#### `epic:updated`

```json
{
  "type": "epic:updated",
  "actorId": "1",
  "epic": EpicResponse
}
```

---

#### `epic:status_changed`

```json
{
  "type": "epic:status_changed",
  "actorId": "1",
  "epicId": 10,
  "status": "DONE",
  "closedAt": "2026-05-23T15:00:00"
}
```

| 필드       | 타입             | 설명           |
| ---------- | ---------------- | -------------- |
| `epicId`   | `number`         | 변경된 에픽 ID |
| `status`   | `EpicStatus`     | 변경된 상태    |
| `closedAt` | `string \| null` | 종료 일시      |

---

#### `epic:reordered`

```json
{
  "type": "epic:reordered",
  "actorId": "1",
  "orderedIds": [3, 1, 2]
}
```

---

#### `epic:deleted`

```json
{
  "type": "epic:deleted",
  "actorId": "1",
  "epicId": 10
}
```

---

#### `story:created`

```json
{
  "type": "story:created",
  "actorId": "1",
  "story": StorySummaryResponse
}
```

---

#### `story:updated`

```json
{
  "type": "story:updated",
  "actorId": "1",
  "story": StorySummaryResponse
}
```

---

#### `story:status_changed`

```json
{
  "type": "story:status_changed",
  "actorId": "1",
  "storyId": 5,
  "status": "DONE",
  "closedAt": "2026-05-23T15:00:00"
}
```

| 필드       | 타입             | 설명             |
| ---------- | ---------------- | ---------------- |
| `storyId`  | `number`         | 변경된 스토리 ID |
| `status`   | `StoryStatus`    | 변경된 상태      |
| `closedAt` | `string \| null` | 종료 일시        |

---

#### `story:reordered`

```json
{
  "type": "story:reordered",
  "actorId": "1",
  "orderedIds": [5, 3, 8]
}
```

---

#### `story:deleted`

```json
{
  "type": "story:deleted",
  "actorId": "1",
  "storyId": 5
}
```

---

#### `task:created`

```json
{
  "type": "task:created",
  "actorId": "1",
  "storyId": 5,
  "task": TaskResponse
}
```

---

#### `task:updated`

```json
{
  "type": "task:updated",
  "actorId": "1",
  "storyId": 5,
  "task": TaskResponse
}
```

---

#### `task:completed`

```json
{
  "type": "task:completed",
  "actorId": "1",
  "storyId": 5,
  "taskId": 42,
  "isCompleted": true
}
```

| 필드          | 타입      | 설명                    |
| ------------- | --------- | ----------------------- |
| `storyId`     | `number`  | 태스크가 속한 스토리 ID |
| `taskId`      | `number`  | 변경된 태스크 ID        |
| `isCompleted` | `boolean` | 토글 후 완료 여부       |

---

#### `task:reordered`

```json
{
  "type": "task:reordered",
  "actorId": "1",
  "storyId": 5,
  "orderedIds": [22, 20, 21]
}
```

---

#### `task:deleted`

```json
{
  "type": "task:deleted",
  "actorId": "1",
  "storyId": 5,
  "taskId": 42
}
```

---

#### `backlogtask:created`

```json
{
  "type": "backlogtask:created",
  "actorId": "1",
  "task": BacklogTaskResponse
}
```

---

#### `backlogtask:updated`

```json
{
  "type": "backlogtask:updated",
  "actorId": "1",
  "task": BacklogTaskResponse
}
```

---

#### `backlogtask:status_changed`

```json
{
  "type": "backlogtask:status_changed",
  "actorId": "1",
  "taskId": 100,
  "status": "IN_PROGRESS"
}
```

---

#### `backlogtask:reordered`

```json
{
  "type": "backlogtask:reordered",
  "actorId": "1",
  "orderedIds": [100, 102, 101]
}
```

---

#### `backlogtask:deleted`

```json
{
  "type": "backlogtask:deleted",
  "actorId": "1",
  "taskId": 100
}
```

---

### 9.5 이벤트 타입 전체 요약

| type                         | 트리거 REST API                                    | 수신 대상               |
| ---------------------------- | -------------------------------------------------- | ----------------------- |
| `backlog:init`               | WebSocket 연결 직후 서버 자동 전송                 | 접속한 본인만           |
| `backlog:presence`           | 멤버 접속/해제                                     | 모든 접속자 (자신 포함) |
| `backlog:config_updated`     | `PUT /backlog/config`                              | 요청자 제외 전체        |
| `epic:created`               | `POST /epics`                                      | 요청자 제외 전체        |
| `epic:updated`               | `PUT /epics/{epicId}`                              | 요청자 제외 전체        |
| `epic:status_changed`        | `PATCH /epics/{epicId}/status`                     | 요청자 제외 전체        |
| `epic:reordered`             | `PATCH /epics/reorder`                             | 요청자 제외 전체        |
| `epic:deleted`               | `DELETE /epics/{epicId}`                           | 요청자 제외 전체        |
| `story:created`              | `POST /stories`                                    | 요청자 제외 전체        |
| `story:updated`              | `PUT /stories/{storyId}`                           | 요청자 제외 전체        |
| `story:status_changed`       | `PATCH /stories/{storyId}/status`                  | 요청자 제외 전체        |
| `story:reordered`            | `PATCH /stories/reorder`                           | 요청자 제외 전체        |
| `story:deleted`              | `DELETE /stories/{storyId}`                        | 요청자 제외 전체        |
| `task:created`               | `POST /stories/{storyId}/tasks`                    | 요청자 제외 전체        |
| `task:updated`               | `PUT /stories/{storyId}/tasks/{taskId}`            | 요청자 제외 전체        |
| `task:completed`             | `PATCH /stories/{storyId}/tasks/{taskId}/complete` | 요청자 제외 전체        |
| `task:reordered`             | `PATCH /stories/{storyId}/tasks/reorder`           | 요청자 제외 전체        |
| `task:deleted`               | `DELETE /stories/{storyId}/tasks/{taskId}`         | 요청자 제외 전체        |
| `backlogtask:created`        | `POST /tasks`                                      | 요청자 제외 전체        |
| `backlogtask:updated`        | `PUT /tasks/{taskId}`                              | 요청자 제외 전체        |
| `backlogtask:status_changed` | `PATCH /tasks/{taskId}/status`                     | 요청자 제외 전체        |
| `backlogtask:reordered`      | `PATCH /tasks/reorder`                             | 요청자 제외 전체        |
| `backlogtask:deleted`        | `DELETE /tasks/{taskId}`                           | 요청자 제외 전체        |
