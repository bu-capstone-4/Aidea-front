# Aidea API 분석 — MSW 구현 기준 문서

> Swagger(OpenAPI 3.0.3) 기반 분석. MSW 핸들러 구현 시 이 문서를 기준으로 사용.

---

## 1. 공통 사항

### 서버 주소

| 환경       | URL                     |
| ---------- | ----------------------- |
| Local      | `http://localhost:8080` |
| Production | `https://api.aidea.com` |

### 인증 방식

**httpOnly 쿠키** 기반으로 인증합니다. JS에서 토큰에 직접 접근하지 않으며, 브라우저가 쿠키를 자동으로 전송합니다.

| 쿠키명          | 만료 | 속성                           |
| --------------- | ---- | ------------------------------ |
| `access_token`  | 30분 | HttpOnly, Secure, SameSite=Lax |
| `refresh_token` | 14일 | HttpOnly, Secure, SameSite=Lax |

- `Authorization` 헤더 **사용하지 않음**
- 인증 상태 확인: `GET /api/auth/me` 호출 → 200이면 로그인, 401이면 비로그인
- OAuth 제공자: **GitHub만** 지원

### 공통 응답 형식

```ts
interface ApiResponse<T = null> {
  success: boolean;
  code: string | null;
  message: string | null;
  data: T | null;
}
```

### 에러 코드 목록

| 코드             | 메시지                                  |
| ---------------- | --------------------------------------- |
| `AUTH_003`       | 유효하지 않은 토큰입니다.               |
| `AUTH_004`       | 만료된 토큰입니다.                      |
| `TEAMSPACE_001`  | 팀스페이스를 찾을 수 없습니다.          |
| `INVITATION_001` | 유효하지 않거나 만료된 초대 토큰입니다. |
| `DOCUMENT_001`   | 문서를 찾을 수 없습니다.                |
| `DOCUMENT_002`   | 아이디어 문서는 삭제할 수 없습니다.     |

---

## 2. 스키마 (TypeScript 기준)

```ts
// 유저
interface UserResponse {
  id: number;
  email: string;
  name: string;
  profileImageUrl: string | null;
  provider: 'GITHUB';
}

// 팀스페이스
type DocumentType = 'IDEA' | 'PLAN' | 'USER_SCENARIO' | 'API_SPEC' | 'ERD';
type TeamspaceStatus = 'CREATING' | 'CREATED';

interface TeamspaceSummary {
  teamspaceId: string;
  name: string;
  memberCount: number;
  status: TeamspaceStatus;
  createdAt: string; // ISO 8601
}

interface TeamspaceDetail {
  teamspaceId: string;
  name: string;
  status: TeamspaceStatus;
  documents: DocumentSummary[];
  members: MemberInfo[];
  createdAt: string;
}

// 멤버
interface MemberInfo {
  userId: number | null; // PENDING 상태면 null
  name: string | null;
  email: string;
  role: 'OWNER' | 'MEMBER';
  status: 'ACTIVE' | 'PENDING';
  profileImageUrl: string | null;
}

// 문서
interface DocumentSummary {
  id: string;
  type: DocumentType;
  title: string;
  updatedAt: string;
  updatedBy: string | null;
}

interface DocumentDetail {
  id: string;
  teamspaceId: string;
  type: DocumentType;
  title: string;
  yjsBinary: string; // Base64 인코딩된 Yjs binary
  updatedAt: string;
  updatedBy: string | null;
}

// 피드백
interface FeedbackResponse {
  feedbackId: string;
  status: 'PENDING' | 'DONE' | 'ACCEPTED';
}
```

---

## 3. 엔드포인트 전체 목록 (22개)

### Auth (5개)

| #   | Method | Path                           | 인증 | 설명                                         |
| --- | ------ | ------------------------------ | ---- | -------------------------------------------- |
| 1   | `GET`  | `/api/oauth2/authorize/github` | ❌   | GitHub OAuth 페이지로 리다이렉트             |
| 2   | `GET`  | `/api/oauth2/callback/github`  | ❌   | GitHub 콜백 처리, httpOnly 쿠키 발급 후 이동 |
| 3   | `POST` | `/api/auth/refresh`            | ❌   | access_token 갱신 (쿠키 자동 전송)           |
| 4   | `POST` | `/api/auth/logout`             | ✅   | 로그아웃, 쿠키 만료 처리                     |
| 5   | `GET`  | `/api/auth/me`                 | ✅   | 내 정보 조회 (인증 상태 확인용)              |

