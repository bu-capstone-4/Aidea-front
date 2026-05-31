import { MdClose, MdList } from 'react-icons/md';
import { FEATURE_BADGES } from '@/constants/backlog';

interface WelcomeScreenProps {
  onStart: () => void;
  onClose: () => void;
}

export default function WelcomeScreen({ onStart, onClose }: WelcomeScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl p-10 flex flex-col items-center gap-6 w-[480px]">
        <div className="w-full flex justify-end">
          <button
            onClick={onClose}
            className="text-ink-muted hover:text-ink transition-colors"
            aria-label="닫기"
          >
            <MdClose size={20} />
          </button>
        </div>

        <div className="w-20 h-20 rounded-full bg-primary-light flex items-center justify-center">
          <MdList size={36} className="text-primary" />
        </div>

        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="font-bold text-xl text-ink">백로그로 팀 할 일을 한눈에</h2>
          <p className="text-ink-muted text-sm leading-relaxed">
            팀원별 담당 이슈를 배정하고 진행 상황을
            <br />
            실시간으로 함께 관리해보세요.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {FEATURE_BADGES.map((label) => (
            <span
              key={label}
              className="border border-border rounded-sm px-3 py-1 text-xs text-ink-muted"
            >
              {label}
            </span>
          ))}
        </div>

        <button
          onClick={onStart}
          className="w-full h-10 rounded-md bg-primary text-white font-semibold text-base hover:bg-primary-dark transition-colors"
        >
          시작하기
        </button>
      </div>
    </div>
  );
}
