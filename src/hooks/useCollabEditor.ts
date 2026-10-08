import { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import {
  encodeAwarenessUpdate,
  applyAwarenessUpdate,
  removeAwarenessStates,
} from 'y-protocols/awareness';
import { useCreateBlockNote } from '@blocknote/react';
import { ko } from '@blocknote/core/locales';
import { YCursorExtension } from '@blocknote/core';
import { handleSocketError } from '@/shared/socketErrorHandler';
import { base64ToUint8Array, uint8ArrayToBase64 } from '@/shared/base64';
import {
  applyRemoteQaUpdate,
  bindQaSender,
  destroyQaDoc,
  encodeQaState,
  hasQaDoc,
} from '@/shared/qaDocRegistry';
import type { DocumentServerMessage, QaUpdateRequest } from '@/types/socket';
import { useFeedbackStore } from '@/store/FeedbackStore';
import { restoreFeedbackState } from '@/hooks/useFeedback';
import { useTeamspaceStore } from '@/store/teamspaceStore';

interface UseCollabEditorOptions {
  docId: string;
  user: { name: string; color: string };
  token: string;
  editable: boolean;
}

export function useCollabEditor({ docId, user, token, editable }: UseCollabEditorOptions) {
  // lazy initializer로 마운트 시 1회만 생성 → 탭마다 고유한 doc.clientID 보장.
  // doc/provider는 렌더 시점에 useCreateBlockNote에 전달되므로 useState가 적합하다.
  // (useRef.current는 React 컴파일러가 렌더 중 접근을 금지함)
  const [{ doc, provider }] = useState(() => {
    const doc = new Y.Doc();
    // connect: false - 실제 WS 연결 없음. BlockNote collaboration 타입 요구사항을 위한 더미.
    return {
      doc,
      provider: new WebsocketProvider(import.meta.env.VITE_WS_BASE_URL as string, docId, doc, {
        connect: false,
      }),
    };
  });

  const [connected, setConnected] = useState(false);
  const initializedRef = useRef(false);
  const applyMarkdownRef = useRef<((md: string) => Promise<void>) | null>(null);
  const pendingDraftRef = useRef<string | null>(null);
  const { setYdoc } = useFeedbackStore();
  const restoreDraftQA = useTeamspaceStore((state) => state.restoreDraftQA);

  useEffect(() => {
    if (doc) {
      setYdoc(doc);
    }
  }, [doc, setYdoc]);

  useEffect(() => {
    const ws = new WebSocket(`${import.meta.env.VITE_WS_BASE_URL}/ws/documents/${docId}`);
    let unbindQaSender: (() => void) | null = null;

    const sendQaUpdate = (qaId: string, update: Uint8Array) => {
      if (ws.readyState !== WebSocket.OPEN) return;
      const message: QaUpdateRequest = {
        type: 'qa:update',
        qaId,
        update: uint8ArrayToBase64(update),
      };
      ws.send(JSON.stringify(message));
    };

    ws.onopen = () => setConnected(true);
    ws.onclose = () => {
      setConnected(false);
      initializedRef.current = false;
    };

    ws.onmessage = (event: MessageEvent<string>) => {
      const msg = JSON.parse(event.data) as DocumentServerMessage;

      // DocumentSocketErrorEvent는 event 필드 사용
      if ('event' in msg) {
        handleSocketError({ code: msg.code, message: msg.message });
        return;
      }

      if (msg.type === 'doc:init') {
        for (const b64 of msg.updates) {
          Y.applyUpdate(doc, base64ToUint8Array(b64), 'remote');
        }
        provider.emit('sync', [true]);
        initializedRef.current = true;

        // 답변 Y.Doc 송신은 서버 상태를 받은 뒤부터 이 소켓으로 보낸다
        unbindQaSender?.();
        unbindQaSender = bindQaSender(sendQaUpdate);
        if (msg.activeQa) {
          const { qaId, updates } = msg.activeQa;
          // 이미 로컬에 답변 Y.Doc이 있었다면 재연결 — 끊긴 동안의 로컬 입력을 전체 상태로 한 번 재전송한다
          const isReconnect = hasQaDoc(qaId);
          for (const b64 of updates) {
            applyRemoteQaUpdate(qaId, b64);
          }
          const localState = isReconnect ? encodeQaState(qaId) : null;
          if (localState) sendQaUpdate(qaId, localState);
        }
        if (msg.activeFeedback) {
          restoreFeedbackState(docId, msg.activeFeedback.feedbackId, msg.activeFeedback);
        }
        if (
          editable &&
          msg.updates.length === 0 &&
          msg.activeDraft?.status === 'DONE' &&
          msg.activeDraft?.content
        ) {
          const draftContent = msg.activeDraft.content;
          if (applyMarkdownRef.current) {
            applyMarkdownRef.current(draftContent);
          } else {
            pendingDraftRef.current = draftContent;
          }
        }
        if (msg.activeDraft?.status === 'QUESTIONING' || msg.activeDraft?.status === 'ANSWERING') {
          restoreDraftQA(
            docId,
            msg.activeDraft.draftId,
            msg.activeDraft.status,
            msg.activeDraft.questions
          );
        }
        return;
      }

      if (msg.type === 'doc:update') {
        if (!initializedRef.current) return;
        Y.applyUpdate(doc, base64ToUint8Array(msg.update), 'remote');
        return;
      }

      if (msg.type === 'qa:update') {
        applyRemoteQaUpdate(msg.qaId, msg.update);
        return;
      }

      if (msg.type === 'doc:awareness') {
        applyAwarenessUpdate(provider.awareness, base64ToUint8Array(msg.update), 'remote');
        return;
      }

      if (msg.type === 'doc:awareness:init') {
        for (const state of msg.states) {
          applyAwarenessUpdate(provider.awareness, base64ToUint8Array(state), 'remote');
        }
        return;
      }

      if (msg.type === 'doc:awareness:remove') {
        removeAwarenessStates(provider.awareness, [msg.yjsClientId], null);
        return;
      }

      const feedbackStore = useFeedbackStore.getState();

      if (msg.type === 'feedback:started') {
        feedbackStore.setPending(docId, msg.feedbackId);
        return;
      }

      if (msg.type === 'feedback:questioning') {
        feedbackStore.setQuestioning(msg.questions);
        return;
      }

      if (msg.type === 'feedback:answering') {
        feedbackStore.setAnswering(msg.feedbackId);
        destroyQaDoc(msg.feedbackId);
        return;
      }

      if (msg.type === 'feedback:ready') {
        destroyQaDoc(msg.feedbackId);
        feedbackStore.setDone(msg.feedbackId, msg.revisedMarkdown);
        return;
      }

      if (msg.type === 'feedback:resolved') {
        if (msg.outcome === 'ACCEPTED') {
          const { revisedMarkdown, acceptingFeedbackId } = useFeedbackStore.getState();
          feedbackStore.setAccepting(null);
          // 문서 교체는 '이 버전 선택'을 누른 클라이언트만 수행한다.
          // 모든 클라이언트가 각자 replaceBlocks를 하면 Yjs 병합으로 내용이 중복·뒤섞이므로,
          // 나머지 클라이언트는 수락자의 doc:update로 결과를 받는다.
          const isAccepter = acceptingFeedbackId === msg.feedbackId;
          if (isAccepter && revisedMarkdown && applyMarkdownRef.current) {
            applyMarkdownRef.current(revisedMarkdown).then(() => {
              feedbackStore.acceptFeedback();
            });
          } else {
            feedbackStore.acceptFeedback();
          }
        } else {
          feedbackStore.setRejected();
        }
        return;
      }

      if (msg.type === 'feedback:error') {
        destroyQaDoc(msg.feedbackId);
        handleSocketError({
          code: 'AI_FEEDBACK_FAILED',
          message: 'AI 피드백 처리 중 오류가 발생했습니다.',
        });
        feedbackStore.setFailed();
      }
    };

    const handleUpdate = (update: Uint8Array, origin: unknown) => {
      if (origin === 'remote') return;
      if (!initializedRef.current) return;
      if (ws.readyState !== WebSocket.OPEN) return;
      ws.send(
        JSON.stringify({
          type: 'doc:update',
          update: uint8ArrayToBase64(update),
        })
      );
    };
    doc.on('update', handleUpdate);

    const handleAwarenessUpdate = (
      { added, updated, removed }: { added: number[]; updated: number[]; removed: number[] },
      origin: unknown
    ) => {
      if (origin === 'remote') return;
      if (ws.readyState !== WebSocket.OPEN) return;
      const changedClients = [...added, ...updated, ...removed];
      const update = encodeAwarenessUpdate(provider.awareness, changedClients);
      ws.send(
        JSON.stringify({
          type: 'doc:awareness',
          yjsClientId: doc.clientID,
          update: uint8ArrayToBase64(update),
        })
      );
    };
    provider.awareness.on('update', handleAwarenessUpdate);

    return () => {
      unbindQaSender?.();
      provider.awareness.off('update', handleAwarenessUpdate);
      doc.off('update', handleUpdate);
      ws.close(1000);
    };
  }, [docId, token, doc, provider, editable, restoreDraftQA]);

  const editor = useCreateBlockNote({
    collaboration: {
      provider,
      fragment: doc.getXmlFragment('document-store'),
      user: { name: user.name, color: user.color },
      showCursorLabels: 'activity',
    },
    dictionary: ko,
    editable,
  });

  // user 정보는 비동기로 로드되므로, 최초 editor 생성 시점엔 '익명'일 수 있다.
  // 이후 user가 갱신되면 awareness의 cursor 표시 이름/색상도 함께 갱신한다.
  useEffect(() => {
    editor.getExtension(YCursorExtension)?.updateUser({ name: user.name, color: user.color });
  }, [editor, user.name, user.color]);

  useEffect(() => {
    applyMarkdownRef.current = (md: string) => {
      const blocks = editor.tryParseMarkdownToBlocks(md);
      editor.replaceBlocks(editor.document, blocks);
      return Promise.resolve();
    };
    if (pendingDraftRef.current) {
      const draft = pendingDraftRef.current;
      pendingDraftRef.current = null;
      applyMarkdownRef.current(draft);
    }
  }, [editor]);

  return { editor, doc, provider, connected };
}
