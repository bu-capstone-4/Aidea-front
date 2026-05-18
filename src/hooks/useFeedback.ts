import axios from 'axios';
import { apiClient } from '@/shared/apiClient';
import type { Answer, FeedbackStatus, Question } from '@/types/document';
import { useFeedbackStore } from '@/store/FeedbackStore';

// ── 상태 복원 유틸 ─────────────────────────────────────────────

interface FeedbackStatusData {
  feedbackId: string;
  status: FeedbackStatus;
  revisedMarkdown?: string | null;
  questions?: Question[] | null;
}

export function restoreFeedbackState(
  documentId: string,
  feedbackId: string,
  data: FeedbackStatusData
) {
  if (['ACCEPTED', 'REJECTED', 'FAILED'].includes(data.status)) {
    return;
  }

  const store = useFeedbackStore.getState();

  switch (data.status) {
    case 'PENDING':
      store.setPending(documentId, feedbackId);
      break;
    case 'QUESTIONING':
      store.setPending(documentId, feedbackId);
      if (data.questions) store.setQuestioning(data.questions);
      break;
    case 'ANSWERING':
      store.setPending(documentId, feedbackId);
      store.setAnswering();
      break;
    case 'DONE':
      store.setDone(feedbackId, data.revisedMarkdown ?? '');
      break;
  }
}

// ── 폴링 상태 (모듈 레벨 — 동시에 하나만 실행) ───────────────────

let _pollingIntervalId: ReturnType<typeof setInterval> | null = null;
let _pollingStartTime: number | null = null;

const POLL_INTERVAL_MS = 4_000;
const MAX_POLL_DURATION_MS = 3 * 60 * 1_000;

// ── API 함수 (모듈 레벨 — 안정적 참조 보장) ───────────────────────

async function getFeedbackStatusRaw(feedbackId: string) {
  const res = await apiClient.get(`/api/feedbacks/${feedbackId}`);
  return res.data;
}

export function stopPolling() {
  if (_pollingIntervalId !== null) {
    clearInterval(_pollingIntervalId);
    _pollingIntervalId = null;
  }
  _pollingStartTime = null;
}

export function startPolling(feedbackId: string, documentId: string) {
  stopPolling();
  _pollingStartTime = Date.now();

  _pollingIntervalId = setInterval(async () => {
    if (_pollingStartTime !== null && Date.now() - _pollingStartTime > MAX_POLL_DURATION_MS) {
      stopPolling();
      return;
    }

    try {
      const result = await getFeedbackStatusRaw(feedbackId);
      const data: FeedbackStatusData = result.data;
      const currentStatus = useFeedbackStore.getState().status;

      if (currentStatus !== data.status) {
        restoreFeedbackState(documentId, feedbackId, data);
      }

      if (['ACCEPTED', 'REJECTED', 'FAILED', 'DONE'].includes(data.status)) {
        stopPolling();
      }
    } catch {
      // 일시적 네트워크 오류는 무시하고 다음 인터벌에 재시도
    }
  }, POLL_INTERVAL_MS);
}

// ── Hook ──────────────────────────────────────────────────────

export default function useFeedback() {
  const requestFeedback = async (
    documentId: string,
    prompt: string | null,
    closeModal: () => void
  ) => {
    try {
      closeModal();
      await apiClient.post(`/api/documents/${documentId}/feedback`, {
        additionalRequest: prompt,
      });
      // feedbackId는 WebSocket feedback:started 이벤트로 수신
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        // 이미 진행 중인 피드백 있음 — doc:init에서 이미 상태 복원됨
      } else {
        console.error(error);
      }
    }
  };

  const acceptFeedback = async (feedbackId: string) => {
    await apiClient.post(`/api/feedbacks/${feedbackId}/accept`);
  };

  const rejectFeedback = async (feedbackId: string) => {
    await apiClient.post(`/api/feedbacks/${feedbackId}/reject`);
  };

  const submitAnswers = async (feedbackId: string, answers: Answer[]) => {
    await apiClient.post(`/api/feedbacks/${feedbackId}/answers`, { answer: answers });
  };

  const getFeedbackStatus = getFeedbackStatusRaw;

  return {
    requestFeedback,
    acceptFeedback,
    rejectFeedback,
    submitAnswers,
    getFeedbackStatus,
    startPolling,
    stopPolling,
    restoreFeedbackState,
  };
}
