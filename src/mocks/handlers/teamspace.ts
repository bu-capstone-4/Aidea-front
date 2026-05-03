import { http, HttpResponse } from 'msw';
import { teamspaces, documents } from '../db';
import { requireAuth } from '../helpers';
import type { TeamspaceCreateRequest } from './types';

const DOC_TITLE_MAP: Record<string, string> = {
  IDEA: '아이디어',
  PLAN: '기획서',
  USER_SCENARIO: '유저 시나리오',
  API_SPEC: 'API 명세서',
  ERD: 'ERD',
};

export const teamspaceHandlers = [
  // POST /api/teamspaces — 팀스페이스 생성
  http.post('/api/teamspaces', async ({ request }) => {
    const authError = requireAuth();
    if (authError) return authError;

    const body = (await request.json()) as TeamspaceCreateRequest;
    const teamspaceId = `ts_${Math.random().toString(36).slice(2, 9)}`;
    const now = new Date().toISOString();

    const newDocTypes = Array.from(new Set(['IDEA', ...body.documents])) as typeof body.documents;
    const newDocs = newDocTypes.map((type, i) => ({
      id: `doc_${teamspaceId}_${i + 1}`,
      teamspaceId,
      type,
      title: DOC_TITLE_MAP[type] ?? type,
      yjsBinary: '',
      updatedAt: now,
      updatedBy: null,
    }));

    const newTeamspace = {
      teamspaceId,
      name: body.name,
      status: 'CREATING' as const,
      documents: newDocs.map(({ id, type, title, updatedAt, updatedBy }) => ({
        id,
        type,
        title,
        updatedAt,
        updatedBy,
      })),
      members: [
        {
          userId: 1,
          name: '김민석',
          email: 'owner@aidea.com',
          role: 'OWNER' as const,
          status: 'ACTIVE' as const,
          profileImageUrl: null,
        },
      ],
      createdAt: now,
    };

    documents.push(...newDocs);
    teamspaces.push(newTeamspace);

    // CREATING → CREATED 상태 전환 시뮬레이션 (1.5초 후)
    setTimeout(() => {
      const ts = teamspaces.find((t) => t.teamspaceId === teamspaceId);
      if (ts) ts.status = 'CREATED';
    }, 1500);

    return HttpResponse.json(
      {
        success: true,
        code: null,
        message: '팀스페이스가 생성되었습니다.',
        data: { teamspaceId },
      },
      { status: 201 }
    );
  }),

  // GET /api/teamspaces — 팀스페이스 목록 조회
  http.get('/api/teamspaces', () => {
    const authError = requireAuth();
    if (authError) return authError;

    const list = teamspaces.map(({ teamspaceId, name, status, members: m, createdAt }) => ({
      teamspaceId,
      name,
      memberCount: m.length,
      status,
      createdAt,
    }));

    return HttpResponse.json({ success: true, code: null, message: null, data: list });
  }),

  // GET /api/teamspaces/:teamspaceId — 팀스페이스 상세 조회
  http.get('/api/teamspaces/:teamspaceId', ({ params }) => {
    const authError = requireAuth();
    if (authError) return authError;

    const ts = teamspaces.find((t) => t.teamspaceId === params.teamspaceId);

    if (!ts) {
      return HttpResponse.json(
        { success: false, code: 'TEAMSPACE_001', message: '팀스페이스를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const latestDocs = documents
      .filter((d) => d.teamspaceId === ts.teamspaceId)
      .map(({ id, type, title, updatedAt, updatedBy }) => ({
        id,
        type,
        title,
        updatedAt,
        updatedBy,
      }));

    return HttpResponse.json({
      success: true,
      code: null,
      message: null,
      data: { ...ts, documents: latestDocs },
    });
  }),
];
