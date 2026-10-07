import { useMemo, useSyncExternalStore } from 'react';
import type * as Y from 'yjs';
import { CUSTOM_CHOICE, getQaChoiceMap, getQaDoc, qaTextName } from '@/shared/qaDocRegistry';
import type { Answer, Question } from '@/types/document';

export interface QaAnswers {
  getChoice: (questionId: string) => string | undefined;
  setChoice: (questionId: string, value: string) => void;
  getText: (questionId: string) => Y.Text;
  buildAnswers: (questions: Question[]) => Answer[];
}

const EMPTY_CHOICES = '{}';

const noopSubscribe = () => () => {};

function hasOptions(question: Question): boolean {
  return Array.isArray(question.options) && question.options.length > 0;
}

// qaId의 답변 Y.Doc을 React에 연결한다. qaId가 null이면(질문 화면이 아님) Y.Doc을 만들지 않고 null을 반환한다.
// 선택지(choice 맵)만 구독한다 — 텍스트 입력은 각 필드가 useYTextInput으로 직접 구독한다.
export function useQaAnswers(qaId: string | null): QaAnswers | null {
  const doc = qaId ? getQaDoc(qaId) : null;
  const choiceMap = doc ? getQaChoiceMap(doc) : null;

  const subscribe = useMemo(() => {
    if (!choiceMap) return noopSubscribe;
    return (onStoreChange: () => void) => {
      choiceMap.observe(onStoreChange);
      return () => choiceMap.unobserve(onStoreChange);
    };
  }, [choiceMap]);

  // 문자열 스냅샷은 값 비교되므로 변경이 없으면 리렌더되지 않는다 (choice 맵은 질문 수만큼의 작은 맵)
  const choicesJson = useSyncExternalStore(subscribe, () =>
    choiceMap ? JSON.stringify(choiceMap.toJSON()) : EMPTY_CHOICES
  );

  return useMemo(() => {
    if (!doc || !choiceMap) return null;
    const choices = JSON.parse(choicesJson) as Record<string, string>;

    const getText = (questionId: string) => doc.getText(qaTextName(questionId));

    return {
      getChoice: (questionId) => choices[questionId],
      setChoice: (questionId, value) => {
        doc.transact(() => choiceMap.set(questionId, value));
      },
      getText,
      // 답하지 않은 질문은 항목에서 제외한다 (백엔드 value @NotBlank)
      buildAnswers: (questions) =>
        questions
          .map((q) => {
            const choice = choiceMap.get(q.id);
            const value =
              hasOptions(q) && choice !== CUSTOM_CHOICE ? (choice ?? '') : getText(q.id).toString();
            return { questionId: q.id, value };
          })
          .filter((answer) => answer.value.trim() !== ''),
    };
  }, [doc, choiceMap, choicesJson]);
}
