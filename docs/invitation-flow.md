# 초대 흐름 명세 (백엔드 기준)

> 최종 수정: 2026-06-04  
> 대상 독자: 프론트엔드 개발자

---

## 1. 변경 사항 요약

초대 수락 전에는 멤버 목록에 해당 사용자가 노출되지 않습니다.

| 이전                                                        | 현재                                               |
| ----------------------------------------------------------- | -------------------------------------------------- |
| 초대 발송 시 멤버 목록에 `status: "PENDING"` 항목 즉시 노출 | 초대 발송 시 멤버 목록에 아무 변화 없음            |
| 수락 후 `status: "ACTIVE"` 로 전환                          | 수락 후 멤버 목록에 처음 등장 (`status: "ACTIVE"`) |

`GET /api/teamspaces/{teamspaceId}/members`는 이제 실제로 팀스페이스에 가입이 완료된 멤버만 반환합니다.

---

## 2. 초대 발송

### 엔드포인트

| 방법                   | URL                                                 | 설명                                        |
| ---------------------- | --------------------------------------------------- | ------------------------------------------- |
| 단건 (기존)            | `POST /api/invitations`                             | body: `teamspaceId`, `inviteeEmail`, `role` |
| 단건 (팀스페이스 경로) | `POST /api/teamspaces/{teamspaceId}/members/invite` | body: `email` / 역할은 MEMBER 고정          |
| 일괄 (최대 8명)        | `POST /api/teamspaces/{teamspaceId}/invitations`    | body: `emails[]`                            |

### 발송 후 서버 동작

1. 중복·권한 검증 후 `invitation` 테이블에 행 생성 (status = `PENDING`)
2. 초대 토큰(`UUID`)을 포함한 링크를 수신자 이메일로 발송
   - 링크 형태: `https://{backendDomain}/api/invitations/accept?token={UUID}`
   - 유효 시간: **48시간**
3. 메일 발송 실패는 서버 로그만 남기고 API는 성공으로 응답 (메일 서버 장애가 초대 자체를 막지 않음)

### 초대 불가 케이스 (API 에러 응답)

| 에러 코드                 | 원인                                   |
| ------------------------- | -------------------------------------- |
| `ALREADY_MEMBER`          | 이미 팀스페이스에 가입된 사용자        |
| `ALREADY_INVITED`         | 해당 이메일로 PENDING 초대가 이미 존재 |
| `INSUFFICIENT_PERMISSION` | VIEWER 권한으로 초대 시도              |
| `NOT_TEAMSPACE_OWNER`     | 일괄 초대를 OWNER 외 역할이 시도       |
| `INVITATION_001`          | 일괄 초대 8명 초과                     |

---

## 3. 수락 흐름

이메일 링크는 **백엔드 URL**을 직접 가리킵니다. 브라우저가 이 URL에 접근하면 백엔드가 상황에 따라 프론트엔드로 리다이렉트합니다.

### 3-A. 로그인 상태에서 링크 클릭

```
브라우저
  → GET https://{backendDomain}/api/invitations/accept?token={UUID}
      (access_token 쿠키 존재)
  ← 302 Location: https://{frontendDomain}/main/{docId}   (성공)
  ← 302 Location: https://{frontendDomain}/              (이미 멤버)
  ← 302 Location: https://{frontendDomain}/?error={CODE} (그 외 오류)
```

성공 시 `access_token` / `refresh_token` 쿠키는 이미 유효하므로 추가 인증 없이 문서 페이지에 진입 가능합니다.

### 3-B. 비로그인 상태에서 링크 클릭 (신규 또는 기존 회원)

```
브라우저
  → GET https://{backendDomain}/api/invitations/accept?token={UUID}
      (access_token 쿠키 없음)
  ← 302 Location: /oauth2/authorization/github
     + Set-Cookie: pending_invite_token={UUID}; HttpOnly; Path=/; MaxAge=600
                   (SameSite=None;Secure — 프로덕션 / Lax — 개발)

브라우저
  → GitHub OAuth 인증 진행

GitHub
  → GET https://{backendDomain}/login/oauth2/code/github?code=...
      (pending_invite_token 쿠키 자동 첨부)

백엔드 OAuth 콜백 처리
  → JWT 발급 (access_token, refresh_token 쿠키 설정)
  → pending_invite_token 쿠키 감지 → 초대 자동 수락
  → pending_invite_token 쿠키 삭제 (MaxAge=0)
  ← 302 Location: https://{frontendDomain}/main/{docId}   (성공)
  ← 302 Location: https://{frontendDomain}/?error={CODE}  (수락 실패)
  ← 302 Location: https://{frontendDomain}/               (초대 처리 없이 로그인만 성공한 경우)
```

#### pending_invite_token 쿠키 특성

