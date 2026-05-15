import { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { useCreateBlockNote } from '@blocknote/react';
import { ko } from '@blocknote/core/locales';
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
      const msg = JSON.parse(event.data) as {
        type: string;
        updates?: string[];
        update?: string;
        event: string;
        data: { yjsBinary: string };
      };

      if (msg.type === 'doc:init') {
        for (const b64 of msg.updates ?? []) {
          Y.applyUpdate(doc, base64ToUint8Array(b64), 'remote');
        }
        initializedRef.current = true;
        return;
      }

      if (msg.type === 'doc:update' && msg.update) {
        if (!initializedRef.current) return;
        Y.applyUpdate(doc, base64ToUint8Array(msg.update), 'remote');
      }

      if (msg.event === 'feedback:version-applied') {
        const { yjsBinary } = msg.data;
        Y.applyUpdate(doc, base64ToUint8Array(yjsBinary), 'remote');
        useFeedbackStore.getState().acceptFeedback();
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