### Teamspace (3개)

| #   | Method | Path                           | 인증 | 설명                             |
| --- | ------ | ------------------------------ | ---- | -------------------------------- |
| 6   | `POST` | `/api/teamspaces`              | ✅   | 팀스페이스 생성 (상태: CREATING) |
| 7   | `GET`  | `/api/teamspaces`              | ✅   | 내 팀스페이스 목록 조회          |
| 8   | `GET`  | `/api/teamspaces/:teamspaceId` | ✅   | 팀스페이스 상세 조회             |

### Invitation (3개)

| #   | Method   | Path                                                     | 인증 | 설명                             |
| --- | -------- | -------------------------------------------------------- | ---- | -------------------------------- |
| 9   | `POST`   | `/api/teamspaces/:teamspaceId/invitations`               | ✅   | 팀원 초대 이메일 발송 (최대 8명) |
| 10  | `POST`   | `/api/invitations/accept`                                | ✅   | 초대 토큰으로 수락               |
| 11  | `DELETE` | `/api/teamspaces/:teamspaceId/invitations/:invitationId` | ✅   | 대기 중 초대 취소 (OWNER)        |

### Member (3개)

| #   | Method   | Path                                             | 인증 | 설명                         |
| --- | -------- | ------------------------------------------------ | ---- | ---------------------------- |
| 12  | `GET`    | `/api/teamspaces/:teamspaceId/members`           | ✅   | 멤버 목록 조회               |
| 13  | `POST`   | `/api/teamspaces/:teamspaceId/members/invite`    | ✅   | 멤버 관리 모달에서 단건 초대 |
| 14  | `DELETE` | `/api/teamspaces/:teamspaceId/members/:memberId` | ✅   | 멤버 추방 (OWNER)            |

### Document (6개)

| #   | Method   | Path                                        | 인증 | 설명                                 |
| --- | -------- | ------------------------------------------- | ---- | ------------------------------------ |
| 15  | `GET`    | `/api/documents?teamspaceId=`               | ✅   | 팀스페이스 내 문서 목록              |
| 16  | `POST`   | `/api/documents`                            | ✅   | 문서 추가 생성 (사이드바 + 추가하기) |
| 17  | `GET`    | `/api/documents/:documentId`                | ✅   | 문서 상세 조회 (yjsBinary 포함)      |
| 18  | `PATCH`  | `/api/documents/:documentId`                | ✅   | 문서 제목 수정                       |
| 19  | `DELETE` | `/api/documents/:documentId`                | ✅   | 문서 삭제 (IDEA 타입 불가)           |
| 20  | `GET`    | `/api/documents/:documentId/export?format=` | ✅   | 문서 내보내기 (md \| pdf)            |

### Feedback (2개)

| #   | Method | Path                                  | 인증 | 설명                          |
| --- | ------ | ------------------------------------- | ---- | ----------------------------- |
| 21  | `POST` | `/api/documents/:documentId/feedback` | ✅   | AI 피드백 요청 → 202 Accepted |
| 22  | `POST` | `/api/feedbacks/:feedbackId/accept`   | ✅   | AI 피드백 수락 및 문서에 적용 |

---

## 4. 엔드포인트 상세 명세

### Auth

#### GitHub OAuth 전체 흐름

```
1. 프론트 → GET /api/oauth2/authorize/github
   백엔드 → 302 redirect → https://github.com/login/oauth/authorize?client_id=...

2. GitHub 인증 완료
   GitHub → 백엔드 GET /api/oauth2/callback/github?code=xxx
   백엔드:
     - code로 GitHub access token 교환
     - GitHub 사용자 정보 조회
     - JWT 생성 (access_token: 30분, refresh_token: 14일)
     - 응답 헤더에 httpOnly 쿠키 설정:
         Set-Cookie: access_token=...; HttpOnly; Secure; SameSite=Lax; Max-Age=1800
         Set-Cookie: refresh_token=...; HttpOnly; Secure; SameSite=Lax; Max-Age=1209600
     - 302 redirect → http://localhost:5173/ (URL에 토큰 없음)

3. 이후 모든 API 요청: 브라우저가 쿠키 자동 전송
```

