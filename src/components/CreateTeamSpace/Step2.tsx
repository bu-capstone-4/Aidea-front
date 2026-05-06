import { type TeamSpaceForm } from './types';

interface Props {
  form: TeamSpaceForm;
  onChange: (patch: Partial<TeamSpaceForm>) => void;
  onBack: () => void;
  onSubmit: () => void;
}

export default function Step2({ form, onChange, onBack, onSubmit }: Props) {
  // 이메일 수정 (id 기반)
  const updateEmail = (id: string, value: string) => {
    const next = form.emails.map((email) =>
      email.id === id ? { ...email, value, error: validateEmail(value) } : email
    );
    onChange({ emails: next });
  };

  // 이메일 추가
  const addEmailField = () => {
    if (form.emails.length >= 8) return;

    onChange({
      emails: [...form.emails, { id: crypto.randomUUID(), value: '', error: null }],
    });
  };

  // 이메일 삭제
  const removeEmail = (id: string) => {
    onChange({
      emails: form.emails.filter((e) => e.id !== id),
    });
  };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function validateEmail(value: string) {
    if (!value.trim()) return null;
    return emailRegex.test(value.trim()) ? null : '올바른 이메일 형식이 아닙니다.';
  }

  return (
    <div className="flex flex-col min-h-[440px]">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-lg font-medium text-gray-900">팀 스페이스 생성</span>
        <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full">2 / 2</span>
      </div>

      <p className="text-base font-medium text-gray-900 mb-4">팀원 초대</p>

      {/* Email inputs */}
      <div className="flex flex-col gap-2.5 flex-1">
        {form.emails.map((email) => (
          <div
            key={email.id}
            className="flex items-center gap-3 px-4 py-2.5 border border-gray-200 rounded-lg focus-within:border-blue-400 transition-colors"
          >
            {/* 아이콘 */}
            <div className="w-5 h-5 rounded-full bg-gray-100 border border-gray-300 shrink-0" />

            {/* 입력 */}
            <input
              type="email"
              placeholder="name@company.com"
              value={email.value}
              onChange={(e) => updateEmail(email.id, e.target.value)}
              className="flex-1 text-sm text-gray-500 placeholder-gray-400 outline-none bg-transparent"
            />

            {email.error && <p className="mt-1 text-xs text-red-500">{email.error}</p>}

            {/* 삭제 버튼 */}
            <button
              type="button"
              onClick={() => removeEmail(email.id)}
              className="text-xs text-red-400 hover:text-red-500"
            >
              삭제
            </button>
          </div>
        ))}
      </div>

      {/* Add user */}
      <button
        type="button"
        onClick={addEmailField}
        className="text-sm text-blue-500 hover:underline text-left mt-3 w-fit"
      >
        + 사용자 추가
      </button>

      {/* Footer */}
      <div className="flex justify-between items-center mt-6">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-500 text-sm font-medium rounded-lg transition-colors"
        >
          ← 이전
        </button>

        <button
          type="button"
          onClick={onSubmit}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          완료 →
        </button>
      </div>
    </div>
  );
}