- **이름**: `pending_invite_token`
- **값**: 초대 토큰 UUID
- **유효 시간**: 10분 (OAuth 플로우를 완료하기 충분한 시간)
- **범위**: 백엔드 도메인 전체 (`Path=/`)
- 이 쿠키는 백엔드 도메인에만 존재하며 프론트엔드에서 직접 읽을 필요 없음

#### 신규 회원 처리

GitHub OAuth 로그인 시 Aidea에 가입 이력이 없으면 자동으로 계정이 생성됩니다. 이후 초대 수락 → 멤버 등록까지 동일한 흐름으로 처리됩니다.

---

## 4. 수락 후 JWT 쿠키

OAuth 콜백(3-B 흐름) 또는 기존 로그인 상태(3-A 흐름) 모두, 프론트엔드에 도달하는 시점에 아래 두 쿠키가 설정되어 있습니다.

| 쿠키 이름       | 용도                | 유효 시간 | 특성                        |
| --------------- | ------------------- | --------- | --------------------------- |
| `access_token`  | API 요청 인증       | 30분      | HttpOnly, SameSite=None/Lax |
| `refresh_token` | access_token 재발급 | 14일      | HttpOnly, SameSite=None/Lax |

프론트엔드는 API 호출 시 이 쿠키를 자동으로 브라우저가 첨부합니다 (`credentials: 'include'` 필요). 쿠키 값을 JavaScript에서 직접 읽을 수 없습니다(HttpOnly).

---

## 5. 수락 실패 에러 코드

3-A / 3-B 양쪽에서 실패 시 프론트엔드는 `/?error={CODE}` 형태의 쿼리 파라미터를 받습니다.

| `error` 값             | 원인                                                           | 권장 안내 메시지                                                   |
| ---------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------ |
| `INVITATION_EXPIRED`   | 링크 48시간 초과 또는 이미 수락됨                              | "초대 링크가 만료되었습니다. 초대를 다시 요청하세요."              |
| `INVITATION_NOT_FOUND` | 유효하지 않은 토큰 또는 초대받은 이메일과 다른 계정으로 로그인 | "유효하지 않은 초대입니다. 초대받은 이메일 계정으로 로그인하세요." |
| `ALREADY_MEMBER`       | 이미 팀스페이스 멤버                                           | "이미 팀원입니다."                                                 |
| `INTERNAL_ERROR`       | 서버 내부 오류                                                 | "오류가 발생했습니다. 잠시 후 다시 시도하세요."                    |

`/?error=` 파라미터가 존재하는 경우 홈 화면 진입 시 적절한 토스트 또는 모달로 사용자에게 안내하는 것을 권장합니다.

---

## 6. SPA에서 토큰 직접 수락 (선택적 흐름)

이미 로그인된 SPA 환경에서 초대 토큰을 직접 처리하고 싶다면 POST 엔드포인트를 사용할 수 있습니다.

```
POST /api/invitations/accept
Content-Type: application/json

{ "token": "{UUID}" }
```

**응답**

```json
{
  "message": "팀스페이스에 참여하였습니다.",
  "data": { "docId": "{documentId 또는 빈 문자열}" }
}
```

`docId`가 비어 있으면 해당 팀스페이스에 문서가 없는 상태입니다. 이 엔드포인트는 로그인 상태에서만 동작하며, 미로그인 시 401 응답합니다.

---

## 7. 초대 취소

OWNER 권한이 있는 멤버만 가능합니다.

```
DELETE /api/teamspaces/{teamspaceId}/invitations/{invitationId}
```

`invitationId`는 초대 발송 API 응답이나 별도의 pending 초대 목록 조회가 있다면 거기서 얻어야 합니다. 현재 멤버 목록 API(`GET /api/teamspaces/{id}/members`)에서는 pending 항목이 노출되지 않으므로, 초대 취소 UI가 필요하다면 백엔드에 pending 초대 목록 API 추가를 요청하거나 일괄 초대 응답 결과를 프론트엔드 상태로 유지하는 방식을 사용하세요.

---

## 8. 알려진 제약

- 초대받은 이메일과 다른 GitHub 계정으로 로그인하면 `INVITATION_NOT_FOUND` 오류가 발생합니다. 이 경우 에러 메시지를 "초대받은 이메일 계정으로 로그인하세요"로 안내하는 것이 적절합니다.
- `pending_invite_token` 쿠키 유효 시간은 10분이므로 OAuth 인증이 10분 이상 지연되면 토큰이 소실되어 로그인은 성공하지만 초대 수락은 되지 않습니다. 이때 사용자는 `/?error` 없이 `/`로 리다이렉트됩니다.
- 팀스페이스에 문서가 없는 경우 수락 성공 후 `/`로 리다이렉트됩니다 (`docId`가 없음).
