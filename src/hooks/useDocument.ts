import { useState, useEffect } from 'react';
import { apiClient } from '@/shared/apiClient';
import type { DocumentDetail } from '@/mocks/types';

export function useDocument(documentId: string | undefined) {
  const [doc, setDoc] = useState<DocumentDetail | null>(null);

  useEffect(() => {
    if (!documentId) return;
    apiClient
      .get(`/api/documents/${documentId}`)
      .then((res) => setDoc(res.data.data))
      .catch(() => setDoc(null));
  }, [documentId]);

  return { doc };
}
