# 백엔드 제안 사항

> 프론트엔드 구현 계획 수립 중 발견된 백엔드 API/WS 스펙 개선 제안.  
> 이 문서는 백엔드 팀에 전달하거나 논의 참고용으로 사용한다.

---

## 제안 1 — 백로그 WS에 온라인 편집자 이벤트 추가

**현황:**  
백로그 WS 스펙에 "온라인 멤버" 이벤트가 없다.  
디자인에는 "2명이 함께 편집 중" 표시와 아바타 스택이 있다.

**현재 대응:**  
임시로 팀스페이스 WS(`/ws/teamspace/{id}`)의 `onlineMembers`에서 전체 온라인 멤버 수를 재활용.  
그러나 팀스페이스 온라인과 "백로그 편집 중" 개념은 다름.

**제안:**  
백로그 WS에서 연결 시 `backlog:init`에 현재 세션 목록 포함:

```json
{
  "type": "backlog:init",
  "config": { ... },
  "epics": [ ... ],
  "stories": [ ... ],
  "onlineEditors": [
    { "id": 1, "name": "강민석", "profileImageUrl": "..." }
  ]
}
```

그리고 다른 유저가 접속/퇴장 시 브로드캐스트:

```json
{
  "type": "backlog:presence",
  "onlineEditors": [{ "id": 1, "name": "강민석", "profileImageUrl": "..." }]
}
```

---

## 제안 2 — 스토리 생성 API에 `status` 필드 지원

**현황:**  
`POST /stories` Request Body에 `status` 필드가 없다. 생성 시 기본값은 `OPEN`.

**문제:**  
보드 뷰에서 "진행 중" 컬럼의 "이슈 추가"를 누르면 해당 status로 생성되어야 함.  
현재 스펙으로는 생성 후 별도로 `PATCH .../status` 호출이 필요 (2-round trip).

**제안:**  
`CreateStoryRequest`에 `status` 필드 추가 (nullable, 기본값 `OPEN`):

```json
{
  "title": "새 스토리",
  "status": "IN_PROGRESS"
}
```

---

## 제안 3 — `UserResponse` 필드 일관성

**현황:**  
기존 인증/팀스페이스 API의 `UserResponse`:

```json
{ "id": 1, "email": "...", "name": "...", "profileImageUrl": "...", "provider": "GITHUB" }
```

백로그 스펙의 `UserResponse`:

```json
{ "id": 1, "name": "...", "githubLogin": "...", "profileImageUrl": "..." }
```

두 객체가 동일한 사용자이지만 필드명과 내용이 다름.

**프론트 대응:**  
`src/types/backlog.ts`에 `BacklogUser` 별도 정의로 처리.

**제안:**  
가능하면 백엔드의 전체 `UserResponse`를 통일하거나,  
백로그에서도 `githubLogin` 대신 기존 `email`/`provider` 포함 여부 확인 필요.  
또는 두 구조의 슈퍼셋으로 통일:

```json
{
  "id": 1,
  "name": "강민석",
  "profileImageUrl": "https://...",
  "githubLogin": "kang-min-seok" // GitHub 연동 시에만 포함
}
```

---

## 제안 4 — `epicEnabled=false` 상태에서 에픽 수정/삭제 허용 여부 명시

**현황:**  
스펙에 의하면 `epicEnabled=false`일 때 에픽 **생성**이 차단 (`POST`).  
그러나 기존에 생성된 에픽의 **수정**(`PUT`)과 **삭제**(`DELETE`)가 차단되는지 명시되지 않음.

**기대 동작:**  
생성은 차단, 수정/삭제는 허용 — 이미 만들어진 에픽은 관리 가능해야 함.

**확인 요청:**  
`epicEnabled=false`인 팀스페이스에서 `PUT /epics/{epicId}`, `DELETE /epics/{epicId}` 동작 확인.

---

## 제안 5 — `story:created` WS 이벤트에 `status` 포함 확인

**현황:**  
`story:created` 이벤트 페이로드가 `StorySummaryResponse` 전체를 포함 (스펙 예시에 `status: "OPEN"` 포함됨). 확인됨.

**추가 확인:**  
`story:updated` 이벤트도 `StorySummaryResponse` 전체를 포함하므로 `status` 변경이 `story:updated`로 브로드캐스트되는지, 아니면 `story:status_changed`만 오는지 확인 필요.

스펙에 따르면 `PUT /stories/{storyId}`는 `story:updated`를, `PATCH /stories/{storyId}/status`는 `story:status_changed`를 트리거함. 일관성 확인 필요.

---

## 제안 6 — AI 초안 생성 엔드포인트 (향후)

**현황:**  
백엔드에서 AI 초안 생성 미구현. 디자인의 "AI로 만들기" 버튼은 현재 일반 "만들기"로 처리.

**향후 구현 시 필요한 API:**

```
POST /api/teamspaces/{teamspaceId}/backlog/generate
Body: { config: BacklogConfigRequest, documentIds?: string[] }
```

또는 WebSocket을 통한 스트리밍 방식.

---

## 추가 발견 사항

_(구현 중 발견되는 추가 사항을 여기에 기록)_

| 날짜       | 내용                |
| ---------- | ------------------- |
| 2026-05-26 | 초기 제안 사항 작성 |
