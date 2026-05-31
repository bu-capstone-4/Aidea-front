import { useState } from 'react';
import { MdClose, MdArrowBack } from 'react-icons/md';
import Toggle from '@/components/ui/Toggle';
import { saveBacklogConfig } from '@/api/backlog';
import { useBacklogStore } from '@/store/backlogStore';
import type { BacklogConfigResponse } from '@/types/backlog';

interface ConfigSettings {
  feBeEnabled: boolean;
  epicEnabled: boolean;
  storyEnabled: boolean;
  priorityEnabled: boolean;
  sprintEnabled: boolean;
  dueDateEnabled: boolean;
}

interface ConfigModalProps {
  initialConfig?: BacklogConfigResponse;
  teamspaceId: string;
  onClose: () => void;
  onBack?: () => void;
}

export default function ConfigModal({
  initialConfig,
  teamspaceId,
  onClose,
  onBack,
}: ConfigModalProps) {
  const applyConfigUpdated = useBacklogStore((s) => s.applyConfigUpdated);
  const [settings, setSettings] = useState<ConfigSettings>({
    feBeEnabled: initialConfig?.feBeEnabled ?? false,
    epicEnabled: initialConfig?.epicEnabled ?? false,
    storyEnabled: initialConfig?.storyEnabled ?? false,
    priorityEnabled: initialConfig?.priorityEnabled ?? false,
    sprintEnabled: initialConfig?.sprintEnabled ?? false,
    dueDateEnabled: initialConfig?.dueDateEnabled ?? false,
  });

  const toggle = async (key: keyof ConfigSettings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    try {
      const config = await saveBacklogConfig(teamspaceId, newSettings);
      applyConfigUpdated(config);
    } catch {
      setSettings(settings);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-[520px] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-8 pt-8 pb-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="text-ink-muted hover:text-ink transition-colors"
                aria-label="뒤로"
              >
                <MdArrowBack size={20} />
              </button>
            )}
            <div>
              <h2 className="font-bold text-lg text-ink">백로그 설정</h2>
              <p className="text-ink-muted text-sm">팀에 맞는 백로그 구성을 선택해주세요.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-ink-muted hover:text-ink transition-colors"
            aria-label="닫기"
          >
            <MdClose size={20} />
          </button>
        </div>

        <div className="px-8 pb-8 flex flex-col gap-6">
          {/* 팀 구성 섹션 */}
          <section>
            <SectionLabel>팀 구성</SectionLabel>
            <SettingRow
              label="프론트엔드 / 백엔드 구분"
              description="FE-001, BE-001 형식으로 이슈 ID를 분류합니다"
            >
              <Toggle checked={settings.feBeEnabled} onChange={() => toggle('feBeEnabled')} />
            </SettingRow>
          </section>

          {/* 이슈 유형 섹션 */}
          <section>
            <SectionLabel>이슈 유형</SectionLabel>
            <div className="flex flex-col gap-1">
              <CheckRow label="태스크" description="개별 작업 단위입니다" badge="기본" disabled />
              <CheckRow
                label="에픽"
                description="여러 스토리/태스크를 묶는 큰 단위입니다"
                checked={settings.epicEnabled}
                onChange={() => toggle('epicEnabled')}
              />
              <CheckRow
                label="스토리"
                description="사용자 관점의 기능 단위입니다"
                checked={settings.storyEnabled}
                onChange={() => toggle('storyEnabled')}
              />
            </div>
          </section>

          {/* 추가 필드 섹션 */}
          <section>
            <SectionLabel>추가 필드</SectionLabel>
            <div className="flex flex-col gap-1">
              <SettingRow label="우선순위" description="높음 / 낮음으로 이슈 중요도를 설정합니다">
                <Toggle
                  checked={settings.priorityEnabled}
                  onChange={() => toggle('priorityEnabled')}
                />
              </SettingRow>
              <SettingRow label="스프린트" description="이슈를 스프린트 단위로 묶어 관리합니다">
                <Toggle checked={settings.sprintEnabled} onChange={() => toggle('sprintEnabled')} />
              </SettingRow>
              <SettingRow label="마감일" description="각 이슈에 마감일을 설정합니다">
                <Toggle
                  checked={settings.dueDateEnabled}
                  onChange={() => toggle('dueDateEnabled')}
                />
              </SettingRow>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">{children}</p>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="text-xs text-ink-muted">{description}</p>
      </div>
      {children}
    </div>
  );
}

function CheckRow({
  label,
  description,
  badge,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  badge?: string;
  checked?: boolean;
  onChange?: () => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={`flex items-start gap-3 py-2 ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
    >
      <input
        type="checkbox"
        checked={disabled ? true : (checked ?? false)}
        onChange={disabled ? undefined : onChange}
        disabled={disabled}
        className="mt-0.5 accent-primary"
      />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-ink">{label}</span>
          {badge && (
            <span className="border border-border rounded-sm px-2 py-0.5 text-xs text-ink-muted">
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-ink-muted">{description}</p>
      </div>
    </label>
  );
}