#### GET /api/oauth2/authorize/github

```
인증: 불필요
Response: 302 redirect → GitHub OAuth 인증 페이지
```

#### GET /api/oauth2/callback/github

```
인증: 불필요
Query: ?code=xxx (GitHub에서 전달)

Response 302:
  Set-Cookie: access_token=...; HttpOnly; Secure; SameSite=Lax; Max-Age=1800
  Set-Cookie: refresh_token=...; HttpOnly; Secure; SameSite=Lax; Max-Age=1209600
  Location: http://localhost:5173/
```

#### POST /api/auth/refresh

```
인증: 불필요 (refresh_token 쿠키 자동 전송)
Request body: 없음

Response 200:
  Set-Cookie: access_token=...; HttpOnly; Secure; SameSite=Lax; Max-Age=1800
  body: ApiResponse (message: "토큰이 갱신되었습니다.")

Response 401: ErrorResponse (AUTH_003 | AUTH_004)
```

#### POST /api/auth/logout

```
인증: 필요 (access_token 쿠키)
Request body: 없음

Response 200:
  Set-Cookie: access_token=; Max-Age=0
  Set-Cookie: refresh_token=; Max-Age=0
  body: ApiResponse (message: "로그아웃 성공")
```

#### GET /api/auth/me

```
인증: 필요 (access_token 쿠키)
Response 200: ApiResponse<UserResponse>
Response 401: ErrorResponse — 비로그인 상태 확인에 사용
```

---

### Teamspace

#### POST /api/teamspaces

```
Request:
  {
    name: string,            // 팀스페이스 이름
    idea: string,            // 아이디어 설명 (필수)
    documents: DocumentType[]  // IDEA는 항상 포함
  }

Response 201:
  ApiResponse<{ teamspaceId: string }>

Note: 생성 직후 status = "CREATING"
      백그라운드에서 Gemini API 호출로 각 문서 AI 초안 생성 시작
```

#### GET /api/teamspaces

```
Response 200: ApiResponse<TeamspaceSummary[]>
```

#### GET /api/teamspaces/:teamspaceId

```
Response 200: ApiResponse<TeamspaceDetail>
Response 404: ErrorResponse (TEAMSPACE_001)
```

---

### Invitation

#### POST /api/teamspaces/:teamspaceId/invitations

```
Request: { emails: string[] }  // 최대 8개
Response 200: ApiResponse<{ invitedCount: number }>
Response 400: ErrorResponse (이메일 형식 오류)

초대 링크 형식: /invite?token={inviteToken}
```

#### POST /api/invitations/accept

```
Request: { token: string }
Response 200: ApiResponse<{ teamspaceId: string }>
Response 400: ErrorResponse (INVITATION_001)

수락 후 이동: /teamspace/{teamspaceId}
```

#### DELETE /api/teamspaces/:teamspaceId/invitations/:invitationId

```
Response 200: ApiResponse (message: "초대가 취소되었습니다.")
권한: OWNER only
```

---

### Member

#### GET /api/teamspaces/:teamspaceId/members

```
Response 200: ApiResponse<MemberInfo[]>
// ACTIVE(가입 완료) + PENDING(초대 대기) 멤버 포함
```

#### POST /api/teamspaces/:teamspaceId/members/invite

```
Request: { email: string }  // 단건
Response 200: ApiResponse (message: "초대가 발송되었습니다.")
```

#### DELETE /api/teamspaces/:teamspaceId/members/:memberId

```
Response 200: ApiResponse (message: "멤버가 추방되었습니다.")
권한: OWNER only
```

---

### Document

#### GET /api/documents?teamspaceId=

```
Response 200: ApiResponse<DocumentSummary[]>
```

#### POST /api/documents

```
Request:
  {
    teamspaceId: string,
    type: DocumentType,
    title?: string  // 미입력 시 type 기반 기본값
  }

Response 201:
  ApiResponse<{ id: string, type: DocumentType, title: string, createdAt: string }>
```

