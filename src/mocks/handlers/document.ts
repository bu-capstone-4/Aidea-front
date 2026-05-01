import { http, HttpResponse } from 'msw';
import { documents, teamspaces, nextDocId } from '../db';
import { requireAuth } from '../helpers';
import type { DocumentCreateRequest, DocumentUpdateRequest } from './types';

const DOC_TITLE_MAP: Record<string, string> = {
  IDEA: '아이디어',
  PLAN: '기획서',
  USER_SCENARIO: '유저 시나리오',
  API_SPEC: 'API 명세서',
  ERD: 'ERD',
};

export const documentHandlers = [
  // GET /api/documents?teamspaceId= — 문서 목록 조회
  http.get('/api/documents', ({ request }) => {
    const authError = requireAuth();
    if (authError) return authError;

    const url = new URL(request.url);
    const teamspaceId = url.searchParams.get('teamspaceId');

    const list = documents
      .filter((d) => d.teamspaceId === teamspaceId)
      .map(({ id, type, title, updatedAt, updatedBy }) => ({
        id,
        type,
        title,
        updatedAt,
        updatedBy,
      }));

    return HttpResponse.json({ success: true, code: null, message: null, data: list });
  }),

  // POST /api/documents — 문서 추가 생성
  http.post('/api/documents', async ({ request }) => {
    const authError = requireAuth();
    if (authError) return authError;

    const body = (await request.json()) as DocumentCreateRequest;
    const now = new Date().toISOString();
    const id = nextDocId();

    const newDoc = {
      id,
      teamspaceId: body.teamspaceId,
      type: body.type,
      title: body.title ?? DOC_TITLE_MAP[body.type] ?? body.type,
      yjsBinary: '',
      updatedAt: now,
      updatedBy: null,
    };

    documents.push(newDoc);

    const ts = teamspaces.find((t) => t.teamspaceId === body.teamspaceId);
    if (ts) {
      ts.documents.push({
        id: newDoc.id,
        type: newDoc.type,
        title: newDoc.title,
        updatedAt: now,
        updatedBy: null,
      });
    }

    return HttpResponse.json(
      {
        success: true,
        code: null,
        message: '문서가 생성되었습니다.',
        data: { id: newDoc.id, type: newDoc.type, title: newDoc.title, createdAt: now },
      },
      { status: 201 }
    );
  }),

  // GET /api/documents/:documentId — 문서 상세 조회
  http.get('/api/documents/:documentId', ({ params }) => {
    const authError = requireAuth();
    if (authError) return authError;

    const doc = documents.find((d) => d.id === params.documentId);

    if (!doc) {
      return HttpResponse.json(
        { success: false, code: 'DOCUMENT_001', message: '문서를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return HttpResponse.json({ success: true, code: null, message: null, data: doc });
  }),

  // PATCH /api/documents/:documentId — 문서 제목 수정
  http.patch('/api/documents/:documentId', async ({ request, params }) => {
    const authError = requireAuth();
    if (authError) return authError;

    const body = (await request.json()) as DocumentUpdateRequest;
    const doc = documents.find((d) => d.id === params.documentId);

    if (!doc) {
      return HttpResponse.json(
        { success: false, code: 'DOCUMENT_001', message: '문서를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    doc.title = body.title;
    doc.updatedAt = new Date().toISOString();

    const ts = teamspaces.find((t) => t.teamspaceId === doc.teamspaceId);
    if (ts) {
      const tsDoc = ts.documents.find((d) => d.id === doc.id);
      if (tsDoc) tsDoc.title = body.title;
    }

    return HttpResponse.json({
      success: true,
      code: null,
      message: '문서 제목이 수정되었습니다.',
      data: { id: doc.id, title: doc.title },
    });
  }),

  // DELETE /api/documents/:documentId — 문서 삭제
  http.delete('/api/documents/:documentId', ({ params }) => {
    const authError = requireAuth();
    if (authError) return authError;

    const idx = documents.findIndex((d) => d.id === params.documentId);

    if (idx === -1) {
      return HttpResponse.json(
        { success: false, code: 'DOCUMENT_001', message: '문서를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (documents[idx].type === 'IDEA') {
      return HttpResponse.json(
        { success: false, code: 'DOCUMENT_002', message: '아이디어 문서는 삭제할 수 없습니다.' },
        { status: 400 }
      );
    }

    const [deleted] = documents.splice(idx, 1);

    const ts = teamspaces.find((t) => t.teamspaceId === deleted.teamspaceId);
    if (ts) {
      const tsIdx = ts.documents.findIndex((d) => d.id === deleted.id);
      if (tsIdx !== -1) ts.documents.splice(tsIdx, 1);
    }

    return HttpResponse.json({
      success: true,
      code: null,
      message: '문서가 삭제되었습니다.',
      data: null,
    });
  }),

  // GET /api/documents/:documentId/export?format= — 문서 내보내기
  http.get('/api/documents/:documentId/export', ({ request, params }) => {
    const authError = requireAuth();
    if (authError) return authError;

    const url = new URL(request.url);
    const format = url.searchParams.get('format') ?? 'md';
    const doc = documents.find((d) => d.id === params.documentId);

    const content = `# ${doc?.title ?? '문서'}\n\n(mock export content)`;
    const blob = new Blob([content], {
      type: format === 'pdf' ? 'application/pdf' : 'text/markdown',
    });

    return new HttpResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': format === 'pdf' ? 'application/pdf' : 'text/markdown',
        'Content-Disposition': `attachment; filename="${doc?.title ?? 'document'}.${format}"`,
      },
    });
  }),
];
