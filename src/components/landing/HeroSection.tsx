import Button from '@/components/ui/Button';
import AppMockup from '@/components/landing/AppMockup';
import { useAuth } from '@/shared/useAuth';

export default function HeroSection() {
  const { login } = useAuth();

  return (
    <section className="flex flex-col items-center px-6 pb-20 pt-32 text-center">
      {/* Headline */}
      <h1 className="mb-5 text-5xl font-bold leading-tight text-ink">
        <span className="whitespace-nowrap">빈 페이지에서 완벽한 기획서까지,</span>
        <br />
        <span className="text-primary">AI와 팀이 함께</span>
      </h1>

      {/* Description */}
      <p className="mb-8 max-w-xl leading-relaxed text-ink-muted" style={{ fontSize: '1rem' }}>
        AI가 기획 문서 초안을 자동으로 작성하고, 팀원들과 실시간으로 협업하며,
        <br />
        완성된 기획을 바로 GitHub 이슈로 연결합니다.
      </p>

      {/* CTAs */}
      <div className="mb-16 flex items-center gap-3">
        <Button size="lg" onClick={login}>
          무료로 시작하기
        </Button>
      </div>

      {/* Product mockup */}
      <AppMockup />
    </section>
  );
}