#### GET /api/documents/:documentId

```
Response 200: ApiResponse<DocumentDetail>
  // yjsBinary: Base64 인코딩된 Yjs binary (실시간 편집은 WebSocket)
Response 404: ErrorResponse (DOCUMENT_001)
```

#### PATCH /api/documents/:documentId

```
Request:  { title: string }
Response 200: ApiResponse<{ id: string, title: string }>
```

#### DELETE /api/documents/:documentId

```
Response 200: ApiResponse (message: "문서가 삭제되었습니다.")
Response 400: ErrorResponse (DOCUMENT_002) — IDEA 타입 삭제 불가
```

#### GET /api/documents/:documentId/export?format=md|pdf

```
Response 200: 바이너리 파일 다운로드 (application/octet-stream)
```

---

### Feedback

#### POST /api/documents/:documentId/feedback

```
Request: { additionalRequest?: string }  // 선택사항

Response 202:
  ApiResponse<FeedbackResponse>
  // 예: { feedbackId: "fb_001", status: "PENDING" }

서버 비동기 흐름:
  1. DB에서 문서 + IDEA 문서의 yjsBinary 조회
  2. feedbacks 테이블 INSERT (status: PENDING)
  3. 202 응답 반환
  4. Gemini API 호출
  5. 결과 저장, status → DONE
  6. WebSocket broadcast: feedback:ready 이벤트

주의: 피드백 요청 중 해당 문서는 편집 잠금(locked) 상태
```

#### POST /api/feedbacks/:feedbackId/accept

```
Response 200:
  ApiResponse<{ documentId: string, yjsBinary: string }>

서버 흐름:
  1. feedbacks.revisedYjsBinary 조회
  2. 문서 yjsBinary를 afterSnapshotBinary로 교체
  3. WebSocket broadcast: versionApplied 이벤트
  4. feedback status → ACCEPTED
  5. DocumentLock 해제
```

---

## 5. MSW 구현 시 주의사항

### httpOnly 쿠키 한계

Service Worker는 브라우저 보안 정책상 `Set-Cookie: ...; HttpOnly` 쿠키를 설정할 수 없습니다.
MSW에서는 **일반 쿠키**로 흉내 내며, 토큰 흐름 자체는 실제 서버와 동일하게 유지합니다.

```
실제 서버: Set-Cookie: access_token=...; HttpOnly; Secure
MSW:       Set-Cookie: access_token=...  (HttpOnly 없음)

→ 개발 환경에서만 사용, 보안은 프론트엔드 배포 시 실제 서버가 담당
```

### 비동기 처리가 필요한 엔드포인트

| 엔드포인트                                 | 이유                                                          |
| ------------------------------------------ | ------------------------------------------------------------- |
| `POST /api/teamspaces`                     | CREATING → CREATED 상태 전환 시뮬레이션 필요                  |
| `POST /api/documents/:documentId/feedback` | 202 응답 후 `feedback:ready` WebSocket 이벤트 시뮬레이션 필요 |
| `POST /api/feedbacks/:feedbackId/accept`   | `versionApplied` WebSocket 이벤트 시뮬레이션 필요             |

### WebSocket 이벤트 (MSW로 커버 불가)

- `feedback:ready` — AI 피드백 완료 알림
- `versionApplied` — 피드백 수락 후 문서 버전 적용

### 인증 불필요 엔드포인트 (3개)

- `GET /api/oauth2/authorize/github`
- `GET /api/oauth2/callback/github`
- `POST /api/auth/refresh`

### 특수 동작

- OAuth 콜백은 URL에 토큰 없이 httpOnly 쿠키 설정 후 `/`로 리다이렉트
- 문서 내보내기는 JSON이 아닌 바이너리 응답 (`application/octet-stream`)
- IDEA 타입 문서는 삭제 불가 (400 에러)
- 초대 이메일은 최대 8개 제한

### 목 데이터 설계 권고

- `teamspaceId`: `"ts_abc123"` 형식
- `documentId`: `"doc_001"` ~ `"doc_005"` 형식
- `feedbackId`: `"fb_001"` 형식
- `userId`: 숫자 (int64)
- `yjsBinary`: 빈 Base64 문자열로 대체 (`""`)
