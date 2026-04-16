import Button from '@/components/ui/Button';

export default function CTASection() {
  return (
    <section className="bg-ink px-6 py-24 text-center">
      <div className="mx-auto max-w-2xl">
        <h2 className="mb-4 text-4xl font-bold text-white">지금 바로 기획을 시작하세요</h2>
        <p className="mb-8 leading-relaxed text-white/60" style={{ fontSize: '1rem' }}>
          아이디어가 있다면 충분합니다. AI가 나머지를 함께 완성해드립니다.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button size="lg" className="bg-primary text-white hover:bg-primary-dark">
            무료로 시작하기
          </Button>
        </div>
      </div>
    </section>
  );
}
