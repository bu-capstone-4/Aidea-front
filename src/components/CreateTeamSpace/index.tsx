import { useState } from 'react';
import { useNavigate } from 'react-router';
import { DOC_OPTIONS, type TeamSpaceForm } from './types';
import Step1 from './Step1';
import Step2 from './Step2';
import { apiClient } from '@/shared/apiClient';

const initialForm: TeamSpaceForm = {
  teamName: '',
  idea: '',
  selectedDocs: DOC_OPTIONS.map((doc) => doc.value),
  emails: [
    { id: crypto.randomUUID(), value: '', error: null },
    { id: crypto.randomUUID(), value: '', error: null },
    { id: crypto.randomUUID(), value: '', error: null },
    { id: crypto.randomUUID(), value: '', error: null },
  ],
};

interface CreateTeamSpaceProps {
  onClose?: () => void;
}

export default function CreateTeamSpace({ onClose }: CreateTeamSpaceProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<TeamSpaceForm>(initialForm);
  const [teamspaceId, setTeamspaceId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const navigate = useNavigate();

  const updateForm = (patch: Partial<TeamSpaceForm>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const handleCreateTeamspace = async () => {
    if (!form.teamName.trim()) {
      setErrorMessage('팀 스페이스 이름을 입력해주세요.');
      return;
    }

    if (!form.idea.trim()) {
      setErrorMessage('아이디어를 입력해주세요.');
      return;
    }

    if (form.selectedDocs.length === 0) {
      setErrorMessage('생성할 문서를 선택해주세요.');
      return;
    }

    try {
      setErrorMessage(null);

      const response = await apiClient.post('/api/teamspaces', {
        name: form.teamName.trim(),
        idea: form.idea.trim(),
      });

      setTeamspaceId(response.data.data.teamspaceId);
      setStep(2);
    } catch {
      // 서버 에러는 apiClient 인터셉터가 toast로 처리
    }
  };

  const handleCompleteSetup = async () => {
    if (!teamspaceId) {
      setErrorMessage('팀 스페이스 정보가 없습니다.');
      return;
    }

    const hasEmailError = form.emails.some((email) => email.error);

    if (hasEmailError) {
      setErrorMessage('올바르지 않은 이메일이 포함되어 있습니다.');
      return;
    }

    const emails = Array.from(
      new Set(form.emails.map((email) => email.value.trim().toLowerCase()).filter(Boolean))
    );

    try {
      setErrorMessage(null);

      await Promise.all(
        form.selectedDocs.map((type) => apiClient.post('/api/documents', { teamspaceId, type }))
      );

      if (emails.length > 0) {
        await apiClient.post(`/api/teamspaces/${teamspaceId}/invitations`, { emails });
      }

      const detailResponse = await apiClient.get(`/api/teamspaces/${teamspaceId}`);
      const firstDocId = detailResponse.data.data.documents?.[0]?.id;

      if (firstDocId) {
        navigate(`/main/${firstDocId}`);
      } else {
        navigate('/');
      }

      onClose?.();
    } catch {
      // 서버 에러는 apiClient 인터셉터가 toast로 처리
    }
  };

  return (
    <div className="fixed inset-0 bg-black/35 flex items-center justify-center z-50">
      <div className="relative bg-white rounded-2xl border border-gray-200 w-full max-w-[600px] mx-4 p-10">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-5 rounded-md px-2 py-1 text-xl leading-none text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="팀스페이스 생성 닫기"
          >
            ×
          </button>
        )}

        {step === 1 && <Step1 form={form} onChange={updateForm} onNext={handleCreateTeamspace} />}

        {step === 2 && <Step2 form={form} onChange={updateForm} onSubmit={handleCompleteSetup} />}

        {errorMessage && <p className="mt-3 text-sm text-red-500">{errorMessage}</p>}
      </div>
    </div>
  );
}
