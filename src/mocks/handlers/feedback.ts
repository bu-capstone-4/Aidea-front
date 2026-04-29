import { http, HttpResponse } from 'msw';
import { feedbacks, documents, nextFeedbackId } from '../db';
import { requireAuth } from '../helpers';

export const feedbackHandlers = [
  // POST /api/documents/:documentId/feedback — AI 피드백 요청
  http.post('/api/documents/:documentId/feedback', async ({ request, params }) => {
    const authError = requireAuth(request);
    if (authError) return authError;

    const { documentId } = params;
    const doc = documents.find((d) => d.id === documentId);

    if (!doc) {
      return HttpResponse.json(
        { success: false, code: 'DOCUMENT_001', message: '문서를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const feedbackId = nextFeedbackId();

    feedbacks.push({ feedbackId, documentId: documentId as string, status: 'PENDING' });

    // PENDING → DONE 전환 시뮬레이션 (2초 후)
    setTimeout(() => {
      const fb = feedbacks.find((f) => f.feedbackId === feedbackId);
      if (fb) fb.status = 'DONE';
    }, 2000);

    return HttpResponse.json(
      {
        success: true,
        code: null,
        message: 'AI 피드백을 생성하고 있습니다.',
        data: { feedbackId, status: 'PENDING' },
      },
      { status: 202 }
    );
  }),

  // POST /api/feedbacks/:feedbackId/accept — AI 피드백 수락
  http.post('/api/feedbacks/:feedbackId/accept', ({ request, params }) => {
    const authError = requireAuth(request);
    if (authError) return authError;

    const fb = feedbacks.find((f) => f.feedbackId === params.feedbackId);

    if (!fb) {
      return HttpResponse.json(
        { success: false, code: null, message: '피드백을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    fb.status = 'ACCEPTED';

    const doc = documents.find((d) => d.id === fb.documentId);

    return HttpResponse.json({
      success: true,
      code: null,
      message: '피드백이 적용되었습니다.',
      data: { documentId: fb.documentId, yjsBinary: doc?.yjsBinary ?? '' },
    });
  }),
];
