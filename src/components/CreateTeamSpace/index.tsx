import { useState } from 'react';
import { DOC_OPTIONS, type TeamSpaceForm } from './types';
import Step1 from './Step1';
import Step2 from './Step2';

const initialForm: TeamSpaceForm = {
  teamName: '',
  idea: '',
  selectedDocs: [...DOC_OPTIONS],
  emails: [
    { id: crypto.randomUUID(), value: '' },
    { id: crypto.randomUUID(), value: '' },
    { id: crypto.randomUUID(), value: '' },
    { id: crypto.randomUUID(), value: '' },
  ],
};

export default function CreateTeamSpace() {
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<TeamSpaceForm>(initialForm);

  const updateForm = (patch: Partial<TeamSpaceForm>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const handleSubmit = () => {
    console.log('제출:', form);
    // TODO: API 호출
  };

  return (
    <div className="fixed inset-0 bg-black/35 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-[600px] mx-4 p-10">
        {step === 1 && <Step1 form={form} onChange={updateForm} onNext={() => setStep(2)} />}
        {step === 2 && (
          <Step2
            form={form}
            onChange={updateForm}
            onBack={() => setStep(1)}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </div>
  );
}
