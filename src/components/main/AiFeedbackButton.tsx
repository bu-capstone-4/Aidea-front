import { MdAutoAwesome } from 'react-icons/md';
import { cn } from '@/shared/cn';

type AiFeedbackButtonVariant = 'inline' | 'floating';

interface AiFeedbackButtonProps {
  variant: AiFeedbackButtonVariant;
  onClick: () => void;
}

const variantClass: Record<AiFeedbackButtonVariant, string> = {
  // 데스크톱: 제목 옆 pill
  inline: 'shrink-0 gap-1.5 px-3.5 py-1.5 text-sm max-md:hidden',
  // 모바일: 우하단 플로팅 (사이드바 백드롭 z-30보다 아래, iOS 하단 safe area 보정)
  floating:
    'fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-20 min-h-11 gap-2 px-4 py-2.5 text-base shadow-lg md:hidden',
};

export default function AiFeedbackButton({ variant, onClick }: AiFeedbackButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group flex items-center rounded-full border border-ai/15 bg-ai-bg font-semibold text-ai transition-colors hover:bg-ai hover:text-white',
        variantClass[variant]
      )}
    >
      <MdAutoAwesome
        size={variant === 'floating' ? 18 : 15}
        className="transition-transform duration-300 group-hover:rotate-45"
      />
      AI 피드백
    </button>
  );
}
