import { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { useCreateBlockNote } from '@blocknote/react';
import { ko } from '@blocknote/core/locales';
import { handleSocketError } from '@/shared/socketErrorHandler';
import type { DocumentServerMessage } from '@/types/socket';
import { useFeedbackStore } from '@/store/FeedbackStore';
import { restoreFeedbackState } from '@/hooks/useFeedback';

function base64ToUint8Array(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

function uint8ArrayToBase64(arr: Uint8Array): string {
  return btoa(String.fromCharCode(...arr));
}

interface UseCollabEditorOptions {
  docId: string;
  user: { name: string; color: string };
  token: string;
  editable: boolean;
}

export function useCollabEditor({ docId, user, token, editable }: UseCollabEditorOptions) {
  const [{ doc, provider }] = useState(() => {
    const doc = new Y.Doc();
    // connect: false — 실제 WS 연결 없음. BlockNote collaboration 타입 요구사항을 위한 더미.
    const provider = new WebsocketProvider(import.meta.env.VITE_WS_BASE_URL as string, docId, doc, {
      connect: false,
    });
    return { doc, provider };
  });

  const [connected, setConnected] = useState(false);
  const initializedRef = useRef(false);
  const applyMarkdownRef = useRef<((md: string) => Promise<void>) | null>(null);
  const { setYdoc } = useFeedbackStore();

  useEffect(() => {
    if (doc) {
      setYdoc(doc);
    }
  }, [doc, setYdoc]);

  useEffect(() => {
    const ws = new WebSocket(`${import.meta.env.VITE_WS_BASE_URL}/ws/documents/${docId}`);

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
        initializedRef.current = true;
        if (msg.activeFeedback) {
          restoreFeedbackState(docId, msg.activeFeedback.feedbackId, msg.activeFeedback);
        }
        return;
      }

      if (msg.type === 'doc:update') {
        if (!initializedRef.current) return;
        Y.applyUpdate(doc, base64ToUint8Array(msg.update), 'remote');
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

      if (msg.type === 'feedback:ready') {
        feedbackStore.setDone(msg.feedbackId, msg.revisedMarkdown);
        return;
      }

      if (msg.type === 'feedback:resolved') {
        if (msg.outcome === 'ACCEPTED') {
          const { revisedMarkdown } = useFeedbackStore.getState();
          if (revisedMarkdown && applyMarkdownRef.current) {
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

    return () => {
      doc.off('update', handleUpdate);
      ws.close(1000);
    };
  }, [docId, token, doc]);

  const editor = useCreateBlockNote({
    collaboration: {
      provider,
      fragment: doc.getXmlFragment('document-store'),
      user: { name: user.name, color: user.color },
    },
    dictionary: ko,
    editable,
  });

  useEffect(() => {
    applyMarkdownRef.current = (md: string) => {
      const blocks = editor.tryParseMarkdownToBlocks(md);
      editor.replaceBlocks(editor.document, blocks);
      return Promise.resolve();
    };
  }, [editor]);

  return { editor, doc, provider, connected };
}
