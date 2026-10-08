import type * as Y from 'yjs';
import { useYTextInput } from '@/hooks/useYTextInput';

interface YTextFieldProps {
  ytext: Y.Text;
  multiline: boolean;
  readOnly: boolean;
  placeholder: string;
  className: string;
  autoFocus?: boolean;
}

// 질문 답변 텍스트 입력 — Y.Text와 바인딩되어 팀원과 실시간으로 함께 편집된다
export default function YTextField({
  ytext,
  multiline,
  readOnly,
  placeholder,
  className,
  autoFocus,
}: YTextFieldProps) {
  const { value, onChange, onCompositionStart, onCompositionEnd, ref } = useYTextInput(ytext, {
    readOnly,
  });

  const fieldProps = {
    ref,
    value,
    onChange,
    onCompositionStart,
    onCompositionEnd,
    readOnly,
    placeholder,
    className,
    autoFocus,
  };

  return multiline ? <textarea rows={3} {...fieldProps} /> : <input type="text" {...fieldProps} />;
}
