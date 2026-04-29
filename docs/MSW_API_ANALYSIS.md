# Aidea API 분석 — MSW 구현 기준 문서

> Swagger(OpenAPI 3.0.3) 기반 분석. MSW 핸들러 구현 시 이 문서를 기준으로 사용.

---

## 1. 공통 사항

### 서버 주소

| 환경       | URL                     |
| ---------- | ----------------------- |
| Local      | `http://localhost:8080` |
| Production | `https://api.aidea.com` |

### 인증

- 방식: `Authorization: Bearer {accessToken}`
- Access Token: 30분
- Refresh Token: 14일
- 소셜 로그인: Google, Kakao

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
// 토큰
interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string; // "Bearer"
  expiresIn: number; // 1800000 (30분, ms)
}

// 유저
interface UserResponse {
  id: number;
  email: string;
  name: string;
  profileImageUrl: string | null;
  provider: 'LOCAL' | 'GOOGLE' | 'KAKAO';
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

## 3. 엔드포인트 전체 목록 (21개)

### Auth (4개)

| #   | Method | Path                             | 인증 | 설명                            |
| --- | ------ | -------------------------------- | ---- | ------------------------------- |
| 1   | `GET`  | `/api/oauth2/callback/:provider` | ❌   | 소셜 로그인 콜백 (302 redirect) |
| 2   | `POST` | `/api/auth/refresh`              | ❌   | Access Token 갱신               |
| 3   | `POST` | `/api/auth/logout`               | ✅   | 로그아웃 (Refresh Token 무효화) |
| 4   | `GET`  | `/api/auth/me`                   | ✅   | 내 정보 조회                    |

### Teamspace (3개)

| #   | Method | Path                           | 인증 | 설명                             |
| --- | ------ | ------------------------------ | ---- | -------------------------------- |
| 5   | `POST` | `/api/teamspaces`              | ✅   | 팀스페이스 생성 (상태: CREATING) |
| 6   | `GET`  | `/api/teamspaces`              | ✅   | 내 팀스페이스 목록 조회          |
| 7   | `GET`  | `/api/teamspaces/:teamspaceId` | ✅   | 팀스페이스 상세 조회             |

### Invitation (3개)

| #   | Method   | Path                                                     | 인증 | 설명                             |
| --- | -------- | -------------------------------------------------------- | ---- | -------------------------------- |
| 8   | `POST`   | `/api/teamspaces/:teamspaceId/invitations`               | ✅   | 팀원 초대 이메일 발송 (최대 8명) |
| 9   | `POST`   | `/api/invitations/accept`                                | ✅   | 초대 토큰으로 수락               |
| 10  | `DELETE` | `/api/teamspaces/:teamspaceId/invitations/:invitationId` | ✅   | 대기 중 초대 취소 (OWNER)        |

### Member (3개)

| #   | Method   | Path                                             | 인증 | 설명                         |
| --- | -------- | ------------------------------------------------ | ---- | ---------------------------- |
| 11  | `GET`    | `/api/teamspaces/:teamspaceId/members`           | ✅   | 멤버 목록 조회               |
| 12  | `POST`   | `/api/teamspaces/:teamspaceId/members/invite`    | ✅   | 멤버 관리 모달에서 단건 초대 |
| 13  | `DELETE` | `/api/teamspaces/:teamspaceId/members/:memberId` | ✅   | 멤버 추방 (OWNER)            |

### Document (6개)

| #   | Method   | Path                                        | 인증 | 설명                                 |
| --- | -------- | ------------------------------------------- | ---- | ------------------------------------ |
| 14  | `GET`    | `/api/documents?teamspaceId=`               | ✅   | 팀스페이스 내 문서 목록              |
| 15  | `POST`   | `/api/documents`                            | ✅   | 문서 추가 생성 (사이드바 + 추가하기) |
| 16  | `GET`    | `/api/documents/:documentId`                | ✅   | 문서 상세 조회 (yjsBinary 포함)      |
| 17  | `PATCH`  | `/api/documents/:documentId`                | ✅   | 문서 제목 수정                       |
| 18  | `DELETE` | `/api/documents/:documentId`                | ✅   | 문서 삭제 (IDEA 타입 불가)           |
| 19  | `GET`    | `/api/documents/:documentId/export?format=` | ✅   | 문서 내보내기 (md \| pdf)            |

### Feedback (2개)

| #   | Method | Path                                  | 인증 | 설명                          |
| --- | ------ | ------------------------------------- | ---- | ----------------------------- |
| 20  | `POST` | `/api/documents/:documentId/feedback` | ✅   | AI 피드백 요청 → 202 Accepted |
| 21  | `POST` | `/api/feedbacks/:feedbackId/accept`   | ✅   | AI 피드백 수락 및 문서에 적용 |

---

## 4. 엔드포인트 상세 명세

### Auth

#### POST /api/auth/refresh

```
Request:  { refreshToken: string }
Response 200: ApiResponse<TokenResponse>
Response 401: ErrorResponse (AUTH_003 | AUTH_004)
```

#### GET /api/auth/me

```
Response 200: ApiResponse<UserResponse>
```

---

### Teamspace

#### POST /api/teamspaces

```
Request:
  {
    name: string,          // 팀스페이스 이름
    idea: string,          // 아이디어 설명 (필수)
    documents: DocumentType[]  // IDEA는 항상 포함
  }

Response 201:
  ApiResponse<{ teamspaceId: string }>
  // 예: { teamspaceId: "ts_abc123" }

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
  // 예: { id: "doc_005", type: "ERD", title: "ERD", createdAt: "2026-04-24T11:00:00" }
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

### 비동기 처리가 필요한 엔드포인트

| 엔드포인트                                 | 이유                                                          |
| ------------------------------------------ | ------------------------------------------------------------- |
| `POST /api/teamspaces`                     | CREATING → CREATED 상태 전환 시뮬레이션 필요                  |
| `POST /api/documents/:documentId/feedback` | 202 응답 후 `feedback:ready` WebSocket 이벤트 시뮬레이션 필요 |
| `POST /api/feedbacks/:feedbackId/accept`   | `versionApplied` WebSocket 이벤트 시뮬레이션 필요             |

### WebSocket 이벤트 (MSW로 커버 불가)

- `feedback:ready` — AI 피드백 완료 알림
- `versionApplied` — 피드백 수락 후 문서 버전 적용

### 인증 불필요 엔드포인트 (2개)

- `GET /api/oauth2/callback/:provider`
- `POST /api/auth/refresh`

### 특수 동작

- 소셜 로그인 콜백은 302 redirect → `http://localhost:3000/oauth/callback?accessToken=...&refreshToken=...`
- 문서 내보내기는 JSON이 아닌 바이너리 응답 (`application/octet-stream`)
- IDEA 타입 문서는 삭제 불가 (400 에러)
- 초대 이메일은 최대 8개 제한

### 목 데이터 설계 권고

- `teamspaceId`: `"ts_abc123"` 형식
- `documentId`: `"doc_001"` ~ `"doc_005"` 형식
- `feedbackId`: `"fb_001"` 형식
- `userId`: 숫자 (int64)
- `yjsBinary`: 빈 Base64 문자열로 대체 (`""`)
