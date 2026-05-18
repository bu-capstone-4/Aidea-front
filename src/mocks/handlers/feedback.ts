import { http, HttpResponse } from 'msw';
import { feedbacks, documents, nextFeedbackId } from '../db';
import { requireAuth } from '../helpers';

export const feedbackHandlers = [
  // POST /api/documents/:documentId/feedback — AI 피드백 요청
  http.post('/api/documents/:documentId/feedback', async ({ params }) => {
    const authError = requireAuth();
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
      if (fb) {
        fb.status = 'DONE';
        fb.revisedMarkdown = '# AI 피드백 적용 결과\n\nAI가 문서를 검토하고 개선안을 제안합니다.';
      }
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

  // GET /api/feedbacks/:feedbackId — 피드백 상태 조회
  http.get('/api/feedbacks/:feedbackId', ({ params }) => {
    const authError = requireAuth();
    if (authError) return authError;

    const fb = feedbacks.find((f) => f.feedbackId === params.feedbackId);

    if (!fb) {
      return HttpResponse.json(
        { success: false, code: null, message: '피드백을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      code: null,
      message: null,
      data: {
        feedbackId: fb.feedbackId,
        status: fb.status,
        revisedMarkdown: fb.revisedMarkdown ?? null,
      },
    });
  }),

  // POST /api/feedbacks/:feedbackId/accept — AI 피드백 수락
  http.post('/api/feedbacks/:feedbackId/accept', ({ params }) => {
    const authError = requireAuth();
    if (authError) return authError;

    const fb = feedbacks.find((f) => f.feedbackId === params.feedbackId);

    if (!fb) {
      return HttpResponse.json(
        { success: false, code: null, message: '피드백을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    fb.status = 'ACCEPTED';

    return HttpResponse.json({
      success: true,
      code: null,
      message: '피드백이 수락되었습니다.',
      data: null,
    });
  }),

  // POST /api/feedbacks/:feedbackId/reject — AI 피드백 거절
  http.post('/api/feedbacks/:feedbackId/reject', ({ params }) => {
    const authError = requireAuth();
    if (authError) return authError;

    const fb = feedbacks.find((f) => f.feedbackId === params.feedbackId);

    if (!fb) {
      return HttpResponse.json(
        { success: false, code: null, message: '피드백을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    fb.status = 'REJECTED';

    return HttpResponse.json({
      success: true,
      code: null,
      message: '피드백이 거절되었습니다.',
      data: null,
    });
  }),

  // POST /api/feedbacks/:feedbackId/answers — 추가 질문 답변 제출
  http.post('/api/feedbacks/:feedbackId/answers', ({ params }) => {
    const authError = requireAuth();
    if (authError) return authError;

    const fb = feedbacks.find((f) => f.feedbackId === params.feedbackId);

    if (!fb) {
      return HttpResponse.json(
        { success: false, code: null, message: '피드백을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    fb.status = 'ANSWERING';

    return HttpResponse.json(
      { success: true, code: null, message: '답변이 제출되었습니다.', data: null },
      { status: 202 }
    );
  }),
];
