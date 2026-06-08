import { create } from 'zustand';
import type { BlockNoteEditor } from '@blocknote/core';

interface DocumentEditorState {
  editor: BlockNoteEditor | null;
  setEditor: (editor: BlockNoteEditor | null) => void;
}

export const useDocumentEditorStore = create<DocumentEditorState>()((set) => ({
  editor: null,
  setEditor: (editor) => set({ editor }),
}));
