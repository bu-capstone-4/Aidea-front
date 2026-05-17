import { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { useCreateBlockNote } from '@blocknote/react';
import { ko } from '@blocknote/core/locales';
import { handleSocketError } from '@/shared/socketErrorHandler';
import type { DocumentServerMessage } from '@/types/socket';
import { useFeedbackStore } from '@/store/FeedbackStore';

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

      // Yjs 동기화 이벤트: type 필드 사용
      if ('type' in msg) {
        if (msg.type === 'doc:init') {
          for (const b64 of msg.updates) {
            Y.applyUpdate(doc, base64ToUint8Array(b64), 'remote');
          }
          initializedRef.current = true;
          return;
        }
        if (msg.type === 'doc:update') {
          if (!initializedRef.current) return;
          Y.applyUpdate(doc, base64ToUint8Array(msg.update), 'remote');
        }
        return;
      }

      // 비즈니스 이벤트: event 필드 사용
      if (msg.event === 'error') {
        handleSocketError({ code: msg.code, message: msg.message });
        return;
      }

      const feedbackStore = useFeedbackStore.getState();

      if (msg.event === 'feedback:start') {
        feedbackStore.setPending(docId, msg.data.feedbackId);
        return;
      }

      if (msg.event === 'feedback:ready') {
        feedbackStore.setDone(msg.data.feedbackId, base64ToUint8Array(msg.data.yjsBinary));
        return;
      }

      if (msg.event === 'feedback:version-applied') {
        const newDoc = new Y.Doc();
        Y.applyUpdate(newDoc, base64ToUint8Array(msg.data.yjsBinary), 'remote');
        Y.applyUpdate(doc, Y.encodeStateAsUpdate(newDoc), 'remote');
        newDoc.destroy();
        feedbackStore.acceptFeedback();
        return;
      }

      if (msg.event === 'feedback:error') {
        handleSocketError({ code: msg.data.code, message: msg.data.message });
        feedbackStore.resetFeedback();
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

  return { editor, doc, provider, connected };
}
