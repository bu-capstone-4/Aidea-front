import { http, HttpResponse } from 'msw';
import { teamspaces, invitations, nextInvitationId, nextInviteToken } from '../db';
import type { MemberInfo } from '../types';
import { requireAuth } from '../helpers';

export const memberHandlers = [
  // GET /api/teamspaces/:teamspaceId/members — 멤버 목록 조회
  http.get('/api/teamspaces/:teamspaceId/members', ({ params }) => {
    const authError = requireAuth();
    if (authError) return authError;

    const ts = teamspaces.find((t) => t.teamspaceId === params.teamspaceId);

    return HttpResponse.json({
      success: true,
      code: null,
      message: null,
      data: ts?.members ?? [],
    });
  }),

  // POST /api/teamspaces/:teamspaceId/members/invite — 멤버 관리 모달 단건 초대
  http.post('/api/teamspaces/:teamspaceId/members/invite', async ({ request, params }) => {
    const authError = requireAuth();
    if (authError) return authError;

    const { teamspaceId } = params;
    const body = (await request.json()) as { email: string };

    invitations.push({
      invitationId: nextInvitationId(),
      teamspaceId: teamspaceId as string,
      email: body.email,
      token: nextInviteToken(),
      status: 'PENDING',
    });

    const ts = teamspaces.find((t) => t.teamspaceId === teamspaceId);
    if (ts && !ts.members.some((m) => m.email === body.email)) {
      ts.members.push({
        userId: null,
        name: null,
        email: body.email,
        role: 'MEMBER',
        status: 'PENDING',
        profileImageUrl: null,
      });
    }

    return HttpResponse.json({
      success: true,
      code: null,
      message: '초대가 발송되었습니다.',
      data: null,
    });
  }),

  // DELETE /api/teamspaces/:teamspaceId/members/:memberId — 멤버 추방
  http.delete('/api/teamspaces/:teamspaceId/members/:memberId', ({ params }) => {
    const authError = requireAuth();
    if (authError) return authError;

    const { teamspaceId, memberId } = params;
    const ts = teamspaces.find((t) => t.teamspaceId === teamspaceId);

    if (ts) {
      // userId(문자열) 또는 email(PENDING 멤버) 기준으로 삭제
      const idx = ts.members.findIndex(
        (m: MemberInfo) => String(m.userId) === memberId || m.email === memberId
      );
      if (idx !== -1) {
        const removed = ts.members[idx];
        ts.members.splice(idx, 1);
        // PENDING 멤버인 경우 초대도 함께 취소
        const invIdx = invitations.findIndex(
          (i) => i.teamspaceId === teamspaceId && i.email === removed.email
        );
        if (invIdx !== -1) invitations.splice(invIdx, 1);
      }
    }

    return HttpResponse.json({
      success: true,
      code: null,
      message: '멤버가 삭제되었습니다.',
      data: null,
    });
  }),
];
