import { http, HttpResponse } from 'msw';
import { invitations, teamspaces, members, nextInvitationId, nextInviteToken } from '../db';
import { requireAuth } from '../helpers';
import type { InviteRequest, AcceptInvitationRequest } from './types';

export const invitationHandlers = [
  // POST /api/teamspaces/:teamspaceId/invitations — 팀원 초대
  http.post('/api/teamspaces/:teamspaceId/invitations', async ({ request, params }) => {
    const authError = requireAuth();
    if (authError) return authError;

    const { teamspaceId } = params;
    const body = (await request.json()) as InviteRequest;

    const newInvitations = body.emails.map((email) => ({
      invitationId: nextInvitationId(),
      teamspaceId: teamspaceId as string,
      email,
      token: nextInviteToken(),
      status: 'PENDING' as const,
    }));

    invitations.push(...newInvitations);

    const ts = teamspaces.find((t) => t.teamspaceId === teamspaceId);
    if (ts) {
      newInvitations.forEach(({ email }) => {
        if (!ts.members.some((m) => m.email === email)) {
          ts.members.push({
            userId: null,
            name: null,
            email,
            role: 'MEMBER',
            status: 'PENDING',
            profileImageUrl: null,
          });
        }
      });
    }

    return HttpResponse.json({
      success: true,
      code: null,
      message: '초대가 발송되었습니다.',
      data: { invitedCount: newInvitations.length },
    });
  }),

  // POST /api/invitations/accept — 초대 수락
  http.post('/api/invitations/accept', async ({ request }) => {
    const authError = requireAuth();
    if (authError) return authError;

    const body = (await request.json()) as AcceptInvitationRequest;
    const invitation = invitations.find((inv) => inv.token === body.token);

    if (!invitation) {
      return HttpResponse.json(
        {
          success: false,
          code: 'INVITATION_001',
          message: '유효하지 않거나 만료된 초대 토큰입니다.',
        },
        { status: 400 }
      );
    }

    const ts = teamspaces.find((t) => t.teamspaceId === invitation.teamspaceId);
    if (ts) {
      const pendingMember = ts.members.find((m) => m.email === invitation.email);
      if (pendingMember) {
        pendingMember.userId = Date.now();
        pendingMember.name = invitation.email.split('@')[0];
        pendingMember.status = 'ACTIVE';
      }
    }

    if (!members.some((m) => m.email === invitation.email)) {
      members.push({
        userId: Date.now(),
        name: invitation.email.split('@')[0],
        email: invitation.email,
        role: 'MEMBER',
        status: 'ACTIVE',
        profileImageUrl: null,
      });
    }

    invitations.splice(invitations.indexOf(invitation), 1);

    return HttpResponse.json({
      success: true,
      code: null,
      message: '팀스페이스에 참여하였습니다.',
      data: { teamspaceId: invitation.teamspaceId },
    });
  }),

  // DELETE /api/teamspaces/:teamspaceId/invitations/:invitationId — 초대 취소
  http.delete('/api/teamspaces/:teamspaceId/invitations/:invitationId', ({ params }) => {
    const authError = requireAuth();
    if (authError) return authError;

    const { teamspaceId, invitationId } = params;
    const idx = invitations.findIndex(
      (inv) => inv.invitationId === invitationId && inv.teamspaceId === teamspaceId
    );

    if (idx !== -1) {
      const cancelled = invitations[idx];
      invitations.splice(idx, 1);

      const ts = teamspaces.find((t) => t.teamspaceId === teamspaceId);
      if (ts) {
        const memberIdx = ts.members.findIndex(
          (m) => m.email === cancelled.email && m.status === 'PENDING'
        );
        if (memberIdx !== -1) ts.members.splice(memberIdx, 1);
      }
    }

    return HttpResponse.json({
      success: true,
      code: null,
      message: '초대가 취소되었습니다.',
      data: null,
    });
  }),
];
