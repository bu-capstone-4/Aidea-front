import { useLayoutEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import * as Y from 'yjs';
import { diffText, transformIndex } from '@/shared/textDiff';
import type { TextChange, TextDeltaOp } from '@/shared/textDiff';

type TextElement = HTMLInputElement | HTMLTextAreaElement;

interface CompositionState {
  baseText: string;
  baseStart: number;
  start: Y.RelativePosition;
}

function applyChange(ytext: Y.Text, change: TextChange, index: number) {
  const deleteCount = Math.min(change.deleteCount, ytext.length - index);
  if (deleteCount <= 0 && change.insert === '') return;
  const run = () => {
    if (deleteCount > 0) ytext.delete(index, deleteCount);
    if (change.insert) ytext.insert(index, change.insert);
  };
  if (ytext.doc) ytext.doc.transact(run);
  else run();
}

// Y.Text 내용을 DOM에 즉시 반영한다 — React 재렌더를 기다리지 않아야 다음 로컬 입력의 diff 기준이 Y.Text와 어긋나지 않는다.
// delta가 있으면 포커스된 필드의 selection을 원격 변경에 맞춰 변환한다.
function syncElementFromYText(ytext: Y.Text, el: TextElement | null, delta: TextDeltaOp[] | null) {
  const text = ytext.toString();
  if (!el) return text;
  const focused = document.activeElement === el;
  const selectionStart = el.selectionStart ?? 0;
  const selectionEnd = el.selectionEnd ?? 0;
  el.value = text;
  if (focused && delta) {
    const start = Math.min(transformIndex(selectionStart, delta), text.length);
    const end = Math.min(transformIndex(selectionEnd, delta), text.length);
    el.setSelectionRange(start, end);
  }
  return text;
}

// textarea/input ↔ Y.Text 바인딩.
// - 로컬 입력: 직전 Y.Text 내용과 새 값의 diff만 Y.Text에 반영
// - 원격 변경: DOM 값을 즉시 동기화하고 delta로 커서(selection)를 변환
// - 한글 IME 조합 중에는 Y.Text에 쓰지 않고 원격 변경 반영도 보류 → 조합 종료 시 한 번에 반영
export function useYTextInput(ytext: Y.Text, { readOnly }: { readOnly: boolean }) {
  const [value, setValue] = useState(() => ytext.toString());
  const elementRef = useRef<TextElement | null>(null);
  const compositionRef = useRef<CompositionState | null>(null);
  const pendingRemoteRef = useRef(false);

  useLayoutEffect(() => {
    const handleChange = (event: Y.YTextEvent, transaction: Y.Transaction) => {
      if (transaction.local) return;
      if (compositionRef.current) {
        pendingRemoteRef.current = true;
        return;
      }
      setValue(syncElementFromYText(ytext, elementRef.current, event.delta as TextDeltaOp[]));
    };
    ytext.observe(handleChange);
    return () => ytext.unobserve(handleChange);
  }, [ytext]);

  const onChange = (e: ChangeEvent<TextElement>) => {
    if (readOnly) return;
    const next = e.target.value;
    setValue(next);
    if (compositionRef.current) return;
    const change = diffText(ytext.toString(), next);
    applyChange(ytext, change, change.index);
  };

  const onCompositionStart = () => {
    if (readOnly) return;
    const el = elementRef.current;
    const baseStart = el?.selectionStart ?? ytext.length;
    compositionRef.current = {
      baseText: el?.value ?? ytext.toString(),
      baseStart,
      start: Y.createRelativePositionFromTypeIndex(ytext, baseStart),
    };
  };

  const onCompositionEnd = () => {
    const composition = compositionRef.current;
    compositionRef.current = null;
    const el = elementRef.current;
    if (!composition || !el || readOnly) return;

    const change = diffText(composition.baseText, el.value);
    // 조합 중 원격 변경으로 위치가 밀렸을 수 있으므로 조합 시작 위치(상대 위치) 기준으로 index를 다시 계산한다
    const absoluteStart = ytext.doc
      ? Y.createAbsolutePositionFromRelativePosition(composition.start, ytext.doc)
      : null;
    const shift = (absoluteStart?.index ?? composition.baseStart) - composition.baseStart;
    const index = Math.min(Math.max(0, change.index + shift), ytext.length);
    applyChange(ytext, change, index);

    if (pendingRemoteRef.current) {
      pendingRemoteRef.current = false;
      setValue(syncElementFromYText(ytext, el, null));
      const caret = Math.min(index + change.insert.length, el.value.length);
      el.setSelectionRange(caret, caret);
    }
  };

  const ref = (el: TextElement | null) => {
    elementRef.current = el;
  };

  return { value, onChange, onCompositionStart, onCompositionEnd, ref };
}
